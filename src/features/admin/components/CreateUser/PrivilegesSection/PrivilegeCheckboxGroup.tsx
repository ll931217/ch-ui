import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PrivilegeGroup } from "./privilegeDefinitions";
import { Link2 } from "lucide-react";

interface PrivilegeCheckboxGroupProps {
  group: PrivilegeGroup;
  isPrivilegeGranted: (privilegeId: string) => boolean;
  isPrivilegeInherited: (privilegeId: string) => boolean;
  onTogglePrivilege: (privilegeId: string) => void;
  onCheckAll: () => void;
  onClearAll: () => void;
  /** Check if privilege is inherited from a role */
  isPrivilegeFromRole?: (privilegeId: string) => boolean;
  /** Get the source role name for a privilege */
  getPrivilegeRoleSource?: (privilegeId: string) => string | null;
  /** Check if privilege is editable */
  isPrivilegeEditable?: (privilegeId: string) => boolean;
}

const PrivilegeCheckboxGroup: React.FC<PrivilegeCheckboxGroupProps> = ({
  group,
  isPrivilegeGranted,
  isPrivilegeInherited,
  onTogglePrivilege,
  onCheckAll,
  onClearAll,
  isPrivilegeFromRole,
  getPrivilegeRoleSource,
  isPrivilegeEditable,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{group.name}</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCheckAll}
            className="h-7 text-xs"
          >
            Check All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {group.privileges.map((privilege) => {
          const isGranted = isPrivilegeGranted(privilege.id);
          const isInherited = isPrivilegeInherited(privilege.id);
          const isFromRole = isPrivilegeFromRole?.(privilege.id) || false;
          const roleSource = getPrivilegeRoleSource?.(privilege.id);
          const isEditable = isPrivilegeEditable?.(privilege.id) ?? true;

          return (
            <div
              key={privilege.id}
              className={cn(
                "flex items-start space-x-3 p-2 rounded-md transition-colors",
                isGranted ? "bg-muted/50" : isFromRole ? "bg-blue-50 dark:bg-blue-950/20" : "hover:bg-muted/30"
              )}
            >
              <Checkbox
                id={`privilege-${privilege.id}`}
                checked={isGranted || isInherited || isFromRole}
                onCheckedChange={() => isEditable && onTogglePrivilege(privilege.id)}
                disabled={!isEditable}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`privilege-${privilege.id}`}
                    className={cn(
                      "text-sm font-medium",
                      isEditable ? "cursor-pointer" : "cursor-not-allowed",
                      (isInherited || isFromRole) && !isGranted && "text-muted-foreground"
                    )}
                  >
                    {privilege.label}
                    {isInherited && !isGranted && !isFromRole && (
                      <span className="ml-2 text-xs">(inherited)</span>
                    )}
                  </Label>
                  {isFromRole && roleSource && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <Link2 className="h-3 w-3" />
                            {roleSource}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Inherited from role: {roleSource}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Edit the role to modify this privilege
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {privilege.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrivilegeCheckboxGroup;
