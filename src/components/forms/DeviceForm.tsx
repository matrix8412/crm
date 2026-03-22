import { html } from 'htm/preact';
import { useState, useMemo, useEffect } from 'preact/hooks';
import type { NetworkDevice } from '../../types';
import { icons } from '../../constants/icons';
import { SearchableSelect } from '../SearchableSelect';
import { useUI } from '../../contexts/ToastContext';
import { MapPicker } from '../MapPicker';

// Define regex patterns as literals for correctness and readability.
const IPV4_REGEX = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;
const IPV6_REGEX = /((([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

// Use the .source property to get the string representation of the pattern.
// This works for both the HTML `pattern` attribute and the `new RegExp()` constructor.
const COMBINED_IP_REGEX_PATTERN = `^(${IPV4_REGEX.source}|${IPV6_REGEX.source})$`;

// Create a single RegExp object for validation.
const ipRegex = new RegExp(COMBINED_IP_REGEX_PATTERN);

const validateIpAddress = (ip: string): boolean => {
    // An empty IP is considered valid for the sake of the form, `required` attribute handles submission.
    if (!ip) return true;
    return ipRegex.test(ip);
};

const RackVisualizer = ({ rack, devicesInRack, currentPosition, currentHeight, currentDeviceId }) => {
    if (!rack) return null;

    const units = Array.from({ length: rack.uHeight }, (_, i) => rack.uHeight - i); // [42, 41, ... 1]
    const occupancy = new Map(); // Map<number, device>

    devicesInRack.forEach(d => {
        if (d.id === currentDeviceId) return;
        
        const pos = parseInt(String(d.u_position), 10);
        const height = parseInt(String(d.u_height), 10);

        if (!isNaN(pos) && pos > 0 && !isNaN(height) && height > 0) {
            for (let i = 0; i < height; i++) {
                const u = pos + i;
                if (!occupancy.has(u)) {
                    occupancy.set(u, d);
                }
            }
        }
    });

    const currentStart = parseInt(currentPosition, 10);
    const currentHeightParsed = parseInt(currentHeight, 10);
    const hasCurrentSelection = !isNaN(currentStart) && !isNaN(currentHeightParsed) && currentStart > 0 && currentHeightParsed > 0;

    return html`
        <div class="rack-visualizer">
            <div class="rack-body">
                ${units.map(u => {
                    const occupiedBy = occupancy.get(u);
                    let isCurrent = false;
                    if(hasCurrentSelection) {
                        const currentEnd = currentStart + currentHeightParsed - 1;
                        isCurrent = u >= currentStart && u <= currentEnd;
                    }

                    const isConflict = isCurrent && occupiedBy;
                    
                    let className = 'rack-unit-slot';
                    let title = `U${u}: Free`;
                    let label = null;

                    if (isConflict) {
                        className += ' conflict';
                        title = `U${u}: CONFLICT with ${occupiedBy.name}`;
                    } else if (isCurrent) {
                        className += ' current';
                        title = `U${u}: Current selection`;
                    } else if (occupiedBy) {
                        className += ' occupied';
                        title = `U${u}: Occupied by ${occupiedBy.name}`;
                    }

                    // Show device name on its starting U
                    if(occupiedBy && parseInt(String(occupiedBy.u_position), 10) === u) {
                        label = html`<span class="rack-device-label">${occupiedBy.name}</span>`;
                    }

                    return html`
                        <div class="rack-unit" key=${u}>
                            <div class="rack-unit-label">${u}</div>
                            <div class=${className} title=${title}>
                                ${label}
                            </div>
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
};


export const DeviceForm = ({ onSubmit, onCancel, device, isEdit, devices, enumerations, setFormDirty }) => {
    const { addToast } = useUI();
    const getInitialData = () => {
        const initial = device ? { ...device } : {
            name: '',
            vendor: enumerations.vendor.find(e => !e.isDeleted)?.id || '',
            deviceGroup: enumerations.deviceGroup.find(e => !e.isDeleted)?.id || '',
            addressId: '',
            gpsLat: '', gpsLon: '',
            parentDevice: '', ipAddress: '',
            deviceType: enumerations.deviceType.find(e => !e.isDeleted)?.id || '',
            ssid: '',
            sshPort: '',
            httpPort: '',
            httpsPort: '',
            apiPort: '',
            apiUser: '',
            apiPassword: '',
            sshEnabled: false,
            httpEnabled: false,
            httpsEnabled: false,
            apiEnabled: false,
            rackId: '',
            u_position: '',
            u_height: 1,
        };
        
        // For backwards compatibility, derive enabled state if not explicitly set
        initial.sshEnabled = initial.sshEnabled ?? !!initial.sshPort;
        initial.httpEnabled = initial.httpEnabled ?? !!initial.httpPort;
        initial.httpsEnabled = initial.httpsEnabled ?? !!initial.httpsPort;
        initial.apiEnabled = initial.apiEnabled ?? !!initial.apiPort;

        return initial;
    };


    const [formData, setFormData] = useState<Partial<NetworkDevice>>(getInitialData());
    const [initialData, setInitialData] = useState<Partial<NetworkDevice>>(getInitialData());
    const [modifiedFields, setModifiedFields] = useState(new Set());
    const [isIpValid, setIsIpValid] = useState(() => validateIpAddress(formData.ipAddress));
    const [isIpUnique, setIsIpUnique] = useState(true);
    const [isFetchingGps, setIsFetchingGps] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [rackOccupancyError, setRackOccupancyError] = useState('');

    const validateIpUniqueness = (ip: string): boolean => {
        if (!ip) return true;
        const trimmedIp = ip.trim();
        const otherDevices = isEdit ? devices.filter(d => d.id !== device.id) : devices;
        return !otherDevices.some(d => d.ipAddress === trimmedIp);
    };
    
    useEffect(() => {
        const newInitial = getInitialData();
        setInitialData(newInitial);
        setFormData(newInitial);
        setIsIpValid(validateIpAddress(newInitial.ipAddress));
        setIsIpUnique(validateIpUniqueness(newInitial.ipAddress));
    }, [device]);

    useEffect(() => {
        const newModifiedFields = new Set();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== initialData[key]) {
                newModifiedFields.add(key);
            }
        });
        setModifiedFields(newModifiedFields);
        setFormDirty(newModifiedFields.size > 0);
    }, [formData, initialData, setFormDirty]);

    const selectedDeviceType = useMemo(() => {
        return enumerations.deviceType.find(dt => dt.id === formData.deviceType);
    }, [formData.deviceType, enumerations.deviceType]);
    
    const selectedRack = useMemo(() => {
        return (enumerations.racks || []).find(r => r.id === formData.rackId);
    }, [formData.rackId, enumerations.racks]);

    const devicesInRack = useMemo(() => {
        if (!formData.rackId) return [];
        return devices.filter(d => d.rackId === formData.rackId && d.id !== device?.id);
    }, [formData.rackId, devices, device]);

    useEffect(() => {
        if (!formData.rackId) {
            setRackOccupancyError('');
            return;
        }

        const position = parseInt(String(formData.u_position), 10);
        const height = parseInt(String(formData.u_height), 10);
        
        if (!formData.u_position || isNaN(position) || position < 1) {
            setRackOccupancyError(''); // Don't show error if position is not set yet
            return;
        }
        if (!formData.u_height || isNaN(height) || height < 1) {
            setRackOccupancyError('U Height must be a positive number.');
            return;
        }
        
        if (selectedRack && (position + height - 1 > selectedRack.uHeight)) {
            setRackOccupancyError(`Position exceeds rack height of ${selectedRack.uHeight}U.`);
            return;
        }

        const newDeviceStart = position;
        const newDeviceEnd = position + height - 1;

        const conflictingDevice = devicesInRack.find(d => {
            const existingStart = parseInt(String(d.u_position), 10);
            const existingHeight = parseInt(String(d.u_height), 10);

            if (isNaN(existingStart) || isNaN(existingHeight) || existingHeight < 1) {
                return false;
            }
            
            const existingEnd = existingStart + existingHeight - 1;
            // Check for overlap
            return newDeviceStart <= existingEnd && newDeviceEnd >= existingStart;
        });

        if (conflictingDevice) {
            setRackOccupancyError(`Position conflicts with device: ${conflictingDevice.name} (U${conflictingDevice.u_position}-${parseInt(String(conflictingDevice.u_position), 10) + parseInt(String(conflictingDevice.u_height), 10) - 1}).`);
        } else {
            setRackOccupancyError('');
        }
    }, [formData.rackId, formData.u_position, formData.u_height, devicesInRack, selectedRack]);


    const showSsidField = useMemo(() => !!selectedDeviceType?.ssid, [selectedDeviceType]);

    useEffect(() => {
        // Clear SSID field if the selected device type does not support it
        if (!showSsidField && formData.ssid) {
            setFormData(prev => ({ ...prev, ssid: '' }));
        }
    }, [showSsidField, formData.ssid]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'ipAddress') {
            setIsIpValid(validateIpAddress(value));
            setIsIpUnique(validateIpUniqueness(value));
        }
        
        setFormData(prev => {
            let newFormData = { ...prev };
            if (type === 'checkbox') {
                newFormData[name] = checked;
                if (!checked) {
                    if (name === 'sshEnabled') newFormData.sshPort = '';
                    if (name === 'httpEnabled') newFormData.httpPort = '';
                    if (name === 'httpsEnabled') newFormData.httpsPort = '';
                    if (name === 'apiEnabled') {
                        newFormData.apiPort = '';
                        newFormData.apiUser = '';
                        newFormData.apiPassword = '';
                    }
                }
            } else {
                newFormData[name] = value;
            }
            return newFormData;
        });
    };

    const handleAddressChange = (value: string) => {
        setFormData(prev => ({ ...prev, addressId: value, rackId: '' }));
    };
    
    const handleRackChange = (e) => {
        const newRackId = e.target.value;
        setFormData(prev => ({
            ...prev,
            rackId: newRackId,
            u_position: newRackId ? prev.u_position : '',
            u_height: newRackId ? (prev.u_height || 1) : 1
        }));
    };

    const handleGetNextIp = () => {
        addToast('Automatic IP assignment from IPAM is not yet implemented.', 'info');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const ip = formData.ipAddress?.trim() || '';
        const isFormatValid = validateIpAddress(ip);
        const isUnique = validateIpUniqueness(ip);

        setIsIpValid(isFormatValid);
        setIsIpUnique(isUnique);

        if (!isFormatValid || !isUnique || rackOccupancyError) {
            return;
        }
        
        // Convert to numbers before submitting, or nullify if empty
        const finalData = {
            ...formData,
            ipAddress: ip,
            u_position: formData.u_position ? parseInt(String(formData.u_position), 10) : undefined,
            u_height: formData.u_height ? parseInt(String(formData.u_height), 10) : undefined,
        };

        onSubmit(finalData);
    };

    const selectedParentDevice = useMemo(() => {
        return devices.find(d => d.id === formData.parentDevice);
    }, [formData.parentDevice, devices]);

    const canUseParentGps = !!(selectedParentDevice && selectedParentDevice.gpsLat && selectedParentDevice.gpsLon);

    const handleUseParentGps = () => {
        if (!canUseParentGps) return;
        setFormData(prev => ({
            ...prev,
            gpsLat: selectedParentDevice.gpsLat,
            gpsLon: selectedParentDevice.gpsLon,
        }));
    };

    const handleGetCurrentGps = () => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser.', 'error');
            return;
        }

        setIsFetchingGps(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    gpsLat: String(latitude.toFixed(6)),
                    gpsLon: String(longitude.toFixed(6)),
                }));
                addToast('GPS coordinates fetched successfully.', 'success');
                setIsFetchingGps(false);
            },
            (error) => {
                let message = 'An unknown error occurred while fetching GPS coordinates.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'You denied the request for Geolocation.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'The request to get user location timed out.';
                        break;
                }
                addToast(message, 'error');
                console.error(`Geolocation error (code ${error.code}): ${error.message}`);
                setIsFetchingGps(false);
            }
        );
    };

    const handleGpsChange = (lat, lon) => {
        setFormData(prev => ({ ...prev, gpsLat: lat, gpsLon: lon }));
    };

    const racksForSite = useMemo(() => {
        if (!formData.addressId) return [];
        const site = (enumerations.sites || []).find(s => s.addressId === formData.addressId);
        if (!site) return [];
        return (enumerations.racks || []).filter(r => r.siteId === site.id && !r.isDeleted);
    }, [formData.addressId, enumerations.sites, enumerations.racks]);

    const activeVendors = enumerations.vendor.filter(e => !e.isDeleted);
    const activeDeviceTypes = enumerations.deviceType.filter(e => !e.isDeleted);
    const activeDeviceGroups = enumerations.deviceGroup.filter(e => !e.isDeleted);
    const activeAddresses = (enumerations.addresses || []).filter(a => !a.isDeleted);
    
    const Required = () => html`<span class="required-asterisk">*</span>`;

    return html`
    <form onSubmit=${handleSubmit}>
        <div class="modal-header">
            <h3>${isEdit ? 'Edit Network Device' : 'Add New Device'}</h3>
        </div>
        <div class="modal-body">
            <div class="modal-tabs">
                <button type="button" class="modal-tab ${activeTab === 'details' ? 'active' : ''}" onClick=${(e) => { e.preventDefault(); setActiveTab('details'); }}>Device Details</button>
                <button type="button" class="modal-tab ${activeTab === 'connections' ? 'active' : ''}" onClick=${(e) => { e.preventDefault(); setActiveTab('connections'); }}>Connection Settings</button>
            </div>

            ${activeTab === 'details' && html`
                <div class="form-grid">
                    <div class="form-group"><label>${modifiedFields.has('name') && html`<span class="change-indicator"></span>`}Name<${Required} /></label><input type="text" name="name" value=${formData.name} onInput=${handleChange} required /></div>
                    <div class="form-group">
                        <div class="label-with-action">
                            <label>${modifiedFields.has('ipAddress') && html`<span class="change-indicator"></span>`}IP Address<${Required} /></label>
                            <button type="button" class="btn-link" onClick=${handleGetNextIp}>Get next available IP</button>
                        </div>
                        <input
                            type="text"
                            name="ipAddress"
                            value=${formData.ipAddress}
                            onInput=${handleChange}
                            required
                            pattern=${COMBINED_IP_REGEX_PATTERN}
                            class=${!isIpValid || !isIpUnique ? 'invalid' : ''}
                            title="Please enter a valid IPv4 or IPv6 address."
                        />
                        ${!isIpValid && html`<p class="error-message">Invalid IPv4 or IPv6 address format.</p>`}
                        ${!isIpUnique && html`<p class="error-message">This IP address is already in use.</p>`}
                    </div>
                    <div class="form-group">
                        <label>${modifiedFields.has('vendor') && html`<span class="change-indicator"></span>`}Vendor<${Required} /></label>
                        <select name="vendor" value=${formData.vendor} onInput=${handleChange} required>
                            ${activeVendors.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${modifiedFields.has('deviceType') && html`<span class="change-indicator"></span>`}Device Type<${Required} /></label>
                        <select name="deviceType" value=${formData.deviceType} onInput=${handleChange} required>
                            ${activeDeviceTypes.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                        </select>
                    </div>
                    ${showSsidField && html`
                        <div class="form-group">
                            <label>${modifiedFields.has('ssid') && html`<span class="change-indicator"></span>`}SSID</label>
                            <input type="text" name="ssid" value=${formData.ssid || ''} onInput=${handleChange} />
                        </div>
                    `}
                    <div class="form-group">
                        <label>${modifiedFields.has('deviceGroup') && html`<span class="change-indicator"></span>`}Device Group<${Required} /></label>
                        <select name="deviceGroup" value=${formData.deviceGroup} onInput=${handleChange} required>
                            ${activeDeviceGroups.map(e => html`<option value=${e.id}>${e.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${modifiedFields.has('parentDevice') && html`<span class="change-indicator"></span>`}Parent Device</label>
                        <select name="parentDevice" value=${formData.parentDevice} onInput=${handleChange}>
                            <option value="">None</option>
                            ${devices.map(d => html`<option value=${d.id}>${d.name} (${d.ipAddress})</option>`)}
                        </select>
                    </div>
                    
                    <div class="form-group full-width" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: -0.5rem;">
                        <label>${modifiedFields.has('addressId') && html`<span class="change-indicator"></span>`}Address</label>
                        <${SearchableSelect}
                            name="addressId"
                            value=${formData.addressId}
                            onChange=${handleAddressChange}
                            options=${activeAddresses.map(a => ({ value: a.id, label: `${a.street} ${a.descriptiveNumber}, ${a.city} ${a.zipCode}` }))}
                            placeholder="Search and select an address"
                        />
                    </div>
                    <div class="form-group">
                        <label>${modifiedFields.has('rackId') && html`<span class="change-indicator"></span>`}Rack</label>
                        <select name="rackId" value=${formData.rackId} onInput=${handleRackChange} disabled=${racksForSite.length === 0}>
                            <option value="">${racksForSite.length === 0 ? 'No racks at selected site' : '-- None --'}</option>
                            ${racksForSite.map(r => html`<option value=${r.id}>${r.name}</option>`)}
                        </select>
                        <p class="form-text">Select an address with a configured site to see available racks.</p>
                    </div>

                    ${formData.rackId && html`
                        <div class="form-group full-width" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 0.5rem;">
                            <label>Rack Position</label>
                            <div class="form-grid" style="grid-template-columns: 1fr 1fr 2fr; align-items: start; gap: 1rem; margin-top: 0.5rem;">
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    <div class="form-group">
                                        <label for="u_position">U Position (from bottom)<//></label>
                                        <input id="u_position" type="number" name="u_position" value=${formData.u_position || ''} onInput=${handleChange} min="1" max=${selectedRack?.uHeight || '99'} class=${rackOccupancyError ? 'invalid' : ''} />
                                    </div>
                                    <div class="form-group">
                                        <label for="u_height">U Height<//></label>
                                        <input id="u_height" type="number" name="u_height" value=${formData.u_height || '1'} onInput=${handleChange} min="1" />
                                    </div>
                                </div>
                                <div class="form-group full-width" style="grid-column: 2 / 4;">
                                    <${RackVisualizer} rack=${selectedRack} devicesInRack=${devicesInRack} currentPosition=${formData.u_position} currentHeight=${formData.u_height} currentDeviceId=${device?.id} />
                                </div>
                            </div>
                            ${rackOccupancyError && html`<p class="error-message full-width" style="margin-top: -0.5rem;">${rackOccupancyError}</p>`}
                        </div>
                    `}

                    <div class="form-group full-width" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 0.5rem;">
                        <div class="label-with-action">
                            <label>GPS Coordinates</label>
                            <button 
                                type="button" 
                                class="btn-link" 
                                onClick=${handleUseParentGps} 
                                disabled=${!canUseParentGps}
                                title=${canUseParentGps ? `Use GPS from ${selectedParentDevice?.name}` : 'Parent device has no GPS data'}
                            >
                                Use Parent GPS
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="label-with-action">
                             <label for="gpsLat">${modifiedFields.has('gpsLat') && html`<span class="change-indicator"></span>`}Latitude</label>
                        </div>
                        <div class="input-with-button">
                            <input id="gpsLat" type="text" name="gpsLat" value=${formData.gpsLat} onInput=${handleChange} />
                             <button
                                type="button"
                                class="btn-icon-inside"
                                onClick=${handleGetCurrentGps}
                                disabled=${isFetchingGps}
                                title="Get current GPS coordinates"
                            >
                                ${icons.locate}
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                         <label for="gpsLon">${modifiedFields.has('gpsLon') && html`<span class="change-indicator"></span>`}Longitude</label>
                        <input id="gpsLon" type="text" name="gpsLon" value=${formData.gpsLon} onInput=${handleChange} />
                    </div>

                    <div class="form-group full-width">
                        <label>Pick Location on Map</label>
                        <${MapPicker} lat=${formData.gpsLat} lon=${formData.gpsLon} onPositionChange=${handleGpsChange} />
                    </div>
                </div>
            `}

            ${activeTab === 'connections' && html`
                <div class="form-grid">
                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>${(modifiedFields.has('sshEnabled') || modifiedFields.has('sshPort')) && html`<span class="change-indicator"></span>`}SSH</label>
                            <label class="switch">
                                <input type="checkbox" name="sshEnabled" checked=${!!formData.sshEnabled} onChange=${handleChange} />
                                <span class="slider round"></span>
                            </label>
                        </div>
                        ${formData.sshEnabled && html`
                            <input type="number" name="sshPort" value=${formData.sshPort || ''} onInput=${handleChange} min="1" max="65535" placeholder="Enter SSH port" />
                        `}
                    </div>

                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>${(modifiedFields.has('httpEnabled') || modifiedFields.has('httpPort')) && html`<span class="change-indicator"></span>`}HTTP</label>
                            <label class="switch">
                                <input type="checkbox" name="httpEnabled" checked=${!!formData.httpEnabled} onChange=${handleChange} />
                                <span class="slider round"></span>
                            </label>
                        </div>
                        ${formData.httpEnabled && html`
                            <input type="number" name="httpPort" value=${formData.httpPort || ''} onInput=${handleChange} min="1" max="65535" placeholder="Enter HTTP port" />
                        `}
                    </div>

                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>${(modifiedFields.has('httpsEnabled') || modifiedFields.has('httpsPort')) && html`<span class="change-indicator"></span>`}HTTPS</label>
                            <label class="switch">
                                <input type="checkbox" name="httpsEnabled" checked=${!!formData.httpsEnabled} onChange=${handleChange} />
                                <span class="slider round"></span>
                            </label>
                        </div>
                        ${formData.httpsEnabled && html`
                            <input type="number" name="httpsPort" value=${formData.httpsPort || ''} onInput=${handleChange} min="1" max="65535" placeholder="Enter HTTPS port" />
                        `}
                    </div>

                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <label>${(modifiedFields.has('apiEnabled') || modifiedFields.has('apiPort')) && html`<span class="change-indicator"></span>`}REST API</label>
                            <label class="switch">
                                <input type="checkbox" name="apiEnabled" checked=${!!formData.apiEnabled} onChange=${handleChange} />
                                <span class="slider round"></span>
                            </label>
                        </div>
                        ${formData.apiEnabled && html`
                            <input type="number" name="apiPort" value=${formData.apiPort || ''} onInput=${handleChange} min="1" max="65535" placeholder="Enter REST API port" />
                        `}
                    </div>
                    
                    ${formData.apiEnabled && formData.apiPort && html`
                        <div class="form-group">
                            <label>${modifiedFields.has('apiUser') && html`<span class="change-indicator"></span>`}API User</label>
                            <input type="text" name="apiUser" value=${formData.apiUser || ''} onInput=${handleChange} />
                        </div>
                        <div class="form-group">
                            <label>${modifiedFields.has('apiPassword') && html`<span class="change-indicator"></span>`}API Password</label>
                            <input type="password" name="apiPassword" value=${formData.apiPassword || ''} onInput=${handleChange} />
                        </div>
                    `}
                </div>
            `}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onCancel}>Cancel</button>
            <button type="submit" class="btn btn-primary" disabled=${!isIpValid || !isIpUnique || !!rackOccupancyError}>Save Device</button>
        </div>
    </form>
  `;
};