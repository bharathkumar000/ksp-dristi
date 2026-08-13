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
}

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
  const paragraphs = text.split('\n');
  
  return (
    <div className="space-y-3 font-sans text-slate-800 leading-relaxed">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;
        
        const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');
        const cleanText = isBullet ? trimmed.replace(/^[-•*]\s*/, '') : trimmed;
        
        if (isBullet) {
          return (
            <div key={idx} className="flex gap-2.5 items-start pl-2">
              <span className="text-blue-500 mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
              <div className="text-[11.5px] font-medium text-slate-700 flex-1 leading-relaxed">
                {renderHighlightedText(cleanText)}
              </div>
            </div>
          );
        }
        
        return (
          <p key={idx} className="text-[12.5px] font-medium text-slate-800 leading-relaxed">
            {renderHighlightedText(cleanText)}
          </p>
        );
      })}
    </div>
  );
}

export default function Home() {
  // Navigation & Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to logged in
  const [kgid, setKgid] = useState('1898733');
  const [password, setPassword] = useState('••••••••');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai' | 'map' | 'network' | 'cases' | 'analytics' | 'records' | 'settings' | 'alerts' | 'reports' | 'deployment'>('dashboard');
  const [role, setRole] = useState<'Investigator' | 'Analyst' | 'Supervisor' | 'Policymaker'>('Investigator');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Input & Chat State
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN' | 'kn-IN'>('en-IN');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
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
        CrimeNo: "Amengad/FIR/2016/1",
        CaseNo: "CC/1/2016",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "POCSO",
        CrimeMinorHeadID: "Others",
        IncidentFromDate: "2016-01-05T00:00:00Z",
        latitude: 16.1729,
        longitude: 75.7246,
        BriefFacts: "Occurrence at KAMATAGI BUS STAND. Case category: POCSO. Primary suspect Kiran Kumar under search."
      },
      {
        CaseMasterID: "C_0002",
        CrimeNo: "Amengad/FIR/2016/2",
        CaseNo: "CC/2/2016",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "KARNATAKA POLICE ACT 1963",
        CrimeMinorHeadID: "Gaming",
        IncidentFromDate: "2016-01-12T00:00:00Z",
        latitude: 16.1820,
        longitude: 75.7340,
        BriefFacts: "Illegal card game den raided near market. Accused Lokesha alias 'Punda' fled."
      },
      {
        CaseMasterID: "C_0003",
        CrimeNo: "Amengad/FIR/2016/3",
        CaseNo: "CC/3/2016",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "KARNATAKA POLICE ACT 1963",
        CrimeMinorHeadID: "Gaming",
        IncidentFromDate: "2016-01-18T00:00:00Z",
        latitude: 16.1910,
        longitude: 75.7420,
        BriefFacts: "Satta bazaar gaming network busted. Links to multiple mule bank accounts found."
      },
      {
        CaseMasterID: "C_0004",
        CrimeNo: "Amengad/FIR/2016/4",
        CaseNo: "CC/4/2016",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "MOTOR VEHICLE ACCIDENTS NON-FATAL",
        CrimeMinorHeadID: "Accident",
        IncidentFromDate: "2016-02-05T00:00:00Z",
        latitude: 16.2010,
        longitude: 75.7510,
        BriefFacts: "Non-fatal collision between two vehicles on town limit road."
      },
      {
        CaseMasterID: "C_0005",
        CrimeNo: "Amengad/FIR/2016/5",
        CaseNo: "CC/5/2016",
        PoliceStationID: "1245",
        CrimeMajorHeadID: "MOTOR VEHICLE ACCIDENTS FATAL",
        CrimeMinorHeadID: "Accident",
        IncidentFromDate: "2016-02-14T00:00:00Z",
        latitude: 16.2110,
        longitude: 75.7610,
        BriefFacts: "Fatal highway accident involving speeding transport truck."
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

  // Task checklist toggles
  const [tasks, setTasks] = useState([
    { id: 1, text: "Interview witness - FIR_2031", due: "Due in 30 min", checked: false },
    { id: 2, text: "Review CCTV footage - Case 2030", due: "Due in 1 hour", checked: false },
    { id: 3, text: "Verify bank transactions - FIR_2029", due: "Due in 2 hours", checked: false },
    { id: 4, text: "Patrol briefing - Electronic City", due: "Due in 3 hours", checked: true },
    { id: 5, text: "Submit daily investigation report", due: "Due in 5 hours", checked: false }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial dashboard state on mount
  useEffect(() => {
    fetchChatResponse('Show all active crime records');
    const interval = setInterval(() => {
      setPing(Math.floor(25 + Math.random() * 15));
      setSystemLoad(parseFloat((6 + Math.random() * 4).toFixed(1)));
    }, 4000);
    return () => clearInterval(interval);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setIsLoggedIn(true);
    }, 1000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const queryLower = inputText.toLowerCase().trim();
    
    // AI Security Guard: Reject off-topic non-criminological queries
    const blockedKeywords = ['virat kohli', 'tell me a joke', 'write python code', 'joke', 'python', 'write code', 'who is'];
    const isBlocked = blockedKeywords.some(keyword => {
      if (keyword === 'who is' && (queryLower.includes('kohli') || queryLower.includes('dhoni') || queryLower.includes('actor') || queryLower.includes('celebrity'))) return true;
      return queryLower.includes(keyword) && !queryLower.includes('accused') && !queryLower.includes('case') && !queryLower.includes('suspect');
    });

    if (isBlocked) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'user',
          text: inputText,
          timestamp: new Date().toLocaleTimeString()
        },
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: "This assistant is restricted to authorised criminal intelligence queries.",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setInputText('');
      return;
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInputText('');
    await fetchChatResponse(userMsg.text);
  };

  const fetchChatResponse = async (text: string) => {
    setIsLoading(true);
    try {
      const langMapping = {
        'en-IN': 'English',
        'hi-IN': 'Hindi',
        'kn-IN': 'Kannada'
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory.map(h => ({ sender: h.sender, text: h.text })), { sender: 'user', text }],
          role: role,
          language: langMapping[speechLang]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Injecting the custom UI format mimicking Image 2's structure on pattern searches
      const isPatternQuery = text.toLowerCase().includes('pattern') || text.toLowerCase().includes('similar');
      
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        isCustomUI: isPatternQuery
      };

      setChatHistory((prev) => [...prev, aiMsg]);
      
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

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  // Secure login rendering portal
  if (!isLoggedIn) {
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
    <div className="flex h-screen bg-[#f8fafc] text-slate-850 overflow-hidden font-sans select-none">
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
              className={`w-full flex items-center justify-between rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'alerts' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'px-3 py-2.5' : 'justify-center p-2.5'}`}
            >
              <span className={`flex items-center ${isSidebarExpanded ? 'gap-2.5' : 'justify-center'}`}>
                <Bell size={14} className="shrink-0" />
                {isSidebarExpanded && <span>Alerts & Notifications</span>}
              </span>
              {isSidebarExpanded && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
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
            <button
              onClick={() => setActiveTab('deployment')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'deployment' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <Activity size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Resource Deployment</span>}
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

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center rounded-lg transition-colors cursor-pointer font-sans text-xs font-semibold whitespace-nowrap ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isSidebarExpanded ? 'gap-2.5 px-3 py-2.5 text-left' : 'justify-center p-2.5'}`}
            >
              <Settings size={14} className="shrink-0" />
              {isSidebarExpanded && <span>Settings</span>}
            </button>
          </nav>

          {/* Quick Search - Shown only when expanded */}
          {isSidebarExpanded && (
            <div className="px-4 py-3 border-t border-slate-200 space-y-2 animate-fadeIn">
              <span className="text-[9px] font-bold text-slate-400 tracking-wider block">QUICK SEARCH</span>
              <div className="space-y-0.5 text-[10px] text-slate-655 font-medium">
                <button onClick={() => { setActiveTab('ai'); setInputText('Search FIR cases:'); }} className="w-full text-left hover:text-blue-600 py-1.5 flex items-center gap-2 cursor-pointer"><Search size={10} className="shrink-0 text-slate-400" /> FIR Search</button>
                <button onClick={() => { setActiveTab('network'); }} className="w-full text-left hover:text-blue-600 py-1.5 flex items-center gap-2 cursor-pointer"><UserSearch size={10} className="shrink-0 text-slate-400" /> Accused Search</button>
                <button onClick={() => { setActiveTab('ai'); setInputText('Find vehicle location:'); }} className="w-full text-left hover:text-blue-600 py-1.5 flex items-center gap-2 cursor-pointer"><Car size={10} className="shrink-0 text-slate-400" /> Vehicle Search</button>
                <button onClick={() => { setActiveTab('ai'); setInputText('Trace phone records:'); }} className="w-full text-left hover:text-blue-600 py-1.5 flex items-center gap-2 cursor-pointer"><Phone size={10} className="shrink-0 text-slate-400" /> Phone Search</button>
                <button onClick={() => { setActiveTab('network'); }} className="w-full text-left hover:text-blue-600 py-1.5 flex items-center gap-2 cursor-pointer"><CreditCard size={10} className="shrink-0 text-slate-400" /> Bank Account Search</button>
                <button onClick={() => { setActiveTab('map'); }} className="w-full text-left hover:text-blue-600 py-1.5 flex items-center gap-2 cursor-pointer"><Map size={10} className="shrink-0 text-slate-400" /> Location Search</button>
              </div>
            </div>
          )}

          {/* Shortcuts - Shown only when expanded */}
          {isSidebarExpanded && (
            <div className="px-4 py-3 border-t border-slate-200 space-y-2 animate-fadeIn">
              <span className="text-[9px] font-bold text-slate-400 tracking-wider block">SHORTCUTS</span>
              <div className="space-y-1.5 text-[10px] text-slate-655 font-medium">
                <div className="flex justify-between items-center cursor-pointer hover:text-blue-600">
                  <span className="flex items-center gap-2"><Pin size={10} className="text-slate-400" /> Pinned Cases</span>
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded text-[8px]">4</span>
                </div>
                <div className="cursor-pointer hover:text-blue-600 flex items-center gap-2"><MessageSquare size={10} className="text-slate-400" /> Recent Conversations</div>
                <div className="cursor-pointer hover:text-blue-600 flex items-center gap-2"><FileText size={10} className="text-slate-400" /> Saved Reports</div>
              </div>
            </div>
          )}
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

            {/* Secure Mode Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 font-bold text-[10px]">
              <Shield size={11} className="shrink-0" />
              <span>Secure Mode Active</span>
            </div>

            {/* Notification and message badges */}
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer text-slate-550 hover:text-slate-800">
                <Bell size={16} />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold px-1 rounded text-[8px] leading-tight">12</span>
              </div>
              <div className="relative cursor-pointer text-slate-550 hover:text-slate-800">
                <Mail size={16} />
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white font-bold px-1 rounded text-[8px] leading-tight">8</span>
              </div>
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
                    
                    {/* Item 1 */}
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="flex items-center gap-1.5 text-slate-500">08:42 AM • <span className="bg-red-50 text-red-600 border border-red-200 px-1 rounded text-[8px] font-bold">HIGH</span></span>
                          <span className="text-blue-600 font-semibold">Confidence: 82%</span>
                        </div>
                        <div className="text-slate-700 font-sans leading-normal">
                          Multiple robbery reports received near Mysuru Bus Stand.
                        </div>
                        <div className="text-[8.5px] text-slate-400">
                          Source: Police Control Room, 2 News Agencies, 6 Citizen Reports
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setActiveTab('map'); }} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-655 px-2 py-0.5 rounded text-[8.5px] cursor-pointer">View on Map</button>
                        <button onClick={() => { setActiveTab('ai'); setInputText('Show robbery details at Mysuru Bus Stand'); }} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 px-2 py-0.5 rounded text-[8.5px] font-bold cursor-pointer">Investigate</button>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="flex items-center gap-1.5 text-slate-500">08:57 AM • <span className="bg-amber-50 text-amber-600 border border-amber-200 px-1 rounded text-[8px] font-bold">MEDIUM</span></span>
                          <span className="text-blue-600 font-semibold">Confidence: 91%</span>
                        </div>
                        <div className="text-slate-700 font-sans leading-normal">
                          Cyber fraud complaints rising in Whitefield area.
                        </div>
                        <div className="text-[8.5px] text-slate-400">
                          Source: Cyber Cell, 3 News Agencies, Social Media Monitoring
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setActiveTab('map'); }} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-655 px-2 py-0.5 rounded text-[8.5px] cursor-pointer">View on Map</button>
                        <button onClick={() => { setActiveTab('ai'); setInputText('Analyze Whitefield cyber fraud complaints'); }} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 px-2 py-0.5 rounded text-[8.5px] font-bold cursor-pointer">Investigate</button>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="flex items-center gap-1.5 text-slate-500">09:04 AM • <span className="bg-amber-50 text-amber-600 border border-amber-200 px-1 rounded text-[8px] font-bold">MEDIUM</span></span>
                          <span className="text-blue-600 font-semibold">Confidence: 78%</span>
                        </div>
                        <div className="text-slate-700 font-sans leading-normal">
                          Suspicious financial transactions detected.
                        </div>
                        <div className="text-[8.5px] text-slate-400">
                          Source: Financial Intelligence Unit, Bank Reports
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setActiveTab('ai'); setInputText('Show transaction trail for recent suspicious bank actions'); }} className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 px-2 py-0.5 rounded text-[8.5px] font-bold cursor-pointer">Investigate</button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Bottom row: Recent Cases, Officer Tasks & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Recent Cases */}
                <div className="lg:col-span-5 glass-panel p-4 rounded-xl flex flex-col h-[280px]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-slate-700 text-[10.5px]">RECENT CASES</span>
                    <button onClick={() => { setActiveTab('cases'); }} className="text-[9px] text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-[9.5px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-150">
                          <th className="pb-1.5">FIR No</th>
                          <th className="pb-1.5">Crime</th>
                          <th className="pb-1.5">District</th>
                          <th className="pb-1.5">Priority</th>
                          <th className="pb-1.5">Officer</th>
                          <th className="pb-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.cases.slice(0, 5).map((c) => (
                          <tr key={c.CaseMasterID} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedCase(c)}>
                            <td className="py-2 text-slate-800 font-bold">{c.CrimeNo.replace('Amengad/FIR/', 'FIR_')}</td>
                            <td className="py-2 text-slate-650 truncate max-w-[70px]">{c.CrimeMajorHeadID}</td>
                            <td className="py-2 text-slate-500">Bagalkot</td>
                            <td className="py-2">
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-50 text-red-600 border border-red-200 font-bold">High</span>
                            </td>
                            <td className="py-2 text-slate-600">SI Kavya M.</td>
                            <td className="py-2 text-blue-600 font-bold">Under Inv.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Officer Tasks */}
                <div className="lg:col-span-4 glass-panel p-4 rounded-xl flex flex-col h-[280px]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="font-bold text-slate-700 text-[10.5px]">OFFICER TASKS</span>
                    <button className="text-[9px] text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded-lg hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.checked}
                            onChange={() => toggleTask(task.id)}
                            className="rounded border-slate-350 bg-white text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={`text-[10px] text-slate-700 ${task.checked ? 'line-through text-slate-400' : ''}`}>{task.text}</span>
                        </div>
                        <span className="text-[8px] text-amber-600 font-bold bg-amber-50 border border-amber-250 px-1 py-0.5 rounded">{task.due}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="lg:col-span-3 bg-white border border-slate-200 p-4 rounded-xl flex flex-col h-[280px] justify-between shadow-sm">
                  <span className="font-bold text-slate-700 text-[10.5px] border-b border-slate-100 pb-2 block">QUICK ACTIONS</span>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-center mt-3 flex-1">
                    
                    <button onClick={() => { setActiveTab('cases'); }} className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 active:scale-[0.98]">
                      <FolderOpen size={18} className="text-blue-500" />
                      New Investigation
                    </button>
                    <button onClick={() => { setActiveTab('ai'); }} className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 active:scale-[0.98]">
                      <Bot size={18} className="text-purple-500" />
                      Launch AI Assistant
                    </button>
                    <button onClick={triggerPdfExport} className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 active:scale-[0.98]">
                      <FileText size={18} className="text-emerald-500" />
                      Create FIR Summary
                    </button>
                    <button onClick={triggerPdfExport} className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 active:scale-[0.98]">
                      <FileBarChart2 size={18} className="text-orange-500" />
                      Generate Daily Report
                    </button>
                    <button onClick={() => { setActiveTab('map'); }} className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 active:scale-[0.98]">
                      <Map size={18} className="text-blue-500" />
                      Open Tactical Map
                    </button>
                    <button className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 active:scale-[0.98]">
                      <Siren size={18} className="text-rose-500" />
                      Alerts Center
                    </button>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CRIME INTELLIGENCE AI */}
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-170px)] animate-fadeIn text-xs">
              
              {/* Left sidebar: Conversations Folder (3 Cols) */}
              <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar shrink-0">
                <button onClick={() => { setChatHistory([]); }} className="w-full bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 font-bold py-2.5 rounded-xl text-center text-slate-600 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <Plus size={13} /> New Conversation
                </button>

                <div className="glass-panel p-4 rounded-xl flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block">TODAY</span>
                    <div className="space-y-1 text-[10px] text-slate-600 font-mono">
                      <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded cursor-pointer truncate font-semibold">
                        Fake loan app fraud pattern...
                      </div>
                      <div className="p-2 hover:bg-slate-50 rounded cursor-pointer truncate py-1.5">
                        CCTV lookup - Whitefield
                      </div>
                      <div className="p-2 hover:bg-slate-50 rounded cursor-pointer truncate py-1.5">
                        Money trail analysis
                      </div>
                      <div className="p-2 hover:bg-slate-50 rounded cursor-pointer truncate py-1.5">
                        Suspect profiling - Ramesh
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block">YESTERDAY</span>
                    <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                      <div className="p-1 hover:text-slate-800 cursor-pointer truncate">Similar cases - 2024</div>
                      <div className="p-1 hover:text-slate-800 cursor-pointer truncate">Network analysis - Bengaluru</div>
                      <div className="p-1 hover:text-slate-800 cursor-pointer truncate">Phone number tracking</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase block">PREVIOUS 7 DAYS</span>
                    <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                      <div className="p-1 hover:text-slate-800 cursor-pointer truncate">Bank accounts linked</div>
                      <div className="p-1 hover:text-slate-800 cursor-pointer truncate">Vehicle tracking history</div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Secure Mode:</span>
                    <span className="text-emerald-600 font-bold">Active</span>
                  </div>
                </div>

                {/* Quick utility buttons */}
                <div className="p-2 border-b border-slate-100 bg-slate-50 flex gap-1.5 overflow-x-auto custom-scrollbar select-none text-[8.5px] font-mono text-slate-500 shrink-0">
                  <button onClick={() => setInputText("Find similar cases to this cyber fraud.")} className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all"><Search size={9} /> Find similar cases</button>
                  <button onClick={() => setInputText("Analyze crime pattern for recent bank mule thefts.")} className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all"><TrendingUp size={9} /> Analyze crime pattern</button>
                  <button onClick={() => setInputText("Profile suspect Lokesha.")} className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all"><User size={9} /> Profile suspect</button>
                  <button onClick={() => setInputText("Track vehicle KA 09 MJ 4501 location.")} className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all"><Car size={9} /> Track vehicle</button>
                  <button onClick={() => setInputText("Show money trail from HDFC mule logs.")} className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg flex items-center gap-1 whitespace-nowrap transition-all"><CreditCard size={9} /> Money trail</button>
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
                          <div className="p-5 bg-slate-50 border border-slate-200/80 text-slate-850 rounded-2xl rounded-tl-none max-w-3xl shadow-sm border-l-4 border-l-blue-600 space-y-4 leading-relaxed">
                            <p className="font-sans text-[12px] font-semibold text-slate-800">Yes, similar crime patterns have been identified in the past in Bengaluru. I found 7 relevant cases with high pattern similarity.</p>
                            
                            {/* Inner table */}
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                              <table className="w-full text-left text-[9.5px] border-collapse">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
                                    <th className="p-2">FIR No.</th>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Location</th>
                                    <th className="p-2">Crime Type</th>
                                    <th className="p-2">Similarity</th>
                                    <th className="p-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-slate-100">
                                    <td className="p-2 text-slate-800 font-bold">FIR_2031/24</td>
                                    <td className="p-2 text-slate-500">12 May 2024</td>
                                    <td className="p-2 text-slate-500">Bengaluru East</td>
                                    <td className="p-2 text-slate-700">Cyber Fraud</td>
                                    <td className="p-2 text-blue-600 font-bold">93%</td>
                                    <td className="p-2 text-slate-500">Chargesheet Filed</td>
                                  </tr>
                                  <tr className="border-b border-slate-100">
                                    <td className="p-2 text-slate-800 font-bold">FIR_4018/24</td>
                                    <td className="p-2 text-slate-500">03 Mar 2024</td>
                                    <td className="p-2 text-slate-500">Whitefield PS</td>
                                    <td className="p-2 text-slate-700">Cyber Fraud</td>
                                    <td className="p-2 text-blue-600 font-bold">91%</td>
                                    <td className="p-2 text-slate-500">Investigation</td>
                                  </tr>
                                  <tr className="border-b border-slate-100">
                                    <td className="p-2 text-slate-800 font-bold">FIR_9876/23</td>
                                    <td className="p-2 text-slate-500">17 Nov 2023</td>
                                    <td className="p-2 text-slate-500">Electronic City</td>
                                    <td className="p-2 text-slate-700">Cyber Fraud</td>
                                    <td className="p-2 text-blue-600 font-bold">89%</td>
                                    <td className="p-2 text-emerald-600 font-bold">Conviction</td>
                                  </tr>
                                </tbody>
                              </table>
                              <div className="p-2 text-center border-t border-slate-200">
                                <button onClick={() => { setActiveTab('cases'); }} className="text-blue-600 text-[8.5px] font-bold hover:underline">View All 7 Cases</button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                              {/* MO */}
                              <div className="space-y-1">
                                <div className="text-[9.5px] font-bold text-slate-500 border-b border-slate-200 pb-0.5">Common Modus Operandi</div>
                                <ul className="space-y-1 text-[9px] text-slate-655 list-inside list-disc">
                                  <li>Fake loan / job offer apps to lure victims</li>
                                  <li>KYC documents collected under false pretenses</li>
                                  <li>Money transferred to multiple mule accounts</li>
                                  <li>Communication through Telegram / WhatsApp</li>
                                </ul>
                              </div>
                              {/* Insights */}
                              <div className="space-y-1 bg-blue-50/30 p-2 border border-blue-100 rounded-lg">
                                <div className="text-[9.5px] font-bold text-slate-500 border-b border-slate-200 pb-0.5">Key Insights</div>
                                <div className="text-[8.5px] text-slate-650 space-y-1">
                                  <div>First occurrence: <strong className="text-slate-800">May 2022</strong></div>
                                  <div>Most active period: <strong className="text-slate-800">Mar - Jun</strong></div>
                                  <div>Primary locations: <strong className="text-slate-800">Whitefield, EC, Koramangala</strong></div>
                                  <div>Total financial impact: <strong className="text-red-655 font-bold">₹8.76 Cr</strong></div>
                                </div>
                              </div>
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
                            {formatMessageText(msg.text)}
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
                        onClick={() => setSpeechLang('en-IN')}
                        className={`px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          speechLang === 'en-IN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang('hi-IN')}
                        className={`px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          speechLang === 'hi-IN' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                      >
                        हिन्दी (Hindi)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpeechLang('kn-IN')}
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
            <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col animate-fadeIn text-xs font-mono">
              
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
                <div className="lg:col-span-8 h-[440px] w-full rounded-2xl overflow-hidden relative border border-slate-200 bg-white">
                  <div className="absolute top-3 left-3 z-[100] bg-slate-50/90 p-2 border border-slate-200 rounded text-[9px] text-blue-600 font-bold">
                    NETWORK VISUALIZATION (CENTRED ON RAKESH N.)
                  </div>
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
                          <td className="py-2.5 text-slate-500">Bagalkot</td>
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

          {/* TAB 8: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn font-mono text-xs max-w-md">
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <span className="font-bold text-slate-700 uppercase border-b border-slate-100 pb-2 block">CONNECTION PARAMETERS</span>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase block">API HOST ENDPOINT</label>
                  <input type="text" defaultValue="/api/chat" className="w-full bg-white border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-blue-500" />
                </div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-[9.5px] font-bold">
                  Status: SECURE TLS CONNECTION ACTIVE
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

          {/* TAB 11: RESOURCE DEPLOYMENT */}
          {activeTab === 'deployment' && (
            <div className="space-y-6 animate-fadeIn text-xs font-mono">
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <span className="font-bold text-slate-700 uppercase text-[11px] border-b border-slate-100 pb-2 block">
                  RESOURCE DEPLOYMENT COMMANDER
                </span>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Patrol Unit EC-04</div>
                      <div className="text-[10px] text-slate-550 mt-0.5">Route: Electronic City Phase 1 • Status: On Patrol</div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-lg">Active</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Tactical Responder HSR-02</div>
                      <div className="text-[10px] text-slate-550 mt-0.5">Location: HSR Layout Sector 2 • Status: Dispatched (Incident #4029)</div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-lg">Dispatched</span>
                  </div>
                </div>
              </div>
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

                {/* Action button */}
                <button
                  onClick={() => setSelectedCase(null)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center text-[10.5px]"
                >
                  Close Case File
                </button>

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
