import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Link2 } from "lucide-react";
import { GrantedPermission } from "./permissions";
import { ExtendedGrantedPermission, RoleAssignment } from "./types";
import PrivilegesPanel from "./PrivilegesPanel";
import PresetToolbar from "./PresetToolbar";
import { usePresetStore } from "./usePresetStore";
import { useConnectionStore } from "@/store/connectionStore";

// Stable empty array reference to avoid creating new array on each render
const EMPTY_GRANTS: GrantedPermission[] = [];

interface PrivilegesSectionProps {
  form: any;
  databases?: string[];
  tables?: Map<string, string[]>;
  /** Extended grants with role inheritance (for EditUser) */
  effectiveGrants?: ExtendedGrantedPermission[];
  /** Assigned roles (for EditUser) */
  assignedRoles?: RoleAssignment[];
  /** Whether to show role source badges */
  showRoleSource?: boolean;
}

const PrivilegesSection: React.FC<PrivilegesSectionProps> = ({
  form,
  databases = [],
  tables = new Map(),
  effectiveGrants,
  assignedRoles,
  showRoleSource = false,
}) => {
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const { getPresets, getDefaultPreset } = usePresetStore();
  const hasAutoApplied = useRef(false);

  // Memoize handler to avoid unnecessary re-renders
  const handleGrantsChange = useCallback((grants: GrantedPermission[]) => {
    form.setValue("privileges.grants", grants, { shouldDirty: true });
  }, [form]);

  // Use stable reference for empty grants to avoid infinite loops
  const watchedGrants = form.watch("privileges.grants");
  const currentGrants = useMemo(() => {
    return watchedGrants && watchedGrants.length > 0 ? watchedGrants : EMPTY_GRANTS;
  }, [watchedGrants]);

  // Auto-apply default preset on mount if no grants exist
  useEffect(() => {
    if (hasAutoApplied.current || !activeConnectionId) {
      return;
    }

    // Only auto-apply if there are no grants yet
    if (!currentGrants || currentGrants.length === 0) {
      const defaultPresetId = getDefaultPreset(activeConnectionId);
      if (defaultPresetId) {
        const presets = getPresets(activeConnectionId);
        const defaultPreset = presets.find((p) => p.id === defaultPresetId);

        if (defaultPreset) {
          handleGrantsChange(defaultPreset.grants);
          hasAutoApplied.current = true;
        }
      }
    }
  }, [activeConnectionId, currentGrants, getDefaultPreset, getPresets, handleGrantsChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privileges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Select a preset or manually configure privileges. Privileges can be scoped to specific databases and tables.
        </div>

        {/* Role Info Banner */}
        {assignedRoles && assignedRoles.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Assigned Roles:</span>
                <div className="flex flex-wrap gap-2">
                  {assignedRoles.map((role) => (
                    <Badge key={role.roleName} variant="secondary" className="flex items-center gap-1">
                      {role.roleName}
                      {role.adminOption && <span className="text-xs">(admin)</span>}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Privileges from these roles are shown with <Link2 className="inline h-3 w-3" /> badge
                and cannot be modified here. Edit the role instead.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted/50 border" />
                  <span>Direct grant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-950/20 border" />
                  <span>Role-inherited</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preset Toolbar */}
        <PresetToolbar
          grants={currentGrants}
          onApplyPreset={handleGrantsChange}
        />

        <PrivilegesPanel
          databases={databases}
          tables={tables}
          grants={currentGrants}
          onChange={handleGrantsChange}
          effectiveGrants={effectiveGrants}
          showRoleSource={showRoleSource}
        />
      </CardContent>
    </Card>
  );
};

export default PrivilegesSection;
