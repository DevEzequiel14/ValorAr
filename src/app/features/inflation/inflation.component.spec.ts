import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { InflationComponent } from './inflation.component';
import { environment } from '../../../env/environment';
import { IndiceInflacion } from '../../core/models/indice-inflacion';

describe('InflationComponent', () => {
  let component: InflationComponent;
  let fixture: ComponentFixture<InflationComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = environment.argentinaData + '/finanzas/indices/inflacion';

  const mockInflacion: IndiceInflacion[] = [
    { fecha: '2023-06-15T12:00:00.000Z', valor: 5.0 },
    { fecha: '2024-01-15T12:00:00.000Z', valor: 20.6 },
    { fecha: '2024-02-15T12:00:00.000Z', valor: 13.2 },
  ];

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

  function flushSuccess(data: IndiceInflacion[] = mockInflacion): void {
    httpMock.expectOne(apiUrl).flush(data);
    fixture.detectChanges();
  }

  it('should show loading while request is pending', () => {
    initComponent();

    expect(component.loading).toBe(true);
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();

    httpMock.expectOne(apiUrl).flush(mockInflacion);
  });

  it('should populate lineChartData for the latest year after fetch', () => {
    initComponent();
    flushSuccess();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.availableYears).toEqual([2024, 2023]);
    expect(component.selectedYear).toBe(2024);
    expect(component.lineChartData.labels).toEqual(['Enero', 'Febrero']);
    expect(component.lineChartData.datasets?.[0]?.data).toEqual([20.6, 13.2]);
    expect(component.lineChartData.datasets?.[0]?.label).toBe('Índice de Inflación (2024)');
  });

  it('should update lineChartData when filtering by another year', () => {
    initComponent();
    flushSuccess();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#year');
    select.value = '2023';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(String(component.selectedYear)).toBe('2023');
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
    httpMock.expectOne(apiUrl).flush('Error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.isEmpty).toBe(false);
    expect(component.errorMessage).toBe(
      'No se pudieron cargar los datos de inflación (error 500).'
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

    expect(component.loading).toBe(true);

    httpMock.expectOne(apiUrl).flush(mockInflacion);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.lineChartData.datasets?.[0]?.data).toEqual([20.6, 13.2]);
  });
});
