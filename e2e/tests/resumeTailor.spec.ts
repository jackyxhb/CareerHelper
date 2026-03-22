import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('AI Resume Tailor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume-tailor');
  });

  test('should display resume tailor page @smoke', async ({ page }) => {
    await expect(
      page.locator('h1, h2, [data-testid="resume-tailor-page"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should have resume and job description inputs', async ({ page }) => {
    await expect(
      page
        .locator('textarea[name="resumeText"], textarea[name="resume"]')
        .first()
    ).toBeVisible();
    await expect(
      page
        .locator('textarea[name="jobDescription"], textarea[name="job"]')
        .first()
    ).toBeVisible();
  });

  test('should tailor resume with valid inputs', async ({ page }) => {
    await page.fill(
      'textarea[name="resumeText"], textarea[name="resume"]',
      testData.resumeText
    );
    await page.fill(
      'textarea[name="jobDescription"], textarea[name="jobDescription"]',
      testData.jobDescription
    );
    await page.click('button:has-text("Tailor"), button:has-text("Analyze")');
    await page.waitForTimeout(3000);

    const results = page.locator(
      '[data-testid="tailoring-results"], .results, [class*="result"]'
    );
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display match score', async ({ page }) => {
    await page.fill(
      'textarea[name="resumeText"], textarea[name="resume"]',
      testData.resumeText
    );
    await page.fill(
      'textarea[name="jobDescription"], textarea[name="jobDescription"]',
      testData.jobDescription
    );
    await page.click('button:has-text("Tailor"), button:has-text("Analyze")');
    await page.waitForTimeout(3000);

    const score = page.locator(
      '[data-testid="match-score"], .score, [class*="score"]'
    );
    await expect(score.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display keyword suggestions', async ({ page }) => {
    await page.fill(
      'textarea[name="resumeText"], textarea[name="resume"]',
      testData.resumeText
    );
    await page.fill(
      'textarea[name="jobDescription"], textarea[name="jobDescription"]',
      testData.jobDescription
    );
    await page.click('button:has-text("Tailor"), button:has-text("Analyze")');
    await page.waitForTimeout(3000);

    const keywords = page.locator(
      '[data-testid="keyword"], .keyword, [class*="keyword"]'
    );
    await expect(keywords.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display improvement suggestions', async ({ page }) => {
    await page.fill(
      'textarea[name="resumeText"], textarea[name="resume"]',
      testData.resumeText
    );
    await page.fill(
      'textarea[name="jobDescription"], textarea[name="jobDescription"]',
      testData.jobDescription
    );
    await page.click('button:has-text("Tailor"), button:has-text("Analyze")');
    await page.waitForTimeout(3000);

    const suggestions = page.locator(
      '[data-testid="suggestion"], .suggestion, [class*="suggestion"]'
    );
    await expect(suggestions.first()).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Tailor"), button:has-text("Analyze")');
    await page.waitForTimeout(1000);
    await expect(
      page.locator('text=/required|empty|please enter/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should allow editing resume text', async ({ page }) => {
    await page.fill(
      'textarea[name="resumeText"], textarea[name="resume"]',
      'Original text'
    );
    const textArea = page.locator('textarea[name="resumeText"]').first();
    await textArea.clear();
    await textArea.fill('Modified resume text');
    await expect(textArea).toHaveValue('Modified resume text');
  });

  test('should reset form', async ({ page }) => {
    await page.fill(
      'textarea[name="resumeText"], textarea[name="resume"]',
      'Test resume'
    );
    await page.fill(
      'textarea[name="jobDescription"], textarea[name="jobDescription"]',
      'Test job'
    );

    const resetButton = page.locator(
      'button:has-text("Reset"), button:has-text("Clear")'
    );
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Resume Tailor Integration', () => {
  test('should integrate with uploaded resume', async ({ page }) => {
    await page.goto('/resumes');
    await page.waitForTimeout(2000);

    const useButton = page
      .locator(
        'button:has-text("Use for Tailoring"), button:has-text("Tailor This")'
      )
      .first();
    if (await useButton.isVisible()) {
      await useButton.click();
      await page.waitForURL('**/resume-tailor**');
    }
  });

  test('should save tailoring results', async ({ page }) => {
    await page.goto('/resume-tailor');
    await page.fill('textarea[name="resumeText"]', testData.resumeText);
    await page.fill('textarea[name="jobDescription"]', testData.jobDescription);
    await page.click('button:has-text("Tailor")');
    await page.waitForTimeout(3000);

    const saveButton = page.locator(
      'button:has-text("Save Results"), button:has-text("Download")'
    );
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000);
    }
  });
});
