---
prd:
  version: v1
  feature_name: sql-editor-enhancements
  status: approved
git:
  branch: custom
  branch_type: feature
  created_at_commit: ab822f43db692dfd5d8b966d3461ec90f8ff381e
  updated_at_commit: ab822f43db692dfd5d8b966d3461ec90f8ff381e
worktree:
  is_worktree: false
  name: main
  path: ""
  repo_root: /home/liangshih.lin/GitHub/ch-ui
metadata:
  created_at: 2026-02-11T00:00:00Z
  updated_at: 2026-02-11T07:41:08Z
  created_by: Liang-Shih Lin <liangshih.lin@viciholdings.com>
  filename: prd-sql-editor-enhancements-v1.md
beads:
  related_issues: [ch-ui-9ja.1, ch-ui-9ja.2, ch-ui-9ja.3, ch-ui-9ja.4, ch-ui-ctu.1, ch-ui-ctu.2, ch-ui-ctu.3, ch-ui-0wn.1, ch-ui-0wn.2, ch-ui-0wn.3, ch-ui-vrf.1, ch-ui-vrf.2, ch-ui-vrf.3, ch-ui-vrf.4, ch-ui-vrf.5]
  related_epics: [ch-ui-9ja, ch-ui-ctu, ch-ui-0wn, ch-ui-vrf]
code_references:
  - path: "src/features/workspace/components/SqlTab.tsx"
    lines: "615-732"
    reason: "Results tab structure with existing toolbar buttons"
  - path: "src/features/workspace/components/SqlTab.tsx"
    lines: "767-797"
    reason: "Current vertical layout with ResizablePanelGroup"
  - path: "src/lib/agGrid.tsx"
    lines: "95-106"
    reason: "AG Grid pagination configuration"
  - path: "src/features/connections/components/ConnectionForm.tsx"
    lines: "1-421"
    reason: "Connection form structure with react-hook-form"
  - path: "src/store/index.ts"
    lines: "316-362"
    reason: "checkServerStatus() function for connection testing"
  - path: "src/types/common.ts"
    lines: "70-81"
    reason: "QueryResult interface with statistics structure"
priorities:
  enabled: true
  default: P2
  inference_method: ai_inference_with_review
  requirements:
    - id: FR-1
      text: "Display query statistics (elapsed time, rows read, bytes read) in pagination bar"
      priority: P1
      confidence: high
      inferred_from: "User requested all three statistics to be displayed"
      user_confirmed: true
    - id: FR-2
      text: "Ensure pagination bar is always visible in Results tab"
      priority: P1
      confidence: high
      inferred_from: "Core requirement for visibility"
      user_confirmed: true
    - id: FR-3
      text: "Add horizontal/vertical layout toggle in SQL Tab toolbar"
      priority: P1
      confidence: high
      inferred_from: "Primary feature request"
      user_confirmed: true
    - id: FR-4
      text: "Toggle button placement near refresh/transpose buttons"
      priority: P2
      confidence: high
      inferred_from: "User preference for toolbar placement"
      user_confirmed: true
    - id: FR-5
      text: "Persist layout preference in localStorage"
      priority: P2
      confidence: high
      inferred_from: "User requested persistence across sessions"
      user_confirmed: true
    - id: FR-6
      text: "Add connection test button in ConnectionForm"
      priority: P1
      confidence: high
      inferred_from: "Primary feature request"
      user_confirmed: true
    - id: FR-7
      text: "Display error message below test button on failure"
      priority: P2
      confidence: high
      inferred_from: "User preference for inline error display"
      user_confirmed: true
    - id: FR-8
      text: "Show loading state during connection test"
      priority: P2
      confidence: medium
      inferred_from: "Standard UX pattern for async operations"
      user_confirmed: true
---

# PRD: SQL Editor Enhancements

## 1. Introduction/Overview

This PRD outlines three enhancements to the SQL editor interface in the ClickHouse UI application:

