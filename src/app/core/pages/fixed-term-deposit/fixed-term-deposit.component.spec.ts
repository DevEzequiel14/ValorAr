import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { FixedTermDepositComponent } from './fixed-term-deposit.component';
import { environment } from '../../../../env/environment';
import { FixedTermDeposit } from '../../models/fixed-term-deposit';

describe('FixedTermDepositComponent', () => {
  let component: FixedTermDepositComponent;
  let fixture: ComponentFixture<FixedTermDepositComponent>;
  let httpMock: HttpTestingController;

  const mockPlazoFijo: FixedTermDeposit[] = [
    {
      entidad: 'Banco Test',
      logo: '',
      tnaClientes: 50,
      tnaNoClientes: 45,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedTermDepositComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FixedTermDepositComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(environment.argentinaData + '/finanzas/tasas/plazoFijo')
      .flush(mockPlazoFijo);
    expect(component).toBeTruthy();
  });
});
