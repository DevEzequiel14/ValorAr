import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { FixedTermDepositComponent } from './fixed-term-deposit.component';
import { environment } from '../../../env/environment';
import { FixedTermDeposit } from '../../core/models/fixed-term-deposit';

describe('FixedTermDepositComponent', () => {
  let component: FixedTermDepositComponent;
  let fixture: ComponentFixture<FixedTermDepositComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = environment.argentinaData + '/finanzas/tasas/plazoFijo';
  const inflationUrl = environment.argentinaData + '/finanzas/indices/inflacion';

  const mockPlazoFijo: FixedTermDeposit[] = [
    {
      entidad: 'Banco Test',
      logo: '',
      tnaClientes: 50,
      tnaNoClientes: 45,
    },
    {
      entidad: 'Banco Norte',
      logo: '',
      tnaClientes: 48,
      tnaNoClientes: 42,
    },
  ];

  const mockInflation = [{ fecha: '2024-11-01', valor: 2.4 }];

  const flushPlazoAndInflation = (
    plazos: FixedTermDeposit[] | 'error' = mockPlazoFijo,
    inflation: unknown[] | 'error' = mockInflation
  ): void => {
    const plazoReq = httpMock.expectOne(apiUrl);
    const inflationReq = httpMock.expectOne(inflationUrl);

    const flushInflation = (): void => {
      if (inflation === 'error') {
        inflationReq.flush('Error', { status: 500, statusText: 'Server Error' });
      } else {
        inflationReq.flush(inflation);
      }
    };

    // Si plazos falla, forkJoin cancela inflación: completar inflación primero.
    if (plazos === 'error') {
      flushInflation();
      plazoReq.flush('Error', { status: 500, statusText: 'Server Error' });
      return;
    }

    plazoReq.flush(plazos);
    flushInflation();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedTermDepositComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(FixedTermDepositComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent(): void {
    fixture.detectChanges();
  }

  it('should show loading while request is pending', () => {
    initComponent();

    expect(component.loading).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    flushPlazoAndInflation();
  });

  it('should set chart data after successful response', () => {
    initComponent();
    flushPlazoAndInflation();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.barChartData.labels).toEqual(['Banco Test', 'Banco Norte']);
    expect(component.barChartData.datasets?.[0]?.data).toEqual([50, 48]);
    expect(component.barChartData.datasets?.[1]?.data).toEqual([45, 42]);
    expect(component.barChartData.datasets?.[0]?.label).toBe('TNA Clientes');
    expect(component.barChartData.datasets?.[1]?.label).toBe('TNA No Clientes');
  });

  it('should echo the home TNA vs IPC reading in the hero', () => {
    initComponent();
    flushPlazoAndInflation();
    fixture.detectChanges();

    expect(component.ipcMensual).toBe(2.4);
    expect(component.ipcAnualizado).toBeCloseTo(32.92, 1);
    expect(component.gapEcho).toMatch(/cubre/i);
    expect(component.heroLede).toContain('Abajo, TNA por entidad');
    expect(fixture.nativeElement.textContent).toContain('IPC anualizado · parte');
    expect(fixture.nativeElement.textContent).toMatch(/compuesto del último IPC/i);
  });

  it('should show data freshness meta with IPC period and TNA honesty', () => {
    initComponent();
    flushPlazoAndInflation();
    fixture.detectChanges();

    expect(component.dataFreshness).toMatch(/^Datos:/);
    expect(component.dataFreshness).toMatch(/IPC de/i);
    expect(component.dataFreshness).toMatch(/TNA sin timestamp/i);
    expect(fixture.nativeElement.querySelector('.feature-meta')?.textContent).toContain('Datos:');
  });

  it('should keep plazos when inflation fails', () => {
    initComponent();
    flushPlazoAndInflation(mockPlazoFijo, 'error');
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.bestTna).toBe(50);
    expect(component.gapEcho).toMatch(/falta el IPC/i);
  });

  it('should set isEmpty when response is an empty array', () => {
    initComponent();
    flushPlazoAndInflation([]);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(true);
    expect(component.errorMessage).toBeNull();
    expect(fixture.nativeElement.querySelector('.state-message--empty')).toBeTruthy();
  });

  it('should set errorMessage on HTTP error', () => {
    initComponent();
    flushPlazoAndInflation('error');
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBe(
      'No se pudieron cargar las tasas de plazo fijo. Intentá de nuevo en unos minutos.'
    );
    expect(fixture.nativeElement.querySelector('.state-message--error')).toBeTruthy();
  });

  it('should retry fetch when StateMessage emits retry', () => {
    initComponent();
    flushPlazoAndInflation('error');
    fixture.detectChanges();

    const retryButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.state-message__retry');
    expect(retryButton).toBeTruthy();
    retryButton!.click();
    fixture.detectChanges();

    expect(component.loading).toBe(true);

    flushPlazoAndInflation();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.barChartData.labels).toEqual(['Banco Test', 'Banco Norte']);
  });
});
