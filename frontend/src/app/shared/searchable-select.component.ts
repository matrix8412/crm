import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ss-wrapper" (clickOutside)="isOpen = false">
      <div class="ss-input-wrapper" (click)="toggle()">
        <input type="text" [placeholder]="placeholder" [(ngModel)]="searchTerm"
          (input)="onFilter()" (focus)="isOpen = true" [required]="required">
        @if (selectedLabel && !searchTerm) {
          <span class="ss-selected">{{ selectedLabel }}</span>
        }
        <span class="ss-arrow">▾</span>
      </div>
      @if (isOpen) {
        <div class="ss-dropdown">
          @if (!required) {
            <div class="ss-option" (click)="select(null, '-- None --')">-- None --</div>
          }
          @for (opt of filteredOptions; track opt.value) {
            <div class="ss-option" [class.active]="opt.value === value" (click)="select(opt.value, opt.label)">
              {{ opt.label }}
            </div>
          } @empty {
            <div class="ss-empty">No results</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ss-wrapper { position: relative; }
    .ss-input-wrapper { position: relative; cursor: pointer; }
    .ss-input-wrapper input { width: 100%; padding: 8px 28px 8px 12px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input, #fff); color: var(--text-primary, #333); box-sizing: border-box; }
    .ss-selected { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; font-size: 14px; color: var(--text-primary, #333); }
    .ss-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-secondary, #888); pointer-events: none; }
    .ss-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-card, #fff); border: 1px solid var(--border-color, #ddd); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 100; margin-top: 4px; }
    .ss-option { padding: 8px 12px; cursor: pointer; font-size: 14px; }
    .ss-option:hover { background: var(--bg-hover, #f5f5f5); }
    .ss-option.active { background: #3498db; color: #fff; }
    .ss-empty { padding: 12px; text-align: center; color: var(--text-secondary, #888); font-size: 13px; }
  `],
  host: { '(document:click)': 'onDocClick($event)' }
})
export class SearchableSelectComponent implements OnInit {
  @Input() options: { value: string; label: string }[] = [];
  @Input() value: string | null = null;
  @Input() placeholder = 'Select...';
  @Input() required = false;
  @Output() valueChange = new EventEmitter<string | null>();

  isOpen = false;
  searchTerm = '';
  selectedLabel = '';

  ngOnInit() {
    this.updateLabel();
  }

  ngOnChanges() {
    this.updateLabel();
  }

  private updateLabel() {
    const opt = this.options.find(o => o.value === this.value);
    this.selectedLabel = opt ? opt.label : '';
  }

  get filteredOptions() {
    if (!this.searchTerm) return this.options;
    const terms = this.searchTerm.toLowerCase().split(/\s+/);
    return this.options.filter(o => terms.every(t => o.label.toLowerCase().includes(t)));
  }

  toggle() { this.isOpen = !this.isOpen; }

  select(value: string | null, label: string) {
    this.value = value;
    this.selectedLabel = value ? label : '';
    this.searchTerm = '';
    this.isOpen = false;
    this.valueChange.emit(value);
  }

  onFilter() {
    this.isOpen = true;
  }

  onDocClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    if (!el.closest('app-searchable-select')) this.isOpen = false;
  }
}
