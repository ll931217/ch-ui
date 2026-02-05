// Zustand store for privilege presets with localStorage persistence

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PrivilegePreset, PresetExportData } from "./presetTypes";
import { GrantedPermission } from "./permissions";

interface PresetState {
  presetsByConnection: Record<string, PrivilegePreset[]>;

  // Actions
  getPresets: (connectionId: string) => PrivilegePreset[];
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
