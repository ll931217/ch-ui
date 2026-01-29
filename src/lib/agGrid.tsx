import React from "react";
import { ColDef, ICellRendererParams, GridOptions, ColumnPinnedType } from "ag-grid-community";

/**
 * Performance thresholds for dynamic AG Grid configuration
 *
 * LARGE_DATASET: Disables animations to reduce overhead
 * VERY_LARGE_DATASET: Future threshold for additional optimizations
 */
export const LARGE_DATASET = 500;
export const VERY_LARGE_DATASET = 5000;

/**
 * Type for column pinning state
 */
export interface PinnedColumnsState {
  [colId: string]: ColumnPinnedType;
}

/**
 * Format cell values for display in AG Grid
 *
 * Handles null/undefined values and complex objects consistently
 */
export const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

/**
 * Memoized cell renderer component for AG Grid
 *
 * PERFORMANCE NOTE: React.memo() prevents unnecessary re-renders
 * when cell values haven't changed, critical for large datasets.
 *
 * SECURITY NOTE: Uses React elements instead of unsafe HTML injection
 * to prevent XSS vulnerabilities.
 */
export const CellRenderer = React.memo((props: ICellRendererParams) => {
  const formattedValue = formatCellValue(props.value);
  const isNull = props.value === null || props.value === undefined;

  return (
    <span
      className={isNull ? "italic text-muted-foreground truncate" : "truncate"}
      title={formattedValue}
    >
      {formattedValue}
    </span>
  );
});

CellRenderer.displayName = "CellRenderer";

/**
 * Create default column definition for AG Grid
 *
 * CRITICAL: Does NOT include autoHeight: true, which would disable
 * row virtualization and render all rows in the DOM simultaneously.
 */
export const createDefaultColDef = (): ColDef => ({
  flex: 1,
  minWidth: 130,
  sortable: true,
  filter: true,
  resizable: true,
  filterParams: { buttons: ["reset", "apply"] },
  cellRenderer: CellRenderer,
  // NOTE: autoHeight is intentionally NOT set (would disable virtualization)
});

/**
 * Create grid options dynamically based on dataset size
 *
 * @param rowCount - Number of rows in the dataset
 * @returns Partial grid options optimized for the dataset size
 *
 * PERFORMANCE OPTIMIZATION:
 * - Small datasets (<500 rows): Enable animations for better UX
 * - Large datasets (≥500 rows): Disable animations to reduce overhead
 * - Always uses row virtualization (no autoHeight)
 */
export const createGridOptions = (rowCount: number): Partial<GridOptions> => {
  const isLargeDataset = rowCount >= LARGE_DATASET;

  return {
    pagination: true,
    paginationPageSize: 100,
    enableCellTextSelection: true,
    animateRows: !isLargeDataset, // Disable animations for large datasets
    suppressMovableColumns: false,
    // domLayout: 'normal' is the default (enables virtualization)
  };
};

/**
 * Apply pinned state to column definitions
 *
 * @param colDefs - Original column definitions
 * @param pinnedState - Map of column IDs to their pinned state
 * @returns Column definitions with pinned state applied
 */
export const applyPinnedState = <T = any>(
  colDefs: ColDef<T>[],
  pinnedState: PinnedColumnsState
): ColDef<T>[] => {
  return colDefs.map((colDef) => {
    const field = colDef.field || colDef.headerName;
    if (!field) return colDef;

    const pinnedValue = pinnedState[field];
    if (pinnedValue !== undefined) {
      return { ...colDef, pinned: pinnedValue };
    }
    return colDef;
  });
};
