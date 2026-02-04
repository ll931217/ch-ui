// src/features/workspace/explain/components/TextView.tsx
import React from 'react';
import { ExplainResult } from '@/types/common';

interface TextViewProps {
  explainResult: ExplainResult;
}

export const TextView: React.FC<TextViewProps> = ({ explainResult }) => {
  return (
    <div className="h-full overflow-auto p-4 bg-muted/30">
      <pre className="font-mono text-sm whitespace-pre-wrap break-words">
        {explainResult.rawText || 'No text output available'}
      </pre>
    </div>
  );
};
