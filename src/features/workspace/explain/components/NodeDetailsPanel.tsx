// src/features/workspace/explain/components/NodeDetailsPanel.tsx
import React from 'react';
import { TreeNodeLayout } from '../layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBottleneckScore } from '../metrics';
import { ExplainNode } from '@/types/common';

interface NodeDetailsPanelProps {
  node: TreeNodeLayout | null;
  tree: ExplainNode;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  tree,
}) => {
  if (!node) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Node Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a node to view details
          </p>
        </CardContent>
      </Card>
    );
  }

  const bottleneckScore = getBottleneckScore(node, tree);

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{node.name}</CardTitle>
          {bottleneckScore > 70 && (
            <Badge variant="destructive">Bottleneck</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Type</h4>
          <p className="text-sm text-muted-foreground">{node.type}</p>
        </div>

        {/* Metrics */}
        {node.metrics && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Metrics</h4>
            <div className="space-y-2">
              {node.metrics.rows !== undefined && (
                <MetricRow
                  label="Rows"
                  value={node.metrics.rows.toLocaleString()}
                />
              )}
              {node.metrics.bytes !== undefined && (
                <MetricRow
                  label="Bytes"
                  value={formatBytes(node.metrics.bytes)}
                />
              )}
              {node.metrics.time !== undefined && (
                <MetricRow
                  label="Time"
                  value={`${node.metrics.time.toFixed(2)} ms`}
                />
              )}
              {node.metrics.cpu_time !== undefined && (
                <MetricRow
                  label="CPU Time"
                  value={`${node.metrics.cpu_time.toFixed(2)} ms`}
                />
              )}
            </div>
          </div>
        )}

        {/* Bottleneck Score */}
        {bottleneckScore > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Bottleneck Score</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className={`h-full rounded-full ${
                    bottleneckScore > 70
                      ? 'bg-destructive'
                      : bottleneckScore > 40
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${bottleneckScore}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(bottleneckScore)}%
              </span>
            </div>
          </div>
        )}

        {/* Children */}
        {node.children.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Children</h4>
            <p className="text-sm text-muted-foreground">
              {node.children.length} child node(s)
            </p>
          </div>
        )}

        {/* Raw Data */}
        {node.rawData && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Raw Data</h4>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(node.rawData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Metric row component
 */
const MetricRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
