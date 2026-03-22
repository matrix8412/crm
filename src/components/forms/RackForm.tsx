import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import type { Rack, Enumerations } from '../../types';

interface RackFormProps {
    onSubmit: (data: Partial<Rack>) => void;
    onCancel: () => void;
    rack?: Rack;
    isEdit: boolean;
    enumerations: Enumerations;
    setFormDirty: (isDirty: boolean) => void;
}

export const RackForm = ({ onSubmit, onCancel, rack, isEdit, enumerations, setFormDirty }: RackFormProps) => {
    const getInitialData = () => rack || { name: '', siteId: '', uHeight: 42, description: '' };
    const [formData, setFormData] = useState<Partial<Rack>>(getInitialData());
    const [initialData, setInitialData] = useState<Partial<Rack>>(getInitialData());

    useEffect(() => {
        setFormDirty(JSON.stringify(formData) !== JSON.stringify(initialData));
    }, [formData, initialData, setFormDirty]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const activeSites = (enumerations.sites || []).filter(s => !s.isDeleted);
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit Rack' : 'Add New Rack'}</h3></div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Name<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onChange=${handleChange} required />
                    </div>
                    <div class="form-group">
                        <label>Site<${Required} /></label>
                        <select name="siteId" value=${formData.siteId} onChange=${handleChange} required>
                            <option value="" disabled>Select a site</option>
                            ${activeSites.map(s => html`<option value=${s.id}>${s.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Height (U)<${Required} /></label>
                        <input type="number" name="uHeight" value=${formData.uHeight} onChange=${handleChange} required min="1" />
                    </div>
                    <div class="form-group full-width">
                        <label>Description</label>
                        <textarea name="description" value=${formData.description} onChange=${handleChange}></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Rack</button>
            </div>
        </form>
    `;
};
