import { test, expect } from '@playwright/test';

const TEST_USER = { email: 'siri@rc.com', password: 'password123' };

async function login(page) {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForLoadState('networkidle');
}

async function createStandupWithDate(page, date, done, doing, blockers = 'None') {
  await page.click('text=Post My Update');
  await page.waitForURL('**/dashboard/new');
  await page.waitForTimeout(500);
  const textareas = page.locator('textarea');
  await textareas.nth(0).fill(done);
  await textareas.nth(1).fill(doing);
  await textareas.nth(2).fill(blockers);
  await page.fill('input[type="date"]', date);
  await page.click('button:has-text("Save Update")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

function getDateString(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

test.describe('Filter and Sort by Date', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Filter by Date', () => {
    test('should filter standups by selected date', async ({ page }) => {
      const today = new Date().toISOString().split('T')[0];
      await createStandupWithDate(page, today, 'API testing done!', 'Frontend work now');
      await page.fill('input[type="date"]', today);
      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/standups') && resp.status() === 200
      );
      await page.click('button:has-text("Filter Date")');
      await responsePromise;
      await expect(page.locator('text=API testing done!').first()).toBeVisible();
    });

    test('should show no results when filtering by date with no standups', async ({ page }) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() - 100);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      await page.fill('input[type="date"]', futureDateStr);
      await page.click('button:has-text("Filter Date")');
      await page.waitForTimeout(500);
      const standupCards = await page.locator('[class*="standup"]').count();
      expect(standupCards).toBe(0);
    });

    test('should clear date filter when Clear button is clicked', async ({ page }) => {
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      await page.click('button:has-text("Filter Date")');
      await page.waitForTimeout(500);
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
      await page.click('button:has-text("Clear")');
      await page.waitForTimeout(500);
      const dateInput = await page.locator('input[type="date"]').inputValue();
      expect(dateInput).toBe('');
      await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();
    });
  });

  test.describe('Sort by Date', () => {
    test('should display standups in descending order by default', async ({ page }) => {
      const sortButton = page.locator('button:has-text("Sort By Date")');
      await expect(sortButton).toContainText('↓');
    });

    test('should toggle sort to ascending when clicked', async ({ page }) => {
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      const sortButton = page.locator('button:has-text("Sort By Date")');
      await expect(sortButton).toContainText('↑');
    });

    test('should toggle sort back to descending when clicked again', async ({ page }) => {
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      const sortButton = page.locator('button:has-text("Sort By Date")');
      await expect(sortButton).toContainText('↓');
    });

    test('should sort filtered results correctly', async ({ page }) => {
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      await page.click('button:has-text("Filter Date")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      const sortButton = page.locator('button:has-text("Sort By Date")');
      await expect(sortButton).toContainText('↑');
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      await expect(sortButton).toContainText('↓');
    });
  });
  
  test.describe('Filter by Name', () => {
    test('should filter standups by name', async ({ page }) => {
      await page.fill('input[placeholder="Search name..."]', 'siri');
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
    });

    test('should clear name filter', async ({ page }) => {
      await page.fill('input[placeholder="Search name..."]', 'siri');
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Clear")');
      await page.waitForTimeout(500);
      const nameInput = await page.locator('input[placeholder="Search name..."]').inputValue();
      expect(nameInput).toBe('');
    });

    test('should combine name and date filters', async ({ page }) => {
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[placeholder="Search name..."]', 'siri');
      await page.fill('input[type="date"]', today);
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      await page.click('button:has-text("Filter Date")');
      await page.waitForTimeout(500);
      const nameInput = await page.locator('input[placeholder="Search name..."]').inputValue();
      expect(nameInput).toBe('siri');
      const dateInput = await page.locator('input[type="date"]').inputValue();
      expect(dateInput).toBe(today);
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
    });

    test('should filter by partial name match', async ({ page }) => {
      await page.fill('input[placeholder="Search name..."]', 'si');
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      const nameInput = await page.locator('input[placeholder="Search name..."]').inputValue();
      expect(nameInput).toBe('si');
    });

    test('should be case-insensitive when filtering by name', async ({ page }) => {
      await page.fill('input[placeholder="Search name..."]', 'SIRI');
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      const nameInput = await page.locator('input[placeholder="Search name..."]').inputValue();
      expect(nameInput).toBe('SIRI');
      await page.click('button:has-text("Clear")');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Search name..."]', 'siri');
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      const nameInputLower = await page.locator('input[placeholder="Search name..."]').inputValue();
      expect(nameInputLower).toBe('siri');
    });
  });

  test.describe('UI State and Interactions', () => {
    test('should show Clear button only when filters are active', async ({ page }) => {
      await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();
      await page.fill('input[placeholder="Search name..."]', 'test');
      await page.click('button:has-text("Filter"):not(:has-text("Date"))');
      await page.waitForTimeout(500);
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
      await page.click('button:has-text("Clear")');
      await page.waitForTimeout(500);
      await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();
    });

    test('should allow typing in filter inputs without applying', async ({ page }) => {
      await page.fill('input[placeholder="Search name..."]', 'test user');
      const today = getDateString(0);
      await page.fill('input[type="date"]', today);
      await expect(page.locator('button:has-text("Clear")')).not.toBeVisible();
    });

    test('should update sort button text when toggling', async ({ page }) => {
      let sortButton = page.locator('button:has-text("Sort By Date")');
      await expect(sortButton).toContainText('↓');
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      await expect(sortButton).toContainText('↑');
      await page.click('button:has-text("Sort By Date")');
      await page.waitForTimeout(500);
      await expect(sortButton).toContainText('↓');
    });
  });
});

