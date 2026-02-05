import { useState, useMemo, useCallback } from "react";
import { GrantedPermission, PermissionScope } from "./permissions";
import { findPrivilegeById } from "./privilegeDefinitions";

interface UsePrivilegesPanelProps {
  databases: string[];
  tables: Map<string, string[]>;
  grants: GrantedPermission[];
  onChange: (grants: GrantedPermission[]) => void;
}

export interface PrivilegesPanelState {
  selectedDatabase: string | null; // null = "% (All)" / global scope
  selectedTable: string | null; // null = "% (All)" / database scope
}

export const usePrivilegesPanel = ({
  databases,
  tables,
  grants,
  onChange,
}: UsePrivilegesPanelProps) => {
  const [state, setState] = useState<PrivilegesPanelState>({
    selectedDatabase: null,
    selectedTable: null,
  });

  // Get tables for the selected database
  const availableTables = useMemo(() => {
    if (!state.selectedDatabase) return [];
    return tables.get(state.selectedDatabase) || [];
  }, [state.selectedDatabase, tables]);

  // Determine current scope based on selection
  const currentScope = useMemo((): PermissionScope => {
    if (state.selectedDatabase && state.selectedTable) {
      return {
        type: "table",
        database: state.selectedDatabase,
        table: state.selectedTable,
      };
    } else if (state.selectedDatabase) {
      return {
        type: "database",
        database: state.selectedDatabase,
      };
    } else {
      return { type: "global" };
    }
  }, [state.selectedDatabase, state.selectedTable]);

  // Check if a privilege is granted at the current scope
  const isPrivilegeGranted = useCallback(
    (privilegeId: string): boolean => {
      return grants.some((grant) => {
        if (grant.permissionId !== privilegeId) return false;

        // Check if grant matches current scope
        if (currentScope.type === "global") {
          return grant.scope.type === "global";
        } else if (currentScope.type === "database") {
          return (
            grant.scope.type === "database" &&
            grant.scope.database === currentScope.database
          );
        } else if (currentScope.type === "table") {
          return (
            grant.scope.type === "table" &&
            grant.scope.database === currentScope.database &&
            grant.scope.table === currentScope.table
          );
        }
        return false;
      });
    },
    [grants, currentScope]
  );

  // Check if a privilege is inherited from a broader scope
  const isPrivilegeInherited = useCallback(
    (privilegeId: string): boolean => {
      // If we're at table scope, check if granted at database or global
      if (currentScope.type === "table") {
        const dbGrant = grants.some(
          (g) =>
            g.permissionId === privilegeId &&
            g.scope.type === "database" &&
            g.scope.database === currentScope.database
        );
        const globalGrant = grants.some(
          (g) => g.permissionId === privilegeId && g.scope.type === "global"
        );
        return dbGrant || globalGrant;
      }

      // If we're at database scope, check if granted at global
      if (currentScope.type === "database") {
        return grants.some(
          (g) => g.permissionId === privilegeId && g.scope.type === "global"
        );
      }

      return false;
    },
    [grants, currentScope]
  );

  // Toggle a privilege at the current scope
  const togglePrivilege = useCallback(
    (privilegeId: string) => {
      const privilege = findPrivilegeById(privilegeId);
      if (!privilege) return;

      const isGranted = isPrivilegeGranted(privilegeId);

      if (isGranted) {
        // Remove the grant at this scope
        const newGrants = grants.filter(
          (grant) =>
            !(
              grant.permissionId === privilegeId &&
              grant.scope.type === currentScope.type &&
              (currentScope.type === "global" ||
                (grant.scope.type !== "global" &&
                  grant.scope.database === currentScope.database &&
                  (currentScope.type === "database" ||
                    (grant.scope.type === "table" &&
                      grant.scope.table === currentScope.table))))
            )
        );
        onChange(newGrants);
      } else {
        // Add the grant at this scope
        const newGrant: GrantedPermission = {
          permissionId: privilegeId,
          scope: currentScope,
        };
        onChange([...grants, newGrant]);
      }
    },
    [grants, currentScope, isPrivilegeGranted, onChange]
  );

  // Set all privileges in a group
  const setAllPrivileges = useCallback(
    (privilegeIds: string[], checked: boolean) => {
      if (checked) {
        // Add all privileges that aren't already granted
        const newGrants = [...grants];
        for (const privilegeId of privilegeIds) {
          if (!isPrivilegeGranted(privilegeId)) {
            newGrants.push({
              permissionId: privilegeId,
              scope: currentScope,
            });
          }
        }
        onChange(newGrants);
      } else {
        // Remove all privileges at this scope
        const newGrants = grants.filter(
          (grant) =>
            !(
              privilegeIds.includes(grant.permissionId) &&
              grant.scope.type === currentScope.type &&
              (currentScope.type === "global" ||
                (grant.scope.type !== "global" &&
                  grant.scope.database === currentScope.database &&
                  (currentScope.type === "database" ||
                    (grant.scope.type === "table" &&
                      grant.scope.table === currentScope.table))))
            )
        );
        onChange(newGrants);
      }
    },
    [grants, currentScope, isPrivilegeGranted, onChange]
  );

  return {
    state,
    setState,
    availableTables,
    currentScope,
    isPrivilegeGranted,
    isPrivilegeInherited,
    togglePrivilege,
    setAllPrivileges,
  };
};
