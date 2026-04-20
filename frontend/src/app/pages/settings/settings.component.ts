import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';
import { EnumValue, User, UserGroup, Address, DeviceTemplate, Site, Rack, AppSettings, ColumnDef } from '../../models';
import { DataTableComponent } from '../../shared/data-table.component';
import { ModalComponent } from '../../shared/modal.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';

interface NavCategory { key: string; label: string; icon: string; items: { key: string; label: string; }[]; }

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent],
  template: `
    <div class="settings-layout">
      <aside class="settings-sidebar">
        <h2>Settings</h2>
        @for (cat of navCategories; track cat.key) {
          <div class="nav-category">
            <button class="cat-header" [class.expanded]="expandedCat===cat.key" (click)="expandedCat=expandedCat===cat.key?'':cat.key">
              <span>{{ cat.icon }} {{ cat.label }}</span><span class="arrow">{{ expandedCat===cat.key ? '▾' : '▸' }}</span>
            </button>
            @if (expandedCat === cat.key) {
              <div class="cat-items">
                @for (item of cat.items; track item.key) {
                  <button class="nav-item" [class.active]="activeTab===item.key" (click)="setTab(item.key)">{{ item.label }}</button>
                }
              </div>
            }
          </div>
        }
      </aside>
      <main class="settings-content">
        <!-- User Management -->
        @if (activeTab === 'users') { <section><h3>Users</h3><app-data-table [data]="users" [columns]="userColumns" (addNew)="openUserForm()" (edit)="openUserForm($event)" (toggleDelete)="confirmItem=$event;confirmEntity='users'"></app-data-table></section> }
        @if (activeTab === 'userGroups') { <section><h3>User Groups</h3><app-data-table [data]="userGroups" [columns]="ugColumns" (addNew)="openUGForm()" (edit)="openUGForm($event)" (toggleDelete)="confirmItem=$event;confirmEntity='user-groups'"></app-data-table></section> }

        <!-- Enum Tables -->
        @if (isEnumTab(activeTab)) {
          <section>
            <h3>{{ getEnumTitle(activeTab) }}</h3>
            <div class="enum-toolbar">
              <input type="text" [(ngModel)]="enumSearch" placeholder="Search..." class="form-control search-input">
              <button class="btn btn-primary" (click)="openEnumForm()">+ Add</button>
            </div>
            <table class="enum-table">
              <thead><tr><th>Label</th>@if (hasColor(activeTab)){<th>Color</th>}<th style="width:120px">Actions</th></tr></thead>
              <tbody>
                @for (e of filteredEnums(); track e.id) {
                  <tr [class.deleted]="e.is_deleted">
                    <td>{{ e.label }}</td>
                    @if (hasColor(activeTab)) { <td><span class="color-swatch" [style.background]="e.color||'#ccc'"></span></td> }
                    <td class="actions">
                      <button class="btn-icon" title="Edit" (click)="openEnumForm(e)">✏️</button>
                      <button class="btn-icon" title="Copy" (click)="copyEnum(e)">📋</button>
                      <button class="btn-icon" [title]="e.is_deleted?'Restore':'Delete'" (click)="confirmItem=e;confirmEntity='enums'">{{ e.is_deleted ? '♻️' : '🗑️' }}</button>
                    </td>
                  </tr>
                } @empty { <tr><td [attr.colspan]="hasColor(activeTab)?3:2" class="empty">No items</td></tr> }
              </tbody>
            </table>
          </section>
        }

        <!-- Addresses -->
        @if (activeTab === 'addresses') {
          <section><h3>Addresses</h3><app-data-table [data]="addresses" [columns]="addressColumns" (addNew)="openAddrForm()" (edit)="openAddrForm($event)" (toggleDelete)="confirmItem=$event;confirmEntity='addresses'"></app-data-table></section>
        }

        <!-- Device Templates -->
        @if (activeTab === 'deviceTemplates') {
          <section><h3>Device Templates</h3><app-data-table [data]="deviceTemplates" [columns]="dtColumns" (addNew)="openDTForm()" (edit)="openDTForm($event)" (toggleDelete)="confirmItem=$event;confirmEntity='device-templates'"></app-data-table></section>
        }

        <!-- Sites & Racks -->
        @if (activeTab === 'sites') {
          <section><h3>Sites</h3><app-data-table [data]="sites" [columns]="siteColumns" (addNew)="openSiteForm()" (edit)="openSiteForm($event)" (toggleDelete)="confirmItem=$event;confirmEntity='sites'"></app-data-table></section>
        }
        @if (activeTab === 'racks') {
          <section><h3>Racks</h3><app-data-table [data]="racks" [columns]="rackColumns" (addNew)="openRackForm()" (edit)="openRackForm($event)" (toggleDelete)="confirmItem=$event;confirmEntity='racks'"></app-data-table></section>
        }

        <!-- IPAM Enums (reuse existing isEnumTab logic) -->
        @if (activeTab === 'ipamRoles') { <section><h3>IPAM Roles</h3>
          <div class="enum-toolbar"><input type="text" [(ngModel)]="enumSearch" placeholder="Search..." class="form-control search-input"><button class="btn btn-primary" (click)="openEnumFormFor('ipamRoles')">+ Add</button></div>
          <table class="enum-table"><thead><tr><th>Label</th><th>Color</th><th style="width:120px">Actions</th></tr></thead><tbody>
            @for (e of filterByCategory('ipamRoles', enumSearch); track e.id) { <tr [class.deleted]="e.is_deleted"><td>{{ e.label }}</td><td><span class="color-swatch" [style.background]="e.color||'#ccc'"></span></td><td class="actions"><button class="btn-icon" (click)="openEnumForm(e)">✏️</button><button class="btn-icon" (click)="confirmItem=e;confirmEntity='enums'">{{ e.is_deleted?'♻️':'🗑️' }}</button></td></tr> } @empty { <tr><td colspan="3" class="empty">No items</td></tr> }
          </tbody></table>
        </section> }
        @if (activeTab === 'ipamTags') { <section><h3>Tags</h3>
          <div class="enum-toolbar"><input type="text" [(ngModel)]="enumSearch" placeholder="Search..." class="form-control search-input"><button class="btn btn-primary" (click)="openEnumFormFor('tags')">+ Add</button></div>
          <table class="enum-table"><thead><tr><th>Label</th><th>Color</th><th style="width:120px">Actions</th></tr></thead><tbody>
            @for (e of filterByCategory('tags', enumSearch); track e.id) { <tr [class.deleted]="e.is_deleted"><td>{{ e.label }}</td><td><span class="color-swatch" [style.background]="e.color||'#ccc'"></span></td><td class="actions"><button class="btn-icon" (click)="openEnumForm(e)">✏️</button><button class="btn-icon" (click)="confirmItem=e;confirmEntity='enums'">{{ e.is_deleted?'♻️':'🗑️' }}</button></td></tr> } @empty { <tr><td colspan="3" class="empty">No items</td></tr> }
          </tbody></table>
        </section> }

        <!-- L2VPN Settings -->
        @if (activeTab === 'l2vpnSettings') {
          <section>
            <h3>L2 VPN Settings</h3>
            @for (sub of l2vpnSubs; track sub.cat) {
              <div class="sub-section">
                <h4>{{ sub.label }}</h4>
                <div class="enum-toolbar"><input type="text" [(ngModel)]="sub.search" placeholder="Search..." class="form-control search-input"><button class="btn btn-primary btn-sm2" (click)="openEnumFormFor(sub.cat)">+ Add</button></div>
                <table class="enum-table compact">
                  <thead><tr><th>Label</th><th style="width:120px">Actions</th></tr></thead>
                  <tbody>
                    @for (e of filterByCategory(sub.cat, sub.search); track e.id) {
                      <tr [class.deleted]="e.is_deleted"><td>{{ e.label }}</td><td class="actions"><button class="btn-icon" (click)="openEnumForm(e)">✏️</button><button class="btn-icon" (click)="confirmItem=e;confirmEntity='enums'">{{ e.is_deleted?'♻️':'🗑️' }}</button></td></tr>
                    } @empty { <tr><td colspan="2" class="empty">No items</td></tr> }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        <!-- L3VPN Settings -->
        @if (activeTab === 'l3vpnSettings') {
          <section>
            <h3>L3 VPN Settings</h3>
            @for (sub of l3vpnSubs; track sub.cat) {
              <div class="sub-section">
                <h4>{{ sub.label }}</h4>
                <div class="enum-toolbar"><input type="text" [(ngModel)]="sub.search" placeholder="Search..." class="form-control search-input"><button class="btn btn-primary btn-sm2" (click)="openEnumFormFor(sub.cat)">+ Add</button></div>
                <table class="enum-table compact">
                  <thead><tr><th>Label</th><th style="width:120px">Actions</th></tr></thead>
                  <tbody>
                    @for (e of filterByCategory(sub.cat, sub.search); track e.id) {
                      <tr [class.deleted]="e.is_deleted"><td>{{ e.label }}</td><td class="actions"><button class="btn-icon" (click)="openEnumForm(e)">✏️</button><button class="btn-icon" (click)="confirmItem=e;confirmEntity='enums'">{{ e.is_deleted?'♻️':'🗑️' }}</button></td></tr>
                    } @empty { <tr><td colspan="2" class="empty">No items</td></tr> }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        <!-- UI Settings -->
        @if (activeTab === 'uiSettings') {
          <section>
            <h3>UI Settings</h3>
            <div class="settings-list">
              <div class="setting-row"><label>Application Name</label><input type="text" [(ngModel)]="settings.appName" (change)="saveSetting('appName', settings.appName)" class="form-control" style="max-width:300px"></div>
              <div class="setting-row">
                <label>Appearance Theme</label>
                <div class="segmented">
                  @for (t of themeOptions; track t) { <button [class.active]="settings.theme===t" (click)="setTheme(t)">{{ t | titlecase }}</button> }
                </div>
              </div>
              <div class="setting-row"><label>Glossy Mode</label><label class="switch"><input type="checkbox" [(ngModel)]="settings.glossyMode" (change)="saveSetting('glossyMode', settings.glossyMode)"><span class="slider"></span></label></div>
              <div class="setting-row">
                <label>Toast Notification Position</label>
                <div class="segmented">
                  @for (p of toastPositions; track p) { <button [class.active]="settings.toastPosition===p" (click)="settings.toastPosition=p;saveSetting('toastPosition',p)">{{ p }}</button> }
                </div>
              </div>
              <div class="setting-row"><label>Toast Opacity</label><div class="range-wrap"><input type="range" min="0.2" max="1" step="0.05" [(ngModel)]="settings.toastOpacity" (change)="saveSetting('toastOpacity', settings.toastOpacity)"><span>{{ (settings.toastOpacity * 100) | number:'1.0-0' }}%</span></div></div>
              <div class="setting-row"><label>Toast Text Color</label><input type="color" [(ngModel)]="settings.toastTextColor" (change)="saveSetting('toastTextColor', settings.toastTextColor)"></div>
              <div class="setting-row"><label>Autohide Main Sidebar</label><label class="switch"><input type="checkbox" [(ngModel)]="settings.sidebarAutohide" (change)="saveSetting('sidebarAutohide', settings.sidebarAutohide)"><span class="slider"></span></label></div>
              <div class="setting-row"><label>Default Plan Duration (min)</label><div class="range-wrap"><input type="range" min="15" max="480" step="15" [(ngModel)]="settings.defaultPlanDuration" (change)="saveSetting('defaultPlanDuration', settings.defaultPlanDuration)"><span>{{ settings.defaultPlanDuration }} min</span></div></div>
              <div class="setting-row"><label>Show Table Header Filters</label><label class="switch"><input type="checkbox" [(ngModel)]="settings.showTableHeaderFilters" (change)="saveSetting('showTableHeaderFilters', settings.showTableHeaderFilters)"><span class="slider"></span></label></div>
              <div class="setting-row"><label>Min Records for Filters</label><div class="range-wrap"><input type="range" min="0" max="50" step="1" [(ngModel)]="settings.minRecordsForFilters" (change)="saveSetting('minRecordsForFilters', settings.minRecordsForFilters)"><span>{{ settings.minRecordsForFilters }}</span></div></div>
              <div class="setting-row"><label>Rows Per Page</label><div class="range-wrap"><input type="range" min="5" max="50" step="5" [(ngModel)]="settings.rowsPerPage" (change)="saveSetting('rowsPerPage', settings.rowsPerPage)"><span>{{ settings.rowsPerPage }}</span></div></div>
            </div>
          </section>
        }

        <!-- Module Settings -->
        @if (activeTab === 'modules') {
          <section>
            <h3>Module Visibility</h3>
            <div class="module-list">
              @for (m of moduleKeys; track m.key) {
                <div class="module-row">
                  <span>{{ m.label }}</span>
                  <label class="switch"><input type="checkbox" [(ngModel)]="settings.moduleVisibility[m.key]" [disabled]="m.key==='customers'" (change)="saveSetting('moduleVisibility', settings.moduleVisibility)"><span class="slider"></span></label>
                </div>
              }
            </div>
          </section>
        }

        <!-- Integration Modules -->
        @if (activeTab === 'integrations') {
          <section>
            <h3>Integration Modules</h3>
            <div class="integration-card">
              <div class="integration-header">
                <span>🔗 Zabbix Integration</span>
                <label class="switch"><input type="checkbox" [(ngModel)]="settings.zabbixSettings.enabled" (change)="saveSetting('zabbixSettings', settings.zabbixSettings)"><span class="slider"></span></label>
              </div>
              @if (settings.zabbixSettings.enabled) {
                <div class="integration-body">
                  <div class="form-group"><label>Zabbix URL</label><input type="url" [(ngModel)]="settings.zabbixSettings.url" (change)="saveSetting('zabbixSettings', settings.zabbixSettings)" placeholder="https://zabbix.example.com" class="form-control"></div>
                  <div class="form-group"><label>API Key</label><input type="password" [(ngModel)]="settings.zabbixSettings.apiKey" (change)="saveSetting('zabbixSettings', settings.zabbixSettings)" class="form-control"></div>
                </div>
              }
            </div>
          </section>
        }
      </main>
    </div>

    <!-- Enum Form Modal -->
    @if (showEnumForm) {
      <app-modal [title]="editingId ? 'Edit Item' : 'Add Item'" (close)="showEnumForm=false">
        <form (ngSubmit)="saveEnum()">
          <div class="form-group"><label>Label *</label><input type="text" [(ngModel)]="enumForm.label" name="label" required class="form-control"></div>
          @if (hasColor(enumFormCategory)) { <div class="form-group"><label>Color</label><input type="color" [(ngModel)]="enumForm.color" name="color"></div> }
          <div class="form-actions"><button type="button" class="btn" (click)="showEnumForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    <!-- User Form Modal -->
    @if (showUserForm) {
      <app-modal [title]="editingId ? 'Edit User' : 'Add User'" (close)="showUserForm=false">
        <form (ngSubmit)="saveUser()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="userForm.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>Surname</label><input type="text" [(ngModel)]="userForm.surname" name="surname" class="form-control"></div>
            <div class="form-group"><label>Email</label><input type="email" [(ngModel)]="userForm.email" name="email" class="form-control"></div>
            <div class="form-group"><label>Group</label><app-searchable-select [options]="ugOptions" [value]="userForm.group_id||null" (valueChange)="userForm.group_id=$event||undefined"></app-searchable-select></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showUserForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    <!-- User Group Form Modal -->
    @if (showUGForm) {
      <app-modal [title]="editingId ? 'Edit Group' : 'Add Group'" (close)="showUGForm=false">
        <form (ngSubmit)="saveUG()">
          <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="ugForm.name" name="name" required class="form-control"></div>
          <div class="form-group"><label>Description</label><textarea [(ngModel)]="ugForm.description" name="desc" class="form-control" rows="2"></textarea></div>
          <div class="form-actions"><button type="button" class="btn" (click)="showUGForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    <!-- Address Form Modal -->
    @if (showAddrForm) {
      <app-modal [title]="editingId ? 'Edit Address' : 'Add Address'" (close)="showAddrForm=false">
        <form (ngSubmit)="saveAddr()">
          <div class="form-grid">
            <div class="form-group"><label>Street</label><input type="text" [(ngModel)]="addrForm.street" name="street" class="form-control"></div>
            <div class="form-group"><label>Descriptive No.</label><input type="text" [(ngModel)]="addrForm.descriptive_number" name="dn" class="form-control"></div>
            <div class="form-group"><label>Reference No.</label><input type="text" [(ngModel)]="addrForm.reference_number" name="rn" class="form-control"></div>
            <div class="form-group"><label>City</label><input type="text" [(ngModel)]="addrForm.city" name="city" class="form-control"></div>
            <div class="form-group"><label>ZIP Code</label><input type="text" [(ngModel)]="addrForm.zip_code" name="zip" class="form-control"></div>
            <div class="form-group"><label>State</label><input type="text" [(ngModel)]="addrForm.state" name="state" class="form-control"></div>
            <div class="form-group"><label>GPS Lat</label><input type="number" step="any" [(ngModel)]="addrForm.gps_lat" name="lat" class="form-control"></div>
            <div class="form-group"><label>GPS Lon</label><input type="number" step="any" [(ngModel)]="addrForm.gps_lon" name="lon" class="form-control"></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showAddrForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    <!-- Device Template Form Modal -->
    @if (showDTForm) {
      <app-modal [title]="editingId ? 'Edit Template' : 'Add Template'" (close)="showDTForm=false">
        <form (ngSubmit)="saveDT()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="dtForm.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>Vendor</label><app-searchable-select [options]="vendorOptions" [value]="dtForm.vendor_id||null" (valueChange)="dtForm.vendor_id=$event||undefined"></app-searchable-select></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showDTForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    <!-- Site Form Modal -->
    @if (showSiteForm) {
      <app-modal [title]="editingId ? 'Edit Site' : 'Add Site'" (close)="showSiteForm=false">
        <form (ngSubmit)="saveSite()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="siteForm.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>Address</label><app-searchable-select [options]="addressOptions" [value]="siteForm.address_id||null" (valueChange)="siteForm.address_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group full-width"><label>Description</label><textarea [(ngModel)]="siteForm.description" name="desc" class="form-control" rows="2"></textarea></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showSiteForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    <!-- Rack Form Modal -->
    @if (showRackForm) {
      <app-modal [title]="editingId ? 'Edit Rack' : 'Add Rack'" (close)="showRackForm=false">
        <form (ngSubmit)="saveRack()">
          <div class="form-grid">
            <div class="form-group"><label>Name *</label><input type="text" [(ngModel)]="rackForm.name" name="name" required class="form-control"></div>
            <div class="form-group"><label>Site</label><app-searchable-select [options]="siteOptions" [value]="rackForm.site_id||null" (valueChange)="rackForm.site_id=$event||undefined"></app-searchable-select></div>
            <div class="form-group"><label>U Height</label><input type="number" [(ngModel)]="rackForm.u_height" name="uh" class="form-control"></div>
            <div class="form-group full-width"><label>Description</label><textarea [(ngModel)]="rackForm.description" name="desc" class="form-control" rows="2"></textarea></div>
          </div>
          <div class="form-actions"><button type="button" class="btn" (click)="showRackForm=false">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
        </form>
      </app-modal>
    }

    @if (confirmItem) {
      <app-confirm-modal title="Confirm" message="Are you sure?" (confirm)="doToggleDelete()" (cancel)="confirmItem=null"></app-confirm-modal>
    }
  `,
  styles: [`
    .settings-layout { display: flex; gap: 0; min-height: calc(100vh - 80px); }
    .settings-sidebar { width: 260px; min-width: 260px; background: var(--bg-card,#fff); border-right: 1px solid var(--border-color,#e5e7eb); padding: 20px 0; }
    .settings-sidebar h2 { padding: 0 20px 16px; margin: 0; font-size: 20px; font-weight: 700; border-bottom: 1px solid var(--border-color,#eee); }
    .nav-category { border-bottom: 1px solid var(--border-color,#f0f0f0); }
    .cat-header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--text-primary,#333); text-align: left; }
    .cat-header:hover { background: var(--bg-hover,#f8f9fa); }
    .cat-items { padding: 0 0 8px; }
    .nav-item { display: block; width: 100%; padding: 8px 20px 8px 36px; border: none; background: none; cursor: pointer; font-size: 13px; color: var(--text-secondary,#666); text-align: left; }
    .nav-item:hover { background: var(--bg-hover,#f8f9fa); color: var(--text-primary,#333); }
    .nav-item.active { background: var(--bg-highlight,#ebf5ff); color: #3498db; font-weight: 600; border-right: 3px solid #3498db; }
    .settings-content { flex: 1; padding: 24px; overflow-y: auto; }
    section h3 { margin: 0 0 16px; font-size: 20px; font-weight: 700; }
    .enum-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
    .search-input { max-width: 300px; }
    .enum-table { width: 100%; border-collapse: collapse; background: var(--bg-card,#fff); border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color,#e5e7eb); }
    .enum-table th { padding: 10px 12px; font-size: 12px; font-weight: 600; color: var(--text-secondary,#666); border-bottom: 1px solid var(--border-color,#eee); text-align: left; }
    .enum-table td { padding: 8px 12px; border-bottom: 1px solid var(--border-color,#f0f0f0); font-size: 14px; }
    .enum-table tr.deleted td { opacity: 0.4; text-decoration: line-through; }
    .enum-table.compact th, .enum-table.compact td { padding: 6px 10px; font-size: 13px; }
    .color-swatch { display: inline-block; width: 20px; height: 20px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); vertical-align: middle; }
    .actions { display: flex; gap: 4px; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px; border-radius: 4px; }
    .btn-icon:hover { background: var(--bg-hover,#f0f0f0); }
    .empty { text-align: center; color: var(--text-secondary,#999); padding: 20px !important; }
    .sub-section { margin-bottom: 24px; }
    .sub-section h4 { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
    .settings-list { display: flex; flex-direction: column; gap: 0; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-color,#f0f0f0); gap: 16px; }
    .setting-row label:first-child { font-size: 14px; font-weight: 500; min-width: 200px; color: var(--text-primary,#333); }
    .segmented { display: flex; gap: 0; border: 1px solid var(--border-color,#ddd); border-radius: 8px; overflow: hidden; }
    .segmented button { padding: 6px 14px; border: none; background: var(--bg-card,#fff); cursor: pointer; font-size: 13px; border-right: 1px solid var(--border-color,#ddd); color: var(--text-primary,#333); }
    .segmented button:last-child { border-right: none; }
    .segmented button.active { background: #3498db; color: #fff; }
    .range-wrap { display: flex; align-items: center; gap: 12px; } .range-wrap input[type=range] { width: 200px; } .range-wrap span { font-size: 13px; font-weight: 600; min-width: 60px; }
    .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 24px; transition: 0.3s; }
    .slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
    .switch input:checked + .slider { background: #3498db; }
    .switch input:checked + .slider::before { transform: translateX(20px); }
    .switch input:disabled + .slider { opacity: 0.5; cursor: not-allowed; }
    .module-list { display: flex; flex-direction: column; gap: 0; }
    .module-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-color,#f0f0f0); }
    .module-row span { font-size: 14px; font-weight: 500; }
    .integration-card { background: var(--bg-card,#fff); border: 1px solid var(--border-color,#e5e7eb); border-radius: 12px; overflow: hidden; }
    .integration-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; font-weight: 600; font-size: 15px; }
    .integration-body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--border-color,#eee); padding-top: 16px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; } .form-group.full-width { grid-column: 1/-1; }
    .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary,#666); }
    .form-control { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input,#fff); color: var(--text-primary,#333); box-sizing: border-box; }
    textarea.form-control { resize: vertical; font-family: inherit; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color,#eee); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card,#fff); color: var(--text-primary,#333); }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
    .btn-sm2 { padding: 6px 12px; font-size: 13px; }
    .arrow { font-size: 12px; }
  `]
})
export class SettingsComponent implements OnInit {
  navCategories: NavCategory[] = [
    { key: 'userManagement', label: 'User Management', icon: '👥', items: [
      { key: 'users', label: 'Users' }, { key: 'userGroups', label: 'User Groups' }
    ]},
    { key: 'enumerations', label: 'Enumerations', icon: '📋', items: [
      { key: 'vendor', label: 'Vendors' }, { key: 'legalForm', label: 'Legal Forms' },
      { key: 'deviceGroup', label: 'Device Groups' }, { key: 'deviceType', label: 'Device Types' },
      { key: 'planCategory', label: 'Plan Categories' }, { key: 'reportingMethod', label: 'Reporting Methods' },
      { key: 'planPriority', label: 'Plan Priorities' }, { key: 'addresses', label: 'Addresses' },
      { key: 'deviceTemplates', label: 'Device Templates' }, { key: 'sites', label: 'Sites' }, { key: 'racks', label: 'Racks' }
    ]},
    { key: 'ipamSettings', label: 'IPAM', icon: '🌐', items: [
      { key: 'ipamRoles', label: 'Roles' }, { key: 'ipamTags', label: 'Tags' },
      { key: 'l2vpnSettings', label: 'L2VPN Settings' }, { key: 'l3vpnSettings', label: 'L3VPN Settings' }
    ]},
    { key: 'systemSettings', label: 'System Settings', icon: '⚙️', items: [
      { key: 'uiSettings', label: 'UI Settings' }, { key: 'modules', label: 'Modules' }, { key: 'integrations', label: 'Integration Modules' }
    ]}
  ];
  expandedCat = 'userManagement';
  activeTab = 'users';

