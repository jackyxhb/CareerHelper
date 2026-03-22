import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const apiBaseUrl =
    process.env.API_URL ||
    'https://lm5lnut0n5.execute-api.us-east-1.amazonaws.com';

  test('should call health endpoint', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('should call resume tailor endpoint', async ({ request }) => {
    const response = await request.post(`${apiBaseUrl}/resume/tailor`, {
      data: {
        resumeText: 'Software Engineer with 5 years experience',
        jobDescription: 'Looking for senior developer with JavaScript skills',
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('overallScore');
  });

  test('should call PMF endpoint', async ({ request }) => {
    const response = await request.post(`${apiBaseUrl}/pmf`, {
      data: {
        userId: 'test-user-123',
        score: 8,
        feedback: 'Great app!',
      },
    });
    expect(response.ok()).toBeTruthy();
  });

  test('should get PMF stats', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/pmf`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('responseCount');
  });
});

test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    await page.goto('/');
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load jobs page within acceptable time', async ({ page }) => {
    await page.goto('/jobs');
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have form labels', async ({ page }) => {
    await page.goto('/');
    const inputs = page.locator('input');
    const count = await inputs.count();
    if (count > 0) {
      const firstInput = inputs.first();
      const id = await firstInput.getAttribute('id');
      const ariaLabel = await firstInput.getAttribute('aria-label');
      const placeholder = await firstInput.getAttribute('placeholder');
      expect(id || ariaLabel || placeholder).toBeTruthy();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
