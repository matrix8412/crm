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
import { Vlan, VlanDomain, EnumValue, Site, ColumnDef } from '../../models';

@Component({
  selector: 'app-vlans',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent, TagInputComponent],
  template: `
    <div class="page-header"><h1>IPAM - VLANs</h1></div>

    <div class="tabs">
      <button [class.active]="tab==='vlans'" (click)="tab='vlans'">VLANs</button>
      <button [class.active]="tab==='domains'" (click)="tab='domains'">VLAN Domains</button>
    </div>

    @if (tab === 'vlans') {
      <app-data-table [data]="vlans" [columns]="vlanColumns"
        (addNew)="openVlanForm()" (edit)="openVlanForm($event)" (copy)="copyVlan($event)"
        (toggleDelete)="confirmItem=$event;confirmType='vlan'" (showHistory)="null">
      </app-data-table>
    } @else {
      <app-data-table [data]="domains" [columns]="domainColumns"
        (addNew)="openDomainForm()" (edit)="openDomainForm($event)" (copy)="copyDomain($event)"
        (toggleDelete)="confirmItem=$event;confirmType='domain'" (showHistory)="null">
      </app-data-table>
    }

    @if (showVlanForm) {
      <app-modal [title]="editingId ? 'Edit VLAN' : 'Add VLAN'" (close)="showVlanForm=false">
        <form (ngSubmit)="saveVlan()">
          <div class="form-grid">
            <div class="form-group"><label>VLAN ID (1-4094) *</label><input type="number" [(ngModel)]="vlanForm.vlan_id" name="vid" required min="1" max="4094" class="form-control"></div>
            <div class="form-group"><label>Name</label><input type="text" [(ngModel)]="vlanForm.name" name="name" class="form-control"></div>
            <div class="form-group"><label>Domain</label><app-searchable-select [options]="domainOptions" [value]="vlanForm.domain_id||null" (valueChange)="vlanForm.domain_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group"><label>Role</label><app-searchable-select [options]="roleOptions" [value]="vlanForm.role_id||null" (valueChange)="vlanForm.role_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group"><label>Site</label><app-searchable-select [options]="siteOptions" [value]="vlanForm.site_id||null" (valueChange)="vlanForm.site_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group full-width"><label>Tags</label><app-tag-input [allTags]="tags" [(selectedTagIds)]="tagIds"></app-tag-input></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showVlanForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    @if (showDomainForm) {
      <app-modal [title]="editingId ? 'Edit Domain' : 'Add Domain'" (close)="showDomainForm=false">
        <form (ngSubmit)="saveDomain()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="domainForm.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>Parent Domain</label><app-searchable-select [options]="parentDomainOptions" [value]="domainForm.parent_domain_id||null" (valueChange)="domainForm.parent_domain_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group full-width"><label>Description</label><textarea [(ngModel)]="domainForm.description" name="desc" class="form-control" rows="2"></textarea></div>
            <div class="form-group full-width"><label>Tags</label><app-tag-input [allTags]="tags" [(selectedTagIds)]="domainTagIds"></app-tag-input></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showDomainForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    @if (confirmItem) {
      <app-confirm-modal title="Confirm" message="Are you sure?" (confirm)="doToggleDelete()" (cancel)="confirmItem=null"></app-confirm-modal>
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
export class VlansComponent implements OnInit {
  vlans: Vlan[] = [];
  domains: VlanDomain[] = [];
  enums: EnumValue[] = [];
  sites: Site[] = [];
  tags: EnumValue[] = [];
  tagIds: string[] = [];
  domainTagIds: string[] = [];
  tab: 'vlans' | 'domains' = 'vlans';
  showVlanForm = false;
  showDomainForm = false;
  editingId: string | null = null;
  confirmItem: any = null;
  confirmType = '';
  vlanForm: Partial<Vlan> = {};
  domainForm: Partial<VlanDomain> = {};

  vlanColumns: ColumnDef[] = [
    { key: 'vlan_id', label: 'VLAN ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'domain', label: 'Domain', render: (i: any) => this.domains.find(d => d.id === i.domain_id)?.name || '' },
  ];

  domainColumns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'parent', label: 'Parent', render: (i: any) => this.domains.find(d => d.id === i.parent_domain_id)?.name || '' },
  ];

  constructor(private api: ApiService, private toast: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.getVlans().subscribe(d => this.vlans = d);
    this.api.getVlanDomains().subscribe(d => this.domains = d);
    this.api.getEnums().subscribe(e => { this.enums = e; this.tags = e.filter(x => x.category === 'tags'); });
    this.api.getSites().subscribe(s => this.sites = s);
  }

  get roleOptions() { return this.enums.filter(e => e.category === 'ipamRoles' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get siteOptions() { return this.sites.filter(s => !s.is_deleted).map(s => ({ value: s.id, label: s.name })); }
  get domainOptions() { return this.domains.filter(d => !d.is_deleted).map(d => ({ value: d.id, label: d.name })); }
  get parentDomainOptions() { return this.domains.filter(d => !d.is_deleted && d.id !== this.editingId).map(d => ({ value: d.id, label: d.name })); }

  openVlanForm(item?: Vlan) {
    this.editingId = item?.id || null;
    this.vlanForm = item ? { ...item } : {};
    this.tagIds = [];
    if (item) this.api.getTags('vlans', item.id).subscribe(t => this.tagIds = t);
    this.showVlanForm = true;
  }
  openDomainForm(item?: VlanDomain) {
    this.editingId = item?.id || null;
    this.domainForm = item ? { ...item } : {};
    this.domainTagIds = [];
    if (item) this.api.getTags('vlan-domains', item.id).subscribe(t => this.domainTagIds = t);
    this.showDomainForm = true;
  }

  saveVlan() {
    const obs = this.editingId ? this.api.updateVlan(this.editingId, this.vlanForm) : this.api.createVlan(this.vlanForm);
    obs.subscribe({ next: (r: any) => { this.api.setTags('vlans', this.editingId || r.id, this.tagIds).subscribe(); this.toast.success('Saved'); this.showVlanForm = false; this.load(); } });
  }
  saveDomain() {
    const obs = this.editingId ? this.api.updateVlanDomain(this.editingId, this.domainForm) : this.api.createVlanDomain(this.domainForm);
    obs.subscribe({ next: (r: any) => { this.api.setTags('vlan-domains', this.editingId || r.id, this.domainTagIds).subscribe(); this.toast.success('Saved'); this.showDomainForm = false; this.load(); } });
  }

  copyVlan(item: Vlan) { this.vlanForm = { ...item, id: undefined as any }; this.editingId = null; this.showVlanForm = true; }
  copyDomain(item: VlanDomain) { this.domainForm = { ...item, id: undefined as any }; this.editingId = null; this.showDomainForm = true; }

  doToggleDelete() {
    if (!this.confirmItem) return;
    const cb = { next: () => { this.confirmItem = null; this.load(); } };
    if (this.confirmType === 'vlan') { this.api.toggleDeleteVlan(this.confirmItem.id).subscribe(cb); } else { this.api.toggleDeleteVlanDomain(this.confirmItem.id).subscribe(cb); }
  }
}
