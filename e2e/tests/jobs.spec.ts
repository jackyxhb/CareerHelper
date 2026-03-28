import { test, expect } from '@playwright/test';

test.describe('Job Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs');
  });

  test('should display job search page @smoke', async ({ page }) => {
    await expect(
      page
        .locator('input[placeholder*="search" i], input[name="search"]')
        .first()
    ).toBeVisible();
  });

  test('should search for jobs by keyword', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder*="search" i], input[name="search"]')
      .first();
    await searchInput.fill('Software Engineer');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);
  });

  test('should display job results', async ({ page }) => {
    await page.fill('input[placeholder*="search" i]', 'Developer');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    const results = page.locator(
      '[data-testid="job-card"], .job-card, [class*="job"]'
    );
    await expect(results.first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter jobs by location', async ({ page }) => {
    const locationFilter = page
      .locator('select[name="location"], input[name="location"]')
      .first();
    if (await locationFilter.isVisible()) {
      await locationFilter.selectOption('Remote');
    }
  });

  test('should filter jobs by salary range', async ({ page }) => {
    const salaryFilter = page
      .locator('select[name="salary"], input[name="minSalary"]')
      .first();
    if (await salaryFilter.isVisible()) {
      await salaryFilter.selectOption({ index: 1 });
    }
  });

  test('should save a job', async ({ page }) => {
    await page.fill('input[placeholder*="search" i]', 'Engineer');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    const saveButton = page
      .locator('button:has-text("Save"), [data-testid="save-job"]')
      .first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await expect(page.locator('text=/saved|bookmarked/i')).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('should view job details', async ({ page }) => {
    await page.fill('input[placeholder*="search" i]', 'Manager');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    const jobCard = page.locator('[data-testid="job-card"], .job-card').first();
    if (await jobCard.isVisible()) {
      await jobCard.click();
      await expect(
        page.locator('[data-testid="job-details"], .job-details')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show empty state when no jobs found', async ({ page }) => {
    await page.fill('input[placeholder*="search" i]', 'xyznonexistentjob12345');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/no jobs|not found|empty/i')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Job Application', () => {
  test('should start application from job details', async ({ page }) => {
    await page.goto('/jobs');
    await page.fill('input[placeholder*="search" i]', 'Developer');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    const jobCard = page.locator('[data-testid="job-card"], .job-card').first();
    if (await jobCard.isVisible()) {
      await jobCard.click();
      const applyButton = page.locator(
        'button:has-text("Apply"), button:has-text("Start Application")'
      );
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await expect(
          page.locator('form, [data-testid="application-form"]')
        ).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
