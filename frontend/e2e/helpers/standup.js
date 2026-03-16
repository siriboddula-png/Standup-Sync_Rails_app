/**
 * Standup helper functions for Playwright tests
 */

/**
 * Sample standup data
 */
export const SAMPLE_STANDUP = {
  done: 'Completed the authentication module and fixed all related bugs',
  doing: 'Working on the dashboard UI components and implementing filters',
  blockers: 'Waiting for design approval from the team',
  standup_date: new Date().toISOString().split('T')[0] // Today's date
};

export const SAMPLE_STANDUP_NO_BLOCKER = {
  done: 'Implemented the user profile page with all required fields',
  doing: 'Building the standup form view with validation logic',
  blockers: 'none',
  standup_date: new Date().toISOString().split('T')[0]
};

/**
 * Create a standup via UI
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} standupData - Standup data
 */
export async function createStandup(page, standupData = SAMPLE_STANDUP) {
  // Navigate to form
  await page.click('text=Post My Update');
  await page.waitForURL('**/dashboard/new**');
  
  // Fill form
  await page.fill('textarea[name="done"]', standupData.done);
  await page.fill('textarea[name="doing"]', standupData.doing);
  await page.fill('textarea[name="blockers"]', standupData.blockers);
  
  if (standupData.standup_date) {
    await page.fill('input[type="date"]', standupData.standup_date);
  }
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for success notification
  await page.waitForSelector('text=Standup saved successfully!', { timeout: 5000 });
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 5000 });
}

/**
 * Edit a standup
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} standupText - Text to identify the standup
 * @param {Object} newData - New standup data
 */
export async function editStandup(page, standupText, newData) {
  // Find and click edit button for the standup
  const standupRow = page.locator(`text=${standupText}`).locator('..').locator('..');
  await standupRow.locator('button:has-text("Edit")').click();
  
  // Wait for form
  await page.waitForURL('**/dashboard/new**');
  
  // Update fields
  if (newData.done) {
    await page.fill('textarea[name="done"]', newData.done);
  }
  if (newData.doing) {
    await page.fill('textarea[name="doing"]', newData.doing);
  }
  if (newData.blockers !== undefined) {
    await page.fill('textarea[name="blockers"]', newData.blockers);
  }
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for success
  await page.waitForSelector('text=Standup edited successfully!', { timeout: 5000 });
}

/**
 * Delete a standup
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} standupText - Text to identify the standup
 */
export async function deleteStandup(page, standupText) {
  // Set up dialog handler before clicking delete
  page.once('dialog', dialog => dialog.accept());
  
  // Find and click delete button
  const standupRow = page.locator(`text=${standupText}`).locator('..').locator('..');
  await standupRow.locator('button:has-text("Delete")').click();
  
  // Wait for success notification
  await page.waitForSelector('text=Standup deleted successfully!', { timeout: 5000 });
}

/**
 * Navigate to profile view
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function goToProfile(page) {
  await page.click('text=My Profile');
  await page.waitForURL('**/dashboard/profile**');
}

/**
 * Navigate to team view
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function goToTeamView(page) {
  await page.goto('/dashboard');
  await page.waitForURL('**/dashboard');
}

/**
 * Apply name filter
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name - Name to search for
 */
export async function applyNameFilter(page, name) {
  await page.fill('input[placeholder*="name"]', name);
  await page.click('button:has-text("Apply Name Filter")');
  await page.waitForTimeout(500); // Wait for results
}

/**
 * Apply date filter
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} date - Date to filter by (YYYY-MM-DD)
 */
export async function applyDateFilter(page, date) {
  await page.fill('input[type="date"]', date);
  await page.click('button:has-text("Apply Date Filter")');
  await page.waitForTimeout(500);
}

/**
 * Clear all filters
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function clearFilters(page) {
  await page.click('button:has-text("Clear Filters")');
  await page.waitForTimeout(500);
}

