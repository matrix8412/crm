import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (mousedown)="onOverlayMouseDown($event)" (mouseup)="onOverlayMouseUp($event)">
      <div class="modal-content" [class]="customClass" (mousedown)="$event.stopPropagation()">
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
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 5000; padding: 20px; }
    .modal-content { background: var(--bg-card, #fff); border-radius: 12px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-content.modal-wide { max-width: 900px; }
    .modal-content.modal-narrow { max-width: 500px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color, #eee); }
    .modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary, #333); }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary, #888); padding: 0 4px; }
    .modal-close:hover { color: var(--text-primary, #333); }
    .modal-body { padding: 24px; }
  `]
})
export class ModalComponent {
  @Input() title = '';
  @Input() customClass = '';
  @Output() close = new EventEmitter<void>();

  private overlayMouseDown = false;

  onOverlayMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget) this.overlayMouseDown = true;
  }

  onOverlayMouseUp(e: MouseEvent) {
    if (e.target === e.currentTarget && this.overlayMouseDown) this.close.emit();
    this.overlayMouseDown = false;
  }
}
