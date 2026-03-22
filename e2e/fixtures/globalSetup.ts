import { test as base } from '@playwright/test';
import { testData, credentials } from './testData';

type UserFixture = {
  authenticatedUser: { email: string; password: string };
};

export const test = base.extend<UserFixture>({
  authenticatedUser: async ({ page }, use) => {
    await page.goto('/');
    await page.fill(
      'input[name="email"], input[type="email"]',
      credentials.valid.email
    );
    await page.fill('input[name="password"]', credentials.valid.password);
    await page.click('button[type="submit"]');
    await page
      .waitForURL(/dashboard|jobs|experiences/, { timeout: 15000 })
      .catch(() => {
        console.log('Auth may have failed');
      });

    await use({
      email: credentials.valid.email,
      password: credentials.valid.password,
    });
  },
});

export { expect } from '@playwright/test';
export { testData, credentials };
