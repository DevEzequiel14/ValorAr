import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DollarsComponent } from './dollars.component';

describe('DollarsComponent', () => {
  let component: DollarsComponent;
  let fixture: ComponentFixture<DollarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DollarsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DollarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