  enums: EnumValue[] = [];
  users: User[] = [];
  userGroups: UserGroup[] = [];
  addresses: Address[] = [];
  deviceTemplates: DeviceTemplate[] = [];
  sites: Site[] = [];
  racks: Rack[] = [];
  enumSearch = '';

  settings: AppSettings = {
    appName: 'CRM', theme: 'light', sidebarAutohide: false, toastOpacity: 0.95,
    toastPosition: 'top-right', toastTextColor: '#ffffff', glossyMode: false,
    rowsPerPage: 10, showTableHeaderFilters: true, minRecordsForFilters: 5, defaultPlanDuration: 60,
    moduleVisibility: { customers: true, devices: true, ipam: true, planning: true, invoicing: false, warehouse: false, tools: true },
    zabbixSettings: { enabled: false, url: '', apiKey: '' }
  };

  toastPositions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  themeOptions: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
  moduleKeys = [
    { key: 'customers' as const, label: 'Customers' }, { key: 'devices' as const, label: 'Devices' },
    { key: 'planning' as const, label: 'Planning' }, { key: 'ipam' as const, label: 'IPAM' },
    { key: 'invoicing' as const, label: 'Invoicing' }, { key: 'warehouse' as const, label: 'Warehouse' },
    { key: 'tools' as const, label: 'Tools' }
  ];

