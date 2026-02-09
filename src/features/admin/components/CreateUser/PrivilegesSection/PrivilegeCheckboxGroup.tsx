import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PrivilegeGroup } from "./privilegeDefinitions";

interface PrivilegeCheckboxGroupProps {
  group: PrivilegeGroup;
  isPrivilegeGranted: (privilegeId: string) => boolean;
  isPrivilegeInherited: (privilegeId: string) => boolean;
  onTogglePrivilege: (privilegeId: string) => void;
  onCheckAll: () => void;
  onClearAll: () => void;
}

const PrivilegeCheckboxGroup: React.FC<PrivilegeCheckboxGroupProps> = ({
  group,
  isPrivilegeGranted,
  isPrivilegeInherited,
  onTogglePrivilege,
  onCheckAll,
  onClearAll,
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

          return (
            <div
              key={privilege.id}
              className={cn(
                "flex items-start space-x-3 p-2 rounded-md transition-colors",
                isGranted ? "bg-muted/50" : "hover:bg-muted/30"
              )}
            >
              <Checkbox
                id={`privilege-${privilege.id}`}
                checked={isGranted || isInherited}
                onCheckedChange={() => onTogglePrivilege(privilege.id)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-0.5">
                <Label
                  htmlFor={`privilege-${privilege.id}`}
                  className={cn(
                    "text-sm font-medium cursor-pointer",
                    isInherited && !isGranted && "text-muted-foreground"
                  )}
                >
                  {privilege.label}
                  {isInherited && !isGranted && (
                    <span className="ml-2 text-xs">(inherited)</span>
                  )}
                </Label>
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
