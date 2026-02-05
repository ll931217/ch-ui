import { TreeNodeData } from "../components/TreeNode";

/**
 * Recursively collects paths for all tree nodes that have children.
 * Used to initialize default-expanded state for the tree.
 *
 * @param nodes - Array of tree nodes to process
 * @param parentPath - Optional parent path prefix
 * @returns Array of path strings (e.g., ["Tables", "Tables/users", "Views"])
 */
export function collectParentPaths(
  nodes: TreeNodeData[],
  parentPath?: string
): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

    // Only collect paths for nodes that have children (expandable nodes)
    if (node.children && node.children.length > 0) {
      paths.push(currentPath);
      // Recursively collect paths from children
      paths.push(...collectParentPaths(node.children, currentPath));
    }
  }

  return paths;
}
