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
    await page.waitForTimeout(500);
    const textareas = page.locator('textarea');
    await textareas.nth(0).fill('Original entry!!');
    await textareas.nth(1).fill('Original content!');
    await page.click('button:has-text("Save Update")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('h1:has-text("Team Updates")')).toBeVisible();

    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForURL('**/dashboard/new');
    await page.waitForTimeout(500);
    const doneTextarea = page.locator('textarea').nth(0);
    await doneTextarea.clear();
    await doneTextarea.fill('Updated entry!!!!');
    const doingTextarea = page.locator('textarea').nth(1);
    await doingTextarea.clear();
    await doingTextarea.fill('Updated doing!!!!');
    const blockerTextarea=page.locator('textarea').nth(2);
    await blockerTextarea.clear();
    await blockerTextarea.fill('Updated blockers!!');

    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/standups/') && resp.request().method() === 'PUT'),
      page.click('button:has-text("Save Update")')
    ]);

    console.log('Edit response status:', response.status());
    console.log('Edit response body:', await response.text());

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('h1:has-text("Team Updates")')).toBeVisible();
  });

  test('should delete standup directly by auto-accepting dialog', async ({ page }) => {
    // 1. Create the entry
    await page.click('text=Post My Update');
    const uniqueText = `Delete Me ${Date.now()}`;
    await page.locator('textarea').nth(0).fill(uniqueText);
    await page.locator('textarea').nth(1).fill('Cleanup testing!');
    await page.click('button:has-text("Save Update")');
    await page.waitForURL('**/dashboard');
    const mainTable = page.locator('table:has(th:has-text("Actions"))').first();
    await expect(mainTable).toBeVisible();

    const initialRowCount = await mainTable.locator('tbody tr').count();

    const targetRow = mainTable.locator('tr', { hasText: uniqueText });
    const deleteButton = targetRow.locator('button:has-text("Delete")');
    
    await expect(deleteButton).toBeVisible();

    page.once('dialog', dialog => dialog.accept());

    const [deleteResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/standups/') && r.request().method() === 'DELETE'),
      page.waitForResponse(r => r.url().includes('/standups') && r.request().method() === 'GET'),
      deleteButton.click()
    ]);

    expect(deleteResponse.status()).toBe(200);
    await expect(mainTable.locator('tbody tr')).toHaveCount(initialRowCount - 1);
    await expect(mainTable).not.toContainText(uniqueText);
  });
});