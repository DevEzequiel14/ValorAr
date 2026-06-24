import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';

import { SelectSearchComponent } from './select-search.component';

describe('SelectSearchComponent', () => {
  let component: SelectSearchComponent;
  let fixture: ComponentFixture<SelectSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should start with empty filteredItems when items is empty', () => {
    component.items = [];
    component.ngOnInit();

    expect(component.filteredItems).toEqual([]);
    expect(component.displaySelectedItem).toBe('');
  });

  it('should update filteredItems and selection when items arrive after init', () => {
    component.items = [];
    component.selectedItem = null;
    component.ngOnInit();

    expect(component.filteredItems).toEqual([]);

    component.items = ['USD', 'ARS', 'BTC'];
    component.selectedItem = 'ARS';
    component.ngOnChanges({
      items: new SimpleChange([], component.items, false),
      selectedItem: new SimpleChange(null, 'ARS', false),
    });

    expect(component.filteredItems).toEqual(['USD', 'ARS', 'BTC']);
    expect(component.displaySelectedItem).toBe('ARS');
  });

  it('should fall back to first item when selectedItem is not in items', () => {
    component.items = ['USD', 'ARS'];
    component.selectedItem = 'BTC';
    component.ngOnInit();

    expect(component.displaySelectedItem).toBe('USD');
  });

  it('should emit selectionChange when an item is selected', () => {
    component.items = ['USD', 'ARS'];
    component.selectedItem = 'USD';
    component.ngOnInit();

    const emitSpy = spyOn(component.selectionChange, 'emit');

    component.selectItem('ARS');

    expect(emitSpy).toHaveBeenCalledWith('ARS');
  });

  it('should close dropdown on Escape key', () => {
    component.items = ['USD', 'ARS'];
    component.isOpen = true;

    component.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.isOpen).toBeFalse();
  });
});
