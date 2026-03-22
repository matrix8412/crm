

import { html } from 'htm/preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import type { Customer } from '../../types';
import { SearchableSelect } from '../SearchableSelect';

export const CustomerForm = ({ onSubmit, onCancel, customer, isEdit, enumerations, setFormDirty }) => {
  const getInitialData = () =>
    customer || {
      customerNumber: `CUST-${Date.now().toString().slice(-6)}`,
      firstName: '', lastName: '',
      companyName: '', ico: '', dic: '', icDph: '',
      dob: '', idCardNumber: '', phone: '',
      mobile: '', email: '', personalId: '',
      addressId: '',
      legalForm: enumerations.legalForm.find(e => !e.isDeleted)?.id || '',
    };

  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'isDeleted'>>(getInitialData());
  const [initialData, setInitialData] = useState<Omit<Customer, 'id' | 'isDeleted'>>(getInitialData());
  const [modifiedFields, setModifiedFields] = useState(new Set());
  
  const [isIcoValid, setIcoValid] = useState(true);
  const [isDicValid, setDicValid] = useState(true);

  const companyLegalFormId = useMemo(() => {
    return enumerations.legalForm.find(form => form.label.toLowerCase() === 'company')?.id;
  }, [enumerations.legalForm]);

  const isCompany = useMemo(() => {
    return formData.legalForm === companyLegalFormId;
  }, [formData.legalForm, companyLegalFormId]);

  useEffect(() => {
    const newInitial = getInitialData();
    setInitialData(newInitial);
    setFormData(newInitial);
  }, [customer]);
  
  useEffect(() => {
    if (!isCompany) {
        // Clear company-specific fields if legal form is not 'Company'
        setFormData(prev => ({
            ...prev,
            companyName: '',
            ico: '',
            dic: '',
            icDph: '',
        }));
        setIcoValid(true);
        setDicValid(true);
    }
  }, [isCompany]);

  useEffect(() => {
    const newModifiedFields = new Set();
    Object.keys(formData).forEach(key => {
        if (String(formData[key] ?? '') !== String(initialData[key] ?? '')) {
            newModifiedFields.add(key);
        }
    });
    setModifiedFields(newModifiedFields);
    setFormDirty(newModifiedFields.size > 0);
  }, [formData, initialData, setFormDirty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericRegex = /^[0-9]*$/;
    
    // FIX: Add explicit type annotation to `updatedFormData` to ensure TypeScript correctly infers its shape and properties.
    let updatedFormData: Omit<Customer, 'id' | 'isDeleted'> = { ...formData, [name]: value };

    if (name === 'ico') {
        setIcoValid(numericRegex.test(value));
    }
    if (name === 'dic') {
        setDicValid(numericRegex.test(value));
        updatedFormData.icDph = value ? `SK${value}` : '';
    }
    
    setFormData(updatedFormData);
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, addressId: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCompany) {
        const numericRegex = /^[0-9]*$/;
        const icoValid = numericRegex.test(formData.ico);
        const dicValid = numericRegex.test(formData.dic);
        setIcoValid(icoValid);
        setDicValid(dicValid);

        if (!icoValid || !dicValid || !formData.ico || !formData.dic) {
            // Check for emptiness as well since it's required
            return;
        }
    }
    onSubmit(formData);
  };

  const activeLegalForms = enumerations.legalForm.filter(e => !e.isDeleted);
  const activeAddresses = (enumerations.addresses || []).filter(a => !a.isDeleted);

  const SectionHeader = ({ title }) => html`
    <div class="form-group full-width" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: -0.5rem;">
        <h4 style="margin-bottom: 1rem; font-size: 1.1rem; font-weight: 600;">${title}</h4>
    </div>
  `;
  
  const Required = () => html`<span class="required-asterisk">*</span>`;

  const AddressField = html`
    <div class="form-group full-width" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 0.5rem;">
        <label>${modifiedFields.has('addressId') && html`<span class="change-indicator"></span>`}Address<${Required} /></label>
        <${SearchableSelect}
            name="addressId"
            value=${formData.addressId}
            onChange=${handleAddressChange}
            options=${activeAddresses.map(a => ({ value: a.id, label: `${a.street} ${a.descriptiveNumber}, ${a.city} ${a.zipCode}` }))}
            placeholder="Search and select an address"
            required=${true}
        />
    </div>
  `;

  return html`
    <form onSubmit=${handleSubmit}>
      <div class="modal-header">
        <h3>${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
      </div>
      <div class="modal-body">
        <div class="form-grid">
            <div class="form-group"><label>${modifiedFields.has('customerNumber') && html`<span class="change-indicator"></span>`}Customer Number</label><input type="text" name="customerNumber" value=${formData.customerNumber} readonly /></div>
            <div class="form-group">
                <label>${modifiedFields.has('legalForm') && html`<span class="change-indicator"></span>`}Legal Form<${Required} /></label>
                <select name="legalForm" value=${formData.legalForm} onChange=${handleChange}>
                    ${activeLegalForms.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                </select>
            </div>
            
            ${isCompany && html`
                <${SectionHeader} title="Company Details" />
                <div class="form-group full-width"><label>${modifiedFields.has('companyName') && html`<span class="change-indicator"></span>`}Company Name<${Required} /></label><input type="text" name="companyName" value=${formData.companyName} onChange=${handleChange} required=${isCompany} /></div>
                <div class="form-group">
                    <label>${modifiedFields.has('ico') && html`<span class="change-indicator"></span>`}IČO<${Required} /></label>
                    <input 
                        type="text" 
                        name="ico" 
                        value=${formData.ico} 
                        onChange=${handleChange} 
                        required=${isCompany} 
                        pattern="[0-9]*"
                        title="IČO must contain only numbers."
                        class=${!isIcoValid ? 'invalid' : ''}
                    />
                    ${!isIcoValid && html`<p class="error-message">IČO must contain only numbers.</p>`}
                </div>
                <div class="form-group">
                    <label>${modifiedFields.has('dic') && html`<span class="change-indicator"></span>`}DIČ<${Required} /></label>
                    <input 
                        type="text" 
                        name="dic" 
                        value=${formData.dic} 
                        onChange=${handleChange} 
                        required=${isCompany} 
                        pattern="[0-9]*"
                        title="DIČ must contain only numbers."
                        class=${!isDicValid ? 'invalid' : ''}
                    />
                    ${!isDicValid && html`<p class="error-message">DIČ must contain only numbers.</p>`}
                </div>
                <div class="form-group">
                    <label>${modifiedFields.has('icDph') && html`<span class="change-indicator"></span>`}IČ DPH</label>
                    <input 
                        type="text" 
                        name="icDph" 
                        value=${formData.icDph} 
                        readonly 
                    />
                </div>
                ${AddressField}
            `}

            <${SectionHeader} title=${isCompany ? 'Contact Person' : 'Personal Details'} />
            <div class="form-group"><label>${modifiedFields.has('firstName') && html`<span class="change-indicator"></span>`}${isCompany ? 'Contact First Name' : 'First Name'}${!isCompany && html`<${Required} />`}</label><input type="text" name="firstName" value=${formData.firstName} onChange=${handleChange} required=${!isCompany} /></div>
            <div class="form-group"><label>${modifiedFields.has('lastName') && html`<span class="change-indicator"></span>`}${isCompany ? 'Contact Last Name' : 'Last Name'}${!isCompany && html`<${Required} />`}</label><input type="text" name="lastName" value=${formData.lastName} onChange=${handleChange} required=${!isCompany} /></div>
            
            ${!isCompany && html`
                <div class="form-group"><label>${modifiedFields.has('dob') && html`<span class="change-indicator"></span>`}Date of Birth</label><input type="date" name="dob" value=${formData.dob} onChange=${handleChange} /></div>
                <div class="form-group"><label>${modifiedFields.has('idCardNumber') && html`<span class="change-indicator"></span>`}ID Card Number</label><input type="text" name="idCardNumber" value=${formData.idCardNumber} onChange=${handleChange} /></div>
                <div class="form-group"><label>${modifiedFields.has('personalId') && html`<span class="change-indicator"></span>`}Personal ID Number</label><input type="text" name="personalId" value=${formData.personalId} onChange=${handleChange} /></div>
                ${AddressField}
            `}
            
            <${SectionHeader} title="Contact Information" />
            <div class="form-group"><label>${modifiedFields.has('email') && html`<span class="change-indicator"></span>`}Email<${Required} /></label><input type="email" name="email" value=${formData.email} onChange=${handleChange} required /></div>
            <div class="form-group"><label>${modifiedFields.has('phone') && html`<span class="change-indicator"></span>`}Phone</label><input type="tel" name="phone" value=${formData.phone} onChange=${handleChange} /></div>
            <div class="form-group"><label>${modifiedFields.has('mobile') && html`<span class="change-indicator"></span>`}Mobile</label><input type="tel" name="mobile" value=${formData.mobile} onChange=${handleChange} /></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
        <button type="submit" class="btn btn-primary">Save Customer</button>
      </div>
    </form>
  `;
};