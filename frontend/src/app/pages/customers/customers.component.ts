import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { DataTableComponent } from '../../shared/data-table.component';
import { ModalComponent } from '../../shared/modal.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';
import { Customer, EnumValue, Address, ColumnDef } from '../../models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent],
  template: `
    <div class="page-header">
      <h1>Customers</h1>
    </div>

    <app-data-table
      [data]="customers"
      [columns]="columns"
      (addNew)="openForm()"
      (edit)="openForm($event)"
      (copy)="copyCustomer($event)"
      (toggleDelete)="confirmToggleDelete($event)"
      (showHistory)="showHistoryFor = $event">
    </app-data-table>

    <!-- Form Modal -->
    @if (showForm) {
      <app-modal [title]="editingId ? 'Edit Customer' : 'Add Customer'" (close)="requestCloseForm('customer')">
        <form (ngSubmit)="saveCustomer()">
          <div class="form-grid">
            <div class="form-group">
              <label>Customer Number</label>
              <input type="text" [(ngModel)]="form.customer_number" name="customer_number" readonly class="form-control">
            </div>
            <div class="form-group">
              <label>Legal Form</label>
              <app-searchable-select
                [options]="legalFormOptions"
                [value]="form.legal_form_id || null"
                (valueChange)="form.legal_form_id = $event || undefined"
                placeholder="Select legal form...">
              </app-searchable-select>
            </div>

            @if (isCompany) {
              <div class="form-group full-width">
                <label>Company Name *</label>
                <input type="text" [(ngModel)]="form.company_name" name="company_name" required class="form-control">
              </div>
              <div class="form-group">
                <label>IČO</label>
                <input type="text" [(ngModel)]="form.ico" name="ico" class="form-control">
              </div>
              <div class="form-group">
                <label>DIČ</label>
                <input type="text" [(ngModel)]="form.dic" name="dic" class="form-control">
              </div>
              <div class="form-group">
                <label>IČ DPH</label>
                <input type="text" [(ngModel)]="form.ic_dph" name="ic_dph" class="form-control">
              </div>
            } @else {
              <div class="form-group">
                <label>First Name *</label>
                <input type="text" [(ngModel)]="form.first_name" name="first_name" required class="form-control">
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" [(ngModel)]="form.last_name" name="last_name" required class="form-control">
              </div>
              <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" [(ngModel)]="form.date_of_birth" name="dob" class="form-control">
              </div>
              <div class="form-group">
                <label>ID Card Number</label>
                <input type="text" [(ngModel)]="form.id_card_number" name="id_card" class="form-control">
              </div>
              <div class="form-group">
                <label>Personal ID</label>
                <input type="text" [(ngModel)]="form.personal_id" name="personal_id" class="form-control">
              </div>
            }

            <div class="form-group">
              <label>Address</label>
              <div class="select-with-add">
                <app-searchable-select
                  [options]="addressOptions"
                  [value]="form.address_id || null"
                  (valueChange)="form.address_id = $event || undefined"
                  placeholder="Select address...">
                </app-searchable-select>
                <button type="button" class="btn-add-new" title="Add new address" (click)="openNewAddress('main')">+</button>
              </div>
            </div>
            <div class="form-group">
              <label>Correspondence Address</label>
              <div class="select-with-add">
                <app-searchable-select
                  [options]="corrAddressOptions"
                  [value]="form.correspondence_address_id || null"
                  (valueChange)="form.correspondence_address_id = $event || undefined"
                  placeholder="Same as address...">
                </app-searchable-select>
                <button type="button" class="btn-add-new" title="Add new address" (click)="openNewAddress('correspondence')">+</button>
              </div>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" [(ngModel)]="form.email" name="email" required class="form-control">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="text" [(ngModel)]="form.phone" name="phone" class="form-control">
            </div>
            <div class="form-group">
              <label>Mobile</label>
              <input type="text" [(ngModel)]="form.mobile" name="mobile" class="form-control">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn" (click)="requestCloseForm('customer')">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editingId ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </app-modal>
    }

    <!-- New Address Modal -->
    @if (showNewAddressForm) {
      <app-modal title="Add New Address" (close)="requestCloseForm('address')">
        <form (ngSubmit)="saveNewAddress()">
          <div class="form-grid">
            <div class="form-group"><label>Street</label><input type="text" [(ngModel)]="newAddrForm.street" name="n_street" class="form-control"></div>
            <div class="form-group"><label>Descriptive No.</label><input type="text" [(ngModel)]="newAddrForm.descriptive_number" name="n_dn" class="form-control"></div>
            <div class="form-group"><label>Reference No.</label><input type="text" [(ngModel)]="newAddrForm.reference_number" name="n_rn" class="form-control"></div>
            <div class="form-group"><label>City</label><input type="text" [(ngModel)]="newAddrForm.city" name="n_city" class="form-control"></div>
            <div class="form-group"><label>ZIP Code</label><input type="text" [(ngModel)]="newAddrForm.zip_code" name="n_zip" class="form-control"></div>
            <div class="form-group"><label>State</label><input type="text" [(ngModel)]="newAddrForm.state" name="n_state" class="form-control"></div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn" (click)="requestCloseForm('address')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Address</button>
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

    <!-- Confirm Delete -->
    @if (confirmItem) {
      <app-confirm-modal
        [title]="confirmItem.is_deleted ? 'Restore Customer' : 'Delete Customer'"
        [message]="'Are you sure you want to ' + (confirmItem.is_deleted ? 'restore' : 'delete') + ' this customer?'"
        [confirmText]="confirmItem.is_deleted ? 'Restore' : 'Delete'"
        (confirm)="toggleDelete()"
        (cancel)="confirmItem = null">
      </app-confirm-modal>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary,#333); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary,#666); }
    .form-control { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input,#fff); color: var(--text-primary,#333); }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color,#eee); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card,#fff); }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
    .btn-primary:hover { background: #2980b9; }
    .select-with-add { display: flex; gap: 6px; align-items: flex-start; }
    .select-with-add app-searchable-select { flex: 1; }
    .btn-add-new { width: 36px; height: 36px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; background: var(--bg-card,#fff); color: var(--primary,#3498db); font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .btn-add-new:hover { background: var(--primary,#3498db); color: #fff; }
  `]
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  enums: EnumValue[] = [];
  addresses: Address[] = [];
  showForm = false;
  editingId: string | null = null;
  confirmItem: Customer | null = null;
  showHistoryFor: any = null;
  showNewAddressForm = false;
  showDiscardConfirm = false;
  newAddrForm: Partial<Address> = {};
  newAddrTarget: 'main' | 'correspondence' = 'main';
  private pendingCloseTarget: 'customer' | 'address' | null = null;
  private formSnapshot = '';
  private newAddressSnapshot = '';

  form: Partial<Customer> = {};

  columns: ColumnDef[] = [
    { key: 'customer_number', label: 'Customer #', sortable: true },
    { key: 'company_name', label: 'Company', sortable: true },
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City', render: (item: any) => this.getAddressCity(item.address_id) },
  ];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getCustomers().subscribe(d => this.customers = d);
    this.api.getEnums().subscribe(e => this.enums = e);
    this.api.getAddresses().subscribe(a => this.addresses = a);
  }

  get legalFormOptions() {
    return this.enums.filter(e => e.category === 'legalForm' && !e.is_deleted)
      .map(e => ({ value: e.id, label: e.label }));
  }

  get addressOptions() {
    return this.addresses.filter(a => !a.is_deleted)
      .map(a => ({ value: a.id, label: `${a.street} ${a.descriptive_number}, ${a.city}` }));
  }

  get corrAddressOptions() {
    return this.addressOptions;
  }

  openNewAddress(target: 'main' | 'correspondence') {
    this.newAddrTarget = target;
    this.newAddrForm = {};
    this.newAddressSnapshot = this.serialize(this.newAddrForm);
    this.showNewAddressForm = true;
  }

  saveNewAddress() {
    this.api.createAddress(this.newAddrForm).subscribe({
      next: (created: any) => {
        this.toast.success('Address created');
        this.performClose('address');
        this.api.getAddresses().subscribe(a => {
          this.addresses = a;
          if (created?.id) {
            if (this.newAddrTarget === 'main') {
              this.form.address_id = created.id;
            } else {
              this.form.correspondence_address_id = created.id;
            }
          }
        });
      },
      error: () => this.toast.error('Failed to create address')
    });
  }

  get isCompany(): boolean {
    if (!this.form.legal_form_id) return false;
    const lf = this.enums.find(e => e.id === this.form.legal_form_id);
    return lf?.label === 'Company';
  }

  getAddressCity(addressId?: string): string {
    if (!addressId) return '';
    const addr = this.addresses.find(a => a.id === addressId);
    return addr?.city || '';
  }

  openForm(customer?: Customer) {
    if (customer) {
      this.editingId = customer.id;
      this.form = { ...customer };
    } else {
      this.editingId = null;
      this.form = { customer_number: `C-${Date.now().toString(36).toUpperCase()}` };
    }
    this.formSnapshot = this.serialize(this.form);
    this.showForm = true;
  }

  closeForm() {
    this.performClose('customer');
  }

  requestCloseForm(target: 'customer' | 'address') {
    if (this.hasUnsavedChanges(target)) {
      this.pendingCloseTarget = target;
      this.showDiscardConfirm = true;
      return;
    }
    this.performClose(target);
  }

  confirmCloseForm() {
    if (this.pendingCloseTarget) {
      this.performClose(this.pendingCloseTarget);
    }
    this.cancelCloseForm();
  }

  cancelCloseForm() {
    this.showDiscardConfirm = false;
    this.pendingCloseTarget = null;
  }

  private hasUnsavedChanges(target: 'customer' | 'address'): boolean {
    if (target === 'address') {
      return this.serialize(this.newAddrForm) !== this.newAddressSnapshot;
    }
    return this.serialize(this.form) !== this.formSnapshot;
  }

  private performClose(target: 'customer' | 'address') {
    if (target === 'address') {
      this.showNewAddressForm = false;
      this.newAddrForm = {};
      this.newAddressSnapshot = '';
      return;
    }

    this.showForm = false;
    this.form = {};
    this.editingId = null;
    this.formSnapshot = '';
  }

  private serialize(value: unknown): string {
    return JSON.stringify(value ?? {});
  }

  saveCustomer() {
    const data = { ...this.form };
    // Default correspondence address to main address if not set
    if (!data.correspondence_address_id && data.address_id) {
      data.correspondence_address_id = data.address_id;
    }
    const obs = this.editingId
      ? this.api.updateCustomer(this.editingId, data)
      : this.api.createCustomer(data);
    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Customer updated' : 'Customer created');
        this.closeForm();
        this.load();
      },
      error: () => this.toast.error('Failed to save customer')
    });
  }

  copyCustomer(customer: Customer) {
    this.form = { ...customer, id: undefined as any, customer_number: `C-${Date.now().toString(36).toUpperCase()}` };
    this.editingId = null;
    this.formSnapshot = this.serialize(this.form);
    this.showForm = true;
  }

  confirmToggleDelete(customer: Customer) {
    this.confirmItem = customer;
  }

  toggleDelete() {
    if (!this.confirmItem) return;
    this.api.toggleDeleteCustomer(this.confirmItem.id).subscribe({
      next: () => {
        this.toast.success(this.confirmItem!.is_deleted ? 'Customer restored' : 'Customer deleted');
        this.confirmItem = null;
        this.load();
      },
      error: () => this.toast.error('Operation failed')
    });
  }
}
