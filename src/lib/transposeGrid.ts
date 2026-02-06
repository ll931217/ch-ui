import { ColDef } from "ag-grid-community";

interface IRow {
  [key: string]: any;
}

interface ColumnMeta {
  name: string;
  type: string;
}

interface TransposedResult {
  columnDefs: ColDef<IRow>[];
  rowData: IRow[];
}

/**
 * Transpose selected grid rows into columns for easier inspection
 *
 * Normal view: Each row is a data record
 * Transposed view: Each original row becomes a column, with field names as rows
 *
 * Example:
 * Input (2 rows selected):
 *   | id | name  | age |
 *   |----|-------|-----|
 *   | 1  | Alice | 30  |
 *   | 2  | Bob   | 25  |
 *
 * Output (transposed):
 *   | Field | Row 1 | Row 2 |
 *   |-------|-------|-------|
 *   | id    | 1     | 2     |
 *   | name  | Alice | Bob   |
 *   | age   | 30    | 25    |
 *
 * @param selectedRows - Array of selected row objects
 * @param columnMeta - Original column metadata (name, type)
 * @returns Transposed column definitions and row data
 */
export function transposeGridData(
  selectedRows: IRow[],
  columnMeta: ColumnMeta[]
): TransposedResult {
  if (!selectedRows.length || !columnMeta.length) {
    return { columnDefs: [], rowData: [] };
  }

  // Create column definitions: "Field" + "Row 1", "Row 2", ...
  const columnDefs: ColDef<IRow>[] = [
    {
      headerName: "Field",
      field: "field",
      pinned: "left",
      minWidth: 150,
      flex: 1,
    },
    ...selectedRows.map((_, index) => ({
      headerName: `Row ${index + 1}`,
      field: `row_${index}`,
      minWidth: 120,
      flex: 1,
    })),
  ];

  // Create row data: Each row represents a field
  const rowData: IRow[] = columnMeta.map((col) => {
    const row: IRow = {
      field: col.name,
    };

    selectedRows.forEach((selectedRow, index) => {
      row[`row_${index}`] = selectedRow[col.name];
    });

    return row;
  });

  return { columnDefs, rowData };
}
