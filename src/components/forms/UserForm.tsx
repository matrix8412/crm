

import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import type { User } from '../../types';

export const UserForm = ({ onSubmit, onCancel, user, isEdit, userGroups, setFormDirty }) => {
    const getInitialData = () =>
        user || { name: '', surname: '', email: '', groupId: '' };

    const [formData, setFormData] = useState<Omit<User, 'id' | 'isDeleted'>>(getInitialData());
    const [initialData, setInitialData] = useState<Omit<User, 'id' | 'isDeleted'>>(getInitialData());
    const [modifiedFields, setModifiedFields] = useState(new Set());

    useEffect(() => {
        const newInitial = getInitialData();
        setInitialData(newInitial);
        setFormData(newInitial);
    }, [user]);

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
                <h3>${isEdit ? 'Edit User' : 'Add New User'}</h3>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group"><label>${modifiedFields.has('name') && html`<span class="change-indicator"></span>`}Name<${Required} /></label><input type="text" name="name" value=${formData.name} onChange=${handleChange} required /></div>
                    <div class="form-group"><label>${modifiedFields.has('surname') && html`<span class="change-indicator"></span>`}Surname<${Required} /></label><input type="text" name="surname" value=${formData.surname} onChange=${handleChange} required /></div>
                    <div class="form-group"><label>${modifiedFields.has('email') && html`<span class="change-indicator"></span>`}Email<${Required} /></label><input type="email" name="email" value=${formData.email} onChange=${handleChange} required /></div>
                    <div class="form-group">
                        <label>${modifiedFields.has('groupId') && html`<span class="change-indicator"></span>`}User Group<${Required} /></label>
                        <select name="groupId" value=${formData.groupId} onChange=${handleChange} required>
                            <option value="" disabled>Select a group</option>
                            ${userGroups.map(g => html`<option value=${g.id}>${g.name}</option>`)}
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save User</button>
            </div>
        </form>
    `;
};