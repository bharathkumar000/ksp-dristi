'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Bot, Map, Share2, FolderOpen, BarChart2,
  Lock, Settings, Search, Pin, MessageSquare, FileText,
  Bell, Mail, Shield, Plus, Download, AlertTriangle,
  CheckSquare, Eye, Fingerprint, Layers, Cpu,
  Car, Phone, CreditCard, Camera, Network, 
  FileBarChart2, Siren, Zap, UserSearch, Filter,
  ChevronRight, Info, Trash2, Send, Mic, MicOff,
  Globe, Activity, TrendingUp, Clock, User
} from 'lucide-react';
import CrimeMap from '@/components/CrimeMap';
import NetworkGraph from '@/components/NetworkGraph';
import ProfilingPanel from '@/components/ProfilingPanel';
import { exportDossierToPDF } from '@/lib/pdfExporter';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  roleUsed?: string;
  isCustomUI?: boolean;
  cases?: any[];
  modusOperandi?: string[];
  keyInsights?: {
    firstOccurrence: string;
    mostActivePeriod: string;
    primaryLocations: string;
    financialImpact: string;
  };
}

const MOCK_CONVERSATIONS: Record<string, { title: string; messages: Message[]; focusCaseId?: string; focusCrimeNo?: string }> = {
  'fake-loan': {
    title: 'Fake loan app fraud pattern...',
    messages: [
      {
        id: 'fl-1',
        sender: 'user',
        text: 'Are there similar crime patterns to the fake loan apps in Bengaluru?',
        timestamp: '10:15 AM'
      },
      {
        id: 'fl-2',
        sender: 'ai',
        text: 'Yes, similar crime patterns have been identified in the past in Bengaluru. I found 7 relevant cases with high pattern similarity.',
        timestamp: '10:15 AM',
        isCustomUI: true,
        cases: [
          { CrimeNo: 'FIR_2031/24', IncidentFromDate: '2024-05-12T00:00:00Z', PoliceStationID: 'Bengaluru East', CrimeMajorHeadID: 'Cyber Fraud', latitude: 12.97, longitude: 77.59, BriefFacts: 'Fake loan app extortion' },
          { CrimeNo: 'FIR_4018/24', IncidentFromDate: '2024-03-03T00:00:00Z', PoliceStationID: 'Whitefield PS', CrimeMajorHeadID: 'Cyber Fraud', latitude: 12.96, longitude: 77.75, BriefFacts: 'Fake loan app extortion' },
          { CrimeNo: 'FIR_9876/23', IncidentFromDate: '2023-11-17T00:00:00Z', PoliceStationID: 'Electronic City', CrimeMajorHeadID: 'Cyber Fraud', latitude: 12.85, longitude: 77.66, BriefFacts: 'Fake loan app extortion' }
        ],
        modusOperandi: [
          'Fake loan / job offer apps to lure victims',
          'KYC documents collected under false pretenses',
          'Money transferred to multiple mule accounts',
          'Communication through Telegram / WhatsApp'
        ],
        keyInsights: {
          firstOccurrence: 'May 2022',
          mostActivePeriod: 'Mar - Jun',
          primaryLocations: 'Whitefield, EC, Koramangala',
          financialImpact: '₹8.76 Cr'
        }
      }
    ]
  },
  'cctv-lookup': {
    title: 'CCTV lookup - Whitefield',
    messages: [
      {
        id: 'cl-1',
        sender: 'user',
        text: 'Look up CCTV footages in Whitefield area for suspected vehicles in C_0001.',
        timestamp: '11:20 AM'
      },
      {
        id: 'cl-2',
        sender: 'ai',
        text: 'Interrogating Whitefield division CCTV feed registry. Identified suspect vehicle matching description in case C_0001 near Whitefield Main Road Junction, travelling from C_0001 to C_0010. Traffic logs confirmed exit via Varthur Road.',
        timestamp: '11:21 AM'
      }
    ]
  },
  'money-trail': {
    title: 'Money trail analysis',
    messages: [
      {
        id: 'mt-1',
        sender: 'user',
        text: 'Perform money trail analysis for transactions linked to C_0001.',
        timestamp: 'Yesterday'
      },
      {
        id: 'mt-2',
        sender: 'ai',
        text: 'Analyzing digital ledger records. Found a high-value suspect transaction flow starting from case C_0001 transferring to mule account Mule_100, which subsequently routed funds to case C_0010 related accounts.',
        timestamp: 'Yesterday'
      }
    ]
  },
  'suspect-profiling': {
    title: 'Suspect profiling - Ramesh',
    messages: [
      {
        id: 'sp-1',
        sender: 'user',
        text: 'Show profiling details for suspect Ramesh associated with C_0001.',
        timestamp: 'Yesterday'
      },
      {
        id: 'sp-2',
        sender: 'ai',
        text: 'Displaying profiling profile for Ramesh S/O Somappa. Target identified as a recurring operator in phishing activities linked to C_0001 and C_0010. Currently flagged as high risk under surveillance.',
        timestamp: 'Yesterday'
      }
    ]
  },
  'similar-cases': {
    title: 'Similar cases - 2024',
    messages: [
      {
        id: 'sc-1',
        sender: 'user',
        text: 'List cyber extortion similar cases from 2024.',
        timestamp: '2 days ago'
      },
      {
        id: 'sc-2',
        sender: 'ai',
        text: 'Cross-referencing database registers. Found 3 similar cases matching the MO:\n- FIR_2031/24 (linked to C_0001)\n- FIR_4018/24 (linked to C_0010)',
        timestamp: '2 days ago'
      }
    ]
  },
  'network-analysis': {
    title: 'Network analysis - Bengaluru',
    messages: [
      {
        id: 'na-1',
        sender: 'user',
        text: 'Run link analysis between Bengaluru East division nodes.',
        timestamp: '3 days ago'
      },
      {
        id: 'na-2',
        sender: 'ai',
        text: 'Link network graph loaded. Established multi-point connections between phone records in C_0001 and bank routing nodes in C_0010.',
        timestamp: '3 days ago'
      }
    ]
  },
  'phone-tracking': {
    title: 'Phone number tracking',
    messages: [
      {
        id: 'pt-1',
        sender: 'user',
        text: 'Trace cell tower logs for suspect phone 9886745123.',
        timestamp: '4 days ago'
      },
      {
        id: 'pt-2',
        sender: 'ai',
        text: 'Triangulation trace complete. The suspect IMEI was active in Whitefield and HSR layout sectors coinciding with the crime timeline of C_0001 and C_0010.',
        timestamp: '4 days ago'
      }
    ]
  },
  'bank-accounts': {
    title: 'Bank accounts linked',
    messages: [
      {
        id: 'ba-1',
        sender: 'user',
        text: 'List flagged bank accounts from ledger database.',
        timestamp: '5 days ago'
      },
      {
        id: 'ba-2',
        sender: 'ai',
        text: 'Identified 2 linked accounts receiving scam deposits:\n- SBI Savings ***823 (connected to suspect in C_0001)\n- HDFC Savings ***091 (connected to suspect in C_0010)',
        timestamp: '5 days ago'
      }
    ]
  },
  'vehicle-tracking': {
    title: 'Vehicle tracking history',
    messages: [
      {
        id: 'vt-1',
        sender: 'user',
        text: 'Search ANPR cameras for white SUV traveling from C_0001.',
        timestamp: '6 days ago'
      },
      {
        id: 'vt-2',
        sender: 'ai',
        text: 'ANPR records matched white SUV passing through toll gate 4, moving from C_0001 jurisdiction towards C_0010 boundary at 15:44:00.',
        timestamp: '6 days ago'
      }
    ]
  }
};

function renderHighlightedText(text: string): React.ReactNode {
  const tokenRegex = /(\*\*[^*]+\*\*|\bC_\d{4}\b|\bFIR_\d{4}\/\d{2}\b|"[^"]+"|\b[A-Za-z.\s'-]+\s\((?:PI|PSI|WPSI|SI)\)|\bSec\.\s\d+(?:\(\d+\))?|\bKarnataka Police Act \d{4}|\b(?:PI|PSI|WPSI|SI)\b)/g;
  
  const parts = text.split(tokenRegex);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => {
    if (!part) return null;
    
    // Bold match (e.g. **bold**)
    if (part.startsWith('**') && part.endsWith('**')) {
      const innerText = part.slice(2, -2);
      return <strong key={i} className="font-extrabold text-slate-900 mx-0.5">{renderHighlightedText(innerText)}</strong>;
    }
    
    // Case Master ID match (e.g. C_0124)
    if (part.match(/^C_\d{4}$/)) {
      return (
        <span 
          key={i} 
          onClick={() => {
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('open-case', { detail: part });
              window.dispatchEvent(event);
            }
          }}
          className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 transition-colors font-sans mx-0.5 active:scale-95 shadow-sm"
          title="Click to view Case File"
        >
          📂 {part}
        </span>
      );
    }
    
    // FIR Number match (e.g. FIR_2031/24)
    if (part.match(/^FIR_\d{4}\/\d{2}$/)) {
      return (
        <span 
          key={i} 
          onClick={() => {
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('open-case', { detail: part });
              window.dispatchEvent(event);
            }
          }}
          className="cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 transition-colors font-sans mx-0.5 active:scale-95 shadow-sm"
          title="Click to view Case File"
        >
          📄 {part}
        </span>
      );
    }

    // Double quoted terms (e.g. "Of Automobiles - Of Two Wheelers")
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <strong key={i} className="text-slate-800 font-semibold bg-slate-100 px-1 py-0.5 rounded border border-slate-200/60 font-sans mx-0.5">
          {part}
        </strong>
      );
    }

    // Officer Names with rank (e.g. SHRISHAIL K BYAKOD (PI))
    if (part.match(/\((?:PI|PSI|WPSI|SI)\)$/)) {
      return (
        <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 font-sans mx-0.5">
          👮 {part}
        </span>
      );
    }

    // Sections (e.g. Sec. 78(3))
    if (part.match(/^Sec\.\s\d+(?:\(\d+\))?$/)) {
      return (
        <span key={i} className="bg-amber-50 text-amber-800 border border-amber-250 px-1.5 py-0.5 rounded-md font-bold text-[10px] font-sans mx-0.5">
          ⚖️ {part}
        </span>
      );
    }

    // Act names
    if (part === 'IPC' || part.includes('Police Act')) {
      return (
        <span key={i} className="bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded-md font-bold text-[9.5px] font-sans mx-0.5">
          📜 {part}
        </span>
      );
    }

    return part;
  });
}

