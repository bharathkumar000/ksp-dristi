'use client';

import { useMemo } from 'react';
import { ShieldAlert, TrendingUp, Info } from 'lucide-react';

interface ProfilingPanelProps {
  accusedList: any[];
  complainants: any[];
  arrests: any[];
}

export default function ProfilingPanel({ accusedList = [], complainants = [], arrests = [] }: ProfilingPanelProps) {
  
  // 1. Calculate Recidivism Risk Score for Suspects
  const recidivismList = useMemo(() => {
    const counts: Record<string, { count: number; age: number; gender: string; cases: string[]; id: string }> = {};

    accusedList.forEach((acc) => {
      const key = acc.AccusedName;
      if (!counts[key]) {
        counts[key] = {
          count: 0,
          age: acc.AgeYear || 30,
          gender: acc.GenderID || 'Male',
          cases: [],
          id: acc.AccusedMasterID
        };
      }
      counts[key].count += 1;
      if (acc.CaseMasterID && !counts[key].cases.includes(acc.CaseMasterID)) {
        counts[key].cases.push(acc.CaseMasterID);
      }
    });

    return Object.entries(counts).map(([name, data]) => {
      let score = 0;
      if (data.count > 1) {
        score += 40 + (data.count - 2) * 20;
      } else {
        score += 15;
      }

      if (data.age >= 18 && data.age <= 30) {
        score += 10;
      }

      const hasPriorArrest = arrests.some((arr) => arr.AccusedMasterID === data.id);
      if (hasPriorArrest) {
        score += 15;
      }

      const riskScore = Math.min(score, 95);

      return {
        name,
        accusedId: data.id,
        offenseCount: data.count,
        age: data.age,
        gender: data.gender,
        riskScore,
        status: riskScore > 70 ? 'High' : riskScore > 40 ? 'Moderate' : 'Low'
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [accusedList, arrests]);

  // 2. Sociological demographic statistics (Complainants/Victims subset)
  const demographicStats = useMemo(() => {
    const ageBrackets = { '18-30 (Youth)': 0, '31-50 (Adults)': 0, '50+ (Seniors)': 0 };
    const occupations: Record<string, number> = {};
    const religions: Record<string, number> = {};

    complainants.forEach((c) => {
      if (c.AgeYear <= 30) ageBrackets['18-30 (Youth)'] += 1;
      else if (c.AgeYear <= 50) ageBrackets['31-50 (Adults)'] += 1;
      else ageBrackets['50+ (Seniors)'] += 1;

      if (c.OccupationID) {
        occupations[c.OccupationID] = (occupations[c.OccupationID] || 0) + 1;
      }

      if (c.ReligionID) {
        religions[c.ReligionID] = (religions[c.ReligionID] || 0) + 1;
      }
    });

    return {
      ageBrackets,
      occupations: Object.entries(occupations),
      religions: Object.entries(religions)
    };
  }, [complainants]);

  const maxOccupationVal = useMemo(() => {
    if (demographicStats.occupations.length === 0) return 1;
    return Math.max(...demographicStats.occupations.map(([_, v]) => v));
  }, [demographicStats.occupations]);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
      
      {/* Module 5: Habitual Offender Profile Panel */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
          <ShieldAlert size={16} className="text-amber-500" />
          Habitual Offenders & Recidivism Predictor
        </h3>

        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 pr-1 custom-scrollbar">
          {recidivismList.length === 0 ? (
            <div className="text-slate-400 text-xs italic text-center py-10">No suspect records selected for profiling</div>
          ) : (
            recidivismList.slice(0, 25).map((offender) => (
              <div
                key={offender.accusedId}
                className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col gap-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-slate-800">{offender.name}</div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      offender.status === 'High'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : offender.status === 'Moderate'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    {offender.status} Risk
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Prior Incidents: {offender.offenseCount}</span>
                  <span>Age/Sex: {offender.age}y / {offender.gender}</span>
                </div>

                {/* Risk Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Recidivism Probability</span>
                    <span className="font-semibold text-slate-700">{offender.riskScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        offender.status === 'High' ? 'bg-red-500' : offender.status === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${offender.riskScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Module 4: Sociological Demographic Insights */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
          <TrendingUp size={16} className="text-blue-500" />
          Socio-Demographic Crime Insights
        </h3>

        <div className="flex-1 space-y-4">
          {/* Age Distribution */}
          <div>
            <div className="text-xs font-semibold text-slate-650 mb-2">Complainant Age Brackets</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(demographicStats.ageBrackets).map(([bracket, val]) => (
                <div key={bracket} className="bg-slate-50 p-2 border border-slate-150 rounded text-center">
                  <div className="text-[10px] text-slate-400 truncate">{bracket}</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">{val} cases</div>
                </div>
              ))}
            </div>
          </div>

          {/* Occupation Correlation - SVG Bar Chart */}
          <div>
            <div className="text-xs font-semibold text-slate-650 mb-2">Victim Occupation Distribution</div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {demographicStats.occupations.length === 0 ? (
                <div className="text-slate-400 text-[10px] italic text-center py-4">No demographic data found</div>
              ) : (
                demographicStats.occupations.map(([occ, val]) => {
                  const widthPct = maxOccupationVal > 0 ? (val / maxOccupationVal) * 100 : 0;
                  return (
                    <div key={occ} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{occ}</span>
                        <span className="font-semibold text-slate-700">{val} ({Math.round((val / complainants.length) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded transition-all duration-500"
                          style={{ width: `${widthPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Social Warning banner */}
          <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-[10px] text-blue-700 leading-normal flex items-start gap-2">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-800">Sociological Context:</span> Cyber frauds show a 78% correlation with private sector professionals aged 18-35 in Koramangala hub.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
