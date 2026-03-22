
export interface Denomination {
    value: number;
    type: 'coin' | 'banknote';
    label: string;
}

export interface Currency {
    code: 'EUR' | 'CZK' | 'USD';
    symbol: string;
    denominations: Denomination[];
}

export const currencies: Currency[] = [
    {
        code: 'EUR',
        symbol: '€',
        denominations: [
            { value: 500, type: 'banknote', label: '€500' },
            { value: 200, type: 'banknote', label: '€200' },
            { value: 100, type: 'banknote', label: '€100' },
            { value: 50, type: 'banknote', label: '€50' },
            { value: 20, type: 'banknote', label: '€20' },
            { value: 10, type: 'banknote', label: '€10' },
            { value: 5, type: 'banknote', label: '€5' },
            { value: 2, type: 'coin', label: '€2' },
            { value: 1, type: 'coin', label: '€1' },
            { value: 0.50, type: 'coin', label: '50 Cent' },
            { value: 0.20, type: 'coin', label: '20 Cent' },
            { value: 0.10, type: 'coin', label: '10 Cent' },
            { value: 0.05, type: 'coin', label: '5 Cent' },
            { value: 0.02, type: 'coin', label: '2 Cent' },
            { value: 0.01, type: 'coin', label: '1 Cent' },
        ]
    },
    {
        code: 'CZK',
        symbol: 'Kč',
        denominations: [
            { value: 5000, type: 'banknote', label: '5000 Kč' },
            { value: 2000, type: 'banknote', label: '2000 Kč' },
            { value: 1000, type: 'banknote', label: '1000 Kč' },
            { value: 500, type: 'banknote', label: '500 Kč' },
            { value: 200, type: 'banknote', label: '200 Kč' },
            { value: 100, type: 'banknote', label: '100 Kč' },
            { value: 50, type: 'coin', label: '50 Kč' },
            { value: 20, type: 'coin', label: '20 Kč' },
            { value: 10, type: 'coin', label: '10 Kč' },
            { value: 5, type: 'coin', label: '5 Kč' },
            { value: 2, type: 'coin', label: '2 Kč' },
            { value: 1, type: 'coin', label: '1 Kč' },
        ]
    },
    {
        code: 'USD',
        symbol: '$',
        denominations: [
            { value: 100, type: 'banknote', label: '$100' },
            { value: 50, type: 'banknote', label: '$50' },
            { value: 20, type: 'banknote', label: '$20' },
            { value: 10, type: 'banknote', label: '$10' },
            { value: 5, type: 'banknote', label: '$5' },
            { value: 2, type: 'banknote', label: '$2' },
            { value: 1, type: 'banknote', label: '$1' },
            { value: 1, type: 'coin', label: '$1 Coin' },
            { value: 0.50, type: 'coin', label: '50¢ Coin' },
            { value: 0.25, type: 'coin', label: '25¢ Coin' },
            { value: 0.10, type: 'coin', label: '10¢ Coin' },
            { value: 0.05, type: 'coin', label: '5¢ Coin' },
            { value: 0.01, type: 'coin', label: '1¢ Coin' },
        ]
    }
];
