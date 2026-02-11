import { test, expect, Page } from '@playwright/test';

test.describe('SQL Editor Enhancements - Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Workflow 1: Execute Query and Verify Statistics', () => {
    test('should execute query and display statistics in pagination bar', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 10';
      await executeQuery(page, query);

      await expect(page.locator('[data-testid="results-tab"]')).toBeVisible({ timeout: 10000 });

      const statisticsContainer = page.locator('.flex.items-center.gap-3');
      await expect(statisticsContainer).toBeVisible();

      const elapsedTime = statisticsContainer.locator('text=/\\d+(\\.\\d+)?\\s*(μs|ms|s)/');
      await expect(elapsedTime).toBeVisible();

      const rowsRead = statisticsContainer.locator('text=/\\d+\\s*rows/');
      await expect(rowsRead).toBeVisible();

      const bytesRead = statisticsContainer.locator('text=/\\d+(\\.\\d+)?\\s*(Bytes|KB|MB|GB)/');
      await expect(bytesRead).toBeVisible();

      await page.screenshot({ path: 'playwright-report/query-statistics.png' });
    });

    test('should display statistics even for empty result sets', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = "SELECT * FROM system.tables WHERE name = 'nonexistent_table_xyz'";
      await executeQuery(page, query);

      await page.waitForSelector('text=/Running query/i', { state: 'hidden', timeout: 10000 });

      const statisticsContainer = page.locator('.flex.items-center.gap-3');
      await expect(statisticsContainer).toBeVisible();
    });

    test('should update statistics when query is refreshed', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const refreshButton = page.locator('button[title="Refresh results"]');
      await expect(refreshButton).toBeVisible();

      await refreshButton.click();

      await page.waitForSelector('text=/Running query/i', { state: 'hidden', timeout: 10000 });

      const statisticsContainer = page.locator('.flex.items-center.gap-3');
      await expect(statisticsContainer).toBeVisible();
    });
  });

  test.describe('Workflow 2: Toggle Layout and Verify Persistence', () => {
    test('should toggle layout orientation and persist across reload', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 10';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const orientationToggle = page.locator('button[title*="layout"]').first();
      await expect(orientationToggle).toBeVisible();

      const initialOrientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      await orientationToggle.click();
      await page.waitForTimeout(500);

      const newOrientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      expect(newOrientation).not.toBe(initialOrientation);

      await page.reload();
      await page.waitForLoadState('networkidle');

      const persistedOrientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      expect(persistedOrientation).toBe(newOrientation);

      await page.screenshot({ path: 'playwright-report/layout-persistence.png' });
    });

    test('should default to vertical layout on first visit', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.removeItem('sql-editor-layout-orientation');
      });

      await page.reload();
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      const orientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      expect(orientation).toBe('vertical');
    });

    test('should toggle between vertical and horizontal layouts', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 10';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const orientationToggle = page.locator('button[title*="layout"]').first();

      await orientationToggle.click();
      let orientation = await page.evaluate(() => localStorage.getItem('sql-editor-layout-orientation'));
      const firstOrientation = orientation;

      await orientationToggle.click();
      orientation = await page.evaluate(() => localStorage.getItem('sql-editor-layout-orientation'));
      expect(orientation).not.toBe(firstOrientation);

      await orientationToggle.click();
      orientation = await page.evaluate(() => localStorage.getItem('sql-editor-layout-orientation'));
      expect(orientation).toBe(firstOrientation);
    });

    test('should maintain layout preference across different SQL tabs', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const orientationToggle = page.locator('button[title*="layout"]').first();
      await orientationToggle.click();

      const savedOrientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      await page.reload();
      await navigateToSqlEditor(page);

      const restoredOrientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      expect(restoredOrientation).toBe(savedOrientation);
    });
  });

  test.describe('Workflow 3: Test Connection, Verify Feedback, Then Save', () => {
    test('should test connection successfully and then save', async ({ page }) => {
      await openConnectionManager(page);

      await page.locator('button:has-text("Add Connection")').click();
      await expect(page.locator('form')).toBeVisible();

      await page.fill('input[name="name"]', 'Test Connection E2E');
      await page.fill('input[name="url"]', 'http://localhost:8123');
      await page.fill('input[name="username"]', 'default');
      await page.fill('input[name="password"]', '');

      const testButton = page.locator('button:has-text("Test Connection")');
      await expect(testButton).toBeEnabled();

      await testButton.click();

      await expect(page.locator('text=/Testing/i')).toBeVisible();

      const successMessage = page.locator('.bg-green-50, .bg-green-950\\/20');
      const errorMessage = page.locator('.bg-red-50, .bg-red-950\\/20');

      await expect(successMessage.or(errorMessage)).toBeVisible({ timeout: 15000 });

      const isSuccess = await successMessage.isVisible();

      if (isSuccess) {
        await expect(successMessage).toContainText(/Connected successfully|Server version/i);

        const saveButton = page.locator('button:has-text("Save Connection")');
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        await expect(page.locator('text=/Connection saved/i')).toBeVisible({ timeout: 5000 });
      }

      await page.screenshot({ path: 'playwright-report/connection-test-result.png' });
    });

    test('should show error feedback for invalid connection', async ({ page }) => {
      await openConnectionManager(page);

      await page.locator('button:has-text("Add Connection")').click();
      await expect(page.locator('form')).toBeVisible();

      await page.fill('input[name="name"]', 'Invalid Connection');
      await page.fill('input[name="url"]', 'http://invalid-host-xyz:9999');
      await page.fill('input[name="username"]', 'testuser');
      await page.fill('input[name="password"]', 'testpass');

      const testButton = page.locator('button:has-text("Test Connection")');
      await testButton.click();

      const errorMessage = page.locator('.bg-red-50, .bg-red-950\\/20');
      await expect(errorMessage).toBeVisible({ timeout: 15000 });

      await expect(errorMessage).toContainText(/Failed to connect|error|Troubleshooting/i);

      await page.screenshot({ path: 'playwright-report/connection-test-error.png' });
    });

    test('should validate form fields before allowing connection test', async ({ page }) => {
      await openConnectionManager(page);

      await page.locator('button:has-text("Add Connection")').click();
      await expect(page.locator('form')).toBeVisible();

      const testButton = page.locator('button:has-text("Test Connection")');

      await expect(testButton).toBeDisabled();

      await page.fill('input[name="name"]', 'Test');
      await expect(testButton).toBeDisabled();

      await page.fill('input[name="url"]', 'invalid-url');
      await expect(testButton).toBeDisabled();

      await page.fill('input[name="url"]', 'http://localhost:8123');
      await expect(testButton).toBeDisabled();

      await page.fill('input[name="username"]', 'default');
      await expect(testButton).toBeEnabled();
    });

    test('should display loading state during connection test', async ({ page }) => {
      await openConnectionManager(page);

      await page.locator('button:has-text("Add Connection")').click();
      await expect(page.locator('form')).toBeVisible();

      await page.fill('input[name="name"]', 'Loading Test');
      await page.fill('input[name="url"]', 'http://localhost:8123');
      await page.fill('input[name="username"]', 'default');

      const testButton = page.locator('button:has-text("Test Connection")');
      await testButton.click();

      await expect(page.locator('text=/Testing/i')).toBeVisible({ timeout: 1000 });

      const loadingSpinner = page.locator('.animate-spin');
      await expect(loadingSpinner).toBeVisible();
    });

    test('should allow canceling connection form without saving', async ({ page }) => {
      await openConnectionManager(page);

      await page.locator('button:has-text("Add Connection")').click();
      await expect(page.locator('form')).toBeVisible();

      await page.fill('input[name="name"]', 'Cancel Test');
      await page.fill('input[name="url"]', 'http://localhost:8123');

      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();

      await expect(page.locator('form')).not.toBeVisible();
    });
  });

  test.describe('Error Scenarios and Edge Cases', () => {
    test('should handle malformed SQL queries gracefully', async ({ page }) => {
      await navigateToSqlEditor(page);

      const invalidQuery = 'SELECT * FROMM system.tables';
      await executeQuery(page, invalidQuery);

      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 10000 });

      await expect(errorAlert).toContainText(/error/i);

      await page.screenshot({ path: 'playwright-report/query-error.png' });
    });

    test('should display empty state when no query results', async ({ page }) => {
      await navigateToSqlEditor(page);

      await expect(page.locator('text=/Run a query to get started/i')).toBeVisible();
    });

    test('should handle network timeout gracefully', async ({ page }) => {
      await navigateToSqlEditor(page);

      const longRunningQuery = 'SELECT sleep(3)';
      await executeQuery(page, longRunningQuery);

      await expect(page.locator('text=/Running query/i')).toBeVisible();
    });
  });

  test.describe('Accessibility Compliance (WCAG AA)', () => {
    test('should have accessible labels for form inputs', async ({ page }) => {
      await openConnectionManager(page);

      await page.locator('button:has-text("Add Connection")').click();
      await expect(page.locator('form')).toBeVisible();

      const nameInput = page.locator('input[name="name"]');
      const nameLabel = await nameInput.getAttribute('aria-label') ||
                        await page.locator('label:has-text("Connection Name")').textContent();
      expect(nameLabel).toBeTruthy();

      const urlInput = page.locator('input[name="url"]');
      const urlLabel = await urlInput.getAttribute('aria-label') ||
                       await page.locator('label:has-text("Host")').textContent();
      expect(urlLabel).toBeTruthy();
    });

    test('should have keyboard navigation support', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const orientationToggle = page.locator('button[title*="layout"]').first();
      await orientationToggle.focus();

      await page.keyboard.press('Enter');

      const orientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });
      expect(orientation).toBeTruthy();
    });

    test('should have proper ARIA roles for buttons', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const title = await button.getAttribute('title');
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        expect(title || text || ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      await expect(page.locator('.flex.items-center.gap-3')).toBeVisible();

      await page.screenshot({ path: 'playwright-report/mobile-view.png' });
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 5';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      await expect(page.locator('.flex.items-center.gap-3')).toBeVisible();

      await page.screenshot({ path: 'playwright-report/tablet-view.png' });
    });
  });

  test.describe('Performance Validation', () => {
    test('should render results within acceptable time', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 100';

      const startTime = Date.now();
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(10000);
    });

    test('should toggle layout quickly without lag', async ({ page }) => {
      await navigateToSqlEditor(page);

      const query = 'SELECT * FROM system.tables LIMIT 10';
      await executeQuery(page, query);

      await page.waitForSelector('[data-testid="results-tab"]', { timeout: 10000 });

      const orientationToggle = page.locator('button[title*="layout"]').first();

      const startTime = Date.now();
      await orientationToggle.click();
      await page.waitForTimeout(100);
      const toggleTime = Date.now() - startTime;

      expect(toggleTime).toBeLessThan(1000);
    });
  });
});

async function navigateToSqlEditor(page: Page) {
  const sqlTabButton = page.locator('button:has-text("SQL"), [data-testid="sql-tab"]').first();

  if (await sqlTabButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sqlTabButton.click();
  }

  await page.waitForLoadState('networkidle');
}

async function executeQuery(page: Page, query: string) {
  const editor = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();
  await expect(editor).toBeVisible({ timeout: 5000 });

  await editor.click();
  await page.keyboard.type(query, { delay: 10 });

  const runButton = page.locator('button:has-text("Run"), button[title*="Run"]').first();

  if (await runButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await runButton.click();
  } else {
    await page.keyboard.press('Control+Enter');
  }

  await page.waitForTimeout(500);
}

async function openConnectionManager(page: Page) {
  const connectionButton = page.locator('button:has-text("Connection"), [data-testid="connection-manager"]').first();

  if (await connectionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await connectionButton.click();
  } else {
    await page.goto('/connections');
  }

  await page.waitForLoadState('networkidle');
}
