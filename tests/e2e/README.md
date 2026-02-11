# End-to-End Tests for SQL Editor Enhancements

This directory contains Playwright-based E2E tests for the SQL editor enhancements, covering three main user workflows:

## Test Coverage

### Workflow 1: Execute Query and Verify Statistics
- Execute SQL queries and verify statistics display in pagination bar
- Validate elapsed time, rows read, and bytes read metrics
- Test statistics persistence across query refreshes
- Verify statistics display for empty result sets

### Workflow 2: Toggle Layout and Verify Persistence
- Toggle between vertical and horizontal layout orientations
- Verify layout preference persists across page reloads
- Test layout preference persists across different SQL tabs
- Validate default layout behavior on first visit

### Workflow 3: Test Connection, Verify Feedback, Then Save
- Create new database connections
- Test connection before saving
- Verify success/error feedback messages
- Validate form validation rules
- Test loading states during connection testing

## Additional Test Coverage

### Error Scenarios
- Malformed SQL queries
- Invalid connection parameters
- Network timeouts
- Empty states

### Accessibility (WCAG AA)
- Form label accessibility
- Keyboard navigation support
- ARIA roles and attributes
- Focus management

### Responsive Design
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (default)

### Performance Validation
- Query result render times (<10s)
- Layout toggle speed (<1s)

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── sql-editor-enhancements.spec.ts  # Main E2E test suite
└── README.md                         # This file
```

## Configuration

Playwright configuration is located at `/playwright.config.ts` and includes:
- Multiple browser support (Chromium, Firefox, WebKit)
- Mobile device testing
- Screenshot and video capture on failure
- HTML, JUnit XML, and JSON reporters
- Automatic dev server startup

## CI/CD Integration

Tests are configured to run in CI/CD pipelines with:
- Retry logic (2 retries in CI)
- Sequential execution in CI
- Artifact uploads (screenshots, videos, traces)
- HTML report generation

## Best Practices

1. **Use helper functions** for common actions (e.g., `navigateToSqlEditor`, `executeQuery`)
2. **Wait for network idle** before asserting on dynamic content
3. **Take screenshots** at key verification points
4. **Use flexible selectors** that work across themes and screen sizes
5. **Test both success and error paths**
6. **Validate accessibility** in all user workflows

## Troubleshooting

### Tests fail to start dev server
Ensure the development server can start on port 5173. Check if another process is using the port.

### Connection tests fail
Ensure a ClickHouse instance is running on `localhost:8123` with default credentials.

### Timeout errors
Increase timeout values in `playwright.config.ts` if tests consistently timeout due to slow network or system.

### Element not found errors
Check that the selector is correct and the element is visible. Use `--debug` mode to step through test execution.

## Adding New Tests

When adding new E2E tests:
1. Add test to appropriate `describe` block in `sql-editor-enhancements.spec.ts`
2. Use descriptive test names that explain the user action
3. Follow AAA pattern: Arrange, Act, Assert
4. Add screenshots at key verification points
5. Clean up test data if creating persistent state

## Data Test IDs

For stable test selectors, consider adding `data-testid` attributes to components:

```tsx
// Example: Adding data-testid to a button
<Button data-testid="run-query-button">Run Query</Button>

// Using in test
await page.locator('[data-testid="run-query-button"]').click();
```

Recommended data-testid additions:
- `data-testid="sql-editor"` - SQL editor container
- `data-testid="results-tab"` - Results tab panel
- `data-testid="statistics-container"` - Statistics display
- `data-testid="orientation-toggle"` - Layout orientation toggle
- `data-testid="connection-form"` - Connection form
- `data-testid="test-connection-button"` - Test connection button
- `data-testid="save-connection-button"` - Save connection button
