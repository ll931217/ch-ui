// src/store/connectionStore.ts
// Connection management store using Zustand

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SavedConnection,
  ConnectionDisplay,
  ExportData,
  ExportedConnection,
  ExportedSavedQuery,
  createConnection,
  getConnectionById,
  getAllConnections,
  updateConnection,
  deleteConnection as dbDeleteConnection,
  setDefaultConnection,
  getSavedQueriesByConnectionId,
  createSavedQuery,
  deleteSavedQueriesByConnectionId,
} from "@/lib/db";

interface ConnectionState {
  connections: ConnectionDisplay[];
  activeConnectionId: string | null;
  isLoading: boolean;
  error: string | null;
  databasesByConnection: Record<string, string[]>;

  // Actions
  loadConnections: () => Promise<void>;
  cacheDatabasesForConnection: (connectionId: string, databases: string[]) => void;
  getDatabasesForConnection: (connectionId: string) => string[];
  saveConnection: (connection: {
    name: string;
    url: string;
    username: string;
    password: string;
    useAdvanced?: boolean;
    customPath?: string;
    requestTimeout?: number;
    isDistributed?: boolean;
    clusterName?: string;
    isDefault?: boolean;
  }) => Promise<SavedConnection | null>;
  updateConnectionById: (
    id: string,
    updates: {
      name?: string;
      url?: string;
      username?: string;
      password?: string;
      useAdvanced?: boolean;
      customPath?: string;
      requestTimeout?: number;
      isDistributed?: boolean;
      clusterName?: string;
      isDefault?: boolean;
    }
  ) => Promise<boolean>;
  deleteConnectionById: (id: string) => Promise<boolean>;
  setActiveConnection: (id: string | null) => void;
  setAsDefault: (id: string) => Promise<boolean>;
  getPassword: (connectionId: string) => Promise<string | null>;

  // Export/Import
  exportConnections: (
    connectionIds: string[],
    includePasswords: boolean
  ) => Promise<Blob | null>;
  importConnections: (file: File) => Promise<{ success: number; failed: number }>;

  clearError: () => void;
}

