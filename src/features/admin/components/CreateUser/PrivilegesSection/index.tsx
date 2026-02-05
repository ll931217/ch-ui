import React, { useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { GrantedPermission } from "./permissions";
import PrivilegesPanel from "./PrivilegesPanel";

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
  const isAdmin = form.watch("privileges.isAdmin");

  // Memoize handler to avoid unnecessary re-renders
  const handleGrantsChange = useCallback((grants: GrantedPermission[]) => {
    form.setValue("privileges.grants", grants, { shouldDirty: true });
  }, [form]);

  // Use stable reference for empty grants to avoid infinite loops
  const watchedGrants = form.watch("privileges.grants");
  const currentGrants = useMemo(() => {
    return watchedGrants && watchedGrants.length > 0 ? watchedGrants : EMPTY_GRANTS;
  }, [watchedGrants]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privileges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin Toggle */}
        <FormField
          control={form.control}
          name="privileges.isAdmin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Admin Privileges</FormLabel>
                <FormDescription>
                  Grant all current user's privileges (with GRANT OPTION) on all databases. The new user will have the same privileges as you.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Privileges Panel (hidden when admin) */}
        {!isAdmin && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Select the database and table scope on the left, then grant specific privileges on the right. Privileges can be inherited from broader scopes.
            </div>
            <PrivilegesPanel
              databases={databases}
              tables={tables}
              grants={currentGrants}
              onChange={handleGrantsChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrivilegesSection;
