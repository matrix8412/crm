import { html } from 'htm/preact';
import { useMemo } from 'preact/hooks';

export const YearView = ({ currentDate, plans, setCurrentDate, setCalendarMode }) => {
    const year = currentDate.getFullYear();
    const plansByMonth = useMemo(() => {
        const monthSet = new Set();
        plans.forEach(plan => {
            const date = new Date(plan.scheduledFrom);
            if (date && !isNaN(date.getTime()) && date.getFullYear() === year) {
                monthSet.add(date.getMonth());
            }
        });
        return monthSet;
    }, [plans, year]);

    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

    const selectMonth = (monthIndex) => {
        setCurrentDate(new Date(year, monthIndex, 1));
        setCalendarMode('month');
    };

    return html`
        <div class="year-view-grid">
            ${months.map((monthDate, i) => html`
                <button 
                    class="year-view-month ${plansByMonth.has(i) ? 'has-plans' : ''}" 
                    onClick=${() => selectMonth(i)}>
                    ${monthDate.toLocaleString('default', { month: 'long' })}
                </button>
            `)}
        </div>
    `;
};