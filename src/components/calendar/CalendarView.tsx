import { html } from 'htm/preact';
import { useState, useMemo } from 'preact/hooks';
import type { CalendarMode } from '../../types';
import { icons } from '../../constants/icons';

import { YearView } from './YearView';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { WorkWeekView } from './WorkWeekView';
import { UnscheduledTasksSidebar } from './UnscheduledTasksSidebar';

export const CalendarView = ({ plans, setModal, customerMap, deviceMap, addOrUpdate, enumMaps, defaultPlanDuration }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarMode, setCalendarMode] = useState<CalendarMode>('work-week');

    const { scheduledPlans, unscheduledPlans } = useMemo(() => {
        const scheduled = [];
        const unscheduled = [];
        for (const plan of plans) {
            if (plan.scheduledFrom) {
                scheduled.push(plan);
            } else {
                unscheduled.push(plan);
            }
        }
        return { scheduledPlans: scheduled, unscheduledPlans: unscheduled };
    }, [plans]);

    const handleNavigation = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const sign = direction === 'next' ? 1 : -1;
        
        switch(calendarMode) {
            case 'year': newDate.setFullYear(newDate.getFullYear() + sign); break;
            case 'month': newDate.setMonth(newDate.getMonth() + sign, 1); break;
            case 'week': newDate.setDate(newDate.getDate() + (7 * sign)); break;
            case 'work-week': newDate.setDate(newDate.getDate() + (7 * sign)); break;
            case 'day': newDate.setDate(newDate.getDate() + sign); break;
        }
        setCurrentDate(newDate);
    };

    const getHeaderText = () => {
        switch(calendarMode) {
            case 'year': return currentDate.getFullYear();
            case 'month': return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            case 'week': 
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
            case 'work-week': {
                const d = new Date(currentDate);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const startOfWorkWeek = new Date(new Date(d).setDate(diff));
                const endOfWorkWeek = new Date(startOfWorkWeek);
                endOfWorkWeek.setDate(startOfWorkWeek.getDate() + 4);
                return `${startOfWorkWeek.toLocaleDateString()} - ${endOfWorkWeek.toLocaleDateString()}`;
            }
            case 'day': return currentDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    };
    
    const views = {
        year: html`<${YearView} currentDate=${currentDate} plans=${plans} setCurrentDate=${setCurrentDate} setCalendarMode=${setCalendarMode} />`,
        month: html`<${MonthView} currentDate=${currentDate} plans=${plans} setModal=${setModal} addOrUpdate=${addOrUpdate} enumMaps=${enumMaps} customerMap=${customerMap} deviceMap=${deviceMap} defaultPlanDuration=${defaultPlanDuration} />`,
        week: html`<${WeekView} currentDate=${currentDate} plans=${plans} setModal=${setModal} addOrUpdate=${addOrUpdate} enumMaps=${enumMaps} customerMap=${customerMap} deviceMap=${deviceMap} defaultPlanDuration=${defaultPlanDuration} />`,
        'work-week': html`<${WorkWeekView} currentDate=${currentDate} plans=${plans} setModal=${setModal} addOrUpdate=${addOrUpdate} enumMaps=${enumMaps} customerMap=${customerMap} deviceMap=${deviceMap} defaultPlanDuration=${defaultPlanDuration} />`,
        day: html`<${DayView} currentDate=${currentDate} plans=${plans} setModal=${setModal} customerMap=${customerMap} addOrUpdate=${addOrUpdate} enumMaps=${enumMaps} deviceMap=${deviceMap} defaultPlanDuration=${defaultPlanDuration} />`,
    };

    return html`
        <div class="calendar-container">
            <div class="calendar-header">
                <div class="calendar-nav-controls">
                    <button onClick=${() => handleNavigation('prev')} title="Previous">
                        ${icons.chevronLeft}
                    </button>
                    <h2>${getHeaderText()}</h2>
                    <button onClick=${() => handleNavigation('next')} title="Next">
                        ${icons.chevronRight}
                    </button>
                </div>
                <div class="calendar-view-toggle">
                    ${Object.keys(views).map((mode) => html`
                        <button class=${calendarMode === mode ? 'active' : ''} onClick=${() => setCalendarMode(mode as CalendarMode)}>
                            ${mode === 'work-week' ? 'Work Week' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    `)}
                </div>
            </div>
             <div class="calendar-view-wrapper">
                <${UnscheduledTasksSidebar}
                    unscheduledPlans=${unscheduledPlans}
                    enumMaps=${enumMaps}
                    setModal=${setModal}
                    addOrUpdate=${addOrUpdate}
                    plans=${plans}
                    customerMap=${customerMap}
                    deviceMap=${deviceMap}
                />
                <div class="calendar-main-panel">
                    ${views[calendarMode]}
                </div>
            </div>
        </div>
    `;
};