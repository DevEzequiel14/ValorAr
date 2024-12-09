import { TestBed } from '@angular/core/testing';

import { DollarService } from './dollar.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../env/environment';
import { Dollar } from '../models/dollar';

describe('DollarService', () => {
  let service: DollarService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DollarService]
    });
    service = TestBed.inject(DollarService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch a list of dollars via getDolars', () => {
    const mockResponse: Dollar[] = [
      {
        "moneda": "USD",
        "casa": "oficial",
        "nombre": "Oficial",
        "compra": 995,
        "venta": 1035,
        "fechaActualizacion": "2024-12-06T13:36:00.000Z"
      },
      {
        "moneda": "USD",
        "casa": "blue",
        "nombre": "Blue",
        "compra": 1030,
        "venta": 1050,
        "fechaActualizacion": "2024-12-06T16:56:00.000Z"
      },
    ];

    service.getDolars().subscribe((dollars) => {
      expect(dollars.length).toBe(2);
      expect(dollars).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(environment.dollar + '/dolares');
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('should handle HTTP errors in getDolars', () => {
    const mockError = { status: 500, statusText: 'Internal Server Error' };
    service.getDolars().subscribe({
      next: () => fail('expected an error, not dollars'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
      }
    })
    const req = httpTestingController.expectOne(environment.dollar + '/dolares');
    req.flush(null, mockError);
  });

});
