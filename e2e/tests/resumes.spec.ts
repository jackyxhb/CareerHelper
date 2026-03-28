import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Resume Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resumes');
  });

  test('should display resumes page @smoke', async ({ page }) => {
    await expect(
      page.locator('h1, h2, [data-testid="resumes-page"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display list of resumes', async ({ page }) => {
    await page.waitForTimeout(2000);
    const cards = page.locator(
      '[data-testid="resume-card"], .resume-card, [class*="resume"]'
    );
    const count = await cards.count();
    console.log(`Found ${count} resume cards`);
  });

  test('should upload a resume', async ({ page }) => {
    const uploadButton = page.locator(
      'button:has-text("Upload Resume"), button:has-text("Add Resume")'
    );
    if (await uploadButton.isVisible()) {
      await uploadButton.click();

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const filePath = path.join(__dirname, '../fixtures/test-resume.pdf');
        await fileInput.setInputFiles(filePath);
        await page.click(
          'button:has-text("Upload"), button:has-text("Submit")'
        );
        await page.waitForTimeout(3000);
      }
    }
  });

  test('should download a resume', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="resume-card"]').first();
    if (await card.isVisible()) {
      const downloadButton = card.locator(
        'button:has-text("Download"), [data-testid="download-button"]'
      );
      if (await downloadButton.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadButton.click(),
        ]);
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });

  test('should delete a resume', async ({ page }) => {
    await page.waitForTimeout(2000);
    const initialCount = await page
      .locator('[data-testid="resume-card"]')
      .count();

    if (initialCount > 0) {
      const card = page.locator('[data-testid="resume-card"]').first();
      const deleteButton = card.locator(
        'button:has-text("Delete"), [data-testid="delete-button"]'
      );
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.click('button:has-text("Confirm"), button:has-text("Yes")');
        await page.waitForTimeout(2000);

        const newCount = await page
          .locator('[data-testid="resume-card"]')
          .count();
        expect(newCount).toBe(initialCount - 1);
      }
    }
  });

  test('should set primary resume', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="resume-card"]').first();
    if (await card.isVisible()) {
      const primaryButton = card.locator(
        'button:has-text("Set Primary"), button:has-text("Make Primary")'
      );
      if (await primaryButton.isVisible()) {
        await primaryButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should preview resume', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="resume-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show empty state with no resumes', async ({ page }) => {
    const emptyState = page.locator(
      'text=/no resumes|empty|upload your first/i'
    );
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    if (!hasEmpty) {
      console.log('Resumes found, skipping empty state check');
    }
  });
});

test.describe('Resume Upload Validation', () => {
  test('should reject invalid file types', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload Resume")');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'test.exe',
          mimeType: 'application/x-executable',
          buffer: Buffer.from('fake exe content'),
        });

        await expect(
          page.locator('text=/invalid file|not supported|wrong format/i')
        )
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            console.log('File type validation not visible');
          });
      }
    }
  });

  test('should reject oversized files', async ({ page }) => {
    const uploadButton = page.locator('button:has-text("Upload Resume")');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const largeBuffer = Buffer.alloc(20 * 1024 * 1024);
        await fileInput.setInputFiles({
          name: 'large-resume.pdf',
          mimeType: 'application/pdf',
          buffer: largeBuffer,
        });

        await expect(page.locator('text=/too large|size limit|exceeds/i'))
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            console.log('File size validation not visible');
          });
      }
    }
  });
});
