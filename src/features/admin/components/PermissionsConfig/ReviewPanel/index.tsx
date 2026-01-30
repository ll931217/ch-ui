import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Play, Trash2, AlertCircle } from "lucide-react";
import { PendingChange, ChangeExecutionResult } from "../types";
import DiffView from "./DiffView";
import SqlPreview from "./SqlPreview";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReviewPanelProps {
  isOpen: boolean;
  changes: PendingChange[];
  isExecuting: boolean;
  executionResults: ChangeExecutionResult[];
  onClose: () => void;
  onExecute: () => void;
  onRemoveChange: (changeId: string) => void;
  onClearAll: () => void;
}

export default function ReviewPanel({
  isOpen,
  changes,
  isExecuting,
  executionResults,
  onClose,
  onExecute,
  onRemoveChange,
  onClearAll,
}: ReviewPanelProps) {
  if (!isOpen) return null;

  const hasResults = executionResults.length > 0;
  const allSucceeded = executionResults.every((r) => r.success);
  const someSucceeded = executionResults.some((r) => r.success);
  const someFailed = executionResults.some((r) => !r.success);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium">Review Pending Changes</h2>
            <Badge variant="secondary">{changes.length} changes</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Execution results */}
        {hasResults && (
          <div className="p-4 border-b">
            {allSucceeded && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertCircle className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  All {executionResults.length} change(s) executed successfully!
                </AlertDescription>
              </Alert>
            )}
            {someFailed && (
              <div className="space-y-2">
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {someSucceeded
                      ? `${executionResults.filter((r) => r.success).length} of ${executionResults.length} changes succeeded. Some failed.`
                      : "Execution failed. No changes were applied."}
                  </AlertDescription>
                </Alert>
                {/* Show failed changes */}
                <div className="space-y-1">
                  {executionResults
                    .filter((r) => !r.success)
                    .map((result) => {
                      const change = changes.find((c) => c.id === result.changeId);
                      return (
                        <div
                          key={result.changeId}
                          className="text-xs bg-red-500/5 border border-red-500/10 rounded p-2"
                        >
                          <span className="font-medium">{change?.description}:</span>{" "}
                          {result.error}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {changes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No pending changes</p>
              <p className="text-sm">Make changes in the configuration layers to review them here.</p>
            </div>
          ) : (
            <Tabs defaultValue="changes" className="h-full">
              <TabsList>
                <TabsTrigger value="changes">
                  Changes ({changes.length})
                </TabsTrigger>
                <TabsTrigger value="sql">
                  SQL Query ({changes.reduce((acc, c) => acc + c.sqlStatements.length, 0)})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="changes" className="space-y-4 mt-4">
                <DiffView changes={changes} />
              </TabsContent>

              <TabsContent value="sql" className="mt-4">
                <SqlPreview changes={changes} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        {changes.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <Button
              variant="outline"
              onClick={onClearAll}
              className="gap-2"
              disabled={isExecuting}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={isExecuting}>
                Cancel
              </Button>
              <Button
                onClick={onExecute}
                disabled={isExecuting || changes.length === 0}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                {isExecuting ? "Executing..." : `Execute ${changes.length} Change(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
