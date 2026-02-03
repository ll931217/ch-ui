import { useState, useCallback } from 'react'

export interface CellPosition {
  rowIndex: number
  colId: string
}

export interface SelectionState {
  selectedCells: Set<string>
  selectedRows: Set<number>
  anchorCell: CellPosition | null
  anchorRow: number | null
}

const getCellKey = (rowIndex: number, colId: string): string => {
  return `${rowIndex}:${colId}`
}

const parseCellKey = (key: string): CellPosition => {
  const [rowIndex, colId] = key.split(':')
  return {
    rowIndex: parseInt(rowIndex, 10),
    colId
  }
}

export const useCellSelection = () => {
  const [selection, setSelection] = useState<SelectionState>({
    selectedCells: new Set(),
    selectedRows: new Set(),
    anchorCell: null,
    anchorRow: null
  })

  const clearSelection = useCallback(() => {
    setSelection({
      selectedCells: new Set(),
      selectedRows: new Set(),
      anchorCell: null,
      anchorRow: null
    })
  }, [])

  const selectCell = useCallback((rowIndex: number, colId: string, event?: React.MouseEvent) => {
    const isCtrlKey = event ? event.ctrlKey || event.metaKey : false
    const isShiftKey = event ? event.shiftKey : false

    setSelection(prev => {
      const newSelectedCells = new Set(prev.selectedCells)
      const cellKey = getCellKey(rowIndex, colId)

      if (isShiftKey && prev.anchorCell) {
        // Range selection
        const fromRow = Math.min(prev.anchorCell.rowIndex, rowIndex)
        const toRow = Math.max(prev.anchorCell.rowIndex, rowIndex)
        // Simplified: select all cells in the range for the same column
        for (let r = fromRow; r <= toRow; r++) {
          newSelectedCells.add(getCellKey(r, colId))
        }
        return {
          ...prev,
          selectedCells: newSelectedCells,
          selectedRows: new Set()
        }
      } else if (isCtrlKey) {
        // Toggle selection
        if (newSelectedCells.has(cellKey)) {
          newSelectedCells.delete(cellKey)
        } else {
          newSelectedCells.add(cellKey)
        }
        return {
          ...prev,
          selectedCells: newSelectedCells,
          selectedRows: new Set(),
          anchorCell: { rowIndex, colId }
        }
      } else {
        // Regular click: clear and select single cell
        return {
          selectedCells: new Set([cellKey]),
          selectedRows: new Set(),
          anchorCell: { rowIndex, colId },
          anchorRow: null
        }
      }
    })
  }, [])

  const selectRow = useCallback((rowIndex: number, event?: React.MouseEvent) => {
    const isCtrlKey = event ? event.ctrlKey || event.metaKey : false
    const isShiftKey = event ? event.shiftKey : false

    setSelection(prev => {
      const newSelectedRows = new Set(prev.selectedRows)

      if (isShiftKey && prev.anchorRow !== null) {
        // Range selection
        const fromRow = Math.min(prev.anchorRow, rowIndex)
        const toRow = Math.max(prev.anchorRow, rowIndex)
        for (let r = fromRow; r <= toRow; r++) {
          newSelectedRows.add(r)
        }
        return {
          ...prev,
          selectedRows: newSelectedRows,
          selectedCells: new Set()
        }
      } else if (isCtrlKey) {
        // Toggle selection
        if (newSelectedRows.has(rowIndex)) {
          newSelectedRows.delete(rowIndex)
        } else {
          newSelectedRows.add(rowIndex)
        }
        return {
          ...prev,
          selectedRows: newSelectedRows,
          selectedCells: new Set(),
          anchorRow: rowIndex
        }
      } else {
        // Regular click: clear and select single row
        return {
          selectedCells: new Set(),
          selectedRows: new Set([rowIndex]),
          anchorCell: null,
          anchorRow: rowIndex
        }
      }
    })
  }, [])

  const selectCellRange = useCallback(
    (
      fromRow: number,
      toRow: number,
      fromColIndex: number,
      toColIndex: number,
      columns: Array<{ colId: string }>
    ) => {
      setSelection(prev => {
        const newSelectedCells = new Set(prev.selectedCells)
        const minRow = Math.min(fromRow, toRow)
        const maxRow = Math.max(fromRow, toRow)
        const minColIndex = Math.min(fromColIndex, toColIndex)
        const maxColIndex = Math.max(fromColIndex, toColIndex)

        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minColIndex; c <= maxColIndex; c++) {
            if (c < columns.length) {
              newSelectedCells.add(getCellKey(r, columns[c].colId))
            }
          }
        }

        return {
          ...prev,
          selectedCells: newSelectedCells,
          selectedRows: new Set(),
          anchorCell: { rowIndex: fromRow, colId: columns[fromColIndex]?.colId || '' }
        }
      })
    },
    []
  )

  const isCellSelected = useCallback((rowIndex: number, colId: string): boolean => {
    return selection.selectedCells.has(getCellKey(rowIndex, colId))
  }, [selection.selectedCells])

  const isRowSelected = useCallback((rowIndex: number): boolean => {
    return selection.selectedRows.has(rowIndex)
  }, [selection.selectedRows])

  const getSelectedColumns = useCallback((): string[] => {
    const columns = new Set<string>()
    selection.selectedCells.forEach(cellKey => {
      const { colId } = parseCellKey(cellKey)
      columns.add(colId)
    })
    return Array.from(columns)
  }, [selection.selectedCells])

  const getSelectedData = useCallback(
    (rowData: Array<Record<string, unknown>>, columns: Array<{ colId: string }>) => {
      if (selection.selectedRows.size > 0) {
        // Return full rows
        return Array.from(selection.selectedRows).map(rowIndex => rowData[rowIndex])
      } else if (selection.selectedCells.size > 0) {
        // Return selected cells grouped by row
        const result: Record<string, Record<string, unknown>> = {}
        selection.selectedCells.forEach(cellKey => {
          const { rowIndex, colId } = parseCellKey(cellKey)
          if (!result[rowIndex]) {
            result[rowIndex] = {}
          }
          result[rowIndex][colId] = rowData[rowIndex]?.[colId]
        })
        return Object.values(result)
      }
      return []
    },
    [selection.selectedCells, selection.selectedRows]
  )

  return {
    selection,
    selectCell,
    selectRow,
    selectCellRange,
    clearSelection,
    isCellSelected,
    isRowSelected,
    getSelectedColumns,
    getSelectedData
  }
}
