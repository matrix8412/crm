import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { TagInput } from '../TagInput';

export const L3VpnForm = ({ onSubmit, onCancel, vpn, isEdit, customers, enumerations, setFormDirty, companyLegalFormId }) => {
    const getInitialData = () =>
        vpn || {
            name: '',
            routeDistinguisher: '',
            importTarget: '',
            exportTarget: '',
            customerId: '',
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

    const activeVpnTargets = enumerations.vpnTargets.filter(t => !t.isDeleted);
    const activeRouteDistinguishers = enumerations.routeDistinguishers.filter(rd => !rd.isDeleted);

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit L3VPN (VRF)' : 'Add New L3VPN (VRF)'}</h3></div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Name (VRF)<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onInput=${handleChange} required />
                    </div>
                    <div class="form-group">
                        <label>Route Distinguisher<${Required} /></label>
                        <select name="routeDistinguisher" value=${formData.routeDistinguisher} onChange=${handleChange} required>
                            <option value="" disabled>-- Select a Route Distinguisher --</option>
                            ${activeRouteDistinguishers.map(rd => html`<option value=${rd.id}>${rd.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Import VPN Target</label>
                        <select name="importTarget" value=${formData.importTarget} onChange=${handleChange}>
                            <option value="">-- None --</option>
                            ${activeVpnTargets.map(t => html`<option value=${t.id}>${t.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Export VPN Target</label>
                        <select name="exportTarget" value=${formData.exportTarget} onChange=${handleChange}>
                            <option value="">-- None --</option>
                            ${activeVpnTargets.map(t => html`<option value=${t.id}>${t.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>Customer</label>
                        <select name="customerId" value=${formData.customerId} onChange=${handleChange}>
                            <option value="">-- None --</option>
                            ${customers.map(c => {
                                const isCompany = c.legalForm === companyLegalFormId;
                                const displayName = isCompany && c.companyName ? c.companyName : `${c.firstName} ${c.lastName}`;
                                return html`<option value=${c.id}>${displayName}</option>`;
                            })}
                        </select>
                    </div>
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
                <button type="submit" class="btn btn-primary">Save L3VPN</button>
            </div>
        </form>
    `;
};