import { GrantedPermission } from "./permissions";

/**
 * Source of a grant - either directly granted to user or inherited from a role
 */
export type GrantSource = "direct" | "role";

/**
 * Extended grant with source information for role inheritance visibility
 */
export interface ExtendedGrantedPermission extends GrantedPermission {
  /** Source of this grant */
  source: GrantSource;

  /** Name of the role this grant is inherited from (only set when source='role') */
  sourceRole?: string;
}

/**
 * Role assignment for a user
 */
export interface RoleAssignment {
  /** Name of the role */
  roleName: string;

  /** Whether user has admin option for this role (can grant role to others) */
  adminOption: boolean;
}

/**
 * Role information from system.roles
 */
export interface Role {
  /** Role name */
  name: string;

  /** Role ID */
  id: string;

  /** Storage (optional) */
  storage?: string;
}
