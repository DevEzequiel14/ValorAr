import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { HomeComponent } from './home.component';
import { environment } from '../../../../env/environment';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let httpMock: HttpTestingController;

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
    httpMock.expectOne(environment.dollar + '/dolares').flush([]);
    expect(component).toBeTruthy();
  });

  it('should show blue preview when dollar data is available', () => {
    fixture.detectChanges();
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
    expect(component.bluePreview).toBe('Blue: $1.050');
  });
});