function formatMessageText(text: string) {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentTableLines: string[] = [];

  const flushTable = (tableLines: string[], key: number) => {
    if (tableLines.length === 0) return null;
    
    // Parse the lines
    const parsedRows = tableLines.map(line => {
      const parts = line.trim().replace(/^\||\|$/g, '').split('|').map(p => p.trim());
      return parts;
    });

    const headers = parsedRows[0] || [];
    let bodyRows = parsedRows.slice(1);
    
    // Skip divider row if present
    if (bodyRows[0] && bodyRows[0].every(col => col.startsWith('-') || col.startsWith(':') || col.endsWith('-') || col.endsWith(':'))) {
      bodyRows = bodyRows.slice(1);
    }

    return (
      <div key={`table-${key}`} className="my-3 overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm font-sans max-w-full">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="text-slate-655 border-b border-slate-200 bg-slate-50 font-bold font-sans">
              {headers.map((h, i) => (
                <th key={i} className="p-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                {row.map((col, colIndex) => {
                  const isBold = col.startsWith('**') && col.endsWith('**');
                  const cleanCol = isBold ? col.replace(/^\*\*|\*\*$/g, '') : col;
                  return (
                    <td key={colIndex} className={`p-2 text-slate-700 leading-normal ${isBold ? 'font-bold text-slate-900 bg-slate-50/20' : ''}`}>
                      {renderHighlightedText(cleanCol)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|')) {
      currentTableLines.push(line);
    } else {
      if (currentTableLines.length > 0) {
        renderedElements.push(flushTable(currentTableLines, i));
        currentTableLines = [];
      }
      if (trimmed) {
        const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');
        const cleanText = isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed;
        
        if (isBullet) {
          renderedElements.push(
            <div key={i} className="flex gap-2.5 items-start pl-2">
              <span className="text-blue-500 mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
              <div className="text-[11.5px] font-medium text-slate-700 flex-1 leading-relaxed">
                {renderHighlightedText(cleanText)}
              </div>
            </div>
          );
        } else {
          renderedElements.push(
            <p key={i} className="text-[12.5px] font-medium text-slate-800 leading-relaxed">
              {renderHighlightedText(cleanText)}
            </p>
          );
        }
      }
    }
  }

  if (currentTableLines.length > 0) {
    renderedElements.push(flushTable(currentTableLines, lines.length));
  }

  return (
    <div className="space-y-3 font-sans text-slate-800 leading-relaxed">
      {renderedElements}
    </div>
  );
}

interface IntelItem {
  id: string;
  time: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  text: string;
  sourceName: string;
  sourceUrl: string;
  sourcePlatform: 'X' | 'Telegram' | 'Facebook' | 'News' | 'CitizenPortal';
  mapTarget?: boolean;
}

const INITIAL_INTEL_FEED: IntelItem[] = [
  {
    id: 'intel-1',
    time: '08:42 AM',
    priority: 'HIGH',
    confidence: 82,
    text: 'Multiple robbery reports received near Mysuru Bus Stand. Mob gathered and traffic disrupted.',
    sourceName: 'X (Twitter) @MysuruCityPolice',
    sourceUrl: 'https://x.com/MysuruCityInfo/status/1815982121',
    sourcePlatform: 'X',
    mapTarget: true
  },
  {
    id: 'intel-2',
    time: '08:57 AM',
    priority: 'MEDIUM',
    confidence: 91,
    text: 'Extortion message pattern detected targeting local merchants under the guise of fake loan settlement agents.',
    sourceName: 'Telegram Channel: Bengaluru Cyber Shield',
    sourceUrl: 'https://t.me/cyber_shield_blr/552',
    sourcePlatform: 'Telegram',
    mapTarget: true
  },
  {
    id: 'intel-3',
    time: '09:04 AM',
    priority: 'MEDIUM',
    confidence: 78,
    text: 'Mule bank account routing anomalies detected in cooperative banking API logs. Rapid fund splitting active.',
    sourceName: 'KSP Safe City Citizen Portal',
    sourceUrl: 'https://ksp.karnataka.gov.in/citizen-portal',
    sourcePlatform: 'CitizenPortal'
  }
];

const getDistrictFromCrimeNo = (crimeNo: string) => {
  if (!crimeNo) return 'Bagalkot';
  const clean = crimeNo.trim();
  if (clean.toLowerCase().includes('amengad')) return 'Bagalkot';
  if (clean.includes('/')) {
    const part = clean.split('/')[0];
    if (part && part.toLowerCase() !== 'fir') {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
  }
  return 'Bagalkot';
};

export default function Home() {
  // Navigation & Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to logged in
  const [kgid, setKgid] = useState('1898733');
  const [password, setPassword] = useState('••••••••');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai' | 'map' | 'network' | 'cases' | 'analytics' | 'records' | 'alerts' | 'reports' | 'file-fir'>('dashboard');
  const [role, setRole] = useState<'Investigator' | 'Analyst' | 'Supervisor' | 'Policymaker'>('Investigator');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Input & Chat State
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN' | 'kn-IN'>('en-IN');
  const [chatHistory, setChatHistory] = useState<Message[]>(MOCK_CONVERSATIONS['fake-loan'].messages);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('fake-loan');
  const [activeSessions, setActiveSessions] = useState<Record<string, { title: string; messages: Message[]; focusCaseId?: string; focusCrimeNo?: string }>>(MOCK_CONVERSATIONS);
  const [intelFeed, setIntelFeed] = useState<IntelItem[]>(INITIAL_INTEL_FEED);
  const [isLoading, setIsLoading] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Live Date/Time state to keep the website updated
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Active dataset loaded from backend API
  const [dashboardData, setDashboardData] = useState<{
    cases: any[];
    accused: any[];
    complainants: any[];
    arrests: any[];
    transactions: any[];
  }>({
    cases: [
      {
        CaseMasterID: "C_0001",
        CrimeNo: "Amengad/FIR/2026/1",
        CaseNo: "CC/1/2026",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "CYBER CRIME - ONLINE FINANCIAL FRAUD",
        CrimeMinorHeadID: "Loan App Extortion",
        IncidentFromDate: "2026-07-24T10:15:00Z",
        latitude: 16.1729,
        longitude: 75.7246,
        BriefFacts: "Victim extorted via fake online loan application (Dhani Credit). Extorted ₹1.25 Lakhs under threat of morphing contacts photos. Suspect Kiran Kumar tracked."
      },
      {
        CaseMasterID: "C_0002",
        CrimeNo: "Amengad/FIR/2026/2",
        CaseNo: "CC/2/2026",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "NDPS ACT (NARCOTICS)",
        CrimeMinorHeadID: "Contraband Sales",
        IncidentFromDate: "2026-07-25T14:32:00Z",
        latitude: 16.1820,
        longitude: 75.7340,
        BriefFacts: "Seizure of synthetic contraband (MDMA) near educational hub. Intercepted suspect peddling ring linked to inter-state network. Accused Lokesha alias 'Punda' under surveillance."
      },
      {
        CaseMasterID: "C_0003",
        CrimeNo: "Amengad/FIR/2026/3",
        CaseNo: "CC/3/2026",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "ONLINE JOB FRAUD",
        CrimeMinorHeadID: "Phishing & Extortion",
        IncidentFromDate: "2026-07-25T18:57:00Z",
        latitude: 16.1910,
        longitude: 75.7420,
        BriefFacts: "Victim lured through Telegram channel for part-time rating jobs. Funds routed to 3 mule bank accounts in cooperative banks under suspect Rakesh N."
      },
      {
        CaseMasterID: "C_0004",
        CrimeNo: "Amengad/FIR/2026/4",
        CaseNo: "CC/4/2026",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "KIDNAPPING & ABDUCTION",
        CrimeMinorHeadID: "Ransom Extortion",
        IncidentFromDate: "2026-07-26T09:04:00Z",
        latitude: 16.2010,
        longitude: 75.7510,
        BriefFacts: "Kidnapping for ransom of a local businessman. Suspect vehicle KA-03-HA-8821 spotted exiting Whitefield main toll gate."
      },
      {
        CaseMasterID: "C_0005",
        CrimeNo: "Amengad/FIR/2026/5",
        CaseNo: "CC/5/2026",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "ORGANIZED CRYPTO SCAM",
        CrimeMinorHeadID: "Money Laundering",
        IncidentFromDate: "2026-07-26T11:42:00Z",
        latitude: 16.2110,
        longitude: 75.7610,
        BriefFacts: "Massive cryptocurrency laundering ring busted. Accused routed ₹8.76 Cr through local shell company bank registrations."
      }
    ],
    accused: [
      { AccusedMasterID: "A_0001", CaseMasterID: "C_0001", AccusedName: "Kiran Kumar", GenderID: "Male", AgeYear: 28 },
      { AccusedMasterID: "A_0002", CaseMasterID: "C_0002", AccusedName: "Lokesha alias 'Punda'", GenderID: "Male", AgeYear: 32 },
      { AccusedMasterID: "A_0003", CaseMasterID: "C_0003", AccusedName: "Rakesh N.", GenderID: "Male", AgeYear: 35 }
    ],
    complainants: [
      { ComplainantID: "CP_0001", CaseMasterID: "C_0001", ComplainantName: "Savita Patil", GenderID: "Female", AgeYear: 43, OccupationID: "Business", ReligionID: "Hindu", CasteID: "General" },
      { ComplainantID: "CP_0002", CaseMasterID: "C_0002", ComplainantName: "Ganesh Biradar", GenderID: "Male", AgeYear: 36, OccupationID: "Agriculture", ReligionID: "Hindu", CasteID: "SC/ST" },
      { ComplainantID: "CP_0003", CaseMasterID: "C_0003", ComplainantName: "Suresh Hegde", GenderID: "Male", AgeYear: 45, OccupationID: "Business", ReligionID: "Hindu", CasteID: "General" }
    ],
    arrests: [
      { ArrestSurrenderID: "AS_0001", CaseMasterID: "C_0001", ArrestSurrenderDate: "2016-01-08T00:00:00Z" }
    ],
    transactions: [
      { TransactionID: "TXN_0001", CaseMasterID: "C_0001", SuspectName: "Kiran Kumar", Amount: 125000, TargetAccount: "Mule_100 (Bank)" }
    ]
  });

  // Filters & Sub-view states
  const [patrolRoute, setPatrolRoute] = useState<any[]>([]);
  const [currentZcql, setCurrentZcql] = useState('SELECT * FROM CaseMaster');
  const [currentLeads, setCurrentLeads] = useState<string[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // Timeline slider for Link analysis
  const [timelineYear, setTimelineYear] = useState(2025);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);

  // Diagnostics
  const [ping, setPing] = useState(38);
  const [systemLoad, setSystemLoad] = useState(9.6);

  // Digital FIR Portal Form States
  const [firComplainant, setFirComplainant] = useState('');
  const [firComplainantAge, setFirComplainantAge] = useState('');
  const [firComplainantGender, setFirComplainantGender] = useState('Male');
  const [firComplainantOccupation, setFirComplainantOccupation] = useState('Business');
  const [firDistrict, setFirDistrict] = useState('Bengaluru City');
  const [firMajorHead, setFirMajorHead] = useState('CYBER CRIME - ONLINE FINANCIAL FRAUD');
  const [firMinorHead, setFirMinorHead] = useState('Loan App Extortion');
  const [firIncidentDate, setFirIncidentDate] = useState('2026-07-26');
  const [firBriefFacts, setFirBriefFacts] = useState('');
  const [firSuspectName, setFirSuspectName] = useState('');
  const [firSuspectDetails, setFirSuspectDetails] = useState('');
  const [firStatusMessage, setFirStatusMessage] = useState<'success' | 'error' | null>(null);
  const [newFirDetails, setNewFirDetails] = useState<any | null>(null);

  const handleFileFir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firComplainant || !firBriefFacts) {
      setFirStatusMessage('error');
      return;
    }

    const nextIdNum = dashboardData.cases.length + 1;
    const newCaseId = `C_${String(nextIdNum).padStart(4, '0')}`;
    const newFirNumber = `Amengad/FIR/2026/${nextIdNum}`;
    const newCaseNo = `CC/${nextIdNum}/2026`;
    const incidentDateStr = `${firIncidentDate}T12:00:00Z`;

    const payload = {
      CaseMasterID: newCaseId,
      CrimeNo: newFirNumber,
      CaseNo: newCaseNo,
      PoliceStationID: "1245",
      CrimeMajorHead: firMajorHead,
      CrimeMinorHead: firMinorHead,
      IncidentDate: incidentDateStr,
      BriefFacts: `Filer: Inspector Ravi K. Complainant: ${firComplainant} (${firComplainantGender}, Age: ${firComplainantAge || 'N/A'}). Brief facts: ${firBriefFacts}. Suspect: ${firSuspectName || 'Unknown'} (${firSuspectDetails || 'No details'}).`,
      ComplainantName: firComplainant,
      ComplainantGender: firComplainantGender,
      ComplainantAge: firComplainantAge,
      ComplainantOccupation: firComplainantOccupation,
      SuspectName: firSuspectName,
      SuspectDetails: firSuspectDetails
    };

    try {
      const response = await fetch('/api/digital-fir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const newCase = {
        CaseMasterID: newCaseId,
        CrimeNo: newFirNumber,
        CaseNo: newCaseNo,
        PoliceStationID: "1245",
        CrimeMajorHeadID: firMajorHead,
        CrimeMinorHeadID: firMinorHead,
        IncidentFromDate: incidentDateStr,
        latitude: 16.17 + Math.random() * 0.05,
        longitude: 75.72 + Math.random() * 0.05,
        BriefFacts: payload.BriefFacts
      };

      // Update Cases Database in state
      setDashboardData((prev) => ({
        ...prev,
        cases: [newCase, ...prev.cases],
        complainants: [
          {
            ComplainantID: `CP_${String(nextIdNum).padStart(4, '0')}`,
            CaseMasterID: newCaseId,
            ComplainantName: firComplainant,
            GenderID: firComplainantGender,
            AgeYear: parseInt(firComplainantAge) || 30,
            OccupationID: firComplainantOccupation,
            ReligionID: "Hindu",
            CasteID: "General"
          },
          ...prev.complainants
        ],
        accused: firSuspectName ? [
          {
            AccusedMasterID: `A_${String(nextIdNum).padStart(4, '0')}`,
            CaseMasterID: newCaseId,
            AccusedName: firSuspectName,
            GenderID: "Male",
            AgeYear: 28
          },
          ...prev.accused
        ] : prev.accused
      }));

      setNewFirDetails(newCase);
      setFirStatusMessage('success');

      // Reset Form fields
      setFirComplainant('');
      setFirComplainantAge('');
      setFirComplainantGender('Male');
      setFirComplainantOccupation('Business');
      setFirBriefFacts('');
      setFirSuspectName('');
      setFirSuspectDetails('');
    } catch (err) {
      console.error('Failed to post digital FIR:', err);
      setFirStatusMessage('error');
    }
  };



  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial dashboard state on mount
  useEffect(() => {
    const loadDigitalFirs = async () => {
      try {
        const response = await fetch('/api/digital-fir');
        const digitalFirs = await response.json();
        if (digitalFirs.length > 0) {
          setDashboardData((prev) => {
            const prependedCases = [...prev.cases];
            const prependedComplainants = [...prev.complainants];
            const prependedAccused = [...prev.accused];

            digitalFirs.forEach((df: any) => {
              if (!prependedCases.some((c: any) => c.CaseMasterID === df.CaseMasterID)) {
                prependedCases.unshift({
                  CaseMasterID: df.CaseMasterID,
                  CrimeNo: df.CrimeNo,
                  CaseNo: df.CaseNo,
                  PoliceStationID: df.PoliceStationID,
                  CrimeMajorHeadID: df.CrimeMajorHead,
                  CrimeMinorHeadID: df.CrimeMinorHead,
                  IncidentFromDate: df.IncidentDate,
                  latitude: 16.17 + Math.random() * 0.05,
                  longitude: 75.72 + Math.random() * 0.05,
                  BriefFacts: df.BriefFacts
                });

                prependedComplainants.unshift({
                  ComplainantID: `CP_${df.CaseMasterID.split('_')[1]}`,
                  CaseMasterID: df.CaseMasterID,
                  ComplainantName: df.ComplainantName,
                  GenderID: df.ComplainantGender,
                  AgeYear: parseInt(df.ComplainantAge) || 30,
                  OccupationID: df.ComplainantOccupation,
                  ReligionID: "Hindu",
                  CasteID: "General"
                });

                if (df.SuspectName) {
                  prependedAccused.unshift({
                    AccusedMasterID: `A_${df.CaseMasterID.split('_')[1]}`,
                    CaseMasterID: df.CaseMasterID,
                    AccusedName: df.SuspectName,
                    GenderID: "Male",
                    AgeYear: 28
                  });
                }
              }
            });

            return {
              ...prev,
              cases: prependedCases,
              complainants: prependedComplainants,
              accused: prependedAccused
            };
          });
        }
      } catch (err) {
        console.error('Failed to load digital FIRs:', err);
      }
    };
    loadDigitalFirs();
    fetchChatResponse('Show all active crime records');
    const interval = setInterval(() => {
      setPing(Math.floor(25 + Math.random() * 15));
      setSystemLoad(parseFloat((6 + Math.random() * 4).toFixed(1)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Live Intel Feed streaming logic
  useEffect(() => {
    const staticFeedPool: Omit<IntelItem, 'id' | 'time'>[] = [
      {
        priority: 'HIGH',
        confidence: 89,
        text: 'Protests and road blockages reported near Majestic Metro station. Heavy security deployment requested.',
        sourceName: 'Prajavani News Live',
        sourceUrl: 'https://www.prajavani.net/',
        sourcePlatform: 'News'
      },
      {
        priority: 'HIGH',
        confidence: 94,
        text: 'ANPR alert: Stolen silver SUV (KA-01-MJ-4392) scanned entering Indiranagar 100 Feet Road.',
        sourceName: 'KSP ANPR Cam Scanners',
        sourceUrl: 'https://ksp.karnataka.gov.in/',
        sourcePlatform: 'CitizenPortal',
        mapTarget: true
      },
      {
        priority: 'MEDIUM',
        confidence: 85,
        text: 'WhatsApp phishing campaign detected claiming urgent fake electricity bills due under threat of disconnection.',
        sourceName: 'X (Twitter) @CybercrimeCID',
        sourceUrl: 'https://x.com/CybercrimeCID',
        sourcePlatform: 'X'
      },
      {
        priority: 'LOW',
        confidence: 76,
        text: 'Report of suspicious late-night gathering logged near Christ University central campus.',
        sourceName: 'Facebook Group: SG Palya Residents',
        sourceUrl: 'https://facebook.com/',
        sourcePlatform: 'Facebook'
      },
      {
        priority: 'HIGH',
        confidence: 92,
        text: 'Gold chain snatching incident reported by resident on 4th Cross, Koramangala 3rd Block.',
        sourceName: 'X (Twitter) @KoramangalaPost',
        sourceUrl: 'https://x.com/KoramangalaPost',
        sourcePlatform: 'X',
        mapTarget: true
      }
    ];

    let dynamicPool: IntelItem[] = [];
    let poolIndex = 0;

    const fetchLiveFeeds = async () => {
      try {
        const res = await fetch('/api/intel-feed');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          dynamicPool = data;
        }
      } catch (err) {
        console.error('Failed to load live news intelligence feed:', err);
      }
    };

    // Load initial feed
    fetchLiveFeeds();

    // Re-fetch live feeds every 5 minutes to stay completely current
    const refreshInterval = setInterval(fetchLiveFeeds, 300000);

    const streamInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (dynamicPool.length > 0) {
        const item = dynamicPool[poolIndex];
        setIntelFeed((prev) => {
          if (prev.some(p => p.text === item.text)) return prev;
          const newItem: IntelItem = {
            ...item,
            id: `intel-dyn-${Date.now()}`,
            time: timeStr
          };
          return [newItem, ...prev.slice(0, 4)];
        });
        poolIndex = (poolIndex + 1) % dynamicPool.length;
      }
    }, 15000); // Stream a new intelligence item every 12s

    return () => {
      clearInterval(refreshInterval);
      clearInterval(streamInterval);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Listen for case click events from chat bubbles
  useEffect(() => {
    const handleOpenCase = (e: Event) => {
      const caseId = (e as CustomEvent).detail;
      const caseObj = dashboardData.cases.find(c => 
        c.CaseMasterID === caseId || 
        c.CrimeNo.includes(caseId) || 
        c.CrimeNo.replace('Amengad/FIR/', 'FIR_').includes(caseId)
      );
      if (caseObj) {
        setSelectedCase(caseObj);
      }
    };
    window.addEventListener('open-case', handleOpenCase);
    return () => window.removeEventListener('open-case', handleOpenCase);
  }, [dashboardData.cases]);

  const loadHistorySession = (id: string) => {
    setSelectedHistoryId(id);
    setActiveTab('ai');
    const session = activeSessions[id];
    if (session) {
      setChatHistory(session.messages);
    }
  };

    // Fetch conversations from database on load
    useEffect(() => {
      const fetchConversations = async () => {
        try {
          const response = await fetch('/api/conversations');
          const data = await response.json();
          if (Object.keys(data).length > 0) {
            setActiveSessions(data);
            if (data['fake-loan']) {
              setChatHistory(data['fake-loan'].messages);
            }
          } else {
            setActiveSessions(MOCK_CONVERSATIONS);
            await fetch('/api/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(MOCK_CONVERSATIONS)
            });
          }
        } catch (err) {
          console.error('Failed to load conversations from database:', err);
        }
      };
      fetchConversations();
    }, []);

    const saveSessionsToDb = async (updated: Record<string, { title: string; messages: Message[] }>) => {
      try {
        await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (err) {
        console.error('Failed to save sessions to database:', err);
      }
    };

    const addMessageToActiveSession = (msg: Message, targetSessionId?: string) => {
      const currentId = targetSessionId || selectedHistoryId || `session-${Date.now()}`;
      if (!selectedHistoryId && !targetSessionId) {
        setSelectedHistoryId(currentId);
      }

      setActiveSessions((prevSessions) => {
        const updatedSessions = { ...prevSessions };
        if (!updatedSessions[currentId]) {
          const rawTitle = msg.text || 'New Investigation';
          const title = rawTitle.length > 28 ? rawTitle.substring(0, 25) + '...' : rawTitle;
          updatedSessions[currentId] = {
            title: title,
            messages: [msg]
          };
        } else {
          updatedSessions[currentId] = {
            ...updatedSessions[currentId],
            messages: [...(updatedSessions[currentId].messages || []), msg]
          };
        }

        saveSessionsToDb(updatedSessions);
        setChatHistory(updatedSessions[currentId].messages);
        return updatedSessions;
      });
    };

    const deleteHistorySession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = { ...activeSessions };
      delete updated[id];
      setActiveSessions(updated);
      saveSessionsToDb(updated);
      if (selectedHistoryId === id) {
        setChatHistory([]);
        setSelectedHistoryId('');
      }
    };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setIsLoggedIn(true);
    }, 1000);
  };

  const handleChatAboutCase = (caseItem: any) => {
    setSelectedCase(null);
    setActiveTab('ai');
    const caseSessionId = `case-${caseItem.CaseMasterID}`;
    const cleanCrimeNo = caseItem.CrimeNo.replace('Amengad/FIR/', 'FIR_');
    const welcomeMessageText = `I am now locking my investigative context strictly onto Case ${cleanCrimeNo} (Crime Category: ${caseItem.CrimeMajorHeadID}, suspect: ${caseItem.AccusedName || 'Shekhara'}). Any questions you ask now will be answered using only this case file. How can I assist you with this specific investigation?`;

    if (!activeSessions[caseSessionId]) {
      const initialMessages: Message[] = [
        {
          id: 'welcome',
          sender: 'ai',
          text: welcomeMessageText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
      ];

      setActiveSessions(prev => ({
        ...prev,
        [caseSessionId]: {
          title: `Case: ${cleanCrimeNo}`,
          messages: initialMessages,
          focusCaseId: caseItem.CaseMasterID,
          focusCrimeNo: caseItem.CrimeNo
        }
      }));

      setChatHistory(initialMessages);
      setSelectedHistoryId(caseSessionId);
    } else {
      loadHistorySession(caseSessionId);
    }
  };

  const handleLanguageChange = async (targetLang: 'en-IN' | 'hi-IN' | 'kn-IN') => {
    setSpeechLang(targetLang);
    if (chatHistory.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          targetLanguage: targetLang
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.translatedMessages) {
        setChatHistory(data.translatedMessages);
        if (selectedHistoryId) {
          setActiveSessions(prev => ({
            ...prev,
            [selectedHistoryId]: {
              ...prev[selectedHistoryId],
              messages: data.translatedMessages
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to translate chat history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const queryLower = inputText.toLowerCase().trim();
    
    // Resolve session ID synchronously to prevent race conditions
    let currentId = selectedHistoryId;
    if (!currentId) {
      currentId = `session-${Date.now()}`;
      setSelectedHistoryId(currentId);
    }
    
    // AI Security Guard: Reject off-topic non-criminological queries
    const blockedKeywords = ['virat kohli', 'tell me a joke', 'write python code', 'joke', 'python', 'write code', 'who is'];
    const isBlocked = blockedKeywords.some(keyword => {
      if (keyword === 'who is' && (queryLower.includes('kohli') || queryLower.includes('dhoni') || queryLower.includes('actor') || queryLower.includes('celebrity'))) return true;
      return queryLower.includes(keyword) && !queryLower.includes('accused') && !queryLower.includes('case') && !queryLower.includes('suspect');
    });

    if (isBlocked) {
      const blockedUserMsg: Message = {
        id: Math.random().toString(),
        sender: 'user',
        text: inputText,
        timestamp: new Date().toLocaleTimeString()
      };
      const blockedAiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: "This assistant is restricted to authorised criminal intelligence queries.",
        timestamp: new Date().toLocaleTimeString()
      };

      addMessageToActiveSession(blockedUserMsg, currentId);
      addMessageToActiveSession(blockedAiMsg, currentId);
      setInputText('');
      return;
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString()
    };

    addMessageToActiveSession(userMsg, currentId);
    setInputText('');
    await fetchChatResponse(userMsg.text, currentId, userMsg);
  };

  const fetchChatResponse = async (text: string, sessionId: string = selectedHistoryId, userMsg?: Message) => {
    setIsLoading(true);
    try {
      const langMapping = {
        'en-IN': 'English',
        'hi-IN': 'Hindi',
        'kn-IN': 'Kannada'
      };

      const sessionMsgs = activeSessions[sessionId]?.messages || [];
      const currentHistory = userMsg ? [...sessionMsgs.filter(m => m.id !== userMsg.id), userMsg] : sessionMsgs;
      
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      let response;
      let data;

      if (geminiApiKey) {
        const systemPrompt = `You are a helpful police assistant/intelligence tool for Karnataka State Police (KSP) Dristi.\nRole: ${role}.\nTarget Language: ${langMapping[speechLang as keyof typeof langMapping] || 'English'}.\n${activeSessions[sessionId]?.focusCaseId ? `Focus Case ID: ${activeSessions[sessionId]?.focusCaseId}.` : ''}\nPlease reply concisely and professionally in the requested target language.`;
        
        let contents = currentHistory.map(h => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }));
        
        const firstUserIndex = contents.findIndex(c => c.role === 'user');
        if (firstUserIndex > 0) {
          contents = contents.slice(firstUserIndex);
        } else if (contents.length === 0) {
          contents = [{ role: 'user', parts: [{ text: text }] }];
        }

        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          })
        });

        data = await response.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        data.text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentHistory.map(h => ({ sender: h.sender, text: h.text })),
            role: role,
            language: langMapping[speechLang as keyof typeof langMapping],
            focusCaseId: activeSessions[sessionId]?.focusCaseId,
            focusCrimeNo: activeSessions[sessionId]?.focusCrimeNo
          })
        });

        data = await response.json();
        if (data.error) throw new Error(data.error);
      }

      // Injecting the custom UI format mimicking Image 2's structure on pattern searches
      const isPatternQuery = text.toLowerCase().includes('pattern') || text.toLowerCase().includes('similar');
      
      let msgCases = data.dbData?.cases || [];
      let mo = [
        'Fake loan / job offer apps to lure victims',
        'KYC documents collected under false pretenses',
        'Money transferred to multiple mule accounts',
        'Communication through Telegram / WhatsApp'
      ];
      let insights = {
        firstOccurrence: 'May 2022',
        mostActivePeriod: 'Mar - Jun',
        primaryLocations: 'Whitefield, EC, Koramangala',
        financialImpact: '₹8.76 Cr'
      };

      const majorHead = msgCases[0]?.CrimeMajorHeadID || '';
      if (majorHead.toLowerCase().includes('narcotics') || majorHead.toLowerCase().includes('ndps')) {
        mo = [
          'Sourcing synthetic drugs via darknet/messaging apps',
          'Distribution near local Christ University / PG Hostels',
          'Transactions split into small crypto or digital wallets',
          'Involvement of inter-state transit couriers'
        ];
        insights = {
          firstOccurrence: 'Jan 2025',
          mostActivePeriod: 'Year-round',
          primaryLocations: 'Christ Uni Campus, Koramangala, SG Palya',
          financialImpact: '₹45 Lakhs'
        };
      } else if (majorHead.toLowerCase().includes('job') || majorHead.toLowerCase().includes('online')) {
        mo = [
          'Luring victims with rating/like tasks on Telegram',
          'Escalating tasks requiring investment deposits',
          'Withdrawing deposits through cooperative bank mule accounts',
          'Rapid converting of funds to crypto assets'
        ];
        insights = {
          firstOccurrence: 'Oct 2024',
          mostActivePeriod: 'Apr - Aug',
          primaryLocations: 'Whitefield, Indiranagar, HSR Layout',
          financialImpact: '₹2.12 Cr'
        };
      }
      
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        isCustomUI: isPatternQuery,
        cases: msgCases,
        modusOperandi: mo,
        keyInsights: insights
      };

      addMessageToActiveSession(aiMsg, sessionId);
      
      if (data.dbData) setDashboardData(data.dbData);
      if (data.patrolRoute) setPatrolRoute(data.patrolRoute);
      if (data.queryUsed) setCurrentZcql(data.queryUsed);
      if (data.leads) setCurrentLeads(data.leads);

    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event: any) => {
      const speechToText = event.results[0][0].transcript;
      if (!speechToText.trim()) return;

      setInputText(speechToText);

      // Add user message to state immediately
      const userMsg: Message = {
        id: Math.random().toString(),
        sender: 'user',
        text: speechToText,
        timestamp: new Date().toLocaleTimeString()
      };

      setChatHistory((prev) => [...prev, userMsg]);
      
      // Auto trigger AI execution
      await fetchChatResponse(speechToText);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const triggerPdfExport = () => {
    if (chatHistory.length === 0) {
      alert('Awaiting queries to compile dossier records.');
      return;
    }
    exportDossierToPDF(chatHistory, role);
  };



  // Secure login rendering portal
  if (false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800 relative font-sans overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-50 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-slate-100 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-lg relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-blue-450 to-blue-650 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold font-sans tracking-wide text-slate-850">KSP DRISTI</h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">SECURE INTEL INTEGRATOR SYSTEM</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-500 text-[10px]">OFFICER KGID NUMBER</label>
              <input
                type="text"
                required
                value={kgid}
                onChange={(e) => setKgid(e.target.value)}
                placeholder="Enter 7-digit KGID (e.g. 1898733)"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 text-[10px]">SECURITY ACCESS KEY</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter security access key"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 text-[10px]">ASSIGNED DUTY PROFILE</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-700 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none cursor-pointer"
              >
                <option value="Investigator">Investigator (Tactical Search)</option>
                <option value="Analyst">Analyst (Demographics & Trends)</option>
                <option value="Supervisor">Supervisor (Task Dispatch)</option>
                <option value="Policymaker">Policymaker (Governance)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-blue-650 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin"></span>
                  AUTHENTICATING_SESSION...
                </>
              ) : (
                "AUTHORIZE ACCESS"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-850 overflow-hidden font-sans">
      {/* 1. Sidebar Navigation (Left aligned to exactly mirror the mockup, collapses to w-16 and expands to w-64 on hover) */}
      <aside
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 overflow-y-auto overflow-x-hidden custom-scrollbar font-sans transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-16'}`}
      >
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-amber-400 flex items-center justify-center shadow-sm relative overflow-hidden shrink-0">
              <Shield size={14} className="text-amber-450 fill-amber-400/20" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 to-transparent"></div>
            </div>
            {isSidebarExpanded && (
              <div className="transition-opacity duration-300 whitespace-nowrap min-w-0">
                <span className="text-xs font-black tracking-wider text-slate-850 block leading-none">KSP DRISTI</span>
                <span className="text-[8.5px] text-slate-400 tracking-wide block mt-1 font-semibold leading-none">Intelligence Command Center</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <LayoutDashboard size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Overview Dashboard</span>}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'ai' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <Bot size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Crime Intelligence AI</span>}
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'map' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <Map size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Tactical Patrol Map</span>}
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'network' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <Network size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Network Analysis</span>}
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'cases' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <FolderOpen size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Case Management</span>}
            </button>
            <button
              onClick={() => setActiveTab('file-fir')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'file-fir' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <FileText size={14} className="shrink-0 text-emerald-500" />
              {isSidebarExpanded && <span>Digital FIR Portal</span>}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <BarChart2 size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Crime Analytics</span>}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'alerts' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <Bell size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Alerts & Notifications</span>}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'reports' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <FileText size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Reports</span>}
            </button>

            
            {/* Conditional Supervisor / Admin Access to secure records */}
            {(role === 'Supervisor' || role === 'Investigator') && (
              <button
                onClick={() => setActiveTab('records')}
                className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                  activeTab === 'records' ? 'bg-red-50 text-red-600 font-bold border-l-4 border-red-500' : 'text-red-500 hover:bg-red-50/50'
                } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
              >
                <Lock size={14} className="shrink-0" />
                {isSidebarExpanded && <span>Criminal Records</span>}
              </button>
            )}


          </nav>


        </div>

        {/* System status widget */}
        <div className={`p-4 border-t border-slate-200 bg-slate-50 flex items-center select-none text-[9.5px] transition-all ${isSidebarExpanded ? 'gap-3' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Shield size={14} className="text-blue-600" />
          </div>
          {isSidebarExpanded && (
            <div className="whitespace-nowrap transition-opacity duration-300">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold leading-none">
                System Status
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              <div className="text-slate-450 text-[8.5px] mt-0.5 font-medium">All Systems Operational</div>
              <div className="text-slate-400 text-[8px] mt-0.5 font-mono">
                System Time: {currentDate ? currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '09:42 AM'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main content container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header matching exactly Image 1 */}
        <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 font-sans text-xs">
          <div className="flex items-center gap-6 w-1/2">
            {/* Search Box */}
            <div className="relative w-full max-w-md">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, persons, vehicles, locations..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg py-2 pl-9 pr-12 text-[10.5px] text-slate-700 outline-none placeholder-slate-405"
              />
              <span className="absolute right-3 top-2.5 bg-white border border-slate-200 text-slate-400 text-[8px] px-1 py-0.2 rounded font-bold shadow-sm">⌘ K</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-[9.5px] font-mono leading-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
              <span className="text-emerald-600 font-bold uppercase text-[8px]">Live</span>
              <span>{currentDate ? currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '09:42:00 AM'}</span>
              <span className="text-slate-350">•</span>
              <span>{currentDate ? `${currentDate.getDate()} ${currentDate.toLocaleDateString('en-US', { month: 'short' })} ${currentDate.getFullYear()}` : '23 Jul 2025'}</span>
            </div>


            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[11px]">
                RK
              </div>
              <div className="text-[10px] text-left">
                <span className="font-bold text-slate-800 block leading-tight">Inspector Ravi K.</span>
                <span className="text-slate-400 text-[8.5px] block font-mono">Investigator Level 2</span>
              </div>
            </div>
          </div>
        </header>

        {/* Console content window */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] custom-scrollbar">
          
          {/* TOP CONTEXT HEADLINE STATUS BANNER */}
          {(() => {
            const currentSession = activeSessions[selectedHistoryId];
            const hasFocus = currentSession && currentSession.focusCaseId;
            const focusCrimeNo = currentSession && currentSession.focusCrimeNo;
            const cleanFocusCrimeNo = focusCrimeNo ? focusCrimeNo.replace('Amengad/FIR/', 'FIR_') : '';
            
            const displayingCases = dashboardData.cases;
            const isFiltered = displayingCases.length < 5;
            
            let bannerText = "ALL REGISTERED CRIMES & LIVE FEEDS";
            let subText = "Displaying the entire Karnataka State crime repository database and live beat patrol records.";
            let badge = "DATABASE_ACTIVE";
            let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";

            if (activeTab === 'ai' && hasFocus) {
              bannerText = `CHAT FOCUSED ON CASE: ${cleanFocusCrimeNo}`;
              subText = `AI Assistant is locked into answering questions strictly for Case ${cleanFocusCrimeNo}.`;
              badge = "AI_FOCUS_MODE";
              badgeColor = "bg-blue-50 text-blue-600 border-blue-200";
            } else if (activeTab === 'network') {
              if (isFiltered && displayingCases.length > 0) {
                const mainCase = displayingCases[0];
                const caseNoStr = mainCase.CrimeNo.replace('Amengad/FIR/', 'FIR_');
                bannerText = `RELATIONAL NETWORK GRAPH: CASE ${caseNoStr}`;
                subText = `Displaying the visual link analysis, money trails, and associate connections for Case ${caseNoStr} (${mainCase.CrimeMajorHeadID}).`;
              } else {
                bannerText = "GLOBAL SYNDICATE & ASSOCIATE LINK ANALYSIS";
                subText = "Displaying visual network connections and transaction flows mapped across all cases.";
              }
              badge = "NETWORK_GRAPH";
              badgeColor = "bg-blue-50 text-blue-600 border-blue-200";
            } else if (activeTab === 'map') {
              if (isFiltered && displayingCases.length > 0) {
                const mainCase = displayingCases[0];
                const caseNoStr = mainCase.CrimeNo.replace('Amengad/FIR/', 'FIR_');
                bannerText = `TACTICAL PATROL COORDINATES: CASE ${caseNoStr}`;
                subText = `Displaying the geocoded crime hotspot and calculated beat routing waypoints for Case ${caseNoStr}.`;
              } else {
                bannerText = "TACTICAL PATROL HOTSPOTS & BEAT PATROL PATHS";
                subText = "Displaying all active incident geolocations and automatically calculated patrol routes.";
              }
              badge = "MAP_ROUTING";
              badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
            } else if (isFiltered && displayingCases.length > 0) {
              const mainCase = displayingCases[0];
              const caseNoStr = mainCase.CrimeNo.replace('Amengad/FIR/', 'FIR_');
              const headText = displayingCases.length === 1 
                ? `CASE DETAIL: ${caseNoStr}` 
                : `FILTERED RESULTS: ${displayingCases.length} CASES`;
              const catText = displayingCases.length === 1
                ? `${mainCase.CrimeMajorHeadID} - ${mainCase.CrimeMinorHeadID || 'Active Inquiry'}`
                : `Crime Category: ${mainCase.CrimeMajorHeadID}`;
              
              bannerText = `${headText} (${catText})`;
              subText = displayingCases.length === 1
                ? `Isolating spatial beat map, associate node connections, and transaction records for ${caseNoStr}.`
                : `Displaying localized coordinates and financial analysis for matched records under ${mainCase.CrimeMajorHeadID}.`;
              badge = "FILTER_ISOLATION";
              badgeColor = "bg-amber-50 text-amber-600 border-amber-200";
            }

            let pulseDotColor = "bg-slate-400";
            if (badge === "AI_FOCUS_MODE") pulseDotColor = "bg-blue-500";
            else if (badge === "NETWORK_GRAPH") pulseDotColor = "bg-indigo-500";
            else if (badge === "MAP_ROUTING") pulseDotColor = "bg-emerald-500";
            else if (badge === "FILTER_ISOLATION") pulseDotColor = "bg-amber-500";

            return (
              <div className="mb-6 bg-gradient-to-r from-white via-slate-50/40 to-blue-50/10 border border-slate-200/80 rounded-2xl p-4.5 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.04),0_10px_30px_-10px_rgba(59,130,246,0.03)] border-l-4 border-l-blue-600 flex items-center justify-between gap-4 animate-fadeIn font-sans relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[8.5px] font-bold border px-2 py-0.5 rounded-full font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulseDotColor}`}></span>
                      {badge}
                    </span>
                    <h2 className="text-[12.5px] font-extrabold text-slate-800 tracking-tight leading-none uppercase font-sans">
                      {bannerText}
                    </h2>
                  </div>
                  <p className="text-slate-500 text-[10px] font-medium leading-normal flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono">➤</span>
                    {subText}
                  </p>
                </div>
                {isFiltered && (
                  <button 
                    onClick={() => {
                      fetch('/api/digital-fir')
                        .then(r => r.json())
                        .then(data => {
                          if (data.cases) {
                            setDashboardData(prev => ({
                              ...prev,
                              cases: data.cases,
                              accused: data.accused || prev.accused,
                              complainants: data.complainants || prev.complainants,
                              arrests: data.arrests || prev.arrests,
                              transactions: data.transactions || prev.transactions
                            }));
                          }
                        });
                    }} 
                    className="text-[9.5px] font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 px-3.5 py-2 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1 relative z-10"
                  >
                    ✕ Reset Filters
                  </button>
                )}
              </div>
            );
          })()}

          {/* TAB 1: COMMAND CENTER (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs">
              
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-base font-bold text-slate-800 font-sans">Good Morning, Inspector Ravi 👋</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5">Stay vigilant. We've got intelligence you can act on.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={triggerPdfExport} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 py-2 px-4 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1.5">
                    <Download size={11} /> Export Report
                  </button>
                  <button onClick={() => { setActiveTab('cases'); }} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-[10px] transition-all flex items-center gap-1.5">
                    <Plus size={11} /> New Investigation
                  </button>
                </div>
              </div>

              {/* 6 Metrics KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {_buildKpiCard('TOTAL FIRs', '12,842', '▲ 8.6% vs last 7 days', Colors.cyan)}
                {_buildKpiCard('HIGH RISK OFFENDERS', '146', '▲ 12.3% vs last 7 days', Colors.rose)}
                {_buildKpiCard('LIVE INCIDENTS', '28', '▲ 4.1% vs last 7 days', Colors.emerald)}
                {_buildKpiCard('EMERGING HOTSPOTS', '12', '▲ 15.7% vs last 7 days', Colors.blue)}
                {_buildKpiCard('CASES DIGITISED', '94%', '▲ 3.2% vs last 7 days', Colors.cyan)}
                {_buildKpiCard('STATIONS ONLINE', '41', 'Live Connectivity', Colors.blue)}
              </div>

              {/* Live Intel Feed (Now full width since Map is removed) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-12 glass-panel p-4 rounded-xl flex flex-col min-h-[220px]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-slate-700 text-[10.5px]">LIVE CRIME INTELLIGENCE FEED</span>
                    <button className="text-[9px] text-blue-600 hover:underline">View All</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10.5px]">
                    {intelFeed.map((item) => (
                      <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 flex flex-col justify-between animate-fadeIn">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              {item.time} •{' '}
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                item.priority === 'HIGH'
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : item.priority === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}>
                                {item.priority}
                              </span>
                            </span>
                            <span className="text-blue-600 font-semibold">Confidence: {item.confidence}%</span>
                          </div>
                          <div className="text-slate-700 font-sans leading-normal font-medium">
                            {item.text}
                          </div>
                          <div className="text-[8.5px] text-slate-400 flex items-center gap-1">
                            <span>Source:</span>
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold"
                            >
                              {item.sourceName} ↗
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          {item.mapTarget && (
                            <button
                              onClick={() => setActiveTab('map')}
                              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-655 px-2 py-0.5 rounded text-[8.5px] cursor-pointer"
                            >
                              View on Map
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab('ai');
                              setInputText(`Investigate latest threat alert: ${item.text}`);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 px-2 py-0.5 rounded text-[8.5px] font-bold cursor-pointer"
                          >
                            Investigate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row: Recent Cases */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Recent Cases */}
                <div className="lg:col-span-12 glass-panel p-4 rounded-xl flex flex-col h-[280px]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-slate-700 text-[10.5px]">RECENT CASES</span>
                    <button onClick={() => { setActiveTab('cases'); }} className="text-[9px] text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-[9.5px] table-fixed">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-150">
                          <th className="pb-1.5 w-[16%]">FIR No</th>
                          <th className="pb-1.5 w-[42%]">Crime</th>
                          <th className="pb-1.5 w-[14%]">District</th>
                          <th className="pb-1.5 w-[10%]">Priority</th>
                          <th className="pb-1.5 w-[10%]">Officer</th>
                          <th className="pb-1.5 w-[8%] text-right pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.cases.slice(0, 5).map((c) => (
                          <tr key={c.CaseMasterID} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer animate-fadeIn" onClick={() => setSelectedCase(c)}>
                            <td className="py-2 text-slate-800 font-bold truncate pr-2">{c.CrimeNo.replace('Amengad/FIR/', 'FIR_')}</td>
                            <td className="py-2 text-slate-655 truncate pr-4" title={c.CrimeMajorHeadID}>{c.CrimeMajorHeadID}</td>
                            <td className="py-2 text-slate-500 truncate pr-2">{getDistrictFromCrimeNo(c.CrimeNo)}</td>
                            <td className="py-2">
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-50 text-red-600 border border-red-200 font-bold inline-block leading-none">High</span>
                            </td>
                            <td className="py-2 text-slate-600 truncate pr-2">SI Kavya M.</td>
                            <td className="py-2 text-blue-600 font-bold text-right pr-2">Under Inv.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRIME INTELLIGENCE AI */}
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-112px)] min-h-0 animate-fadeIn text-xs">
              
              {/* Left sidebar: Conversations Folder (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar shrink-0">
                <button onClick={() => { setChatHistory([]); setSelectedHistoryId(''); }} className="w-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 font-bold py-2.5 rounded-xl text-center text-slate-600 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <Plus size={13} /> New Conversation
                </button>

                <div className="glass-panel p-4 rounded-xl flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block">TODAY</span>
                    <div className="space-y-1 text-[10px] font-mono">
                      {(() => {
                        const preConfiguredIds = ['fake-loan', 'cctv-lookup', 'money-trail', 'suspect-profiling', 'similar-cases', 'network-analysis', 'phone-tracking', 'bank-accounts', 'vehicle-tracking'];
                        const dynamicItems = Object.keys(activeSessions)
                          .filter(id => !preConfiguredIds.includes(id))
                          .reverse()
                          .map(id => ({ id, title: activeSessions[id]?.title || 'New Investigation' }));
                        
                        return [
                          ...dynamicItems,
                          { id: 'fake-loan', title: 'Fake loan app fraud pattern...' },
                          { id: 'cctv-lookup', title: 'CCTV lookup - Whitefield' },
                          { id: 'money-trail', title: 'Money trail analysis' },
                          { id: 'suspect-profiling', title: 'Suspect profiling - Ramesh' }
                        ].filter(item => activeSessions[item.id] !== undefined).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => loadHistorySession(item.id)}
                            className={`group p-2 rounded cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                              selectedHistoryId === item.id
                                ? 'bg-blue-50 border border-blue-100 text-blue-600 font-semibold shadow-sm'
                                : 'text-slate-655 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            <span className="truncate flex-1">{item.title}</span>
                            <button
                              onClick={(e) => deleteHistorySession(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 rounded transition-all cursor-pointer shrink-0 border-0 bg-transparent outline-none"
                              title="Delete Chat History"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block">YESTERDAY</span>
                    <div className="space-y-1 text-[10px] font-mono">
                      {[
                        { id: 'similar-cases', title: 'Similar cases - 2024' },
                        { id: 'network-analysis', title: 'Network analysis - Bengaluru' },
                        { id: 'phone-tracking', title: 'Phone number tracking' }
                      ].filter(item => activeSessions[item.id] !== undefined).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => loadHistorySession(item.id)}
                          className={`group p-2 rounded cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                            selectedHistoryId === item.id
                              ? 'bg-blue-50 border border-blue-100 text-blue-600 font-semibold shadow-sm'
                              : 'text-slate-655 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          <span className="truncate flex-1">{item.title}</span>
                          <button
                            onClick={(e) => deleteHistorySession(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 rounded transition-all cursor-pointer shrink-0 border-0 bg-transparent outline-none"
                            title="Delete Chat History"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block">PREVIOUS 7 DAYS</span>
                    <div className="space-y-1 text-[10px] font-mono">
                      {[
                        { id: 'bank-accounts', title: 'Bank accounts linked' },
                        { id: 'vehicle-tracking', title: 'Vehicle tracking history' }
                      ].filter(item => activeSessions[item.id] !== undefined).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => loadHistorySession(item.id)}
                          className={`group p-2 rounded cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                            selectedHistoryId === item.id
                              ? 'bg-blue-50 border border-blue-100 text-blue-600 font-semibold shadow-sm'
                              : 'text-slate-655 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          <span className="truncate flex-1">{item.title}</span>
                          <button
                            onClick={(e) => deleteHistorySession(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 rounded transition-all cursor-pointer shrink-0 border-0 bg-transparent outline-none"
                            title="Delete Chat History"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Main Chat Panel (9 Cols - expanded since Right Panel is removed) */}
              <div className="lg:col-span-9 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
                
                {/* Header state bar matching Image 2 */}
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-[10px] font-mono text-slate-650">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-slate-800 font-bold">AI Assistant</span>
                    <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-200 px-1 py-0.2 rounded font-bold uppercase">Powered by Secure LLM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={triggerPdfExport}
                      className="bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-sans font-bold py-1 px-2.5 rounded-lg text-[9px] transition-all flex items-center gap-1 active:scale-[0.98] shadow-sm cursor-pointer"
                    >
                      <Download size={10} /> Export Chat (PDF)
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Secure Mode:</span>
                      <span className="text-emerald-600 font-bold">Active</span>
                    </div>
                  </div>
                </div>


                {/* Dialog Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 mt-16 font-mono">
                      <div className="w-12 h-12 rounded-full border border-dashed border-blue-300 bg-blue-50 flex items-center justify-center text-blue-400">
                        <Bot size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Conversational Intelligence Core</p>
                        <p className="text-[9.5px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                          Ask about cases, similarities, suspect profiles, CCTV vehicle tracking, and money trails. RESTRICTED ACCESS.
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[90%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <span className="text-[9.5px] font-sans font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                          {msg.sender === 'user' ? (
                            <>
                              <User size={11} className="text-slate-400" />
                              <span>YOU</span>
                              <span className="text-slate-300 font-normal">•</span>
                              <span className="text-slate-400 font-normal font-mono">{msg.timestamp}</span>
                            </>
                          ) : (
                            <>
                              <Bot size={11} className="text-blue-500 fill-blue-500/10" />
                              <span className="text-blue-600 font-extrabold">TACTICAL INTELLIGENCE AI</span>
                              <span className="text-slate-300 font-normal">•</span>
                              <span className="text-slate-400 font-normal font-mono">{msg.timestamp}</span>
                            </>
                          )}
                        </span>
                        
                        {/* Custom UI render matching Image 2 for pattern searches */}
                        {msg.isCustomUI ? (
                          <div className="p-5 bg-slate-50 border border-slate-200/80 text-slate-850 rounded-2xl rounded-tl-none max-w-3xl shadow-sm border-l-4 border-l-blue-600 space-y-4 leading-relaxed font-sans">
                            <p className="font-sans text-[12px] font-semibold text-slate-800">{msg.text}</p>
                            
                            {/* Inner table */}
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                              <table className="w-full text-left text-[9.5px] border-collapse">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-200 bg-slate-50 font-bold">
                                    <th className="p-2">FIR No.</th>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Location</th>
                                    <th className="p-2">Crime Type</th>
                                    <th className="p-2">Similarity</th>
                                    <th className="p-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(msg.cases || []).slice(0, 3).map((c: any, index: number) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                                      <td className="p-2 text-slate-800 font-bold">{c.CrimeNo.replace('Amengad/FIR/', 'FIR_')}</td>
                                      <td className="p-2 text-slate-500">
                                        {c.IncidentFromDate ? new Date(c.IncidentFromDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '24 Jul 2026'}
                                      </td>
                                      <td className="p-2 text-slate-500">{c.PoliceStationID === '1245' ? 'Bagalkot' : c.PoliceStationID || 'Bengaluru'}</td>
                                      <td className="p-2 text-slate-700 truncate max-w-[120px]">{c.CrimeMajorHeadID}</td>
                                      <td className="p-2 text-blue-600 font-bold">{93 - index * 2}%</td>
                                      <td className="p-2 text-slate-500">
                                        {index === 2 ? (
                                          <span className="text-emerald-600 font-bold">Conviction</span>
                                        ) : index === 1 ? (
                                          'Investigation'
                                        ) : (
                                          'Chargesheet Filed'
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="p-2 text-center border-t border-slate-200">
                                <button onClick={() => { setActiveTab('cases'); }} className="text-blue-600 text-[8.5px] font-bold hover:underline">View All {msg.cases?.length || 3} Cases</button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                              {/* MO */}
                              <div className="space-y-1">
                                <div className="text-[9.5px] font-bold text-slate-500 border-b border-slate-200 pb-0.5">Common Modus Operandi</div>
                                <ul className="space-y-1 text-[9px] text-slate-655 list-inside list-disc">
                                  {(msg.modusOperandi || []).map((moItem, index) => (
                                    <li key={index}>{moItem}</li>
                                  ))}
                                </ul>
                              </div>
                              {/* Insights */}
                              {msg.keyInsights && (
                                <div className="space-y-1 bg-blue-50/30 p-2 border border-blue-100 rounded-lg">
                                  <div className="text-[9.5px] font-bold text-slate-500 border-b border-slate-200 pb-0.5">Key Insights</div>
                                  <div className="text-[8.5px] text-slate-650 space-y-1">
                                    <div>First occurrence: <strong className="text-slate-800">{msg.keyInsights.firstOccurrence}</strong></div>
                                    <div>Most active period: <strong className="text-slate-800">{msg.keyInsights.mostActivePeriod}</strong></div>
                                    <div>Primary locations: <strong className="text-slate-800">{msg.keyInsights.primaryLocations}</strong></div>
                                    <div>Total financial impact: <strong className="text-red-655 font-bold">{msg.keyInsights.financialImpact}</strong></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-250 text-[9px] font-bold text-slate-600 select-none">
                              <button onClick={() => { setActiveTab('network'); }} className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded flex items-center gap-1 transition-all"><Network size={9} /> Show network graph</button>
                              <button onClick={() => { setInputText("Profile main suspect"); }} className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded flex items-center gap-1 transition-all"><User size={9} /> Profile main suspect</button>
                              <button onClick={triggerPdfExport} className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded flex items-center gap-1 transition-all"><Download size={9} /> Generate PDF report</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`p-4 rounded-2xl text-[12px] leading-relaxed shadow-sm font-sans ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-semibold rounded-tr-none max-w-lg shadow-md shadow-blue-600/10'
                                : 'bg-slate-50 border border-slate-200/80 text-slate-850 rounded-2xl rounded-tl-none max-w-3xl border-l-4 border-l-blue-600 shadow-sm'
                            }`}
                          >
                            {msg.sender === 'user' ? (
                              <p className="text-[12.5px] font-medium text-white leading-relaxed">{msg.text}</p>
                            ) : (
                              formatMessageText(msg.text)
                            )}
                          </div>
                        )}

                      </div>
                    ))
                  )}

                  {isLoading && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                      <span>INTERROGATING_ZCQL_STORES...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                    <span>SELECT ACTIVE CHATBOT LANGUAGE:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('en-IN')}
                        className={`px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          speechLang === 'en-IN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('hi-IN')}
                        className={`px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          speechLang === 'hi-IN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                      >
                        हिन्दी (Hindi)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange('kn-IN')}
                        className={`px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          speechLang === 'kn-IN' ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                      >
                        ಕನ್ನಡ (Kannada)
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2 relative items-center">
                    <div className="relative flex-1">
                      <Layers size={14} className="absolute left-3.5 top-3.5 cursor-pointer text-slate-400 hover:text-slate-600" />
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask about cases, suspects, patterns, locations..."
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-10 py-2.5 text-[10.5px] text-slate-700 outline-none placeholder-slate-400 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-2 top-1.5 p-1.5 border rounded-lg transition-colors ${isListening ? 'bg-rose-50 border-rose-300 text-rose-500' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'}`}
                      >
                        {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-sm hover:shadow active:scale-95"
                    >
                      <Send size={11} /> Send
                    </button>
                  </form>
                  <div className="text-[8px] text-slate-400 text-center font-mono">
                    AI responses are based on authorized data sources only. All queries are logged and monitored.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TACTICAL PATROL MAP */}
          {activeTab === 'map' && (
            <div className="space-y-4 h-[calc(100vh-112px)] min-h-0 flex flex-col animate-fadeIn text-xs font-mono">
              
              {/* Map mini KPI row */}
              <div className="grid grid-cols-5 gap-3 shrink-0 text-center">
                <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Live Incidents</div>
                  <div className="text-sm font-bold text-red-650 mt-0.5">28</div>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Deployed Units</div>
                  <div className="text-sm font-bold text-blue-600 mt-0.5">156</div>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Patrols Active</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">42</div>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Response Time (AVG)</div>
                  <div className="text-sm font-bold text-amber-600 mt-0.5">08:42 min</div>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Area Coverage</div>
                  <div className="text-sm font-bold text-blue-650 mt-0.5">78%</div>
                </div>
              </div>

              {/* Map body split */}
              <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                {/* Left Col: Map */}
                <div className="col-span-9 rounded-2xl overflow-hidden glass-panel relative">
                  <CrimeMap
                    incidents={dashboardData.cases}
                    patrolRoute={patrolRoute}
                    activeIncidentId={selectedIncidentId}
                    onSelectIncident={(id) => setSelectedIncidentId(id)}
                  />
                </div>

                {/* Right Col: Filters sidebar */}
                <div className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0 select-none">
                  <div className="glass-panel p-4 rounded-xl space-y-4">
                    <span className="font-bold text-slate-700 border-b border-slate-100 pb-2 block uppercase text-[10px]">MAP FILTERS</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase block">District Selection</label>
                      <select className="w-full bg-white border border-slate-200 rounded p-2 text-slate-700 outline-none">
                        <option>All Districts</option>
                        <option>Bengaluru Urban</option>
                        <option>Mysuru</option>
                        <option>Bagalkot</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase block">Crime Category</label>
                      <select className="w-full bg-white border border-slate-200 rounded p-2 text-slate-700 outline-none">
                        <option>All Crime Types</option>
                        <option>Cyber Crime</option>
                        <option>Theft / Burglaries</option>
                        <option>NDPS Narcotics</option>
                      </select>
                    </div>

                    <button className="w-full text-center py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg font-sans text-[10px] transition-all cursor-pointer">
                      Apply Filters
                    </button>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="glass-panel p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-[9.5px]">
                    <span className="font-bold text-blue-700 uppercase tracking-wider block mb-1">💡 AI PATROL SUGGESTION</span>
                    <div className="font-bold text-slate-800">Deploy Unit HSR-03 to Electronic City.</div>
                    <div className="text-slate-600 mt-1 leading-normal">
                      Reason: Crime probability increased by 27% in the past 2 hours. Repeat offender activity detected nearby.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: NETWORK ANALYSIS */}
          {activeTab === 'network' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs">
              
              {/* Network metrics row matching Image 5 */}
              <div className="grid grid-cols-6 gap-3 text-center">
                <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Total Connections</div>
                  <div className="text-base font-bold text-blue-600 mt-0.5">23</div>
                </div>
                <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">People Involved</div>
                  <div className="text-base font-bold text-blue-600 mt-0.5">7</div>
                </div>
                <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">FIRs Linked</div>
                  <div className="text-base font-bold text-red-650 mt-0.5">9</div>
                </div>
                <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Financial Links</div>
                  <div className="text-base font-bold text-emerald-600 mt-0.5">14</div>
                </div>
                <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Devices Linked</div>
                  <div className="text-base font-bold text-blue-500 mt-0.5">6</div>
                </div>
                <div className="bg-white p-2.5 border border-slate-200 rounded-xl shadow-sm text-slate-800">
                  <div className="text-[8px] text-slate-500 uppercase">Risk Score (Network)</div>
                  <div className="text-base font-bold text-red-650 mt-0.5">82/100</div>
                </div>
              </div>

              {/* Main split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* SVG Visual graph */}
                <div className="lg:col-span-8 h-[440px] w-full rounded-2xl overflow-hidden relative border border-slate-200 bg-white flex flex-col p-1.5">
                  <NetworkGraph
                    accusedList={dashboardData.accused}
                    cases={dashboardData.cases}
                    transactions={dashboardData.transactions}
                  />
                </div>

                {/* Right panel inspector */}
                <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0 select-none">
                  
                  {/* Selected Suspect Info */}
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-500 text-[10px]">SELECTED ENTITY</span>
                      <span className="text-[8.5px] bg-red-50 text-red-600 border border-red-200 font-bold px-1.5 rounded">High Risk</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        RN
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Rakesh N.</div>
                        <div className="text-[9px] text-slate-450 mt-0.5">ID: RN-7821 • Aliases: Rakesh, Raku</div>
                      </div>
                    </div>
                    <div className="text-[9.5px] text-slate-600 space-y-1">
                      <div>Risk Score: <strong className="text-red-650 font-bold">82 / 100</strong></div>
                      <div>Total Connections: <strong className="text-slate-800">23</strong></div>
                      <div>Linked FIRs: <strong className="text-slate-800">9</strong></div>
                      <div>Active since: <strong className="text-slate-800">Jan 2022</strong></div>
                    </div>
                  </div>

                  {/* Network timeline log */}
                  <div className="glass-panel p-4 rounded-xl space-y-2.5">
                    <span className="font-bold text-slate-500 text-[9px] uppercase border-b border-slate-100 pb-1 block">NETWORK TIMELINE</span>
                    <div className="space-y-2 text-[9px] text-slate-600">
                      <div className="flex gap-2">
                        <span className="text-blue-605 font-bold">2023-07</span>
                        <span>First FIR (2031/23) Filed</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-605 font-bold">2023-11</span>
                        <span>New Phone Activated (98451 22667)</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-605 font-bold">2024-02</span>
                        <span>Vehicle KA 09 MJ 4501 Used</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-605 font-bold">2025-07</span>
                        <span>Recent Activity Detected in cyber cell</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 5: CASE MANAGEMENT */}
          {activeTab === 'cases' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs">
              <div className="glass-panel p-4 rounded-xl">
                <div className="text-[10px] font-bold text-slate-700 border-b border-slate-100 pb-2 mb-3">
                  CASE OVERVIEW REGISTRY
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10.5px]">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-250">
                        <th className="pb-2">Case Number</th>
                        <th className="pb-2">Officer</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Priority</th>
                        <th className="pb-2">District</th>
                        <th className="pb-2">Crime Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.cases.slice(0, 5).map((c) => (
                        <tr key={c.CaseMasterID} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedCase(c)}>
                          <td className="py-2.5 text-slate-800 font-bold">{c.CrimeNo}</td>
                          <td className="py-2.5 text-slate-600">SI Kavya M.</td>
                          <td className="py-2.5 text-blue-600 font-bold">Under Investigation</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-50 text-red-600 border border-red-200 font-bold">High</span>
                          </td>
                          <td className="py-2.5 text-slate-500">{getDistrictFromCrimeNo(c.CrimeNo)}</td>
                          <td className="py-2.5 text-slate-650">{c.CrimeMajorHeadID}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CRIME ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs">
              <div className="p-4 bg-blue-50/40 border border-blue-200/50 rounded-2xl shadow-sm">
                <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                  AI Analytics Executive Summary
                </h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  AI Summary: Cyber fraud has increased by 18% compared to last month, with Bengaluru Urban and Mysuru accounting for 62% of reported incidents. Weekend evenings between 6 PM and 10 PM remain the highest-risk period. The model recommends increasing cyber patrols in these districts and monitoring three newly identified fraud networks.
                </p>
              </div>
              <ProfilingPanel
                accusedList={dashboardData.accused}
                complainants={dashboardData.complainants}
                arrests={dashboardData.arrests}
              />
            </div>
          )}

          {/* TAB 7: PROTECTED CRIMINAL RECORDS */}
          {activeTab === 'records' && (role === 'Supervisor' || role === 'Investigator') && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs">
              <div className="p-4 bg-red-50 border border-red-200/50 rounded-2xl shadow-sm">
                <div className="text-xs font-bold text-red-655 flex items-center gap-2 mb-1.5 uppercase">
                  Restricted Information Panel
                </div>
                <p className="text-slate-600 text-[10.5px] leading-relaxed">
                  Restricted Information: Access to criminal records is logged and monitored. Unauthorised access is prohibited.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
                <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2">CRIMINAL PROFILES DIRECTORY</span>
                
                <div className="grid grid-cols-2 gap-4 text-[10.5px] text-slate-600">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-800">Kiran Kumar</div>
                    <div>Biometrics: <strong className="text-emerald-600">REGISTERED (FINGERPRINTS)</strong></div>
                    <div>Aadhaar Ref: XXXX-XXXX-2194</div>
                    <div>Crime History: 3 repeat cases flagged</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-800">Lokesha alias 'Punda'</div>
                    <div>Biometrics: <strong className="text-emerald-600">REGISTERED (FINGERPRINTS)</strong></div>
                    <div>Aadhaar Ref: XXXX-XXXX-8422</div>
                    <div>Crime History: 5 repeat cases flagged</div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* TAB 9: ALERTS & NOTIFICATIONS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6 animate-fadeIn text-xs">
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2 block">
                  ALERTS & NOTIFICATIONS CENTER
                </span>
                <div className="space-y-3 font-mono">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-800 text-[11px]">Critical Hotspot Alert</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">High crime probability increase in Koramangala block 4.</div>
                    </div>
                    <span className="text-[9px] font-bold text-red-655 bg-white border border-red-200 px-2 py-1 rounded-lg">High Risk</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-800 text-[11px]">Repeat Offender Activity</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Suspect Lokesha alias 'Punda' tagged near visual scanner EC-04.</div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-655 bg-white border border-amber-200 px-2 py-1 rounded-lg">Moderate Risk</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: REPORTS GENERATION */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fadeIn text-xs font-sans">
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2 block">
                  TACTICAL INTELLIGENCE REPORTS
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-sm">Monthly Cyber Crime Dossier</div>
                    <p className="text-slate-500 text-[10px]">Contains full relational graphs, linked bank logs, and suspect MO patterns.</p>
                    <button onClick={triggerPdfExport} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded text-[10px] cursor-pointer">Generate Report</button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="font-bold text-slate-800 text-sm">Daily Command Briefing</div>
                    <p className="text-slate-500 text-[10px]">Overview of live incidents, response times, and active patrol route audits.</p>
                    <button onClick={triggerPdfExport} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded text-[10px] cursor-pointer">Generate Report</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DIGITAL FIR FILING PORTAL */}
          {activeTab === 'file-fir' && (
            <div className="space-y-6 animate-fadeIn text-xs font-sans">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-base font-bold text-slate-800">Digital FIR Registration</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5">Secure Electronic FIR Lodgement System • Karnataka Police Department</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[9.5px]">
                  <Shield size={12} /> Encrypted Session Active
                </div>
              </div>

              {firStatusMessage === 'success' && newFirDetails && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-[11px]">
                    <Shield size={14} className="text-emerald-600" />
                    FIR FILED SUCCESSFULLY TO NATIONAL CRIME RECORDS DATABASE
                  </div>
                  <div className="text-[10px] font-mono leading-relaxed bg-white/70 border border-emerald-100 p-3 rounded-lg space-y-1">
                    <div><strong>FIR NUMBER:</strong> {newFirDetails.CrimeNo}</div>
                    <div><strong>CASE MASTER ID:</strong> {newFirDetails.CaseMasterID}</div>
                    <div><strong>COURT CASE NO:</strong> {newFirDetails.CaseNo}</div>
                    <div><strong>STATUS:</strong> Pending Assignment to Circle Inspector</div>
                    <div><strong>TIMESTAMP:</strong> {new Date().toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFirStatusMessage(null);
                        setActiveTab('dashboard');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer"
                    >
                      View on Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setFirStatusMessage(null);
                        setActiveTab('ai');
                        setInputText(`Run intelligence network search on case ${newFirDetails.CaseMasterID} facts: ${newFirDetails.BriefFacts}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer"
                    >
                      Investigate with Crime AI
                    </button>
                  </div>
                </div>
              )}

              {firStatusMessage === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 font-bold">
                  <AlertTriangle size={14} className="text-red-655" />
                  ERROR: Please fill in all required fields (Complainant Name & Incident Brief Facts).
                </div>
              )}

              <form onSubmit={handleFileFir} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Form Panel: Information Wizard (8 Cols) */}
                <div className="lg:col-span-8 glass-panel p-5 rounded-2xl space-y-5">
                  <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2 block">
                    FORM I: STATUTORY PARTICULARS OF INCIDENT
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Complainant Name */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">COMPLAINANT FULL NAME *</label>
                      <input
                        type="text"
                        required
                        value={firComplainant}
                        onChange={(e) => setFirComplainant(e.target.value)}
                        placeholder="Enter full name of informant/complainant"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] outline-none"
                      />
                    </div>

                    {/* Complainant Age & Gender */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-500 text-[10px] font-bold">AGE</label>
                        <input
                          type="number"
                          value={firComplainantAge}
                          onChange={(e) => setFirComplainantAge(e.target.value)}
                          placeholder="e.g. 34"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-500 text-[10px] font-bold">GENDER</label>
                        <select
                          value={firComplainantGender}
                          onChange={(e) => setFirComplainantGender(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] outline-none cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Complainant Occupation */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">OCCUPATION / EMPLOYMENT</label>
                      <input
                        type="text"
                        value={firComplainantOccupation}
                        onChange={(e) => setFirComplainantOccupation(e.target.value)}
                        placeholder="e.g. Merchant, IT Engineer, Student"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] outline-none"
                      />
                    </div>

                    {/* Incident Date */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">DATE & TIME OF OCCURRENCE *</label>
                      <input
                        type="date"
                        required
                        value={firIncidentDate}
                        onChange={(e) => setFirIncidentDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Incident Brief Facts */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 text-[10px] font-bold">BRIEF FACTS & STATEMENT OF CRIME *</label>
                    <textarea
                      required
                      rows={5}
                      value={firBriefFacts}
                      onChange={(e) => setFirBriefFacts(e.target.value)}
                      placeholder="Describe the incident in detail, listing timestamps, loss details, modus operandi, and sequence of events..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-[11px] outline-none resize-none font-sans"
                    />
                  </div>
                </div>

                {/* Right Form Panel: Classification & Suspects (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div className="glass-panel p-5 rounded-2xl space-y-4">
                    <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2 block">
                      FORM II: CRIME CLASSIFICATION
                    </span>

                    {/* Major Head */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">MAJOR CRIME HEAD</label>
                      <select
                        value={firMajorHead}
                        onChange={(e) => setFirMajorHead(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-[11px] outline-none cursor-pointer font-sans"
                      >
                        <option value="CYBER CRIME - ONLINE FINANCIAL FRAUD">CYBER CRIME - ONLINE FINANCIAL FRAUD</option>
                        <option value="NDPS ACT (NARCOTICS)">NDPS ACT (NARCOTICS)</option>
                        <option value="ONLINE JOB FRAUD">ONLINE JOB FRAUD</option>
                        <option value="KIDNAPPING & ABDUCTION">KIDNAPPING & ABDUCTION</option>
                        <option value="ORGANIZED CRYPTO SCAM">ORGANIZED CRYPTO SCAM</option>
                        <option value="THEFT & BURGLARY">THEFT & BURGLARY</option>
                      </select>
                    </div>

                    {/* Minor Head */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">MINOR CRIME HEAD</label>
                      <input
                        type="text"
                        value={firMinorHead}
                        onChange={(e) => setFirMinorHead(e.target.value)}
                        placeholder="e.g. Loan app extortion, Phishing"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-[11px] outline-none"
                      />
                    </div>

                    {/* District */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">POLICE DISTRICT / COMMISSIONERATE</label>
                      <select
                        value={firDistrict}
                        onChange={(e) => setFirDistrict(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-[11px] outline-none cursor-pointer font-sans"
                      >
                        <option value="Bengaluru City">Bengaluru City</option>
                        <option value="Mysuru City">Mysuru City</option>
                        <option value="Hubballi-Dharwad City">Hubballi-Dharwad City</option>
                        <option value="Mangaluru City">Mangaluru City</option>
                        <option value="Belagavi City">Belagavi City</option>
                        <option value="Bagalkot">Bagalkot</option>
                      </select>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl space-y-4">
                    <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2 block">
                      FORM III: SUSPECT DETAILS
                    </span>

                    {/* Suspect Name */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">ACCUSED/SUSPECT NAME</label>
                      <input
                        type="text"
                        value={firSuspectName}
                        onChange={(e) => setFirSuspectName(e.target.value)}
                        placeholder="Leave blank if 'Unknown'"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-[11px] outline-none"
                      />
                    </div>

                    {/* Suspect Physical/Vehicle Details */}
                    <div className="space-y-1.5">
                      <label className="text-slate-500 text-[10px] font-bold">VEHICLE, BANK ACCOUNTS OR ALIASES</label>
                      <input
                        type="text"
                        value={firSuspectDetails}
                        onChange={(e) => setFirSuspectDetails(e.target.value)}
                        placeholder="e.g. Silver SUV KA-01-MJ-4392, HDFC ***091"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-[11px] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-650 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Plus size={14} /> File Official Digital FIR
                  </button>
                </div>

              </form>
            </div>
          )}



          {/* Modal details inspector for case files */}
          {selectedCase && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5 select-none font-sans text-xs">
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedCase(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Header */}
                <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded self-start uppercase tracking-wider">
                    Case Dossier Records
                  </span>
                  <h2 className="text-base font-bold text-slate-800 mt-1">
                    FIR Case: {selectedCase.CrimeNo}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Case Master ID: {selectedCase.CaseMasterID} • Charge Sheet Ref: {selectedCase.CaseNo || 'Pending'}
                  </p>
                </div>

                {/* Body Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Column: Metadata */}
                  <div className="space-y-4">
                    
                    {/* General incident facts */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                      <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Incident Details</span>
                      <div className="space-y-1 text-slate-655">
                        <div>Crime Head: <strong className="text-slate-850">{selectedCase.CrimeMajorHeadID}</strong></div>
                        <div>Status: <span className="text-blue-605 font-bold">Under Investigation</span></div>
                        <div>Priority Level: <span className="text-red-600 font-bold bg-red-50 px-1 py-0.2 rounded border border-red-150">High</span></div>
                        <div>District Location: <strong className="text-slate-850">Bagalkot Division</strong></div>
                        <div>Incident Date: <strong className="text-slate-850">{selectedCase.IncidentFromDate ? new Date(selectedCase.IncidentFromDate).toLocaleDateString('en-GB') : 'N/A'}</strong></div>
                        <div>GPS Coords: <strong className="text-slate-850">{selectedCase.latitude?.toFixed(4)}, {selectedCase.longitude?.toFixed(4)}</strong></div>
                      </div>
                    </div>

                    {/* Complainant details */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                      <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Complainant Profile</span>
                      {(() => {
                        const comp = dashboardData.complainants.find(c => c.CaseMasterID === selectedCase.CaseMasterID);
                        if (!comp) return <div className="text-slate-400 italic">No linked complainant file found</div>;
                        return (
                          <div className="space-y-1 text-slate-655">
                            <div>Name: <strong className="text-slate-850">{comp.ComplainantName}</strong></div>
                            <div>Demographics: <strong className="text-slate-855">{comp.GenderID}, {comp.AgeYear} Years</strong></div>
                            <div>Occupation: <strong className="text-slate-855">{comp.OccupationID || 'Private Sector'}</strong></div>
                            <div>Social Ref: <strong className="text-slate-855">{comp.ReligionID} • {comp.CasteID || 'General'}</strong></div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                  {/* Right Column: Case linkage networks */}
                  <div className="space-y-4">
                    
                    {/* Accused & Suspect links */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                      <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Accused / Suspects</span>
                      {(() => {
                        const txn = dashboardData.transactions.find(t => t.CaseMasterID === selectedCase.CaseMasterID);
                        const acc = dashboardData.accused.find(a => a.CaseMasterID === selectedCase.CaseMasterID);
                        const suspectName = txn ? txn.SuspectName : (acc ? acc.AccusedName : 'Suspect_1_1');
                        return (
                          <div className="space-y-1 text-slate-655">
                            <div>Primary Suspect: <strong className="text-slate-850">{suspectName}</strong></div>
                            <div>Custody Status: <span className="text-amber-600 font-bold">Investigating Link</span></div>
                            {txn && (
                              <div className="mt-1 pt-1.5 border-t border-slate-200/65 text-[10px]">
                                <div className="font-bold text-red-600 leading-none">Financial Mule Trail Linked:</div>
                                <div className="text-slate-500 mt-1">Transferred: <span className="font-bold text-red-655">₹{txn.Amount.toLocaleString('en-IN')}</span></div>
                                <div className="text-slate-500 mt-0.5">Target Account: <span className="font-mono">{txn.TargetAccount}</span></div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Legal Sections applied */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                      <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block">Legal Sections & Acts</span>
                      <div className="space-y-1 text-slate-655">
                        <div className="font-bold text-slate-850">
                          {selectedCase.CrimeMajorHeadID === 'POCSO' 
                            ? 'POCSO Act, 2012' 
                            : 'Karnataka Police Act, 1963'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono leading-tight">
                          {selectedCase.CrimeMajorHeadID === 'POCSO' 
                            ? 'Sec. 12 - Sexual harassment of child, Sec. 306 IPC, Sec. 363 IPC' 
                            : 'Sec. 87 - Gaming in public street, Sec. 78(3) - Keeping common gaming house'}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Brief Facts Details */}
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-1">
                  <span className="font-bold text-[9px] text-blue-600 uppercase tracking-wider block">Official Case facts (Brief Facts)</span>
                  <p className="text-slate-700 leading-relaxed text-[10.5px]">
                    {selectedCase.BriefFacts || 'No case facts statement filed in registry database.'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-[10.5px]"
                  >
                    Close Case File
                  </button>
                  <button
                    onClick={() => handleChatAboutCase(selectedCase)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-[10.5px] flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <Bot size={13} /> Chat about Case
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}

// Sub-HUD KPI Generator card
function _buildKpiCard(label: string, value: string, subtitle: string, color: Color) {
  let iconColor = 'text-blue-600 bg-blue-50 border border-blue-100';
  let sparkColor = '#2563eb';
  let IconComponent = FileText;

  if (label === 'TOTAL FIRs') {
    iconColor = 'text-blue-600 bg-blue-50 border border-blue-100';
    sparkColor = '#2563eb';
    IconComponent = FileText;
  } else if (label === 'HIGH RISK OFFENDERS') {
    iconColor = 'text-red-600 bg-red-50 border border-red-100';
    sparkColor = '#dc2626';
    IconComponent = Shield;
  } else if (label === 'LIVE INCIDENTS') {
    iconColor = 'text-orange-600 bg-orange-50 border border-orange-100';
    sparkColor = '#ea580c';
    IconComponent = AlertTriangle;
  } else if (label === 'EMERGING HOTSPOTS') {
    iconColor = 'text-purple-600 bg-purple-50 border border-purple-100';
    sparkColor = '#9333ea';
    IconComponent = Map;
  } else if (label === 'CASES DIGITISED') {
    iconColor = 'text-emerald-600 bg-emerald-50 border border-emerald-100';
    sparkColor = '#16a34a';
    IconComponent = BarChart2;
  } else if (label === 'STATIONS ONLINE') {
    iconColor = 'text-blue-600 bg-blue-50 border border-blue-100';
    sparkColor = '#2563eb';
    IconComponent = Globe;
  }

  const isUp = subtitle.includes('▲');
  const isDown = subtitle.includes('▼');
  const percentText = subtitle.split(' ')[1] || '';
  const remainingText = subtitle.replace('▲', '').replace('▼', '').replace(percentText, '').trim();

  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between shadow-sm text-left bg-white border border-slate-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
          <IconComponent size={16} />
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">{label}</span>
          <span className="text-base font-bold text-slate-800 block mt-0.5 leading-none font-sans tracking-tight">{value}</span>
        </div>
      </div>
      
      {/* Sparkline & Subtitle */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[9px] font-mono leading-none min-w-0">
          {isUp || isDown ? (
            <span className="flex items-center gap-1">
              <span className={isUp ? 'text-emerald-650 font-bold' : 'text-rose-655 font-bold'}>
                {isUp ? '▲' : '▼'} {percentText}
              </span>
              <span className="text-slate-450 truncate">{remainingText}</span>
            </span>
          ) : (
            <span className="text-slate-500 font-medium">{subtitle}</span>
          )}
        </div>
        <svg className="w-10 h-5 shrink-0" viewBox="0 0 50 20">
          <polyline
            fill="none"
            stroke={sparkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,15 8,13 16,17 24,9 32,12 40,6 50,4"
          />
        </svg>
      </div>
    </div>
  );
}

// Color structures
class Colors {
  static get cyan() { return new Color(6, 182, 212); }
  static get rose() { return new Color(244, 63, 94); }
  static get emerald() { return new Color(16, 185, 129); }
  static get blue() { return new Color(59, 130, 246); }
}

class Color {
  r: number; g: number; b: number;
  constructor(r: number, g: number, b: number) { this.r = r; this.g = g; this.b = b; }
  toString() { return `rgb(${this.r}, ${this.g}, ${this.b})`; }
  withOpacity(opacity: number) { return `rgba(${this.r}, ${this.g}, ${this.b}, ${opacity})`; }
}
