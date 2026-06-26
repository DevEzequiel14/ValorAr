import { expect, test } from '@playwright/test';

import { mockDollarsApi, mockDollarsResponse } from './fixtures/dollars-api.mock';

test.describe('Dollars page', () => {
  test('navigates from home and shows chart after loading', async ({ page }) => {
    await mockDollarsApi(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'ValorAr', level: 1 })).toBeVisible();

    await page
      .getByRole('article')
      .filter({ hasText: 'Dólares' })
      .getByRole('link', { name: 'Ver gráfico' })
      .click();

    await expect(page).toHaveURL(/\/dollars$/);
    await expect(page.locator('app-loading')).toHaveCount(0);
    await expect(page.locator('.chart-container canvas')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Cotizaciones de todas las casas de cambio' })
    ).toBeVisible();
  });

  test('shows empty state when API returns no data', async ({ page }) => {
    await mockDollarsApi(page, []);

    await page.goto('/dollars');

    await expect(page.locator('app-loading')).toHaveCount(0);
    await expect(page.locator('.state-message--empty')).toBeVisible();
    await expect(page.locator('.chart-container canvas')).toHaveCount(0);
  });

  test('can navigate directly to dollars via URL', async ({ page }) => {
    await mockDollarsApi(page);

    await page.goto('/dollars');

    await expect(page.locator('app-loading')).toHaveCount(0);
    await expect(page.locator('.chart-container canvas')).toBeVisible();
    expect(mockDollarsResponse.length).toBeGreaterThan(0);
  });
});
