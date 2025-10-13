'use client';

import dynamic from 'next/dynamic';

const CrimeMapInner = dynamic(() => import('./CrimeMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 border border-slate-800 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading Tactical Cartography Engine...</span>
      </div>
    </div>
  )
});

interface CrimeMapProps {
  incidents: any[];
  patrolRoute: any[];
  activeIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
}

export default function CrimeMap({ incidents, patrolRoute, activeIncidentId, onSelectIncident }: CrimeMapProps) {
  return (
    <CrimeMapInner
      incidents={incidents}
      patrolRoute={patrolRoute}
      activeIncidentId={activeIncidentId}
      onSelectIncident={onSelectIncident}
    />
  );
}
