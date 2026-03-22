import { html } from 'htm/preact';
import { useEffect, useRef } from 'preact/hooks';

export const ChartComponent = ({ config }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<any | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        // Destroy previous chart instance if it exists
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            chartRef.current = new (window as any).Chart(ctx, config);
        }

        // Cleanup on unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [config]); // Re-create chart if config changes

    return html`
        <canvas ref=${canvasRef}></canvas>
    `;
};