// src/features/workspace/explain/components/ExplainVisualization.tsx
import React from "react";
import { ExplainResult } from "@/types/common";
import { TreeView } from "./TreeView/TreeView";
import { JsonView } from "./JsonView";
import { TextView } from "./TextView";

interface ExplainVisualizationProps {
  explainResult: ExplainResult;
  viewType: "tree" | "json" | "text";
  onNodeSelect?: (node: any) => void;
}

export const ExplainVisualization: React.FC<ExplainVisualizationProps> = ({
  explainResult,
  viewType,
  onNodeSelect,
}) => {
  switch (viewType) {
    case "tree":
      return (
        <TreeView explainResult={explainResult} onNodeSelect={onNodeSelect} />
      );
    case "json":
      return <JsonView explainResult={explainResult} />;
    case "text":
      return <TextView explainResult={explainResult} />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Unknown view type</p>
        </div>
      );
  }
};
