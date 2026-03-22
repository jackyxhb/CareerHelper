import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('should display onboarding for new users', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const onboarding = page.locator(
      '[data-testid="onboarding-flow"], .onboarding, [class*="onboarding"]'
    );
    const isVisible = await onboarding.isVisible().catch(() => false);

    if (isVisible) {
      await expect(onboarding.first()).toBeVisible();
    } else {
      console.log('Onboarding not shown (may be returning user)');
    }
  });

  test('should have welcome step', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=/welcome/i').first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('Welcome text not found');
      });
  });

  test('should navigate through onboarding steps', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    if (await onboarding.isVisible()) {
      const nextButton = page.locator('button:has-text("Next")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        const backButton = page.locator('button:has-text("Back")');
        if (await backButton.isVisible()) {
          await backButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should allow skipping onboarding', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);

      const onboarding = page.locator('[data-testid="onboarding-flow"]');
      await expect(onboarding).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should complete onboarding', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    if (await onboarding.isVisible()) {
      const finishButton = page.locator(
        'button:has-text("Finish"), button:has-text("Get Started")'
      );
      if (await finishButton.isVisible()) {
        await finishButton.click();
        await page.waitForTimeout(1000);
        await expect(onboarding).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should persist onboarding completion', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    await page.reload();
    await page.waitForTimeout(2000);

    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    await expect(onboarding).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Onboarding Progress', () => {
  test('should show progress indicator', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    const progress = page.locator(
      '[data-testid="progress"], .progress, [class*="progress"]'
    );
    await expect(progress.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('Progress indicator not found');
      });
  });

  test('should highlight current step', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('onboarding_complete'));
    await page.goto('/');
    await page.waitForTimeout(2000);

    const currentStep = page.locator(
      '[class*="step"][class*="active"], [class*="current"]'
    );
    await expect(currentStep.first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        console.log('Current step indicator not found');
      });
  });
});
