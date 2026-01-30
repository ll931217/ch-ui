import React, { useEffect, useRef, useCallback, useState } from "react";
import * as monaco from "monaco-editor";
import { useTheme } from "@/components/common/theme-provider";
import useAppStore from "@/store";
import {
  initializeMonacoGlobally,
  createMonacoEditor,
} from "@/features/workspace/editor/monacoConfig";
import { Button } from "@/components/ui/button";
import { CirclePlay, Edit3Icon, Save, PlaySquare } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
import { useNavigate } from "react-router-dom";
import { parseQueries, findQueryAtCursor, ParsedQuery } from "@/helpers/queryParser";

interface SQLEditorProps {
  tabId: string;
  onRunQuery: (query: string) => void;
  onRunAllQueries?: (queries: string[]) => void;
}

const HIGHLIGHT_DECORATION_CLASS = "current-query-highlight";

const SQLEditor: React.FC<SQLEditorProps> = ({ tabId, onRunQuery, onRunAllQueries }) => {
  const { getTabById, updateTab, saveQuery, updateSavedQuery, checkSavedQueriesStatus, isAdmin } =
    useAppStore();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const isDisposedRef = useRef(false);           // Track disposed state
  const highlightTimeoutRef = useRef<number>();  // Track pending timeout
  const tab = getTabById(tabId);
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState(tab?.title || "Untitled Query");
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
              1,
              query.endLine,
              monacoRef.current.getModel()?.getLineMaxColumn(query.endLine) || 1
            ),
            options: {
              isWholeLine: true,
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

      if (tab?.content) {
        const content = typeof tab.content === "string" ? tab.content : "";
        editor.setValue(content);
      }

      // Initial parse
      const initialQueries = parseQueries(editor.getValue());
      setParsedQueries(initialQueries);

      const changeListener = editor.onDidChangeModelContent(() => {
        const newContent = editor.getValue();
        updateTab(tabId, { content: newContent });
        updateParsedQueries();
        // Track timeout for cleanup
        highlightTimeoutRef.current = window.setTimeout(updateCurrentQueryHighlight, 0);
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

  const handleTitleEdit = () => {
    setEditedTitle(tab?.title || "");
    setIsEditing(true);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      updateTab(tabId, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

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
    const isSavedQueryEnabled = await checkSavedQueriesStatus();
    if (!isSavedQueryEnabled) {
      isAdmin &&
        toast.warning(`Saved queries are not enable.`, {
          action: {
            label: "Enable",
            onClick: () => {
              navigate("/admin");
            },
          },
        });

      !isAdmin &&
        toast.warning(
          `Saved queries are not enable. Contact your admin to enable it.`
        );

      return;
    }
    setIsSaveDialogOpen(true);
  };

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

    try {
      if (tab?.isSaved) {
        // Update existing saved query
        await updateSavedQuery(tabId, query, queryName);
        toast.success("Query updated successfully!");
      } else {
        // Save new query
        await saveQuery(tabId, queryName, query);
        toast.success("Query saved successfully!");
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
          {isEditing ? (
            <Input
              type="text"
              value={editedTitle}
              autoFocus
              className="w-full h-6"
              onChange={handleTitleChange}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {tab.title}
            </span>
          )}
          <Edit3Icon
            className="h-4 w-4 cursor-pointer hover:text-primary"
            onClick={handleTitleEdit}
          />
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
              {tab?.isSaved ? "Update the saved query:" : "Enter a name for this query:"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Input
              type="text"
              placeholder="Query Name"
              value={queryName}
              onChange={handleQueryNameChange}
            />
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
