import React, { useCallback, useState, useEffect } from "react";
import { IHeaderParams } from "ag-grid-community";
import { Pin, PinOff, ArrowLeftToLine, ArrowRightToLine, Maximize2, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface AgGridHeaderContextMenuProps extends IHeaderParams {
  onPinColumn: (colId: string, pinned: 'left' | 'right' | null) => void;
  onAutoSizeColumn: (colId: string) => void;
  onResetColumns: () => void;
}

/**
 * Custom AG Grid header component with context menu
 *
 * Provides right-click functionality for:
 * - Pinning columns left/right
 * - Unpinning columns
 * - Auto-sizing columns
 * - Resetting all columns
 *
 * Also preserves default AG Grid sorting functionality
 */
const AgGridHeaderContextMenu: React.FC<AgGridHeaderContextMenuProps> = (props) => {
  const { column, displayName, onPinColumn, onAutoSizeColumn, onResetColumns, enableSorting, setSort } = props;

  const colId = column.getColId();
  const isPinned = column.isPinned();
  const [sortState, setSortState] = useState<string | null>(null);

  // Subscribe to sort changes
  useEffect(() => {
    const updateSort = () => {
      setSortState(column.getSort());
    };

    // Initial state
    updateSort();

    // Listen for sort changes
    column.addEventListener('sortChanged', updateSort);

    return () => {
      column.removeEventListener('sortChanged', updateSort);
    };
  }, [column]);

  const handlePinLeft = useCallback(() => {
    onPinColumn(colId, 'left');
  }, [colId, onPinColumn]);

  const handlePinRight = useCallback(() => {
    onPinColumn(colId, 'right');
  }, [colId, onPinColumn]);

  const handleUnpin = useCallback(() => {
    onPinColumn(colId, null);
  }, [colId, onPinColumn]);

  const handleAutoSize = useCallback(() => {
    onAutoSizeColumn(colId);
  }, [colId, onAutoSizeColumn]);

  const handleResetColumns = useCallback(() => {
    onResetColumns();
  }, [onResetColumns]);

  // Handle sorting when header is clicked
  const handleSort = useCallback((event: React.MouseEvent) => {
    // Don't sort on right-click (context menu)
    if (event.button !== 0) return;

    if (enableSorting && setSort) {
      const multiSort = event.shiftKey;
      setSort(sortState === 'asc' ? 'desc' : 'asc', multiSort);
    }
  }, [enableSorting, setSort, sortState]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="ag-header-cell-label w-full h-full flex items-center cursor-pointer"
          onClick={handleSort}
          onMouseDown={(e) => {
            // Prevent text selection on double-click
            if (e.detail > 1) {
              e.preventDefault();
            }
          }}
        >
          <span className="ag-header-cell-text">{displayName}</span>
          {sortState && (
            <span className="ml-1 flex items-center">
              {sortState === 'asc' && <ArrowUp className="h-3 w-3" />}
              {sortState === 'desc' && <ArrowDown className="h-3 w-3" />}
            </span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {!isPinned && (
          <>
            <ContextMenuItem onClick={handlePinLeft}>
              <ArrowLeftToLine className="mr-2 h-4 w-4" />
              Pin Left
            </ContextMenuItem>
            <ContextMenuItem onClick={handlePinRight}>
              <ArrowRightToLine className="mr-2 h-4 w-4" />
              Pin Right
            </ContextMenuItem>
          </>
        )}
        {isPinned && (
          <ContextMenuItem onClick={handleUnpin}>
            <PinOff className="mr-2 h-4 w-4" />
            Unpin
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleAutoSize}>
          <Maximize2 className="mr-2 h-4 w-4" />
          Auto-size Column
        </ContextMenuItem>
        <ContextMenuItem onClick={handleResetColumns}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset All Columns
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default React.memo(AgGridHeaderContextMenu);
