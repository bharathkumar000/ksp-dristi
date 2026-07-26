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
        c.CrimeNo.replace('Amengad/FIR/', 'FIR_'),
        'case',
        `Crime Head: ${c.CrimeMajorHeadID} | Facts: ${c.BriefFacts.substring(0, 50)}...`
      );
    });

    // 2. Add Accused nodes and link them to Cases
    accusedList.forEach((acc) => {
      const suspectId = `S_${acc.AccusedMasterID}`;
      addNode(
        suspectId,
        acc.AccusedName,
        'suspect',
        `Suspect ID: ${acc.AccusedMasterID} | Age: ${acc.AgeYear || 'N/A'} | Gender: ${acc.GenderID || 'Male'}`
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
        `Bank Account | Amt: Rs ${txn.Amount.toLocaleString()} | Txn: ${txn.TransactionID}`
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

    // Slice to display a highly readable relational graph (preventing overcrowding)
    const slicedSuspects = suspectNodes.slice(0, 8);
    const slicedCases = caseNodes.slice(0, 6);
    const slicedBanks = bankNodes.slice(0, 6);

    const activeNodeIds = new Set([
      ...slicedSuspects.map(n => n.id),
      ...slicedCases.map(n => n.id),
      ...slicedBanks.map(n => n.id)
    ]);

    const filteredNodes = nodes.filter(n => activeNodeIds.has(n.id));
    const filteredLinks = links.filter(l => activeNodeIds.has(l.source) && activeNodeIds.has(l.target));

    const height = 320;
    const width = 580;

    const suspectsToDistribute = filteredNodes.filter((n) => n.type === 'suspect');
    const casesToDistribute = filteredNodes.filter((n) => n.type === 'case');
    const banksToDistribute = filteredNodes.filter((n) => n.type === 'bank');

    // Distribute suspects on the left with horizontal staggering to prevent label overlap
    suspectsToDistribute.forEach((node, i) => {
      node.x = i % 2 === 0 ? 80 : 130;
      node.y = suspectsToDistribute.length > 1 ? 40 + (i * (height - 80)) / (suspectsToDistribute.length - 1) : height / 2;
    });

    // Distribute cases in the middle (slightly staggered)
    casesToDistribute.forEach((node, i) => {
      node.x = width / 2 + (i % 2 === 0 ? -25 : 25);
      node.y = casesToDistribute.length > 1 ? 50 + (i * (height - 100)) / (casesToDistribute.length - 1) : height / 2;
    });

    // Distribute banks on the right (staggered)
    banksToDistribute.forEach((node, i) => {
      node.x = width - (i % 2 === 0 ? 80 : 130);
      node.y = banksToDistribute.length > 1 ? 40 + (i * (height - 80)) / (banksToDistribute.length - 1) : height / 2;
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
    <div className="w-full h-full flex flex-col bg-white p-3 text-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-1.5">
        <h3 className="font-bold text-slate-700 text-[10.5px] flex items-center gap-1.5 uppercase tracking-wide">
          <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          Relational Network & Money Trails
        </h3>
        <span className="text-[9px] text-slate-400 font-medium">Hover nodes to trace connections</span>
      </div>

      <div className="flex-1 relative min-h-[260px]">
        {/* Render Graph SVG */}
        <svg viewBox="0 0 580 320" className="w-full h-full bg-slate-50 border border-slate-150 rounded-xl">
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
                  stroke={isMoneyTrail ? '#10b981' : '#64748b'}
                  strokeWidth={isHighlighted ? (isMoneyTrail ? 2.5 : 2) : 0.5}
                  strokeOpacity={isHighlighted ? 0.75 : 0.1}
                  strokeDasharray={isMoneyTrail ? '4,4' : undefined}
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

            // Clean text positioning details
            let textAnchor = "middle";
            let labelX = node.x;
            let labelY = node.y - 16;

            if (node.type === 'suspect') {
              textAnchor = "end";
              labelX = node.x - 16;
              labelY = node.y + 4;
            } else if (node.type === 'bank') {
              textAnchor = "start";
              labelX = node.x + 16;
              labelY = node.y + 4;
            }

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                className="cursor-pointer transition-all duration-300"
                opacity={isInFocus ? 1 : 0.15}
              >
                {/* Glow Ring */}
                {(isHovered || isSelected) && (
                  <circle cx={node.x} cy={node.y} r={node.type === 'suspect' ? 18 : 14} fill="none" stroke={nodeColor} strokeWidth={2} className="animate-ping opacity-75" />
                )}
                
                {/* Main Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.type === 'suspect' ? 12 : 9}
                  fill={nodeColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{ filter: `drop-shadow(0 2px 4px ${glowColor})` }}
                />

                {/* Node Label Text with stroke shadow for absolute clarity */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  fill="#1e293b"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                  fontSize="8.5"
                  fontWeight="700"
                  className="pointer-events-none select-none font-sans"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay inside Graph */}
        <div className="absolute top-2 left-2 flex gap-3 bg-slate-900/90 px-2 py-1 rounded border border-slate-700 text-[8.5px] text-slate-305 font-medium shadow-sm">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="text-white">Suspect</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="text-white">FIR Case</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-white">Mule Bank A/C</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details HUD Card */}
      {selectedNode && (
        <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] animate-fadeIn text-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider">{selectedNode.label}</span>
            <span className="px-1 py-0.5 rounded bg-slate-200 text-[8px] font-bold text-slate-650 uppercase">
              {selectedNode.type}
            </span>
          </div>
          <p className="text-slate-600 leading-normal font-medium">{selectedNode.details}</p>
        </div>
      )}
    </div>
  );
}
