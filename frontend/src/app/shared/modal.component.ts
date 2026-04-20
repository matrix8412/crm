import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (mousedown)="onOverlayMouseDown($event)" (mouseup)="onOverlayMouseUp($event)">
      <div class="modal-content" [ngClass]="customClass" (mousedown)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="modal-close" (click)="close.emit()">×</button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.56); display: flex; justify-content: flex-end; align-items: stretch; z-index: 5000; animation: overlayFadeIn 0.25s ease; }
    .modal-content { background: var(--bg-card, #fff); border-radius: 24px 0 0 24px; width: min(760px, 100vw); height: 100vh; max-width: 100vw; max-height: 100vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: -18px 0 48px rgba(0,0,0,0.24); animation: drawerSlideIn 0.28s ease; }
    .modal-content.modal-wide { width: min(980px, 100vw); }
    .modal-content.modal-narrow { width: min(540px, 100vw); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color, #eee); flex: 0 0 auto; }
    .modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary, #333); }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary, #888); padding: 0 4px; }
    .modal-close:hover { color: var(--text-primary, #333); }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1 1 auto; min-height: 0; }
    @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes drawerSlideIn { from { transform: translateX(48px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @media (max-width: 768px) {
      .modal-content,
      .modal-content.modal-wide,
      .modal-content.modal-narrow { width: 100vw; border-radius: 0; }
      .modal-body { padding: 20px; }
    }
  `]
})
export class ModalComponent {
  @Input() title = '';
  @Input() customClass = '';
  @Output() close = new EventEmitter<void>();

  private overlayMouseDown = false;

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close.emit();
  }

  onOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) this.overlayMouseDown = true;
  }

  onOverlayMouseUp(e: MouseEvent) {
    if (e.target === e.currentTarget && this.overlayMouseDown) this.close.emit();
    this.overlayMouseDown = false;
  }
}
