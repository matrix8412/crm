
import { html } from 'htm/preact';
import { icons } from './icons';
import type { Customer, NetworkDevice, Plan, User, UserGroup, AuditLogEntry, AddressValue, ColumnConfig, DeviceTemplate, Prefix, VLANDomain, VLAN, Tag, EnumValue, L2VPN, L3VPN, Site, Rack } from '../types';
import { HistoryModal } from '../components/HistoryModal';

const renderActionMenu = (itemId, openState, setOpenState, children) => html`
    <div class="dropdown-container">
        <button
            class="btn btn-warning split-button-toggle"
            onClick=${(e) => { e.stopPropagation(); setOpenState(openState === itemId ? null : itemId); }}
            title="More actions"
        >
            ${icons.chevron}
        </button>
        ${openState === itemId && html`
            <div class="column-toggle-dropdown">
                ${children}
            </div>
        `}
    </div>
`;

export const createCustomerColumnConfig = (setModal, toggleDeleteStatus, enumMaps, addressMap, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<Customer> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    }
    const handleCopy = (customer: Customer) => {
        const { id, ...customerCopy } = customer;
        customerCopy.customerNumber = `CUST-${Date.now().toString().slice(-6)}`;
        setModal({ type: 'customer', data: customerCopy });
    };

    return {
    customerNumber: { label: 'Cust. No.', render: (c: Customer) => c.customerNumber, exportValue: (c) => c.customerNumber, sortType: 'string' },
    name: { label: 'Name', render: (c: Customer) => `${c.firstName} ${c.lastName}`, exportValue: (c) => `${c.firstName} ${c.lastName}`, sortType: 'string' },
    companyName: { label: 'Company Name', render: (c: Customer) => c.companyName || '', exportValue: (c: Customer) => c.companyName || '', sortType: 'string' },
    ico: { label: 'IČO', render: (c: Customer) => c.ico || '', exportValue: (c: Customer) => c.ico || '', sortType: 'string' },
    dic: { label: 'DIČ', render: (c: Customer) => c.dic || '', exportValue: (c: Customer) => c.dic || '', sortType: 'string' },
    icDph: { label: 'IČ DPH', render: (c: Customer) => c.icDph || '', exportValue: (c: Customer) => c.icDph || '', sortType: 'string' },
    email: { label: 'Email', render: (c: Customer) => c.email, exportValue: (c) => c.email, sortType: 'string' },
    phone: { label: 'Phone', render: (c: Customer) => c.phone, exportValue: (c) => c.phone, sortType: 'string' },
    street: { 
        label: 'Street', 
        render: (c: Customer) => addressMap.get(c.addressId)?.street || 'N/A',
        exportValue: (c: Customer) => addressMap.get(c.addressId)?.street || '',
        sortType: 'string',
    },
    descriptiveNumber: { 
        label: 'Desc. No.', 
        render: (c: Customer) => addressMap.get(c.addressId)?.descriptiveNumber || 'N/A',
        exportValue: (c: Customer) => addressMap.get(c.addressId)?.descriptiveNumber || '',
        sortType: 'string',
    },
    referenceNumber: { 
        label: 'Ref. No.', 
        render: (c: Customer) => addressMap.get(c.addressId)?.referenceNumber || 'N/A',
        exportValue: (c: Customer) => addressMap.get(c.addressId)?.referenceNumber || '',
        sortType: 'string',
    },
    city: { 
        label: 'City', 
        render: (c: Customer) => addressMap.get(c.addressId)?.city || 'N/A',
        exportValue: (c: Customer) => addressMap.get(c.addressId)?.city || '',
        sortType: 'string',
    },
    zipCode: { 
        label: 'ZIP Code', 
        render: (c: Customer) => addressMap.get(c.addressId)?.zipCode || 'N/A',
        exportValue: (c: Customer) => addressMap.get(c.addressId)?.zipCode || '',
        sortType: 'string',
    },
    state: { 
        label: 'State', 
        render: (c: Customer) => addressMap.get(c.addressId)?.state || 'N/A',
        exportValue: (c: Customer) => addressMap.get(c.addressId)?.state || '',
        sortType: 'string',
    },
    dob: { label: 'Date of Birth', render: (c: Customer) => c.dob, exportValue: (c) => c.dob, sortType: 'date' },
    idCardNumber: { label: 'ID Card No.', render: (c: Customer) => c.idCardNumber, exportValue: (c) => c.idCardNumber, sortType: 'string' },
    personalId: { label: 'Personal ID', render: (c: Customer) => c.personalId, exportValue: (c) => c.personalId, sortType: 'string' },
    legalForm: { 
        label: 'Legal Form', 
        render: (c: Customer) => enumMaps.legalForm.get(c.legalForm)?.label || c.legalForm,
        exportValue: (c: Customer) => enumMaps.legalForm.get(c.legalForm)?.label || c.legalForm,
        sortType: 'string',
    },
    actions: { label: 'Actions', isAction: true, render: (c: Customer) => html`
        <div class="split-button-container">
            <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'customer', data: c })} disabled=${c.isDeleted} title="Edit">${icons.edit}</button>
            ${renderActionMenu(c.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                <button class="io-dropdown-item" onClick=${() => handleAction(() => handleCopy(c))} disabled=${c.isDeleted}>${icons.copy} Copy</button>
                ${c.isDeleted
                    ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('customers', c.id))}>${icons.restore} Restore</button>`
                    : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('customers', c.id))}>${icons.delete} Delete</button>`
                }
                <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'history', entityId: c.id, entityType: 'customers' }))}>${icons.history} History</button>
            `)}
        </div>
    `}
})};

export const createDeviceColumnConfig = (setModal, toggleDeleteStatus, enumMaps, deviceMap, addressMap, addToast, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<NetworkDevice> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    }
    const handleCopy = (device: NetworkDevice) => {
        const { id, ...deviceCopy } = device;
        deviceCopy.name = `${device.name} (Copy)`;
        deviceCopy.ipAddress = '';
        setModal({ type: 'device', data: deviceCopy });
    };

    return {
    name: { label: 'Name', render: (d: NetworkDevice) => d.name, exportValue: (d) => d.name, sortType: 'string' },
    vendor: { 
        label: 'Vendor', 
        render: (d: NetworkDevice) => enumMaps.vendor.get(d.vendor)?.label || d.vendor,
        exportValue: (d: NetworkDevice) => enumMaps.vendor.get(d.vendor)?.label || d.vendor,
        sortType: 'string',
        filterType: 'select',
        // FIX: Add explicit type annotation for `v` to resolve property access errors.
        filterOptions: Array.from(enumMaps.vendor.values()).filter((v: EnumValue) => !v.isDeleted).map((v: EnumValue) => ({ value: v.label, label: v.label }))
    },
    ipAddress: {
        label: 'IP Address', 
        render: (d: NetworkDevice) => {
            const handlePing = (e) => {
                e.stopPropagation();
                if (!d.ipAddress) return;
                navigator.clipboard.writeText(`ping ${d.ipAddress}`).then(() => {
                    addToast(`Ping command for ${d.ipAddress} copied to clipboard.`, 'info');
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    addToast('Failed to copy command.', 'error');
                });
            };
            return html`<button class="btn-ping-ip" onClick=${handlePing} title="Copy ping command">${d.ipAddress}</button>`;
        }, 
        exportValue: (d) => d.ipAddress,
        sortType: 'string',
        filterType: 'text',
    },
    address: {
        label: 'Address',
        render: (d: NetworkDevice) => {
            const address = addressMap.get(d.addressId);
            return address ? `${address.street}, ${address.city}` : 'N/A';
        },
        exportValue: (d: NetworkDevice) => {
            const address = addressMap.get(d.addressId);
            return address ? `${address.street}, ${address.city}` : '';
        },
        sortType: 'string',
    },
    rack: {
        label: 'Rack / Position',
        render: (d: NetworkDevice) => {
            const rackName = enumMaps.racks?.get(d.rackId)?.label || '—';
            if (rackName !== '—' && d.u_position) {
                return `${rackName}, U${d.u_position} (${d.u_height || 1}U)`;
            }
            return rackName;
        },
        exportValue: (d: NetworkDevice) => {
            const rackName = enumMaps.racks?.get(d.rackId)?.label || '';
            if (rackName && d.u_position) {
                return `${rackName}, U${d.u_position}`;
            }
            return rackName;
        },
        sortType: 'string',
    },
    ssid: { label: 'SSID', render: (d: NetworkDevice) => d.ssid || '—', exportValue: (d) => d.ssid || '', sortType: 'string' },
    deviceType: { 
        label: 'Type', 
        render: (d: NetworkDevice) => enumMaps.deviceType.get(d.deviceType)?.label || d.deviceType,
        exportValue: (d: NetworkDevice) => enumMaps.deviceType.get(d.deviceType)?.label || d.deviceType,
        sortType: 'string',
        filterType: 'select',
        // FIX: Add explicit type annotation for `t` to resolve property access errors.
        filterOptions: Array.from(enumMaps.deviceType.values()).filter((t: EnumValue) => !t.isDeleted).map((t: EnumValue) => ({ value: t.label, label: t.label }))
    },
    deviceGroup: { 
        label: 'Group', 
        render: (d: NetworkDevice) => enumMaps.deviceGroup.get(d.deviceGroup)?.label || d.deviceGroup,
        exportValue: (d: NetworkDevice) => enumMaps.deviceGroup.get(d.deviceGroup)?.label || d.deviceGroup,
        sortType: 'string',
    },
    parentDevice: { 
        label: 'Parent Device', 
        render: (d: NetworkDevice) => {
            if (!d.parentDevice) return '—';
            const parent = deviceMap.get(d.parentDevice);
            if (!parent) return 'N/A';
            return html`<span class=${parent.isDeleted ? 'deleted-row' : ''}>${parent.name}</span>`;
        },
        exportValue: (d: NetworkDevice) => d.parentDevice ? (deviceMap.get(d.parentDevice)?.name || '') : '',
        sortType: 'string',
    },
    gpsLat: { label: 'Latitude', render: (d: NetworkDevice) => d.gpsLat, exportValue: (d) => d.gpsLat, sortType: 'string' },
    gpsLon: { label: 'Longitude', render: (d: NetworkDevice) => d.gpsLon, exportValue: (d) => d.gpsLon, sortType: 'string' },
    actions: { label: 'Actions', isAction: true, render: (d: NetworkDevice) => html`
        <div class="split-button-container">
            <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'device', data: d })} disabled=${d.isDeleted} title="Edit">${icons.edit}</button>
            ${renderActionMenu(d.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'deviceDetails', data: d }))}>${icons.info} Details</button>
                <button class="io-dropdown-item" onClick=${() => handleAction(() => handleCopy(d))} disabled=${d.isDeleted}>${icons.copy} Copy</button>
                ${d.isDeleted
                    ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('devices', d.id))}>${icons.restore} Restore</button>`
                    : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('devices', d.id))}>${icons.delete} Delete</button>`
                }
                <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'history', entityId: d.id, entityType: 'devices' }))}>${icons.history} History</button>
                ${d.gpsLat && d.gpsLon && html`
                    <button class="io-dropdown-item" onClick=${() => handleAction(() => window.open(`https://www.google.com/maps?q=${d.gpsLat},${d.gpsLon}`, '_blank'))}>${icons.mapPin} Navigate</button>
                `}
            `)}
        </div>
    `}
})};

export const createPlanColumnConfig = (setModal, toggleDeleteStatus, customerMap, deviceMap, enumMaps, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<Plan> => {
    const companyLegalFormId = (Array.from(enumMaps.legalForm.values()) as EnumValue[]).find(form => form.label.toLowerCase() === 'company')?.id;
    
    const getCustomerDisplayName = (customer) => {
        if (!customer) return 'N/A';
        const isCompany = customer.legalForm === companyLegalFormId;
        return isCompany && customer.companyName ? customer.companyName : `${customer.firstName} ${customer.lastName}`;
    };

    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    }

    const handleCopy = (plan: Plan) => {
        const { id, ...planCopy } = plan;
        setModal({ type: 'plan', data: planCopy });
    };

    return {
        scheduledFrom: {
            label: 'Schedule',
            render: (p: Plan) => {
                if (!p.scheduledFrom) return 'Unscheduled';
                const fromDate = new Date(p.scheduledFrom);
                if (isNaN(fromDate.getTime())) return 'Invalid Date';
                
                const fromStr = fromDate.toLocaleString([], {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                if (!p.scheduledTo) return fromStr;

                const toDate = new Date(p.scheduledTo);
                if (isNaN(toDate.getTime())) return fromStr;

                const toStr = toDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${fromStr} - ${toStr}`;
            },
            exportValue: (p: Plan) => {
                if (!p.scheduledFrom) return 'Unscheduled';
                const fromDate = new Date(p.scheduledFrom);
                const fromStr = !isNaN(fromDate.getTime()) ? fromDate.toLocaleString() : 'Unscheduled';
                if (!p.scheduledTo) return fromStr;
                const toDate = new Date(p.scheduledTo);
                const toStr = !isNaN(toDate.getTime()) ? toDate.toLocaleString() : '';
                return `${fromStr} to ${toStr}`;
            },
            sortType: 'date',
        },
        category: { 
            label: 'Category', 
            render: (p: Plan) => {
                const categoryItem = enumMaps.planCategory.get(p.category);
                if (!categoryItem) return p.category;
                
                return html`
                    <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span class="priority-dot" style=${{ backgroundColor: categoryItem.color || '#ccc' }}></span>
                        <span>${categoryItem.label}</span>
                    </div>
                `;
            },
            exportValue: (p: Plan) => enumMaps.planCategory.get(p.category)?.label || p.category,
            sortType: 'string',
        },
        priority: { 
            label: 'Priority', 
            render: (p: Plan) => {
                const priorityItem = enumMaps.planPriority?.get(p.priority);
                if (!priorityItem) return p.priority;
                
                return html`
                    <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span class="priority-dot" style=${{ backgroundColor: priorityItem.color || '#ccc' }}></span>
                        <span>${priorityItem.label}</span>
                    </div>
                `;
            },
            exportValue: (p: Plan) => enumMaps.planPriority?.get(p.priority)?.label || p.priority,
            sortType: 'string',
        },
        description: { label: 'Description', render: (p: Plan) => p.description, exportValue: (p) => p.description, sortType: 'string' },
        reportingMethod: { 
            label: 'Reporting', 
            render: (p: Plan) => enumMaps.reportingMethod.get(p.reportingMethod)?.label || p.reportingMethod,
            exportValue: (p: Plan) => enumMaps.reportingMethod.get(p.reportingMethod)?.label || p.reportingMethod,
            sortType: 'string',
        },
        customer: { 
            label: 'Customer', 
            render: (p: Plan) => {
                if (!p.customerId) return '—';
                const customer = customerMap.get(p.customerId);
                if (!customer) return 'N/A';
                return getCustomerDisplayName(customer);
            },
            exportValue: (p: Plan) => p.customerId ? getCustomerDisplayName(customerMap.get(p.customerId)) : '',
            sortType: 'string',
        },
        device: { 
            label: 'Facility / Device', 
            render: (p: Plan) => {
                if (!p.deviceId) return '—';
                const device = deviceMap.get(p.deviceId);
                return device ? device.name : 'N/A';
            },
            exportValue: (p: Plan) => p.deviceId ? (deviceMap.get(p.deviceId)?.name || '') : '',
            sortType: 'string',
        },
        actions: { label: 'Actions', isAction: true, render: (p: Plan) => html`
            <div class="split-button-container">
                <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'plan', data: p })} disabled=${p.isDeleted} title="Edit">${icons.edit}</button>
                ${renderActionMenu(p.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    <button class="io-dropdown-item" onClick=${() => handleAction(() => handleCopy(p))} disabled=${p.isDeleted}>${icons.copy} Copy</button>
                    ${p.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('plans', p.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('plans', p.id))}>${icons.delete} Delete</button>`
                    }
                    <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'history', entityId: p.id, entityType: 'plans' }))}>${icons.history} History</button>
                `)}
            </div>
        `}
    };
};

