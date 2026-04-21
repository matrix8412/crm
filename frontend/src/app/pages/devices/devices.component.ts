import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { DataTableComponent } from '../../shared/data-table.component';
import { ModalComponent } from '../../shared/modal.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';
import { Device, EnumValue, Address, Rack, ColumnDef } from '../../models';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent],
  template: `
    <div class="page-header">
      <h1>Devices</h1>
      <div class="view-toggle">
        <button [class.active]="viewMode==='table'" (click)="viewMode='table'">📋 Table</button>
        <button [class.active]="viewMode==='tree'" (click)="viewMode='tree'">🌳 Tree</button>
        <button [class.active]="viewMode==='map'" (click)="viewMode='map'">🗺️ Map</button>
      </div>
    </div>

    @if (viewMode === 'table') {
      <app-data-table
        [data]="devices"
        [columns]="columns"
        (addNew)="openForm()"
        (edit)="openForm($event)"
        (copy)="copyDevice($event)"
        (toggleDelete)="confirmItem = $event"
        (showHistory)="showHistoryFor = $event">
      </app-data-table>
    } @else if (viewMode === 'tree') {
      <div class="tree-view card">
        <div class="tree-search">
          <input type="text" placeholder="Search devices..." [(ngModel)]="treeSearch">
        </div>
        @for (device of rootDevices; track device.id) {
          <div class="tree-node">
            <div class="tree-item" (click)="openForm(device)">
              <span class="tree-icon">{{ getDeviceIcon(device) }}</span>
              <strong>{{ device.name }}</strong>
              @if (device.ip_address) { <span class="tree-ip">{{ device.ip_address }}</span> }
            </div>
            @for (child of getChildren(device.id); track child.id) {
              <div class="tree-node tree-child">
                <div class="tree-item" (click)="openForm(child)">
                  <span class="tree-icon">{{ getDeviceIcon(child) }}</span>
                  <strong>{{ child.name }}</strong>
                  @if (child.ip_address) { <span class="tree-ip">{{ child.ip_address }}</span> }
                </div>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <div class="map-container card" id="deviceMap" #mapContainer></div>
    }

    @if (showForm) {
      <app-modal [title]="editingId ? 'Edit Device' : 'Add Device'" customClass="modal-wide" (close)="requestCloseForm()">
        <form (ngSubmit)="saveDevice()">
          <div class="form-tabs">
            <button type="button" [class.active]="activeTab==='details'" (click)="activeTab='details'">Device Details</button>
            <button type="button" [class.active]="activeTab==='connection'" (click)="activeTab='connection'">Connection Settings</button>
          </div>

          @if (activeTab === 'details') {
            <div class="form-grid">
              <div class="form-group">
                <label>Name *</label>
                <input type="text" [(ngModel)]="form.name" name="name" required class="form-control">
              </div>
              <div class="form-group">
                <label>Vendor</label>
                <app-searchable-select [options]="vendorOptions" [value]="form.vendor_id||null" (valueChange)="form.vendor_id=$event||undefined" placeholder="Select vendor..."></app-searchable-select>
              </div>
              <div class="form-group">
                <label>Device Type</label>
                <app-searchable-select [options]="deviceTypeOptions" [value]="form.device_type_id||null" (valueChange)="form.device_type_id=$event||undefined" placeholder="Select type..."></app-searchable-select>
              </div>
              <div class="form-group">
                <label>Device Group</label>
                <app-searchable-select [options]="deviceGroupOptions" [value]="form.device_group_id||null" (valueChange)="form.device_group_id=$event||undefined" placeholder="Select group..."></app-searchable-select>
              </div>
              <div class="form-group">
                <label>IP Address</label>
                <input type="text" [(ngModel)]="form.ip_address" name="ip" class="form-control" placeholder="e.g. 192.168.1.1">
              </div>
              <div class="form-group">
                <label>SSID</label>
                <input type="text" [(ngModel)]="form.ssid" name="ssid" class="form-control">
              </div>
              <div class="form-group">
                <label>Address</label>
                <app-searchable-select [options]="addressOptions" [value]="form.address_id||null" (valueChange)="form.address_id=$event||undefined" placeholder="Select address..."></app-searchable-select>
              </div>
              <div class="form-group">
                <label>Parent Device</label>
                <app-searchable-select [options]="parentDeviceOptions" [value]="form.parent_device_id||null" (valueChange)="form.parent_device_id=$event||undefined" placeholder="Select parent..."></app-searchable-select>
              </div>
              <div class="form-group">
                <label>GPS Latitude</label>
                <input type="number" step="any" [(ngModel)]="form.gps_lat" name="gps_lat" class="form-control">
              </div>
              <div class="form-group">
                <label>GPS Longitude</label>
                <input type="number" step="any" [(ngModel)]="form.gps_lon" name="gps_lon" class="form-control">
              </div>
              <div class="form-group">
                <label>Rack</label>
                <app-searchable-select [options]="rackOptions" [value]="form.rack_id||null" (valueChange)="form.rack_id=$event||undefined" placeholder="Select rack..."></app-searchable-select>
              </div>
              <div class="form-group">
                <label>Rack Position (U)</label>
                <input type="number" [(ngModel)]="form.rack_position" name="rack_pos" class="form-control" min="1">
              </div>
              <div class="form-group">
                <label>Rack Height (U)</label>
                <input type="number" [(ngModel)]="form.rack_height" name="rack_h" class="form-control" min="1" value="1">
              </div>
            </div>
          }

          @if (activeTab === 'connection') {
            <div class="form-grid">
              <div class="form-group full-width toggle-group">
                <label><input type="checkbox" [(ngModel)]="form.ssh_enabled" name="ssh_en"> SSH</label>
                @if (form.ssh_enabled) {
                  <input type="number" [(ngModel)]="form.ssh_port" name="ssh_port" class="form-control" placeholder="Port (default 22)">
                  <input type="text" [(ngModel)]="form.ssh_user" name="ssh_user" class="form-control" placeholder="Username">
                  <input type="password" [(ngModel)]="form.ssh_password" name="ssh_password" class="form-control" placeholder="Password">
                }
              </div>
              <div class="form-group full-width toggle-group">
                <label><input type="checkbox" [(ngModel)]="form.http_enabled" name="http_en"> HTTP</label>
                @if (form.http_enabled) {
                  <input type="number" [(ngModel)]="form.http_port" name="http_port" class="form-control" placeholder="Port (default 80)">
                }
              </div>
              <div class="form-group full-width toggle-group">
                <label><input type="checkbox" [(ngModel)]="form.https_enabled" name="https_en"> HTTPS</label>
                @if (form.https_enabled) {
                  <input type="number" [(ngModel)]="form.https_port" name="https_port" class="form-control" placeholder="Port (default 443)">
                }
              </div>
              <div class="form-group full-width toggle-group">
                <label><input type="checkbox" [(ngModel)]="form.api_enabled" name="api_en"> REST API</label>
                @if (form.api_enabled) {
                  <input type="number" [(ngModel)]="form.api_port" name="api_port" class="form-control" placeholder="Port">
                  <input type="text" [(ngModel)]="form.api_user" name="api_user" class="form-control" placeholder="Username">
                  <input type="password" [(ngModel)]="form.api_password" name="api_pass" class="form-control" placeholder="Password">
                }
              </div>
            </div>
          }

          <div class="form-actions">
            <button type="button" class="btn" (click)="requestCloseForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </app-modal>
    }

    @if (showDiscardConfirm) {
      <app-confirm-modal
        title="Discard unsaved changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Cancel"
        (confirm)="confirmCloseForm()"
        (cancel)="cancelCloseForm()">
      </app-confirm-modal>
    }

    @if (confirmItem) {
      <app-confirm-modal
        [title]="confirmItem.is_deleted ? 'Restore Device' : 'Delete Device'"
        [message]="'Are you sure?'"
        (confirm)="toggleDelete()"
        (cancel)="confirmItem = null">
      </app-confirm-modal>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary,#333); }
    .view-toggle { display: flex; gap: 4px; }
    .view-toggle button { padding: 8px 14px; border: 1px solid var(--border-color,#ddd); background: var(--bg-card,#fff); cursor: pointer; font-size: 13px; border-radius: 8px; }
    .view-toggle button.active { background: #3498db; color: #fff; border-color: #3498db; }
    .card { background: var(--bg-card,#fff); border: 1px solid var(--border-color,#e0e0e0); border-radius: 12px; padding: 20px; }
    .tree-search { margin-bottom: 16px; }
    .tree-search input { width: 100%; padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; }
    .tree-node { margin-bottom: 2px; }
    .tree-child { padding-left: 24px; }
    .tree-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
    .tree-item:hover { background: var(--bg-hover,#f5f5f5); }
    .tree-icon { font-size: 16px; }
    .tree-ip { font-size: 12px; color: var(--text-secondary,#888); margin-left: auto; }
    .map-container { height: 500px; }
    .form-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color,#eee); padding-bottom: 12px; }
    .form-tabs button { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); background: var(--bg-card,#fff); cursor: pointer; border-radius: 8px 8px 0 0; font-size: 14px; }
    .form-tabs button.active { background: #3498db; color: #fff; border-color: #3498db; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary,#666); }
    .form-control { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input,#fff); color: var(--text-primary,#333); }
    .toggle-group { gap: 8px; }
    .toggle-group label { display: flex; align-items: center; gap: 6px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color,#eee); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card,#fff); }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
  `]
})
export class DevicesComponent implements OnInit {
  devices: Device[] = [];
  enums: EnumValue[] = [];
  addresses: Address[] = [];
  racks: Rack[] = [];
  showForm = false;
  editingId: string | null = null;
  confirmItem: Device | null = null;
  showHistoryFor: any = null;
  viewMode: 'table' | 'tree' | 'map' = 'table';
  activeTab: 'details' | 'connection' = 'details';
  treeSearch = '';
  showDiscardConfirm = false;
  private formSnapshot = '';

