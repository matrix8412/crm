import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { DataTableComponent } from '../../shared/data-table.component';
import { ModalComponent } from '../../shared/modal.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal.component';
import { SearchableSelectComponent } from '../../shared/searchable-select.component';
import { Plan, Customer, Device, EnumValue, Comment, User, ColumnDef } from '../../models';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, ConfirmModalComponent, SearchableSelectComponent],
  template: `
    <div class="page-header">
      <h1>Planning</h1>
      <div class="view-toggle">
        <button [class.active]="viewMode==='table'" (click)="viewMode='table'">📋 Table</button>
        <button [class.active]="viewMode==='calendar'" (click)="viewMode='calendar'">📅 Calendar</button>
      </div>
    </div>

    @if (viewMode === 'table') {
      <app-data-table
        [data]="plans"
        [columns]="columns"
        (addNew)="openForm()"
        (edit)="openForm($event)"
        (copy)="copyPlan($event)"
        (toggleDelete)="confirmItem = $event"
        (showHistory)="showHistoryFor = $event">
      </app-data-table>
    } @else {
      <div class="calendar card">
        <div class="calendar-header">
          <button class="btn btn-sm" (click)="calPrev()">← Prev</button>
          <h3>{{ calendarTitle }}</h3>
          <button class="btn btn-sm" (click)="calNext()">Next →</button>
        </div>
        <div class="calendar-grid">
          @for (day of calendarDays; track day.date) {
            <div class="calendar-day" [class.today]="isToday(day.date)" [class.other-month]="day.otherMonth">
              <div class="day-number">{{ day.date.getDate() }}</div>
              @for (plan of getPlansForDay(day.date); track plan.id) {
                <div class="day-plan" [style.border-left-color]="getCategoryColor(plan.category_id)" (click)="openForm(plan)">
                  {{ plan.description | slice:0:30 }}
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (showForm) {
      <app-modal [title]="editingId ? 'Edit Plan' : 'Add Plan'" (close)="requestCloseForm()">
        <form (ngSubmit)="savePlan()">
          <div class="form-grid">
            <div class="form-group">
              <label>Category *</label>
              <app-searchable-select [options]="categoryOptions" [value]="form.category_id||null" (valueChange)="form.category_id=$event||undefined" placeholder="Select category..."></app-searchable-select>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <app-searchable-select [options]="priorityOptions" [value]="form.priority_id||null" (valueChange)="form.priority_id=$event||undefined" placeholder="Select priority..."></app-searchable-select>
            </div>
            <div class="form-group">
              <label>Scheduled From</label>
              <input type="datetime-local" [(ngModel)]="form.scheduled_from" name="from" class="form-control">
            </div>
            <div class="form-group">
              <label>Scheduled To</label>
              <input type="datetime-local" [(ngModel)]="form.scheduled_to" name="to" class="form-control">
            </div>
            <div class="form-group">
              <label>Reporting Method</label>
              <app-searchable-select [options]="reportMethodOptions" [value]="form.reporting_method_id||null" (valueChange)="form.reporting_method_id=$event||undefined" placeholder="Select method..."></app-searchable-select>
            </div>
            <div class="form-group">
              <label>Customer</label>
              <app-searchable-select [options]="customerOptions" [value]="form.customer_id||null" (valueChange)="form.customer_id=$event||undefined" placeholder="Select customer..."></app-searchable-select>
            </div>
            <div class="form-group">
              <label>Device</label>
              <app-searchable-select [options]="deviceOptions" [value]="form.device_id||null" (valueChange)="form.device_id=$event||undefined" placeholder="Select device..."></app-searchable-select>
            </div>
            <div class="form-group full-width">
              <label>Description *</label>
              <textarea [(ngModel)]="form.description" name="desc" required class="form-control" rows="3"></textarea>
            </div>
          </div>

          @if (editingId) {
            <div class="comments-section">
              <h4>Comments</h4>
              @for (comment of planComments; track comment.id) {
                <div class="comment">
                  <div class="comment-meta">
                    <strong>{{ getUserName(comment.user_id) }}</strong>
                    <span>{{ comment.created_at | date:'short' }}</span>
                  </div>
                  <p>{{ comment.text }}</p>
                </div>
              }
              <div class="add-comment">
                <textarea [(ngModel)]="newComment" name="newComment" placeholder="Add a comment..." class="form-control" rows="2"></textarea>
                <button type="button" class="btn btn-sm" (click)="addComment()">Add Comment</button>
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
        [title]="confirmItem.is_deleted ? 'Restore Plan' : 'Delete Plan'"
        [message]="'Are you sure?'"
        (confirm)="toggleDelete()"
        (cancel)="confirmItem = null">
      </app-confirm-modal>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .view-toggle { display: flex; gap: 4px; }
    .view-toggle button { padding: 8px 14px; border: 1px solid var(--border-color,#ddd); background: var(--bg-card,#fff); cursor: pointer; font-size: 13px; border-radius: 8px; }
    .view-toggle button.active { background: #3498db; color: #fff; border-color: #3498db; }
    .card { background: var(--bg-card,#fff); border: 1px solid var(--border-color,#e0e0e0); border-radius: 12px; padding: 20px; }
    .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .calendar-header h3 { margin: 0; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border-color,#e0e0e0); border: 1px solid var(--border-color,#e0e0e0); border-radius: 8px; overflow: hidden; }
    .calendar-day { background: var(--bg-card,#fff); min-height: 100px; padding: 8px; }
    .calendar-day.other-month { opacity: 0.4; }
    .calendar-day.today { background: #ebf5fb; }
    .day-number { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .day-plan { font-size: 11px; padding: 2px 6px; border-radius: 4px; border-left: 3px solid #3498db; background: var(--bg-hover,#f8f9fa); margin-bottom: 2px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .day-plan:hover { background: #e8f4fd; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 13px; font-weight: 500; color: var(--text-secondary,#666); }
    .form-control { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input,#fff); color: var(--text-primary,#333); box-sizing: border-box; }
    textarea.form-control { resize: vertical; font-family: inherit; }
    .comments-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color,#eee); }
    .comments-section h4 { margin: 0 0 12px; font-size: 15px; }
    .comment { padding: 10px; border: 1px solid var(--border-color,#eee); border-radius: 8px; margin-bottom: 8px; }
    .comment-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary,#888); margin-bottom: 4px; }
    .comment p { margin: 0; font-size: 14px; }
    .add-comment { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color,#eee); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card,#fff); }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
    .btn-sm { padding: 6px 12px; font-size: 13px; }
  `]
})
export class PlanningComponent implements OnInit {
  plans: Plan[] = [];
  customers: Customer[] = [];
  devices: Device[] = [];
  enums: EnumValue[] = [];
  users: User[] = [];
  planComments: Comment[] = [];
  showForm = false;
  editingId: string | null = null;
  confirmItem: Plan | null = null;
  showHistoryFor: any = null;
  viewMode: 'table' | 'calendar' = 'table';
  newComment = '';
  calendarDate = new Date();
  showDiscardConfirm = false;
  private formSnapshot = '';

