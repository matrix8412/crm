import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  theme$ = new BehaviorSubject<string>('light');

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    const saved = localStorage.getItem('crm_theme') || 'light';
    this.setTheme(saved);
  }

  setTheme(theme: string) {
    this.theme$.next(theme);
    localStorage.setItem('crm_theme', theme);
    const doc = document.documentElement;
    doc.classList.remove('dark-theme', 'light-theme');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (effectiveTheme === 'dark') {
      doc.classList.add('dark-theme');
      doc.setAttribute('data-theme', 'dark');
    } else {
      doc.removeAttribute('data-theme');
    }
  }

  setGlossy(enabled: boolean) {
    const doc = document.documentElement;
    if (enabled) {
      doc.classList.add('glossy-theme');
    } else {
      doc.classList.remove('glossy-theme');
    }
  }

  get isDark(): boolean {
    const t = this.theme$.value;
    if (t === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return t === 'dark';
  }
}
