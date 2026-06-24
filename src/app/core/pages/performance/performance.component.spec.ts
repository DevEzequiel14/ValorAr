import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PerformanceComponent } from './performance.component';
import { environment } from '../../../../env/environment';
import { Performance } from '../../models/performance';

describe('PerformanceComponent', () => {
  let component: PerformanceComponent;
  let fixture: ComponentFixture<PerformanceComponent>;
  let httpMock: HttpTestingController;

  const mockPerformance: Performance[] = [
    {
      entidad: 'Banco Test',
      rendimientos: [{ moneda: 'USD', apy: 5.2 }],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/rendimientos')
      .flush(mockPerformance);
    expect(component).toBeTruthy();
  });
});
