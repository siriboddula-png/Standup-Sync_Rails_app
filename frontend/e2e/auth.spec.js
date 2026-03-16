const { test, expect } = require('@playwright/test');
const { login, logout } = require('./helpers/auth');

const TEST_USER = {
  email: `siri@rc.com`,
  password: 'password123',
  username: `siri09`,
  firstName: 'siri',
  lastName: 'test_test'
};

test.describe('Authentication Flows', () => {

  test('should register a new user or login if already exists', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="first_name"]', TEST_USER.firstName);
    await page.fill('input[name="last_name"]', TEST_USER.lastName);
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="password_confirmation"]', TEST_USER.password);

    let userExists = false;
    page.on('dialog', async dialog => {
      if (dialog.message().toLowerCase().includes('taken') || dialog.message().toLowerCase().includes('exists')) {
        userExists = true;
      }
      await dialog.accept();
    });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    if (userExists || page.url().includes('/register')) {
      console.log('User already exists, switching to Login flow...');
      await page.goto('/login');
      await login(page, TEST_USER);
    } else {
      console.log('User created successfully, proceeding to login...');
      await expect(page).toHaveURL(/.*login/);
      await login(page, TEST_USER);
    }

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Team Updates');
  });
  
  test('should successfully logout', async ({ page }) => {
    await login(page, TEST_USER);
    await expect(page).toHaveURL(/.*dashboard/);
    await logout(page);
    await expect(page).toHaveURL(/.*login/);
  });

  test('should reject password shorter than 6 characters', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    page.on('dialog', dialog => dialog.dismiss());
    await page.fill('input[name="first_name"]', 'Short');
    await page.fill('input[name="last_name"]', 'Pass');
    await page.fill('input[name="username"]', `shortpass_${timestamp}`);
    await page.fill('input[name="email"]', `shortpass_${timestamp}@example.com`);
    await page.fill('input[name="password"]', '12345');
    await page.fill('input[name="password_confirmation"]', '12345');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/password.*too short|minimum.*6|at least 6/i').isVisible().catch(() => false);
    const stillOnRegister = page.url().includes('/register');
    expect(hasError || stillOnRegister).toBeTruthy();
  });

  test('should reject duplicate username', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    page.on('dialog', dialog => dialog.dismiss());
    await page.fill('input[name="first_name"]', 'Duplicate');
    await page.fill('input[name="last_name"]', 'Username');
    await page.fill('input[name="username"]', TEST_USER.username);
    await page.fill('input[name="email"]', `duplicate_username_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="password_confirmation"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/username.*taken|username.*exists|already been taken/i').isVisible().catch(() => false);
    const stillOnRegister = page.url().includes('/register');
    expect(hasError || stillOnRegister).toBeTruthy();
  });

  test('should reject duplicate email', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    page.on('dialog', dialog => dialog.dismiss());
    await page.fill('input[name="first_name"]', 'Duplicate');
    await page.fill('input[name="last_name"]', 'Email');
    await page.fill('input[name="username"]', `duplicate_email_${timestamp}`);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="password_confirmation"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/email.*taken|email.*exists|already been taken/i').isVisible().catch(() => false);
    const stillOnRegister = page.url().includes('/register');
    expect(hasError || stillOnRegister).toBeTruthy();
  });

  test('should reject mismatched password confirmation', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    page.on('dialog', dialog => dialog.dismiss());
    await page.fill('input[name="first_name"]', 'Mismatch');
    await page.fill('input[name="last_name"]', 'Password');
    await page.fill('input[name="username"]', `mismatch_${timestamp}`);
    await page.fill('input[name="email"]', `mismatch_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="password_confirmation"]', 'password456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/password.*match|confirmation.*match|doesn\'t match/i').isVisible().catch(() => false);
    const stillOnRegister = page.url().includes('/register');
    expect(hasError || stillOnRegister).toBeTruthy();
  });

  test('should reject registration with missing required fields', async ({ page }) => {
    await page.goto('/register');
    page.on('dialog', dialog => dialog.dismiss());
    await page.fill('input[name="email"]', 'incomplete@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const stillOnRegister = page.url().includes('/register');
    expect(stillOnRegister).toBeTruthy();
  });

  test('should reject invalid email format', async ({ page }) => {
    const timestamp = Date.now();
    await page.goto('/register');
    page.on('dialog', dialog => dialog.dismiss());
    await page.fill('input[name="first_name"]', 'Invalid');
    await page.fill('input[name="last_name"]', 'Email');
    await page.fill('input[name="username"]', `invalidemail_${timestamp}`);
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="password_confirmation"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const hasError = await page.locator('text=/invalid.*email|email.*invalid/i').isVisible().catch(() => false);
    const stillOnRegister = page.url().includes('/register');
    expect(hasError || stillOnRegister).toBeTruthy();
  });

  test('should show error with invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/Login failed|Invalid|incorrect/i')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });
});