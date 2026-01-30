import React, { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, FileX2 } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  AllCommunityModule,
  GridApi,
  ColumnPinnedType,
} from "ag-grid-community";
import { themeBalham, colorSchemeDark } from "ag-grid-community";
import {
  createDefaultColDef,
  createGridOptions,
  PinnedColumnsState,
} from "@/lib/agGrid";
import AgGridHeaderContextMenu from "@/components/common/AgGridHeaderContextMenu";

// Component imports
import SQLEditor from "@/features/workspace/editor/SqlEditor";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/components/common/theme-provider";
import DownloadDialog from "@/components/common/DownloadDialog";
import EmptyQueryResult from "./EmptyQueryResult";
import StatisticsDisplay from "./StatisticsDisplay";
import MultiResultTabs from "./MultiResultTabs";

// Store
import useAppStore from "@/store";
import { useDefaultLayout } from "react-resizable-panels";

// Types
interface SqlTabProps {
  tabId: string;
}

interface IRow {
  [key: string]: any;
}

/**
 * SqlTab component that provides a SQL editor and result viewer
 *
 * Displays a resizable split panel with SQL editor on top and
 * query results, metadata, and statistics tabs on the bottom.
 */
const SqlTab: React.FC<SqlTabProps> = ({ tabId }) => {
  const { getTabById, runQuery, runAllQueries, fetchDatabaseInfo, updateTab } =
    useAppStore();
  const tab = getTabById(tabId);
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("results");

  // Configure AG Grid theme based on app theme
  const gridTheme =
    theme === "light" ? themeBalham : themeBalham.withPart(colorSchemeDark);

  // AG Grid configuration
  const defaultColDef = useMemo(() => createDefaultColDef(), []);
  const gridRef = useRef<AgGridReact<IRow>>(null);
  const metaGridRef = useRef<AgGridReact<any>>(null);

  const [columnDefs, setColumnDefs] = useState<ColDef<IRow>[]>([]);
  const [rowData, setRowData] = useState<IRow[]>([]);
  const [pinnedColumnsState, setPinnedColumnsState] =
    useState<PinnedColumnsState>({});
  const [metaPinnedColumnsState, setMetaPinnedColumnsState] =
    useState<PinnedColumnsState>({});

  const gridOptions = useMemo(
    () => createGridOptions(rowData.length),
    [rowData.length],
  );

  // Column pinning and manipulation callbacks
  const handlePinColumn = useCallback(
    (colId: string, pinned: ColumnPinnedType) => {
      setPinnedColumnsState((prev) => ({
        ...prev,
        [colId]: pinned,
      }));

      const gridApi = gridRef.current?.api;
      if (gridApi) {
        gridApi.applyColumnState({
          state: [{ colId, pinned }],
        });
      }
    },
    [],
  );

  const handleAutoSizeColumn = useCallback((colId: string) => {
    const gridApi = gridRef.current?.api;
    if (gridApi) {
      gridApi.autoSizeColumns([colId]);
    }
  }, []);

  const handleResetColumns = useCallback(() => {
    setPinnedColumnsState({});
    const gridApi = gridRef.current?.api;
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
    [],
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

  // Detect schema-changing queries to refresh database explorer
  const isSchemaModifyingQuery = (query: string): boolean => {
    return /^\s*(CREATE|DROP|ALTER|TRUNCATE|RENAME|INSERT|UPDATE|DELETE)\s+/i.test(
      query,
    );
  };

  // Handle single query execution
  const handleRunQuery = useCallback(
    async (query: string) => {
      try {
        // Clear multi-query results when running single query
        await updateTab(tabId, {
          results: undefined,
          activeResultIndex: undefined,
        });

        const shouldRefresh = isSchemaModifyingQuery(query);
        const result = await runQuery(query, tabId);

        if (!result.error && shouldRefresh) {
          await fetchDatabaseInfo();
          toast.success("Data Explorer refreshed due to schema change");
        }
      } catch (error) {
        console.error("Error running query:", error);
        toast.error(
          "Failed to execute query. Please check the console for more details.",
        );
      }
    },
    [runQuery, tabId, fetchDatabaseInfo, updateTab],
  );

  // Handle multi-query execution
  const handleRunAllQueries = useCallback(
    async (queries: string[]) => {
      try {
        const hasSchemaChange = queries.some(isSchemaModifyingQuery);
        await runAllQueries(queries, tabId);

        if (hasSchemaChange) {
          await fetchDatabaseInfo();
          toast.success("Data Explorer refreshed due to schema change");
        }

        toast.success(`Executed ${queries.length} queries`);
      } catch (error) {
        console.error("Error running queries:", error);
        toast.error(
          "Failed to execute queries. Please check the console for more details.",
        );
      }
    },
    [runAllQueries, tabId, fetchDatabaseInfo],
  );

  // Handle result index change for multi-query results
  const handleResultIndexChange = useCallback(
    (index: number) => {
      updateTab(tabId, { activeResultIndex: index });
    },
    [tabId, updateTab],
  );

  // Process result data into grid-compatible format
  useMemo(() => {
    if (tab?.result?.data?.length && tab?.result?.meta?.length) {
      const colDefs: ColDef<IRow>[] = tab.result.meta.map((col: any) => ({
        headerName: col.name,
        field: col.name,
        valueGetter: (param: any) => param.data[col.name],
        headerComponent: AgGridHeaderContextMenu,
        headerComponentParams: {
          onPinColumn: handlePinColumn,
          onAutoSizeColumn: handleAutoSizeColumn,
          onResetColumns: handleResetColumns,
        },
      }));

      setRowData(tab.result.data);
      setColumnDefs(colDefs);
    } else {
      setColumnDefs([]);
      setRowData([]);
    }
  }, [
    tab?.result?.data,
    tab?.result?.meta,
    handlePinColumn,
    handleAutoSizeColumn,
    handleResetColumns,
  ]);

  // UI rendering functions
  const renderLoading = () => (
    <div className="h-full w-full flex items-center justify-center">
      <Loader2 size={24} className="animate-spin mr-2" />
      <p>Running query...</p>
    </div>
  );

  const renderError = (errorMessage: string) => (
    <div className="m-4">
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    </div>
  );

  const renderEmpty = () => (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <FileX2 size={48} className="text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          There's no data yet! Run a query to get started.
        </p>
      </div>
    </div>
  );

  const renderResultsTab = () => {
    if (!columnDefs.length || !rowData.length) {
      return tab?.result?.statistics ? (
        <EmptyQueryResult statistics={tab.result.statistics} />
      ) : null;
    }

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            modules={[AllCommunityModule]}
            theme={gridTheme}
            rowHeight={32}
            suppressMovableColumns={false}
            {...gridOptions}
          />
        </div>
      </div>
    );
  };

  const renderMetadataTab = () => {
    if (!tab?.result?.meta?.length) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <AgGridReact
            ref={metaGridRef}
            rowData={tab.result.meta}
            columnDefs={[
              {
                headerName: "Column Name",
                field: "name",
                flex: 1,
                headerComponent: AgGridHeaderContextMenu,
                headerComponentParams: {
                  onPinColumn: handleMetaPinColumn,
                  onAutoSizeColumn: handleMetaAutoSizeColumn,
                  onResetColumns: handleMetaResetColumns,
                },
              },
              {
                headerName: "Data Type",
                field: "type",
                flex: 1,
                headerComponent: AgGridHeaderContextMenu,
                headerComponentParams: {
                  onPinColumn: handleMetaPinColumn,
                  onAutoSizeColumn: handleMetaAutoSizeColumn,
                  onResetColumns: handleMetaResetColumns,
                },
              },
            ]}
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
      </div>
    );
  };

  const renderStatisticsResults = () => {
    if (!tab?.result?.statistics) return null;
    return <StatisticsDisplay statistics={tab.result.statistics} />;
  };

  const renderResultTabs = () => {
    const hasData = tab?.result?.data?.length > 0;
    const hasMeta = tab?.result?.meta?.length > 0;

    return (
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <TabsList className="rounded-none border-b px-4">
          <TabsTrigger value="results">
            Results
            {hasData && (
              <span className="ml-2 text-muted-foreground">
                ({tab?.result.data.length} rows)
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="metadata">
            Metadata
            {hasMeta && (
              <span className="ml-2 text-muted-foreground">
                ({tab?.result.meta.length} columns)
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>

          {/* Download actions - outside tab triggers */}
          <div className="ml-auto flex items-center">
            {hasData && activeTab === "results" && (
              <DownloadDialog data={tab?.result.data} />
            )}
            {hasMeta && activeTab === "metadata" && (
              <DownloadDialog data={tab?.result.meta} />
            )}
          </div>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="results" className="h-full m-0">
            {renderResultsTab()}
          </TabsContent>
          <TabsContent value="metadata" className="h-full m-0">
            {renderMetadataTab()}
          </TabsContent>
          <TabsContent value="statistics" className="h-full m-0">
            {renderStatisticsResults()}
          </TabsContent>
        </div>
      </Tabs>
    );
  };

  // Render main results section based on current state
  const renderResults = () => {
    if (tab?.isLoading) return renderLoading();
    if (tab?.error) return renderError(tab.error);

    // Check for multi-query results first
    if (tab?.results && tab.results.length > 0) {
      return (
        <MultiResultTabs
          results={tab.results}
          activeResultIndex={tab.activeResultIndex ?? 0}
          onResultIndexChange={handleResultIndexChange}
        />
      );
    }

    // Single query result
    if (!tab?.result) return renderEmpty();
    if (tab.result.error) return renderError(tab.result.error);

    return renderResultTabs();
  };

  // Return null if tab doesn't exist
  if (!tab) return null;

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: "unique-layout-id",
    storage: localStorage,
  });

  return (
    <div className="h-full">
      <ResizablePanelGroup
        id="sql-tab"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        orientation="vertical"
      >
        <ResizablePanel
          id="sql-editor"
          defaultSize={300}
          minSize={200}
          collapsible
          collapsedSize={0}
        >
          <SQLEditor
            tabId={tabId}
            onRunQuery={handleRunQuery}
            onRunAllQueries={handleRunAllQueries}
          />
        </ResizablePanel>
        <ResizableHandle className="w-full h-1" withHandle />
        <ResizablePanel
          id="sql-results"
          minSize={100}
          collapsible
          collapsedSize={0}
        >
          {renderResults()}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SqlTab;