1. **Query Statistics in Pagination Bar**: Display query performance metrics (elapsed time, rows read, bytes read) alongside pagination controls, ensuring the pagination bar is always visible in the Results tab.

2. **Horizontal/Vertical Layout Toggle**: Add a toggle button in the SQL Tab toolbar to switch between horizontal and vertical layouts for the editor and results panels, with localStorage persistence.

3. **Connection Test Button**: Add a "Test Connection" button in the connection form that validates credentials without saving the connection, with inline error feedback.

These features aim to improve user experience by providing better visibility of query performance metrics, flexible workspace layouts, and faster connection troubleshooting.

## 2. Goals

- **G1**: Provide immediate visibility of query performance metrics without requiring users to switch to the Statistics tab
- **G2**: Enable users to customize their workspace layout based on screen size and personal preference
- **G3**: Reduce friction in connection setup by allowing users to test credentials before saving
- **G4**: Maintain consistency with existing UI patterns and design language
- **G5**: Ensure all enhancements work seamlessly with existing functionality (AG Grid, ResizablePanelGroup, react-hook-form)

## 3. User Stories

**US-1**: As a data analyst, I want to see query performance metrics in the pagination bar so that I can quickly assess query efficiency without switching tabs.

**US-2**: As a developer with a wide monitor, I want to switch to a horizontal layout so that I can view my SQL query and results side-by-side without scrolling.

**US-3**: As a DBA setting up a new connection, I want to test the connection before saving so that I can verify credentials without creating invalid connection entries.

**US-4**: As a user on a laptop, I want to switch to a vertical layout so that I can maximize vertical space for viewing query results.

**US-5**: As a power user, I want my layout preference to persist across sessions so that I don't have to reconfigure my workspace every time I reload the page.

## 4. Functional Requirements

| ID    | Requirement                                                                 | Priority | Notes                          |
| ----- | --------------------------------------------------------------------------- | -------- | ------------------------------ |
| FR-1  | Display query statistics (elapsed, rows read, bytes read) in pagination bar | P1       | Core feature                   |
| FR-2  | Ensure pagination bar is always visible in Results tab                      | P1       | Visibility requirement         |
| FR-3  | Add horizontal/vertical layout toggle in SQL Tab toolbar                    | P1       | Core feature                   |
| FR-4  | Toggle button placement near refresh/transpose buttons                      | P2       | UX consistency                 |
| FR-5  | Persist layout preference in localStorage                                   | P2       | User preference persistence    |
| FR-6  | Add connection test button in ConnectionForm                                | P1       | Core feature                   |
| FR-7  | Display error message below test button on failure                          | P2       | Error feedback                 |
| FR-8  | Show loading state during connection test                                   | P2       | UX feedback                    |
| FR-9  | Format statistics with human-readable units (e.g., "2.3s", "1.2K rows")     | P2       | Data presentation              |
| FR-10 | In horizontal layout, editor is on the left, results on the right           | P2       | Layout specification           |
| FR-11 | Connection test uses same validation logic as actual connection             | P1       | Consistency                    |
| FR-12 | Pagination controls remain functional with statistics display               | P1       | Maintain existing functionality |

## 5. Non-Goals (Out of Scope)

- **NG-1**: Advanced statistics visualization (charts, graphs) - Statistics tab already exists for this
- **NG-2**: Custom layout configurations beyond horizontal/vertical
- **NG-3**: Connection test with query execution - Only credential validation
- **NG-4**: Saving multiple layout presets
- **NG-5**: Pagination bar customization (color, size, position)
- **NG-6**: Connection test history or logging
- **NG-7**: Animated transitions between layout orientations

## 6. Assumptions

- **A-1**: AG Grid is already configured with pagination enabled (`paginationPageSize: 100`)
- **A-2**: Query statistics are available in `tab?.result?.statistics` structure
- **A-3**: ResizablePanelGroup supports both "horizontal" and "vertical" orientations
- **A-4**: `checkServerStatus()` function in the store can be reused for connection testing
- **A-5**: localStorage is available and functional in the user's browser
- **A-6**: Users have sufficient screen real estate for horizontal layout (minimum 1024px width recommended)

