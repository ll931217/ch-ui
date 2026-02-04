// src/features/workspace/explain/components/TreeView/TreeView.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TreeNodeLayout, TreeLayout } from '../../layout';
import { ExplainResult } from '@/types/common';
import { TreeNode } from './TreeNode';
import { TreeControls } from './TreeControls';
import { analyzeBottlenecks } from '../../metrics';

interface TreeViewProps {
  explainResult: ExplainResult;
  onNodeSelect?: (node: TreeNodeLayout | null) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

export const TreeView: React.FC<TreeViewProps> = ({
  explainResult,
  onNodeSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNodeLayout | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Calculate layout
  const layout = useMemo(() => {
    return TreeLayout.calculateLayout(explainResult.tree);
  }, [explainResult.tree]);

  // Calculate bounds
  const bounds = useMemo(() => {
    return TreeLayout.getTreeBounds(layout);
  }, [layout]);

  // Analyze bottlenecks
  const bottlenecks = useMemo(() => {
    return analyzeBottlenecks(explainResult.tree);
  }, [explainResult.tree]);

  // Center tree on mount
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const centerX = container.clientWidth / 2 - bounds.width / 2;
      const centerY = 50; // Top padding
      setPosition({ x: centerX, y: centerY });
    }
  }, [bounds]);

  // Handle node click
  const handleNodeClick = (node: TreeNodeLayout) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.1, Math.min(2, prev + delta)));
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsPanning(true);
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  // Render tree recursively
  const renderTree = (node: TreeNodeLayout): React.ReactNode => {
    const isBottleneck = bottlenecks.has(node.id);
    const isSelected = selectedNode?.id === node.id;

    return (
      <React.Fragment key={node.id}>
        {/* Render edges to children */}
        {node.children.map((child) => (
          <line
            key={`${node.id}-${child.id}`}
            x1={node.x + NODE_WIDTH / 2}
            y1={node.y + NODE_HEIGHT}
            x2={child.x + NODE_WIDTH / 2}
            y2={child.y}
            className="stroke-border stroke-2"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Render node */}
        <TreeNode
          node={node}
          selected={isSelected}
          isBottleneck={isBottleneck}
          onClick={handleNodeClick}
        />

        {/* Render children */}
        {node.children.map((child) => renderTree(child))}
      </React.Fragment>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Controls */}
      <TreeControls
        scale={scale}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
        onReset={() => {
          setScale(1);
          if (containerRef.current) {
            const container = containerRef.current;
            const centerX = container.clientWidth / 2 - bounds.width / 2;
            const centerY = 50;
            setPosition({ x: centerX, y: centerY });
          }
        }}
      />

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          className="select-none"
        >
          {/* Define arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 5, 0 10"
                className="fill-border"
              />
            </marker>
          </defs>

          {/* Transform group */}
          <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
            {renderTree(layout)}
          </g>
        </svg>
      </div>
    </div>
  );
};
