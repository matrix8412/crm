

import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import type { UserGroup } from '../../types';

export const UserGroupForm = ({ onSubmit, onCancel, group, isEdit, setFormDirty }) => {
    const getInitialData = () =>
        group || { name: '', description: '' };

    const [formData, setFormData] = useState<Omit<UserGroup, 'id' | 'isDeleted'>>(getInitialData());
    const [initialData, setInitialData] = useState<Omit<UserGroup, 'id' | 'isDeleted'>>(getInitialData());
    const [modifiedFields, setModifiedFields] = useState(new Set());
    
    useEffect(() => {
        const newInitial = getInitialData();
        setInitialData(newInitial);
        setFormData(newInitial);
    }, [group]);

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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header">
                <h3>${isEdit ? 'Edit User Group' : 'Add New User Group'}</h3>
            </div>
            <div class="modal-body">
                <div class="form-grid single-column">
                    <div class="form-group"><label>${modifiedFields.has('name') && html`<span class="change-indicator"></span>`}Group Name<${Required} /></label><input type="text" name="name" value=${formData.name} onChange=${handleChange} required /></div>
                    <div class="form-group"><label>${modifiedFields.has('description') && html`<span class="change-indicator"></span>`}Description</label><textarea name="description" value=${formData.description} onChange=${handleChange}></textarea></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Group</button>
            </div>
        </form>
    `;
};