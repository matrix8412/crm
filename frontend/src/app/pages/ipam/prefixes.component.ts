import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { DataTableComponent } from '../../shared/data-table.component';
import { ModalComponent } from '../../shared/modal.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';
import { TagInputComponent } from '../../shared/tag-input.component';
import { Prefix, EnumValue, Site, ColumnDef } from '../../models';

@Component({
  selector: 'app-prefixes',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent, TagInputComponent],
  template: `
    <div class="page-header"><h1>IPAM - Prefixes</h1></div>
    <app-data-table [data]="prefixes" [columns]="columns"
      (addNew)="openForm()" (edit)="openForm($event)" (copy)="copyItem($event)"
      (toggleDelete)="confirmItem=$event" (showHistory)="null">
    </app-data-table>

    @if (showForm) {
      <app-modal [title]="editingId ? 'Edit Prefix' : 'Add Prefix'" (close)="closeForm()">
        <form (ngSubmit)="save()">
          <div class="form-grid">
            <div class="form-group">
              <label>Prefix (CIDR) *</label>
              <input type="text" [(ngModel)]="form.prefix" name="prefix" required class="form-control" placeholder="e.g. 192.168.1.0/24">
            </div>
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="form.name" name="name" class="form-control">
            </div>
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="form.status" name="status" class="form-control">
                <option value="active">Active</option>
                <option value="container">Container</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            <div class="form-group">
              <label>Role</label>
              <app-searchable-select [options]="roleOptions" [value]="form.role_id||null" (valueChange)="form.role_id=$event||undefined"></app-searchable-select>
            </div>
            <div class="form-group">
              <label>Site</label>
              <app-searchable-select [options]="siteOptions" [value]="form.site_id||null" (valueChange)="form.site_id=$event||undefined"></app-searchable-select>
            </div>
            <div class="form-group">
              <label><input type="checkbox" [(ngModel)]="form.is_pool" name="pool"> Is Pool</label>
            </div>
            <div class="form-group full-width">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" name="desc" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group full-width">
              <label>Tags</label>
              <app-tag-input [allTags]="tags" [(selectedTagIds)]="tagIds"></app-tag-input>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn" (click)="closeForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </app-modal>
    }

    @if (confirmItem) {
      <app-confirm-modal title="Confirm" message="Are you sure?" (confirm)="toggleDelete()" (cancel)="confirmItem=null"></app-confirm-modal>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; } .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; } .form-group.full-width { grid-column: 1/-1; }
    .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary,#666); }
    .form-control { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input,#fff); color: var(--text-primary,#333); box-sizing: border-box; }
    textarea.form-control { resize: vertical; font-family: inherit; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color,#eee); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card,#fff); }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
  `]
})
export class PrefixesComponent implements OnInit {
  prefixes: Prefix[] = [];
  enums: EnumValue[] = [];
  sites: Site[] = [];
  tags: EnumValue[] = [];
  tagIds: string[] = [];
  showForm = false;
  editingId: string | null = null;
  confirmItem: Prefix | null = null;
  form: Partial<Prefix> = {};

  columns: ColumnDef[] = [
    { key: 'prefix', label: 'Prefix', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'is_pool', label: 'Pool', render: (item: any) => item.is_pool ? 'Yes' : 'No' },
    { key: 'description', label: 'Description' },
  ];

  constructor(private api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.getPrefixes().subscribe(d => this.prefixes = d);
    this.api.getEnums().subscribe(e => { this.enums = e; this.tags = e.filter(x => x.category === 'tags'); });
    this.api.getSites().subscribe(s => this.sites = s);
  }

  get roleOptions() { return this.enums.filter(e => e.category === 'ipamRoles' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get siteOptions() { return this.sites.filter(s => !s.is_deleted).map(s => ({ value: s.id, label: s.name })); }

  openForm(item?: Prefix) {
    if (item) { this.editingId = item.id; this.form = { ...item }; this.api.getTags('prefixes', item.id).subscribe(t => this.tagIds = t); }
    else { this.editingId = null; this.form = { status: 'active', is_pool: false }; this.tagIds = []; }
    this.showForm = true;
  }

  closeForm() { this.showForm = false; this.form = {}; this.editingId = null; }

  save() {
    const obs = this.editingId ? this.api.updatePrefix(this.editingId, this.form) : this.api.createPrefix(this.form);
    obs.subscribe({
      next: (result: any) => {
        const id = this.editingId || result.id;
        this.api.setTags('prefixes', id, this.tagIds).subscribe();
        this.toast.success('Saved'); this.closeForm(); this.load();
      },
      error: () => this.toast.error('Failed')
    });
  }

  copyItem(item: Prefix) { this.form = { ...item, id: undefined as any }; this.editingId = null; this.showForm = true; }

  toggleDelete() {
    if (!this.confirmItem) return;
    this.api.toggleDeletePrefix(this.confirmItem.id).subscribe({ next: () => { this.confirmItem = null; this.load(); } });
  }
}
