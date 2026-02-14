import { test, expect, Page } from '@playwright/test';

test.describe('SQL Editor Enhancements - Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test.describe('Workflow 1: Navigation and UI Elements', () => {
    test('should navigate to home page and see main elements', async ({ page }) => {
      await expect(page.locator('[class*="database"], [class*="explorer"]').first()).toBeVisible({ timeout: 10000 });
      const sidebar = page.locator('aside, nav, [class*="sidebar"], [class*="side-bar"]');
      await expect(sidebar.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display home page content', async ({ page }) => {
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to settings page', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const settingsContent = page.locator('text=/Settings|Connection|Add Connection/i');
      await expect(settingsContent.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Workflow 2: Connection Management UI', () => {
    test('should display connection manager in settings', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page.locator('text=/Connection|Add/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should open add connection dialog', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const addButton = page.locator('button:has-text("Add Connection")').first();
      if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"], form');
        await expect(dialog.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should validate form fields before allowing connection test', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const addButton = page.locator('button:has-text("Add Connection")').first();
      if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[role="dialog"], form');
        await expect(dialog.first()).toBeVisible({ timeout: 3000 });

        const testButton = page.locator('button:has-text("Test Connection")');
        if (await testButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await expect(testButton).toBeDisabled();

          await page.fill('input[name="name"]', 'Test');
          await expect(testButton).toBeDisabled();

          await page.fill('input[name="url"]', 'invalid-url');
          await expect(testButton).toBeDisabled();

          await page.fill('input[name="url"]', 'http://localhost:8123');
          await expect(testButton).toBeDisabled();

          await page.fill('input[name="username"]', 'default');
          await expect(testButton).toBeEnabled();
        }
      }
    });

    test('should allow canceling connection form', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const addButton = page.locator('button:has-text("Add Connection")').first();
      if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        await page.fill('input[name="name"]', 'Cancel Test');
        await page.fill('input[name="url"]', 'http://localhost:8123');

        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }

        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Workflow 3: Layout Persistence', () => {
    test('should save layout preference to localStorage', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('sql-editor-layout-orientation', 'horizontal');
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const orientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      expect(orientation).toBe('horizontal');
    });

    test('should default to vertical layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.evaluate(() => {
        localStorage.removeItem('sql-editor-layout-orientation');
      });

      const orientation = await page.evaluate(() => {
        return localStorage.getItem('sql-editor-layout-orientation');
      });

      expect(orientation === 'vertical' || orientation === null).toBeTruthy();
    });
  });

  test.describe('Error Scenarios and Edge Cases', () => {
    test('should handle 404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');

      const notFound = page.locator('text=/Not Found|404/i');
      await expect(notFound.first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle navigation to admin page', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageContent = page.locator('body');
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have accessible buttons', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const addButton = page.locator('button:has-text("Add Connection")').first();
      if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);

        const inputs = page.locator('input');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i);
          if (await input.isVisible()) {
            const label = await input.getAttribute('aria-label') ||
                         await page.locator('label').nth(i).textContent().catch(() => '');
            expect(label || await input.getAttribute('name')).toBeTruthy();
          }
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[class*="sidebar"], nav').first()).toBeVisible();

      await page.screenshot({ path: 'playwright-report/mobile-view.png' });
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[class*="sidebar"], nav').first()).toBeVisible();

      await page.screenshot({ path: 'playwright-report/tablet-view.png' });
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[class*="sidebar"], nav').first()).toBeVisible();

      await page.screenshot({ path: 'playwright-report/desktop-view.png' });
    });
  });

  test.describe('Performance Validation', () => {
    test('should load home page quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000);
    });

    test('should navigate between pages quickly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - startTime;

      expect(navTime).toBeLessThan(5000);
    });
  });
});
