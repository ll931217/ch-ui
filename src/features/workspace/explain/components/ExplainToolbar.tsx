// src/features/workspace/explain/components/ExplainToolbar.tsx
import React from 'react';
import { ExplainResult } from '@/types/common';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { exportAsJson, exportAsSvg } from '../export';

interface ExplainToolbarProps {
  explainResult: ExplainResult;
  viewType: 'tree' | 'json' | 'text';
  onViewTypeChange: (viewType: 'tree' | 'json' | 'text') => void;
}

export const ExplainToolbar: React.FC<ExplainToolbarProps> = ({
  explainResult,
  viewType,
  onViewTypeChange,
}) => {
  const handleExportJson = () => {
    exportAsJson(explainResult);
  };

  const handleExportSvg = () => {
    if (viewType === 'tree') {
      exportAsSvg(explainResult);
    }
  };

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b bg-card">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">EXPLAIN {explainResult.type}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* View Type Selector */}
        <Select value={viewType} onValueChange={onViewTypeChange}>
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tree">Tree View</SelectItem>
            <SelectItem value="json">JSON View</SelectItem>
            <SelectItem value="text">Text View</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJson}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>

        {viewType === 'tree' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSvg}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export SVG
          </Button>
        )}
      </div>
    </div>
  );
};
