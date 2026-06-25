import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DollarsComponent } from './dollars.component';
import { environment } from '../../../../env/environment';
import { Dollar } from '../../models/dollar';
import { registerChartJs } from '../../../shared/charts/chart-register';

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
  ];

  beforeAll(() => {
    registerChartJs();
  });

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

    expect(component.loading).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    httpMock.expectOne(apiUrl).flush(mockDollars);
  });

  it('should set chart data after successful response', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.barChartData.labels).toEqual(['Oficial']);
    expect(component.barChartData.datasets?.[0]?.data).toEqual([995]);
    expect(component.barChartData.datasets?.[1]?.data).toEqual([1035]);
    expect(component.barChartData.datasets?.[0]?.label).toBe('Compra');
    expect(component.barChartData.datasets?.[1]?.label).toBe('Venta');
  });

  it('should set isEmpty when response is an empty array', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush([]);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(true);
    expect(component.errorMessage).toBeNull();
    expect(fixture.nativeElement.querySelector('.state-message--empty')).toBeTruthy();
  });

  it('should set errorMessage on HTTP error', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBe('No se pudieron cargar las cotizaciones (error 500).');
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

    httpMock.expectOne(apiUrl).flush(mockDollars);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.barChartData.labels).toEqual(['Oficial']);
  });
});
