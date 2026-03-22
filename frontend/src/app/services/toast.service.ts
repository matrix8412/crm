import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  fading?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toasts$ = new Subject<Toast[]>();
  private toasts: Toast[] = [];

  add(message: string, type: Toast['type'] = 'info') {
    const toast: Toast = { id: ++this.counter, message, type };
    this.toasts = [...this.toasts, toast];
    this.toasts$.next(this.toasts);
    setTimeout(() => {
      this.toasts = this.toasts.map(t => t.id === toast.id ? { ...t, fading: true } : t);
      this.toasts$.next(this.toasts);
      setTimeout(() => this.remove(toast.id), 300);
    }, 4700);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next(this.toasts);
  }

  success(msg: string) { this.add(msg, 'success'); }
  error(msg: string) { this.add(msg, 'error'); }
  warning(msg: string) { this.add(msg, 'warning'); }
  info(msg: string) { this.add(msg, 'info'); }
}