## 7. Dependencies

**D-1**: AG Grid Community (ag-grid-react) - Pagination API

**D-2**: react-resizable-panels - ResizablePanelGroup component

**D-3**: Zustand store - Access to `tab?.result?.statistics` and connection state

**D-4**: ClickHouse client (@clickhouse/client-web) - Connection testing via `ping()`

**D-5**: react-hook-form - Form state management in ConnectionForm

**D-6**: localStorage API - Layout preference persistence

**D-7**: Existing UI components (Button, Badge, etc.) from shadcn/ui

## 8. Acceptance Criteria

### Feature 1: Query Statistics in Pagination Bar

**AC-1.1**: When a query is executed and results are displayed, the pagination bar appears below the AG Grid in the Results tab.

**AC-1.2**: The pagination bar displays all three statistics:
- Elapsed time (formatted as seconds with 2 decimal places, e.g., "2.34s")
- Rows read (formatted with K/M/B suffixes, e.g., "1.2K rows")
- Bytes read (formatted with KB/MB/GB suffixes, e.g., "512KB")

**AC-1.3**: The pagination bar shows current page information (e.g., "Page 1 of 10" or "Showing 1-100 of 2,543 rows")

**AC-1.4**: Pagination controls (Previous, Next, Page selector) remain functional

**AC-1.5**: The pagination bar is visible even when the grid has fewer rows than the page size

**AC-1.6**: When no results are available, the pagination bar shows appropriate message (e.g., "No results")

### Feature 2: Horizontal/Vertical Layout Toggle

**AC-2.1**: A toggle button appears in the SQL Tab toolbar, near the refresh and transpose buttons

**AC-2.2**: The toggle button has clear iconography (e.g., horizontal/vertical split icon)

**AC-2.3**: Clicking the toggle switches the layout orientation:
- Vertical: Editor on top, results on bottom (default)
- Horizontal: Editor on left, results on right

**AC-2.4**: The layout change is immediate (no page reload required)

**AC-2.5**: ResizablePanelGroup maintains user-adjusted panel sizes after orientation change

**AC-2.6**: The selected orientation is saved to localStorage

**AC-2.7**: On page reload, the saved orientation is restored

**AC-2.8**: If no preference is saved, vertical layout is used as default

**AC-2.9**: The toggle button reflects the current orientation state (e.g., highlighted/active state)

### Feature 3: Connection Test Button

**AC-3.1**: A "Test Connection" button appears in the ConnectionForm, near the "Save" button

**AC-3.2**: The button is enabled only when all required fields (URL, username, password) are filled

**AC-3.3**: Clicking "Test Connection" triggers an async connection test using the form values

**AC-3.4**: During testing, the button shows a loading spinner and is disabled

**AC-3.5**: On successful test:
- A success message appears below the button (e.g., "✓ Connection successful")
- The message includes server version if available

**AC-3.6**: On failed test:
- An error message appears below the button with the specific error
- The message is styled as an error (red text, error icon)

**AC-3.7**: Testing does NOT save the connection to the store

**AC-3.8**: Testing does NOT switch the active connection

**AC-3.9**: Form validation errors prevent testing (test button respects form validity)

**AC-3.10**: Multiple tests can be performed by clicking the button again

## 9. Design Considerations

### Pagination Bar Design

- **Layout**: Horizontal flex container with space-between alignment
- **Left side**: Statistics display (3 badges or text elements)
- **Right side**: Pagination controls (Previous, Page selector, Next)
- **Styling**: Consistent with existing tab toolbar (same background, padding, border)
- **Typography**: Use same font family and size as existing UI
- **Icons**: Consider adding small icons for each statistic (clock, rows, storage)

### Layout Toggle Button

