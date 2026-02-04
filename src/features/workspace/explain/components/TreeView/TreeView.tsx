// src/features/workspace/explain/components/TreeView/TreeView.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TreeNodeLayout, TreeLayout } from '../../layout';
import { ExplainResult } from '@/types/common';
import { TreeNode } from './TreeNode';
import { TreeControls } from './TreeControls';
import { analyzeBottlenecks } from '../../metrics';
import { cn } from '@/lib/utils';

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

  // Node dragging state
  const [draggedNode, setDraggedNode] = useState<TreeNodeLayout | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodeOffsets, setNodeOffsets] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Calculate layout
  const layout = useMemo(() => {
    const tree = explainResult.tree;
    const result = TreeLayout.calculateLayout(tree);
    return result;
  }, [explainResult.tree]);

  // Calculate bounds
  const bounds = useMemo(() => {
    return TreeLayout.getTreeBounds(layout);
  }, [layout]);

  // Analyze bottlenecks
  const bottlenecks = useMemo(() => {
    return analyzeBottlenecks(explainResult.tree);
  }, [explainResult.tree]);

  // Calculate ancestors of selected node
  const ancestorIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();

    const ancestors = new Set<string>();

    const findPath = (node: TreeNodeLayout, targetId: string, path: string[]): boolean => {
      if (node.id === targetId) {
        path.forEach(id => ancestors.add(id));
        return true;
      }
      for (const child of node.children) {
        if (findPath(child, targetId, [...path, node.id])) {
          return true;
        }
      }
      return false;
    };

    findPath(layout, selectedNode.id, []);
    return ancestors;
  }, [selectedNode, layout]);

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

  // Helper to get node position with offset applied
  const getNodePosition = (node: TreeNodeLayout) => {
    const offset = nodeOffsets.get(node.id);
    return {
      x: node.x + (offset?.x ?? 0),
      y: node.y + (offset?.y ?? 0),
    };
  };

  // Handle node drag start
  const handleNodeDragStart = (node: TreeNodeLayout, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only

    e.stopPropagation();
    setDraggedNode(node);

    // Calculate offset from node origin
    const nodePos = getNodePosition(node);
    const svgX = (e.clientX - position.x) / scale;
    const svgY = (e.clientY - position.y) / scale;

    setDragOffset({ x: svgX - nodePos.x, y: svgY - nodePos.y });
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.1, Math.min(2, prev + delta)));
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Right mouse button for panning
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
    // Left click is handled by TreeNode for dragging
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggedNode) {
      // Calculate new position in SVG coordinates
      const svgX = (e.clientX - position.x) / scale;
      const svgY = (e.clientY - position.y) / scale;

      setNodeOffsets(prev => {
        const next = new Map(prev);
        next.set(draggedNode.id, {
          x: svgX - dragOffset.x - draggedNode.x,
          y: svgY - dragOffset.y - draggedNode.y,
        });
        return next;
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
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
    const isAncestor = ancestorIds.has(node.id);
    const isDragging = draggedNode?.id === node.id;
    const pos = getNodePosition(node);

    return (
      <React.Fragment key={node.id}>
        {/* Render edges to children */}
        {node.children.map((child) => {
          const childPos = getNodePosition(child);
          const isPathHighlighted = (isAncestor || isSelected) &&
            (ancestorIds.has(child.id) || selectedNode?.id === child.id);

          return (
            <line
              key={`${node.id}-${child.id}`}
              x1={pos.x + NODE_WIDTH / 2}
              y1={pos.y + NODE_HEIGHT}
              x2={childPos.x + NODE_WIDTH / 2}
              y2={childPos.y}
              className={cn(
                "stroke-2",
                isPathHighlighted ? "stroke-primary" : "stroke-border"
              )}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Render node */}
        <TreeNode
          node={node}
          position={pos}
          selected={isSelected}
          isAncestor={isAncestor}
          isBottleneck={isBottleneck}
          isDragging={isDragging}
          onClick={handleNodeClick}
          onDragStart={handleNodeDragStart}
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
        onResetLayout={() => setNodeOffsets(new Map())}
      />

      {/* SVG Container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full",
          isPanning ? "cursor-grabbing" : draggedNode ? "cursor-grabbing" : "cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
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
