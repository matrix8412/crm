import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Denomination { label: string; value: number; count: number; }
interface Currency { code: string; name: string; denominations: { label: string; value: number; }[]; }

const CURRENCIES: Currency[] = [
  { code: 'EUR', name: 'Euro (€)', denominations: [
    { label: '500 €', value: 500 }, { label: '200 €', value: 200 }, { label: '100 €', value: 100 }, { label: '50 €', value: 50 },
    { label: '20 €', value: 20 }, { label: '10 €', value: 10 }, { label: '5 €', value: 5 },
    { label: '2 €', value: 2 }, { label: '1 €', value: 1 }, { label: '0.50 €', value: 0.5 },
    { label: '0.20 €', value: 0.2 }, { label: '0.10 €', value: 0.1 }, { label: '0.05 €', value: 0.05 }, { label: '0.02 €', value: 0.02 }, { label: '0.01 €', value: 0.01 }
  ]},
  { code: 'CZK', name: 'Czech Koruna (Kč)', denominations: [
    { label: '5000 Kč', value: 5000 }, { label: '2000 Kč', value: 2000 }, { label: '1000 Kč', value: 1000 }, { label: '500 Kč', value: 500 },
    { label: '200 Kč', value: 200 }, { label: '100 Kč', value: 100 },
    { label: '50 Kč', value: 50 }, { label: '20 Kč', value: 20 }, { label: '10 Kč', value: 10 }, { label: '5 Kč', value: 5 },
    { label: '2 Kč', value: 2 }, { label: '1 Kč', value: 1 }
  ]},
  { code: 'USD', name: 'US Dollar ($)', denominations: [
    { label: '$100', value: 100 }, { label: '$50', value: 50 }, { label: '$20', value: 20 }, { label: '$10', value: 10 }, { label: '$5', value: 5 }, { label: '$1', value: 1 },
    { label: '$0.50', value: 0.5 }, { label: '$0.25', value: 0.25 }, { label: '$0.10', value: 0.1 }, { label: '$0.05', value: 0.05 }, { label: '$0.01', value: 0.01 }
  ]}
];

@Component({
  selector: 'app-coin-counter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Coin Counter</h1>
      <div class="header-actions">
        <select [(ngModel)]="selectedCurrency" (ngModelChange)="onCurrencyChange()" class="currency-select">
          @for (c of currencies; track c.code) { <option [ngValue]="c">{{ c.name }}</option> }
        </select>
        <button class="btn" (click)="reset()">Reset</button>
        <button class="btn btn-primary" (click)="print()">🖨 Print</button>
      </div>
    </div>
    <div class="denom-grid">
      @for (d of denominations; track d.label) {
        <div class="denom-card" [class.has-value]="d.count > 0">
          <div class="denom-label">{{ d.label }}</div>
          <div class="denom-input-row">
            <button class="btn-sm" (click)="d.count = Math.max(0, d.count - 1)">−</button>
            <input type="number" [(ngModel)]="d.count" min="0" class="denom-input">
            <button class="btn-sm" (click)="d.count = d.count + 1">+</button>
          </div>
          <div class="denom-subtotal">{{ (d.value * d.count) | number:'1.2-2' }} {{ selectedCurrency.code }}</div>
        </div>
      }
    </div>
    <div class="total-bar">
      <span class="total-label">Total:</span>
      <span class="total-value">{{ total | number:'1.2-2' }} {{ selectedCurrency.code }}</span>
      <span class="total-pieces">({{ totalPieces }} pieces)</span>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .currency-select { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-card,#fff); color: var(--text-primary,#333); }
    .btn { padding: 8px 16px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; cursor: pointer; font-size: 14px; background: var(--bg-card,#fff); color: var(--text-primary,#333); }
    .btn-primary { background: #3498db; color: #fff; border-color: #3498db; }
    .denom-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .denom-card { background: var(--bg-card,#fff); border: 1px solid var(--border-color,#e5e7eb); border-radius: 12px; padding: 16px; text-align: center; transition: all 0.2s; }
    .denom-card.has-value { border-color: #3498db; background: var(--bg-highlight,#ebf5ff); }
    .denom-label { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary,#333); }
    .denom-input-row { display: flex; align-items: center; gap: 6px; justify-content: center; margin-bottom: 8px; }
    .btn-sm { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color,#ddd); background: var(--bg-secondary,#f8f9fa); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; color: var(--text-primary,#333); }
    .denom-input { width: 60px; text-align: center; padding: 6px 4px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 16px; font-weight: 600; background: var(--bg-input,#fff); color: var(--text-primary,#333); }
    .denom-input::-webkit-inner-spin-button, .denom-input::-webkit-outer-spin-button { -webkit-appearance: none; }
    .denom-input { -moz-appearance: textfield; }
    .denom-subtotal { font-size: 13px; color: var(--text-secondary,#666); font-weight: 500; }
    .total-bar { background: var(--bg-card,#fff); border: 2px solid #3498db; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; gap: 12px; }
    .total-label { font-size: 18px; font-weight: 700; color: var(--text-primary,#333); }
    .total-value { font-size: 28px; font-weight: 800; color: #3498db; }
    .total-pieces { font-size: 14px; color: var(--text-secondary,#666); }
  `]
})
export class CoinCounterComponent {
  Math = Math;
  currencies = CURRENCIES;
  selectedCurrency = CURRENCIES[0];
  denominations: Denomination[] = [];

  constructor() { this.onCurrencyChange(); }

  onCurrencyChange() {
    this.denominations = this.selectedCurrency.denominations.map(d => ({ ...d, count: 0 }));
  }

  get total() { return this.denominations.reduce((s, d) => s + d.value * d.count, 0); }
  get totalPieces() { return this.denominations.reduce((s, d) => s + d.count, 0); }
  reset() { this.denominations.forEach(d => d.count = 0); }

  print() {
    const items = this.denominations.filter(d => d.count > 0);
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = items.map(d => `<tr><td>${d.label}</td><td style="text-align:center">${d.count}</td><td style="text-align:right">${(d.value * d.count).toFixed(2)} ${this.selectedCurrency.code}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Coin Count</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border-bottom:1px solid #ddd;text-align:left}th{font-weight:bold}.total{font-size:20px;font-weight:bold;margin-top:16px}</style></head><body><h2>Coin Count - ${this.selectedCurrency.name}</h2><table><thead><tr><th>Denomination</th><th style="text-align:center">Count</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table><p class="total">Total: ${this.total.toFixed(2)} ${this.selectedCurrency.code} (${this.totalPieces} pcs)</p><script>window.print()</script></body></html>`);
    w.document.close();
  }
}
