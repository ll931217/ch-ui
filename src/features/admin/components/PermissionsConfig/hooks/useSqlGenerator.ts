import { useCallback } from "react";
import { generateGrantSql, PermissionNode, PermissionScope } from "../../CreateUser/PrivilegesSection/permissions";

/**
 * Hook for generating SQL statements for permission changes
 */
export function useSqlGenerator() {
  /**
   * Generate GRANT statement
   */
  const generateGrant = useCallback(
    (permission: PermissionNode, scope: PermissionScope, username: string): string => {
      return generateGrantSql(permission, scope, username);
    },
    []
  );

  /**
   * Generate REVOKE statement
   */
  const generateRevoke = useCallback(
    (permission: PermissionNode, scope: PermissionScope, username: string): string => {
      const scopeStr = formatScope(scope);
      return `REVOKE ${permission.sqlPrivilege} ON ${scopeStr} FROM ${username}`;
    },
    []
  );

  /**
   * Generate CREATE USER statement
   */
  const generateCreateUser = useCallback(
    (username: string, options: {
      password?: string;
      defaultDatabase?: string;
      defaultRoles?: string[];
      hostIp?: string[];
      hostNames?: string[];
    }): string[] => {
      const statements: string[] = [];

      // Build host restrictions
      let hostClause = '';
      if (options.hostIp && options.hostIp.length > 0) {
        const ips = options.hostIp.map(ip => `'${ip}'`).join(', ');
        hostClause = ` HOST IP ${ips}`;
      } else if (options.hostNames && options.hostNames.length > 0) {
        const hosts = options.hostNames.map(h => `'${h}'`).join(', ');
        hostClause = ` HOST NAME ${hosts}`;
      } else {
        hostClause = ' HOST ANY';
      }

      // Build CREATE USER statement
      let createStmt = `CREATE USER ${username}`;
      if (options.password) {
        createStmt += ` IDENTIFIED WITH sha256_password BY '${options.password}'`;
      }
      createStmt += hostClause;

      if (options.defaultDatabase) {
        createStmt += ` DEFAULT DATABASE ${options.defaultDatabase}`;
      }

      statements.push(createStmt);

      // Add default roles if specified
      if (options.defaultRoles && options.defaultRoles.length > 0) {
        const roles = options.defaultRoles.join(', ');
        statements.push(`GRANT ${roles} TO ${username}`);
        statements.push(`SET DEFAULT ROLE ${roles} TO ${username}`);
      }

      return statements;
    },
    []
  );

  /**
   * Generate ALTER USER statement
   */
  const generateAlterUser = useCallback(
    (username: string, changes: {
      password?: string;
      defaultDatabase?: string;
      hostIp?: string[];
      hostNames?: string[];
    }): string[] => {
      const statements: string[] = [];

      if (changes.password) {
        statements.push(
          `ALTER USER ${username} IDENTIFIED WITH sha256_password BY '${changes.password}'`
        );
      }

      if (changes.hostIp || changes.hostNames) {
        let hostClause = '';
        if (changes.hostIp && changes.hostIp.length > 0) {
          const ips = changes.hostIp.map(ip => `'${ip}'`).join(', ');
          hostClause = `HOST IP ${ips}`;
        } else if (changes.hostNames && changes.hostNames.length > 0) {
          const hosts = changes.hostNames.map(h => `'${h}'`).join(', ');
          hostClause = `HOST NAME ${hosts}`;
        } else {
          hostClause = 'HOST ANY';
        }
        statements.push(`ALTER USER ${username} ${hostClause}`);
      }

      if (changes.defaultDatabase !== undefined) {
        statements.push(
          `ALTER USER ${username} DEFAULT DATABASE ${changes.defaultDatabase}`
        );
      }

      return statements;
    },
    []
  );

  /**
   * Generate DROP USER statement
   */
  const generateDropUser = useCallback((username: string): string => {
    return `DROP USER IF EXISTS ${username}`;
  }, []);

  /**
   * Generate CREATE ROLE statement
   */
  const generateCreateRole = useCallback((roleName: string): string => {
    return `CREATE ROLE ${roleName}`;
  }, []);

  /**
   * Generate DROP ROLE statement
   */
  const generateDropRole = useCallback((roleName: string): string => {
    return `DROP ROLE IF EXISTS ${roleName}`;
  }, []);

  /**
   * Generate GRANT ROLE statement
   */
  const generateGrantRole = useCallback((roleName: string, username: string): string => {
    return `GRANT ${roleName} TO ${username}`;
  }, []);

  /**
   * Generate REVOKE ROLE statement
   */
  const generateRevokeRole = useCallback((roleName: string, username: string): string => {
    return `REVOKE ${roleName} FROM ${username}`;
  }, []);

  /**
   * Generate CREATE QUOTA statement
   */
  const generateCreateQuota = useCallback(
    (quotaName: string, options: {
      duration: string;
      queries?: number;
      errors?: number;
      resultRows?: number;
      readRows?: number;
      executionTime?: number;
    }): string => {
      let stmt = `CREATE QUOTA ${quotaName} FOR INTERVAL ${options.duration}`;

      if (options.queries !== undefined) {
        stmt += ` QUERIES ${options.queries}`;
      }
      if (options.errors !== undefined) {
        stmt += ` ERRORS ${options.errors}`;
      }
      if (options.resultRows !== undefined) {
        stmt += ` RESULT ROWS ${options.resultRows}`;
      }
      if (options.readRows !== undefined) {
        stmt += ` READ ROWS ${options.readRows}`;
      }
      if (options.executionTime !== undefined) {
        stmt += ` EXECUTION TIME ${options.executionTime}`;
      }

      return stmt;
    },
    []
  );

  /**
   * Generate DROP QUOTA statement
   */
  const generateDropQuota = useCallback((quotaName: string): string => {
    return `DROP QUOTA IF EXISTS ${quotaName}`;
  }, []);

  return {
    generateGrant,
    generateRevoke,
    generateCreateUser,
    generateAlterUser,
    generateDropUser,
    generateCreateRole,
    generateDropRole,
    generateGrantRole,
    generateRevokeRole,
    generateCreateQuota,
    generateDropQuota,
  };
}

/**
 * Format scope for SQL
 */
function formatScope(scope: PermissionScope): string {
  switch (scope.type) {
    case "global":
      return "*.*";
    case "database":
      return scope.database ? `${scope.database}.*` : "*.*";
    case "table":
      return scope.database && scope.table
        ? `${scope.database}.${scope.table}`
        : scope.database
          ? `${scope.database}.*`
          : "*.*";
    default:
      return "*.*";
  }
}
