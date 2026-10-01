"use client";

import React from 'react';
import { NodeProps, Position, Handle, Node } from '@xyflow/react'; // Import NodeProps and Handle

export interface CustomNodeData extends Record<string, unknown> {
  label: React.ReactNode;
  tooltip: string;
  onClick: (e: React.MouseEvent) => void;
  nodeType?: 'prereq' | 'dependency' | 'current' | 'operator';
  isCoreq?: boolean;
}

type CustomNode = Node<CustomNodeData>;

export const NodeCard: React.FC<NodeProps<CustomNode>> = ({ data, targetPosition = Position.Left, sourcePosition = Position.Right }) => {
  let background = 'white';
  let color = '#1e40af'; // Default blue text for prereq (input)
  let borderColor = '#3b82f6'; // Default blue for prereq (input)
  let isRounded = true;
  let minWidth = '110px';
  let padding = '8px 12px';
  let fontSize = '13px';

  switch (data.nodeType) {
    case 'current':
      background = '#3b82f6'; // Blue
      color = 'white';
      borderColor = '#2563eb';
      isRounded = true;
      minWidth = '100px';
      padding = '10px 20px';
      fontSize = '14px';
      break;
    case 'dependency':
      background = 'white';
      color = '#15803d'; // Green
      borderColor = '#22c55e';
      isRounded = true;
      break;
    case 'operator':
      background = '#e5e7eb'; // Light gray
      color = '#64748b'; // Gray text
      borderColor = '#9ca3af'; // Darker gray border
      isRounded = true;
      minWidth = '50px';
      padding = '6px 12px';
      fontSize = '12px';
      break;
  }

  return (
    <div
      className="react-flow__node-default relative group"
      style={{
        background,
        color,
        border: `2px solid ${borderColor}`,
        borderRadius: isRounded ? '999px' : '8px',
        padding,
        fontSize,
        fontWeight: '600',
        width: 'auto',
        minWidth: minWidth,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={data.tooltip}
      onClick={data.onClick}
    >
      <Handle 
        type="target" 
        position={targetPosition} 
        style={{ background: 'transparent', border: 'none' }} 
        isConnectable={false}
      />
      {data.label}
      <Handle 
        type="source" 
        position={sourcePosition} 
        style={{ background: 'transparent', border: 'none' }} 
        isConnectable={false}
      />
    </div>
  );
}
