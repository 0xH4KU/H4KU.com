import { test, expect } from '@playwright/test';

const contactSelectors = {
  name: 'Name:',
  email: 'Email:',
  message: 'Message:',
  submit: 'Send Message',
};

test.describe('Lum.bio smoke E2E', () => {
  test('about page renders', async ({ page }) => {
    await page.goto('/page/about');
    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('contact form validation and success path', async ({ page }) => {
    await page.goto('/page/contact');

    // Disable native HTML5 validation so we can hit custom validation paths.
    await page.locator('form').evaluate(form => form.setAttribute('novalidate', 'true'));

    // Mock backend so the form can succeed without a real API.
    // Intercept contact submissions regardless of absolute/relative endpoint
    await page.route('**/contact', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, referenceId: 'e2e-ref' }),
      });
    });

    // Missing fields + potential too-fast submit -> should show a visible error
    await page.getByRole('button', { name: contactSelectors.submit }).click();
    const initialError = page.getByText(
      /Please (take your time filling out the form|fill in all fields)/i
    );
    await expect(initialError).toBeVisible();

    // Invalid email
    await page.waitForTimeout(1100); // satisfy min fill time before next submit
    await page.getByLabel(contactSelectors.name).fill('Playwright Bot');
    await page.getByLabel(contactSelectors.email).fill('bot@example');
    await page.getByLabel(contactSelectors.message).fill('Hello');
    await page.getByRole('button', { name: contactSelectors.submit }).click();
    await expect(page.getByText(/valid email address/i)).toBeVisible();

    // Valid submission (network mocked by service) should show success toast
    await page.waitForTimeout(1100);
    await page.getByLabel(contactSelectors.email).fill('bot@example.com');
    await page.getByRole('button', { name: contactSelectors.submit }).click();
    await expect(
      page.getByText(/Message sent successfully!/i)
    ).toBeVisible();
  });
});
