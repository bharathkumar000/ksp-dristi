'use client';

import { useState, useMemo } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'suspect' | 'case' | 'bank';
  details: string;
  x: number;
  y: number;
}

interface Link {
  source: string;
  target: string;
  value: string;
}

interface NetworkGraphProps {
  accusedList: any[];
  cases: any[];
  transactions: any[];
}

export default function NetworkGraph({ accusedList = [], cases = [], transactions = [] }: NetworkGraphProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Compile unique nodes and links based on the dataset
  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const nodeSet = new Set<string>();

    const addNode = (id: string, label: string, type: 'suspect' | 'case' | 'bank', details: string) => {
      if (!nodeSet.has(id)) {
        nodeSet.add(id);
        nodes.push({ id, label, type, details, x: 0, y: 0 });
      }
    };

    // 1. Add Case nodes
    cases.forEach((c) => {
      addNode(
        c.CaseMasterID,
        c.CrimeNo,
        'case',
        `Crime Head: ${c.CrimeMajorHeadID} | Station: Koramangala PS | Facts: ${c.BriefFacts.substring(0, 50)}...`
      );
    });

    // 2. Add Accused nodes and link them to Cases
    accusedList.forEach((acc) => {
      const suspectId = `S_${acc.AccusedMasterID}`;
      addNode(
        suspectId,
        acc.AccusedName,
        'suspect',
        `Suspect Master ID: ${acc.AccusedMasterID} | Age: ${acc.AgeYear} | Gender: ${acc.GenderID}`
      );
      
      if (acc.CaseMasterID) {
        links.push({
          source: suspectId,
          target: acc.CaseMasterID,
          value: 'Accused in'
        });
      }
    });

    // 3. Add Bank nodes from transactions
    transactions.forEach((txn) => {
      const bankId = `B_${txn.TargetAccount.replace(/\s+/g, '_')}`;
      addNode(
        bankId,
        txn.TargetAccount,
        'bank',
        `Bank Account | Amt Traced: Rs ${txn.Amount.toLocaleString()} | Txn ID: ${txn.TransactionID}`
      );

      // Link transaction bank account to suspect (accused) if matched
      if (txn.AccusedMasterID) {
        const suspectId = `S_${txn.AccusedMasterID}`;
        links.push({
          source: suspectId,
          target: bankId,
          value: `Transferred Rs ${txn.Amount.toLocaleString()}`
        });
      }
    });

    // Compute layout coordinates (layered left-to-right to keep it visually clear and structured)
    const suspectNodes = nodes.filter((n) => n.type === 'suspect');
    const caseNodes = nodes.filter((n) => n.type === 'case');
    const bankNodes = nodes.filter((n) => n.type === 'bank');

    // Slice to display a clean, high-relevance visual subgraph
    const slicedSuspects = suspectNodes.slice(0, 35);
    const slicedCases = caseNodes.slice(0, 20);
    const slicedBanks = bankNodes.slice(0, 20);

    const activeNodeIds = new Set([
      ...slicedSuspects.map(n => n.id),
      ...slicedCases.map(n => n.id),
      ...slicedBanks.map(n => n.id)
    ]);

    const filteredNodes = nodes.filter(n => activeNodeIds.has(n.id));
    const filteredLinks = links.filter(l => activeNodeIds.has(l.source) && activeNodeIds.has(l.target));

    const height = 400;
    const width = 600;

    const suspectsToDistribute = filteredNodes.filter((n) => n.type === 'suspect');
    const casesToDistribute = filteredNodes.filter((n) => n.type === 'case');
    const banksToDistribute = filteredNodes.filter((n) => n.type === 'bank');

    // Distribute suspects on the left
    suspectsToDistribute.forEach((node, i) => {
      node.x = 80;
      node.y = suspectsToDistribute.length > 1 ? 50 + (i * (height - 100)) / (suspectsToDistribute.length - 1) : height / 2;
    });

    // Distribute cases in the middle
    casesToDistribute.forEach((node, i) => {
      node.x = width / 2;
      node.y = casesToDistribute.length > 1 ? 50 + (i * (height - 100)) / (casesToDistribute.length - 1) : height / 2;
    });

    // Distribute banks on the right
    banksToDistribute.forEach((node, i) => {
      node.x = width - 100;
      node.y = banksToDistribute.length > 1 ? 50 + (i * (height - 100)) / (banksToDistribute.length - 1) : height / 2;
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [accusedList, cases, transactions]);

  // Find connections of the hovered node
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set<string>([hoveredNodeId]);
    graphData.links.forEach((link) => {
      if (link.source === hoveredNodeId) connected.add(link.target);
      if (link.target === hoveredNodeId) connected.add(link.source);
    });
    return connected;
  }, [hoveredNodeId, graphData.links]);

  const selectedNode = graphData.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="w-full h-full flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-800">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          Relational Network & Money Trails
        </h3>
        <span className="text-xs text-slate-500">Hover nodes to trace relationships</span>
      </div>

      <div className="flex-1 relative min-h-[300px]">
        {/* Render Graph SVG */}
        <svg viewBox="0 0 600 400" className="w-full h-full bg-slate-50 border border-slate-150 rounded-lg">
          {/* Render Links */}
          {graphData.links.map((link, i) => {
            const sourceNode = graphData.nodes.find((n) => n.id === link.source);
            const targetNode = graphData.nodes.find((n) => n.id === link.target);

            if (!sourceNode || !targetNode) return null;

            const isHighlighted =
              hoveredNodeId === null || (hoveredNodeId && (link.source === hoveredNodeId || link.target === hoveredNodeId));

            const isMoneyTrail = link.value.toLowerCase().includes('transferred') || sourceNode.type === 'bank' || targetNode.type === 'bank';

            return (
              <g key={`link-${i}`} className="transition-opacity duration-300">
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isMoneyTrail ? '#10b981' : '#475569'}
                  strokeWidth={isHighlighted ? (isMoneyTrail ? 2.5 : 2) : 0.5}
                  strokeOpacity={isHighlighted ? 0.75 : 0.15}
                  strokeDasharray={isMoneyTrail ? '4,4' : undefined}
                  className={isHighlighted && isMoneyTrail ? 'animate-[dash_2s_linear_infinite]' : ''}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {graphData.nodes.map((node) => {
            const isHovered = hoveredNodeId === node.id;
            const isSelected = selectedNodeId === node.id;
            const isInFocus = hoveredNodeId === null || connectedNodeIds.has(node.id);

            // Node style mapping
            let nodeColor = '#3b82f6'; // Blue for cases
            let glowColor = 'rgba(59, 130, 246, 0.4)';
            if (node.type === 'suspect') {
              nodeColor = '#f43f5e'; // Rose/Red for suspects
              glowColor = 'rgba(244, 63, 94, 0.4)';
            } else if (node.type === 'bank') {
              nodeColor = '#10b981'; // Emerald for banks
              glowColor = 'rgba(16, 185, 129, 0.4)';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                className="cursor-pointer transition-all duration-300"
                opacity={isInFocus ? 1 : 0.2}
              >
                {/* Glow Ring */}
                {(isHovered || isSelected) && (
                  <circle r={node.type === 'suspect' ? 19 : 15} fill="none" stroke={nodeColor} strokeWidth={2} className="animate-ping opacity-75" />
                )}
                
                {/* Main Circle */}
                <circle
                  r={node.type === 'suspect' ? 14 : 11}
                  fill={nodeColor}
                  stroke="#020617"
                  strokeWidth={2}
                  style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
                />

                {/* Node Label Text */}
                <text
                  y={node.type === 'suspect' ? -22 : -17}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="9.5"
                  fontWeight="bold"
                  className="bg-slate-950 px-1 py-0.5 rounded select-none shadow-md"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay inside Graph */}
        <div className="absolute top-2 left-2 flex gap-3 bg-slate-950/80 p-2 rounded-md border border-slate-800 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Suspect</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>FIR Case</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mule Bank A/C</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details HUD Card */}
      {selectedNode && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs animate-fadeIn text-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-slate-850 uppercase tracking-wider">{selectedNode.label}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[9px] font-semibold text-slate-600 uppercase">
              {selectedNode.type}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">{selectedNode.details}</p>
        </div>
      )}
    </div>
  );
}
