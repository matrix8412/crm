import { html } from 'htm/preact';
import { useState, useMemo } from 'preact/hooks';
import { generatePlanTooltipText } from '../../utils/helpers';

const toLocalISOString = (date) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
};

export const MonthView = ({ currentDate, plans, setModal, addOrUpdate, enumMaps, customerMap, deviceMap, defaultPlanDuration }) => {
    const [dragOverCell, setDragOverCell] = useState<string | null>(null);

    const plansByDate = useMemo(() => {
        const map = new Map();
        plans.forEach(plan => {
            if (!plan.scheduledFrom) return;
            const date = new Date(plan.scheduledFrom);
            if (!date || isNaN(date.getTime())) return;
            const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!map.has(dateString)) map.set(dateString, []);
            map.get(dateString).push(plan);
        });
        return map;
    }, [plans]);

    const handleDragStart = (e, plan) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ planId: plan.id }));
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };
    
    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDragOverCell(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, cell) => {
        e.preventDefault();
        
        let planId;
        try {
            const dropData = JSON.parse(e.dataTransfer.getData('application/json'));
            planId = dropData.planId;
        } catch (err) {
            return; // Invalid drop data
        }
        
        const originalPlan = plans.find(p => p.id === planId);
        if (!originalPlan) return;

        let originalTime = { hours: 12, minutes: 0 };
        if (originalPlan.scheduledFrom && originalPlan.scheduledFrom.includes('T')) {
            const d = new Date(originalPlan.scheduledFrom);
            originalTime.hours = d.getHours();
            originalTime.minutes = d.getMinutes();
        }

        const fromDate = new Date(cell.year, cell.month, cell.day, originalTime.hours, originalTime.minutes);
        
        let toDate;
        if (originalPlan.scheduledTo) {
            const duration = new Date(originalPlan.scheduledTo).getTime() - new Date(originalPlan.scheduledFrom).getTime();
            toDate = new Date(fromDate.getTime() + duration);
        }

        addOrUpdate('plans', { 
            ...originalPlan,
            scheduledFrom: toLocalISOString(fromDate),
            scheduledTo: toDate ? toLocalISOString(toDate) : undefined
        }, { closeModal: false, toastMessage: 'Task moved successfully.' });
        setDragOverCell(null);
    };

    const handleDayClick = (e, cell) => {
        if (e.target.closest('.plan-item')) return;
        const fromDate = new Date(cell.year, cell.month, cell.day, 9, 0, 0);
        const toDate = new Date(fromDate.getTime() + defaultPlanDuration * 60000);
        
        setModal({ type: 'plan', data: {
            scheduledFrom: toLocalISOString(fromDate),
            scheduledTo: toLocalISOString(toDate),
        }});
    };

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const { month, year } = { month: currentDate.getMonth(), year: currentDate.getFullYear() };
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push({ key: `pad-start-${i}`, empty: true });
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push({ key: `${year}-${month}-${day}`, year, month, day });
    const remainingCells = 7 - (calendarDays.length % 7);
    if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) calendarDays.push({ key: `pad-end-${i}`, empty: true });
    }

    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    return html`
        <div class="calendar-grid">
            ${daysOfWeek.map(day => html`<div class="calendar-day-header">${day}</div>`)}
            ${calendarDays.map(cell => {
                if (cell.empty) return html`<div class="calendar-day empty"></div>`;
                
                const cellDateString = `${cell.year}-${cell.month}-${cell.day}`;
                const isToday = cellDateString === todayString;
                const isDragOver = dragOverCell === cellDateString;
                const dayPlans = plansByDate.get(cellDateString) || [];

                return html`
                    <div 
                        class="calendar-day ${isToday ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}"
                        ondragover=${handleDragOver}
                        ondrop=${e => handleDrop(e, cell)}
                        ondragenter=${() => setDragOverCell(cellDateString)}
                        onClick=${(e) => handleDayClick(e, cell)}
                    >
                        <div class="day-number">${cell.day}</div>
                        <div class="day-plans">
                            ${dayPlans.map(plan => {
                                const category = enumMaps.planCategory.get(plan.category);
                                const priority = enumMaps.planPriority.get(plan.priority);
                                const priorityColor = priority?.color || 'transparent';
                                const categoryColor = category?.color;
                                const categoryLabel = category?.label || plan.category;
                                
                                let planStyle = {};
                                if (categoryColor) {
                                    planStyle = {
                                        backgroundColor: categoryColor,
                                        color: 'white',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    };
                                }
                                
                                const tooltipText = generatePlanTooltipText(plan, customerMap, deviceMap, enumMaps);

                                return html`
                                    <div 
                                        class="plan-item" 
                                        onClick=${(e) => { e.stopPropagation(); setModal({ type: 'plan', data: plan }); }} 
                                        data-tooltip=${tooltipText}
                                        draggable="true"
                                        ondragstart=${e => handleDragStart(e, plan)}
                                        ondragend=${handleDragEnd}
                                        style=${planStyle}
                                    >
                                        <span class="priority-dot" style=${{ backgroundColor: priorityColor, border: '1px solid rgba(0,0,0,0.2)' }}></span>
                                        <span>${categoryLabel}</span>
                                    </div>
                                `
                            })}
                        </div>
                    </div>
                `;
            })}
        </div>
    `;
};