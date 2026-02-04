import { useMemo, useRef, useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, AllCommunityModule, ColumnPinnedType } from "ag-grid-community";
import { AgGridWrapper } from "./AgGridWrapper";
import { useTheme } from "@/components/common/theme-provider";
import EmptyQueryResult from "@/features/workspace/components/EmptyQueryResult";
import StatisticsDisplay from "@/features/workspace/components/StatisticsDisplay";
import DownloadDialog from "@/components/common/DownloadDialog";
import { createDefaultColDef, createGridOptions, PinnedColumnsState, createAgGridTheme } from "@/lib/agGrid";
import AgGridHeaderContextMenu from "@/components/common/AgGridHeaderContextMenu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QueryResult {
  meta?: any[];
  data?: any[];
  rows?: number;
  statistics?: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

interface AgTableProps {
  data: QueryResult;
  height?: number | string; // container height
}

export default function AgTable({ data, height = "350px" }: AgTableProps) {
  const { theme } = useTheme();

  const gridTheme = createAgGridTheme(theme);

  const defaultColDef = useMemo(() => createDefaultColDef(), []);
  const gridOptions = useMemo(
    () => createGridOptions(data?.data?.length || 0),
    [data?.data?.length]
  );

  const dataGridRef = useRef<AgGridReact<any>>(null);
  const metaGridRef = useRef<AgGridReact<any>>(null);

  const [dataPinnedColumnsState, setDataPinnedColumnsState] = useState<PinnedColumnsState>({});
  const [metaPinnedColumnsState, setMetaPinnedColumnsState] = useState<PinnedColumnsState>({});

  // Data grid column handlers
  const handleDataPinColumn = useCallback(
    (colId: string, pinned: ColumnPinnedType) => {
      setDataPinnedColumnsState((prev) => ({
        ...prev,
        [colId]: pinned,
      }));

      const gridApi = dataGridRef.current?.api;
      if (gridApi) {
        gridApi.applyColumnState({
          state: [{ colId, pinned }],
        });
      }
    },
    []
  );

  const handleDataAutoSizeColumn = useCallback((colId: string) => {
    const gridApi = dataGridRef.current?.api;
    if (gridApi) {
      gridApi.autoSizeColumns([colId]);
    }
  }, []);

  const handleDataResetColumns = useCallback(() => {
    setDataPinnedColumnsState({});
    const gridApi = dataGridRef.current?.api;
    if (gridApi) {
      gridApi.resetColumnState();
    }
  }, []);

  // Metadata grid column handlers
  const handleMetaPinColumn = useCallback(
    (colId: string, pinned: ColumnPinnedType) => {
      setMetaPinnedColumnsState((prev) => ({
        ...prev,
        [colId]: pinned,
      }));

      const gridApi = metaGridRef.current?.api;
      if (gridApi) {
        gridApi.applyColumnState({
          state: [{ colId, pinned }],
        });
      }
    },
    []
  );

  const handleMetaAutoSizeColumn = useCallback((colId: string) => {
    const gridApi = metaGridRef.current?.api;
    if (gridApi) {
      gridApi.autoSizeColumns([colId]);
    }
  }, []);

  const handleMetaResetColumns = useCallback(() => {
    setMetaPinnedColumnsState({});
    const gridApi = metaGridRef.current?.api;
    if (gridApi) {
      gridApi.resetColumnState();
    }
  }, []);

  const dataColumnDefs = useMemo(() => {
    if (!data?.data?.length) return [];
    return Object.keys(data.data[0]).map((key) => ({
      headerName: key,
      field: key,
      valueGetter: (params: any) => params.data[key],
      headerComponent: AgGridHeaderContextMenu,
      headerComponentParams: {
        onPinColumn: handleDataPinColumn,
        onAutoSizeColumn: handleDataAutoSizeColumn,
        onResetColumns: handleDataResetColumns,
      },
    }));
  }, [data?.data, handleDataPinColumn, handleDataAutoSizeColumn, handleDataResetColumns]);

  const metaColumnDefs = useMemo(() => {
    if (!data?.meta?.length) return [];
    return Object.keys(data.meta[0]).map((key) => ({
      headerName: key,
      field: key,
      valueGetter: (params: any) => params.data[key],
      headerComponent: AgGridHeaderContextMenu,
      headerComponentParams: {
        onPinColumn: handleMetaPinColumn,
        onAutoSizeColumn: handleMetaAutoSizeColumn,
        onResetColumns: handleMetaResetColumns,
      },
    }));
  }, [data?.meta, handleMetaPinColumn, handleMetaAutoSizeColumn, handleMetaResetColumns]);

  // If no data is available yet or still loading
  if (!data || (!data.data && !data.meta && !data.statistics)) {
    return null;
  }

  // If there's data but it's empty
  if (data.rows === 0 || !data.data?.length) {
    return data.statistics ? (
      <EmptyQueryResult statistics={data.statistics} />
    ) : null;
  }

  const containerHeight =
    typeof height === "number" ? `${height}px` : height || "350px";
  const isFull = containerHeight === "100%";

  return (
    <Tabs defaultValue="results" className="h-full flex flex-col">
      <TabsList className="w-full shrink-0">
        <TabsTrigger className="w-full" value="results">
          Results {data.rows && `(${data.rows} rows)`}
        </TabsTrigger>
        <TabsTrigger className="w-full" value="metadata">
          Metadata {data.meta && `(${data.meta.length} fields)`}
        </TabsTrigger>
        <TabsTrigger className="w-full" value="statistics">
          Statistics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="results" className="flex-1 min-h-0" style={{ height: 'auto' }}>
        <div className="flex items-center justify-end pb-2">
          <DownloadDialog data={data.data || []} />
        </div>
        <div
          className={`ag-theme-balham w-full overflow-auto ${isFull ? 'h-full flex-1 min-h-0' : ''}`}
          style={isFull ? undefined : { height: containerHeight }}
        >
          <AgGridWrapper
              ref={dataGridRef}
              rowData={data.data || []}
              columnDefs={dataColumnDefs}
              defaultColDef={defaultColDef}
              modules={[AllCommunityModule]}
              theme={gridTheme}
              rowHeight={32}
              domLayout="normal"
              {...gridOptions}
            />
        </div>
      </TabsContent>
      <TabsContent
        value="metadata"
        className="flex-1 min-h-0"
        style={{ height: 'auto' }}
      >
        <div className="flex items-center justify-end pb-2">
          <DownloadDialog data={data?.meta || []} />
        </div>
        <div
          className={`ag-theme-balham w-full overflow-auto ${isFull ? 'h-full flex-1 min-h-0' : ''}`}
          style={isFull ? undefined : { height: containerHeight }}
        >
          <AgGridWrapper
              ref={metaGridRef}
              rowData={data.meta || []}
              columnDefs={metaColumnDefs}
              defaultColDef={defaultColDef}
              modules={[AllCommunityModule]}
              theme={gridTheme}
              rowHeight={32}
              pagination={true}
              paginationPageSize={100}
              enableCellTextSelection={true}
              animateRows={false}
            />
        </div>
      </TabsContent>
      <TabsContent value="statistics" className="flex-1 min-h-0 overflow-auto">
        {data.statistics && <StatisticsDisplay statistics={data.statistics} />}
      </TabsContent>
    </Tabs>
  );
}
