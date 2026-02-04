import { useState, useCallback, useMemo } from "react";
import {
  PermissionNode,
  PermissionScope,
  GrantedPermission,
  PERMISSION_HIERARCHY,
  findPermissionById,
  getChildIds,
  getAncestorIds,
  ScopeType,
} from "./permissions";

interface UsePermissionTreeOptions {
  initialGrants?: GrantedPermission[];
  defaultScope?: PermissionScope;
}

interface UsePermissionTreeReturn {
  // Granted permissions
  grants: GrantedPermission[];
  setGrants: (grants: GrantedPermission[]) => void;

  // Expansion state
  expandedNodes: Set<string>;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Permission selection
  isSelected: (id: string) => boolean;
  isPartiallySelected: (id: string) => boolean;
  togglePermission: (id: string, scope?: PermissionScope) => void;
  setPermissionScope: (id: string, scope: PermissionScope) => void;
  getPermissionScope: (id: string) => PermissionScope | undefined;

  // Helpers
  getSelectedCount: () => number;
  clearAll: () => void;
  selectAll: (scope?: PermissionScope) => void;
}

const DEFAULT_SCOPE: PermissionScope = { type: "global" };

export function usePermissionTree(
  options: UsePermissionTreeOptions = {}
): UsePermissionTreeReturn {
  const { initialGrants = [], defaultScope = DEFAULT_SCOPE } = options;

  // Map of permissionId -> GrantedPermission
  const [grantsMap, setGrantsMap] = useState<Map<string, GrantedPermission>>(
    () => new Map(initialGrants.map((g) => [g.permissionId, g]))
  );

  // Set of expanded node IDs
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set()
  );

  // Get grants as array
  const grants = useMemo(
    () => Array.from(grantsMap.values()),
    [grantsMap]
  );

  // Set grants from array
  const setGrants = useCallback((newGrants: GrantedPermission[]) => {
    setGrantsMap(new Map(newGrants.map((g) => [g.permissionId, g])));
  }, []);

  // Check if a permission is selected
  const isSelected = useCallback(
    (id: string): boolean => grantsMap.has(id),
    [grantsMap]
  );

  // Check if a permission is partially selected (some children selected, not all)
  const isPartiallySelected = useCallback(
    (id: string): boolean => {
      const node = findPermissionById(id);
      if (!node?.children) return false;

      const childIds = getChildIds(node);
      const selectedChildCount = childIds.filter((cid) =>
        grantsMap.has(cid)
      ).length;

      return selectedChildCount > 0 && selectedChildCount < childIds.length;
    },
    [grantsMap]
  );

  // Get scope for a permission
  const getPermissionScope = useCallback(
    (id: string): PermissionScope | undefined => {
      return grantsMap.get(id)?.scope;
    },
    [grantsMap]
  );

  // Set scope for a permission
  const setPermissionScope = useCallback(
    (id: string, scope: PermissionScope) => {
      setGrantsMap((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(id);
        if (existing) {
          newMap.set(id, { ...existing, scope });
        }
        return newMap;
      });
    },
    []
  );

  // Get best allowed scope for a permission
  const getBestScope = useCallback(
    (node: PermissionNode, preferredScope: PermissionScope): PermissionScope => {
      const { allowedScopes } = node;

      // If preferred scope is allowed, use it
      if (allowedScopes.includes(preferredScope.type)) {
        return preferredScope;
      }

      // Otherwise, use the most permissive allowed scope
      const scopePriority: ScopeType[] = ["global", "database", "table"];
      for (const scopeType of scopePriority) {
        if (allowedScopes.includes(scopeType)) {
          return { type: scopeType };
        }
      }

      return preferredScope;
    },
    []
  );

  // Toggle a permission (with auto-select children)
  const togglePermission = useCallback(
    (id: string, scope?: PermissionScope) => {
      const node = findPermissionById(id);
      if (!node) return;

      setGrantsMap((prev) => {
        const newMap = new Map(prev);
        const wasSelected = newMap.has(id);

        if (wasSelected) {
          // Deselect: remove this node and all children
          newMap.delete(id);
          const childIds = getChildIds(node);
          for (const childId of childIds) {
            newMap.delete(childId);
          }

          // Check ancestors - if any ancestor has all children deselected, deselect it too
          const ancestorIds = getAncestorIds(id);
          for (const ancestorId of ancestorIds) {
            const ancestorNode = findPermissionById(ancestorId);
            if (ancestorNode?.children) {
              const ancestorChildIds = getChildIds(ancestorNode);
              const anyChildSelected = ancestorChildIds.some((cid) =>
                newMap.has(cid)
              );
              if (!anyChildSelected) {
                newMap.delete(ancestorId);
              }
            }
          }
        } else {
          // Select: add this node and all children with appropriate scopes
          const effectiveScope = scope || defaultScope;
          const nodeScope = getBestScope(node, effectiveScope);

          newMap.set(id, { permissionId: id, scope: nodeScope });

          // Select all children with the same scope preference
          const childIds = getChildIds(node);
          for (const childId of childIds) {
            const childNode = findPermissionById(childId);
            if (childNode) {
              const childScope = getBestScope(childNode, effectiveScope);
              newMap.set(childId, { permissionId: childId, scope: childScope });
            }
          }

          // Auto-expand selected parent nodes
          setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
          });
        }

        return newMap;
      });
    },
    [defaultScope, getBestScope]
  );

  // Expansion controls
  const toggleExpanded = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds: string[] = [];
    const collectIds = (nodes: PermissionNode[]) => {
      for (const node of nodes) {
        if (node.children) {
          allIds.push(node.id);
          collectIds(node.children);
        }
      }
    };
    collectIds(PERMISSION_HIERARCHY);
    setExpandedNodes(new Set(allIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Helpers
  const getSelectedCount = useCallback(() => grantsMap.size, [grantsMap]);

  const clearAll = useCallback(() => {
    setGrantsMap(new Map());
  }, []);

  const selectAll = useCallback(
    (scope?: PermissionScope) => {
      const effectiveScope = scope || defaultScope;
      const allIds: string[] = [];

      // Collect all permission IDs from hierarchy
      const collectIds = (nodes: PermissionNode[]) => {
        for (const node of nodes) {
          allIds.push(node.id);
          if (node.children) {
            collectIds(node.children);
          }
        }
      };
      collectIds(PERMISSION_HIERARCHY);

      // Create grants for all permissions
      const newMap = new Map<string, GrantedPermission>();
      for (const id of allIds) {
        const node = findPermissionById(id);
        if (node) {
          const nodeScope = getBestScope(node, effectiveScope);
          newMap.set(id, { permissionId: id, scope: nodeScope });
        }
      }

      setGrantsMap(newMap);
    },
    [defaultScope, getBestScope]
  );

  return {
    grants,
    setGrants,
    expandedNodes,
    toggleExpanded,
    expandAll,
    collapseAll,
    isSelected,
    isPartiallySelected,
    togglePermission,
    setPermissionScope,
    getPermissionScope,
    getSelectedCount,
    clearAll,
    selectAll,
  };
}
