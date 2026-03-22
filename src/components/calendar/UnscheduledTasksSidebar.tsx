import { html } from 'htm/preact';
import { useState, useRef } from 'preact/hooks';
import { generatePlanTooltipText } from '../../utils/helpers';

export const UnscheduledTasksSidebar = ({ unscheduledPlans, enumMaps, setModal, addOrUpdate, plans, customerMap, deviceMap }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);

    const handleDragStart = (e, plan) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('application/json', JSON.stringify({ planId: plan.id, offsetY, isUnscheduled: true }));
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDraggingOver(false);
        }
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDraggingOver(false);

        let planId;
        let isUnscheduled = false;
        try {
            const dropData = JSON.parse(e.dataTransfer.getData('application/json'));
            planId = dropData.planId;
            isUnscheduled = !!dropData.isUnscheduled;
        } catch (err) {
            return; // Invalid drop data
        }

        if (!planId || isUnscheduled) {
            // Do not process drops of unscheduled items on the sidebar itself.
            return;
        }
        
        const originalPlan = plans.find(p => p.id === planId);
        if (originalPlan && originalPlan.scheduledFrom) {
            addOrUpdate('plans', { ...originalPlan, scheduledFrom: '', scheduledTo: '' }, { closeModal: false, toastMessage: 'Task unscheduled.' });
        }
    };

    return html`
        <aside 
            class="unscheduled-tasks-sidebar ${isDraggingOver ? 'drag-over' : ''}"
            ondragover=${handleDragOver}
            ondragenter=${handleDragEnter}
            ondragleave=${handleDragLeave}
            ondrop=${handleDrop}
        >
            <h4>Unscheduled Plans (${unscheduledPlans.length})</h4>
            <div class="unscheduled-tasks-list">
                ${unscheduledPlans.length === 0 && html`
                    <p class="no-unscheduled-tasks">All plans are scheduled.</p>
                `}
                ${unscheduledPlans.map(plan => {
                    const category = enumMaps.planCategory.get(plan.category);
                    const priority = enumMaps.planPriority.get(plan.priority);
                    const priorityColor = priority?.color || 'transparent';
                    const categoryColor = category?.color;
                    const categoryLabel = category?.label || plan.category;

                    const customer = plan.customerId ? customerMap.get(plan.customerId) : null;
                    let customerName = 'Unassigned';
                    let customerCode = 'N/A';

                    if (customer) {
                        const legalForm = enumMaps.legalForm.get(customer.legalForm);
                        customerCode = customer.customerNumber;
                        if (legalForm && legalForm.label.toLowerCase() === 'company') {
                            customerName = customer.companyName || 'Unknown Company';
                        } else {
                            customerName = `${customer.firstName} ${customer.lastName}`;
                        }
                    }

                    let planStyle = {};
                    if (categoryColor) {
                        planStyle = {
                            backgroundColor: categoryColor,
                            color: 'white',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        };
                    } else {
                        planStyle = {
                           backgroundColor: 'var(--primary-color)',
                           color: 'white',
                           textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }
                    }
                    
                    const tooltipText = generatePlanTooltipText(plan, customerMap, deviceMap, enumMaps);
                    
                    return html`
                        <div 
                            class="plan-item unscheduled-task-item" 
                            onClick=${() => setModal({ type: 'plan', data: plan })} 
                            data-tooltip=${tooltipText}
                            draggable="true"
                            ondragstart=${e => handleDragStart(e, plan)}
                            ondragend=${handleDragEnd}
                            style=${planStyle}
                        >
                            <span class="priority-dot" style=${{ backgroundColor: priorityColor, border: '1px solid rgba(0,0,0,0.2)' }}></span>
                            <div class="unscheduled-task-content">
                                <div class="task-line task-line-category">${categoryLabel}</div>
                                <div class="task-line task-line-code">${customerCode}</div>
                                <div class="task-line task-line-name">${customerName}</div>
                            </div>
                        </div>
                    `
                })}
            </div>
        </aside>
    `;
};