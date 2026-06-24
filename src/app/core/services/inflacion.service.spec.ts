import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { InflacionService } from './inflacion.service';
import { environment } from '../../../env/environment';
import { IndiceInflacion } from '../models/indice-inflacion';

describe('InflacionService', () => {
  let service: InflacionService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InflacionService],
    });
    service = TestBed.inject(InflacionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch inflation indices via getInflacion', () => {
    const mockResponse: IndiceInflacion[] = [
      { fecha: '2024-01-01', valor: 20.6 },
      { fecha: '2024-02-01', valor: 13.2 },
    ];

    service.getInflacion().subscribe((indices) => {
      expect(indices.length).toBe(2);
      expect(indices).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(
      environment.argentinaData + '/finanzas/indices/inflacion'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle HTTP errors in getInflacion', () => {
    const mockError = { status: 500, statusText: 'Internal Server Error' };

    service.getInflacion().subscribe({
      next: () => fail('expected an error, not inflation data'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
      },
    });

    const req = httpTestingController.expectOne(
      environment.argentinaData + '/finanzas/indices/inflacion'
    );
    req.flush(null, mockError);
  });
});
