// src/lib/db/index.ts
// Dexie.js Database Configuration for CH-UI

import Dexie, { Table } from "dexie";
import { SavedConnection } from "./schema";

export class ChUiDatabase extends Dexie {
  connections!: Table<SavedConnection, string>;

  constructor() {
    super("ch-ui-db");

    this.version(1).stores({
      connections: "id, name, isDefault, createdAt",
    });
  }
}

export const db = new ChUiDatabase();

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Connection operations
export async function createConnection(
  connection: Omit<SavedConnection, "id" | "createdAt" | "updatedAt">
): Promise<SavedConnection> {
  const now = new Date();
  const newConnection: SavedConnection = {
    ...connection,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.connections.add(newConnection);
  return newConnection;
}

export async function getConnectionById(
  id: string
): Promise<SavedConnection | undefined> {
  return db.connections.get(id);
}

export async function getAllConnections(): Promise<SavedConnection[]> {
  return db.connections.toArray();
}

export async function updateConnection(
  id: string,
  updates: Partial<Omit<SavedConnection, "id" | "createdAt">>
): Promise<void> {
  await db.connections.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteConnection(id: string): Promise<void> {
  await db.connections.delete(id);
}

export async function setDefaultConnection(connectionId: string): Promise<void> {
  // Clear all existing defaults
  const allConnections = await getAllConnections();
  await Promise.all(
    allConnections
      .filter((c) => c.isDefault)
      .map((c) => updateConnection(c.id, { isDefault: false }))
  );
  // Set new default
  await updateConnection(connectionId, { isDefault: true });
}

export async function getDefaultConnection(): Promise<SavedConnection | undefined> {
  return db.connections.filter((c) => c.isDefault).first();
}

// Export re-exports schema types
export * from "./schema";
