import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toBeVisible();

    // Should have navigation elements
    const nav = page.locator('nav, [role="navigation"], header').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to folder routes', async ({ page }) => {
    await page.goto('/folder/illustrations');
    await expect(page).toHaveURL(/\/folder\/illustrations/);

    const main = page.locator('main, [role="main"], #main-content').first();
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/page/about');
    await expect(page).toHaveURL(/\/page\/about/);

    const content = page.locator('main, [role="main"], .txt-viewer, [class*="viewer"]').first();
    await expect(content).toBeVisible({ timeout: 5000 });

    await page.goto('/page/contact');
    await expect(page).toHaveURL(/\/page\/contact/);
  });

  test('should maintain navigation history', async ({ page }) => {
    // Navigate to a nested route
    await page.goto('/folder/character-designs');

    // The in-app back button should take the user one level up
    const backButton = page.getByRole('button', { name: /go back/i });

    await backButton.click();
    await expect(page).toHaveURL('/');

    // Once at home, the back button should be disabled
    await expect(backButton).toBeDisabled();
  });

  test('should handle direct URL access to all routes', async ({ page }) => {
    const routes = [
      '/folder/character-designs',
      '/folder/fan-arts',
      '/folder/illustrations',
      '/page/about',
      '/page/contact',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const errorText = await body.textContent();
      expect(errorText?.toLowerCase()).not.toContain('404');
    }
  });

  test('should have responsive navigation elements', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"], header, .top-bar, [class*="topbar"]').first();
    await expect(nav).toBeVisible({ timeout: 5000 });

    const main = page.locator('main, [role="main"], #main-content, [class*="content"]').first();
    await expect(main).toBeVisible({ timeout: 5000 });
  });
});

// Lightbox tests - skipped until images are added to the project
test.describe.skip('Lightbox Integration (requires image data)', () => {
  test('should open lightbox when image is clicked', async ({ page }) => {
    await page.goto('/folder/illustrations');

    const imageButton = page.locator('button').filter({
      has: page.locator('img[alt]:not([alt*="icon"])')
    }).first();

    await imageButton.click();

    const lightbox = page.locator('[role="dialog"]').first();
    await expect(lightbox).toBeVisible({ timeout: 3000 });
  });

  test('should navigate through gallery with arrow keys', async ({ page }) => {
    await page.goto('/folder/illustrations');

    const imageButton = page.locator('button').filter({
      has: page.locator('img[alt]:not([alt*="icon"])')
    }).first();

    await imageButton.click();

    const lightbox = page.locator('[role="dialog"]').first();
    await expect(lightbox).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    await expect(lightbox).toBeVisible();
  });

  test('should close lightbox with Escape key', async ({ page }) => {
    await page.goto('/folder/illustrations');

    const imageButton = page.locator('button').filter({
      has: page.locator('img[alt]:not([alt*="icon"])')
    }).first();

    await imageButton.click();

    const lightbox = page.locator('[role="dialog"]').first();
    await expect(lightbox).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden({ timeout: 2000 });
  });
});
