
import { html } from 'htm/preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { currencies as defaultCurrencies } from '../../constants/currencies';
import type { Currency, Denomination } from '../../constants/currencies';
import { icons } from '../../constants/icons';
import * as api from '../../utils/api';

const DenominationCard = ({ denomination, count, onCountChange, currencySymbol }) => {
    const subTotal = (count || 0) * denomination.value;

    const handleInputChange = (e) => {
        const val = parseInt(e.currentTarget.value, 10);
        onCountChange(denomination.label, isNaN(val) || val < 0 ? 0 : val);
    };

    return html`
        <div class="denomination-card">
            <div class="denomination-info">
                <strong>${denomination.label}</strong>
                <span class=${denomination.type}>${denomination.type}</span>
            </div>
            <div class="denomination-controls">
                <label for=${`count-${denomination.label}`}>Count:</label>
                <input 
                    id=${`count-${denomination.label}`}
                    type="number" 
                    min="0"
                    value=${count || ''}
                    onInput=${handleInputChange}
                    placeholder="0"
                />
            </div>
            <div class="denomination-subtotal">
                Value: ${subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}
            </div>
        </div>
    `;
};

export const CoinCounter = () => {
    const [currencies, setCurrencies] = useState<Currency[]>(defaultCurrencies);
    const [activeCurrencyCode, setActiveCurrencyCode] = useState<Currency['code']>('EUR');
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Load currencies from DB
    useEffect(() => {
        api.fetchCurrencies().then(dbCurrencies => {
            if (dbCurrencies && dbCurrencies.length > 0) {
                const mapped: Currency[] = dbCurrencies.map((c: any) => ({
                    code: c.code,
                    symbol: c.symbol,
                    denominations: (c.denominations || []).map((d: any) => ({
                        value: parseFloat(d.value),
                        type: d.type as 'coin' | 'banknote',
                        label: d.label,
                    })),
                }));
                setCurrencies(mapped);
            }
        }).catch(err => console.error('Failed to load currencies:', err));
    }, []);

    const handleCurrencyChange = (code: Currency['code']) => {
        setActiveCurrencyCode(code);
        setCounts({}); // Reset counts when changing currency
    };
    
    const handleCountChange = (label: string, count: number) => {
        setCounts(prev => ({ ...prev, [label]: count }));
    };

    const { activeCurrency, banknotes, coins, totalValue, totalCount } = useMemo(() => {
        const currency = currencies.find(c => c.code === activeCurrencyCode)!;
        
        let val = 0;
        let count = 0;
        
        const sortedDenominations = [...currency.denominations].sort((a,b) => b.value - a.value);

        sortedDenominations.forEach(d => {
            const num = counts[d.label] || 0;
            if (num > 0) {
                val += num * d.value;
                count += num;
            }
        });

        return {
            activeCurrency: currency,
            banknotes: sortedDenominations.filter(d => d.type === 'banknote'),
            coins: sortedDenominations.filter(d => d.type === 'coin'),
            totalValue: val,
            totalCount: count
        };
    }, [activeCurrencyCode, counts]);

    const handlePrint = () => {
        const getPrintContent = () => {
            const tableRows = (denominations: Denomination[]) => {
                return denominations
                    .filter(d => (counts[d.label] || 0) > 0)
                    .map(d => `
                        <tr>
                            <td>${d.label}</td>
                            <td>${counts[d.label].toLocaleString()}</td>
                            <td>${(d.value * counts[d.label]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${activeCurrency.symbol}</td>
                        </tr>
                    `).join('');
            };
            
            const banknoteRows = tableRows(banknotes);
            const coinRows = tableRows(coins);

            const banknoteTotal = banknotes.reduce((sum, d) => sum + (counts[d.label] || 0) * d.value, 0);
            const coinTotal = coins.reduce((sum, d) => sum + (counts[d.label] || 0) * d.value, 0);

            return `
                <html>
                    <head>
                        <title>Coin Count Summary</title>
                        <style>
                            body { font-family: sans-serif; margin: 2rem; color: #000; }
                            h1, h2, h3 { color: #333; }
                            h1 { text-align: center; }
                            .summary { display: flex; justify-content: space-around; background-color: #f4f4f4; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
                            .summary-item { text-align: center; }
                            .summary-item strong { display: block; font-size: 1rem; color: #666; margin-bottom: 0.25rem; }
                            .summary-item span { font-size: 1.8rem; font-weight: bold; color: #000; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            td:nth-child(2), td:nth-child(3) { text-align: right; }
                            tfoot td { font-weight: bold; background-color: #f9f9f9; }
                            .print-footer { text-align: center; font-size: 0.8rem; color: #888; margin-top: 2rem; }
                        </style>
                    </head>
                    <body>
                        <h1>Coin Count Summary</h1>
                        <p class="print-footer">Date: ${new Date().toLocaleString()}</p>
                        
                        <div class="summary">
                            <div class="summary-item">
                                <strong>Total Value</strong>
                                <span>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${activeCurrency.symbol}</span>
                            </div>
                            <div class="summary-item">
                                <strong>Total Pieces</strong>
                                <span>${totalCount.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        ${banknoteRows.length > 0 ? `
                            <h2>Banknotes</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Denomination</th>
                                        <th>Count</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${banknoteRows}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2">Banknote Total</td>
                                        <td>${banknoteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${activeCurrency.symbol}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        ` : ''}

                        ${coinRows.length > 0 ? `
                            <h2>Coins</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Denomination</th>
                                        <th>Count</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${coinRows}
                                </tbody>
                                 <tfoot>
                                    <tr>
                                        <td colspan="2">Coin Total</td>
                                        <td>${coinTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${activeCurrency.symbol}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        ` : ''}
                    </body>
                </html>
            `;
        };
        
        const content = getPrintContent();

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print the summary.');
            return;
        }
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return html`
        <div class="coin-counter-container">
            <div class="coin-counter-header">
                <h2>${icons.coins} Coin Counter</h2>
                 <div class="header-actions">
                    <button
                        class="btn btn-secondary"
                        onClick=${handlePrint}
                        disabled=${totalCount === 0}
                        title="Print Summary"
                        style="display: flex; align-items: center; gap: 0.5rem;"
                    >
                        ${icons.print}
                        <span>Print Summary</span>
                    </button>
                    <div class="currency-selector">
                        ${currencies.map(c => html`
                            <button 
                                class=${c.code === activeCurrencyCode ? 'active' : ''}
                                onClick=${() => handleCurrencyChange(c.code)}
                            >
                                ${c.code}
                            </button>
                        `)}
                    </div>
                </div>
            </div>

            <div class="coin-counter-summary">
                <div class="summary-item">
                    <strong>Total Value</strong>
                    <span>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${activeCurrency.symbol}</span>
                </div>
                 <div class="summary-item">
                    <strong>Total Pieces</strong>
                    <span>${totalCount.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="denomination-section">
                <h3>Banknotes</h3>
                <div class="denomination-grid">
                    ${banknotes.map(d => html`
                        <${DenominationCard} 
                            key=${d.label}
                            denomination=${d}
                            count=${counts[d.label]}
                            onCountChange=${handleCountChange}
                            currencySymbol=${activeCurrency.symbol}
                        />
                    `)}
                </div>
            </div>

            <div class="denomination-section">
                <h3>Coins</h3>
                <div class="denomination-grid">
                     ${coins.map(d => html`
                        <${DenominationCard} 
                            key=${d.label}
                            denomination=${d}
                            count=${counts[d.label]}
                            onCountChange=${handleCountChange}
                            currencySymbol=${activeCurrency.symbol}
                        />
                    `)}
                </div>
            </div>
        </div>
    `;
};