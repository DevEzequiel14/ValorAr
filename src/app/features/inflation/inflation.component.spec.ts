import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { InflationComponent } from './inflation.component';
import { environment } from '../../../env/environment';
import { IndiceInflacion } from '../../core/models/indice-inflacion';
import { FixedTermDeposit } from '../../core/models/fixed-term-deposit';

describe('InflationComponent', () => {
  let component: InflationComponent;
  let fixture: ComponentFixture<InflationComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = environment.argentinaData + '/finanzas/indices/inflacion';
  const plazoUrl = environment.argentinaData + '/finanzas/tasas/plazoFijo';

  const mockInflacion: IndiceInflacion[] = [
    { fecha: '2023-06-15T12:00:00.000Z', valor: 5.0 },
    { fecha: '2024-01-15T12:00:00.000Z', valor: 20.6 },
    { fecha: '2024-02-15T12:00:00.000Z', valor: 13.2 },
  ];

  const mockPlazos: FixedTermDeposit[] = [
    { entidad: 'Banco Test', logo: '', tnaClientes: 50, tnaNoClientes: 45 },
  ];

  const flushInflationAndPlazo = (
    inflation: IndiceInflacion[] | 'error' = mockInflacion,
    plazos: FixedTermDeposit[] | 'error' = mockPlazos
  ): void => {
    const inflationReq = httpMock.expectOne(apiUrl);
    const plazoReq = httpMock.expectOne(plazoUrl);

    const flushPlazo = (): void => {
      if (plazos === 'error') {
        plazoReq.flush('Error', { status: 500, statusText: 'Server Error' });
      } else {
        plazoReq.flush(plazos);
      }
    };

    // Si inflación falla, forkJoin cancela plazos: completar plazos primero.
    if (inflation === 'error') {
      flushPlazo();
      inflationReq.flush('Error', { status: 500, statusText: 'Server Error' });
      return;
    }

    inflationReq.flush(inflation);
    flushPlazo();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InflationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(InflationComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent(): void {
    fixture.detectChanges();
  }

  function flushSuccess(
    data: IndiceInflacion[] = mockInflacion,
    plazos: FixedTermDeposit[] = mockPlazos
  ): void {
    flushInflationAndPlazo(data, plazos);
    fixture.detectChanges();
  }

  it('should show loading while request is pending', () => {
    initComponent();

    expect(component.loading).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    flushInflationAndPlazo();
  });

  it('should populate lineChartData for the latest year after fetch', () => {
    initComponent();
    flushSuccess();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.availableYears).toEqual(['2024', '2023']);
    expect(component.selectedYear).toBe('2024');
    expect(component.lineChartData.labels).toEqual(['Enero', 'Febrero']);
    expect(component.lineChartData.datasets?.[0]?.data).toEqual([20.6, 13.2]);
    expect(component.lineChartData.datasets?.[0]?.label).toBe('Índice de Inflación (2024)');
  });

  it('should echo the home TNA vs IPC reading in the hero', () => {
    initComponent();
    flushSuccess();

    // Latest overall IPC = 13.2% → anualizado ~358%; TNA 50% → no alcanza
    expect(component.parteIpcAnualizado).toBeCloseTo((Math.pow(1 + 13.2 / 100, 12) - 1) * 100, 0);
    expect(component.bestTna).toBe(50);
    expect(component.gapEcho).toMatch(/no alcanza/i);
    expect(component.heroLede).toMatch(/año elegido|parte/i);
    expect(fixture.nativeElement.textContent).toContain('Cruce del parte');
    expect(fixture.nativeElement.textContent).toContain('TNA tope · parte');
    expect(fixture.nativeElement.textContent).toContain('IPC anualizado · parte');
    expect(fixture.nativeElement.textContent).toMatch(/compuesto del último IPC/i);
    expect(fixture.nativeElement.textContent).toMatch(/no el año del gráfico/i);
  });

  it('should show data freshness meta with IPC period and TNA honesty', () => {
    initComponent();
    flushSuccess();

    expect(component.dataFreshness).toMatch(/^Datos:/);
    expect(component.dataFreshness).toMatch(/IPC de/i);
    expect(component.dataFreshness).toMatch(/TNA sin timestamp/i);
    expect(fixture.nativeElement.querySelector('.feature-meta')?.textContent).toContain('Datos:');
  });

  it('should keep inflation when plazo fails', () => {
    initComponent();
    flushInflationAndPlazo(mockInflacion, 'error');
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.lineChartData.datasets?.[0]?.data).toEqual([20.6, 13.2]);
    expect(component.gapEcho).toMatch(/falta la TNA/i);
  });

  it('should update lineChartData when filtering by another year', () => {
    initComponent();
    flushSuccess();

    component.onYearChange('2023');
    fixture.detectChanges();

    expect(component.selectedYear).toBe('2023');
    expect(component.lineChartData.labels).toEqual([
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
    ]);
    expect(component.lineChartData.datasets?.[0]?.data).toEqual([0, 0, 0, 0, 0, 5.0]);
    expect(component.lineChartData.datasets?.[0]?.label).toBe('Índice de Inflación (2023)');
  });

  it('should set isEmpty when response is an empty array', () => {
    initComponent();
    flushSuccess([]);

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(true);
    expect(component.errorMessage).toBeNull();
    expect(fixture.nativeElement.querySelector('.state-message--empty')).toBeTruthy();
  });

  it('should set errorMessage on HTTP error', () => {
    initComponent();
    flushInflationAndPlazo('error');
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBe(
      'No se pudieron cargar los datos de inflación. Intentá de nuevo en unos minutos.'
    );
    expect(fixture.nativeElement.querySelector('.state-message--error')).toBeTruthy();
  });

  it('should retry fetch when StateMessage emits retry', () => {
    initComponent();
    flushInflationAndPlazo('error');
    fixture.detectChanges();

    const retryButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.state-message__retry');
    expect(retryButton).toBeTruthy();
    retryButton!.click();
    fixture.detectChanges();

    expect(component.loading).toBe(true);

    flushInflationAndPlazo();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.lineChartData.datasets?.[0]?.data).toEqual([20.6, 13.2]);
  });
});
