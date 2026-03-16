/**
 * Authentication E2E Tests
 * Tests signup, login, and logout flows
 */

const { test, expect } = require('@playwright/test');
const { login, logout, createTestUser } = require('./helpers/auth');

// Create ONE test user for all tests
const timestamp = Date.now();
const TEST_USER = {
  email: `test_${timestamp}@example.com`,
  password: 'TestPass123',
  username: `testuser_${timestamp}`,
  firstName: 'Test',
  lastName: 'User'
};

test.describe('Authentication', () => {

  // Create user ONCE before all tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await createTestUser(page, TEST_USER);
    await page.close();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await login(page, TEST_USER);
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Team Updates')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/Login failed|Invalid/i')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should successfully logout', async ({ page }) => {
    await login(page, TEST_USER);
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await logout(page);

    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should not allow duplicate email registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="first_name"]', TEST_USER.firstName);
    await page.fill('input[name="last_name"]', TEST_USER.lastName);
    await page.fill('input[name="username"]', `${TEST_USER.username}_duplicate`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="password_confirmation"]', TEST_USER.password);

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const hasError = await page.locator('text=/already|taken|exists|has already been taken/i').isVisible().catch(() => false);
    const stillOnRegister = page.url().includes('/register');

    expect(hasError || stillOnRegister).toBeTruthy();
  });
});

