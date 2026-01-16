import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  PermissionNode as PermissionNodeType,
  PermissionScope,
  GrantedPermission,
  PERMISSION_HIERARCHY,
  getAllPermissionIds,
} from "./permissions";
import { usePermissionTree } from "./usePermissionTree";
import PermissionNodeComponent from "./PermissionNode";

interface PermissionTreeProps {
  databases: string[];
  tables?: Map<string, string[]>;
  value?: GrantedPermission[];
  onChange?: (grants: GrantedPermission[]) => void;
  defaultScope?: PermissionScope;
  maxHeight?: number;
}

const PermissionTree: React.FC<PermissionTreeProps> = ({
  databases,
  tables = new Map(),
  value,
  onChange,
  defaultScope = { type: "global" },
  maxHeight = 400,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    grants,
    setGrants,
    expandedNodes,
    toggleExpanded,
    expandAll,
    collapseAll,
    isSelected,
    isPartiallySelected,
    togglePermission: baseTogglePermission,
    setPermissionScope: baseSetPermissionScope,
    getPermissionScope,
    getSelectedCount,
    clearAll: baseClearAll,
  } = usePermissionTree({ defaultScope, initialGrants: value });

  // Helper for deep comparison of grants arrays (Set-based, not index-based)
  const grantsEqual = useCallback((a: GrantedPermission[], b: GrantedPermission[]): boolean => {
    if (a.length !== b.length) return false;
    if (a.length === 0 && b.length === 0) return true;
    const aMap = new Map(a.map(g => [g.permissionId, g]));
    return b.every(g => {
      const match = aMap.get(g.permissionId);
      return match &&
        match.scope?.type === g.scope?.type &&
        match.scope?.database === g.scope?.database &&
        match.scope?.table === g.scope?.table;
    });
  }, []);

  // Track the last value we received from props to detect echoes
  const lastPropValueRef = useRef<GrantedPermission[]>(value || []);

  // Sync from controlled value (parent -> internal state)
  // Only sync if the value actually changed (deep compare)
  useEffect(() => {
    if (value === undefined) return;

    // Deep compare to avoid unnecessary updates
    if (!grantsEqual(value, lastPropValueRef.current)) {
      lastPropValueRef.current = value;
      setGrants(value);
    }
  }, [value, setGrants, grantsEqual]);

  // Wrap actions to notify parent only on user interactions
  const handleTogglePermission = useCallback(
    (id: string, scope?: PermissionScope) => {
      baseTogglePermission(id, scope);
    },
    [baseTogglePermission]
  );

  const handleSetPermissionScope = useCallback(
    (id: string, scope: PermissionScope) => {
      baseSetPermissionScope(id, scope);
    },
    [baseSetPermissionScope]
  );

  const handleClearAll = useCallback(() => {
    baseClearAll();
  }, [baseClearAll]);

  // Notify parent when grants change (but not if it matches what we just received from props)
  const prevGrantsRef = useRef<GrantedPermission[]>(value || []);
  useEffect(() => {
    // Skip if grants match what we just received from props (echo prevention)
    if (grantsEqual(grants, lastPropValueRef.current)) return;

    // Skip if grants haven't changed from last notification
    if (grantsEqual(grants, prevGrantsRef.current)) return;

    prevGrantsRef.current = grants;
    onChange?.(grants);
  }, [grants, onChange, grantsEqual]);

  // Filter nodes based on search
  const matchesSearch = (node: PermissionNodeType): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (node.name.toLowerCase().includes(query)) return true;
    if (node.sqlPrivilege.toLowerCase().includes(query)) return true;
    if (node.description?.toLowerCase().includes(query)) return true;
    if (node.children?.some(matchesSearch)) return true;
    return false;
  };

  // Auto-expand when searching
  useEffect(() => {
    if (searchQuery) {
      expandAll();
    }
  }, [searchQuery, expandAll]);

  // Render a permission node recursively
  const renderNode = (node: PermissionNodeType, level: number): React.ReactNode => {
    if (!matchesSearch(node)) return null;

    const nodeIsSelected = isSelected(node.id);
    const nodeIsPartial = isPartiallySelected(node.id);
    const nodeIsExpanded = expandedNodes.has(node.id);
    const nodeScope = getPermissionScope(node.id);

    return (
      <PermissionNodeComponent
        key={node.id}
        node={node}
        level={level}
        isSelected={nodeIsSelected}
        isPartiallySelected={nodeIsPartial}
        isExpanded={nodeIsExpanded}
        scope={nodeScope}
        onToggleSelect={handleTogglePermission}
        onToggleExpand={toggleExpanded}
        onScopeChange={handleSetPermissionScope}
        databases={databases}
        tables={tables}
      >
        {node.children?.map((child) => renderNode(child, level + 1))}
      </PermissionNodeComponent>
    );
  };

  const selectedCount = getSelectedCount();
  const totalCount = useMemo(() => getAllPermissionIds().length, []);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Expand/Collapse */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="h-8 px-2"
          >
            <ChevronDown className="h-4 w-4 mr-1" />
            Expand
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="h-8 px-2"
          >
            <ChevronUp className="h-4 w-4 mr-1" />
            Collapse
          </Button>
        </div>

        {/* Selection info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {selectedCount} / {totalCount} selected
          </Badge>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 px-2 text-destructive hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Permission Tree */}
      <ScrollArea
        className="border rounded-md"
        style={{ height: `${maxHeight}px` }}
      >
        <div className="p-2">
          {PERMISSION_HIERARCHY.map((node) => renderNode(node, 0))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PermissionTree;
