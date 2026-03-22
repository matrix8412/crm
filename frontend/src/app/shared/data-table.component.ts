import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnDef, SortConfig } from '../models';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="table-toolbar">
      <div class="table-search">
        <input type="text" placeholder="Search..." [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()">
      </div>
      <div class="table-actions">
        <button class="btn btn-primary" (click)="addNew.emit()">+ Add New</button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            @for (col of visibleColumns; track col.key) {
              <th (click)="col.sortable !== false && onSort(col.key)" [class.sortable]="col.sortable !== false">
                {{ col.label }}
                @if (sortConfig.key === col.key) {
                  <span class="sort-indicator">{{ sortConfig.direction === 'asc' ? '▲' : '▼' }}</span>
                }
              </th>
            }
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (item of paginatedData; track item.id) {
            <tr [class.deleted-row]="item.is_deleted">
              @for (col of visibleColumns; track col.key) {
                <td>
                  @if (col.render) {
                    <span [innerHTML]="col.render(item)"></span>
                  } @else {
                    {{ item[col.key] ?? '' }}
                  }
                </td>
              }
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="btn-icon" title="Edit" (click)="edit.emit(item)" [disabled]="item.is_deleted">✏️</button>
                  <button class="btn-icon" title="Copy" (click)="copy.emit(item)">📋</button>
                  <button class="btn-icon" [title]="item.is_deleted ? 'Restore' : 'Delete'"
                    (click)="toggleDelete.emit(item)">
                    {{ item.is_deleted ? '♻️' : '🗑️' }}
                  </button>
                  <button class="btn-icon" title="History" (click)="showHistory.emit(item)">📜</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td [attr.colspan]="visibleColumns.length + 1" class="empty-row">No records found</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (totalPages > 1) {
      <div class="pagination">
        <button class="btn btn-sm" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">← Prev</button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button class="btn btn-sm" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">Next →</button>
      </div>
    }
  `,
  styles: [`
    .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
    .table-search input { padding: 8px 12px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; width: 250px; font-size: 14px; background: var(--bg-input, #fff); color: var(--text-primary, #333); }
    .table-wrapper { overflow-x: auto; border: 1px solid var(--border-color, #e0e0e0); border-radius: 8px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th { background: var(--bg-header, #f8f9fa); padding: 10px 12px; text-align: left; font-weight: 600; font-size: 13px; white-space: nowrap; user-select: none; border-bottom: 2px solid var(--border-color, #e0e0e0); }
    .data-table th.sortable { cursor: pointer; }
    .data-table th.sortable:hover { background: var(--bg-hover, #eee); }
    .sort-indicator { margin-left: 4px; font-size: 10px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-color, #f0f0f0); }
    .data-table tbody tr:hover { background: var(--bg-hover, #f8f9fa); }
    .deleted-row { opacity: 0.5; background: #fff5f5 !important; }
    .actions-col { width: 160px; white-space: nowrap; }
    .action-buttons { display: flex; gap: 4px; }
    .btn-icon { background: none; border: 1px solid var(--border-color, #ddd); border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 14px; }
    .btn-icon:hover { background: var(--bg-hover, #f0f0f0); }
    .btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
    .empty-row { text-align: center; padding: 32px !important; color: var(--text-secondary, #888); }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 16px; }
    .page-info { font-size: 14px; color: var(--text-secondary, #666); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card, #fff); color: var(--text-primary, #333); transition: all 0.15s; }
    .btn:hover { background: var(--bg-hover, #f0f0f0); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
    .btn-primary:hover { background: #2980b9; }
    .btn-sm { padding: 6px 12px; font-size: 13px; }
  `]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: ColumnDef[] = [];
  @Input() rowsPerPage = 25;

  @Output() addNew = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() copy = new EventEmitter<any>();
  @Output() toggleDelete = new EventEmitter<any>();
  @Output() showHistory = new EventEmitter<any>();

  searchTerm = '';
  currentPage = 1;
  sortConfig: SortConfig = { key: '', direction: '' };

  get visibleColumns(): ColumnDef[] {
    return this.columns.filter(c => c.visible !== false);
  }

  get filteredData(): any[] {
    let result = this.data;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(item =>
        this.visibleColumns.some(col => {
          const val = col.render ? col.render(item) : item[col.key];
          return val && String(val).toLowerCase().includes(term);
        })
      );
    }
    if (this.sortConfig.key && this.sortConfig.direction) {
      const dir = this.sortConfig.direction === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        const aVal = a[this.sortConfig.key] ?? '';
        const bVal = b[this.sortConfig.key] ?? '';
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        return String(aVal).localeCompare(String(bVal)) * dir;
      });
    }
    return result;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  onSort(key: string) {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : this.sortConfig.direction === 'desc' ? '' : 'asc';
      if (!this.sortConfig.direction) this.sortConfig.key = '';
    } else {
      this.sortConfig = { key, direction: 'asc' };
    }
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
