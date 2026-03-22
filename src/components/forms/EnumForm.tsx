


import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import type { EnumValue } from '../../types';

export const EnumForm = ({ onSubmit, onCancel, enumItem, isEdit, enumTypeName, setFormDirty }) => {
    const getInitialData = () =>
        enumItem || { label: '', ssid: false, color: '#3498db' };

    const [formData, setFormData] = useState<Partial<EnumValue>>(getInitialData());
    const [initialData, setInitialData] = useState<Partial<EnumValue>>(getInitialData());
    const [modifiedFields, setModifiedFields] = useState(new Set());
    
    useEffect(() => {
        const newInitial = getInitialData();
        setInitialData(newInitial);
        setFormData(newInitial);
    }, [enumItem]);

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
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.label?.trim()) {
            alert('Label cannot be empty.');
            return;
        }
        onSubmit(formData);
    };

    const isDeviceTypeEnum = enumTypeName === 'Device Types';
    const isPlanPriorityEnum = enumTypeName === 'Plan Priorities';
    const isPlanCategoryEnum = enumTypeName === 'Plan Categories';
    const isIpamRoleEnum = enumTypeName === 'Roles';
    const isTagEnum = enumTypeName === 'Tags';

    const showColorPicker = isPlanPriorityEnum || isPlanCategoryEnum || isIpamRoleEnum || isTagEnum;
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header">
                <h3>${isEdit ? 'Edit' : 'Add'} ${enumTypeName}</h3>
            </div>
            <div class="modal-body">
                <div class="form-grid single-column">
                    <div class="form-group">
                        <label>
                            ${modifiedFields.has('label') && html`<span class="change-indicator"></span>`}
                            Label<${Required} />
                        </label>
                        <input 
                            type="text" 
                            name="label" 
                            value=${formData.label} 
                            onChange=${handleChange} 
                            required 
                            autofocus
                        />
                    </div>
                     ${showColorPicker && html`
                        <div class="form-group">
                            <label>
                                ${modifiedFields.has('color') && html`<span class="change-indicator"></span>`}
                                Color
                            </label>
                            <input
                                type="color"
                                name="color"
                                value=${formData.color || '#3498db'}
                                onChange=${handleChange}
                                style=${{ padding: '0.25rem', height: '40px', width: '100%' }}
                            />
                        </div>
                    `}
                    ${isDeviceTypeEnum && html`
                        <div class="form-group">
                             <label class="column-toggle-item">
                                ${modifiedFields.has('ssid') && html`<span class="change-indicator"></span>`}
                                <input
                                    type="checkbox"
                                    name="ssid"
                                    checked=${!!formData.ssid}
                                    onChange=${handleChange}
                                />
                                <span>Has SSID Field</span>
                            </label>
                            <p class="form-text">If checked, devices of this type will have a configurable SSID field.</p>
                        </div>
                    `}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;
};