// Helper to convert SavedConnection to ConnectionDisplay
function toDisplay(conn: SavedConnection): ConnectionDisplay {
  return {
    id: conn.id,
    name: conn.name,
    url: conn.url,
    username: conn.username,
    password: conn.password,
    useAdvanced: conn.useAdvanced,
    customPath: conn.customPath,
    requestTimeout: conn.requestTimeout,
    isDistributed: conn.isDistributed,
    clusterName: conn.clusterName,
    isDefault: conn.isDefault,
    createdAt: conn.createdAt,
    updatedAt: conn.updatedAt,
  };
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnectionId: null,
      isLoading: false,
      error: null,
      databasesByConnection: {},

  cacheDatabasesForConnection: (connectionId, databases) => {
    set((state) => ({
      databasesByConnection: {
        ...state.databasesByConnection,
        [connectionId]: databases,
      },
    }));
  },

  getDatabasesForConnection: (connectionId) => {
    return get().databasesByConnection[connectionId] || [];
  },

  loadConnections: async () => {
    set({ isLoading: true, error: null });

    try {
      const connections = await getAllConnections();
      const displayConnections = connections.map(toDisplay);

      set({
        connections: displayConnections,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load connections",
      });
    }
  },

  saveConnection: async (connection) => {
    set({ isLoading: true, error: null });

    try {
      const newConnection = await createConnection({
        name: connection.name,
        url: connection.url,
        username: connection.username,
        password: connection.password,
        useAdvanced: connection.useAdvanced ?? false,
        customPath: connection.customPath ?? "",
        requestTimeout: connection.requestTimeout ?? 30000,
        isDistributed: connection.isDistributed ?? false,
        clusterName: connection.clusterName ?? "",
        isDefault: connection.isDefault ?? false,
      });

      // If this is set as default, update other connections
      if (connection.isDefault) {
        await setDefaultConnection(newConnection.id);
      }

      // Reload connections
      await get().loadConnections();

      set({ isLoading: false });
      return newConnection;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to save connection",
      });
      return null;
    }
  },

  updateConnectionById: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const connection = await getConnectionById(id);

      if (!connection) {
        set({ isLoading: false, error: "Connection not found" });
        return false;
      }

      const updateData: Partial<SavedConnection> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.url !== undefined) updateData.url = updates.url;
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.password !== undefined) updateData.password = updates.password;
      if (updates.useAdvanced !== undefined)
        updateData.useAdvanced = updates.useAdvanced;
      if (updates.customPath !== undefined)
        updateData.customPath = updates.customPath;
      if (updates.requestTimeout !== undefined)
        updateData.requestTimeout = updates.requestTimeout;
      if (updates.isDistributed !== undefined)
        updateData.isDistributed = updates.isDistributed;
      if (updates.clusterName !== undefined)
        updateData.clusterName = updates.clusterName;

      await updateConnection(id, updateData);

      // Handle default flag
      if (updates.isDefault) {
        await setDefaultConnection(id);
      }

      await get().loadConnections();
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to update connection",
      });
      return false;
    }
  },

  deleteConnectionById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const connection = await getConnectionById(id);

      if (!connection) {
        set({ isLoading: false, error: "Connection not found" });
        return false;
      }

      // Delete associated saved queries first (cascade delete)
      await deleteSavedQueriesByConnectionId(id);

      // Then delete the connection
      await dbDeleteConnection(id);

      // Clear active connection if it was deleted
      if (get().activeConnectionId === id) {
        set({ activeConnectionId: null });
      }

      await get().loadConnections();
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to delete connection",
      });
      return false;
    }
  },

  setActiveConnection: (id) => {
    set({ activeConnectionId: id });
  },

  setAsDefault: async (id) => {
    try {
      await setDefaultConnection(id);
      await get().loadConnections();
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to set default" });
      return false;
    }
  },

  getPassword: async (connectionId) => {
    try {
      const connection = await getConnectionById(connectionId);
      return connection?.password ?? null;
    } catch {
      set({ error: "Failed to get password" });
      return null;
    }
  },

  exportConnections: async (connectionIds, includePasswords) => {
    try {
      const connections: ExportedConnection[] = [];
      const savedQueries: Record<string, ExportedSavedQuery[]> = {};

      for (const id of connectionIds) {
        const conn = await getConnectionById(id);
        if (!conn) continue;

        connections.push({
          name: conn.name,
          url: conn.url,
          username: conn.username,
          password: includePasswords ? conn.password : undefined,
          useAdvanced: conn.useAdvanced,
          customPath: conn.customPath,
          requestTimeout: conn.requestTimeout,
          isDistributed: conn.isDistributed,
          clusterName: conn.clusterName,
        });

        // Fetch saved queries for this connection
        const queries = await getSavedQueriesByConnectionId(id);
        if (queries.length > 0) {
          savedQueries[conn.name] = queries.map((q) => ({
            name: q.name,
            query: q.query,
            databaseName: q.databaseName,
          }));
        }
      }

      const exportData: ExportData = {
        version: "2.0",
        exportedAt: new Date().toISOString(),
        connections,
        savedQueries: Object.keys(savedQueries).length > 0 ? savedQueries : undefined,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: "application/json" });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Export failed" });
      return null;
    }
  },

  importConnections: async (file) => {
    try {
      const content = await file.text();
      const data: ExportData = JSON.parse(content);

      if (!data.connections || !Array.isArray(data.connections)) {
        set({ error: "Invalid export file format" });
        return { success: 0, failed: 0 };
      }

      let success = 0;
      let failed = 0;

      // Map of connection names to new IDs for query association
      const connectionNameToIdMap: Record<string, string> = {};

      for (const conn of data.connections) {
        try {
          const savedConn = await get().saveConnection({
            name: conn.name,
            url: conn.url,
            username: conn.username,
            password: conn.password || "",
            useAdvanced: conn.useAdvanced,
            customPath: conn.customPath,
            requestTimeout: conn.requestTimeout,
            isDistributed: conn.isDistributed,
            clusterName: conn.clusterName,
          });

          if (savedConn) {
            connectionNameToIdMap[conn.name] = savedConn.id;
          }
          success++;
        } catch {
          failed++;
        }
      }

      // Import saved queries if present (v2.0 format)
      if (data.savedQueries && data.version === "2.0") {
        for (const [connectionName, queries] of Object.entries(data.savedQueries)) {
          const connectionId = connectionNameToIdMap[connectionName];
          if (!connectionId) continue;

          for (const query of queries) {
            try {
              await createSavedQuery({
                name: query.name,
                query: query.query,
                connectionId,
                databaseName: query.databaseName,
              });
            } catch (err) {
              console.error(`Failed to import query "${query.name}":`, err);
            }
          }
        }
      }

      await get().loadConnections();
      return { success, failed };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Import failed" });
      return { success: 0, failed: 0 };
    }
  },

      clearError: () => set({ error: null }),
    }),
    {
      name: "connection-storage",
      partialize: (state) => ({
        activeConnectionId: state.activeConnectionId,
      }),
    }
  )
);

export default useConnectionStore;
