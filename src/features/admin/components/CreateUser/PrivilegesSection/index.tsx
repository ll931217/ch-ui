import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GrantedPermission } from "./permissions";
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
}

const PrivilegesSection: React.FC<PrivilegesSectionProps> = ({
  form,
  databases = [],
  tables = new Map(),
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
        />
      </CardContent>
    </Card>
  );
};

export default PrivilegesSection;