export const createUserColumnConfig = (setModal, toggleDeleteStatus, userGroupMap, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<User> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };

    return {
        name: { label: 'First Name', render: (u: User) => u.name, exportValue: u => u.name, sortType: 'string' },
        surname: { label: 'Last Name', render: (u: User) => u.surname, exportValue: u => u.surname, sortType: 'string' },
        email: { label: 'Email', render: (u: User) => u.email, exportValue: u => u.email, sortType: 'string' },
        group: {
            label: 'User Group',
            render: (u: User) => userGroupMap.get(u.groupId) || 'N/A',
            exportValue: (u: User) => userGroupMap.get(u.groupId) || '',
            sortType: 'string',
        },
        actions: { label: 'Actions', isAction: true, render: (u: User) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'user', data: u })} disabled=${u.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(u.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${u.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('users', u.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('users', u.id))}>${icons.delete} Delete</button>`
                    }
                    <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'history', entityId: u.id, entityType: 'users' }))}>${icons.history} History</button>
                `)}
            </div>
        `}
    };
};

export const createUserGroupColumnConfig = (setModal, toggleDeleteStatus, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<UserGroup> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };

    return {
        name: { label: 'Group Name', render: (g: UserGroup) => g.name, exportValue: g => g.name, sortType: 'string' },
        description: { label: 'Description', render: (g: UserGroup) => g.description || '—', exportValue: g => g.description || '', sortType: 'string' },
        actions: { label: 'Actions', isAction: true, render: (g: UserGroup) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'group', data: g })} disabled=${g.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(g.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${g.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('userGroups', g.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('userGroups', g.id))}>${icons.delete} Delete</button>`
                    }
                    <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'history', entityId: g.id, entityType: 'userGroups' }))}>${icons.history} History</button>
                `)}
            </div>
        `}
    };
};