  l2vpnSubs = [
    { cat: 'l2VpnEncapsulation', label: 'Encapsulation', search: '' },
    { cat: 'l2VpnMode', label: 'Mode', search: '' },
    { cat: 'l2VpnSignalization', label: 'Signalization', search: '' }
  ];
  l3vpnSubs = [
    { cat: 'routeDistinguishers', label: 'Route Distinguishers', search: '' },
    { cat: 'vpnTargets', label: 'VPN Targets', search: '' }
  ];

  // Form state
  showEnumForm = false; showUserForm = false; showUGForm = false; showAddrForm = false;
  showDTForm = false; showSiteForm = false; showRackForm = false;
  editingId: string | null = null;
  confirmItem: any = null;
  confirmEntity = '';
  enumForm: Partial<EnumValue> & { category?: string } = {};
  enumFormCategory = '';
  userForm: Partial<User> = {};
  ugForm: Partial<UserGroup> = {};
  addrForm: Partial<Address> = {};
  dtForm: Partial<DeviceTemplate> = {};
  siteForm: Partial<Site> = {};
  rackForm: Partial<Rack> = {};

  // Column definitions
  userColumns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true }, { key: 'surname', label: 'Surname' }, { key: 'email', label: 'Email' },
    { key: 'group', label: 'Group', render: (r: any) => this.userGroups.find(g => g.id === r.group_id)?.name || '' }
  ];
  ugColumns: ColumnDef[] = [{ key: 'name', label: 'Name', sortable: true }, { key: 'description', label: 'Description' }];
  addressColumns: ColumnDef[] = [
    { key: 'street', label: 'Street', sortable: true }, { key: 'city', label: 'City' }, { key: 'zip_code', label: 'ZIP' }, { key: 'state', label: 'State' }
  ];
  dtColumns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'vendor', label: 'Vendor', render: (r: any) => this.enums.find(e => e.id === r.vendor_id)?.label || '' }
  ];
  siteColumns: ColumnDef[] = [{ key: 'name', label: 'Name', sortable: true }, { key: 'description', label: 'Description' }];
  rackColumns: ColumnDef[] = [
    { key: 'name', label: 'Name', sortable: true }, { key: 'u_height', label: 'U Height' },
    { key: 'site', label: 'Site', render: (r: any) => this.sites.find(s => s.id === r.site_id)?.name || '' }
  ];

  private enumCategories = new Set(['vendor', 'legalForm', 'deviceGroup', 'deviceType', 'planCategory', 'reportingMethod', 'planPriority']);
  private colorCategories = new Set(['planCategory', 'planPriority', 'ipamRoles', 'ipamTags', 'tags']);

  constructor(private api: ApiService, private toast: ToastService, public themeService: ThemeService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.api.getEnums().subscribe(d => this.enums = d);
    this.api.getUsers().subscribe(d => this.users = d);
    this.api.getUserGroups().subscribe(d => this.userGroups = d);
    this.api.getAddresses().subscribe(d => this.addresses = d);
    this.api.getDeviceTemplates().subscribe(d => this.deviceTemplates = d);
    this.api.getSites().subscribe(d => this.sites = d);
    this.api.getRacks().subscribe(d => this.racks = d);
    this.api.getSettings().subscribe(s => {
      if (s['appName'] !== undefined) this.settings.appName = s['appName'];
      if (s['theme'] !== undefined) this.settings.theme = s['theme'];
      if (s['sidebarAutohide'] !== undefined) this.settings.sidebarAutohide = s['sidebarAutohide'];
      if (s['toastOpacity'] !== undefined) this.settings.toastOpacity = s['toastOpacity'];
      if (s['toastPosition'] !== undefined) this.settings.toastPosition = s['toastPosition'];
      if (s['toastTextColor'] !== undefined) this.settings.toastTextColor = s['toastTextColor'];
      if (s['glossyMode'] !== undefined) this.settings.glossyMode = s['glossyMode'];
      if (s['rowsPerPage'] !== undefined) this.settings.rowsPerPage = s['rowsPerPage'];
      if (s['showTableHeaderFilters'] !== undefined) this.settings.showTableHeaderFilters = s['showTableHeaderFilters'];
      if (s['minRecordsForFilters'] !== undefined) this.settings.minRecordsForFilters = s['minRecordsForFilters'];
      if (s['defaultPlanDuration'] !== undefined) this.settings.defaultPlanDuration = s['defaultPlanDuration'];
      if (s['moduleVisibility'] !== undefined) this.settings.moduleVisibility = { ...this.settings.moduleVisibility, ...s['moduleVisibility'] };
      if (s['zabbixSettings'] !== undefined) this.settings.zabbixSettings = { ...this.settings.zabbixSettings, ...s['zabbixSettings'] };
    });
  }

  setTab(key: string) { this.activeTab = key; this.enumSearch = ''; }
  isEnumTab(tab: string) { return this.enumCategories.has(tab); }
  hasColor(cat: string) { return this.colorCategories.has(cat); }

  getEnumTitle(tab: string) {
    const map: Record<string, string> = { vendor: 'Vendors', legalForm: 'Legal Forms', deviceGroup: 'Device Groups', deviceType: 'Device Types', planCategory: 'Plan Categories', reportingMethod: 'Reporting Methods', planPriority: 'Plan Priorities', ipamRoles: 'IPAM Roles', ipamTags: 'Tags' };
    return map[tab] || tab;
  }

  get ugOptions() { return this.userGroups.filter(g => !g.is_deleted).map(g => ({ value: g.id, label: g.name })); }
  get vendorOptions() { return this.enums.filter(e => e.category === 'vendor' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get addressOptions() { return this.addresses.filter(a => !a.is_deleted).map(a => ({ value: a.id, label: `${a.street || ''} ${a.city || ''}`.trim() || a.id })); }
  get siteOptions() { return this.sites.filter(s => !s.is_deleted).map(s => ({ value: s.id, label: s.name })); }

  filteredEnums(): EnumValue[] {
    const cat = this.activeTab === 'ipamRoles' ? 'ipamRoles' : this.activeTab === 'ipamTags' ? 'tags' : this.activeTab;
    return this.enums.filter(e => e.category === cat && (!this.enumSearch || e.label.toLowerCase().includes(this.enumSearch.toLowerCase())));
  }

  filterByCategory(cat: string, search: string): EnumValue[] {
    return this.enums.filter(e => e.category === cat && (!search || e.label.toLowerCase().includes(search.toLowerCase())));
  }

  // Enum CRUD
  openEnumForm(item?: EnumValue) {
    this.editingId = item?.id || null;
    this.enumFormCategory = item?.category || (this.activeTab === 'ipamRoles' ? 'ipamRoles' : this.activeTab === 'ipamTags' ? 'tags' : this.activeTab);
    this.enumForm = item ? { label: item.label, color: item.color || '#3498db' } : { label: '', color: '#3498db' };
    this.showEnumForm = true;
  }
  openEnumFormFor(cat: string) { this.editingId = null; this.enumFormCategory = cat; this.enumForm = { label: '', color: '#3498db' }; this.showEnumForm = true; }
  copyEnum(item: EnumValue) { this.editingId = null; this.enumFormCategory = item.category; this.enumForm = { label: item.label + ' (copy)', color: item.color }; this.showEnumForm = true; }
  saveEnum() {
    const data = { label: this.enumForm.label, color: this.hasColor(this.enumFormCategory) ? this.enumForm.color : undefined, category: this.enumFormCategory };
    const obs = this.editingId ? this.api.updateEnum(this.editingId, data) : this.api.createEnum(data);
    obs.subscribe({ next: () => { this.showEnumForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // User CRUD
  openUserForm(item?: User) { this.editingId = item?.id || null; this.userForm = item ? { ...item } : {}; this.showUserForm = true; }
  saveUser() {
    const obs = this.editingId ? this.api.updateUser(this.editingId, this.userForm) : this.api.createUser(this.userForm);
    obs.subscribe({ next: () => { this.showUserForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // User Group CRUD
  openUGForm(item?: UserGroup) { this.editingId = item?.id || null; this.ugForm = item ? { ...item } : {}; this.showUGForm = true; }
  saveUG() {
    const obs = this.editingId ? this.api.updateUserGroup(this.editingId, this.ugForm) : this.api.createUserGroup(this.ugForm);
    obs.subscribe({ next: () => { this.showUGForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // Address CRUD
  openAddrForm(item?: Address) { this.editingId = item?.id || null; this.addrForm = item ? { ...item } : {}; this.showAddrForm = true; }
  saveAddr() {
    const obs = this.editingId ? this.api.updateAddress(this.editingId, this.addrForm) : this.api.createAddress(this.addrForm);
    obs.subscribe({ next: () => { this.showAddrForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // Device Template CRUD
  openDTForm(item?: DeviceTemplate) { this.editingId = item?.id || null; this.dtForm = item ? { ...item } : {}; this.showDTForm = true; }
  saveDT() {
    const obs = this.editingId ? this.api.updateDeviceTemplate(this.editingId, this.dtForm) : this.api.createDeviceTemplate(this.dtForm);
    obs.subscribe({ next: () => { this.showDTForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // Site CRUD
  openSiteForm(item?: Site) { this.editingId = item?.id || null; this.siteForm = item ? { ...item } : {}; this.showSiteForm = true; }
  saveSite() {
    const obs = this.editingId ? this.api.updateSite(this.editingId, this.siteForm) : this.api.createSite(this.siteForm);
    obs.subscribe({ next: () => { this.showSiteForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // Rack CRUD
  openRackForm(item?: Rack) { this.editingId = item?.id || null; this.rackForm = item ? { ...item } : {}; this.showRackForm = true; }
  saveRack() {
    const obs = this.editingId ? this.api.updateRack(this.editingId, this.rackForm) : this.api.createRack(this.rackForm);
    obs.subscribe({ next: () => { this.showRackForm = false; this.toast.success('Saved'); this.loadAll(); } });
  }

  // Settings
  setTheme(t: 'light' | 'dark' | 'system') { this.settings.theme = t; this.saveSetting('theme', t); this.themeService.setTheme(t); }
  saveSetting(key: string, value: any) {
    this.api.updateSetting(key, value).subscribe({ next: () => this.toast.success(`${key} updated`) });
    // Apply DOM-affecting settings immediately
    if (key === 'glossyMode') this.themeService.setGlossy(value);
  }

  // Toggle Delete
  doToggleDelete() {
    if (!this.confirmItem) return;
    const cb = { next: () => { this.confirmItem = null; this.loadAll(); } };
    switch (this.confirmEntity) {
      case 'enums': this.api.toggleDeleteEnum(this.confirmItem.id).subscribe(cb); break;
      case 'users': this.api.toggleDeleteUser(this.confirmItem.id).subscribe(cb); break;
      case 'user-groups': this.api.toggleDeleteUserGroup(this.confirmItem.id).subscribe(cb); break;
      case 'addresses': this.api.toggleDeleteAddress(this.confirmItem.id).subscribe(cb); break;
      case 'device-templates': this.api.toggleDeleteDeviceTemplate(this.confirmItem.id).subscribe(cb); break;
      case 'sites': this.api.toggleDeleteSite(this.confirmItem.id).subscribe(cb); break;
      case 'racks': this.api.toggleDeleteRack(this.confirmItem.id).subscribe(cb); break;
    }
  }
}
