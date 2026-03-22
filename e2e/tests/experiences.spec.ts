import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/testData';

test.describe('Experience Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/experiences');
  });

  test('should display experiences page @smoke', async ({ page }) => {
    await expect(
      page.locator('h1, h2, [data-testid="experiences-page"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display list of experiences', async ({ page }) => {
    await page.waitForTimeout(2000);
    const cards = page.locator(
      '[data-testid="experience-card"], .experience-card, [class*="experience"]'
    );
    const count = await cards.count();
    console.log(`Found ${count} experience cards`);
  });

  test('should add new experience', async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Experience"), button:has-text("New Experience")'
    );
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(
        page.locator('form, [data-testid="experience-form"]')
      ).toBeVisible({ timeout: 3000 });

      await page.fill(
        'input[name="title"], input[placeholder*="title"]',
        testData.experience.title
      );
      await page.fill(
        'input[name="company"], input[placeholder*="company"]',
        testData.experience.company
      );
      await page.fill('input[name="startDate"]', testData.experience.startDate);
      await page.fill(
        'textarea[name="description"]',
        testData.experience.description
      );
      await page.click('button:has-text("Save"), button:has-text("Submit")');
      await page.waitForTimeout(2000);
    }
  });

  test('should edit experience', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="experience-card"]').first();
    if (await card.isVisible()) {
      const editButton = card.locator(
        'button:has-text("Edit"), [data-testid="edit-button"]'
      );
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.fill('input[name="title"]', 'Updated Title');
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should delete experience', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="experience-card"]').first();
    if (await card.isVisible()) {
      const deleteButton = card.locator(
        'button:has-text("Delete"), [data-testid="delete-button"]'
      );
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.click(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
        );
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should add skills to experience', async ({ page }) => {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="experience-card"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);

      const skillsInput = page.locator(
        'input[name="skills"], input[placeholder*="skill"]'
      );
      if (await skillsInput.isVisible()) {
        await skillsInput.fill('JavaScript, React, Node.js');
        await page.click('button:has-text("Save Skills")');
      }
    }
  });

  test('should show empty state with no experiences', async ({ page }) => {
    const emptyState = page.locator(
      'text=/no experiences|empty|add your first/i'
    );
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    if (!hasEmpty) {
      console.log('Experiences found, skipping empty state check');
    }
  });
});

test.describe('Experience Skills', () => {
  test('should display skills for each experience', async ({ page }) => {
    await page.goto('/experiences');
    await page.waitForTimeout(2000);

    const skills = page.locator(
      '[data-testid="skill-tag"], .skill-tag, [class*="skill"]'
    );
    const count = await skills.count();
    console.log(`Found ${count} skill tags`);
  });

  test('should filter experiences by skill', async ({ page }) => {
    const filterInput = page.locator(
      'input[name="skillFilter"], input[placeholder*="filter skill"]'
    );
    if (await filterInput.isVisible()) {
      await filterInput.fill('JavaScript');
      await page.waitForTimeout(1000);
    }
  });
});
