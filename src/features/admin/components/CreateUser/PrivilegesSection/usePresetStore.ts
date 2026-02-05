// Zustand store for privilege presets with localStorage persistence

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PrivilegePreset, PresetExportData } from "./presetTypes";
import { GrantedPermission } from "./permissions";
import { getAllPermissionIds } from "./permissions";

// Generate default "Admin" preset with all global privileges
function createAdminPreset(): Omit<PrivilegePreset, "id" | "createdAt" | "updatedAt"> {
  const allPermissionIds = getAllPermissionIds();
  const grants: GrantedPermission[] = allPermissionIds.map((permissionId) => ({
    permissionId,
    scope: { type: "global" as const },
  }));

  return {
    name: "Full Admin (All Privileges)",
    grants,
  };
}

// Generate default "Read-Only" preset
function createReadOnlyPreset(): Omit<PrivilegePreset, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "Read-Only Access",
    grants: [
      {
        permissionId: "SELECT",
        scope: { type: "global" as const },
      },
      {
        permissionId: "SHOW",
        scope: { type: "global" as const },
      },
    ],
  };
}

interface PresetState {
  presetsByConnection: Record<string, PrivilegePreset[]>;

  // Actions
  getPresets: (connectionId: string) => PrivilegePreset[];
  ensureDefaultPresets: (connectionId: string) => void;
  addPreset: (
    connectionId: string,
    name: string,
    grants: GrantedPermission[]
  ) => PrivilegePreset;
  updatePreset: (
    connectionId: string,
    id: string,
    grants: GrantedPermission[]
  ) => void;
  deletePreset: (connectionId: string, id: string) => void;
  importPresets: (connectionId: string, presets: PrivilegePreset[]) => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presetsByConnection: {},

      getPresets: (connectionId) => {
        return get().presetsByConnection[connectionId] || [];
      },

      ensureDefaultPresets: (connectionId) => {
        const existing = get().presetsByConnection[connectionId];

        // Only create defaults if connection has no presets
        if (!existing || existing.length === 0) {
          const now = new Date().toISOString();

          const adminPreset: PrivilegePreset = {
            ...createAdminPreset(),
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };

          const readOnlyPreset: PrivilegePreset = {
            ...createReadOnlyPreset(),
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            presetsByConnection: {
              ...state.presetsByConnection,
              [connectionId]: [adminPreset, readOnlyPreset],
            },
          }));
        }
      },

      addPreset: (connectionId, name, grants) => {
        const newPreset: PrivilegePreset = {
          id: crypto.randomUUID(),
          name,
          grants: JSON.parse(JSON.stringify(grants)), // Deep clone
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          presetsByConnection: {
            ...state.presetsByConnection,
            [connectionId]: [
              ...(state.presetsByConnection[connectionId] || []),
              newPreset,
            ],
          },
        }));

        return newPreset;
      },

      updatePreset: (connectionId, id, grants) => {
        set((state) => {
          const presets = state.presetsByConnection[connectionId] || [];
          const updatedPresets = presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  grants: JSON.parse(JSON.stringify(grants)), // Deep clone
                  updatedAt: new Date().toISOString(),
                }
              : preset
          );

          return {
            presetsByConnection: {
              ...state.presetsByConnection,
              [connectionId]: updatedPresets,
            },
          };
        });
      },

      deletePreset: (connectionId, id) => {
        set((state) => {
          const presets = state.presetsByConnection[connectionId] || [];
          const filteredPresets = presets.filter((preset) => preset.id !== id);

          return {
            presetsByConnection: {
              ...state.presetsByConnection,
              [connectionId]: filteredPresets,
            },
          };
        });
      },

      importPresets: (connectionId, presets) => {
        set((state) => {
          const existingPresets = state.presetsByConnection[connectionId] || [];
          const existingNames = new Set(
            existingPresets.map((p) => p.name.toLowerCase())
          );

          // Filter out presets with duplicate names
          const newPresets = presets.filter(
            (preset) => !existingNames.has(preset.name.toLowerCase())
          );

          return {
            presetsByConnection: {
              ...state.presetsByConnection,
              [connectionId]: [...existingPresets, ...newPresets],
            },
          };
        });
      },
    }),
    {
      name: "ch-ui-privilege-presets",
    }
  )
);

// Export helper: serialize presets to PresetExportData
export function exportPresets(connectionId: string): PresetExportData {
  const store = usePresetStore.getState();
  const presets = store.getPresets(connectionId);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    presets,
  };
}
