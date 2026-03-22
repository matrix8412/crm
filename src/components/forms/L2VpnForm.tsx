import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { TagInput } from '../TagInput';

export const L2VpnForm = ({ onSubmit, onCancel, vpn, isEdit, customers, enumerations, setFormDirty, companyLegalFormId }) => {
    const getInitialData = () =>
        vpn || {
            name: '',
            vcId: '',
            customerId: '',
            description: '',
            tagIds: [],
            encapsulationId: '',
            modeId: '',
            signalizationIds: [],
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
        onSubmit({ ...formData, vcId: Number(formData.vcId) });
    };

    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
        <form onSubmit=${handleSubmit}>
            <div class="modal-header"><h3>${isEdit ? 'Edit L2VPN' : 'Add New L2VPN'}</h3></div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Name<${Required} /></label>
                        <input type="text" name="name" value=${formData.name} onInput=${handleChange} required />
                    </div>
                    <div class="form-group">
                        <label>VC ID<${Required} /></label>
                        <input type="number" name="vcId" value=${formData.vcId} onInput=${handleChange} required min="1" />
                    </div>
                    <div class="form-group">
                        <label>Encapsulation</label>
                        <select name="encapsulationId" value=${formData.encapsulationId} onChange=${handleChange}>
                            <option value="">-- None --</option>
                            ${enumerations.l2VpnEncapsulation.filter(e => !e.isDeleted).map(e => html`<option value=${e.id}>${e.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mode</label>
                        <select name="modeId" value=${formData.modeId} onChange=${handleChange}>
                            <option value="">-- None --</option>
                            ${enumerations.l2VpnMode.filter(e => !e.isDeleted).map(e => html`<option value=${e.id}>${e.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Signalization</label>
                        <${TagInput}
                            allTags=${enumerations.l2VpnSignalization}
                            selectedTagIds=${formData.signalizationIds}
                            onChange=${(ids) => setFormData(prev => ({ ...prev, signalizationIds: ids }))}
                        />
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
                <button type="submit" class="btn btn-primary">Save L2VPN</button>
            </div>
        </form>
    `;
};