  form: Partial<Plan> = {};

  columns: ColumnDef[] = [
    { key: 'scheduled_from', label: 'Scheduled', sortable: true, render: (item: any) => item.scheduled_from ? new Date(item.scheduled_from).toLocaleString() : '' },
    { key: 'category', label: 'Category', render: (item: any) => this.enumLabel(item.category_id) },
    { key: 'priority', label: 'Priority', render: (item: any) => this.enumLabel(item.priority_id) },
    { key: 'description', label: 'Description', sortable: true, render: (item: any) => (item.description || '').substring(0, 60) },
    { key: 'customer', label: 'Customer', render: (item: any) => this.getCustomerName(item.customer_id) },
    { key: 'device', label: 'Device', render: (item: any) => this.getDeviceName(item.device_id) },
  ];

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getPlans().subscribe(d => this.plans = d);
    this.api.getCustomers().subscribe(d => this.customers = d);
    this.api.getDevices().subscribe(d => this.devices = d);
    this.api.getEnums().subscribe(e => this.enums = e);
    this.api.getUsers().subscribe(u => this.users = u);
  }

  enumLabel(id?: string): string {
    return this.enums.find(e => e.id === id)?.label || '';
  }

  getCustomerName(id?: string): string {
    if (!id) return '';
    const c = this.customers.find(c => c.id === id);
    return c ? (c.company_name || `${c.first_name} ${c.last_name}`) : '';
  }

  getDeviceName(id?: string): string {
    return this.devices.find(d => d.id === id)?.name || '';
  }

  getUserName(id?: string): string {
    const u = this.users.find(u => u.id === id);
    return u ? `${u.name} ${u.surname || ''}` : 'Unknown';
  }

  getCategoryColor(id?: string): string {
    return this.enums.find(e => e.id === id)?.color || '#3498db';
  }

  get categoryOptions() { return this.enums.filter(e => e.category === 'planCategory' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get priorityOptions() { return this.enums.filter(e => e.category === 'planPriority' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get reportMethodOptions() { return this.enums.filter(e => e.category === 'reportingMethod' && !e.is_deleted).map(e => ({ value: e.id, label: e.label })); }
  get customerOptions() { return this.customers.filter(c => !c.is_deleted).map(c => ({ value: c.id, label: c.company_name || `${c.first_name} ${c.last_name}` })); }
  get deviceOptions() { return this.devices.filter(d => !d.is_deleted).map(d => ({ value: d.id, label: d.name })); }

  // Calendar
  get calendarTitle(): string {
    return this.calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get calendarDays(): { date: Date; otherMonth: boolean }[] {
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay() || 7;
    const days: { date: Date; otherMonth: boolean }[] = [];

    for (let i = 1 - startDay + 1; i <= last.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, otherMonth: i < 1 });
    }
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - last.getDate());
      days.push({ date: d, otherMonth: true });
    }
    return days;
  }

  isToday(date: Date): boolean {
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  getPlansForDay(date: Date): Plan[] {
    return this.plans.filter(p => {
      if (!p.scheduled_from || p.is_deleted) return false;
      const d = new Date(p.scheduled_from);
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
  }

  calPrev() { this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1); }
  calNext() { this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1); }

  openForm(plan?: Plan) {
    if (plan) {
      this.editingId = plan.id;
      this.form = { ...plan };
      this.api.getComments(plan.id).subscribe(c => this.planComments = c);
    } else {
      this.editingId = null;
      this.form = {};
      this.planComments = [];
    }
    this.newComment = '';
    this.formSnapshot = this.serializeCurrentState();
    this.showForm = true;
  }

  closeForm() { this.showForm = false; this.form = {}; this.editingId = null; this.newComment = ''; this.formSnapshot = ''; }

  requestCloseForm() {
    if (this.serializeCurrentState() !== this.formSnapshot) {
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

  private serializeCurrentState(): string {
    return JSON.stringify({
      form: this.form ?? {},
      newComment: this.newComment ?? ''
    });
  }

  savePlan() {
    const obs = this.editingId
      ? this.api.updatePlan(this.editingId, this.form)
      : this.api.createPlan(this.form);
    obs.subscribe({
      next: () => { this.toast.success(this.editingId ? 'Plan updated' : 'Plan created'); this.closeForm(); this.load(); },
      error: () => this.toast.error('Failed to save plan')
    });
  }

  copyPlan(plan: Plan) {
    this.form = { ...plan, id: undefined as any };
    this.editingId = null;
    this.newComment = '';
    this.formSnapshot = this.serializeCurrentState();
    this.showForm = true;
  }

  toggleDelete() {
    if (!this.confirmItem) return;
    this.api.toggleDeletePlan(this.confirmItem.id).subscribe({
      next: () => { this.toast.success('Done'); this.confirmItem = null; this.load(); },
      error: () => this.toast.error('Failed')
    });
  }

  addComment() {
    if (!this.newComment.trim() || !this.editingId) return;
    this.api.createComment({ plan_id: this.editingId, user_id: this.users[0]?.id, text: this.newComment }).subscribe({
      next: () => {
        this.newComment = '';
        this.api.getComments(this.editingId!).subscribe(c => this.planComments = c);
        this.toast.success('Comment added');
      }
    });
  }
}
