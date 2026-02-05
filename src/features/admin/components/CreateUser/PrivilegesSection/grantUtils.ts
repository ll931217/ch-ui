// Utility functions for comparing and managing grants

import { GrantedPermission } from "./permissions";

/**
 * Compares two arrays of granted permissions for equality.
 * Order-independent comparison based on permissionId and scope.
 *
 * @param a - First array of granted permissions
 * @param b - Second array of granted permissions
 * @returns true if both arrays contain the same permissions, false otherwise
 */
export function grantsMatch(
  a: GrantedPermission[],
  b: GrantedPermission[]
): boolean {
  if (a.length !== b.length) return false;

  // Create a set of serialized grant keys for efficient comparison
  const aKeys = new Set(
    a.map((g) => `${g.permissionId}:${JSON.stringify(g.scope)}`)
  );

  // Check if every grant in b exists in a
  return b.every((g) =>
    aKeys.has(`${g.permissionId}:${JSON.stringify(g.scope)}`)
  );
}
