import { useState, useCallback } from 'react'

export interface CellPosition {
  rowIndex: number
  colId: string
}

export interface SelectionState {
  selectedCells: Set<string>
  anchorCell: CellPosition | null
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
    anchorCell: null
  })

  const clearSelection = useCallback(() => {
    setSelection({
      selectedCells: new Set(),
      anchorCell: null
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
          selectedCells: newSelectedCells
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
          anchorCell: { rowIndex, colId }
        }
      } else {
        // Regular click: clear and select single cell
        return {
          selectedCells: new Set([cellKey]),
          anchorCell: { rowIndex, colId }
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
          anchorCell: { rowIndex: fromRow, colId: columns[fromColIndex]?.colId || '' }
        }
      })
    },
    []
  )

  const isCellSelected = useCallback((rowIndex: number, colId: string): boolean => {
    return selection.selectedCells.has(getCellKey(rowIndex, colId))
  }, [selection.selectedCells])

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
      if (selection.selectedCells.size > 0) {
        // Return selected cells grouped by row
        const result: Record<number, Record<string, unknown>> = {}
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
    [selection.selectedCells]
  )

  return {
    selection,
    selectCell,
    selectCellRange,
    clearSelection,
    isCellSelected,
    getSelectedColumns,
    getSelectedData
  }
}
