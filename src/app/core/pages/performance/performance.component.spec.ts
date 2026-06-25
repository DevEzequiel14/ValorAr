import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PerformanceComponent } from './performance.component';
import { environment } from '../../../../env/environment';
import { Performance } from '../../models/performance';
import { registerChartJs } from '../../../shared/charts/chart-register';

describe('PerformanceComponent', () => {
  let component: PerformanceComponent;
  let fixture: ComponentFixture<PerformanceComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = environment.argentinaData + '/finanzas/rendimientos';

  const mockPerformance: Performance[] = [
    {
      entidad: 'Banco A',
      rendimientos: [
        { moneda: 'USD', apy: 5.2 },
        { moneda: 'ARS', apy: 80.0 },
      ],
    },
    {
      entidad: 'Banco B',
      rendimientos: [{ moneda: 'USD', apy: 4.1 }],
    },
  ];

  beforeAll(() => {
    registerChartJs();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent(): void {
    fixture.detectChanges();
  }

  function flushSuccess(data: Performance[] = mockPerformance): void {
    httpMock.expectOne(apiUrl).flush(data);
    fixture.detectChanges();
  }

  it('should show loading while request is pending', () => {
    initComponent();

    expect(component.loading).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    httpMock.expectOne(apiUrl).flush(mockPerformance);
  });

  it('should expose available currencies and chart data for default currency', () => {
    initComponent();
    flushSuccess();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.availableCurrencies).toEqual(['ARS', 'USD']);
    expect(component.selectedCurrency).toBe('ARS');
    expect(component.barChartData.labels).toEqual(['Banco A']);
    expect(component.barChartData.datasets?.[0]?.data).toEqual([80.0]);
    expect(component.barChartData.datasets?.[0]?.label).toBe('Rendimientos en ARS');
  });

  it('should update barChartData when currency changes', () => {
    initComponent();
    flushSuccess();

    component.onCurrencyChange('USD');
    fixture.detectChanges();

    expect(component.selectedCurrency).toBe('USD');
    expect(component.barChartData.labels).toEqual(['Banco A', 'Banco B']);
    expect(component.barChartData.datasets?.[0]?.data).toEqual([5.2, 4.1]);
    expect(component.barChartData.datasets?.[0]?.label).toBe('Rendimientos en USD');
  });

  it('should set isEmpty when response is an empty array', () => {
    initComponent();
    flushSuccess([]);

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(true);
    expect(component.errorMessage).toBeNull();
    expect(fixture.nativeElement.querySelector('.state-message--empty')).toBeTruthy();
  });

  it('should set isEmpty when no currency has APY data', () => {
    initComponent();
    flushSuccess([
      {
        entidad: 'Banco Sin APY',
        rendimientos: [{ moneda: 'USD', apy: 0 }],
      },
    ]);

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(true);
    expect(component.availableCurrencies).toEqual([]);
    expect(fixture.nativeElement.querySelector('.state-message--empty')).toBeTruthy();
  });

  it('should set errorMessage on HTTP error', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBe('No se pudieron cargar los rendimientos (error 500).');
    expect(fixture.nativeElement.querySelector('.state-message--error')).toBeTruthy();
  });

  it('should retry fetch when StateMessage emits retry', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const retryButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.state-message__retry');
    expect(retryButton).toBeTruthy();
    retryButton!.click();
    fixture.detectChanges();

    expect(component.loading).toBe(true);

    httpMock.expectOne(apiUrl).flush(mockPerformance);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.barChartData.labels).toEqual(['Banco A']);
  });
});
