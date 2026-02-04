// src/features/workspace/explain/components/TreeView/TreeControls.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface TreeControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onResetLayout: () => void;
}

export const TreeControls: React.FC<TreeControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onResetLayout,
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-card/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        title="Reset View"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onResetLayout}
        title="Reset Node Positions"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <div className="px-2 py-1 text-xs text-muted-foreground text-center border-t">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};
