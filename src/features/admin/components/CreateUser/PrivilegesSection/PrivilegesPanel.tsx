import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import DatabaseList from "./DatabaseList";
import TableList from "./TableList";
import PrivilegeCheckboxGroup from "./PrivilegeCheckboxGroup";
import { usePrivilegesPanel } from "./usePrivilegesPanel";
import { GrantedPermission } from "./permissions";
import { ExtendedGrantedPermission } from "./types";
import { PRIVILEGE_GROUPS } from "./privilegeDefinitions";

interface PrivilegesPanelProps {
  databases: string[];
  tables: Map<string, string[]>;
  grants: GrantedPermission[];
  onChange: (grants: GrantedPermission[]) => void;
  /** Extended grants with role inheritance information (optional) */
  effectiveGrants?: ExtendedGrantedPermission[];
  /** Whether to show role source badges */
  showRoleSource?: boolean;
}

const PrivilegesPanel: React.FC<PrivilegesPanelProps> = ({
  databases,
  tables,
  grants,
  onChange,
  effectiveGrants,
  showRoleSource = false,
}) => {
  const {
    state,
    setState,
    availableTables,
    isPrivilegeGranted,
    isPrivilegeInherited,
    isPrivilegeFromRole,
    getPrivilegeRoleSource,
    isPrivilegeEditable,
    togglePrivilege,
    setAllPrivileges,
  } = usePrivilegesPanel({ databases, tables, grants, onChange, effectiveGrants });

  return (
    <div className="grid grid-cols-[250px_250px_1fr] h-125 border-2 rounded-lg overflow-hidden">
      {/* Left Panel: Databases */}
      <DatabaseList
        databases={databases}
        selectedDatabase={state.selectedDatabase}
        onSelectDatabase={(db) =>
          setState({ selectedDatabase: db, selectedTable: null })
        }
      />

      {/* Middle Panel: Tables */}
      <TableList
        tables={availableTables}
        selectedTable={state.selectedTable}
        onSelectTable={(table) => setState({ ...state, selectedTable: table })}
        disabled={!state.selectedDatabase}
      />

      {/* Right Panel: Privileges */}
      <div className="flex flex-col h-full min-h-0">
        <div className="px-4 py-3 border-b-2 bg-muted/50">
          <h3 className="font-semibold text-sm">Privileges</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Scope:{" "}
            {state.selectedDatabase
              ? state.selectedTable
                ? `${state.selectedDatabase}.${state.selectedTable}`
                : state.selectedDatabase
              : "Global"}
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {PRIVILEGE_GROUPS.map((group) => (
              <PrivilegeCheckboxGroup
                key={group.name}
                group={group}
                isPrivilegeGranted={isPrivilegeGranted}
                isPrivilegeInherited={isPrivilegeInherited}
                onTogglePrivilege={togglePrivilege}
                onCheckAll={() =>
                  setAllPrivileges(
                    group.privileges.map((p) => p.id),
                    true,
                  )
                }
                onClearAll={() =>
                  setAllPrivileges(
                    group.privileges.map((p) => p.id),
                    false,
                  )
                }
                isPrivilegeFromRole={showRoleSource ? isPrivilegeFromRole : undefined}
                getPrivilegeRoleSource={showRoleSource ? getPrivilegeRoleSource : undefined}
                isPrivilegeEditable={showRoleSource ? isPrivilegeEditable : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PrivilegesPanel;
