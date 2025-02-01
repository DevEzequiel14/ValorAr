import { NgClass, NgIf } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output,
         QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-search',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './select-search.component.html',
  styleUrl: './select-search.component.scss'
})
export class SelectSearchComponent {

  @Input() title: string = '';
  @Input() items: string[] = [];
  @Output() selectionChange = new EventEmitter<string>();

  @ViewChild('optionsList', { static: false }) optionsList!: ElementRef;
  @ViewChildren('optionElement') optionElements!: QueryList<ElementRef>;

  searchControl = new FormControl('')
  isOpen: boolean = false;
  filteredItems: string[] = [];
  selectedItem: string | null = null;

  constructor(private readonly elementRef: ElementRef) { }

  ngOnInit(): void {
    this.filteredItems = [...this.items];
    this.selectedItem = (this.filteredItems[0]);
  }

  ngAfterViewInit(): void {
    this.scrollToSelectedItem();
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen
    if (this.isOpen) {
      this.filteredItems = [...this.items];
      this.searchControl.setValue('');
      setTimeout(() => this.scrollToSelectedItem(), 100);
    }
  }

  filterItems(query: string | null): void {
    this.filteredItems = this.items.filter(item =>
      item.toLowerCase().includes(query?.toLowerCase() ?? '')
    );
  }

  search(event: KeyboardEvent) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.filteredItems = this.items.filter((item) =>
      item.toLowerCase().includes(inputValue.toLowerCase())
    );
  }

  selectItem(item: string) {
    this.isOpen = false;
    this.selectedItem = item;
    this.selectionChange.emit(item);
    this.scrollToSelectedItem();
  }

  scrollToSelectedItem() {
    if (!this.selectedItem || this.optionElements.length === 0) return;
    const selectedElement = this.optionElements.find(
      (el) => el.nativeElement.getAttribute('data-value') === this.selectedItem
    );
    if (selectedElement) selectedElement.nativeElement.scrollIntoView(
      { behavior: 'smooth', block: 'center' }
    );
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleDropdown();
    }
  }

  handleItemKeyDown(event: KeyboardEvent, item: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectItem(item);
    }
  }
}
