import React from "react";
import { ChevronRight, ChevronDown, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PermissionNode as PermissionNodeType, PermissionScope } from "./permissions";
import ScopeSelector from "./ScopeSelector";

interface PermissionNodeProps {
  node: PermissionNodeType;
  level: number;
  isSelected: boolean;
  isPartiallySelected: boolean;
  isExpanded: boolean;
  scope?: PermissionScope;
  onToggleSelect: (id: string, scope?: PermissionScope) => void;
  onToggleExpand: (id: string) => void;
  onScopeChange: (id: string, scope: PermissionScope) => void;
  databases: string[];
  tables: Map<string, string[]>;
  children?: React.ReactNode;
}

const PermissionNodeComponent: React.FC<PermissionNodeProps> = ({
  node,
  level,
  isSelected,
  isPartiallySelected,
  isExpanded,
  scope,
  onToggleSelect,
  onToggleExpand,
  onScopeChange,
  databases,
  tables,
  children,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const indentPx = level * 20;

  const handleCheckboxChange = () => {
    onToggleSelect(node.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node.id);
  };

  const handleScopeChange = (newScope: PermissionScope) => {
    onScopeChange(node.id, newScope);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors",
          isSelected && "bg-muted/30"
        )}
        style={{ paddingLeft: `${indentPx + 8}px` }}
      >
        {/* Expand/Collapse button */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={handleExpandClick}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : null}
        </div>

        {/* Checkbox with partial state indicator */}
        <div className="relative shrink-0">
          <Checkbox
            id={`perm-${node.id}`}
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            className={cn(
              isPartiallySelected && !isSelected && "data-[state=unchecked]:bg-muted"
            )}
          />
          {isPartiallySelected && !isSelected && (
            <Minus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          )}
        </div>

        {/* Label */}
        <label
          htmlFor={`perm-${node.id}`}
          className="flex-1 text-sm font-medium cursor-pointer truncate"
          title={node.description}
        >
          {node.name}
        </label>

        {/* Scope selector (only show when selected) */}
        {isSelected && scope && (
          <ScopeSelector
            scope={scope}
            onChange={handleScopeChange}
            allowedScopes={node.allowedScopes}
            databases={databases}
            tables={tables}
            compact
          />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-muted ml-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default PermissionNodeComponent;
