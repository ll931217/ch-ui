// src/features/workspace/explain/components/TextView.tsx
import React, { useMemo } from 'react';
import { ExplainResult, ExplainNode } from '@/types/common';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useTheme } from '@/components/common/theme-provider';

interface TextViewProps {
  explainResult: ExplainResult;
}

interface FlattenedNode {
  id: string;
  level: number;
  name: string;
  type: string;
  rows?: number;
  bytes?: number;
  time?: number;
  cpu_time?: number;
}

export const TextView: React.FC<TextViewProps> = ({ explainResult }) => {
  const { theme } = useTheme();

  // Flatten tree to array
  const flattenedData = useMemo(() => {
    const result: FlattenedNode[] = [];

    const flatten = (node: ExplainNode, level: number) => {
      result.push({
        id: node.id,
        level,
        name: node.name,
        type: node.type,
        rows: node.metrics?.rows,
        bytes: node.metrics?.bytes,
        time: node.metrics?.time,
        cpu_time: node.metrics?.cpu_time,
      });

      node.children.forEach((child) => flatten(child, level + 1));
    };

    flatten(explainResult.tree, 0);
    return result;
  }, [explainResult.tree]);

  // Column definitions
  const columnDefs = useMemo<ColDef<FlattenedNode>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Node Name',
        flex: 2,
        cellRenderer: (params: any) => {
          const indent = '  '.repeat(params.data.level);
          return `${indent}${params.value}`;
        },
      },
      {
        field: 'type',
        headerName: 'Type',
        flex: 1,
      },
      {
        field: 'rows',
        headerName: 'Rows',
        flex: 1,
        valueFormatter: (params: any) =>
          params.value !== undefined ? params.value.toLocaleString() : '-',
      },
      {
        field: 'bytes',
        headerName: 'Bytes',
        flex: 1,
        valueFormatter: (params: any) =>
          params.value !== undefined ? formatBytes(params.value) : '-',
      },
      {
        field: 'time',
        headerName: 'Time (ms)',
        flex: 1,
        valueFormatter: (params: any) =>
          params.value !== undefined ? params.value.toFixed(2) : '-',
      },
      {
        field: 'cpu_time',
        headerName: 'CPU Time (ms)',
        flex: 1,
        valueFormatter: (params: any) =>
          params.value !== undefined ? params.value.toFixed(2) : '-',
      },
    ],
    []
  );

  return (
    <div
      className={theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}
      style={{ width: '100%', height: '100%' }}
    >
      <AgGridReact
        rowData={flattenedData}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          resizable: true,
          filter: true,
        }}
        suppressCellFocus={true}
        rowSelection="single"
      />
    </div>
  );
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
