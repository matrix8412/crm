import { html } from 'htm/preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import type { Plan, Comment, User } from '../../types';
import { useUI } from '../../contexts/ToastContext';

export const PlanForm = ({ onSubmit, onCancel, plan, isEdit, customers, devices, enumerations, setFormDirty, comments, users, onAddComment }) => {
    const { addToast } = useUI();
    const getInitialData = () => 
        plan || {
            category: enumerations.planCategory.find(e => !e.isDeleted)?.id || '',
            reportingMethod: enumerations.reportingMethod.find(e => !e.isDeleted)?.id || '',
            priority: enumerations.planPriority.find(e => !e.isDeleted)?.id || '',
            description: '', customerId: '', deviceId: '', scheduledFrom: '', scheduledTo: '',
        };

    const [formData, setFormData] = useState<Omit<Plan, 'id' | 'isDeleted'>>(getInitialData());
    const [initialData, setInitialData] = useState<Omit<Plan, 'id' | 'isDeleted'>>(getInitialData());
    const [modifiedFields, setModifiedFields] = useState(new Set());
    const [newComment, setNewComment] = useState('');
    const [validation, setValidation] = useState({ customerOrDevice: true, scheduleOrder: true });

    const userMap = useMemo(() => new Map(users.map(u => [u.id, `${u.name} ${u.surname}`])), [users]);
    const canComment = useMemo(() => users.some(u => !u.isDeleted), [users]);

    const companyLegalFormId = useMemo(() => {
        return enumerations.legalForm.find(form => form.label.toLowerCase() === 'company')?.id;
    }, [enumerations.legalForm]);

    useEffect(() => {
        const newInitial = getInitialData();
        setInitialData(newInitial);
        setFormData(newInitial);
    }, [plan]);

    useEffect(() => {
        const newModifiedFields = new Set();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== initialData[key]) {
                newModifiedFields.add(key);
            }
        });
        setModifiedFields(newModifiedFields);
        setFormDirty(newModifiedFields.size > 0);
    }, [formData, initialData, setFormDirty]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // FIX: Add explicit type annotation to `newFormData` to ensure TypeScript correctly infers its shape and properties.
        const newFormData: typeof formData = { ...formData, [name]: value };

        if (name === 'customerId' || name === 'deviceId') {
            setValidation(prev => ({ ...prev, customerOrDevice: !!newFormData.customerId || !!newFormData.deviceId }));
        }
        
        if (name === 'scheduledFrom' || name === 'scheduledTo') {
            const from = newFormData.scheduledFrom ? new Date(newFormData.scheduledFrom).getTime() : 0;
            const to = newFormData.scheduledTo ? new Date(newFormData.scheduledTo).getTime() : 0;
            setValidation(prev => ({ ...prev, scheduleOrder: !from || !to || to >= from }));
        }

        setFormData(newFormData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isCustomerOrDeviceValid = !!formData.customerId || !!formData.deviceId;
        const from = formData.scheduledFrom ? new Date(formData.scheduledFrom).getTime() : 0;
        const to = formData.scheduledTo ? new Date(formData.scheduledTo).getTime() : 0;
        const isScheduleOrderValid = !from || !to || to >= from;

        setValidation({
            customerOrDevice: isCustomerOrDeviceValid,
            scheduleOrder: isScheduleOrderValid
        });

        if (isCustomerOrDeviceValid && isScheduleOrderValid) {
            onSubmit(formData);
        }
    };

    const handleAddComment = () => {
        if (!canComment) {
            addToast('An active user is required to post comments. Please go to Settings to create or activate a user.', 'error');
            return;
        }
        if (newComment.trim() && plan?.id) {
            onAddComment(plan.id, newComment.trim());
            setNewComment('');
        }
    };

    const activeCategories = enumerations.planCategory.filter(e => !e.isDeleted);
    const activePriorities = enumerations.planPriority.filter(e => !e.isDeleted);
    const activeReportingMethods = enumerations.reportingMethod.filter(e => !e.isDeleted);
    
    const Required = () => html`<span class="required-asterisk">*</span>`;


    return html`
    <form onSubmit=${handleSubmit}>
      <div class="modal-header">
        <h3>${isEdit ? 'Edit Plan' : 'Add New Plan'}</h3>
      </div>
      <div class="modal-body">
         ${!validation.customerOrDevice && html`
            <div 
                class="error-message" 
                style=${{ 
                    marginBottom: '1rem', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--danger-color)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    textAlign: 'center'
                }}
            >
                A customer or a facility/device must be selected.
            </div>
        `}
        <div class="form-grid">
            <div class="form-group">
                <label>${modifiedFields.has('category') && html`<span class="change-indicator"></span>`}Category<${Required} /></label>
                <select name="category" value=${formData.category} onChange=${handleChange} required>
                    ${activeCategories.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                </select>
            </div>
            <div class="form-group">
                <label>${modifiedFields.has('priority') && html`<span class="change-indicator"></span>`}Priority<${Required} /></label>
                <select name="priority" value=${formData.priority} onChange=${handleChange} required>
                    ${activePriorities.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                </select>
            </div>
            <div class="form-group">
                <label>${modifiedFields.has('scheduledFrom') && html`<span class="change-indicator"></span>`}Scheduled From</label>
                <input type="datetime-local" name="scheduledFrom" value=${formData.scheduledFrom} onChange=${handleChange} />
            </div>
            <div class="form-group">
                <label>${modifiedFields.has('scheduledTo') && html`<span class="change-indicator"></span>`}Scheduled To</label>
                <input type="datetime-local" name="scheduledTo" value=${formData.scheduledTo || ''} onChange=${handleChange} class=${!validation.scheduleOrder ? 'invalid' : ''} />
                ${!validation.scheduleOrder && html`<p class="error-message">End date must be after start date.</p>`}
            </div>
            <div class="form-group">
                <label>${modifiedFields.has('reportingMethod') && html`<span class="change-indicator"></span>`}Reporting Method<${Required} /></label>
                <select name="reportingMethod" value=${formData.reportingMethod} onChange=${handleChange} required>
                     ${activeReportingMethods.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                </select>
            </div>
             <div class="form-group"></div>
            <div class="form-group">
                <label>${modifiedFields.has('customerId') && html`<span class="change-indicator"></span>`}Customer</label>
                <select name="customerId" value=${formData.customerId} onChange=${handleChange}>
                    <option value="">None</option>
                    ${customers.map(c => {
                        const isCompany = c.legalForm === companyLegalFormId;
                        const displayName = isCompany && c.companyName ? c.companyName : `${c.firstName} ${c.lastName}`;
                        return html`<option value=${c.id}>${displayName}</option>`;
                    })}
                </select>
                <p class="form-text">Either Customer or Facility must be selected.</p>
            </div>
            <div class="form-group">
                <label>${modifiedFields.has('deviceId') && html`<span class="change-indicator"></span>`}Facility / Device</label>
                <select name="deviceId" value=${formData.deviceId} onChange=${handleChange}>
                    <option value="">None</option>
                    ${devices.map(d => html`<option value=${d.id}>${d.name}</option>`)}
                </select>
            </div>
            <div class="form-group full-width">
                <label>${modifiedFields.has('description') && html`<span class="change-indicator"></span>`}Description<${Required} /></label>
                <textarea name="description" value=${formData.description} onChange=${handleChange} required></textarea>
            </div>
        </div>
        ${isEdit && html`
            <div class="comments-section">
                <h4>Comments</h4>
                <div class="comments-list">
                    ${comments.length > 0 ? [...comments]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map(comment => html`
                            <div class="comment-item" key=${comment.id}>
                                <div class="comment-header">
                                    <strong class="comment-author">${userMap.get(comment.userId) || 'Deleted User'}</strong>
                                    <span class="comment-timestamp">${new Date(comment.timestamp).toLocaleString()}</span>
                                </div>
                                <p class="comment-body">${comment.text}</p>
                            </div>
                        `) : html`
                        <p class="no-comments">No comments yet.</p>
                    `}
                </div>
                <div class="add-comment-form">
                    <div class="form-group full-width">
                        <textarea 
                            id="new-comment-input"
                            aria-label="Add a comment"
                            name="newComment" 
                            value=${newComment} 
                            onChange=${e => setNewComment(e.currentTarget.value)} 
                            placeholder=${canComment ? "Add an unsolicited comment..." : "An active user is required to post comments. Please go to Settings to create or activate a user."}
                            disabled=${!canComment}
                        ></textarea>
                    </div>
                    <button 
                        type="button" 
                        class="btn btn-primary" 
                        onClick=${handleAddComment} 
                        disabled=${!newComment.trim() || !canComment}
                    >
                        Add Comment
                    </button>
                </div>
            </div>
        `}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
        <button type="submit" class="btn btn-primary">Save Plan</button>
      </div>
    </form>
  `;
};