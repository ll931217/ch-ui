// src/features/workspace/explain/components/TreeView/TreeNode.tsx
import React from 'react';
import { TreeNodeLayout } from '../../layout';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  node: TreeNodeLayout;
  selected: boolean;
  isBottleneck: boolean;
  onClick: (node: TreeNodeLayout) => void;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

export const TreeNode = React.memo<TreeNodeProps>(
  ({ node, selected, isBottleneck, onClick }) => {
    const handleClick = () => {
      onClick(node);
    };

    return (
      <g
        className="tree-node cursor-pointer"
        onClick={handleClick}
        data-node-id={node.id}
      >
        {/* Node rectangle */}
        <rect
          x={node.x}
          y={node.y}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={6}
          className={cn(
            'transition-all duration-200',
            'stroke-2',
            selected
              ? 'fill-primary/10 stroke-primary'
              : isBottleneck
              ? 'fill-destructive/10 stroke-destructive'
              : 'fill-card stroke-border hover:stroke-primary/50'
          )}
        />

        {/* Node name */}
        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 20}
          textAnchor="middle"
          className={cn(
            'text-sm font-semibold pointer-events-none',
            selected
              ? 'fill-primary'
              : isBottleneck
              ? 'fill-destructive'
              : 'fill-foreground'
          )}
        >
          {truncateText(node.name, 20)}
        </text>

        {/* Node type */}
        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 38}
          textAnchor="middle"
          className="text-xs fill-muted-foreground pointer-events-none"
        >
          {truncateText(node.type, 22)}
        </text>

        {/* Metrics */}
        {node.metrics && (
          <text
            x={node.x + NODE_WIDTH / 2}
            y={node.y + 52}
            textAnchor="middle"
            className="text-xs fill-muted-foreground pointer-events-none"
          >
            {formatMetrics(node.metrics)}
          </text>
        )}

        {/* Bottleneck indicator */}
        {isBottleneck && (
          <circle
            cx={node.x + NODE_WIDTH - 8}
            cy={node.y + 8}
            r={4}
            className="fill-destructive"
          />
        )}
      </g>
    );
  }
);

TreeNode.displayName = 'TreeNode';

/**
 * Truncate text to fit in node
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format metrics for display
 */
function formatMetrics(metrics: {
  rows?: number;
  bytes?: number;
  time?: number;
  cpu_time?: number;
}): string {
  const parts: string[] = [];

  if (metrics.rows !== undefined) {
    parts.push(`${formatNumber(metrics.rows)} rows`);
  }

  if (metrics.bytes !== undefined) {
    parts.push(formatBytes(metrics.bytes));
  }

  if (metrics.time !== undefined) {
    parts.push(`${metrics.time.toFixed(2)}ms`);
  }

  return parts.join(' • ');
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
