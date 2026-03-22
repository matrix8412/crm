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
import { L2Vpn, L3Vpn, EnumValue, Customer, ColumnDef } from '../../models';

@Component({
  selector: 'app-vpn',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent, TagInputComponent],
  template: `
    <div class="page-header"><h1>IPAM - VPN</h1></div>
    <div class="tabs">
      <button [class.active]="tab==='l2'" (click)="tab='l2'">L2 VPN</button>
      <button [class.active]="tab==='l3'" (click)="tab='l3'">L3 VPN</button>
    </div>

    @if (tab === 'l2') {
      <app-data-table [data]="l2vpns" [columns]="l2Columns"
        (addNew)="openL2Form()" (edit)="openL2Form($event)" (copy)="copyL2($event)"
        (toggleDelete)="confirmItem=$event;confirmType='l2'" (showHistory)="null">
      </app-data-table>
    } @else {
      <app-data-table [data]="l3vpns" [columns]="l3Columns"
        (addNew)="openL3Form()" (edit)="openL3Form($event)" (copy)="copyL3($event)"
        (toggleDelete)="confirmItem=$event;confirmType='l3'" (showHistory)="null">
      </app-data-table>
    }

    @if (showL2Form) {
      <app-modal [title]="editingId ? 'Edit L2 VPN' : 'Add L2 VPN'" (close)="showL2Form=false">
        <form (ngSubmit)="saveL2()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="l2Form.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>VC ID</label><input type="text" [(ngModel)]="l2Form.vc_id" name="vcid" class="form-control"></div>
            <div class="form-group"><label>Customer</label><app-searchable-select [options]="customerOptions" [value]="l2Form.customer_id||null" (valueChange)="l2Form.customer_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group"><label>Encapsulation</label><app-searchable-select [options]="encapOptions" [value]="l2Form.encapsulation_id||null" (valueChange)="l2Form.encapsulation_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group"><label>Mode</label><app-searchable-select [options]="modeOptions" [value]="l2Form.mode_id||null" (valueChange)="l2Form.mode_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group"><label>Signalization</label><app-searchable-select [options]="sigOptions" [value]="l2Form.signalization_id||null" (valueChange)="l2Form.signalization_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group full-width"><label>Description</label><textarea [(ngModel)]="l2Form.description" name="desc" class="form-control" rows="2"></textarea></div>
            <div class="form-group full-width"><label>Tags</label><app-tag-input [allTags]="tags" [(selectedTagIds)]="tagIds"></app-tag-input></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showL2Form=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    @if (showL3Form) {
      <app-modal [title]="editingId ? 'Edit L3 VPN' : 'Add L3 VPN'" (close)="showL3Form=false">
        <form (ngSubmit)="saveL3()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="l3Form.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>Route Distinguisher</label><input type="text" [(ngModel)]="l3Form.route_distinguisher" name="rd" class="form-control"></div>
            <div class="form-group"><label>Import Target</label><input type="text" [(ngModel)]="l3Form.import_target" name="it" class="form-control"></div>
            <div class="form-group"><label>Export Target</label><input type="text" [(ngModel)]="l3Form.export_target" name="et" class="form-control"></div>
            <div class="form-group"><label>Customer</label><app-searchable-select [options]="customerOptions" [value]="l3Form.customer_id||null" (valueChange)="l3Form.customer_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group full-width"><label>Description</label><textarea [(ngModel)]="l3Form.description" name="desc" class="form-control" rows="2"></textarea></div>
            <div class="form-group full-width"><label>Tags</label><app-tag-input [allTags]="tags" [(selectedTagIds)]="l3TagIds"></app-tag-input></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showL3Form=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    @if (confirmItem) {
      <app-confirm-modal title="Confirm" message="Are you sure?" (confirm)="doToggle()" (cancel)="confirmItem=null"></app-confirm-modal>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 16px; } .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; }
    .tabs button { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); background: var(--bg-card,#fff); cursor: pointer; border-radius: 8px; font-size: 14px; }
    .tabs button.active { background: #3498db; color: #fff; border-color: #3498db; }
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
export class VpnComponent implements OnInit {
  l2vpns: L2Vpn[] = [];
  l3vpns: L3Vpn[] = [];
  enums: EnumValue[] = [];
  customers: Customer[] = [];
  tags: EnumValue[] = [];
  tagIds: string[] = [];
  l3TagIds: string[] = [];
  tab: 'l2' | 'l3' = 'l2';
  showL2Form = false;
  showL3Form = false;
  editingId: string | null = null;
  confirmItem: any = null;
  confirmType = '';
  l2Form: Partial<L2Vpn> = {};
  l3Form: Partial<L3Vpn> = {};

  l2Columns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'vc_id', label: 'VC ID' },
    { key: 'customer', label: 'Customer', render: (i: any) => this.getCustomerName(i.customer_id) },
    { key: 'description', label: 'Description' },
  ];
  l3Columns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'route_distinguisher', label: 'RD' },
    { key: 'import_target', label: 'Import Target' },
    { key: 'export_target', label: 'Export Target' },
    { key: 'customer', label: 'Customer', render: (i: any) => this.getCustomerName(i.customer_id) },
  ];

  constructor(private api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.getL2Vpns().subscribe(d => this.l2vpns = d);
    this.api.getL3Vpns().subscribe(d => this.l3vpns = d);
    this.api.getEnums().subscribe(e => { this.enums = e; this.tags = e.filter(x => x.category === 'tags'); });
    this.api.getCustomers().subscribe(c => this.customers = c);
  }

  getCustomerName(id?: string) { const c = this.customers.find(c => c.id === id); return c ? (c.company_name || `${c.first_name} ${c.last_name}`) : ''; }
  get customerOptions() { return this.customers.filter(c => !c.is_deleted).map(c => ({ value: c.id, label: c.company_name || `${c.first_name} ${c.last_name}` })); }
  get encapOptions() { return this.enums.filter(e => e.category === 'l2VpnEncapsulation' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get modeOptions() { return this.enums.filter(e => e.category === 'l2VpnMode' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get sigOptions() { return this.enums.filter(e => e.category === 'l2VpnSignalization' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }

  openL2Form(item?: L2Vpn) { this.editingId = item?.id || null; this.l2Form = item ? { ...item } : {}; this.tagIds = []; if (item) this.api.getTags('l2-vpns', item.id).subscribe(t => this.tagIds = t); this.showL2Form = true; }
  openL3Form(item?: L3Vpn) { this.editingId = item?.id || null; this.l3Form = item ? { ...item } : {}; this.l3TagIds = []; if (item) this.api.getTags('l3-vpns', item.id).subscribe(t => this.l3TagIds = t); this.showL3Form = true; }

  saveL2() {
    const obs = this.editingId ? this.api.updateL2Vpn(this.editingId, this.l2Form) : this.api.createL2Vpn(this.l2Form);
    obs.subscribe({ next: (r: any) => { this.api.setTags('l2-vpns', this.editingId || r.id, this.tagIds).subscribe(); this.toast.success('Saved'); this.showL2Form = false; this.load(); } });
  }
  saveL3() {
    const obs = this.editingId ? this.api.updateL3Vpn(this.editingId, this.l3Form) : this.api.createL3Vpn(this.l3Form);
    obs.subscribe({ next: (r: any) => { this.api.setTags('l3-vpns', this.editingId || r.id, this.l3TagIds).subscribe(); this.toast.success('Saved'); this.showL3Form = false; this.load(); } });
  }

  copyL2(item: L2Vpn) { this.l2Form = { ...item, id: undefined as any }; this.editingId = null; this.showL2Form = true; }
  copyL3(item: L3Vpn) { this.l3Form = { ...item, id: undefined as any }; this.editingId = null; this.showL3Form = true; }

  doToggle() {
    if (!this.confirmItem) return;
    const cb = { next: () => { this.confirmItem = null; this.load(); } };
    if (this.confirmType === 'l2') { this.api.toggleDeleteL2Vpn(this.confirmItem.id).subscribe(cb); } else { this.api.toggleDeleteL3Vpn(this.confirmItem.id).subscribe(cb); }
  }
}
