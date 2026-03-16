/**
 * Authentication helper functions for Playwright tests
 */

/**
 * Test user credentials
 * This user will be created via signup in the tests
 */
export const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123',
  username: `testuser_${Date.now()}`,
  firstName: 'Test',
  lastName: 'User'
};

export const MANAGER_EMAIL = 'bsiri10122@gmail.com';

/**
 * Create a test user via signup
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User registration data
 */
export async function createTestUser(page, userData = TEST_USER) {
  await page.goto('/register');

  // Wait for registration form
  await page.waitForSelector('input[name="email"]', { timeout: 5000 });

  // Fill registration form - ALL required fields
  await page.fill('input[name="first_name"]', userData.firstName);
  await page.fill('input[name="last_name"]', userData.lastName);
  await page.fill('input[name="username"]', userData.username);
  await page.fill('input[name="email"]', userData.email);
  await page.fill('input[name="password"]', userData.password);
  await page.fill('input[name="password_confirmation"]', userData.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait a bit for any alerts/redirects
  await page.waitForTimeout(2000);
}

/**
 * Login helper function
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} credentials - User credentials
 */
export async function login(page, credentials = TEST_USER) {
  await page.goto('/login');

  // Wait for page to load
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });

  // Fill in login form
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard or error message
  try {
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
  } catch (error) {
    // Check if there's an error message
    const errorMessage = await page.locator('text=/Login failed|Invalid/i').textContent().catch(() => null);
    throw new Error(`Login failed: ${errorMessage || 'Unknown error'}. Make sure user ${credentials.email} exists in database.`);
  }
}

/**
 * Logout helper function
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function logout(page) {
  await page.click('text=Logout');
  await page.waitForURL('**/login**', { timeout: 5000 });
}

/**
 * Register a new user (alias for createTestUser)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User registration data
 */
export async function register(page, userData) {
  return createTestUser(page, userData);
}

/**
 * Check if user is logged in
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn(page) {
  try {
    await page.waitForSelector('text=Logout', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

