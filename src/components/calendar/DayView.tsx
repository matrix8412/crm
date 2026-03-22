


import { html } from 'htm/preact';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { areDatesEqual, generatePlanTooltipText } from '../../utils/helpers';
import type { EnumValue } from '../../types';
import { useUI } from '../../contexts/ToastContext';

const toLocalISOString = (date) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
};

export const DayView = ({ currentDate, plans, setModal, customerMap, addOrUpdate, enumMaps, deviceMap, defaultPlanDuration }) => {
    const { addToast } = useUI();
    const HOUR_HEIGHT = 60; // 60px per hour
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [resizingPlan, setResizingPlan] = useState(null);
    const wasResizing = useRef(false);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const companyLegalFormId = useMemo(() => {
        return (Array.from(enumMaps.legalForm.values()) as EnumValue[]).find(form => form.label.toLowerCase() === 'company')?.id;
    }, [enumMaps.legalForm]);
    
    const { allDayPlans, timedPlans } = useMemo(() => {
        const dayPlans = plans.filter(p => p.scheduledFrom && areDatesEqual(new Date(p.scheduledFrom), currentDate));
        return {
            allDayPlans: dayPlans.filter(p => !p.scheduledFrom.includes('T')),
            timedPlans: dayPlans.filter(p => p.scheduledFrom.includes('T'))
        };
    }, [currentDate, plans]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!resizingPlan) return;

            const deltaY = e.clientY - resizingPlan.initialY;
            const minuteDelta = Math.round(deltaY * (60 / HOUR_HEIGHT) / 15) * 15; // Snap to 15 mins

            let newFrom = new Date(resizingPlan.initialFrom);
            let newTo = new Date(resizingPlan.initialTo);

            if (resizingPlan.edge === 'top') {
                newFrom.setMinutes(resizingPlan.initialFrom.getMinutes() + minuteDelta);
            } else {
                newTo.setMinutes(resizingPlan.initialTo.getMinutes() + minuteDelta);
            }

            // Enforce min duration (15 min) and correct order
            if (newTo.getTime() - newFrom.getTime() < 15 * 60000) {
                if (resizingPlan.edge === 'top') {
                    newFrom = new Date(newTo.getTime() - 15 * 60000);
                } else {
                    newTo = new Date(newFrom.getTime() + 15 * 60000);
                }
            }
            
            const planToUpdate = plans.find(p => p.id === resizingPlan.id);
            if (planToUpdate) {
                addOrUpdate('plans', {
                    ...planToUpdate,
                    scheduledFrom: toLocalISOString(newFrom),
                    scheduledTo: toLocalISOString(newTo)
                }, { showToast: false, closeModal: false });
            }
        };

        const handleMouseUp = () => {
             if (resizingPlan) {
                addToast('Task resized successfully.', 'success');
                setResizingPlan(null);
                setTimeout(() => {
                    wasResizing.current = false;
                }, 0);
            }
        };

        if (resizingPlan) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('resizing');
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('resizing');
        };
    }, [resizingPlan, plans, addOrUpdate, addToast]);

    const handleDragStart = (e, plan) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('application/json', JSON.stringify({ planId: plan.id, offsetY }));
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setIsDraggingOver(false);
    };

    const handleDragOver = (e) => { e.preventDefault(); };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        
        let planId, offsetY = 0;
        try {
            const dropData = JSON.parse(e.dataTransfer.getData('application/json'));
            planId = dropData.planId;
            offsetY = dropData.offsetY || 0;
        } catch (err) {
            return; // No valid data
        }

        const originalPlan = plans.find(p => p.id === planId);
        if (!originalPlan) return;

        const dayColumn = e.currentTarget;
        const rect = dayColumn.getBoundingClientRect();
        const y = e.clientY - rect.top - offsetY;
        
        // Clamp y to be within the bounds of the column to prevent invalid times
        const yClamped = Math.max(0, Math.min(y, dayColumn.clientHeight - 1));
        
        const hours = yClamped / HOUR_HEIGHT;
        const newHours = Math.floor(hours);
        const newMinutes = Math.floor(((hours - newHours) * 60) / 15) * 15; // Snap to 15 mins

        const fromDate = new Date(currentDate);
        fromDate.setHours(newHours, newMinutes, 0, 0);
        
        let toDate;
        if (originalPlan.scheduledTo && originalPlan.scheduledFrom) {
            const duration = new Date(originalPlan.scheduledTo).getTime() - new Date(originalPlan.scheduledFrom).getTime();
            toDate = new Date(fromDate.getTime() + duration);
        }
        
        addOrUpdate('plans', { 
            ...originalPlan, 
            scheduledFrom: toLocalISOString(fromDate),
            scheduledTo: toDate ? toLocalISOString(toDate) : undefined
        }, { closeModal: false, toastMessage: 'Task moved successfully.' });
    };
    
    const handleColumnClick = (e) => {
        if (e.target.closest('.timeline-plan-item')) return;
        
        const dayColumn = e.currentTarget;
        const rect = dayColumn.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const hours = y / HOUR_HEIGHT;
        const clickedHours = Math.floor(hours);
        const clickedMinutes = Math.floor(((hours - clickedHours) * 60) / 15) * 15; // Snap to 15 mins

        const fromDate = new Date(currentDate);
        fromDate.setHours(clickedHours, clickedMinutes, 0, 0);

        const toDate = new Date(fromDate.getTime() + defaultPlanDuration * 60000);

        setModal({ type: 'plan', data: {
            scheduledFrom: toLocalISOString(fromDate),
            scheduledTo: toLocalISOString(toDate),
        }});
    };

    const handleResizeStart = (e, plan, edge) => {
        e.preventDefault();
        e.stopPropagation();
        wasResizing.current = true;
        const fromDate = new Date(plan.scheduledFrom);
        const toDate = plan.scheduledTo ? new Date(plan.scheduledTo) : new Date(fromDate.getTime() + (defaultPlanDuration * 60000));
        
        setResizingPlan({
            id: plan.id,
            edge,
            initialY: e.clientY,
            initialFrom: fromDate,
            initialTo: toDate,
        });
    };
    
    const handlePlanClick = (e, plan) => {
        if (wasResizing.current) {
            return;
        }
        e.stopPropagation();
        setModal({ type: 'plan', data: plan });
    };


    return html`
        <div class="day-view-timeline">
            ${allDayPlans.length > 0 && html`
                <div class="all-day-section">
                    <strong>All-day</strong>
                    ${allDayPlans.map(plan => {
                        const customer = customerMap.get(plan.customerId);
                        const category = enumMaps.planCategory.get(plan.category);
                        const priority = enumMaps.planPriority.get(plan.priority);
                        const categoryColor = category?.color;
                        const priorityColor = priority?.color;

                        const style = {
                            backgroundColor: categoryColor || undefined,
                            borderLeft: priorityColor ? `4px solid ${priorityColor}` : undefined,
                            color: categoryColor ? 'white' : undefined,
                            textShadow: categoryColor ? '0 1px 1px rgba(0,0,0,0.4)' : undefined
                        };

                        const tooltipText = generatePlanTooltipText(plan, customerMap, deviceMap, enumMaps);

                        return html`
                            <div class="all-day-plan-card" style=${style} onClick=${() => setModal({ type: 'plan', data: plan })} data-tooltip=${tooltipText}>
                                <div class="plan-category">${enumMaps.planCategory.get(plan.category)?.label}</div>
                                <div class="plan-customer">${customer ? `${customer.customerNumber} - ${customer.firstName} ${customer.lastName}` : 'N/A'}</div>
                            </div>
                        `;
                    })}
                </div>
            `}
            <div class="timeline-body">
                <div class="time-gutter">
                    ${hours.map(h => html`<div class="time-label">${h.toString().padStart(2, '0')}:00</div>`)}
                </div>
                <div class="timeline-main" style=${{ height: `${hours.length * HOUR_HEIGHT}px`}}>
                    <div 
                        class="day-column ${isDraggingOver ? 'drag-over' : ''}"
                        ondragover=${handleDragOver}
                        ondrop=${handleDrop}
                        ondragenter=${() => setIsDraggingOver(true)}
                        ondragleave=${() => setIsDraggingOver(false)}
                        onClick=${handleColumnClick}
                    >
                        ${hours.map(h => html`<div class="hour-row" style=${{ top: `${h * HOUR_HEIGHT}px` }}></div>`)}
                        ${timedPlans.map(plan => {
                            const fromDate = new Date(plan.scheduledFrom);
                            const toDate = plan.scheduledTo ? new Date(plan.scheduledTo) : new Date(fromDate.getTime() + (defaultPlanDuration * 60000));
                            const durationMs = toDate.getTime() - fromDate.getTime();
                            const durationHours = Math.max(0.25, durationMs / (1000 * 60 * 60)); // Min 15 mins
                                    
                            const top = (fromDate.getHours() + fromDate.getMinutes() / 60) * HOUR_HEIGHT;
                            const height = durationHours * HOUR_HEIGHT;
                            
                            const customer = customerMap.get(plan.customerId);
                            const device = deviceMap.get(plan.deviceId);
                            
                            let targetName = null;
                            if (customer) {
                                const isCompany = customer.legalForm === companyLegalFormId;
                                const displayName = isCompany && customer.companyName ? customer.companyName : `${customer.firstName} ${customer.lastName}`;
                                targetName = `${customer.customerNumber} - ${displayName}`;
                            } else if (device) {
                                targetName = device.name;
                            }
                            
                            const category = enumMaps.planCategory.get(plan.category);
                            const priority = enumMaps.planPriority.get(plan.priority);
                            const bgColor = category?.color || 'var(--primary-color)';
                            const priorityColor = priority?.color;

                            const style = { 
                                top: `${top}px`, 
                                height: `${height - 2}px`, 
                                backgroundColor: bgColor,
                                borderLeft: priorityColor ? `4px solid ${priorityColor}` : undefined
                            };
                            
                            const tooltipText = generatePlanTooltipText(plan, customerMap, deviceMap, enumMaps);
                            
                            return html`
                                <div 
                                    class="timeline-plan-item" 
                                    style=${style} 
                                    onClick=${(e) => handlePlanClick(e, plan)}
                                    data-tooltip=${tooltipText}
                                    draggable="true"
                                    ondragstart=${e => handleDragStart(e, plan)}
                                    ondragend=${handleDragEnd}
                                >
                                     <div class="resize-handle resize-handle-top" onMouseDown=${e => handleResizeStart(e, plan, 'top')}></div>
                                     <div>
                                        <strong class="plan-item-title">${enumMaps.planCategory.get(plan.category)?.label}</strong>
                                        ${height >= 30 && targetName && html`<span class="plan-item-customer">${targetName}</span>`}
                                        ${height >= 60 && plan.description && html`<p class="plan-item-description" style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px; white-space: normal; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${plan.description}</p>`}
                                    </div>
                                    <span class="plan-item-time">${fromDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <div class="resize-handle resize-handle-bottom" onMouseDown=${e => handleResizeStart(e, plan, 'bottom')}></div>
                                </div>
                            `;
                        })}
                    </div>
                </div>
            </div>
        </div>
    `;
};