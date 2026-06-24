import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { FixedTermDepositService } from './fixed-term-deposit.service';
import { environment } from '../../../env/environment';
import { FixedTermDeposit } from '../models/fixed-term-deposit';

describe('FixedTermDepositService', () => {
  let service: FixedTermDepositService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FixedTermDepositService],
    });
    service = TestBed.inject(FixedTermDepositService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch fixed term deposit rates via getPlazoFijo', () => {
    const mockResponse: FixedTermDeposit[] = [
      {
        entidad: 'Banco Test',
        logo: '',
        tnaClientes: 50,
        tnaNoClientes: 45,
      },
    ];

    service.getPlazoFijo().subscribe((rates) => {
      expect(rates.length).toBe(1);
      expect(rates).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(
      environment.argentinaData + '/finanzas/tasas/plazoFijo'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle HTTP errors in getPlazoFijo', () => {
    const mockError = { status: 500, statusText: 'Internal Server Error' };

    service.getPlazoFijo().subscribe({
      next: () => fail('expected an error, not fixed term deposit data'),
      error: (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe('Internal Server Error');
      },
    });

    const req = httpTestingController.expectOne(
      environment.argentinaData + '/finanzas/tasas/plazoFijo'
    );
    req.flush(null, mockError);
  });
});