- **Icon**: Use Lucide React icons (e.g., `Columns2` for horizontal, `Rows2` for vertical)
- **Placement**: Between transpose button and download dialog button
- **Tooltip**: Show "Switch to horizontal/vertical layout" on hover
- **Active state**: Highlight button when in non-default orientation
- **Size**: Match existing toolbar buttons (same height, padding)

### Connection Test Button

- **Label**: "Test Connection" or "Test" (shorter if space is limited)
- **Placement**: Left of the "Save" button, or in a secondary button group
- **Loading state**: Replace text with spinner, or show spinner inline
- **Success message**: Green text with checkmark icon
- **Error message**: Red text with X icon, wrapped to multiple lines if needed
- **Message lifetime**: Persist until next test or form change

## 10. Technical Considerations

### Feature 1: Pagination Bar Implementation

**Component Creation**: Create a new component `ResultsPagination.tsx` in `/src/features/workspace/components/`

**Data Access**:
- Statistics: `tab?.result?.statistics` (elapsed, rows_read, bytes_read)
- Pagination: AG Grid API methods (`gridApi.paginationGetCurrentPage()`, `paginationGetPageSize()`, `paginationGetTotalPages()`)

**Formatting Utilities**: Create helper functions for human-readable formatting:
```typescript
formatElapsedTime(seconds: number): string // "2.34s"
formatRowCount(count: number): string // "1.2K rows"
formatBytes(bytes: number): string // "512KB"
```

**Integration Point**: Insert component in `renderResultsTab()` function (lines 520-539 in SqlTab.tsx)

**Layout Structure**:
```tsx
<div className="flex flex-col h-full">
  <AgGridWrapper {...props} />
  <ResultsPagination statistics={statistics} gridRef={gridRef} />
</div>
```

### Feature 2: Layout Toggle Implementation

**State Management**: Add state to SqlTab component:
```typescript
const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical')
```

**LocalStorage Key**: Use `sql-editor-layout-orientation` for persistence

**Hook for Persistence**:
```typescript
useEffect(() => {
  const saved = localStorage.getItem('sql-editor-layout-orientation')
  if (saved === 'horizontal' || saved === 'vertical') {
    setOrientation(saved)
  }
}, [])

useEffect(() => {
  localStorage.setItem('sql-editor-layout-orientation', orientation)
}, [orientation])
```

**Toggle Handler**:
```typescript
const toggleOrientation = () => {
  setOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical')
}
```

**ResizablePanelGroup Update**: Pass dynamic orientation (line 771 in SqlTab.tsx):
```tsx
<ResizablePanelGroup
  orientation={orientation}
  defaultLayout={defaultLayout}
  onLayoutChanged={onLayoutChanged}
>
```

**Button Placement**: Add in toolbar section (around line 666-712):
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={toggleOrientation}
  title={`Switch to ${orientation === 'vertical' ? 'horizontal' : 'vertical'} layout`}
>
  <Icon name={orientation === 'vertical' ? 'Columns2' : 'Rows2'} />
</Button>
```

### Feature 3: Connection Test Implementation

**Handler Function**: Add async handler in ConnectionForm component:
```typescript
const [testStatus, setTestStatus] = useState<{
  loading: boolean
  success: boolean | null
  message: string
}>({ loading: false, success: null, message: '' })

const handleTestConnection = async () => {
  setTestStatus({ loading: true, success: null, message: '' })

  try {
    const formValues = getValues() // react-hook-form method
    const client = createClient({
      url: formValues.url,
      username: formValues.username,
      password: formValues.password,
      request_timeout: formValues.request_timeout
    })

    await client.ping()
    const version = await client.query({ query: 'SELECT version()' })

    setTestStatus({
      loading: false,
      success: true,
      message: `✓ Connection successful (${version})`
    })
  } catch (error) {
    setTestStatus({
      loading: false,
      success: false,
      message: `✗ Connection failed: ${error.message}`
    })
  }
}
```

**Reuse Existing Logic**: Reference `checkServerStatus()` from store (lines 316-362 in store/index.ts) for ClickHouse client creation pattern

**Button Placement**: Add in button group (around line 393-416):
```tsx
<div className="flex gap-2">
  <Button
    type="button"
    variant="outline"
    onClick={handleTestConnection}
    disabled={testStatus.loading || !isValid}
  >
    {testStatus.loading ? <Spinner /> : 'Test Connection'}
  </Button>
  <Button type="submit">Save Connection</Button>
