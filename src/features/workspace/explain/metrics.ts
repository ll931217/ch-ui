// src/features/workspace/explain/metrics.ts
import { ExplainNode } from '@/types/common';

/**
 * Analyze query plan for performance bottlenecks
 * Returns set of node IDs that are potential bottlenecks
 */
export function analyzeBottlenecks(tree: ExplainNode): Set<string> {
  const bottlenecks = new Set<string>();

  // Collect all nodes with metrics
  const nodesWithMetrics: ExplainNode[] = [];

  const traverse = (node: ExplainNode) => {
    if (node.metrics) {
      nodesWithMetrics.push(node);
    }
    node.children.forEach(traverse);
  };

  traverse(tree);

  if (nodesWithMetrics.length === 0) {
    return bottlenecks;
  }

  // Calculate statistics for each metric type
  const stats = calculateStats(nodesWithMetrics);

  // Identify bottlenecks based on P90 thresholds
  nodesWithMetrics.forEach((node) => {
    const metrics = node.metrics!;

    // High row count
    if (metrics.rows !== undefined && stats.rows.p90 !== null) {
      if (metrics.rows >= stats.rows.p90) {
        bottlenecks.add(node.id);
      }
    }

    // High byte count
    if (metrics.bytes !== undefined && stats.bytes.p90 !== null) {
      if (metrics.bytes >= stats.bytes.p90) {
        bottlenecks.add(node.id);
      }
    }

    // High time
    if (metrics.time !== undefined && stats.time.p90 !== null) {
      if (metrics.time >= stats.time.p90) {
        bottlenecks.add(node.id);
      }
    }

    // High CPU time
    if (metrics.cpu_time !== undefined && stats.cpu_time.p90 !== null) {
      if (metrics.cpu_time >= stats.cpu_time.p90) {
        bottlenecks.add(node.id);
      }
    }
  });

  return bottlenecks;
}

/**
 * Calculate statistics for metrics
 */
function calculateStats(nodes: ExplainNode[]): {
  rows: MetricStats;
  bytes: MetricStats;
  time: MetricStats;
  cpu_time: MetricStats;
} {
  return {
    rows: calculateMetricStats(nodes, 'rows'),
    bytes: calculateMetricStats(nodes, 'bytes'),
    time: calculateMetricStats(nodes, 'time'),
    cpu_time: calculateMetricStats(nodes, 'cpu_time'),
  };
}

interface MetricStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  p90: number | null;
}

/**
 * Calculate statistics for a single metric
 */
function calculateMetricStats(
  nodes: ExplainNode[],
  metric: 'rows' | 'bytes' | 'time' | 'cpu_time'
): MetricStats {
  const values = nodes
    .map((node) => node.metrics?.[metric])
    .filter((v): v is number => v !== undefined)
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return { min: null, max: null, avg: null, p90: null };
  }

  const min = values[0];
  const max = values[values.length - 1];
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

  // Calculate P90
  const p90Index = Math.floor(values.length * 0.9);
  const p90 = values[p90Index];

  return { min, max, avg, p90 };
}

/**
 * Get bottleneck score for a node (0-100)
 * Higher score = worse bottleneck
 */
export function getBottleneckScore(
  node: ExplainNode,
  tree: ExplainNode
): number {
  if (!node.metrics) {
    return 0;
  }

  // Collect all nodes
  const nodes: ExplainNode[] = [];
  const traverse = (n: ExplainNode) => {
    if (n.metrics) {
      nodes.push(n);
    }
    n.children.forEach(traverse);
  };
  traverse(tree);

  if (nodes.length === 0) {
    return 0;
  }

  const stats = calculateStats(nodes);
  const metrics = node.metrics;

  let score = 0;
  let count = 0;

  // Score based on rows
  if (metrics.rows !== undefined && stats.rows.max !== null) {
    score += (metrics.rows / stats.rows.max) * 100;
    count++;
  }

  // Score based on bytes
  if (metrics.bytes !== undefined && stats.bytes.max !== null) {
    score += (metrics.bytes / stats.bytes.max) * 100;
    count++;
  }

  // Score based on time
  if (metrics.time !== undefined && stats.time.max !== null) {
    score += (metrics.time / stats.time.max) * 100;
    count++;
  }

  // Score based on CPU time
  if (metrics.cpu_time !== undefined && stats.cpu_time.max !== null) {
    score += (metrics.cpu_time / stats.cpu_time.max) * 100;
    count++;
  }

  return count > 0 ? score / count : 0;
}
