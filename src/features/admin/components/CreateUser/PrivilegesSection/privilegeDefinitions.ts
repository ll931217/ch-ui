// Privilege definitions for DBeaver-style privilege management

export interface PrivilegeDefinition {
  id: string;
  sql: string;
  label: string;
  description: string;
  scopable: boolean; // Can be scoped to database.table
}

export interface PrivilegeGroup {
  name: string;
  privileges: PrivilegeDefinition[];
}

/**
 * Table Privileges - can be scoped to database.table
 */
export const TABLE_PRIVILEGES: PrivilegeDefinition[] = [
  {
    id: "SELECT",
    sql: "SELECT",
    label: "SELECT",
    description: "Read data from tables",
    scopable: true,
  },
  {
    id: "INSERT",
    sql: "INSERT",
    label: "INSERT",
    description: "Insert data into tables",
    scopable: true,
  },
  {
    id: "ALTER",
    sql: "ALTER",
    label: "ALTER",
    description: "Modify table structure",
    scopable: true,
  },
  {
    id: "DELETE",
    sql: "ALTER DELETE",
    label: "DELETE",
    description: "Delete rows from tables",
    scopable: true,
  },
  {
    id: "CREATE",
    sql: "CREATE",
    label: "CREATE",
    description: "Create new databases and tables",
    scopable: true,
  },
  {
    id: "CREATE_VIEW",
    sql: "CREATE VIEW",
    label: "CREATE VIEW",
    description: "Create new views",
    scopable: true,
  },
  {
    id: "DROP",
    sql: "DROP",
    label: "DROP",
    description: "Drop databases, tables, and views",
    scopable: true,
  },
  {
    id: "GRANT_OPTION",
    sql: "GRANT OPTION",
    label: "GRANT OPTION",
    description: "Grant privileges to other users",
    scopable: true,
  },
  {
    id: "INDEX",
    sql: "ALTER ADD INDEX, ALTER DROP INDEX",
    label: "INDEX",
    description: "Create or drop indexes",
    scopable: true,
  },
  {
    id: "TRUNCATE",
    sql: "TRUNCATE",
    label: "TRUNCATE",
    description: "Truncate tables",
    scopable: true,
  },
  {
    id: "SHOW",
    sql: "SHOW",
    label: "SHOW",
    description: "View table structure",
    scopable: true,
  },
  {
    id: "OPTIMIZE",
    sql: "OPTIMIZE",
    label: "OPTIMIZE",
    description: "Optimize table parts",
    scopable: true,
  },
  {
    id: "UPDATE",
    sql: "ALTER UPDATE",
    label: "UPDATE",
    description: "Update existing rows",
    scopable: true,
  },
];

/**
 * Other Privileges - typically global scope
 */
export const OTHER_PRIVILEGES: PrivilegeDefinition[] = [
  {
    id: "SYSTEM",
    sql: "SYSTEM",
    label: "SYSTEM",
    description: "System administration commands",
    scopable: false,
  },
  {
    id: "KILL_QUERY",
    sql: "KILL QUERY",
    label: "KILL QUERY",
    description: "Terminate running queries",
    scopable: false,
  },
  {
    id: "CREATE_USER",
    sql: "ACCESS MANAGEMENT",
    label: "CREATE USER",
    description: "Create user accounts",
    scopable: false,
  },
  {
    id: "ALTER_USER",
    sql: "ACCESS MANAGEMENT",
    label: "ALTER USER",
    description: "Modify user accounts",
    scopable: false,
  },
  {
    id: "DROP_USER",
    sql: "ACCESS MANAGEMENT",
    label: "DROP USER",
    description: "Delete user accounts",
    scopable: false,
  },
  {
    id: "CREATE_ROLE",
    sql: "ACCESS MANAGEMENT",
    label: "CREATE ROLE",
    description: "Create roles",
    scopable: false,
  },
  {
    id: "ALTER_ROLE",
    sql: "ACCESS MANAGEMENT",
    label: "ALTER ROLE",
    description: "Modify roles",
    scopable: false,
  },
  {
    id: "DROP_ROLE",
    sql: "ACCESS MANAGEMENT",
    label: "DROP ROLE",
    description: "Delete roles",
    scopable: false,
  },
];

export const PRIVILEGE_GROUPS: PrivilegeGroup[] = [
  {
    name: "Table Privileges",
    privileges: TABLE_PRIVILEGES,
  },
  {
    name: "Other Privileges",
    privileges: OTHER_PRIVILEGES,
  },
];

/**
 * Find a privilege definition by ID
 */
export function findPrivilegeById(id: string): PrivilegeDefinition | undefined {
  return [...TABLE_PRIVILEGES, ...OTHER_PRIVILEGES].find((p) => p.id === id);
}
