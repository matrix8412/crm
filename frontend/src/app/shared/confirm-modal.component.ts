import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" (mousedown)="onOverlayMouseDown($event)" (mouseup)="onOverlayMouseUp($event)">
      <div class="confirm-box" (mousedown)="$event.stopPropagation()">
        <div class="confirm-header">
          <h3>{{ title }}</h3>
          <button class="confirm-close" (click)="cancel.emit()">×</button>
        </div>
        <div class="confirm-body">
          <p>{{ message }}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn" (click)="cancel.emit()">{{ cancelText }}</button>
          <button class="btn" [class]="confirmClass" (click)="confirm.emit()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.56); display: flex; justify-content: center; align-items: center; padding: 24px; z-index: 6000; animation: overlayFadeIn 0.25s ease; }
    .confirm-box { background: var(--bg-card, #fff); border-radius: 20px; width: min(420px, calc(100vw - 32px)); max-width: 100vw; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 56px rgba(0,0,0,0.24); animation: popupScaleIn 0.22s ease; }
    .confirm-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color, #eee); }
    .confirm-box h3 { margin: 0; font-size: 16px; color: var(--text-primary, #333); }
    .confirm-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary, #888); padding: 0 4px; }
    .confirm-close:hover { color: var(--text-primary, #333); }
    .confirm-body { padding: 20px 24px; overflow-y: auto; }
    .confirm-box p { margin: 0; color: var(--text-secondary, #666); font-size: 14px; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 20px; border-top: 1px solid var(--border-color, #eee); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color, #ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card, #fff); }
    .btn-danger { background: #e74c3c; color: #fff; border-color: #e74c3c; }
    .btn-danger:hover { background: #c0392b; }
    @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popupScaleIn { from { transform: translateY(12px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    @media (max-width: 768px) {
      .confirm-overlay { padding: 16px; }
      .confirm-box { width: min(420px, calc(100vw - 32px)); border-radius: 18px; }
      .confirm-body,
      .confirm-actions,
      .confirm-header { padding-left: 20px; padding-right: 20px; }
    }
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

  private overlayMouseDown = false;

  @HostListener('document:keydown.escape')
  onEscape() {
    this.cancel.emit();
  }

  onOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) this.overlayMouseDown = true;
  }

  onOverlayMouseUp(e: MouseEvent) {
    if (e.target === e.currentTarget && this.overlayMouseDown) this.cancel.emit();
    this.overlayMouseDown = false;
  }
}
