import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" (click)="cancel.emit()">
      <div class="confirm-box" (click)="$event.stopPropagation()">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="confirm-actions">
          <button class="btn" (click)="cancel.emit()">{{ cancelText }}</button>
          <button class="btn" [class]="confirmClass" (click)="confirm.emit()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 6000; }
    .confirm-box { background: var(--bg-card, #fff); border-radius: 12px; padding: 24px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .confirm-box h3 { margin: 0 0 12px; font-size: 16px; }
    .confirm-box p { margin: 0 0 20px; color: var(--text-secondary, #666); font-size: 14px; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card, #fff); }
    .btn-danger { background: #e74c3c; color: #fff; border-color: #e74c3c; }
    .btn-danger:hover { background: #c0392b; }
  `]
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmClass = 'btn-danger';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
