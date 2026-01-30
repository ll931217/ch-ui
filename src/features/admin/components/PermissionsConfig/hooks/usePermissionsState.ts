import { useState, useCallback, useEffect } from "react";
import {
  PendingChange,
  PermissionsState,
  PermissionsActions,
  ChangeExecutionResult,
  LayerType,
} from "../types";
import useAppStore from "@/store";
import { toast } from "sonner";
import { useAuditLog } from "./useAuditLog";

/**
 * Hook to manage permissions configuration state
 * Handles pending changes queue and execution
 */
export function usePermissionsState(): PermissionsState & PermissionsActions {
  const { runQuery, credential, userPrivileges } = useAppStore();
  const { initializeAuditTable, logChange } = useAuditLog();
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [activeLayer, setActiveLayer] = useState<LayerType>("users");
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ChangeExecutionResult[]>([]);

  /**
   * Initialize audit log table on mount
   */
  useEffect(() => {
    initializeAuditTable();
  }, [initializeAuditTable]);

  /**
   * Add a pending change to the queue
   */
  const addPendingChange = useCallback(
    (change: Omit<PendingChange, "id" | "createdAt">) => {
      const newChange: PendingChange = {
        ...change,
        id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      setPendingChanges((prev) => [...prev, newChange]);
      toast.info(`Change staged: ${change.description}`);
    },
    []
  );

  /**
   * Remove a pending change from the queue
   */
  const removePendingChange = useCallback((changeId: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== changeId));
    toast.info("Change removed from queue");
  }, []);

  /**
   * Clear all pending changes
   */
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
    setExecutionResults([]);
    toast.info("All pending changes cleared");
  }, []);

  /**
   * Toggle the review panel
   */
  const toggleReviewPanel = useCallback(() => {
    setIsReviewPanelOpen((prev) => !prev);
  }, []);

  /**
   * Execute a single change
   */
  const executeChange = useCallback(
    async (changeId: string): Promise<ChangeExecutionResult> => {
      const change = pendingChanges.find((c) => c.id === changeId);
      if (!change) {
        return {
          changeId,
          success: false,
          error: "Change not found",
        };
      }

      let result: ChangeExecutionResult;

      try {
        // Execute all SQL statements for this change
        for (const sql of change.sqlStatements) {
          await runQuery(sql);
        }

        result = {
          changeId,
          success: true,
        };
      } catch (error) {
        result = {
          changeId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }

      // Log to audit table (don't await - fire and forget)
      const username = credential?.username || userPrivileges?.username || "unknown";
      logChange(change, result, username).catch((err) => {
        console.error("Failed to log change to audit:", err);
      });

      return result;
    },
    [pendingChanges, runQuery, credential, userPrivileges, logChange]
  );

  /**
   * Execute all pending changes
   */
  const executePendingChanges = useCallback(async (): Promise<
    ChangeExecutionResult[]
  > => {
    if (pendingChanges.length === 0) {
      toast.warning("No pending changes to execute");
      return [];
    }

    setIsExecuting(true);
    setExecutionResults([]);

    const results: ChangeExecutionResult[] = [];

    try {
      // Execute changes sequentially
      for (const change of pendingChanges) {
        const result = await executeChange(change.id);
        results.push(result);

        if (!result.success) {
          // Stop on first error
          toast.error(
            `Failed to execute change: ${change.description}. Error: ${result.error}`
          );
          break;
        }
      }

      setExecutionResults(results);

      // Check if all succeeded
      const allSucceeded = results.every((r) => r.success);
      if (allSucceeded) {
        toast.success(`Successfully executed ${results.length} change(s)`);
        // Clear pending changes on success
        setPendingChanges([]);
        setIsReviewPanelOpen(false);
      } else {
        const successCount = results.filter((r) => r.success).length;
        toast.warning(
          `Executed ${successCount} of ${pendingChanges.length} changes. Some failed.`
        );
        // Remove only the successful changes
        const successfulIds = results
          .filter((r) => r.success)
          .map((r) => r.changeId);
        setPendingChanges((prev) =>
          prev.filter((c) => !successfulIds.includes(c.id))
        );
      }

      return results;
    } catch (error) {
      toast.error(
        `Error during execution: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setExecutionResults(results);
      return results;
    } finally {
      setIsExecuting(false);
    }
  }, [pendingChanges, executeChange]);

  return {
    // State
    pendingChanges,
    activeLayer,
    isReviewPanelOpen,
    isExecuting,
    executionResults,
    // Actions
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    setActiveLayer,
    toggleReviewPanel,
    executePendingChanges,
    executeChange,
  };
}
