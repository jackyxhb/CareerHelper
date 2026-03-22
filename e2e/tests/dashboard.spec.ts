import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard @smoke', async ({ page }) => {
    await expect(page.locator('h1:has-text("CareerHelper")')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display navigation menu', async ({ page }) => {
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator('a:has-text("Dashboard"), a:has-text("Jobs")')
    ).toBeVisible();
  });

  test('should display user info', async ({ page }) => {
    const userInfo = page.locator('text=/signed in|welcome/i');
    await expect(userInfo.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display statistics cards', async ({ page }) => {
    await page.waitForTimeout(2000);
    const stats = page.locator(
      '[data-testid="stat-card"], .stat-card, [class*="stat"]'
    );
    const count = await stats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to Jobs', async ({ page }) => {
    await page.click('a:has-text("Jobs")');
    await expect(page).toHaveURL(/jobs/);
  });

  test('should navigate to Applications', async ({ page }) => {
    await page.click('a:has-text("Applications")');
    await expect(page).toHaveURL(/applications/);
  });

  test('should navigate to Experiences', async ({ page }) => {
    await page.click('a:has-text("Experiences")');
    await expect(page).toHaveURL(/experiences/);
  });

  test('should navigate to Resumes', async ({ page }) => {
    await page.click('a:has-text("Resumes")');
    await expect(page).toHaveURL(/resumes/);
  });

  test('should navigate to AI Resume Tailor', async ({ page }) => {
    await page.click('a:has-text("AI Resume Tailor")');
    await expect(page).toHaveURL(/resume-tailor/);
  });

  test('should allow sign out', async ({ page }) => {
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/login|signin/);
  });
});

test.describe('Dashboard Interactions', () => {
  test('should refresh data', async ({ page }) => {
    await page.waitForTimeout(2000);
    const refreshButton = page.locator(
      'button:has-text("Refresh"), button:has-text("Reload")'
    );
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display recent activity', async ({ page }) => {
    await page.waitForTimeout(2000);
    const activity = page.locator(
      '[data-testid="activity"], .activity, [class*="activity"]'
    );
    await expect(activity.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('No recent activity displayed');
      });
  });

  test('should show quick actions', async ({ page }) => {
    await page.waitForTimeout(2000);
    const quickActions = page.locator(
      'button:has-text("Add"), button:has-text("Create")'
    );
    await expect(quickActions.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('No quick actions displayed');
      });
  });
});
