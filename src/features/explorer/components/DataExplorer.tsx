import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCcw,
  SearchX,
  MoreVertical,
  FolderPlus,
  FilePlus,
  TerminalIcon,
  FileUp,
} from "lucide-react";
import useAppStore from "@/store";
import TreeNode, {
  TreeNodeData,
} from "@/features/explorer/components/TreeNode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { genTabId } from "@/lib/utils";
import { SavedQuery } from "@/types/common";
import ConnectionSwitcher from "@/features/connections/components/ConnectionSwitcher";
import DatabaseSelector from "@/features/explorer/components/DatabaseSelector";
import ExplorerTabs from "@/features/explorer/components/ExplorerTabs";
import SavedQueriesList from "@/features/explorer/components/SavedQueriesList";

const DatabaseExplorer: React.FC = () => {
  const {
    dataBaseExplorer,
    tabError,
    fetchDatabaseInfo,
    isLoadingDatabase,
    addTab,
    openCreateDatabaseModal,
    openCreateTableModal,
    openUploadFileModal,
    checkSavedQueriesStatus,
    fetchSavedQueries,
    clickHouseClient,
    selectedDatabase,
  } = useAppStore();

  const updatedSavedQueriesTrigger = useAppStore(
    (state) => state.updatedSavedQueriesTrigger,
  );

  const [isQueriesEnabled, setIsQueriesEnabled] = useState(false);
  const [savedQueriesList, setSavedQueriesList] = useState<SavedQuery[]>([]);

  const filteredDatabases = useMemo(() => {
    if (!selectedDatabase) return dataBaseExplorer;
    return dataBaseExplorer.filter((db) => db.name === selectedDatabase);
  }, [dataBaseExplorer, selectedDatabase]);

  // Transform databases to include folder structure
  const organizedDatabases = useMemo(() => {
    return filteredDatabases.map((db) => {
      const tables = db.children.filter((child) => child.type === "table");
      const views = db.children.filter(
        (child) => child.type === "view" || child.type === "materialized_view"
      );
      const dictionaries = db.children.filter(
        (child) => child.type === "dictionary"
      );

      const folders: TreeNodeData[] = [];

      if (tables.length > 0) {
        folders.push({
          name: "Tables",
          type: "table" as const,
          children: tables,
        });
      }

      if (views.length > 0) {
        folders.push({
          name: "Views",
          type: "view" as const,
          children: views,
        });
      }

      if (dictionaries.length > 0) {
        folders.push({
          name: "Dictionaries",
          type: "dictionary" as const,
          children: dictionaries,
        });
      }

      return {
        ...db,
        children: folders,
      };
    });
  }, [filteredDatabases]);

  const refreshDatabases = useCallback(() => {
    if (!clickHouseClient) {
      console.warn(
        "Cannot refresh databases: ClickHouse client not initialized",
      );
      return;
    }
    fetchDatabaseInfo().catch((err) => {
      console.error("Failed to refresh databases:", err);
    });
  }, [clickHouseClient, fetchDatabaseInfo]);

  const loadSavedQueries = useCallback(async () => {
    try {
      const result = await fetchSavedQueries();
      if (result) {
        setSavedQueriesList(result);
      } else {
        console.warn("No saved queries found or invalid response.");
        setSavedQueriesList([]);
      }
    } catch (error) {
      console.error("Error fetching saved queries:", error);
      setSavedQueriesList([]);
    }
  }, [fetchSavedQueries]);

  useEffect(() => {
    // Only fetch data if client is initialized
    if (!clickHouseClient) {
      console.log(
        "DataExplorer: Waiting for ClickHouse client to be initialized...",
      );
      return;
    }

    fetchDatabaseInfo().catch((err) => {
      console.error("Failed to fetch database info:", err);
    });

    const checkQueriesEnabled = async () => {
      try {
        const enabled = await checkSavedQueriesStatus();
        setIsQueriesEnabled(enabled);
        return enabled;
      } catch (err) {
        console.error("Failed to check saved queries status:", err);
        return false;
      }
    };

    checkQueriesEnabled().then((enabled) => {
      if (enabled) {
        loadSavedQueries();
      }
    });
  }, [
    clickHouseClient,
    fetchDatabaseInfo,
    checkSavedQueriesStatus,
    loadSavedQueries,
  ]);

  useEffect(() => {
    if (isQueriesEnabled) {
      loadSavedQueries();
    }
  }, [isQueriesEnabled, loadSavedQueries, updatedSavedQueriesTrigger]);

  const handleSavedQueryOpen = (query: SavedQuery) => {
    addTab({
      id: query.id,
      type: "sql",
      title: query.name,
      content: query.query,
      isSaved: true,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-none px-1 py-2 border-b space-y-1">
        <ConnectionSwitcher />

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            onClick={refreshDatabases}
            disabled={isLoadingDatabase}
          >
            <RefreshCcw
              className={`w-4 h-4 ${isLoadingDatabase ? "animate-spin" : ""}`}
            />
          </Button>

          <div className="flex-1">
            <DatabaseSelector />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openCreateDatabaseModal()}>
                <FolderPlus className="w-4 h-4 mr-2" /> Create Database
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateTableModal("")}>
                <FilePlus className="w-4 h-4 mr-2" /> Create Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openUploadFileModal("")}>
                <FileUp className="w-4 h-4 mr-2" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  addTab({
                    id: genTabId(),
                    type: "sql",
                    title: "Query",
                    content: "",
                  })
                }
              >
                <TerminalIcon className="w-4 h-4 mr-2" /> New Query
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area - Tabs */}
      <div className="flex-1 min-h-0">
        <ExplorerTabs
          mainContent={
            <ScrollArea className="h-full">
              <div className="p-3">
                {isLoadingDatabase ? (
                  <div className="p-4 text-muted-foreground w-full flex flex-col items-center justify-center">
                    <RefreshCcw className="w-8 h-8 mx-auto animate-spin" />
                    <p className="text-center mt-2">Loading...</p>
                  </div>
                ) : tabError ? (
                  <div className="p-4 text-red-500 w-full flex flex-col items-center justify-center">
                    <p className="text-center mt-2">{tabError}</p>
                    <Button
                      onClick={refreshDatabases}
                      variant="outline"
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                ) : organizedDatabases.length > 0 ? (
                  organizedDatabases.map((node) => (
                    <TreeNode
                      node={node as TreeNodeData}
                      level={0}
                      parentDatabaseName={node.name}
                      refreshData={refreshDatabases}
                      key={node.name}
                    />
                  ))
                ) : (
                  <div className="p-4 text-muted-foreground w-full flex flex-col items-center justify-center">
                    <SearchX className="w-8 h-8 mx-auto" />
                    <p className="text-center mt-2">No databases found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          }
          queriesContent={
            isQueriesEnabled ? (
              <SavedQueriesList
                queries={savedQueriesList}
                onQueryOpen={handleSavedQueryOpen}
                onRefresh={loadSavedQueries}
              />
            ) : (
              <div className="p-4 text-muted-foreground text-center">
                <p>Saved queries feature is not enabled.</p>
                <p className="text-xs mt-2">
                  Enable it in the Admin panel to save queries.
                </p>
              </div>
            )
          }
        />
      </div>
    </div>
  );
};

export default DatabaseExplorer;
