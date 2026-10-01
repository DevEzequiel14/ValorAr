import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { annualizeMonthlyPct, blueOficialSpreadPct, HomeComponent } from './home.component';
import { environment } from '../../../env/environment';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let httpMock: HttpTestingController;

  const flushBriefing = (
    dollars: unknown[] = [],
    inflation: unknown[] = [],
    plazos: unknown[] = []
  ): void => {
    httpMock.expectOne(environment.dollar + '/dolares').flush(dollars);
    httpMock.expectOne(environment.argentinaData + '/finanzas/indices/inflacion').flush(inflation);
    httpMock.expectOne(environment.argentinaData + '/finanzas/tasas/plazoFijo').flush(plazos);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    flushBriefing();
    expect(component).toBeTruthy();
  });

  it('should render the parte-del-día masthead with brand and date', () => {
    fixture.detectChanges();
    flushBriefing();
    fixture.detectChanges();

    const brand = fixture.nativeElement.querySelector('.home-brand');
    const mark = fixture.nativeElement.querySelector('.home-masthead__mark');
    const date = fixture.nativeElement.querySelector('.home-masthead__date');

    expect(brand?.textContent?.trim()).toBe('ValorAr');
    expect(mark?.textContent?.trim()).toBe('Parte del día');
    expect(date?.getAttribute('datetime')).toBe(component.todayIso);
    expect(date?.textContent?.trim()).toBe(component.todayLabel);
  });

  it('should load blue venta into the briefing snapshot', () => {
    fixture.detectChanges();
    flushBriefing(
      [
        {
          moneda: 'USD',
          casa: 'blue',
          nombre: 'Blue',
          compra: 1030,
          venta: 1050,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
      ],
      [{ fecha: '2024-11-01', valor: 2.4 }],
      [{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]
    );
    expect(component.snapshot()?.blueVenta).toBe(1050);
    expect(component.snapshot()?.ipcMensual).toBe(2.4);
    expect(component.snapshot()?.mejorTna).toBe(40);
  });

  it('should show API freshness separate from the masthead calendar date', () => {
    fixture.detectChanges();
    flushBriefing(
      [
        {
          moneda: 'USD',
          casa: 'blue',
          nombre: 'Blue',
          compra: 1030,
          venta: 1050,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
        {
          moneda: 'USD',
          casa: 'oficial',
          nombre: 'Oficial',
          compra: 680,
          venta: 700,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
      ],
      [{ fecha: '2024-11-01', valor: 2.4 }],
      [{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]
    );
    fixture.detectChanges();

    const freshness = component.dataFreshness();
    expect(freshness).toContain('Datos:');
    expect(freshness).toContain('blue');
    expect(freshness).toMatch(/IPC de /i);
    expect(fixture.nativeElement.querySelector('.feature-meta')?.textContent).toContain('Datos:');
  });

  it('should echo strip verdicts in the briefing lede instead of enumerating KPIs', () => {
    fixture.detectChanges();
    flushBriefing(
      [
        {
          moneda: 'USD',
          casa: 'blue',
          nombre: 'Blue',
          compra: 1030,
          venta: 1050,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
        {
          moneda: 'USD',
          casa: 'oficial',
          nombre: 'Oficial',
          compra: 680,
          venta: 700,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
      ],
      [{ fecha: '2024-11-01', valor: 2.4 }],
      [{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]
    );
    fixture.detectChanges();

    const lede = component.briefingLede();
    expect(lede).not.toMatch(/Hoy miramos/i);
    expect(lede).toContain(component.dollarStrip().verdict);
    expect(lede).toContain(component.tnaStrip().verdict);
  });

  it('should ask for oficial when only blue is available', () => {
    fixture.detectChanges();
    flushBriefing(
      [
        {
          moneda: 'USD',
          casa: 'blue',
          nombre: 'Blue',
          compra: 1030,
          venta: 1050,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
      ],
      [{ fecha: '2024-11-01', valor: 2.4 }],
      [{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]
    );
    expect(component.dollarStrip().verdict).toMatch(/falta el oficial/i);
    expect(component.dollarStrip().detail).toContain('IPC');
  });

  it('should close dollar strip with a spread-based verdict when blue and oficial load', () => {
    expect(blueOficialSpreadPct(1050, 700)).toBeCloseTo(50, 0);

    fixture.detectChanges();
    flushBriefing(
      [
        {
          moneda: 'USD',
          casa: 'blue',
          nombre: 'Blue',
          compra: 1030,
          venta: 1050,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
        {
          moneda: 'USD',
          casa: 'oficial',
          nombre: 'Oficial',
          compra: 680,
          venta: 700,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
      ],
      [{ fecha: '2024-11-01', valor: 2.4 }],
      [{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]
    );
    expect(component.snapshot()?.oficialVenta).toBe(700);
    expect(component.blueOficialSpread()).toBeCloseTo(50, 0);
    expect(component.dollarStrip().verdict).toMatch(/Brecha amplia/i);
    expect(component.dollarStrip().detail).toContain('IPC');
  });

  it('should annualize IPC and close TNA strip with a comparable verdict', () => {
    expect(annualizeMonthlyPct(2.4)).toBeCloseTo(32.92, 1);

    fixture.detectChanges();
    flushBriefing(
      [
        {
          moneda: 'USD',
          casa: 'blue',
          nombre: 'Blue',
          compra: 1030,
          venta: 1050,
          fechaActualizacion: '2024-12-06T16:56:00.000Z',
        },
      ],
      [{ fecha: '2024-11-01', valor: 2.4 }],
      [{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]
    );
    expect(component.tnaStrip().verdict).toMatch(/cubre|par|no alcanza/i);
    expect(component.tnaStrip().detail).toContain('anualizado');
    expect(component.ipcAnualizado()).toBeCloseTo(32.92, 1);
  });

  it('should keep the briefing when only one source fails', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(environment.dollar + '/dolares')
      .flush('fail', { status: 500, statusText: 'Error' });
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/indices/inflacion')
      .flush([{ fecha: '2024-11-01', valor: 2.4 }]);
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/tasas/plazoFijo')
      .flush([{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]);

    expect(component.loadFailed()).toBe(false);
    expect(component.hasPartialFailure()).toBe(true);
    expect(component.failedSourcesLabel()).toBe('dólar');
    expect(component.snapshot()?.dollarError).toBe(true);
    expect(component.snapshot()?.ipcMensual).toBe(2.4);
    expect(component.snapshot()?.mejorTna).toBe(40);
  });

  it('should retry a failed source without reloading the others', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(environment.dollar + '/dolares')
      .flush('fail', { status: 500, statusText: 'Error' });
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/indices/inflacion')
      .flush([{ fecha: '2024-11-01', valor: 2.4 }]);
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/tasas/plazoFijo')
      .flush([{ entidad: 'Banco Demo', logo: '', tnaClientes: 40, tnaNoClientes: 35 }]);

    component.retrySource('dollar');
    httpMock.expectOne(environment.dollar + '/dolares').flush([
      {
        moneda: 'USD',
        casa: 'blue',
        nombre: 'Blue',
        compra: 1030,
        venta: 1050,
        fechaActualizacion: '2024-12-06T16:56:00.000Z',
      },
    ]);

    expect(component.snapshot()?.dollarError).toBe(false);
    expect(component.snapshot()?.blueVenta).toBe(1050);
    expect(component.hasPartialFailure()).toBe(false);
    expect(component.snapshot()?.ipcMensual).toBe(2.4);
  });
});
