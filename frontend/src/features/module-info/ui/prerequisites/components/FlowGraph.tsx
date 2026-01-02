"use client";

import React, { useEffect } from 'react';
import { 
  ReactFlow,
  Node, 
  Edge, 
  Background,
  useReactFlow,
  ReactFlowProvider,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface FlowGraphProps {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
}

export function FlowGraph({ nodes, edges, nodeTypes }: FlowGraphProps) {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 10);
    
    return () => clearTimeout(timer);
  }, [nodes, edges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      zoomOnScroll={true}
      zoomOnDoubleClick={true}
      panOnScroll={true}
      panOnDrag={true}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e5e7eb" gap={16} />
    </ReactFlow>
  );
}

export function FlowGraphWrapper(props: FlowGraphProps) {
  return (
    <ReactFlowProvider>
      <FlowGraph {...props} />
    </ReactFlowProvider>
  );
}
