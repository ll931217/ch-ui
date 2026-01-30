import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissionsState } from "./hooks/usePermissionsState";
import { LayerType } from "./types";
import { Users, Shield, Gauge, Filter, Settings, Grid3x3, Eye } from "lucide-react";
import useAppStore from "@/store";
import UsersLayer from "./UsersLayer";
import RolesLayer from "./RolesLayer";
import QuotasLayer from "./QuotasLayer";
import RowPoliciesLayer from "./RowPoliciesLayer";
import SettingsProfilesLayer from "./SettingsProfilesLayer";
import PermissionsMatrix from "./PermissionsMatrix";
import ReviewPanel from "./ReviewPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";

/**
 * Main container for the comprehensive permissions configuration system
 */
export default function PermissionsConfig() {
  const { userPrivileges } = useAppStore();
  const permissionsState = usePermissionsState();
  const {
    pendingChanges,
    activeLayer,
    setActiveLayer,
    isReviewPanelOpen,
    toggleReviewPanel,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    executePendingChanges,
    isExecuting,
    executionResults,
  } = permissionsState;

  // Layer configurations with icons and privilege checks
  const layers: Array<{
    id: LayerType;
    label: string;
    icon: React.ReactNode;
    description: string;
    canAccess: boolean;
  }> = [
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      description: "Manage user accounts and their grants",
      canAccess: userPrivileges?.canShowUsers || false,
    },
    {
      id: "roles",
      label: "Roles",
      icon: <Shield className="w-4 h-4" />,
      description: "Create and configure roles",
      canAccess: userPrivileges?.canShowRoles || false,
    },
    {
      id: "quotas",
      label: "Quotas",
      icon: <Gauge className="w-4 h-4" />,
      description: "Configure resource quotas",
      canAccess: userPrivileges?.canShowQuotas || false,
    },
    {
      id: "row_policies",
      label: "Row Policies",
      icon: <Filter className="w-4 h-4" />,
      description: "Row-level security filters",
      canAccess: userPrivileges?.canShowRowPolicies || false,
    },
    {
      id: "settings_profiles",
      label: "Settings Profiles",
      icon: <Settings className="w-4 h-4" />,
      description: "Default settings per user/role",
      canAccess: userPrivileges?.canShowSettingsProfiles || false,
    },
    {
      id: "matrix",
      label: "Permissions Matrix",
      icon: <Grid3x3 className="w-4 h-4" />,
      description: "Visual overview of permissions",
      canAccess: true, // Matrix is read-only, always accessible
    },
  ];

  // Filter layers based on user privileges
  const accessibleLayers = layers.filter((layer) => layer.canAccess);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-medium mb-2">Permissions Configuration</h2>
          <p className="text-gray-400">
            Comprehensive access management with granular control
          </p>
        </div>

        {/* Pending changes indicator */}
        {pendingChanges.length > 0 && (
          <Button
            onClick={toggleReviewPanel}
            variant="default"
            size="lg"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Review Changes
            <Badge variant="secondary" className="ml-1">
              {pendingChanges.length}
            </Badge>
          </Button>
        )}
      </div>

      {/* No accessible layers warning */}
      {accessibleLayers.length === 0 && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 rounded-md p-4">
          <p className="text-sm text-yellow-500">
            You don't have permissions to access any permission configuration layers.
            Contact your administrator for access.
          </p>
        </div>
      )}

      {/* Layer tabs */}
      {accessibleLayers.length > 0 && (
        <Tabs
          value={activeLayer}
          onValueChange={(value) => setActiveLayer(value as LayerType)}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {accessibleLayers.map((layer) => (
              <TabsTrigger
                key={layer.id}
                value={layer.id}
                className="gap-2"
              >
                {layer.icon}
                {layer.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab contents */}
          <TabsContent value="users" className="space-y-4">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("Users layer error:", {
                  layer: "users",
                  user: userPrivileges?.username || "unknown",
                  error: error.message,
                  stack: error.stack,
                  componentStack: errorInfo.componentStack,
                });
                toast.error("Failed to load Users layer. Please try again.");
              }}
            >
              <UsersLayer onAddChange={addPendingChange} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("Roles layer error:", {
                  layer: "roles",
                  user: userPrivileges?.username || "unknown",
                  error: error.message,
                  stack: error.stack,
                  componentStack: errorInfo.componentStack,
                });
                toast.error("Failed to load Roles layer. Please try again.");
              }}
            >
              <RolesLayer onAddChange={addPendingChange} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="quotas" className="space-y-4">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("Quotas layer error:", {
                  layer: "quotas",
                  user: userPrivileges?.username || "unknown",
                  error: error.message,
                  stack: error.stack,
                  componentStack: errorInfo.componentStack,
                });
                toast.error("Failed to load Quotas layer. Please try again.");
              }}
            >
              <QuotasLayer onAddChange={addPendingChange} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="row_policies" className="space-y-4">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("Row Policies layer error:", {
                  layer: "row_policies",
                  user: userPrivileges?.username || "unknown",
                  error: error.message,
                  stack: error.stack,
                  componentStack: errorInfo.componentStack,
                });
                toast.error("Failed to load Row Policies layer. Please try again.");
              }}
            >
              <RowPoliciesLayer onAddChange={addPendingChange} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="settings_profiles" className="space-y-4">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("Settings Profiles layer error:", {
                  layer: "settings_profiles",
                  user: userPrivileges?.username || "unknown",
                  error: error.message,
                  stack: error.stack,
                  componentStack: errorInfo.componentStack,
                });
                toast.error("Failed to load Settings Profiles layer. Please try again.");
              }}
            >
              <SettingsProfilesLayer onAddChange={addPendingChange} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("Permissions Matrix error:", {
                  layer: "matrix",
                  user: userPrivileges?.username || "unknown",
                  error: error.message,
                  stack: error.stack,
                  componentStack: errorInfo.componentStack,
                });
                toast.error("Failed to load Permissions Matrix. Please try again.");
              }}
            >
              <PermissionsMatrix />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      )}

      {/* Review Panel */}
      <ReviewPanel
        isOpen={isReviewPanelOpen}
        changes={pendingChanges}
        isExecuting={isExecuting}
        executionResults={executionResults}
        onClose={toggleReviewPanel}
        onExecute={executePendingChanges}
        onRemoveChange={removePendingChange}
        onClearAll={clearPendingChanges}
      />
    </div>
  );
}
