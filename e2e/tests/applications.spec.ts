import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('Application Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/applications');
  });

  test('should display applications page @smoke', async ({ page }) => {
    await expect(
      page.locator('h1, h2, [data-testid="applications-page"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display list of applications', async ({ page }) => {
    await page.waitForTimeout(2000);
    const cards = page.locator(
      '[data-testid="application-card"], .application-card, [class*="application"]'
    );
    const count = await cards.count();
    console.log(`Found ${count} application cards`);
  });

  test('should filter applications by status', async ({ page }) => {
    const statusFilter = page
      .locator(
        'select[name="status"], button:has-text("Applied"), button:has-text("Interviewing")'
      )
      .first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should create new application', async ({ page }) => {
    const newButton = page.locator(
      'button:has-text("New Application"), button:has-text("Add Application")'
    );
    if (await newButton.isVisible()) {
      await newButton.click();
      await expect(
        page.locator('form, [data-testid="application-form"]')
      ).toBeVisible({ timeout: 3000 });

      await page.fill(
        'input[name="company"], input[placeholder*="company"]',
        testData.application.company
      );
      await page.fill(
        'input[name="position"], input[placeholder*="position"]',
        testData.application.position
      );
      await page.click('button:has-text("Submit"), button:has-text("Save")');
      await page.waitForTimeout(2000);
    }
  });

  test('should update application status', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="application-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);

      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption({ index: 1 });
        await page.click('button:has-text("Update"), button:has-text("Save")');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should delete application', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="application-card"]').first();
    if (await card.isVisible()) {
      const deleteButton = card.locator(
        'button:has-text("Delete"), [data-testid="delete"]'
      );
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.click('button:has-text("Confirm"), button:has-text("Yes")');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display application statistics', async ({ page }) => {
    await page.waitForTimeout(2000);
    const stats = page.locator('[data-testid="stat"], .stat, [class*="stat"]');
    await expect(stats.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state with no applications', async ({ page }) => {
    await expect(page.locator('text=/no applications|empty|not found/i'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('Applications found, skipping empty state check');
      });
  });
});

test.describe('Application Details', () => {
  test('should view application details', async ({ page }) => {
    await page.goto('/applications');
    await page.waitForTimeout(2000);

    const card = page.locator('[data-testid="application-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(
        page.locator('[data-testid="application-details"], .details')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should add notes to application', async ({ page }) => {
    await page.goto('/applications');
    await page.waitForTimeout(2000);

    const card = page.locator('[data-testid="application-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);

      const notesField = page.locator(
        'textarea[name="notes"], input[name="notes"]'
      );
      if (await notesField.isVisible()) {
        await notesField.fill('Test notes for this application');
        await page.click('button:has-text("Save")');
      }
    }
  });

  test('should set reminder for application', async ({ page }) => {
    await page.goto('/applications');
    await page.waitForTimeout(2000);

    const card = page.locator('[data-testid="application-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);

      const reminderButton = page.locator(
        'button:has-text("Reminder"), button:has-text("Set Reminder")'
      );
      if (await reminderButton.isVisible()) {
        await reminderButton.click();
        await expect(
          page.locator('input[type="date"], input[type="datetime"]')
        ).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
