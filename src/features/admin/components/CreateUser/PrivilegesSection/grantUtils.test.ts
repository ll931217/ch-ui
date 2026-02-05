import { describe, it, expect } from "vitest";
import { grantsMatch } from "./grantUtils";
import { GrantedPermission } from "./permissions";

describe("grantsMatch", () => {
  it("should return true for identical grants in same order", () => {
    const grants1: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
      { permissionId: "INSERT", scope: { database: "test" } },
    ];
    const grants2: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
      { permissionId: "INSERT", scope: { database: "test" } },
    ];

    expect(grantsMatch(grants1, grants2)).toBe(true);
  });

  it("should return true for identical grants in different order", () => {
    const grants1: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
      { permissionId: "INSERT", scope: { database: "test" } },
    ];
    const grants2: GrantedPermission[] = [
      { permissionId: "INSERT", scope: { database: "test" } },
      { permissionId: "SELECT", scope: { database: "test" } },
    ];

    expect(grantsMatch(grants1, grants2)).toBe(true);
  });

  it("should return false for different grant lengths", () => {
    const grants1: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
    ];
    const grants2: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
      { permissionId: "INSERT", scope: { database: "test" } },
    ];

    expect(grantsMatch(grants1, grants2)).toBe(false);
  });

  it("should return false for different permission IDs", () => {
    const grants1: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
    ];
    const grants2: GrantedPermission[] = [
      { permissionId: "INSERT", scope: { database: "test" } },
    ];

    expect(grantsMatch(grants1, grants2)).toBe(false);
  });

  it("should return false for different scopes", () => {
    const grants1: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test1" } },
    ];
    const grants2: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test2" } },
    ];

    expect(grantsMatch(grants1, grants2)).toBe(false);
  });

  it("should return true for empty grants arrays", () => {
    const grants1: GrantedPermission[] = [];
    const grants2: GrantedPermission[] = [];

    expect(grantsMatch(grants1, grants2)).toBe(true);
  });

  it("should return false when one array is empty", () => {
    const grants1: GrantedPermission[] = [
      { permissionId: "SELECT", scope: { database: "test" } },
    ];
    const grants2: GrantedPermission[] = [];

    expect(grantsMatch(grants1, grants2)).toBe(false);
  });

  it("should handle complex nested scopes", () => {
    const grants1: GrantedPermission[] = [
      {
        permissionId: "SELECT",
        scope: { database: "test", table: "users", columns: ["id", "name"] },
      },
    ];
    const grants2: GrantedPermission[] = [
      {
        permissionId: "SELECT",
        scope: { database: "test", table: "users", columns: ["id", "name"] },
      },
    ];

    expect(grantsMatch(grants1, grants2)).toBe(true);
  });
});
