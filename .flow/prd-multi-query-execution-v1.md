# PRD: Multi-Query Execution with Cursor-Based Selection

---
status: implemented
priority: high
created: 2026-01-16
related_issues: []
---

## Overview

Currently, each SQL tab in CH-UI only allows executing one query at a time (either the entire editor content or selected text). Users who work with multiple queries (separated by `;`) must manually select each query before executing.

This feature enables users to:
1. Write multiple SQL queries in a single tab, separated by semicolons (`;`)
2. Execute only the query where the cursor is positioned (single Run button)
3. Execute all queries at once with a dedicated "Run All" button
4. View results from multiple queries in a tabbed results panel

## User Stories

### US-1: Execute Query at Cursor
**As a** database developer
**I want to** click Run and have only the query my cursor is on execute
**So that** I can quickly test individual queries in a multi-query script

**Acceptance Criteria:**
- Queries are detected by parsing on `;` delimiter
- The current query is determined by cursor position
- The current query block is highlighted with a subtle background color
- Pressing Run (or Ctrl/Cmd+Enter) executes only the current query
- Results display in the existing results panel

### US-2: Execute All Queries
**As a** database developer
**I want to** execute all queries in the editor at once
**So that** I can run multi-statement scripts efficiently

**Acceptance Criteria:**
- A new "Run All" button appears next to the existing Run button
- Clicking "Run All" executes all queries in order
- Each query's results appear in separate tabs within the results panel
- Errors in one query do not prevent subsequent queries from running (configurable)
- Clear indication of which result tab corresponds to which query

### US-3: Visual Query Indicator
**As a** database developer
**I want to** see which query my cursor is currently in
**So that** I know exactly what will execute when I click Run

**Acceptance Criteria:**
- The current query block has a subtle highlighted background
- Highlighting updates as the cursor moves between queries
- Highlighting is non-intrusive and doesn't interfere with syntax highlighting

## Technical Requirements

### TR-1: SQL Query Parsing
- Parse editor content by semicolon (`;`) delimiter
- Handle edge cases:
  - Semicolons inside string literals (`'hello; world'`)
  - Semicolons in comments (`-- comment; here`)
  - Empty statements (consecutive semicolons `;;`)
  - Trailing whitespace/newlines
- Return array of query objects with `{text, startLine, startColumn, endLine, endColumn}`

### TR-2: Cursor Position Detection
- Determine which query block contains the current cursor position
- Use Monaco's `editor.getPosition()` API
- Map cursor line/column to query range

### TR-3: Monaco Decoration for Highlighting
- Use Monaco `deltaDecorations` API for current query highlighting
- Apply subtle background color (theme-aware)
- Update decorations on cursor position change

### TR-4: Multi-Result Tabs
- Extend results panel to support tabbed view when multiple results exist
- Tab label format: `Query 1`, `Query 2`, etc. (or first 30 chars of query)
- Each tab contains: Results grid, Metadata tab, Statistics tab
- Error state per query tab

### TR-5: UI Updates
- Add "Run All" button (double-play icon) next to existing Run button
- Keyboard shortcut for Run All: `Ctrl/Cmd+Shift+Enter`
- Update existing Run button behavior to execute current query only (not entire content)

## Data Model Changes

### Tab Interface Extension
```typescript
interface Tab {
  // ... existing fields
  results?: QueryResult[];  // Array for multi-query results (was: result?: QueryResult)
  currentQueryIndex?: number;  // Which query is active for display
}
```

### New Type: ParsedQuery
```typescript
interface ParsedQuery {
  text: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

## UI/UX Design

### Editor Toolbar
```
[▶ Run] [▶▶ Run All] [💾 Save] [Tab Title Input]
```

### Results Panel (Multi-Query Mode)
```
┌─────────────────────────────────────────────────────┐
│ [Query 1 ✓] [Query 2 ✓] [Query 3 ✗]                │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐│
│ │ [Results] [Metadata] [Statistics]                ││
│ ├──────────────────────────────────────────────────┤│
│ │                                                   ││
│ │   Query results displayed here                   ││
│ │                                                   ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Query Highlighting
- Background: Subtle blue tint (`rgba(66, 153, 225, 0.1)` for light theme)
- Must work with both light and dark themes

## Implementation Phases

### Phase 1: Query Parser (Foundation)
- Create `parseQueries()` utility function
- Handle edge cases (strings, comments)
- Unit tests for parser

### Phase 2: Cursor Detection & Highlighting
- Integrate parser with Monaco editor
- Implement cursor position to query mapping
- Add Monaco decorations for highlighting
- Update on cursor move

### Phase 3: Single Query Execution
- Modify `getCurrentQuery()` to use parser
- Execute only the query at cursor position
- Update existing keyboard shortcut behavior

### Phase 4: Multi-Query Execution
- Add "Run All" button
- Implement sequential execution of all queries
- Collect all results into array

### Phase 5: Tabbed Results Display
- Create `MultiResultTabs` component
- Integrate with `SqlTab` results panel
- Handle mixed success/error states

### Phase 6: Polish & Testing
- Theme-aware highlighting colors
- Error handling edge cases
- Integration tests

## Out of Scope

- Per-query undo/redo history (single editor history maintained)
- Query-to-query result dependencies (e.g., using result of Query 1 in Query 2)
- Parallel query execution (queries run sequentially)
- Custom semicolon delimiter configuration

## Success Metrics

- Zero regressions in existing query execution
- Parser correctly handles 100% of test cases
- Highlight updates within 50ms of cursor movement
- Multi-query results display correctly for up to 20 queries

## Dependencies

- Monaco Editor API (deltaDecorations, getPosition)
- Existing Zustand store (tabs, runQuery)
- Existing results components (AgGrid integration)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Semicolons in string literals cause incorrect parsing | Use proper SQL tokenizer or regex with lookahead |
| Performance with very large queries | Debounce cursor position updates, lazy parse |
| Breaking changes to existing behavior | Comprehensive test coverage before changes |
