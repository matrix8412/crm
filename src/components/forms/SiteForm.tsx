import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { SearchableSelect } from '../SearchableSelect';
import type { Site, Enumerations } from '../../types';

interface SiteFormProps {
    onSubmit: (data: Partial<Site>) => void;
    onCancel: () => void;
    site?: Site;
    isEdit: boolean;
    enumerations: Enumerations;
    setFormDirty: (isDirty: boolean) => void;
}

export const SiteForm = ({ onSubmit, onCancel, site, isEdit, enumerations, setFormDirty }: SiteFormProps) => {
    const getInitialData = () => site || { name: '', addressId: '', description: '' };
    const [formData, setFormData] = useState<Partial<Site>>(getInitialData());
    const [initialData, setInitialData] = useState<Partial<Site>>(getInitialData());

    useEffect(() => {
        setFormDirty(JSON.stringify(formData) !== JSON.stringify(initialData));
    }, [formData, initialData, setFormDirty]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const activeAddresses = (enumerations.addresses || []).filter(a => !a.isDeleted);
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit Site' : 'Add New Site'}</h3></div>
            <div class="modal-body">
                <div class="form-grid single-column">
                    <div class="form-group">
                        <label>Name<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onChange=${handleChange} required />
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <${SearchableSelect}
                            name="addressId"
                            value=${formData.addressId}
                            onChange=${(v) => setFormData(p => ({...p, addressId: v}))}
                            options=${activeAddresses.map(a => ({ value: a.id, label: `${a.street} ${a.descriptiveNumber}, ${a.city}` }))}
                            placeholder="Select an address"
                        />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" value=${formData.description} onChange=${handleChange}></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Site</button>
            </div>
        </form>
    `;
};
