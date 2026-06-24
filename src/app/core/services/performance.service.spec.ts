import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PerformanceService } from './performance.service';
import { environment } from '../../../env/environment';
import { Performance } from '../models/performance';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PerformanceService],
    });
    service = TestBed.inject(PerformanceService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch performance data via getPerformance', () => {
    const mockResponse: Performance[] = [
      {
        entidad: 'Banco Test',
        rendimientos: [{ moneda: 'USD', apy: 5.2 }],
      },
    ];

    service.getPerformance().subscribe((performance) => {
      expect(performance.length).toBe(1);
      expect(performance).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(
      environment.argentinaData + '/finanzas/rendimientos'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle HTTP errors in getPerformance', () => {
    const mockError = { status: 500, statusText: 'Internal Server Error' };

    service.getPerformance().subscribe({
      next: () => fail('expected an error, not performance data'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
      },
    });

    const req = httpTestingController.expectOne(
      environment.argentinaData + '/finanzas/rendimientos'
    );
    req.flush(null, mockError);
  });
});
