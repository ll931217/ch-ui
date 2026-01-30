// types.ts
export interface UserData {
  name: string;
  id: string;
  auth_type: string[];
  host_ip?: string[];
  host_names?: string[];
  host_names_regexp?: string[];
  host_names_like?: string[];
  default_roles_all: number;
  default_roles_list?: string[];
  default_database?: string;
  grantees_any: number;
  grantees_list?: string[];
  grants?: any[];
  settings_profile?: string;
  readonly?: boolean;
}

/**
 * Granular user privileges derived from ClickHouse native grants
 */
export interface UserPrivileges {
  // View privileges (SHOW)
  canShowUsers: boolean;
  canShowRoles: boolean;
  canShowQuotas: boolean;
  canShowRowPolicies: boolean;
  canShowSettingsProfiles: boolean;

  // Modify privileges
  canAlterUser: boolean;
  canAlterRole: boolean;
  canCreateUser: boolean;
  canCreateRole: boolean;
  canDropUser: boolean;
  canDropRole: boolean;

  // Quota and policy privileges
  canAlterQuota: boolean;
  canCreateQuota: boolean;
  canDropQuota: boolean;
  canAlterRowPolicy: boolean;
  canCreateRowPolicy: boolean;
  canDropRowPolicy: boolean;

  // Settings profile privileges
  canAlterSettingsProfile: boolean;
  canCreateSettingsProfile: boolean;
  canDropSettingsProfile: boolean;

  // Grant option (can grant privileges to others)
  hasGrantOption: boolean;
}