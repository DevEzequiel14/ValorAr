import { expect, test } from '@playwright/test';

import { mockDollarsApi, mockDollarsResponse } from './fixtures/dollars-api.mock';

test.describe('Dollars page', () => {
  test('navigates from home and shows chart after loading', async ({ page }) => {
    await mockDollarsApi(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ValorAr', level: 1 })).toBeVisible();

    // Hub siempre está en home; el CTA del strip depende de que termine el briefing.
    await page.locator('nav.hub').getByRole('link', { name: /Dólares/ }).click();

    await expect(page).toHaveURL(/\/dollars$/);
    await expect(page.locator('app-loading')).toHaveCount(0);
    await expect(page.locator('.feature-chart canvas')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Todas las casas' })).toBeVisible();
  });

  test('shows empty state when API returns no data', async ({ page }) => {
    await mockDollarsApi(page, []);

    await page.goto('/dollars');

    await expect(page.locator('app-loading')).toHaveCount(0);
    await expect(page.locator('.state-message--empty')).toBeVisible();
    await expect(page.locator('.feature-chart canvas')).toHaveCount(0);
  });

  test('can navigate directly to dollars via URL', async ({ page }) => {
    await mockDollarsApi(page);

    await page.goto('/dollars');

    await expect(page.locator('app-loading')).toHaveCount(0);
    await expect(page.locator('.feature-chart canvas')).toBeVisible();
    expect(mockDollarsResponse.length).toBeGreaterThan(0);
  });
});