</div>

{testStatus.message && (
  <p className={testStatus.success ? 'text-green-600' : 'text-red-600'}>
    {testStatus.message}
  </p>
)}
```

**Form Validation**: Use react-hook-form's `formState.isValid` to enable/disable button

### Performance Considerations

- **Pagination Bar**: Memoize statistics formatting to avoid unnecessary recalculations
- **Layout Toggle**: Use CSS transitions for smooth orientation changes (optional, see NG-7)
- **Connection Test**: Debounce test button to prevent rapid successive tests
- **State Updates**: Minimize re-renders by using React.memo for ResultsPagination component

### Accessibility

- **Pagination Bar**: Use semantic HTML (`<nav>` for pagination controls)
- **Layout Toggle**: Add ARIA label describing current and target orientation
- **Connection Test**: Ensure loading and success/error states are announced to screen readers
- **Keyboard Navigation**: All buttons should be keyboard accessible (focus states, Enter/Space activation)

## 11. Architecture Patterns

### SOLID Principles Applied

✅ **Single Responsibility Principle**:
- `ResultsPagination.tsx`: Only handles pagination display and statistics
- Layout toggle logic: Contained in SqlTab component state management
- Connection test: Isolated handler function in ConnectionForm

✅ **Open/Closed Principle**:
- Pagination component can be extended with additional statistics without modifying SqlTab
- Layout orientation can support additional values (e.g., "auto") without changing ResizablePanelGroup

✅ **Dependency Inversion Principle**:
- Components depend on AG Grid API abstraction, not concrete implementation
- Connection test uses ClickHouse client interface, not direct implementation

### Creational Patterns

✅ **Builder Pattern** (implicit):
- react-hook-form builds form state from schema
- AG Grid options built via `createGridOptions()`

### Structural Patterns

✅ **Adapter Pattern**:
- Pagination component adapts AG Grid API to custom pagination UI
- Statistics formatting adapts raw numbers to human-readable strings

### Recommended Patterns

**Component Composition**:
- ResultsPagination is a composed component (statistics display + pagination controls)
- SqlTab composes editor, results, and layout controls

**Custom Hooks** (optional enhancement):
- `useLocalStorageState(key, defaultValue)`: Reusable hook for layout persistence
- `useConnectionTest()`: Encapsulate test logic for potential reuse

**Memoization**:
- Use `React.memo` for ResultsPagination to prevent unnecessary re-renders
- Use `useMemo` for formatted statistics values

## 12. Risks & Mitigations

| Risk                                                  | Impact | Mitigation                                                              |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| **R-1**: AG Grid pagination API changes in future versions | Medium | Abstract pagination logic behind interface, use TypeScript for compile-time checks |
| **R-2**: Statistics data structure changes            | Medium | Add defensive checks for missing statistics fields, show "N/A" as fallback |
| **R-3**: LocalStorage quota exceeded                  | Low    | Wrap localStorage calls in try-catch, fallback to in-memory state       |
| **R-4**: Connection test timeout on slow networks     | Medium | Implement configurable timeout (use form's request_timeout value)       |
| **R-5**: Horizontal layout breaks on small screens    | Low    | Add media query to force vertical layout below 1024px width            |
| **R-6**: Pagination bar takes too much vertical space | Low    | Use compact design with single row layout, collapsible if needed        |
| **R-7**: Multiple rapid connection tests cause race conditions | Low    | Disable test button during active test, abort previous test if new one starts |

## 13. Success Metrics

**SM-1**: **Feature Adoption**
- Track percentage of users who toggle layout orientation (target: >30% adoption within first month)
- Track number of connection tests performed before save (target: average of 1.5 tests per new connection)

**SM-2**: **User Efficiency**
- Reduce time spent switching to Statistics tab by 60% (based on analytics)
- Reduce failed connection saves by 40% (users catch errors via test before saving)

**SM-3**: **UX Improvement**
- User satisfaction survey: >80% find pagination bar useful for quick performance assessment
- User satisfaction survey: >70% prefer having layout toggle option

**SM-4**: **Technical Performance**
- Pagination bar renders in <50ms after query completion
- Layout toggle completes in <100ms with smooth visual transition
- Connection test completes in <3 seconds for healthy connections

**SM-5**: **Error Reduction**
- Zero console errors related to new features in production
- Zero accessibility violations (WCAG AA compliance)

## 14. Priority/Timeline

**Priority**: P1 (High) - User-facing improvements with clear usability benefits

**Estimated Effort**: 3-5 days
- Feature 1 (Pagination Bar): 1-1.5 days
- Feature 2 (Layout Toggle): 1-1.5 days
- Feature 3 (Connection Test): 1 day
- Testing & QA: 0.5-1 day

**Target Release**: Next minor version (no breaking changes)

**Rollout Strategy**:
1. Implement all three features in feature branch
2. Internal testing and UX review
3. Merge to main after approval
4. Monitor for issues in first week post-release
5. Gather user feedback for potential refinements

## 15. Open Questions

**Q-1**: Should the pagination bar statistics be collapsible to save space?
- **Resolution needed**: UX team to decide if compact mode is necessary

**Q-2**: Should horizontal layout have different default panel sizes than vertical?
- **Recommendation**: Use 50/50 split for horizontal, keep current 40/60 for vertical

**Q-3**: Should connection test also verify query execution permissions?
- **Recommendation**: No, keep test minimal (ping only) - aligns with NG-3

**Q-4**: Should layout preference be per-tab or global?
- **Recommendation**: Global (single localStorage key) for consistency

**Q-5**: What icon should represent the layout toggle?
- **Recommendation**: Use `Columns2` (horizontal) and `Rows2` (vertical) from Lucide React

## 16. Glossary

**AG Grid**: Advanced data grid library used for displaying query results

**ResizablePanelGroup**: Component from react-resizable-panels library for creating resizable layouts

**ClickHouse Client**: Web client for connecting to ClickHouse database server

**Zustand**: Lightweight state management library used in this application

**localStorage**: Browser API for persisting data across sessions

**react-hook-form**: Form state management library with validation support

**Lucide React**: Icon library used for UI icons

**SqlTab**: Main component containing SQL editor and results display

**ConnectionForm**: Form component for creating/editing database connections

## 17. Relevant Code References

| File Path | Lines | Purpose |
|-----------|-------|---------|
| `src/features/workspace/components/SqlTab.tsx` | 615-732 | Results tab structure with existing toolbar buttons - where pagination bar will be added |
| `src/features/workspace/components/SqlTab.tsx` | 767-797 | Current vertical layout with ResizablePanelGroup - where orientation prop will be dynamic |
| `src/lib/agGrid.tsx` | 95-106 | AG Grid pagination configuration - source for pagination settings |
| `src/features/connections/components/ConnectionForm.tsx` | 1-421 | Connection form structure with react-hook-form - where test button will be added |
| `src/store/index.ts` | 316-362 | checkServerStatus() function - pattern for connection testing logic |
| `src/types/common.ts` | 70-81 | QueryResult interface with statistics structure - data type for pagination bar |
| `src/features/workspace/components/StatisticsDisplay.tsx` | N/A | Reference for statistics formatting patterns (if exists) |
| `src/components/common/AgGridWrapper.tsx` | N/A | AG Grid wrapper component - integration point for pagination |

## 18. Changelog

| Version | Date       | Summary of Changes |
| ------- | ---------- | ------------------ |
| 1       | 2026-02-11 | Initial PRD draft  |
