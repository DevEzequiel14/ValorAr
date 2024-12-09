import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixedTermDepositComponent } from './fixed-term-deposit.component';

describe('FixedTermDepositComponent', () => {
  let component: FixedTermDepositComponent;
  let fixture: ComponentFixture<FixedTermDepositComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixedTermDepositComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FixedTermDepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
