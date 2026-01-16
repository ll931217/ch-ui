// src/lib/db/schema.ts
// IndexedDB Schema Definitions for CH-UI

export interface SavedConnection {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  useAdvanced: boolean;
  customPath: string;
  requestTimeout: number;
  isDistributed: boolean;
  clusterName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Type for creating new records (without auto-generated fields)
export type CreateConnection = Omit<
  SavedConnection,
  "id" | "createdAt" | "updatedAt"
>;

// Type for connection display (same as SavedConnection without encryption)
export interface ConnectionDisplay {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  useAdvanced: boolean;
  customPath: string;
  requestTimeout: number;
  isDistributed: boolean;
  clusterName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Export format for connections
export interface ExportedConnection {
  name: string;
  url: string;
  username: string;
  password?: string;
  useAdvanced: boolean;
  customPath: string;
  requestTimeout: number;
  isDistributed: boolean;
  clusterName: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  connections: ExportedConnection[];
}