  form: Partial<Device> = {};

  columns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'ip_address', label: 'IP Address', sortable: true },
    { key: 'vendor', label: 'Vendor', render: (item: any) => this.enumLabel(item.vendor_id) },
    { key: 'device_type', label: 'Type', render: (item: any) => this.enumLabel(item.device_type_id) },
    { key: 'device_group', label: 'Group', render: (item: any) => this.enumLabel(item.device_group_id) },
    { key: 'ssid', label: 'SSID', sortable: true },
  ];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getDevices().subscribe(d => this.devices = d);
    this.api.getEnums().subscribe(e => this.enums = e);
    this.api.getAddresses().subscribe(a => this.addresses = a);
    this.api.getRacks().subscribe(r => this.racks = r);
  }

  enumLabel(id?: string): string {
    if (!id) return '';
    return this.enums.find(e => e.id === id)?.label || '';
  }

  get vendorOptions() { return this.enums.filter(e => e.category === 'vendor' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get deviceTypeOptions() { return this.enums.filter(e => e.category === 'deviceType' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get deviceGroupOptions() { return this.enums.filter(e => e.category === 'deviceGroup' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get addressOptions() { return this.addresses.filter(a => !a.is_deleted).map(a => ({ value: a.id, label: `${a.street} ${a.descriptive_number}, ${a.city}` })); }
  get rackOptions() { return this.racks.filter(r => !r.is_deleted).map(r => ({ value: r.id, label: r.name })); }
  get parentDeviceOptions() { return this.devices.filter(d => !d.is_deleted && d.id !== this.editingId).map(d => ({ value: d.id, label: `${d.name} ${d.ip_address ? '(' + d.ip_address + ')' : ''}` })); }

  get rootDevices(): Device[] {
    return this.devices.filter(d => !d.parent_device_id && !d.is_deleted && this.matchesTreeSearch(d));
  }

  getChildren(parentId: string): Device[] {
    return this.devices.filter(d => d.parent_device_id === parentId && !d.is_deleted);
  }

  matchesTreeSearch(d: Device): boolean {
    if (!this.treeSearch) return true;
    const term = this.treeSearch.toLowerCase();
    return d.name.toLowerCase().includes(term) || (d.ip_address || '').toLowerCase().includes(term);
  }

  getDeviceIcon(d: Device): string {
    const type = this.enumLabel(d.device_type_id);
    if (type === 'Router') return '🔀';
    if (type === 'Switch') return '🔄';
    if (type === 'Access Point') return '📡';
    return '🖥️';
  }

  openForm(device?: Device) {
    this.activeTab = 'details';
    if (device) {
      this.editingId = device.id;
      this.form = { ...device };
    } else {
      this.editingId = null;
      this.form = { ssh_enabled: false, http_enabled: false, https_enabled: false, api_enabled: false, rack_height: 1 };
    }
    this.formSnapshot = this.serialize(this.form);
    this.showForm = true;
  }

  closeForm() { this.showForm = false; this.form = {}; this.editingId = null; this.formSnapshot = ''; }

  requestCloseForm() {
    if (this.serialize(this.form) !== this.formSnapshot) {
      this.showDiscardConfirm = true;
      return;
    }
    this.closeForm();
  }

  confirmCloseForm() {
    this.showDiscardConfirm = false;
    this.closeForm();
  }

  cancelCloseForm() {
    this.showDiscardConfirm = false;
  }

  private serialize(value: unknown): string {
    return JSON.stringify(value ?? {});
  }

  saveDevice() {
    const obs = this.editingId
      ? this.api.updateDevice(this.editingId, this.form)
      : this.api.createDevice(this.form);
    obs.subscribe({
      next: () => { this.toast.success(this.editingId ? 'Device updated' : 'Device created'); this.closeForm(); this.load(); },
      error: () => this.toast.error('Failed to save device')
    });
  }

  copyDevice(device: Device) {
    this.form = { ...device, id: undefined as any, name: device.name + ' (Copy)' };
    this.editingId = null;
    this.formSnapshot = this.serialize(this.form);
    this.showForm = true;
  }

  toggleDelete() {
    if (!this.confirmItem) return;
    this.api.toggleDeleteDevice(this.confirmItem.id).subscribe({
      next: () => { this.toast.success('Done'); this.confirmItem = null; this.load(); },
      error: () => this.toast.error('Failed')
    });
  }
}
