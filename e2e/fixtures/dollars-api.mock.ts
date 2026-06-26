import { Page } from '@playwright/test';

export const mockDollarsResponse = [
  {
    moneda: 'USD',
    casa: 'oficial',
    nombre: 'Oficial',
    compra: 995,
    venta: 1035,
    fechaActualizacion: '2024-12-06T13:36:00.000Z',
  },
  {
    moneda: 'USD',
    casa: 'blue',
    nombre: 'Blue',
    compra: 1030,
    venta: 1050,
    fechaActualizacion: '2024-12-06T16:56:00.000Z',
  },
];

export async function mockDollarsApi(
  page: Page,
  body: unknown = mockDollarsResponse
): Promise<void> {
  await page.route(/dolarapi\.com\/v1\/dolares/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}
