
import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { TagInput } from '../TagInput';

export const VlanForm = ({ onSubmit, onCancel, vlan, isEdit, vlanDomains, enumerations, setFormDirty }) => {
    const getInitialData = () =>
        vlan || {
            vlanId: '',
            name: '',
            roleId: '',
            domainId: '',
            siteId: '',
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
        onSubmit({ ...formData, vlanId: Number(formData.vlanId) });
    };

    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit VLAN' : 'Add New VLAN'}</h3></div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>VLAN ID<${Required} /></label>
                        <input type="number" name="vlanId" value=${formData.vlanId} onInput=${handleChange} required min="1" max="4094" />
                    </div>
                    <div class="form-group">
                        <label>Name<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onInput=${handleChange} required />
                    </div>
                    <div class="form-group">
                        <label>Domain</label>
                        <select name="domainId" value=${formData.domainId} onInput=${handleChange}>
                            <option value="">-- None --</option>
                            ${vlanDomains.filter(d => !d.isDeleted).map(d => html`<option value=${d.id}>${d.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select name="roleId" value=${formData.roleId} onInput=${handleChange}>
                            <option value="">-- None --</option>
                            ${enumerations.ipamRoles.filter(r => !r.isDeleted).map(r => html`<option value=${r.id}>${r.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Site</label>
                        <select name="siteId" value=${formData.siteId} onInput=${handleChange}>
                            <option value="">-- None --</option>
                            ${(enumerations.sites || []).filter(s => !s.isDeleted).map(s => html`<option value=${s.id}>${s.name}</option>`)}
                        </select>
                    </div>
                    <div class="form-group full-width">
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
                <button type="submit" class="btn btn-primary">Save VLAN</button>
            </div>
        </form>
    `;
};