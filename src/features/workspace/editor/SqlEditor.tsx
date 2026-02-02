import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "@/components/common/theme-provider";
import useAppStore from "@/store";
import {
  initializeMonacoGlobally,
  createMonacoEditor,
} from "@/features/workspace/editor/monacoConfig";
import { AutocompleteUsageTracker } from "@/features/workspace/editor/usageTracker";
import { Button } from "@/components/ui/button";
import { CirclePlay, Save, PlaySquare } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { getSavedQueryById } from "@/lib/db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { parseQueries, findQueryAtCursor, ParsedQuery } from "@/helpers/queryParser";
import { useConnectionStore } from "@/store/connectionStore";

interface SQLEditorProps {
  tabId: string;
  onRunQuery: (query: string) => void;
  onRunAllQueries?: (queries: string[]) => void;
}

const HIGHLIGHT_DECORATION_CLASS = "current-query-highlight";

const SQLEditor: React.FC<SQLEditorProps> = ({ tabId, onRunQuery, onRunAllQueries }) => {
  const { getTabById, updateTab, saveQuery, updateSavedQuery, dataBaseExplorer, selectedDatabase } =
    useAppStore();
  const { connections, activeConnectionId, getDatabasesForConnection } = useConnectionStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const isDisposedRef = useRef(false);           // Track disposed state
  const highlightTimeoutRef = useRef<number>();  // Track pending timeout
  const usageTrackerRef = useRef<AutocompleteUsageTracker | null>(null);
  const tab = getTabById(tabId);
  const { theme } = useTheme();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState(tab?.title || "Untitled Query");
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [selectedDatabaseName, setSelectedDatabaseName] = useState<string>("");
  const [parsedQueries, setParsedQueries] = useState<ParsedQuery[]>([]);
  const [currentQueryIndex, setCurrentQueryIndex] = useState<number>(-1);
  const navigate = useNavigate();

  const editorTheme = theme === "light" ? "vs-light" : "vs-dark";
  const highlightBackground = theme === "light"
    ? "rgba(66, 153, 225, 0.08)"
    : "rgba(99, 179, 237, 0.12)";

  // Parse queries when content changes
  const updateParsedQueries = useCallback(() => {
    if (isDisposedRef.current || !monacoRef.current) return [];
    const content = monacoRef.current.getValue();
    const queries = parseQueries(content);
    setParsedQueries(queries);
    return queries;
  }, []);

  // Update current query highlighting based on cursor position
  const updateCurrentQueryHighlight = useCallback(() => {
    if (isDisposedRef.current || !monacoRef.current) return;

    const position = monacoRef.current.getPosition();
    if (!position) return;

    const queries = parsedQueries.length > 0 ? parsedQueries : updateParsedQueries();
    const queryIndex = findQueryAtCursor(queries, position.lineNumber, position.column);
    setCurrentQueryIndex(queryIndex);

    // Update decorations
    if (queryIndex >= 0 && queries[queryIndex]) {
      const query = queries[queryIndex];
      const newDecorations = monacoRef.current.deltaDecorations(
        decorationsRef.current,
        [
          {
            range: new monaco.Range(
              query.startLine,
              query.startColumn,
              query.endLine,
              query.endColumn + 1
            ),
            options: {
              className: HIGHLIGHT_DECORATION_CLASS,
              inlineClassName: HIGHLIGHT_DECORATION_CLASS,
            },
          },
        ]
      );
      decorationsRef.current = newDecorations;
    } else {
      // Clear decorations if no query at cursor
      const newDecorations = monacoRef.current.deltaDecorations(decorationsRef.current, []);
      decorationsRef.current = newDecorations;
    }
  }, [parsedQueries, updateParsedQueries]);

  useEffect(() => {
    initializeMonacoGlobally();
    if (editorRef.current) {
      isDisposedRef.current = false;  // Reset disposed state
      const editor = createMonacoEditor(editorRef.current, editorTheme);
      monacoRef.current = editor;

      // Initialize usage tracker for this connection
      const connectionId = activeConnectionId || 'default';
      if (!usageTrackerRef.current) {
        usageTrackerRef.current = new AutocompleteUsageTracker(connectionId);
      } else {
        usageTrackerRef.current.setConnection(connectionId);
      }

      if (tab?.content) {
        const content = typeof tab.content === "string" ? tab.content : "";
        editor.setValue(content);
      }

      // Initial parse
      const initialQueries = parseQueries(editor.getValue());
      setParsedQueries(initialQueries);

      const changeListener = editor.onDidChangeModelContent((event) => {
        const newContent = editor.getValue();
        updateTab(tabId, { content: newContent });
        updateParsedQueries();
        // Track timeout for cleanup
        highlightTimeoutRef.current = window.setTimeout(updateCurrentQueryHighlight, 0);

        // Track accepted autocomplete suggestions
        if (usageTrackerRef.current) {
          usageTrackerRef.current.checkForAcceptedSuggestion(event, editor.getModel());
        }
      });

      // Track cursor position changes
      const cursorListener = editor.onDidChangeCursorPosition(() => {
        updateCurrentQueryHighlight();
      });

      // Run current query with Ctrl/Cmd+Enter
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        handleRunQuery
      );

      // Run all queries with Ctrl/Cmd+Shift+Enter
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        handleRunAllQueries
      );

      // Save query with Ctrl/Cmd+S
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          hanldeSaveOpenDialog();
        }
      );

      // Add CSS for highlight decoration
      const styleId = `query-highlight-style-${tabId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          .${HIGHLIGHT_DECORATION_CLASS} {
            background-color: ${highlightBackground} !important;
          }
        `;
        document.head.appendChild(style);
      }

      return () => {
        // Clear pending timeout first
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current);
        }
        // Mark as disposed before any disposal
        isDisposedRef.current = true;
        changeListener.dispose();
        cursorListener.dispose();
        editor.dispose();
        // Clear the ref
        monacoRef.current = null;
        // Clean up style element
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [tabId, updateTab, editorTheme]);

  // Update highlight when theme changes
  useEffect(() => {
    const styleId = `query-highlight-style-${tabId}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.textContent = `
        .${HIGHLIGHT_DECORATION_CLASS} {
          background-color: ${highlightBackground} !important;
        }
      `;
    }
  }, [highlightBackground, tabId]);


  const getCurrentQuery = useCallback(() => {
    if (!monacoRef.current) return "";

    // Check for selection first
    const selection = monacoRef.current.getSelection();
    const model = monacoRef.current.getModel();

    if (selection && model && !selection.isEmpty()) {
      return model.getValueInRange(selection);
    }

    // If no selection, get the query at cursor position
    const position = monacoRef.current.getPosition();
    if (position) {
      const queries = parsedQueries.length > 0 ? parsedQueries : updateParsedQueries();
      const queryIndex = findQueryAtCursor(queries, position.lineNumber, position.column);
      if (queryIndex >= 0 && queries[queryIndex]) {
        return queries[queryIndex].text;
      }
    }

    // Fallback to entire content if no query found
    return monacoRef.current.getValue();
  }, [parsedQueries, updateParsedQueries]);

  const getAllQueries = useCallback(() => {
    const queries = parsedQueries.length > 0 ? parsedQueries : updateParsedQueries();
    return queries.map((q) => q.text).filter((text) => text.trim());
  }, [parsedQueries, updateParsedQueries]);

  const handleRunQuery = useCallback(() => {
    const content = getCurrentQuery();
    if (content.trim()) {
      onRunQuery(content);
    } else {
      toast.error("Please enter a query to run");
    }
  }, [onRunQuery, getCurrentQuery]);

  const handleRunAllQueries = useCallback(() => {
    const queries = getAllQueries();
    if (queries.length === 0) {
      toast.error("No queries to run");
      return;
    }
    if (queries.length === 1) {
      // Single query - just run it normally
      onRunQuery(queries[0]);
      return;
    }
    if (onRunAllQueries) {
      onRunAllQueries(queries);
    } else {
      // Fallback: run queries sequentially
      onRunQuery(queries.join('; '));
    }
  }, [getAllQueries, onRunQuery, onRunAllQueries]);

  const hanldeSaveOpenDialog = async () => {
    // Pre-fill the query name with the current tab title
    if (tab?.title) {
      setQueryName(tab.title);
    }

    // For saved queries, fetch and use saved connection/database
    if (tab?.isSaved) {
      try {
        const savedQuery = await getSavedQueryById(tabId);
        if (savedQuery) {
          // Validate connection still exists
          const connectionExists = connections.some(
            (conn) => conn.id === savedQuery.connectionId
          );

          if (connectionExists) {
            setSelectedConnectionId(savedQuery.connectionId);
            setSelectedDatabaseName(savedQuery.databaseName);
            setIsSaveDialogOpen(true);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch saved query:", error);
      }
    }

    // Default: use current workspace connection/database (existing logic)
    const currentConnectionId = activeConnectionId || "";
    setSelectedConnectionId(currentConnectionId);

    // Get available databases for the current connection
    let databases: string[] = [];
    if (currentConnectionId) {
      if (currentConnectionId === activeConnectionId) {
        databases = dataBaseExplorer.map((db) => db.name);
      } else {
        databases = getDatabasesForConnection(currentConnectionId);
      }
    }

    // Set database - only if there's a connection, a selected database, and it's in the list
    const currentDatabase =
      selectedDatabase && currentConnectionId && databases.includes(selectedDatabase)
        ? selectedDatabase
        : "";
    setSelectedDatabaseName(currentDatabase);

    setIsSaveDialogOpen(true);
  };

  const handleConnectionChange = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedDatabaseName(""); // Reset database when connection changes
  };

  const availableDatabases = useMemo(() => {
    if (!selectedConnectionId) return [];

    // If selected connection is the active one, use dataBaseExplorer (fresh data)
    if (selectedConnectionId === activeConnectionId) {
      return dataBaseExplorer.map((db) => db.name);
    }

    // Otherwise, try to get cached databases for that connection
    return getDatabasesForConnection(selectedConnectionId);
  }, [selectedConnectionId, activeConnectionId, dataBaseExplorer, getDatabasesForConnection]);

  const handleSaveQuery = async () => {
    const query = monacoRef.current?.getValue() || "";

    if (!queryName.trim()) {
      toast.error("Please enter a query name.");
      return;
    }

    if (!query.trim()) {
      toast.error("Please enter a query to save.");
      return;
    }

    if (!selectedConnectionId) {
      toast.error("Please select a connection.");
      return;
    }

    try {
      if (tab?.isSaved) {
        // Update existing saved query
        await updateSavedQuery(tabId, queryName, query, selectedConnectionId, selectedDatabaseName);
        toast.success("Query updated!");
      } else {
        // Save new query
        await saveQuery(tabId, queryName, query, selectedConnectionId, selectedDatabaseName);
        toast.success("Query saved!");
      }
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving query:", error);
      toast.error(tab?.isSaved ? "Failed to update query." : "Failed to save query.");
    }
  };

  const handleQueryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryName(e.target.value);
  };

  if (!tab) return null;

  const queryCount = parsedQueries.length;
  const hasMultipleQueries = queryCount > 1;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {tab.title}
          </span>
          {hasMultipleQueries && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {currentQueryIndex + 1}/{queryCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="link" onClick={handleRunQuery} className="gap-2 px-2">
                  <CirclePlay className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Run current query (Ctrl+Enter)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {hasMultipleQueries && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="link" onClick={handleRunAllQueries} className="gap-2 px-2">
                    <PlaySquare className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Run all queries (Ctrl+Shift+Enter)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="link"
                  onClick={hanldeSaveOpenDialog}
                  className="gap-2 px-2"
                  disabled={tab.type === "home" || tab.type === "information"}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tab.isSaved ? "Update saved query" : "Save query"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div ref={editorRef} className="flex-1" />

      {/* Save Query Dialog */}
      <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tab?.isSaved ? "Update Query" : "Save Query"}</AlertDialogTitle>
            <AlertDialogDescription>
              {tab?.isSaved ? "Update the saved query:" : "Save this query to a connection:"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4">
            {/* Query Name */}
            <div className="space-y-2">
              <Label htmlFor="query-name">Query Name</Label>
              <Input
                id="query-name"
                type="text"
                placeholder="Enter query name"
                value={queryName}
                onChange={handleQueryNameChange}
              />
            </div>

            {/* Connection Selector */}
            <div className="space-y-2">
              <Label htmlFor="connection">Connection</Label>
              <Select value={selectedConnectionId} onValueChange={handleConnectionChange}>
                <SelectTrigger id="connection">
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Database Selector */}
            <div className="space-y-2">
              <Label htmlFor="database">Database (optional)</Label>
              <Select
                value={selectedDatabaseName || "__none__"}
                onValueChange={(value) => setSelectedDatabaseName(value === "__none__" ? "" : value)}
                disabled={availableDatabases.length === 0}
              >
                <SelectTrigger id="database">
                  <SelectValue placeholder={
                    availableDatabases.length === 0
                      ? "No databases available"
                      : "Select database"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {availableDatabases.map((db) => (
                    <SelectItem key={db} value={db}>
                      {db}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveQuery}>
              {tab.isSaved ? "Update" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SQLEditor;
