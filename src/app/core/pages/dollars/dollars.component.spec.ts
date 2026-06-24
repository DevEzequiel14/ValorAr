import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DollarsComponent } from './dollars.component';
import { environment } from '../../../../env/environment';
import { Dollar } from '../../models/dollar';

describe('DollarsComponent', () => {
  let component: DollarsComponent;
  let fixture: ComponentFixture<DollarsComponent>;
  let httpMock: HttpTestingController;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DollarsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DollarsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpMock.expectOne(environment.dollar + '/dolares').flush(mockDollars);
    expect(component).toBeTruthy();
  });
});
