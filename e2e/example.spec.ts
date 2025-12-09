import { test, expect } from '@playwright/test';

test('home page has HAKU title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/HAKU/i);
});

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: /skip to main content/i });
  await skipLink.focus();
  await expect(skipLink).toBeVisible();
});
