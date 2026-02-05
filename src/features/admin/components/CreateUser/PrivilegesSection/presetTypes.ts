// Type definitions for privilege presets

import { GrantedPermission } from "./permissions";

export interface PrivilegePreset {
  id: string; // crypto.randomUUID()
  name: string;
  grants: GrantedPermission[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface PresetExportData {
  version: 1;
  exportedAt: string;
  presets: PrivilegePreset[];
}
