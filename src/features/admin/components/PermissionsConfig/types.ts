/**
 * Types for the Permissions Configuration system
 */

/**
 * Type of change operation
 */
export type ChangeType = "GRANT" | "REVOKE" | "CREATE" | "ALTER" | "DROP";

/**
 * Type of entity being modified
 */
export type EntityType = "USER" | "ROLE" | "QUOTA" | "ROW_POLICY" | "SETTINGS_PROFILE";

/**
 * Represents a pending change that hasn't been executed yet
 */
export interface PendingChange {
  /** Unique identifier for this change */
  id: string;

  /** Type of operation */
  type: ChangeType;

  /** Entity type being modified */
  entityType: EntityType;

  /** Name of the entity */
  entityName: string;

  /** Human-readable description of the change */
  description: string;

  /** SQL statements to execute */
  sqlStatements: string[];

  /** Original state before change (for diff view) */
  originalState?: Record<string, any>;

  /** New state after change (for diff view) */
  newState?: Record<string, any>;

  /** Timestamp when change was staged */
  createdAt: number;
}

/**
 * Result of executing a pending change
 */
export interface ChangeExecutionResult {
  changeId: string;
  success: boolean;
  error?: string;
}

/**
 * Layer type in the permissions config UI
 */
export type LayerType =
  | "users"
  | "roles"
  | "quotas"
  | "row_policies"
  | "settings_profiles"
  | "matrix";

/**
 * State for the permissions configuration system
 */
export interface PermissionsState {
  /** Queue of pending changes */
  pendingChanges: PendingChange[];

  /** Currently active layer */
  activeLayer: LayerType;

  /** Whether the review panel is open */
  isReviewPanelOpen: boolean;

  /** Whether changes are being executed */
  isExecuting: boolean;

  /** Execution results */
  executionResults: ChangeExecutionResult[];

  /** Current execution progress (1-based index) */
  executionProgress: number;

  /** Current change being executed */
  currentExecutingChange: PendingChange | null;
}

/**
 * Actions for managing permissions state
 */
export interface PermissionsActions {
  /** Add a pending change to the queue */
  addPendingChange: (change: Omit<PendingChange, "id" | "createdAt">) => void;

  /** Remove a pending change from the queue */
  removePendingChange: (changeId: string) => void;

  /** Clear all pending changes */
  clearPendingChanges: () => void;

  /** Set the active layer */
  setActiveLayer: (layer: LayerType) => void;

  /** Toggle the review panel */
  toggleReviewPanel: () => void;

  /** Execute all pending changes */
  executePendingChanges: () => Promise<ChangeExecutionResult[]>;

  /** Execute a specific pending change */
  executeChange: (changeId: string) => Promise<ChangeExecutionResult>;
}