export const createAddressEnumColumnConfig = (setModal, toggleEnumDeletedStatus, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<AddressValue> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };
    return {
        street: { label: 'Street', render: (a: AddressValue) => a.street, exportValue: a => a.street, sortType: 'string' },
        descriptiveNumber: { label: 'Desc. No.', render: (a: AddressValue) => a.descriptiveNumber, exportValue: a => a.descriptiveNumber, sortType: 'string' },
        referenceNumber: { label: 'Ref. No.', render: (a: AddressValue) => a.referenceNumber || '—', exportValue: a => a.referenceNumber || '', sortType: 'string' },
        city: { label: 'City', render: (a: AddressValue) => a.city, exportValue: a => a.city, sortType: 'string' },
        zipCode: { label: 'ZIP Code', render: (a: AddressValue) => a.zipCode, exportValue: a => a.zipCode, sortType: 'string' },
        state: { label: 'State', render: (a: AddressValue) => a.state, exportValue: a => a.state, sortType: 'string' },
        actions: { label: 'Actions', isAction: true, render: (a: AddressValue) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'address', data: a, enumType: 'addresses' })} disabled=${a.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(a.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${a.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleEnumDeletedStatus('addresses', a.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleEnumDeletedStatus('addresses', a.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createDeviceTemplateColumnConfig = (setModal, toggleEnumDeletedStatus, enumMaps, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<DeviceTemplate> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };

    return {
        name: { label: 'Template Name', render: (t: DeviceTemplate) => t.name, exportValue: t => t.name, sortType: 'string' },
        vendor: {
            label: 'Vendor',
            render: (t: DeviceTemplate) => enumMaps.vendor.get(t.vendorId)?.label || 'N/A',
            exportValue: (t: DeviceTemplate) => enumMaps.vendor.get(t.vendorId)?.label || '',
            sortType: 'string',
        },
        frontImage: {
            label: 'Front View',
            render: (t: DeviceTemplate) => t.frontImage ? html`<img src=${t.frontImage} alt="front" style="height: 40px;"/>` : '—',
        },
        backImage: {
            label: 'Back View',
            render: (t: DeviceTemplate) => t.backImage ? html`<img src=${t.backImage} alt="back" style="height: 40px;"/>` : '—',
        },
        actions: { label: 'Actions', isAction: true, render: (t: DeviceTemplate) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'deviceTemplate', data: t })} disabled=${t.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(t.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${t.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleEnumDeletedStatus('deviceTemplates', t.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleEnumDeletedStatus('deviceTemplates', t.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createPrefixColumnConfig = (setModal, toggleDeleteStatus, enumMaps, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<Prefix> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };

    return {
        prefix: { label: 'Prefix', render: (p: Prefix) => p.prefix, exportValue: p => p.prefix, sortType: 'string' },
        name: { label: 'Name', render: (p: Prefix) => p.name, exportValue: p => p.name, sortType: 'string' },
        status: { label: 'Status', render: (p: Prefix) => p.status.charAt(0).toUpperCase() + p.status.slice(1), exportValue: p => p.status, sortType: 'string' },
        role: {
            label: 'Role',
            render: (p: Prefix) => p.roleId ? (enumMaps.ipamRoles.get(p.roleId)?.label || 'N/A') : '—',
            exportValue: (p: Prefix) => p.roleId ? (enumMaps.ipamRoles.get(p.roleId)?.label || '') : '',
            sortType: 'string'
        },
        site: {
            label: 'Site',
            render: (p: Prefix) => p.siteId ? (enumMaps.sites.get(p.siteId)?.name || 'N/A') : '—',
            exportValue: (p: Prefix) => p.siteId ? (enumMaps.sites.get(p.siteId)?.name || '') : '',
            sortType: 'string'
        },
        isPool: { label: 'Is Pool', render: (p: Prefix) => p.isPool ? 'Yes' : 'No', exportValue: p => p.isPool ? 'Yes' : 'No', sortType: 'string' },
        description: { label: 'Description', render: (p: Prefix) => p.description || '—', exportValue: p => p.description || '', sortType: 'string' },
        tags: {
            label: 'Tags',
            render: (p: Prefix) => p.tagIds?.length > 0 ? p.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '—',
            exportValue: (p: Prefix) => p.tagIds?.length > 0 ? p.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '',
            sortType: 'string'
        },
        actions: { label: 'Actions', isAction: true, render: (p: Prefix) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'prefix', data: p })} disabled=${p.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(p.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${p.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('prefixes', p.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('prefixes', p.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createVlanColumnConfig = (setModal, toggleDeleteStatus, enumMaps, vlanDomainMap, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<VLAN> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };

    return {
        vlanId: { label: 'VLAN ID', render: (v: VLAN) => v.vlanId, exportValue: v => v.vlanId, sortType: 'number' },
        name: { label: 'Name', render: (v: VLAN) => v.name, exportValue: v => v.name, sortType: 'string' },
        domain: {
            label: 'Domain',
            render: (v: VLAN) => v.domainId ? (vlanDomainMap.get(v.domainId)?.name || 'N/A') : 'Global',
            exportValue: (v: VLAN) => v.domainId ? (vlanDomainMap.get(v.domainId)?.name || '') : 'Global',
            sortType: 'string'
        },
        role: {
            label: 'Role',
            render: (v: VLAN) => v.roleId ? (enumMaps.ipamRoles.get(v.roleId)?.label || 'N/A') : '—',
            exportValue: (v: VLAN) => v.roleId ? (enumMaps.ipamRoles.get(v.roleId)?.label || '') : '',
            sortType: 'string'
        },
        site: {
            label: 'Site',
            render: (v: VLAN) => v.siteId ? (enumMaps.sites.get(v.siteId)?.name || 'N/A') : '—',
            exportValue: (v: VLAN) => v.siteId ? (enumMaps.sites.get(v.siteId)?.name || '') : '',
            sortType: 'string'
        },
        tags: {
            label: 'Tags',
            render: (v: VLAN) => v.tagIds?.length > 0 ? v.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '—',
            exportValue: (v: VLAN) => v.tagIds?.length > 0 ? v.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '',
            sortType: 'string'
        },
        actions: { label: 'Actions', isAction: true, render: (v: VLAN) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'vlan', data: v })} disabled=${v.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(v.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${v.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('vlans', v.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('vlans', v.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createVlanDomainColumnConfig = (setModal, toggleDeleteStatus, enumMaps, vlanDomainMap, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<VLANDomain> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };
    return {
        name: { label: 'Name', render: (d: VLANDomain) => d.name, exportValue: d => d.name, sortType: 'string' },
        parent: {
            label: 'Parent',
            render: (d: VLANDomain) => d.parentId ? (vlanDomainMap.get(d.parentId)?.name || 'N/A') : '—',
            exportValue: (d: VLANDomain) => d.parentId ? (vlanDomainMap.get(d.parentId)?.name || '') : '',
            sortType: 'string'
        },
        description: { label: 'Description', render: (d: VLANDomain) => d.description || '—', exportValue: d => d.description || '', sortType: 'string' },
        tags: {
            label: 'Tags',
            render: (d: VLANDomain) => d.tagIds?.length > 0 ? d.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '—',
            exportValue: (d: VLANDomain) => d.tagIds?.length > 0 ? d.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '',
            sortType: 'string'
        },
        actions: { label: 'Actions', isAction: true, render: (d: VLANDomain) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'vlanDomain', data: d })} disabled=${d.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(d.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${d.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('vlanDomains', d.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('vlanDomains', d.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createL2VpnColumnConfig = (setModal, toggleDeleteStatus, customerMap, companyLegalFormId, enumMaps, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<L2VPN> => {
    const handleAction = (action) => { action(); setOpenRowActionDropdown(null); };
    const getCustomerDisplayName = (customer) => {
        if (!customer) return 'N/A';
        const isCompany = customer.legalForm === companyLegalFormId;
        return isCompany && customer.companyName ? customer.companyName : `${customer.firstName} ${customer.lastName}`;
    };
    return {
        name: { label: 'Name', render: (v: L2VPN) => v.name, exportValue: v => v.name, sortType: 'string' },
        vcId: { label: 'VC ID', render: (v: L2VPN) => v.vcId, exportValue: v => v.vcId, sortType: 'number' },
        customer: {
            label: 'Customer',
            render: (v: L2VPN) => v.customerId ? getCustomerDisplayName(customerMap.get(v.customerId)) : '—',
            exportValue: (v: L2VPN) => v.customerId ? getCustomerDisplayName(customerMap.get(v.customerId)) : '',
            sortType: 'string'
        },
        tags: {
            label: 'Tags',
            render: (v: L2VPN) => v.tagIds?.length > 0 ? v.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '—',
            exportValue: (v: L2VPN) => v.tagIds?.length > 0 ? v.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '',
            sortType: 'string'
        },
        actions: { label: 'Actions', isAction: true, render: (v: L2VPN) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'l2vpn', data: v })} disabled=${v.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(v.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${v.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('l2vpns', v.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('l2vpns', v.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createL3VpnColumnConfig = (setModal, toggleDeleteStatus, customerMap, companyLegalFormId, enumMaps, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<L3VPN> => {
    const handleAction = (action) => { action(); setOpenRowActionDropdown(null); };
    const getCustomerDisplayName = (customer) => {
        if (!customer) return 'N/A';
        const isCompany = customer.legalForm === companyLegalFormId;
        return isCompany && customer.companyName ? customer.companyName : `${customer.firstName} ${customer.lastName}`;
    };
    return {
        name: { label: 'Name (VRF)', render: (v: L3VPN) => v.name, exportValue: v => v.name, sortType: 'string' },
        routeDistinguisher: { 
            label: 'Route Distinguisher', 
            render: (v: L3VPN) => enumMaps.routeDistinguishers.get(v.routeDistinguisher)?.label || v.routeDistinguisher,
            exportValue: (v: L3VPN) => enumMaps.routeDistinguishers.get(v.routeDistinguisher)?.label || v.routeDistinguisher,
            sortType: 'string'
        },
        customer: {
            label: 'Customer',
            render: (v: L3VPN) => v.customerId ? getCustomerDisplayName(customerMap.get(v.customerId)) : '—',
            exportValue: (v: L3VPN) => v.customerId ? getCustomerDisplayName(customerMap.get(v.customerId)) : '',
            sortType: 'string'
        },
        tags: {
            label: 'Tags',
            render: (v: L3VPN) => v.tagIds?.length > 0 ? v.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '—',
            exportValue: (v: L3VPN) => v.tagIds?.length > 0 ? v.tagIds.map(id => enumMaps.tags.get(id)?.label).join(', ') : '',
            sortType: 'string'
        },
        actions: { label: 'Actions', isAction: true, render: (v: L3VPN) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'l3vpn', data: v })} disabled=${v.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(v.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${v.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('l3vpns', v.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('l3vpns', v.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createSiteColumnConfig = (setModal, toggleEnumDeletedStatus, addressMap, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<Site> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };
    return {
        name: { label: 'Name', render: (s: Site) => s.name, exportValue: s => s.name, sortType: 'string' },
        address: {
            label: 'Address',
            render: (s: Site) => s.addressId ? (addressMap.get(s.addressId)?.street || 'N/A') : '—',
            exportValue: (s: Site) => s.addressId ? (addressMap.get(s.addressId)?.street || '') : '',
            sortType: 'string'
        },
        description: { label: 'Description', render: (s: Site) => s.description || '—', exportValue: s => s.description || '', sortType: 'string' },
        actions: { label: 'Actions', isAction: true, render: (s: Site) => html`
            <div class="split-button-container">
                <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'site', data: s })} disabled=${s.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(s.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${s.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleEnumDeletedStatus('sites', s.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleEnumDeletedStatus('sites', s.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};

export const createRackColumnConfig = (setModal, toggleEnumDeletedStatus, enumMaps, openRowActionDropdown, setOpenRowActionDropdown): ColumnConfig<Rack> => {
    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };
    return {
        name: { label: 'Name', render: (r: Rack) => r.name, exportValue: r => r.name, sortType: 'string' },
        site: {
            label: 'Site',
            render: (r: Rack) => enumMaps.sites.get(r.siteId)?.name || 'N/A',
            exportValue: (r: Rack) => enumMaps.sites.get(r.siteId)?.name || '',
            sortType: 'string'
        },
        uHeight: { label: 'Height (U)', render: (r: Rack) => r.uHeight, exportValue: r => r.uHeight, sortType: 'number' },
        description: { label: 'Description', render: (r: Rack) => r.description || '—', exportValue: r => r.description || '', sortType: 'string' },
        actions: { label: 'Actions', isAction: true, render: (r: Rack) => html`
            <div class="split-button-container">
                 <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'rack', data: r })} disabled=${r.isDeleted} title="Edit">${icons.edit}</button>
                 ${renderActionMenu(r.id, openRowActionDropdown, setOpenRowActionDropdown, html`
                    ${r.isDeleted
                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleEnumDeletedStatus('racks', r.id))}>${icons.restore} Restore</button>`
                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleEnumDeletedStatus('racks', r.id))}>${icons.delete} Delete</button>`
                    }
                `)}
            </div>
        `}
    };
};
