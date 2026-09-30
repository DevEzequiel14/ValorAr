import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  DOLLARS_VISIBLE_LIMIT,
  DollarsComponent,
  prioritizeDollars,
} from './dollars.component';
import { environment } from '../../../env/environment';
import { Dollar } from '../../core/models/dollar';

describe('DollarsComponent', () => {
  let component: DollarsComponent;
  let fixture: ComponentFixture<DollarsComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = environment.dollar + '/dolares';

  const mockDollars: Dollar[] = [
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
      compra: 1200,
      venta: 1220,
      fechaActualizacion: '2024-12-06T13:36:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DollarsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DollarsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function initComponent(): void {
    fixture.detectChanges();
  }

  it('should create', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show loading while request is pending', () => {
    initComponent();

    expect(component.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    httpMock.expectOne(apiUrl).flush(mockDollars);
  });

  it('should set chart data after successful response', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.isEmpty()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.barChartData.labels).toEqual(['Blue', 'Oficial']);
    expect(component.barChartData.datasets?.[0]?.data).toEqual([1200, 995]);
    expect(component.barChartData.datasets?.[1]?.data).toEqual([1220, 1035]);
    expect(component.blueVenta()).toBe(1220);
    expect(component.oficialVenta()).toBe(1035);
  });

  it('should echo the home dollar-gap reading in the hero', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();

    // (1220 - 1035) / 1035 ≈ 17.9% → brecha acotada
    expect(component.blueOficialSpread()).toBeCloseTo(17.87, 1);
    expect(component.gapEcho()).toMatch(/Brecha acotada/i);
    expect(component.heroLede()).toContain('Abajo, compra y venta');
    expect(fixture.nativeElement.textContent).toContain('Brecha blue / oficial');
  });

  it('should show freshness with Datos: prefix like the parte', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();

    expect(component.lastUpdated).toMatch(/^Datos:/);
    expect(component.lastUpdated).toMatch(/cotizaciones/i);
    expect(fixture.nativeElement.querySelector('.feature-meta')?.textContent).toContain('Datos:');
  });

  it('should set isEmpty when response is an empty array', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush([]);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.isEmpty()).toBe(true);
    expect(component.errorMessage()).toBeNull();
    expect(fixture.nativeElement.querySelector('.state-message--empty')).toBeTruthy();
  });

  it('should set errorMessage on HTTP error', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.isEmpty()).toBe(false);
    expect(component.errorMessage()).toBe(
      'No se pudieron cargar las cotizaciones. Intentá de nuevo en unos minutos.'
    );
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

    expect(component.loading()).toBe(true);

    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.isEmpty()).toBe(false);
    expect(component.barChartData.labels).toEqual(['Blue', 'Oficial']);
  });

  it('should prioritize blue and oficial over the rest', () => {
    const ordered = prioritizeDollars([
      { ...mockDollars[0], casa: 'tarjeta', nombre: 'Tarjeta' },
      { ...mockDollars[1] },
      { ...mockDollars[0], casa: 'oficial', nombre: 'Oficial' },
      { ...mockDollars[0], casa: 'bolsa', nombre: 'Bolsa' },
    ]);
    expect(ordered.map((d) => d.nombre)).toEqual(['Blue', 'Oficial', 'Bolsa', 'Tarjeta']);
  });

  it('should show only the principal casas by default when there are many', () => {
    const many: Dollar[] = [
      { ...mockDollars[1] },
      { ...mockDollars[0] },
      { ...mockDollars[0], casa: 'bolsa', nombre: 'Bolsa', compra: 1100, venta: 1110 },
      {
        ...mockDollars[0],
        casa: 'contadoliqui',
        nombre: 'Contado con liqui',
        compra: 1090,
        venta: 1100,
      },
      { ...mockDollars[0], casa: 'tarjeta', nombre: 'Tarjeta', compra: 1300, venta: 1320 },
      { ...mockDollars[0], casa: 'mayorista', nombre: 'Mayorista', compra: 980, venta: 990 },
      { ...mockDollars[0], casa: 'cripto', nombre: 'Cripto', compra: 1205, venta: 1215 },
    ];

    initComponent();
    httpMock.expectOne(apiUrl).flush(many);
    fixture.detectChanges();

    expect(component.showingPartial()).toBe(true);
    expect(component.barChartData.labels?.length).toBe(DOLLARS_VISIBLE_LIMIT);
    expect(component.barChartData.labels).toEqual([
      'Blue',
      'Oficial',
      'Bolsa',
      'Contado con liqui',
      'Tarjeta',
    ]);

    component.toggleShowAllCasas();
    fixture.detectChanges();

    expect(component.showAllCasas()).toBe(true);
    expect(component.barChartData.labels?.length).toBe(many.length);
  });
});
