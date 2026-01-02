/**
 * PrerequisiteFlowChart Component
 * 
 * Interactive flowchart visualization of module prerequisites and dependencies using React Flow.
 * Displays the academic progression path for a module with clickable nodes.
 * 
 * @component
 * 
 * @description
 * Visual Structure:
 * - Center: Target module (highlighted in blue)
 * - Left side: Prerequisites (modules required before taking this module)
 * - Right side: Dependencies (modules that require this module)
 * - Edges: Directed arrows showing prerequisite relationships
 * 
 * Features:
 * - Interactive graph with pan and zoom
 * - Clickable module nodes (triggers onModuleClick callback)
 * - Auto-layout using force-directed positioning
 * - Distinguishes corequisites from prerequisites (labeled)
 * - Handles complex prerequisite expressions (OR, AND, etc.)
 * - Displays non-module prerequisites as text below chart
 * - Responsive design with overflow scrolling
 * 
 * @param {PrerequisiteFlowChartProps} props - Component props
 * @param {string} props.moduleCode - Target module code to visualize
 * @param {string} [props.prerequisites] - Prerequisites string (comma/or-separated module codes or text)
 * @param {string[]} [props.dependencies] - Array of module codes that depend on this module
 * @param {Function} [props.onModuleClick] - Callback when a module node is clicked
 * 
 * @returns {JSX.Element} Interactive flowchart with module relationships
 * 
 * @requires react-flow-renderer
 * @see parsePrerequisites for prerequisite string parsing logic
 * @see isModuleCode for module code validation
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { 
  Node, 
  Edge, 
  MarkerType,
  Position,
} from '@xyflow/react';
import { getModuleDetails } from '@/shared/api/catalogue';
import { parsePrerequisitesDetailed } from '@/shared/lib/prerequisite-utils';
import { NodeCard, CustomNodeData } from './components/NodeCard';
import { FlowGraphWrapper } from './components/FlowGraph';

interface PrerequisiteFlowChartProps {
  moduleCode: string;
  prerequisites?: string | { text?: string } | Record<string, unknown> | null;
  dependencies?: string[]; 
  onModuleClick?: (moduleCode: string) => void; 
}

const nodeTypes = {
  customNode: NodeCard,
};

const resolvePrerequisiteText = (value: PrerequisiteFlowChartProps['prerequisites']): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;

  const record = value as Record<string, unknown>;
  if (typeof record.text === 'string') {
    return record.text;
  }
  if (Array.isArray(record.codes) && record.codes.every((code) => typeof code === 'string')) {
    return record.codes.join(' or ');
  }

  return JSON.stringify(record);
};

export function PrerequisiteFlowChart({ 
  moduleCode, 
  prerequisites, 
  dependencies,
  onModuleClick
}: PrerequisiteFlowChartProps) {
  const [moduleTitles, setModuleTitles] = useState<Map<string, string>>(new Map());

  // Use detailed parser for a flat list of modules and coreqs
  const { moduleCodes: prereqModules, textDescriptions, corequisites } = useMemo(() => {
    const prereqText = resolvePrerequisiteText(prerequisites);
    return parsePrerequisitesDetailed(prereqText);
  }, [prerequisites]);

  const allModuleCodes = useMemo(() => {
    const codes = new Set<string>();
    
    prereqModules.forEach((code: string) => codes.add(code.toUpperCase()));
    corequisites.forEach((code: string) => codes.add(code.toUpperCase()));
    if (dependencies) {
      dependencies.forEach(code => codes.add(code.toUpperCase()));
    }
    codes.add(moduleCode.toUpperCase());
    
    return Array.from(codes);
  }, [moduleCode, prereqModules, corequisites, dependencies]);

  useEffect(() => {
    let active = true;

    const fetchTitles = async () => {
      const titleMap = new Map<string, string>();
      const batchSize = 3;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (let i = 0; i < allModuleCodes.length; i += batchSize) {
        if (!active) return;

        const batch = allModuleCodes.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (code) => {
            try {
              const response = await getModuleDetails(code);
              if (response.data && response.data.name) {
                titleMap.set(code.toUpperCase(), response.data.name);
              }
            } catch {
              // Ignore missing titles to keep rendering responsive.
            }
          })
        );
        
        if (i + batchSize < allModuleCodes.length) {
          if (!active) return;
          await delay(300);
        }
      }
      
      if (active) {
        setModuleTitles(titleMap);
      }
    };
    
    if (allModuleCodes.length > 0) {
      fetchTitles();
    } else {
      setModuleTitles(new Map());
    }

    return () => {
      active = false;
    };
  }, [allModuleCodes]);

  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node<CustomNodeData>[] = [];
    const flowEdges: Edge[] = [];
    
    let currentId = 0;
    const getNodeId = () => `node-${currentId++}`;
    
    const getTooltip = (code: string) => {
      const title = moduleTitles.get(code.toUpperCase());
      return title ? `${code} - ${title}` : code;
    };
    
    const handleNodeClick = (code: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onModuleClick) {
        onModuleClick(code);
      }
    };
    
    // Center node
    const centerNodeId = getNodeId();
    const centerY = 300;
    const nodeHeightOffset = -25;
    
    flowNodes.push({
      id: centerNodeId,
      type: 'customNode',
      position: { x: 500, y: centerY + nodeHeightOffset },
      data: { 
        label: (
          <span 
            title={getTooltip(moduleCode)} 
            style={{ cursor: 'pointer', fontWeight: 'bold' }}
          >
            {moduleCode}
          </span>
        ),
        tooltip: getTooltip(moduleCode),
        onClick: handleNodeClick(moduleCode),
        nodeType: 'current',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    
    // Process prerequisites and corequisites (Direct connections)
    const allPrereqs = Array.from(new Set([...prereqModules, ...corequisites]));
    const totalPrereqs = allPrereqs.length;
    const prereqGap = totalPrereqs > 8 ? 60 : 90;

    allPrereqs.forEach((modCode, idx) => {
      const prereqNodeId = getNodeId();
      const yPos = centerY + (idx - (totalPrereqs - 1) / 2) * prereqGap + nodeHeightOffset;
      const isCoreq = corequisites.includes(modCode.toUpperCase());
      
      flowNodes.push({
        id: prereqNodeId,
        type: 'customNode',
        position: { x: 100, y: yPos },
        data: { 
          label: (
            <div title={getTooltip(modCode)} style={{ cursor: 'pointer', lineHeight: '1.1' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{modCode}</div>
              {isCoreq && (
                <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>co requisite</div>
              )}
            </div>
          ),
          tooltip: getTooltip(modCode),
          onClick: handleNodeClick(modCode),
          nodeType: 'prereq',
          isCoreq: isCoreq
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      
      flowEdges.push({
        id: `${prereqNodeId}-${centerNodeId}`,
        source: prereqNodeId,
        target: centerNodeId,
        type: 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
        style: { 
          stroke: '#3b82f6', 
          strokeWidth: 2,
          strokeDasharray: isCoreq ? '5,5' : 'none'
        },
      });
    });
    
    // Process dependencies
    if (dependencies && dependencies.length > 0) {
      const totalDependencies = dependencies.length;
      const dependencyGap = totalDependencies > 8 ? 60 : 90;
      
      dependencies.forEach((modCode, idx) => {
        const dependencyY = centerY + (idx - (totalDependencies - 1) / 2) * dependencyGap + nodeHeightOffset;
        const dependencyNodeId = getNodeId();
        
        flowNodes.push({
          id: dependencyNodeId,
          type: 'customNode',
          position: { x: 900, y: dependencyY },
          data: { 
            label: (
              <div title={getTooltip(modCode)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                {modCode}
              </div>
            ),
            tooltip: getTooltip(modCode),
            onClick: handleNodeClick(modCode),
            nodeType: 'dependency',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        
        flowEdges.push({
          id: `${centerNodeId}-${dependencyNodeId}`,
          source: centerNodeId,
          target: dependencyNodeId,
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#22c55e',
          },
          style: { 
            stroke: '#22c55e', 
            strokeWidth: 2,
          },
        });
      });
    }
    
    return { nodes: flowNodes, edges: flowEdges };
  }, [moduleCode, prereqModules, corequisites, dependencies, moduleTitles, onModuleClick]);
  
  // Render the flowchart
  if (nodes.length === 1 && edges.length === 0 && textDescriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No prerequisite or dependency modules to display
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {textDescriptions.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-semibold mb-2 text-sm">Prerequisite Information:</h4>
          <p className="text-sm text-muted-foreground">{textDescriptions.join(' ')}</p>
        </div>
      )}
      <div style={{ width: '100%', height: '600px' }} className="border rounded-lg bg-gray-50">
        <FlowGraphWrapper nodes={nodes} edges={edges} nodeTypes={nodeTypes} />
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-600 bg-white"></div>
          <span className="text-muted-foreground">Prerequisites</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600"></div>
          <span className="text-muted-foreground">Current Module</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-green-600 bg-white"></div>
          <span className="text-muted-foreground">Dependencies</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-blue-600 border-dashed"></div>
          <span className="text-muted-foreground">Co-requisite</span>
        </div>
      </div>
    </div>
  );
}
