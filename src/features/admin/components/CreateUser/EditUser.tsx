import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import useAppStore from "@/store";
import AuthenticationSection from "./AuthenticationSection";
import AccessControlSection from "./AccessControlSection";
import DatabaseRolesSection from "./DatabaseRolesSection";
import PrivilegesSection from "./PrivilegesSection";
import SettingsSection from "./SettingsSection";
import useMetadata from "./hooks/useMetadata";
import { useUserData } from "./hooks/useUserData";
import { useGrants } from "../PermissionsConfig/hooks/useGrants";
import { useSqlGenerator } from "../PermissionsConfig/hooks/useSqlGenerator";
import {
  GrantedPermission,
  findPermissionById,
  findParentId,
  formatScope,
} from "./PrivilegesSection/permissions";
import { Skeleton } from "@/components/ui/skeleton";

interface EditUserProps {
  username: string;
  onBack: () => void;
  onUserUpdated: () => void;
}

const EditUser: React.FC<EditUserProps> = ({
  username,
  onBack,
  onUserUpdated,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
      hostType: "ANY",
      hostValue: "",
      validUntil: undefined,
      defaultRole: "",
      defaultDatabase: "",
      grantees: "NONE",
      settings: {
        profile: "",
        readonly: false,
      },
      privileges: {
        isAdmin: false,
        grants: [] as GrantedPermission[],
      },
    },
  });

  const metadata = useMetadata(true);
  const { runQuery } = useAppStore();
  const { userInfo, loading: userLoading } = useUserData({ username });
  const { grants, loading: grantsLoading } = useGrants({ userName: username });
  const { generateAlterUser, generateGrant, generateRevoke } = useSqlGenerator();

  // Populate form when user data is loaded
  useEffect(() => {
    if (userInfo && grants) {
      // Determine host type and value
      let hostType = "ANY";
      let hostValue = "";

      if (userInfo.host_ip?.length > 0) {
        hostType = "IP";
        hostValue = userInfo.host_ip.join(", ");
      } else if (userInfo.host_names?.length > 0) {
        hostType = "NAME";
        hostValue = userInfo.host_names.join(", ");
      } else if (userInfo.host_names_regexp?.length > 0) {
        hostType = "REGEXP";
        hostValue = userInfo.host_names_regexp.join(", ");
      } else if (userInfo.host_names_like?.length > 0) {
        hostType = "LIKE";
        hostValue = userInfo.host_names_like.join(", ");
      }

      // Determine grantees
      const grantees = userInfo.grantees_any === 1 ? "ANY" : "NONE";

      form.reset({
        username: userInfo.name,
        password: "", // Don't populate password for security
        hostType,
        hostValue,
        validUntil: undefined,
        defaultRole: userInfo.default_roles_list?.[0] || "",
        defaultDatabase: userInfo.default_database || "",
        grantees,
        settings: {
          profile: userInfo.settings?.profile || "",
          readonly: userInfo.settings?.readonly || false,
        },
        privileges: {
          isAdmin: false,
          grants,
        },
      });
    }
  }, [userInfo, grants, form]);

  const onSubmit = async (data: any) => {
    if (!username) return;

    try {
      setError("");
      setLoading(true);

      const statements: string[] = [];

      // 1. Handle password change (only if provided)
      if (data.password) {
        statements.push(
          ...generateAlterUser(username, { password: data.password })
        );
      }

      // 2. Handle host changes
      if (userInfo) {
        const currentHostType = getHostType(userInfo);
        const currentHostValue = getHostValue(userInfo);

        if (data.hostType !== currentHostType || data.hostValue !== currentHostValue) {
          const hostChanges: any = {};

          if (data.hostType === "IP" && data.hostValue) {
            hostChanges.hostIp = data.hostValue.split(",").map((ip: string) => ip.trim());
          } else if (data.hostType === "NAME" && data.hostValue) {
            hostChanges.hostNames = data.hostValue.split(",").map((name: string) => name.trim());
          }

          statements.push(...generateAlterUser(username, hostChanges));
        }
      }

      // 3. Handle default database change
      if (data.defaultDatabase !== userInfo?.default_database) {
        statements.push(
          ...generateAlterUser(username, { defaultDatabase: data.defaultDatabase })
        );
      }

      // 4. Handle settings changes
      if (data.settings.profile !== userInfo?.settings?.profile) {
        statements.push(`ALTER USER ${username} SETTINGS PROFILE '${data.settings.profile}'`);
      }

      if (data.settings.readonly !== userInfo?.settings?.readonly) {
        const readonlyValue = data.settings.readonly ? 1 : 0;
        statements.push(`ALTER USER ${username} SETTINGS READONLY=${readonlyValue}`);
      }

      // 5. Handle grantees change
      const currentGrantees = userInfo?.grantees_any === 1 ? "ANY" : "NONE";
      if (data.grantees !== currentGrantees) {
        statements.push(`ALTER USER ${username} GRANTEES ${data.grantees}`);
      }

      // 6. Handle permission changes - diff original vs new grants
      const originalGrants = grants || [];
      const newGrants: GrantedPermission[] = data.privileges.grants || [];

      // Create maps for quick lookup
      const originalGrantsMap = new Map(
        originalGrants.map(g => [`${g.permissionId}:${JSON.stringify(g.scope)}`, g])
      );
      const newGrantsMap = new Map(
        newGrants.map(g => [`${g.permissionId}:${JSON.stringify(g.scope)}`, g])
      );

      // Find revoked permissions (in original but not in new)
      for (const [key, grant] of originalGrantsMap) {
        if (!newGrantsMap.has(key)) {
          const permission = findPermissionById(grant.permissionId);
          if (permission) {
            statements.push(generateRevoke(permission, grant.scope, username));
          }
        }
      }

      // Find new permissions (in new but not in original)
      const grantedIds = new Set(newGrants.map(g => g.permissionId));
      for (const [key, grant] of newGrantsMap) {
        if (!originalGrantsMap.has(key)) {
          const permission = findPermissionById(grant.permissionId);
          if (!permission) continue;

          // Skip if parent is also granted
          const parentId = findParentId(grant.permissionId);
          if (parentId && grantedIds.has(parentId)) {
            continue;
          }

          statements.push(generateGrant(permission, grant.scope, username));
        }
      }

      // Execute all statements
      for (const statement of statements) {
        const result = await runQuery(statement);
        if (result.error) {
          setError(`Failed to update user: ${result.error}`);
          return;
        }
      }

      if (statements.length === 0) {
        toast.info("No changes detected");
      } else {
        toast.success(`User ${username} updated successfully`);
      }

      onUserUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const newPassword = Array.from({ length: 16 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
    form.setValue("password", newPassword);
  };

  const getHostType = (userInfo: any) => {
    if (userInfo.host_ip?.length > 0) return "IP";
    if (userInfo.host_names?.length > 0) return "NAME";
    if (userInfo.host_names_regexp?.length > 0) return "REGEXP";
    if (userInfo.host_names_like?.length > 0) return "LIKE";
    return "ANY";
  };

  const getHostValue = (userInfo: any) => {
    if (userInfo.host_ip?.length > 0) return userInfo.host_ip.join(", ");
    if (userInfo.host_names?.length > 0) return userInfo.host_names.join(", ");
    if (userInfo.host_names_regexp?.length > 0) return userInfo.host_names_regexp.join(", ");
    if (userInfo.host_names_like?.length > 0) return userInfo.host_names_like.join(", ");
    return "";
  };

  const isLoading = userLoading || grantsLoading;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users & Roles
      </Button>

      {/* Title */}
      <h1 className="text-3xl font-medium mb-2">Edit User: {username}</h1>
      <p className="text-gray-400 mb-6">
        Modify authentication, permissions, and settings for this user.
      </p>

      {/* Form Container */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Authentication Section - with edit mode */}
              <AuthenticationSection
                form={form}
                handleGeneratePassword={handleGeneratePassword}
                isEditMode={true}
              />

              {/* Access Control Section */}
              <AccessControlSection form={form} />

              {/* Database and Roles Section */}
              <DatabaseRolesSection
                form={form}
                roles={metadata.roles}
                databases={metadata.databases}
              />

              {/* Privileges Section */}
              <PrivilegesSection
                form={form}
                databases={metadata.databases}
                tables={metadata.tables}
              />

              {/* Settings Section */}
              <SettingsSection form={form} profiles={metadata.profiles} />

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update User"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default EditUser;
