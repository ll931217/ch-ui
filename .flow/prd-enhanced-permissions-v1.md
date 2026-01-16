# PRD: Enhanced Hierarchical Permission Management

## Metadata
- **Feature**: Enhanced Permission Management Interface
- **Status**: implemented
- **Priority**: P1
- **Created**: 2026-01-16
- **Related Issues**: []

## Problem Statement

The current permission management UI in CH-UI provides only flat checkbox permissions at the database level. ClickHouse supports a rich hierarchical permission system with granular ALTER permissions at multiple scopes (global, database, table/view), but users cannot leverage this through the UI.

Users need:
1. Hierarchical permission selection with parent-child relationships
2. Fine-grained ALTER permissions (COLUMN, INDEX, CONSTRAINT, TTL, etc.)
3. Multi-scope support (*.*, db.*, db.table)
4. Inline scope selection per permission

## Requirements

### Functional Requirements

#### FR1: Hierarchical Permission Tree
- Display permissions in a collapsible tree structure matching ClickHouse's hierarchy
- Support for parent-child relationships (e.g., ALTER TABLE → ALTER COLUMN → ALTER ADD COLUMN)
- Auto-select all children when parent is selected
- Auto-deselect parent when any child is deselected
- Visual indentation to show hierarchy depth

#### FR2: Permission Categories
Implement the following permission hierarchies:

**ALTER (table/view scope only):**
```
ALTER
├── ALTER TABLE
│   ├── ALTER UPDATE
│   ├── ALTER DELETE
│   ├── ALTER COLUMN
│   │   ├── ALTER ADD COLUMN
│   │   ├── ALTER DROP COLUMN
│   │   ├── ALTER MODIFY COLUMN
│   │   ├── ALTER COMMENT COLUMN
│   │   ├── ALTER CLEAR COLUMN
│   │   └── ALTER RENAME COLUMN
│   ├── ALTER INDEX
│   │   ├── ALTER ORDER BY
│   │   ├── ALTER SAMPLE BY
│   │   ├── ALTER ADD INDEX
│   │   ├── ALTER DROP INDEX
│   │   ├── ALTER MATERIALIZE INDEX
│   │   └── ALTER CLEAR INDEX
│   ├── ALTER CONSTRAINT
│   │   ├── ALTER ADD CONSTRAINT
│   │   └── ALTER DROP CONSTRAINT
│   ├── ALTER TTL
│   │   └── ALTER MATERIALIZE TTL
│   ├── ALTER SETTINGS
│   ├── ALTER MOVE PARTITION
│   ├── ALTER FETCH PARTITION
│   └── ALTER FREEZE PARTITION
└── ALTER LIVE VIEW
    ├── ALTER LIVE VIEW REFRESH
    └── ALTER LIVE VIEW MODIFY QUERY
```

**Administrative ALTER (no table scope):**
```
ALTER DATABASE
ALTER USER
ALTER ROLE
ALTER QUOTA
ALTER [ROW] POLICY
ALTER [SETTINGS] PROFILE
```

**Common Permissions (restructured):**
```
SELECT
INSERT
CREATE
├── CREATE DATABASE
├── CREATE TABLE
├── CREATE VIEW
├── CREATE DICTIONARY
└── CREATE FUNCTION
DROP
├── DROP DATABASE
├── DROP TABLE
├── DROP VIEW
├── DROP DICTIONARY
└── DROP FUNCTION
TRUNCATE
```

#### FR3: Scope Selection
- Each permission row has an inline scope selector dropdown
- Scope options:
  - `*.*` (all databases, all tables) - global
  - `<database>.*` (all tables in database) - database level
  - `<database>.<table>` (specific table) - table level
- Database/table dropdowns populated from metadata
- Some permissions only support certain scopes (e.g., ALTER DATABASE is database-only)

#### FR4: Grant Query Generation
- Generate correct ClickHouse GRANT statements based on selections
- Format: `GRANT <permission> ON <scope> TO <username>`
- Combine permissions with same scope into single GRANT statement
- Support hierarchical grants (e.g., `GRANT ALTER COLUMN ON db.table TO user`)

#### FR5: UI Integration
- Extend existing PrivilegesSection component
- Maintain backward compatibility with existing isAdmin toggle
- When isAdmin is checked, hide the permission tree (grants ALL)
- Use existing UI components (Card, Checkbox, etc.)

### Non-Functional Requirements

#### NFR1: Performance
- Permission tree should render smoothly with all ~50 permission nodes
- Lazy-load database/table metadata only when scope selector is opened

#### NFR2: Usability
- Clear visual hierarchy with indentation
- Expandable/collapsible sections for organization
- Search/filter capability for finding permissions (nice-to-have)

#### NFR3: Maintainability
- Permission definitions in a separate constants file
- Tree structure defined declaratively, not hard-coded in JSX
- Easy to add new permissions as ClickHouse evolves

## Technical Design

### Data Structure
```typescript
interface PermissionNode {
  id: string;                    // e.g., "ALTER_ADD_COLUMN"
  name: string;                  // e.g., "ALTER ADD COLUMN"
  sqlPrivilege: string;          // e.g., "ALTER ADD COLUMN"
  children?: PermissionNode[];
  allowedScopes: ('global' | 'database' | 'table')[];
  description?: string;
}

interface GrantedPermission {
  permissionId: string;
  scope: {
    type: 'global' | 'database' | 'table';
    database?: string;
    table?: string;
  };
}
```

### Component Structure
```
PrivilegesSection/
├── index.tsx                 # Main component (existing, extended)
├── PermissionTree.tsx        # Tree container with expand/collapse
├── PermissionNode.tsx        # Individual permission row with checkbox + scope
├── ScopeSelector.tsx         # Inline dropdown for scope selection
├── constants/
│   └── permissions.ts        # Permission hierarchy definition
└── hooks/
    └── usePermissionTree.ts  # Tree state management (selection, expansion)
```

### Form State
```typescript
// Extended form defaultValues
privileges: {
  isAdmin: false,
  grants: GrantedPermission[],  // New: array of granted permissions with scopes
  // Keep legacy fields for backward compatibility
  allowDDL: false,
  allowInsert: false,
  allowSelect: false,
  // ...
}
```

## Acceptance Criteria

1. **AC1**: Permission tree displays all ALTER permissions in correct hierarchy
2. **AC2**: Selecting a parent permission auto-selects all children
3. **AC3**: Each permission row has working scope selector (global/database/table)
4. **AC4**: Generated GRANT queries are valid ClickHouse SQL
5. **AC5**: Existing isAdmin toggle continues to work
6. **AC6**: UI is responsive and doesn't lag with full permission tree
7. **AC7**: Permission definitions are in a separate maintainable file

## Out of Scope

- REVOKE permission UI (future enhancement)
- Permission templates/presets
- Viewing existing user permissions
- Role-based permission inheritance visualization

## Dependencies

- Existing PrivilegesSection component
- DatabaseRolesSection for database/table metadata
- useMetadata hook for fetching available databases/tables

## Risks

| Risk | Mitigation |
|------|------------|
| Complex tree state management | Use React context or reducer pattern |
| Performance with large permission tree | Virtualize list if needed, memoize components |
| ClickHouse permission syntax changes | Isolate SQL generation, make extensible |
