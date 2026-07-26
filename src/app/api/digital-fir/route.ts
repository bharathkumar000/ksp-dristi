import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to determine if Catalyst environment variables are active
const isCatalystActive = () => {
  return !!(process.env.CATALYST_PROJECT_ID || process.env.CATALYST_PROJECT_KEY || process.env.CATALYST_APP_ID);
};

// Helper to extract a column value compatibly from both flat and nested ZCQL results
const getVal = (row: any, tableName: string, columnName: string) => {
  if (row[tableName] && row[tableName][columnName] !== undefined) {
    return row[tableName][columnName];
  }
  return row[columnName];
};

export async function GET(req: Request) {
  try {
    if (isCatalystActive()) {
      try {
        // @ts-ignore
        const requireFunc = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
        const catalyst = requireFunc('zcatalyst-sdk-node');
        const app = catalyst.initialize(req);
        const zcql = app.zcql();

        const result = await zcql.executeZCQLQuery('SELECT * FROM DigitalFIR');
        const mappedFirs = (result || []).map((row: any) => ({
          CaseMasterID: getVal(row, 'DigitalFIR', 'CaseMasterID'),
          CrimeNo: getVal(row, 'DigitalFIR', 'CrimeNo'),
          CaseNo: getVal(row, 'DigitalFIR', 'CaseNo'),
          PoliceStationID: getVal(row, 'DigitalFIR', 'PoliceStationID'),
          CrimeMajorHead: getVal(row, 'DigitalFIR', 'CrimeMajorHead'),
          CrimeMinorHead: getVal(row, 'DigitalFIR', 'CrimeMinorHead'),
          IncidentDate: getVal(row, 'DigitalFIR', 'IncidentDate'),
          BriefFacts: getVal(row, 'DigitalFIR', 'BriefFacts'),
          ComplainantName: getVal(row, 'DigitalFIR', 'ComplainantName'),
          ComplainantGender: getVal(row, 'DigitalFIR', 'ComplainantGender'),
          ComplainantAge: getVal(row, 'DigitalFIR', 'ComplainantAge'),
          ComplainantOccupation: getVal(row, 'DigitalFIR', 'ComplainantOccupation'),
          SuspectName: getVal(row, 'DigitalFIR', 'SuspectName'),
          SuspectDetails: getVal(row, 'DigitalFIR', 'SuspectDetails'),
        }));

        return NextResponse.json(mappedFirs);
      } catch (err) {
        console.warn('Catalyst DigitalFIR GET failed, falling back to local file:', err);
      }
    }

    const filePath = path.join(process.cwd(), 'public', 'digital_firs.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    console.error('Error loading digital FIRs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const payload = await req.json();
  try {
    if (isCatalystActive()) {
      try {
        // @ts-ignore
        const requireFunc = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
        const catalyst = requireFunc('zcatalyst-sdk-node');
        const app = catalyst.initialize(req);
        const datastore = app.datastore();

        const table = datastore.table('DigitalFIR');
        await table.insertRow({
          CaseMasterID: payload.CaseMasterID,
          CrimeNo: payload.CrimeNo,
          CaseNo: payload.CaseNo,
          PoliceStationID: payload.PoliceStationID,
          CrimeMajorHead: payload.CrimeMajorHead,
          CrimeMinorHead: payload.CrimeMinorHead,
          IncidentDate: payload.IncidentDate,
          BriefFacts: payload.BriefFacts,
          ComplainantName: payload.ComplainantName,
          ComplainantGender: payload.ComplainantGender,
          ComplainantAge: payload.ComplainantAge,
          ComplainantOccupation: payload.ComplainantOccupation,
          SuspectName: payload.SuspectName,
          SuspectDetails: payload.SuspectDetails,
        });

        return NextResponse.json({ success: true });
      } catch (err) {
        console.warn('Catalyst DigitalFIR POST failed, falling back to local file:', err);
      }
    }

    const filePath = path.join(process.cwd(), 'public', 'digital_firs.json');
    let current: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {}
    }
    current.push(payload);
    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving digital FIR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
