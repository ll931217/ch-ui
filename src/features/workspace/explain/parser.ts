// src/features/workspace/explain/parser.ts
import { ExplainNode, ExplainResult } from '@/types/common';
import { getExplainType } from '@/helpers/sqlUtils';

/**
 * EXPLAIN query parser for ClickHouse
 * Supports text and JSON formats, PIPELINE, PLAN, AST, SYNTAX types
 */
export class ExplainParser {
  /**
   * Main entry point - parses EXPLAIN query results
   */
  static parse(query: string, result: any): ExplainResult {
    const explainType = getExplainType(query) || 'PLAN';

    // Check if result is JSON format
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      // Try to parse as JSON first
      const firstRow = result.data[0];
      if (firstRow && typeof firstRow === 'object' && 'explain' in firstRow) {
        if (typeof firstRow.explain === 'object' && firstRow.explain !== null) {
          // True JSON format - explain is a structured object
          const rawText = JSON.stringify(firstRow.explain, null, 2);
          const tree = this.parseJsonFormat(firstRow.explain, explainType);
          return {
            type: explainType,
            tree,
            rawText,
            rawJson: firstRow.explain,
          };
        } else {
          // Text format with "explain" column - each row is one line
          const rawText = result.data
            .map((row: any) => String(row.explain))
            .join('\n');
          const tree = this.parseTextFormat(rawText, explainType);
          return {
            type: explainType,
            tree,
            rawText,
          };
        }
      }

      // Text format - extract text from rows
      // ClickHouse returns EXPLAIN output as rows with a single column
      let rawText = '';

      // Handle different row structures
      if (result.data.length > 0) {
        const firstRow = result.data[0];
        const columnName = Object.keys(firstRow)[0];

        // Extract all rows
        rawText = result.data
          .map((row: any) => {
            const value = row[columnName];
            return typeof value === 'string' ? value : String(value);
          })
          .join('\n');
      }

      const tree = this.parseTextFormat(rawText, explainType);
      return {
        type: explainType,
        tree,
        rawText,
      };
    }

    // Fallback: empty result
    return {
      type: explainType,
      tree: {
        id: 'root',
        name: 'Empty Result',
        type: 'Root',
        children: [],
      },
      rawText: '',
    };
  }

  /**
   * Parse JSON format EXPLAIN output
   */
  private static parseJsonFormat(json: any, explainType: string): ExplainNode {
    let nodeCounter = 0;
    const getNextId = () => `node-${++nodeCounter}`;

    const parseNode = (node: any, parentType?: string): ExplainNode => {
      const id = getNextId();

      // Handle different JSON structures
      if (typeof node === 'string') {
        return {
          id,
          name: node,
          type: parentType || 'Expression',
          children: [],
        };
      }

      if (Array.isArray(node)) {
        // Array of nodes
        return {
          id,
          name: 'Pipeline',
          type: 'Pipeline',
          children: node.map((n) => parseNode(n, 'Pipeline')),
        };
      }

      if (typeof node === 'object' && node !== null) {
        // Extract node name and type
        const name = node.name || node.type || node.description || 'Unknown';
        const type = node.type || node.kind || parentType || 'Expression';

        // Extract metrics if available
        const metrics: any = {};
        if (node.rows !== undefined) metrics.rows = node.rows;
        if (node.bytes !== undefined) metrics.bytes = node.bytes;
        if (node.time !== undefined) metrics.time = node.time;
        if (node.cpu_time !== undefined) metrics.cpu_time = node.cpu_time;

        // Parse children
        const children: ExplainNode[] = [];
        if (node.children && Array.isArray(node.children)) {
          children.push(...node.children.map((n: any) => parseNode(n, type)));
        } else if (node.inputs && Array.isArray(node.inputs)) {
          children.push(...node.inputs.map((n: any) => parseNode(n, type)));
        } else if (node.plans && Array.isArray(node.plans)) {
          children.push(...node.plans.map((n: any) => parseNode(n, type)));
        }

        return {
          id,
          name,
          type,
          children,
          metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
          rawData: node,
        };
      }

      // Fallback
      return {
        id,
        name: String(node),
        type: parentType || 'Unknown',
        children: [],
      };
    };

    return parseNode(json);
  }

  /**
   * Parse text format EXPLAIN output (indentation-based)
   */
  private static parseTextFormat(text: string, explainType: string): ExplainNode {
    let lines = text.split('\n').filter((line) => line.trim().length > 0);

    // Skip header line if present (e.g., "EXPLAIN PIPELINE")
    if (lines.length > 0 && lines[0].trim().toUpperCase().startsWith('EXPLAIN')) {
      lines = lines.slice(1);
    }

    if (lines.length === 0) {
      return {
        id: 'root',
        name: 'Empty',
        type: 'Root',
        children: [],
      };
    }

    let nodeCounter = 0;
    const getNextId = () => `node-${++nodeCounter}`;

    // Parse lines into tree structure based on indentation
    interface ParsedLine {
      level: number;
      text: string;
      node: ExplainNode;
    }

    const parsedLines: ParsedLine[] = [];

    // Auto-detect indentation width
    let indentWidth = 2; // default
    const indentedLine = lines.find((line) => line.match(/^\s+/));
    if (indentedLine) {
      const match = indentedLine.match(/^(\s+)/);
      if (match) {
        indentWidth = match[1].length;
      }
    }

    lines.forEach((line) => {
      // Calculate indentation level
      const match = line.match(/^(\s*)/);
      const indentation = match ? match[1].length : 0;
      const level = indentation > 0 ? Math.floor(indentation / indentWidth) : 0;
      const text = line.trim();

      // Extract node name and type
      const { name, type, metrics } = this.parseTextLine(text);

      const node: ExplainNode = {
        id: getNextId(),
        name,
        type,
        children: [],
        metrics,
      };

      parsedLines.push({ level, text, node });
    });

    // Build tree structure
    const root: ExplainNode = {
      id: 'root',
      name: 'Query Plan',
      type: explainType,
      children: [],
    };

    const stack: { level: number; node: ExplainNode }[] = [
      { level: -1, node: root },
    ];

    parsedLines.forEach(({ level, node }) => {
      // Pop stack until we find the parent
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // Add to parent
      const parent = stack[stack.length - 1].node;
      parent.children.push(node);

      // Push to stack
      stack.push({ level, node });
    });

    return root;
  }

  /**
   * Parse a single text line to extract name, type, and metrics
   */
  private static parseTextLine(line: string): {
    name: string;
    type: string;
    metrics?: ExplainNode['metrics'];
  } {
    // Common patterns:
    // "Expression (Projection)"
    // "Aggregating"
    // "ReadFromMergeTree (table_name)"
    // "Expression ((Projection + Before ORDER BY))"
    // "(Expression)" - starts with parenthesis

    // Handle lines starting with '(' like "(Expression)"
    if (line.startsWith('(') && line.endsWith(')')) {
      const content = line.slice(1, -1);
      return {
        name: content,
        type: 'Step',
      };
    }

    // Extract type from parentheses
    const typeMatch = line.match(/^([^(]+)\s*\(([^)]+)\)/);
    if (typeMatch) {
      const operatorType = typeMatch[1].trim();
      const details = typeMatch[2].trim();
      // Use the detail as name, operator as type
      // e.g., "Expression (Projection)" -> name: "Projection", type: "Expression"
      return {
        name: details || operatorType,
        type: operatorType
      };
    }

    // No parentheses - use the whole line as both name and type
    const parts = line.split(' ');
    return {
      name: line,
      type: parts[0] || 'Expression',
    };
  }
}
