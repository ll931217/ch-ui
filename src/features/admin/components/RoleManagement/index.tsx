import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RoleList from "./RoleList";
import RoleEditor from "./RoleEditor";
import { useRoles } from "../PermissionsConfig/hooks/useRoles";
import { Role } from "../CreateUser/PrivilegesSection/types";
import { PendingChange } from "../PermissionsConfig/types";

interface RoleManagementProps {
  onAddChange: (change: Omit<PendingChange, "id" | "createdAt">) => void;
  refreshTrigger?: number;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ onAddChange, refreshTrigger }) => {
  const { roles, loading, error, refetch } = useRoles({ refreshTrigger });
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedRole(null);
    setIsCreating(false);
    // Note: No refetch() here - table will refresh automatically when
    // pending changes are executed via the refreshTrigger prop
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading roles...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Role Management</CardTitle>
            <Button onClick={handleCreateRole} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage roles and their privileges. Roles can be assigned to users to grant sets of
            privileges.
          </p>
          <RoleList roles={roles} onEditRole={handleEditRole} onAddChange={onAddChange} />
        </CardContent>
      </Card>

      {isEditorOpen && (
        <RoleEditor
          role={selectedRole}
          isCreating={isCreating}
          onClose={handleCloseEditor}
          onAddChange={onAddChange}
        />
      )}
    </>
  );
};

export default RoleManagement;
