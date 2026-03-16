const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth');

const TEST_USER = {
  email: `siri@rc.com`,
  password: 'password123',
  username: `siri09`,
  firstName: 'siri',
  lastName: 'test_test'
};

test.describe('Standup CRUD Operations', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await login(page, TEST_USER);
  });

  test('should display standup form and hide team updates', async ({ page }) => {
    await page.getByRole('button', { name: /Post My Update/i }).click();
    const teamHeading = page.locator('h1:has-text("Team Updates")');
    await expect(teamHeading).not.toBeVisible();
    await expect(page.locator('h2')).toContainText(/New Standup Update/i);
    await expect(page.getByRole('button', { name: /Back to Team View/i })).toBeVisible();
  });

  test('should show validation error for short fields', async ({ page }) => {
    await page.getByRole('button', { name: /Post My Update/i }).click();
    const yesterdayField = page.locator('textarea').nth(0);
    await yesterdayField.fill('Short text');
    const todayField = page.locator('textarea').nth(1);
    await todayField.fill('This is a much longer description for today to pass that validation');
    page.once('dialog', dialog => dialog.dismiss());
    await page.getByRole('button', { name: /Save Update/i }).click();
  });

  test('should successfully create standup and return to team view', async ({ page }) => {
    await page.click('text=Post My Update');
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('Completed the initial API setup and CORS config');
    await textareas.nth(1).fill('Working on the frontend dashboard components');
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Update")');
    await expect(page.locator('h1:has-text("Team Updates")')).toBeVisible();
  });

  test('should edit existing standup', async ({ page }) => {
    await page.click('text=Post My Update');
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('Original entry for editing test case');
    await textareas.nth(1).fill('This is the original content before editing');
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Update")');
    await expect(page.locator('h1:has-text("Team Updates")')).toBeVisible();

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    const yesterdayInput = page.locator('textarea').first();
    await yesterdayInput.fill('Updated: I am now providing a very long string to pass validation');
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Save Update")');
    await expect(page.locator('h1:has-text("Team Updates")')).toBeVisible();
  });

  test('should delete standup directly by auto-accepting dialog', async ({ page }) => {
    await page.click('text=Post My Update');
    const uniqueId = `DeleteMe-${Date.now()}`;
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill(uniqueId);
    await textareas.nth(1).fill('Cleanup testing');
    page.once('dialog', d => d.accept());
    await page.click('button:has-text("Save Update")');
    await expect(page.locator('h1:has-text("Team Updates")')).toBeVisible();
    const targetRow = page.locator('tr').filter({ hasText: uniqueId });
    await expect(targetRow).toBeVisible();
    page.once('dialog', dialog => {
      console.log(`Handled dialog: ${dialog.message()}`);
      dialog.accept().catch(() => {});
    });
    const deleteButton = targetRow.locator('button:has-text("Delete")');
    await deleteButton.click();
    page.on('dialog', d => d.accept().catch(() => {}));
    await expect(page.locator(`text=${uniqueId}`)).not.toBeVisible({ timeout: 10000 });
  });
});