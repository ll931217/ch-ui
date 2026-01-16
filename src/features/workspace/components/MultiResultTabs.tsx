import React, { useState, useMemo } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, AllCommunityModule, ICellRendererParams } from "ag-grid-community";
import { themeBalham, colorSchemeDark } from "ag-grid-community";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/components/common/theme-provider";
import DownloadDialog from "@/components/common/DownloadDialog";
import EmptyQueryResult from "./EmptyQueryResult";
import StatisticsDisplay from "./StatisticsDisplay";
import { MultiQueryResult } from "@/types/common";

interface MultiResultTabsProps {
  results: MultiQueryResult[];
  activeResultIndex: number;
  onResultIndexChange?: (index: number) => void;
}

interface IRow {
  [key: string]: any;
}

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const CustomCellRenderer = (props: ICellRendererParams) => {
  const formattedValue = formatCellValue(props.value);
  return <span className="whitespace-pre-wrap">{formattedValue}</span>;
};

const getQueryLabel = (queryText: string, index: number): string => {
  const firstLine = queryText.split("\n")[0].trim();
  const maxLen = 25;
  if (firstLine.length <= maxLen) {
    return firstLine;
  }
  return `Query ${index + 1}`;
};

const MultiResultTabs: React.FC<MultiResultTabsProps> = ({
  results,
  activeResultIndex,
  onResultIndexChange,
}) => {
  const { theme } = useTheme();
  const [selectedResultIndex, setSelectedResultIndex] = useState(activeResultIndex);
  const [activeTab, setActiveTab] = useState<string>("results");

  const gridTheme =
    theme === "light" ? themeBalham : themeBalham.withPart(colorSchemeDark);

  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 130,
    sortable: true,
    filter: true,
    resizable: true,
    filterParams: { buttons: ["reset", "apply"] },
    cellRenderer: CustomCellRenderer,
    autoHeight: true,
  };

  const handleResultIndexChange = (index: string) => {
    const numIndex = parseInt(index, 10);
    setSelectedResultIndex(numIndex);
    onResultIndexChange?.(numIndex);
  };

  const currentResult = results[selectedResultIndex];

  const { columnDefs, rowData } = useMemo(() => {
    if (!currentResult?.result?.data?.length || !currentResult?.result?.meta?.length) {
      return { columnDefs: [], rowData: [] };
    }

    const colDefs: ColDef<IRow>[] = currentResult.result.meta.map((col: any) => ({
      headerName: col.name,
      valueGetter: (param: any) => param.data[col.name],
    }));

    return { columnDefs: colDefs, rowData: currentResult.result.data };
  }, [currentResult]);

  const renderResultsTab = () => {
    if (!currentResult) return null;

    const result = currentResult.result;

    if (result.error) {
      return (
        <div className="m-4">
          <Alert variant="destructive">
            <AlertTitle>Error in Query {selectedResultIndex + 1}</AlertTitle>
            <AlertDescription className="font-mono text-sm whitespace-pre-wrap">
              {result.error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">Query:</p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
              {currentResult.queryText}
            </pre>
          </div>
        </div>
      );
    }

    if (!columnDefs.length || !rowData.length) {
      return result.statistics ? (
        <EmptyQueryResult statistics={result.statistics} />
      ) : null;
    }

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            modules={[AllCommunityModule]}
            theme={gridTheme}
            pagination={true}
            paginationPageSize={100}
            enableCellTextSelection={true}
            animateRows={true}
            suppressMovableColumns={false}
          />
        </div>
      </div>
    );
  };

  const renderMetadataTab = () => {
    if (!currentResult?.result?.meta?.length) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <AgGridReact
            rowData={currentResult.result.meta}
            columnDefs={[
              { headerName: "Column Name", field: "name", flex: 1 },
              { headerName: "Data Type", field: "type", flex: 1 },
            ]}
            defaultColDef={defaultColDef}
            modules={[AllCommunityModule]}
            theme={gridTheme}
            pagination={true}
            enableCellTextSelection={true}
          />
        </div>
      </div>
    );
  };

  const renderStatisticsTab = () => {
    if (!currentResult?.result?.statistics) return null;
    return <StatisticsDisplay statistics={currentResult.result.statistics} />;
  };

  if (!results.length) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No query results to display
      </div>
    );
  }

  const hasData = currentResult?.result?.data?.length > 0;
  const hasMeta = currentResult?.result?.meta?.length > 0;
  const hasError = !!currentResult?.result?.error;

  return (
    <div className="h-full flex flex-col">
      {/* Query Result Selector Tabs */}
      <div className="border-b bg-muted/30">
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
          {results.map((r, index) => {
            const isError = !!r.result.error;
            const isSelected = index === selectedResultIndex;
            return (
              <button
                key={index}
                onClick={() => handleResultIndexChange(String(index))}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md whitespace-nowrap
                  transition-colors duration-150
                  ${isSelected
                    ? "bg-background shadow-sm border"
                    : "hover:bg-muted"
                  }
                  ${isError ? "text-destructive" : ""}
                `}
              >
                {isError ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                )}
                <span className="truncate max-w-[120px]">
                  {getQueryLabel(r.queryText, index)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="rounded-none border-b px-4">
          <TabsTrigger value="results">
            Results
            {hasData && !hasError && (
              <div className="ml-2 text-muted-foreground items-center flex">
                ({currentResult?.result.data.length} rows)
                <DownloadDialog data={currentResult?.result.data} />
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="metadata">
            Metadata
            {hasMeta && !hasError && (
              <div className="ml-2 text-muted-foreground items-center flex">
                ({currentResult?.result.meta.length} columns)
                <DownloadDialog data={currentResult?.result.meta} />
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="results" className="h-full m-0">
            {renderResultsTab()}
          </TabsContent>
          <TabsContent value="metadata" className="h-full m-0">
            {renderMetadataTab()}
          </TabsContent>
          <TabsContent value="statistics" className="h-full m-0">
            {renderStatisticsTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MultiResultTabs;
