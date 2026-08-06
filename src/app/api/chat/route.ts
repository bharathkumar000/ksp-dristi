import { NextResponse } from 'next/server';
import { executeZCQL } from '@/lib/zcqlHelper';
import Groq from 'groq-sdk';

// Define multiple Groq API keys to support rate limit fallbacks
const groqApiKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_FALLBACK
].filter(Boolean) as string[];

const groqClients = groqApiKeys.map(key => new Groq({ apiKey: key }));

// Helper function to sequentially execute a request across the keys
async function runWithFallback<T>(fn: (client: Groq) => Promise<T>): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < groqClients.length; i++) {
    try {
      return await fn(groqClients[i]);
    } catch (err: any) {
      console.warn(`Groq API key #${i + 1} failed, trying fallback key...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All Groq API clients failed.");
}

// Exact ERD Schema Contract for the LLM
const SYSTEM_SCHEMA_PROMPT = `
You are the query translation engine for the Karnataka State Police (KSP) Intelligence Database.
Your job is to translate plain English/Kannada user prompts into structured database query parameters matching our exact ERD schema.

### DATABASE TABLES & COLUMNS AVAILABLE:
1. CaseMaster: CaseMasterID (PK), CrimeNo, CaseNo, CrimeRegistered_Date, PoliceStationID (FK), CrimeMajorHeadID (FK), CrimeMinorHeadID (FK), IncidentFromDate, latitude, longitude, BriefFacts.
2. ComplainantDetails: ComplainantID (PK), CaseMasterID (FK), ComplainantName, AgeYear, OccupationID (FK), ReligionID (FK), CasteID (FK), GenderID.
3. Victim: VictimMasterID (PK), CaseMasterID (FK), VictimName, AgeYear, GenderID.
4. Accused: AccusedMasterID (PK), CaseMasterID (FK), AccusedName, AgeYear, GenderID, PersonID.
5. ArrestSurrender: ArrestSurrenderID (PK), CaseMasterID (FK), ArrestSurrenderDate, IOID (FK), CourtID (FK), AccusedMasterID (FK).
6. Unit: UnitID (PK), UnitName (Police Station), DistrictID (FK).
7. District: DistrictID (PK), DistrictName.
8. CrimeHead: CrimeHeadID (PK), CrimeGroupName.
9. CrimeSubHead: CrimeSubHeadID (PK), CrimeHeadName.

### STRICT RULES:
1. DO NOT fabricate or invent FIR numbers, suspect names, or statistics not in the database.
2. Return ONLY a valid JSON object specifying database filter parameters.
3. If the user query cannot be answered by the schema, set "validQuery": false.

### REQUIRED JSON OUTPUT SCHEMA:
{
  "validQuery": boolean,
  "district": string | null,
  "policeStation": string | null,
  "crimeGroup": string | null,
  "startDate": string | null,
  "endDate": string | null,
  "accusedSearchName": string | null,
  "needsPatrolRoute": boolean,
  "needsNetworkGraph": boolean
}
`;

export async function POST(req: Request) {
  try {
    const { messages, role, language } = await req.json();
    const userQuery = messages[messages.length - 1]?.text || '';
    const queryLower = userQuery.toLowerCase();

    let filters = {
      validQuery: true,
      district: null as string | null,
      policeStation: null as string | null,
      crimeGroup: null as string | null,
      startDate: null as string | null,
      endDate: null as string | null,
      accusedSearchName: null as string | null,
      needsPatrolRoute: false,
      needsNetworkGraph: false
    };

    // STEP 1: Pass schema to Groq LLM to extract precise query parameters
    if (groqClients.length > 0) {
      try {
        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

        const extractedText = await runWithFallback(async (client) => {
          const queryExtraction = await client.chat.completions.create({
            messages: [
              { role: 'system', content: SYSTEM_SCHEMA_PROMPT },
              ...history,
              { role: 'user', content: userQuery }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.0, // Factual deterministic extraction
            response_format: { type: 'json_object' }
          });
          return queryExtraction.choices[0].message.content || '{}';
        });

        filters = JSON.parse(extractedText);
      } catch (e) {
        console.error('Groq Schema Extraction failed on all clients, falling back to local regex intent:', e);
        filters = fallbackIntentResolver(queryLower);
      }
    } else {
      filters = fallbackIntentResolver(queryLower);
    }

    if (!filters.validQuery) {
      return NextResponse.json({
        summaryText: "I could not find matching parameters in the KSP database for your query. Please ask specifically about FIR cases, districts, police stations, or suspects.",
        text: "I could not find matching parameters in the KSP database for your query. Please ask specifically about FIR cases, districts, police stations, or suspects.",
        crimePoints: [],
        patrolRouteWaypoints: [],
        evidenceTrail: "No database query executed.",
        leads: [],
        dbData: { cases: [], accused: [], complainants: [], arrests: [], transactions: [] },
        patrolRoute: []
      });
    }

    // STEP 2: Translate extracted parameters into ZCQL (SQL)
    let sqlQuery = 'SELECT * FROM CaseMaster';
    let filterType = 'all';

    if (filters.policeStation) {
      // Join CaseMaster with Unit to filter by station name
      sqlQuery = `SELECT * FROM CaseMaster JOIN Unit ON CaseMaster.PoliceStationID = Unit.UnitID WHERE Unit.UnitName LIKE '%${filters.policeStation}%'`;
      filterType = 'station';
    } else if (filters.district) {
      sqlQuery = `SELECT * FROM CaseMaster JOIN Unit ON CaseMaster.PoliceStationID = Unit.UnitID WHERE Unit.DistrictID LIKE '%${filters.district}%'`;
      filterType = 'district';
    } else if (filters.crimeGroup) {
      sqlQuery = `SELECT * FROM CaseMaster WHERE CrimeMajorHeadID LIKE '%${filters.crimeGroup}%'`;
      filterType = 'crime_group';
    } else if (filters.accusedSearchName) {
      sqlQuery = `SELECT * FROM Accused WHERE AccusedName LIKE '%${filters.accusedSearchName}%'`;
      filterType = 'accused';
    }

    // STEP 3: Execute ZCQL query against local datastore or Catalyst SDK
    let dbResults: any[] = [];
    
    // Check if running on Catalyst SDK
    const isCatalyst = process.env.CATALYST_PROJECT_ID || process.env.CATALYST_PROJECT_KEY;
    if (isCatalyst) {
      try {
        // @ts-ignore
        const requireFunc = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
        const catalyst = requireFunc('zcatalyst-sdk-node');
        const app = catalyst.initialize(req);
        const zcql = app.zcql();
        dbResults = await zcql.executeZCQLQuery(sqlQuery);
      } catch (err) {
        console.error('Catalyst Query execution failed, falling back to local:', err);
        const res = await executeZCQL(sqlQuery);
        dbResults = res.data;
      }
    } else {
      const res = await executeZCQL(sqlQuery);
      dbResults = res.data;
    }

    // If query was on Accused, map the results back to associated CaseMaster records
    let matchedCases: any[] = [];
    if (filterType === 'accused') {
      const caseIds = dbResults.map(a => a.CaseMasterID);
      const allCases = await executeZCQL('SELECT * FROM CaseMaster');
      matchedCases = allCases.data.filter(c => caseIds.includes(c.CaseMasterID));
    } else {
      matchedCases = dbResults;
    }

    // Fetch related child logs to populate dashboards, charts, and networks
    const allAccusedRes = await executeZCQL('SELECT * FROM Accused');
    const allComplainantsRes = await executeZCQL('SELECT * FROM ComplainantDetails');
    const allVictimsRes = await executeZCQL('SELECT * FROM Victim');
    const allArrestsRes = await executeZCQL('SELECT * FROM ArrestSurrender');
    const allSectionsRes = await executeZCQL('SELECT * FROM ActSectionAssociation');
    const allTxnsRes = await executeZCQL('SELECT * FROM FinancialTransactions');

    const matchedCaseIds = matchedCases.map(c => c.CaseMasterID);
    const activeAccused = allAccusedRes.data.filter(a => matchedCaseIds.includes(a.CaseMasterID));
    const activeComplainants = allComplainantsRes.data.filter(c => matchedCaseIds.includes(c.CaseMasterID));
    const activeVictims = allVictimsRes.data.filter(v => matchedCaseIds.includes(v.CaseMasterID));
    const activeArrests = allArrestsRes.data.filter(arr => matchedCaseIds.includes(arr.CaseMasterID));
    const activeSections = allSectionsRes.data.filter(s => matchedCaseIds.includes(s.CaseMasterID));
    const activeTxns = allTxnsRes.data.filter(t => matchedCaseIds.includes(t.CaseMasterID));

    // Compile maps coordinates
    const routeCoordinates = matchedCases.map(c => ({
      latitude: c.latitude,
      longitude: c.longitude,
      Beat_Name: c.CrimeMinorHeadID || 'Incident Location'
    }));

    // Suggested leads
    const defaultLeads: Record<string, string[]> = {
      cyber: [
        "Issue immediate freeze notices to the identified mule accounts (HDFC/ICICI) via 1930 portal.",
        "Coordinate with ISP to trace IP addresses for transaction logins.",
        "Scan local CCTV archives at ATMs for suspect card insertion points."
      ],
      narcotics: [
        "Interrogate the suspect regarding source drug distribution hubs.",
        "Alert Mangalore/Mysore checkpoints matching suspect travel tickets.",
        "Verify source contacts using suspect call logs and location pings."
      ],
      theft: [
        "Audit neighborhood second-hand metal dealers for stolen items.",
        "Cross-reference current modus operandi with prior release files of repeat offenders.",
        "Instruct beat constable to step up night rounds in hot corridors."
      ],
      general: [
        "Review CCTV cameras within a 500m radius of the reported coordinates.",
        "Conduct door-to-door inquiry with shopkeepers and local beat members.",
        "Compare suspect descriptors against the KSP historical repeat offenders database."
      ]
    };

    const activeLeads = filterType === 'cyber' ? defaultLeads.cyber 
      : filterType === 'narcotics' ? defaultLeads.narcotics 
      : filterType === 'theft' ? defaultLeads.theft 
      : defaultLeads.general;

    // STEP 4: Pass ONLY actual database rows back to Groq for Factual Criminological Synthesis
    let synthesisResponse = '';
    const targetLang = language || 'English';
    const synthesisPrompt = `
      You are a Senior KSP Criminologist. Synthesize the provided actual database records into 3 factual bullet points. 
      STRICT GUARDRAIL: Answer ONLY based on the provided JSON database records. Do not assume or hallucinate outside records.

      STRICT LANGUAGE RULE: You MUST write your entire response strictly in the ${targetLang} language. If the language is Kannada, you MUST write strictly in Kannada script. If Hindi, you MUST write strictly in Hindi Devanagari script. If English, you MUST write in English.

      Active Officer Role: ${role}
      User Query: "${userQuery}"
      
      Database Records Context:
      - Cases: ${JSON.stringify(matchedCases.slice(0, 10))}
      - Related Accused/Suspects: ${JSON.stringify(activeAccused.slice(0, 10))}
      - Related Victims: ${JSON.stringify(activeVictims.slice(0, 10))}
      - Related Complainants: ${JSON.stringify(activeComplainants.slice(0, 10))}
      - Related Transactions/Trails: ${JSON.stringify(activeTxns.slice(0, 10))}
      - Legal Acts Applied: ${JSON.stringify(activeSections.slice(0, 10))}
    `;

    if (groqClients.length > 0) {
      try {
        synthesisResponse = await runWithFallback(async (client) => {
          const synthesisCompletion = await client.chat.completions.create({
            messages: [
              { role: 'user', content: synthesisPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2
          });
          return synthesisCompletion.choices[0].message.content || '';
        });
      } catch (err) {
        console.error('Groq synthesis call failed on all clients, falling back to rule templates:', err);
      }
    }

    if (!synthesisResponse) {
      // Offline fallback synthesis templates
      synthesisResponse = `• Relational ZCQL Scan returned ${matchedCases.length} incidents matching your query.
• Case details mapping has been plotted onto the map.
• Investigative decision directives have been updated in the leads panel.`;
    }

    // STEP 5: Return Real Data + AI Synthesis to Frontend (compatible with both specifications and HUD views)
    return NextResponse.json({
      // Spec Contract properties
      summaryText: synthesisResponse,
      crimePoints: matchedCases.map((c: any) => ({
        lat: c.latitude,
        lng: c.longitude,
        crimeNo: c.CrimeNo,
        beat: c.CrimeMinorHeadID
      })),
      patrolRouteWaypoints: matchedCases.slice(0, 8).map((c: any) => [c.latitude, c.longitude]),
      
      // HUD UI properties
      text: synthesisResponse,
      queryUsed: sqlQuery,
      evidenceTrail: `Tables Queried: [CaseMaster, Accused, Unit]. Query parameters: ${JSON.stringify(filters)}. Legal sections: BNS/IPC.`,
      leads: activeLeads,
      dbData: {
        cases: matchedCases,
        accused: activeAccused,
        complainants: activeComplainants,
        victims: activeVictims,
        arrests: activeArrests,
        transactions: activeTxns
      },
      patrolRoute: routeCoordinates
    });

  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Basic regex resolver for local fallback when Groq client fails or is unconfigured
function fallbackIntentResolver(queryLower: string) {
  const filters = {
    validQuery: true,
    district: null as string | null,
    policeStation: null as string | null,
    crimeGroup: null as string | null,
    startDate: null as string | null,
    endDate: null as string | null,
    accusedSearchName: null as string | null,
    needsPatrolRoute: false,
    needsNetworkGraph: false
  };

  if (queryLower.includes('amengad')) {
    filters.policeStation = 'Amengad';
  } else if (queryLower.includes('yadgiri')) {
    filters.policeStation = 'Yadgiri';
  } else if (queryLower.includes('bagalkot')) {
    filters.district = 'Bagalkot';
  } else if (queryLower.includes('cyber') || queryLower.includes('scam')) {
    filters.crimeGroup = 'CEN';
  } else if (queryLower.includes('theft')) {
    filters.crimeGroup = 'THEFT';
  } else if (queryLower.includes('kiran')) {
    filters.accusedSearchName = 'kiran';
  } else if (queryLower.includes('lokesha')) {
    filters.accusedSearchName = 'lokesha';
  }

  return filters;
}
