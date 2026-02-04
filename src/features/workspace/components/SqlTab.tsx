import React, { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Loader2, FileX2, RefreshCw, AlertTriangle } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  AllCommunityModule,
  GridApi,
  ColumnPinnedType,
  CellContextMenuEvent,
  RowSelectionOptions,
} from "ag-grid-community";
import { AgGridWrapper } from "@/components/common/AgGridWrapper";
import {
  createDefaultColDef,
  createGridOptions,
  PinnedColumnsState,
  createAgGridTheme,
} from "@/lib/agGrid";
import AgGridHeaderContextMenu from "@/components/common/AgGridHeaderContextMenu";
import {
  formatData,
  ExportFormat,
  getAvailableFormats,
  getFormatDisplayName,
} from "@/lib/formatUtils";
import CopyResultsDialog from "@/components/common/CopyResultsDialog";

// Component imports
import SQLEditor from "@/features/workspace/editor/SqlEditor";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useTheme } from "@/components/common/theme-provider";
import DownloadDialog from "@/components/common/DownloadDialog";
import EmptyQueryResult from "./EmptyQueryResult";
import StatisticsDisplay from "./StatisticsDisplay";
import MultiResultTabs from "./MultiResultTabs";
import { ExplainTab } from "@/features/workspace/explain/components/ExplainTab";

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

  // Last query for refresh
  const [lastQuery, setLastQuery] = useState<string>("");

  const gridTheme = createAgGridTheme(theme);

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
      setLastQuery(query);
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

  const handleRefresh = useCallback(async () => {
    if (lastQuery) {
      await handleRunQuery(lastQuery);
    }
  }, [lastQuery, handleRunQuery]);

  // Row selection configuration
  const rowSelection = useMemo(
    () => ({
      mode: "multiRow" as const,
      checkboxes: true,
      headerCheckbox: true,
      enableClickSelection: true,
    }),
    [],
  );

  // Selection column configuration to prevent resize interference
  const selectionColumn = useMemo(
    () => ({
      width: 50,
      minWidth: 50,
      maxWidth: 50,
      resizable: false,
      suppressMovable: true,
      lockPosition: "left" as const,
      pinned: "left" as const,
    }),
    [],
  );

  const handleCopyFormat = useCallback(
    (format: ExportFormat) => {
      const selectedRows = gridRef.current?.api.getSelectedRows() || [];

      if (selectedRows.length === 0) {
        toast.error("No rows selected");
        return;
      }

      const columns = columnDefs
        .map((c) => c.field || c.headerName || "")
        .filter(Boolean);
      const formatted = formatData(
        selectedRows,
        columns,
        format,
        "query_results",
      );
      navigator.clipboard.writeText(formatted);
      toast.success(
        `Copied ${selectedRows.length} rows as ${getFormatDisplayName(format)}`,
      );
    },
    [columnDefs],
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
      const dataColDefs: ColDef<IRow>[] = tab.result.meta.map((col: any) => {
        const colName = col.name;
        return {
          headerName: colName,
          field: colName,
          valueGetter: (param: any) => param.data[colName],
          headerComponent: AgGridHeaderContextMenu,
          headerComponentParams: {
            onPinColumn: handlePinColumn,
            onAutoSizeColumn: handleAutoSizeColumn,
            onResetColumns: handleResetColumns,
          },
        };
      });

      setRowData(tab.result.data);
      setColumnDefs(dataColDefs);
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
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex-1 relative">
              <AgGridWrapper
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                modules={[AllCommunityModule]}
                theme={gridTheme}
                rowHeight={32}
                suppressMovableColumns={false}
                rowSelection={rowSelection}
                selectionColumn={selectionColumn}
                {...gridOptions}
              />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {getAvailableFormats().map((format) => (
              <ContextMenuItem
                key={format}
                onClick={() => handleCopyFormat(format)}
              >
                Copy as {getFormatDisplayName(format)}
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  };

  const renderMetadataTab = () => {
    if (!tab?.result?.meta?.length) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <AgGridWrapper
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
    const hasExplain = tab?.result?.explainResult !== undefined;

    return (
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <TabsList className="rounded-none border-b gap-1 pr-4">
          <TabsTrigger value="results">
            Results
            {hasData && (
              <span className="ml-2 text-muted-foreground inline-flex items-center gap-1">
                ({tab?.result.data.length.toLocaleString()} rows)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Results may be truncated for performance.</p>
                      <p className="text-xs text-muted-foreground">
                        Use LIMIT clause for precise control.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
          {hasExplain && (
            <TabsTrigger value="explain">
              Explain
              <span className="ml-2 text-muted-foreground">
                ({tab?.result.explainResult.type})
              </span>
            </TabsTrigger>
          )}

          <div className="ml-auto flex items-center gap-1">
            {activeTab === "results" && lastQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleRefresh}
                disabled={tab?.isLoading}
                title="Refresh results"
              >
                <RefreshCw
                  className={`h-4 w-4 ${tab?.isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}

            {hasData && activeTab === "results" && (
              <CopyResultsDialog
                data={tab?.result.data}
                columns={tab?.result.meta.map((m: any) => m.name) || []}
              />
            )}

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
          {hasExplain && (
            <TabsContent value="explain" className="h-full m-0">
              <ExplainTab explainResult={tab!.result.explainResult!} />
            </TabsContent>
          )}
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
