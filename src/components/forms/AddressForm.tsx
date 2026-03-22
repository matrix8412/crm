

import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import type { AddressValue } from '../../types';

export const AddressForm = ({ onSubmit, onCancel, address, isEdit, setFormDirty }) => {
  const getInitialData = () =>
    address || {
      street: '', descriptiveNumber: '', referenceNumber: '',
      city: '', zipCode: '', state: '',
      gpsLat: '', gpsLon: ''
    };
  
  const [formData, setFormData] = useState<Partial<AddressValue>>(getInitialData());
  const [initialData, setInitialData] = useState<Partial<AddressValue>>(getInitialData());

  useEffect(() => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
    setFormDirty(isDirty);
  }, [formData, initialData, setFormDirty]);

  useEffect(() => {
      const newInitial = getInitialData();
      setInitialData(newInitial);
      setFormData(newInitial);
  }, [address]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const Required = () => html`<span class="required-asterisk">*</span>`;

  return html`
    <form onSubmit=${handleSubmit}>
      <div class="modal-header">
        <h3>${isEdit ? 'Edit Address' : 'Add New Address'}</h3>
      </div>
      <div class="modal-body">
        <div class="form-grid">
            <div class="form-group full-width"><label>Street<${Required} /></label><input type="text" name="street" value=${formData.street} onChange=${handleChange} required /></div>
            <div class="form-group"><label>Descriptive Number<${Required} /></label><input type="text" name="descriptiveNumber" value=${formData.descriptiveNumber} onChange=${handleChange} required/></div>
            <div class="form-group"><label>Reference Number</label><input type="text" name="referenceNumber" value=${formData.referenceNumber} onChange=${handleChange} /></div>
            <div class="form-group"><label>City<${Required} /></label><input type="text" name="city" value=${formData.city} onChange=${handleChange} required/></div>
            <div class="form-group"><label>ZIP Code<${Required} /></label><input type="text" name="zipCode" value=${formData.zipCode} onChange=${handleChange} required/></div>
            <div class="form-group"><label>State<${Required} /></label><input type="text" name="state" value=${formData.state} onChange=${handleChange} required/></div>
            <div class="form-group"><label>GPS Latitude</label><input type="text" name="gpsLat" value=${formData.gpsLat} onChange=${handleChange} /></div>
            <div class="form-group"><label>GPS Longitude</label><input type="text" name="gpsLon" value=${formData.gpsLon} onChange=${handleChange} /></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
        <button type="submit" class="btn btn-primary">Save Address</button>
      </div>
    </form>
  `;
};