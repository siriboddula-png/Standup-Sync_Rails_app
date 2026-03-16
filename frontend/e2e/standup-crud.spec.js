/**
 * Standup CRUD Operations E2E Tests
 * Essential tests for creating, reading, updating, and deleting standups
 */

const { test, expect } = require('@playwright/test');
const { login, createTestUser } = require('./helpers/auth');
const { createStandup, SAMPLE_STANDUP } = require('./helpers/standup');

const timestamp = Date.now();
const TEST_USER = {
  email: `test_standup_${timestamp}@example.com`,
  password: 'TestPass123',
  username: `testuser_standup_${timestamp}`,
  firstName: 'Test',
  lastName: 'User'
};

test.describe('Standup CRUD Operations', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await createTestUser(page, TEST_USER);
    await page.close();
  });
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USER);
  });

  test('should display standup form when clicking "Post My Update"', async ({ page }) => {
    await page.click('text=Post My Update');

    await expect(page).toHaveURL(/.*dashboard\/new/);
    await expect(page.locator('textarea[name="done"]')).toBeVisible();
    await expect(page.locator('textarea[name="doing"]')).toBeVisible();
    await expect(page.locator('textarea[name="blockers"]')).toBeVisible();
  });

  test('should show validation error for short fields', async ({ page }) => {
    await page.click('text=Post My Update');
    await page.fill('textarea[name="done"]', 'Short text');
    await page.fill('textarea[name="doing"]', 'Working on something important today');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/at least 15 characters|cannot be empty/i')).toBeVisible({ timeout: 3000 });
  });

  test('should successfully create standup with valid data', async ({ page }) => {
    await createStandup(page, SAMPLE_STANDUP);
    await expect(page).toHaveURL(/.*dashboard$/);
    await expect(page.locator('text=Standup saved successfully!')).toBeVisible();
  });

  test('should navigate to profile view', async ({ page }) => {
    await page.click('text=My Profile');
    await expect(page).toHaveURL(/.*dashboard\/profile/);
    await expect(page.locator('text=My Logs')).toBeVisible();
  });

  test('should edit existing standup', async ({ page }) => {
    await createStandup(page, SAMPLE_STANDUP);
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await expect(page).toHaveURL(/.*dashboard\/new/);
    const newDone = 'Updated: Completed all authentication tests and documentation';
    await page.fill('textarea[name="done"]', newDone);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Standup edited successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('should show confirmation dialog when deleting', async ({ page }) => {
    await createStandup(page, SAMPLE_STANDUP);
    let dialogShown = false;
    page.once('dialog', dialog => {
      dialogShown = true;
      dialog.dismiss();
    });
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    await page.waitForTimeout(500);
    expect(dialogShown).toBeTruthy();
  });
});

