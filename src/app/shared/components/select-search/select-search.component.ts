import { NgClass, NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-select-search',
  standalone: true,
  imports: [NgIf, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './select-search.component.html',
  styleUrl: './select-search.component.scss',
})
export class SelectSearchComponent implements OnInit, OnChanges, AfterViewInit {
  private static instanceCounter = 0;
  private readonly instanceSuffix = ++SelectSearchComponent.instanceCounter;

  @Input() title: string = '';
  @Input() items: string[] = [];
  @Input() selectedItem: string | null = null;
  @Output() selectionChange = new EventEmitter<string>();

  @ViewChild('optionsList', { static: false }) optionsList!: ElementRef;
  @ViewChildren('optionElement') optionElements!: QueryList<ElementRef>;

  searchControl = new FormControl('');
  isOpen = false;
  filteredItems: string[] = [];
  readonly listboxId = `select-search-listbox-${this.instanceSuffix}`;
  readonly labelId = `select-search-label-${this.instanceSuffix}`;

  constructor(private readonly elementRef: ElementRef) {}

  ngOnInit(): void {
    this.syncItemsState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['selectedItem']) {
      this.syncItemsState();
    }
  }

  ngAfterViewInit(): void {
    this.scrollToSelectedItem();
  }

  get displaySelectedItem(): string {
    return this.resolveSelectedItem() ?? '';
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.syncItemsState(true);
      this.searchControl.setValue('');
      setTimeout(() => this.scrollToSelectedItem(), 100);
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  filterItems(query: string | null): void {
    const normalizedQuery = query?.toLowerCase() ?? '';
    this.filteredItems = this.items.filter((item) => item.toLowerCase().includes(normalizedQuery));
  }

  search(event: KeyboardEvent): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.filterItems(inputValue);
  }

  selectItem(item: string): void {
    this.closeDropdown();
    this.selectionChange.emit(item);
    setTimeout(() => this.scrollToSelectedItem(), 0);
  }

  scrollToSelectedItem(): void {
    const selected = this.resolveSelectedItem();
    if (!selected || !this.optionElements?.length) {
      return;
    }
    const selectedElement = this.optionElements.find(
      (el) => el.nativeElement.getAttribute('data-value') === selected
    );
    selectedElement?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleDropdown();
    }
  }

  handleSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
    }
  }

  handleItemKeyDown(event: KeyboardEvent, item: string): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectItem(item);
    }
  }

  private syncItemsState(resetFilter = false): void {
    if (resetFilter || !this.isOpen) {
      this.filteredItems = [...this.items];
    } else {
      this.filterItems(this.searchControl.value);
    }
  }

  private resolveSelectedItem(): string | null {
    if (this.items.length === 0) {
      return this.selectedItem;
    }
    if (this.selectedItem && this.items.includes(this.selectedItem)) {
      return this.selectedItem;
    }
    return this.items[0] ?? null;
  }
}
