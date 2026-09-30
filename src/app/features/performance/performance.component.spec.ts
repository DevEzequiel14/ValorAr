import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PerformanceComponent } from './performance.component';
import { environment } from '../../../env/environment';
import { Performance } from '../../core/models/performance';
import { FixedTermDeposit } from '../../core/models/fixed-term-deposit';
import { IndiceInflacion } from '../../core/models/indice-inflacion';

describe('PerformanceComponent', () => {
  let component: PerformanceComponent;
  let fixture: ComponentFixture<PerformanceComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = environment.argentinaData + '/finanzas/rendimientos';
  const plazoUrl = environment.argentinaData + '/finanzas/tasas/plazoFijo';
  const inflationUrl = environment.argentinaData + '/finanzas/indices/inflacion';

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

  const mockPlazo: FixedTermDeposit[] = [
    {
      entidad: 'Banco TNA',
      logo: '',
      tnaClientes: 70,
      tnaNoClientes: 65,
    },
  ];

  const mockInflacion: IndiceInflacion[] = [
    { fecha: '2024-01-15T12:00:00.000Z', valor: 20.6 },
    { fecha: '2024-02-15T12:00:00.000Z', valor: 13.2 },
  ];

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

  function flushAll(
    performance: Performance[] | 'error' = mockPerformance,
    plazos: FixedTermDeposit[] | 'error' = mockPlazo,
    inflation: IndiceInflacion[] | 'error' = mockInflacion
  ): void {
    const perfReq = httpMock.expectOne(apiUrl);
    const plazoReq = httpMock.expectOne(plazoUrl);
    const inflationReq = httpMock.expectOne(inflationUrl);

    if (performance === 'error') {
      // Completar siblings primero para no cancelar el forkJoin por error en performance.
      if (plazos === 'error') {
        plazoReq.flush('Error', { status: 500, statusText: 'Server Error' });
      } else {
        plazoReq.flush(plazos);
      }
      if (inflation === 'error') {
        inflationReq.flush('Error', { status: 500, statusText: 'Server Error' });
      } else {
        inflationReq.flush(inflation);
      }
      perfReq.flush('Error', { status: 500, statusText: 'Server Error' });
      return;
    }

    if (plazos === 'error') {
      plazoReq.flush('Error', { status: 500, statusText: 'Server Error' });
    } else {
      plazoReq.flush(plazos);
    }
    if (inflation === 'error') {
      inflationReq.flush('Error', { status: 500, statusText: 'Server Error' });
    } else {
      inflationReq.flush(inflation);
    }
    perfReq.flush(performance);
  }

  function flushSuccess(data: Performance[] = mockPerformance): void {
    flushAll(data);
    fixture.detectChanges();
  }

  it('should show loading while request is pending', () => {
    initComponent();

    expect(component.loading).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    flushAll();
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

  it('should echo parte TNA and IPC anualizado in hero for ARS', () => {
    initComponent();
    flushSuccess();

    expect(component.bestTna).toBe(70);
    expect(component.bestTnaEntity).toBe('Banco TNA');
    expect(component.ipcAnualizado).not.toBeNull();
    expect(component.gapEcho).toMatch(/APY/i);
    expect(fixture.nativeElement.textContent).toContain('IPC anualizado · parte');
    expect(fixture.nativeElement.textContent).toMatch(/compuesto del último IPC/i);
    expect(fixture.nativeElement.textContent).toContain('TNA tope · parte');
  });

  it('should show data freshness meta with IPC period and rate honesty', () => {
    initComponent();
    flushSuccess();

    expect(component.dataFreshness).toMatch(/^Datos:/);
    expect(component.dataFreshness).toMatch(/IPC de/i);
    expect(component.dataFreshness).toMatch(/APY sin timestamp/i);
    expect(component.dataFreshness).toMatch(/TNA sin timestamp/i);
    expect(fixture.nativeElement.querySelector('.feature-meta')?.textContent).toContain('Datos:');
  });

  it('should keep rendimientos when plazo or inflation fails', () => {
    initComponent();
    flushAll(mockPerformance, 'error', 'error');
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.bestApy).toBe(80);
    expect(component.bestTna).toBeNull();
    expect(component.ipcAnualizado).toBeNull();
    expect(component.heroLede).toMatch(/falta TNA o IPC/i);
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
    expect(component.heroLede).toMatch(/aplica a pesos/i);
  });

  it('should hide parte TNA/IPC KPIs when currency is not ARS', () => {
    initComponent();
    flushSuccess();
    expect(component.showParteCross).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('IPC anualizado · parte');

    component.onCurrencyChange('USD');
    fixture.detectChanges();

    expect(component.showParteCross).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('IPC anualizado · parte');
    expect(fixture.nativeElement.textContent).not.toContain('TNA tope · parte');
    expect(fixture.nativeElement.textContent).toContain('APY tope · USD');
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
    flushAll('error');
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBe(
      'No se pudieron cargar los rendimientos. Intentá de nuevo en unos minutos.'
    );
    expect(fixture.nativeElement.querySelector('.state-message--error')).toBeTruthy();
  });

  it('should retry fetch when StateMessage emits retry', () => {
    initComponent();
    flushAll('error');
    fixture.detectChanges();

    const retryButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.state-message__retry');
    expect(retryButton).toBeTruthy();
    retryButton!.click();
    fixture.detectChanges();

    expect(component.loading).toBe(true);

    flushSuccess();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.barChartData.labels).toEqual(['Banco A']);
  });
});
