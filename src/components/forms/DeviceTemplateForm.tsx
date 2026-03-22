

import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import type { DeviceTemplate, Enumerations } from '../../types';

interface DeviceTemplateFormProps {
    onSubmit: (data: Partial<DeviceTemplate>) => void;
    onCancel: () => void;
    template?: DeviceTemplate;
    isEdit: boolean;
    enumerations: Enumerations;
    setFormDirty: (isDirty: boolean) => void;
}

export const DeviceTemplateForm = ({ onSubmit, onCancel, template, isEdit, enumerations, setFormDirty }: DeviceTemplateFormProps) => {
    const getInitialData = () =>
        template || {
            name: '',
            vendorId: enumerations.vendor.find(e => !e.isDeleted)?.id || '',
            frontImage: '',
            backImage: '',
        };

    const [formData, setFormData] = useState<Partial<DeviceTemplate>>(getInitialData());
    const [initialData, setInitialData] = useState<Partial<DeviceTemplate>>(getInitialData());

    useEffect(() => {
        const newInitial = getInitialData();
        setInitialData(newInitial);
        setFormData(newInitial);
    }, [template]);

    useEffect(() => {
        const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
        setFormDirty(isDirty);
    }, [formData, initialData, setFormDirty]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const { name, files } = target;
        if (files && files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, [name]: event.target?.result as string }));
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const activeVendors = enumerations.vendor.filter(v => !v.isDeleted);

    const ImagePreview = ({ src, name }) => {
        if (!src) return null;
        return html`
            <div style=${{ marginTop: '0.5rem' }}>
                <img src=${src} alt="${name} preview" style=${{ maxHeight: '100px', maxWidth: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
            </div>
        `;
    };
    
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header">
                <h3>${isEdit ? 'Edit Device Template' : 'Add New Device Template'}</h3>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Device Name<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onChange=${handleChange} required />
                    </div>
                    <div class="form-group full-width">
                        <label>Vendor<${Required} /></label>
                        <select name="vendorId" value=${formData.vendorId} onChange=${handleChange} required>
                            <option value="" disabled>Select a vendor</option>
                            ${activeVendors.map(v => html`<option value=${v.id}>${v.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Front Image</label>
                        <input type="file" name="frontImage" onChange=${handleFileChange} accept="image/*" />
                        <${ImagePreview} src=${formData.frontImage} name="front" />
                    </div>
                    <div class="form-group">
                        <label>Back Image</label>
                        <input type="file" name="backImage" onChange=${handleFileChange} accept="image/*" />
                        <${ImagePreview} src=${formData.backImage} name="back" />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Template</button>
            </div>
        </form>
    `;
};