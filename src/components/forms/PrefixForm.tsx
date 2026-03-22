
import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { SearchableSelect } from '../SearchableSelect';
import { TagInput } from '../TagInput';

const IP_PREFIX_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))$|^((([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))$/;

export const PrefixForm = ({ onSubmit, onCancel, prefix, isEdit, enumerations, setFormDirty }) => {
    const getInitialData = () =>
        prefix || {
            prefix: '',
            name: '',
            roleId: '',
            siteId: '',
            status: 'active',
            description: '',
            tagIds: [],
            isPool: false,
        };

    const [formData, setFormData] = useState(getInitialData());
    const [initialData, setInitialData] = useState(getInitialData());
    const [isPrefixValid, setIsPrefixValid] = useState(true);

    useEffect(() => {
        const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
        setFormDirty(isDirty);
    }, [formData, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name === 'prefix') {
            setIsPrefixValid(IP_PREFIX_REGEX.test(val));
        }
        
        const newFormData = { ...formData, [name]: val };
        if (name === 'status' && val !== 'active') {
            newFormData.isPool = false;
        }
        setFormData(newFormData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!IP_PREFIX_REGEX.test(formData.prefix)) {
            setIsPrefixValid(false);
            return;
        }
        onSubmit(formData);
    };
    
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit Prefix' : 'Add New Prefix'}</h3></div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Prefix (CIDR notation)<${Required} /></label>
                        <input type="text" name="prefix" value=${formData.prefix} onInput=${handleChange} required class=${!isPrefixValid ? 'invalid' : ''} placeholder="e.g., 192.168.1.0/24" />
                        ${!isPrefixValid && html`<p class="error-message">Enter a valid IPv4 or IPv6 prefix (e.g., 192.168.0.0/24 or 2001:db8::/64).</p>`}
                    </div>
                    <div class="form-group">
                        <label>Name${formData.status === 'active' && html`<${Required} />`}</label>
                        <input type="text" name="name" value=${formData.name} onInput=${handleChange} required=${formData.status === 'active'} />
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
                    <div class="form-group">
                        <label>Status<${Required} /></label>
                        <select name="status" value=${formData.status} onInput=${handleChange} required>
                            <option value="active">Active</option>
                            <option value="container">Container</option>
                            <option value="reserved">Reserved</option>
                        </select>
                    </div>
                    ${formData.status === 'active' && html`
                        <div class="form-group full-width">
                            <label class="column-toggle-item">
                                <input type="checkbox" name="isPool" checked=${!!formData.isPool} onChange=${handleChange} />
                                <span>This is a pool</span>
                            </label>
                            <p class="form-text">If checked, this prefix can be used for automatic IP address assignment.</p>
                        </div>
                    `}
                    <div class="form-group full-width">
                        <label>Description</label>
                        <textarea name="description" value=${formData.description} onInput=${handleChange}></textarea>
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
                <button type="submit" class="btn btn-primary">Save Prefix</button>
            </div>
        </form>
    `;
};