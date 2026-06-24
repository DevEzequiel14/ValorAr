import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { InflationComponent } from './inflation.component';
import { environment } from '../../../../env/environment';
import { IndiceInflacion } from '../../models/indice-inflacion';

describe('InflationComponent', () => {
  let component: InflationComponent;
  let fixture: ComponentFixture<InflationComponent>;
  let httpMock: HttpTestingController;

  const mockInflacion: IndiceInflacion[] = [
    { fecha: '2024-01-01', valor: 20.6 },
    { fecha: '2024-02-01', valor: 13.2 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InflationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InflationComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/indices/inflacion')
      .flush(mockInflacion);
    expect(component).toBeTruthy();
  });
});
