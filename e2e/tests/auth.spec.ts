import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page @smoke', async ({ page }) => {
    await expect(
      page.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/required|empty|invalid/i')).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({
    page,
  }) => {
    await page.fill(
      'input[name="email"], input[type="email"]',
      testData.validUser.email
    );
    await page.fill('input[name="password"]', testData.validUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|jobs|experiences/, { timeout: 10000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill(
      'input[name="email"], input[type="email"]',
      'invalid@example.com'
    );
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/error|invalid|failed/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should allow toggling between sign in and sign up', async ({
    page,
  }) => {
    const signUpLink = page.locator(
      'a:has-text("Sign up"), a:has-text("Create account")'
    );
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(
        page.locator('input[name="email"], input[name="name"]').first()
      ).toBeVisible();
    }
  });
});

test.describe('Session Management', () => {
  test('should persist session across page refresh', async ({ page }) => {
    await page.goto('/');
    await page.fill(
      'input[name="email"], input[type="email"]',
      testData.validUser.email
    );
    await page.fill('input[name="password"]', testData.validUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|jobs|experiences/, { timeout: 10000 });

    await page.reload();
    await expect(page).not.toHaveURL(/\/login|\/signin/, { timeout: 5000 });
  });

  test('should clear session on sign out', async ({ page }) => {
    await page.goto('/');
    await page.fill(
      'input[name="email"], input[type="email"]',
      testData.validUser.email
    );
    await page.fill('input[name="password"]', testData.validUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|jobs|experiences/, { timeout: 10000 });

    await page.click('button:has-text("Sign out"), button:has-text("Logout")');
    await page.waitForURL(/\/login|\/signin/, { timeout: 5000 });
  });
});
