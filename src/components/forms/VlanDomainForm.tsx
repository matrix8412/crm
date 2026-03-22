

import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { TagInput } from '../TagInput';
import { SearchableSelect } from '../SearchableSelect';

export const VlanDomainForm = ({ onSubmit, onCancel, vlanDomain, isEdit, vlanDomains, enumerations, setFormDirty }) => {
    const getInitialData = () =>
        vlanDomain || {
            name: '',
            parentId: '',
            description: '',
            tagIds: [],
        };

    const [formData, setFormData] = useState(getInitialData());
    const [initialData, setInitialData] = useState(getInitialData());

    useEffect(() => {
        const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
        setFormDirty(isDirty);
    }, [formData, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const Required = () => html`<span class="required-asterisk">*</span>`;

    const availableParents = vlanDomains.filter(d => d && d.name && !d.isDeleted && d.id !== vlanDomain?.id);

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit VLAN Domain' : 'Add New VLAN Domain'}</h3></div>
            <div class="modal-body">
                <div class="form-grid single-column">
                    <div class="form-group">
                        <label>Name<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onInput=${handleChange} required />
                    </div>
                    <div class="form-group">
                        <label>Parent Domain</label>
                        <${SearchableSelect}
                            name="parentId"
                            value=${formData.parentId}
                            onChange=${(v) => setFormData(prev => ({...prev, parentId: v}))}
                            options=${availableParents.map(d => ({ value: d.id, label: d.name }))}
                            placeholder="Select a parent"
                        />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" value=${formData.description} onInput=${handleChange}></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags</label>
                        <${TagInput}
                            allTags=${enumerations.tags}
                            selectedTagIds=${formData.tagIds}
                            onChange=${(ids) => setFormData(prev => ({ ...prev, tagIds: ids }))}
                        />
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Domain</button>
            </div>
        </form>
    `;
};