import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateMessageComponent } from './state-message.component';

describe('StateMessageComponent', () => {
  let component: StateMessageComponent;
  let fixture: ComponentFixture<StateMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StateMessageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StateMessageComponent);
    component = fixture.componentInstance;
  });

  function render(type: 'error' | 'empty', message: string, showRetry = false): void {
    component.type = type;
    component.message = message;
    component.showRetry = showRetry;
    fixture.detectChanges();
  }

  it('should render error message with error styling', () => {
    render('error', 'No se pudieron cargar los datos.');

    const root = fixture.nativeElement.querySelector('.state-message');
    expect(root.classList.contains('state-message--error')).toBeTrue();
    expect(root.classList.contains('state-message--empty')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.state-message__text').textContent).toContain(
      'No se pudieron cargar los datos.'
    );
  });

  it('should render empty message with empty styling', () => {
    render('empty', 'No hay datos disponibles.');

    const root = fixture.nativeElement.querySelector('.state-message');
    expect(root.classList.contains('state-message--empty')).toBeTrue();
    expect(root.classList.contains('state-message--error')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.state-message__text').textContent).toContain(
      'No hay datos disponibles.'
    );
  });

  it('should show retry button only when showRetry is true', () => {
    render('error', 'Error', false);
    expect(fixture.nativeElement.querySelector('.state-message__retry')).toBeNull();

    component.showRetry = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.state-message__retry')).toBeTruthy();
  });

  it('should emit retry when retry button is clicked', () => {
    render('error', 'Error', true);
    spyOn(component.retry, 'emit');

    const retryButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.state-message__retry');
    retryButton.click();

    expect(component.retry.emit).toHaveBeenCalled();
  });
});
