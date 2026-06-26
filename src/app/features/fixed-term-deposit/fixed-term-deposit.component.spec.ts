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

    httpMock.expectOne(apiUrl).flush(mockPlazoFijo);
  });

  it('should set chart data after successful response', () => {
    initComponent();
    httpMock.expectOne(apiUrl).flush(mockPlazoFijo);
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
    expect(component.errorMessage).toBe(
      'No se pudieron cargar las tasas de plazo fijo (error 500).'
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

    httpMock.expectOne(apiUrl).flush(mockPlazoFijo);
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBeNull();
    expect(component.isEmpty).toBe(false);
    expect(component.barChartData.labels).toEqual(['Banco Test', 'Banco Norte']);
  });
});
