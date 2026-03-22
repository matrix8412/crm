
import { html } from 'htm/preact';
import { useMemo } from 'preact/hooks';
import { icons } from '../constants/icons';
import type { NetworkDevice, Plan, AuditLogEntry, ColumnConfig, View } from '../types';
import type { ToastType } from '../../contexts/ToastContext';

interface DeviceDetailsModalProps {
    device: NetworkDevice;
    allPlans: Plan[];
    allDevices: NetworkDevice[];
    allLogs: AuditLogEntry[];
    valueMaps: { [key: string]: Map<string, any> };
    onClose: () => void;
    setModal: (modal: any) => void;
    setActiveView: (view: View) => void;
    handleSearch: (type: string, query: string) => void;
    addToast: (message: string, type: ToastType) => void;
}

const getHistorySummary = (log: AuditLogEntry, columnConfig: ColumnConfig<NetworkDevice>): string => {
    if (log.action === 'create') return 'Device created.';
    if (log.action === 'delete') return 'Device deleted.';
    if (log.action === 'update' && log.details.length > 0) {
        const relevantChanges = log.details.filter(d => d.field !== 'isDeleted');
        if (relevantChanges.length === 0) return 'System update.';
        const firstChange = relevantChanges[0];
        const fieldLabel = columnConfig[firstChange.field]?.label || firstChange.field;
        const moreCount = relevantChanges.length - 1;
        return `Updated <strong>${fieldLabel}</strong>${moreCount > 0 ? ` and ${moreCount} more field(s)` : ''}.`;
    }
    return 'Action recorded.';
};

const InfoItem = ({ label, children }) => html`
    <div class="info-item">
        <strong>${label}</strong>
        <span>${children}</span>
    </div>
`;

const DetailCard = ({ title, icon, actionButton, children }) => html`
    <div class="details-card">
        <div class="details-card-header">
            <h5>${icon} ${title}</h5>
            ${actionButton}
        </div>
        <div class="details-card-body">${children}</div>
    </div>
`;

export const DeviceDetailsModal = ({
    device,
    allPlans,
    allDevices,
    allLogs,
    valueMaps,
    onClose,
    setModal,
    setActiveView,
    handleSearch,
    addToast,
}: DeviceDetailsModalProps) => {

    const { associatedPlans, childDevices, recentHistory, parentDevice } = useMemo(() => {
        const plans = allPlans.filter(p => p.deviceId === device.id && !p.isDeleted);
        const children = allDevices.filter(d => d.parentDevice === device.id && !d.isDeleted);
        const history = allLogs
            .filter(log => log.entityId === device.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);
        const parent = device.parentDevice ? allDevices.find(d => d.id === device.parentDevice) : null;
        
        return { associatedPlans: plans, childDevices: children, recentHistory: history, parentDevice: parent };
    }, [device, allPlans, allDevices, allLogs]);

    const navigateToDevice = (d: NetworkDevice) => {
        onClose();
        setActiveView('devices');
        handleSearch('devices', d.name);
    };

    const viewFullHistory = () => {
        setModal({ type: 'history', entityId: device.id, entityType: 'devices' });
    };
    
    const viewPlanDetails = (plan: Plan) => {
        setModal({ type: 'plan', data: plan });
    };
    
    const deviceColumnConfig: ColumnConfig<NetworkDevice> = useMemo(() => {
        const config = {};
        const deviceKeys = Object.keys(device || {}) as (keyof NetworkDevice)[];
        deviceKeys.forEach(key => {
            // FIX: Ensure 'key' is treated as a string before calling string methods to prevent runtime errors.
            const label = String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            config[key] = { label };
        });
        return config;
    }, [device]);

    const address = device.addressId ? valueMaps.addresses?.get(device.addressId) : null;
    const rack = device.rackId ? valueMaps.racks?.get(device.rackId) : null;
    const site = rack ? valueMaps.sites?.get(rack.siteId) : null;
    
    const handlePing = (e) => {
        e.stopPropagation();
        if (!device.ipAddress) return;
        navigator.clipboard.writeText(`ping ${device.ipAddress}`).then(() => {
            addToast(`Ping command for ${device.ipAddress} copied to clipboard.`, 'info');
        }).catch(err => {
            console.error('Failed to copy command: ', err);
            addToast('Failed to copy command.', 'error');
        });
    };

    return html`
        <div class="modal-header">
            <h3>${icons.devices} ${device.name}</h3>
        </div>
        <div class="modal-body" style="padding: 0;">
            <div class="details-compact-layout">
                <div class="details-main-column">
                    <${DetailCard} title="Main Details" icon=${icons.info}>
                        <div class="info-grid">
                            <${InfoItem} label="IP Address">
                                <button class="btn-ping-ip" onClick=${handlePing} title="Copy ping command">${device.ipAddress}</button>
                            <//>
                            ${device.ssid && html`<${InfoItem} label="SSID">${device.ssid}<//>`}
                            <${InfoItem} label="Vendor">${valueMaps.vendor?.get(device.vendor)?.label || 'N/A'}<//>
                            <${InfoItem} label="Type">${valueMaps.deviceType?.get(device.deviceType)?.label || 'N/A'}<//>
                            <${InfoItem} label="Group">${valueMaps.deviceGroup?.get(device.deviceGroup)?.label || 'N/A'}<//>
                        </div>
                    <//>
                    <${DetailCard} title="Connectivity" icon=${icons.importExport}>
                        <div class="info-grid">
                             <${InfoItem} label="SSH">
                                ${device.sshEnabled ? `Enabled: ${device.sshPort || 'Not set'}` : 'Disabled'}
                                ${device.sshEnabled && device.sshPort && device.ipAddress && html`<a class="btn-link-inline" href="ssh://${device.ipAddress}:${device.sshPort}" target="_blank" rel="noopener noreferrer">Connect</a>`}
                            <//>
                             <${InfoItem} label="HTTP">
                                ${device.httpEnabled ? `Enabled: ${device.httpPort || 'Not set'}` : 'Disabled'}
                                ${device.httpEnabled && device.httpPort && device.ipAddress && html`<a class="btn-link-inline" href="http://${device.ipAddress}:${device.httpPort}" target="_blank" rel="noopener noreferrer">Connect</a>`}
                            <//>
                             <${InfoItem} label="HTTPS">
                                ${device.httpsEnabled ? `Enabled: ${device.httpsPort || 'Not set'}` : 'Disabled'}
                                ${device.httpsEnabled && device.httpsPort && device.ipAddress && html`<a class="btn-link-inline" href="https://${device.ipAddress}:${device.httpsPort}" target="_blank" rel="noopener noreferrer">Connect</a>`}
                            <//>
                             <${InfoItem} label="REST API">
                                ${device.apiEnabled ? `Enabled: ${device.apiPort || 'Not set'}` : 'Disabled'}
                             <//>
                        </div>
                    <//>
                    <${DetailCard} title="Location" icon=${icons.mapPin}>
                        <div class="info-grid">
                            <${InfoItem} label="Address">${address ? `${address.street} ${address.descriptiveNumber}, ${address.city}` : 'Not set'}<//>
                            <${InfoItem} label="GPS Coordinates">
                                ${device.gpsLat && device.gpsLon ? `${device.gpsLat}, ${device.gpsLon}` : 'Not set'}
                                ${device.gpsLat && device.gpsLon && html`
                                    <a class="btn-link-inline" href="https://www.google.com/maps?q=${device.gpsLat},${device.gpsLon}" target="_blank" rel="noopener noreferrer">View on Map</a>
                                `}
                            <//>
                            <${InfoItem} label="Site">${site ? site.name : 'Not set'}<//>
                            <${InfoItem} label="Rack / Position">
                                ${rack && device.u_position ? `${rack.name}, U${device.u_position} (${device.u_height || 1}U)` : (rack ? rack.name : 'Not set')}
                            <//>
                        </div>
                    <//>
                </div>
                <div class="details-side-column">
                    <${DetailCard} title="Hierarchy" icon=${icons.tree}>
                        <ul class="compact-list">
                            ${parentDevice && html`
                                <li class="compact-list-item">
                                    <div class="item-main-text">
                                        <div style=${{fontSize: '0.8rem', color: 'var(--subtle-font-color)'}}>Parent</div>
                                        ${parentDevice.name}
                                    </div>
                                    <button class="btn-link" onClick=${() => navigateToDevice(parentDevice)}>View</button>
                                </li>
                            `}
                            ${childDevices.length > 0 && childDevices.map((child, index) => html`
                                <li class="compact-list-item">
                                    <div class="item-main-text">
                                        ${index === 0 && !parentDevice && html`<div style=${{fontSize: '0.8rem', color: 'var(--subtle-font-color)'}}>Children</div>`}
                                        ${child.name}
                                    </div>
                                    <button class="btn-link" onClick=${() => navigateToDevice(child)}>View</button>
                                </li>
                            `)}
                             ${!parentDevice && childDevices.length === 0 && html`
                                <p style="font-size: 0.9rem; color: var(--subtle-font-color); padding: 0.5rem 0;">No parent or child devices.</p>
                             `}
                        </ul>
                    <//>

                    ${associatedPlans.length > 0 && html`
                        <${DetailCard} title="Associated Plans" icon=${icons.planning}>
                             <ul class="compact-list">
                                ${associatedPlans.map(plan => html`
                                     <li class="compact-list-item">
                                        <div class="item-main-text">
                                            <div>${plan.description}</div>
                                            <div class="item-sub-text">${new Date(plan.scheduledFrom).toLocaleDateString()}</div>
                                        </div>
                                        <button class="btn-link" onClick=${() => viewPlanDetails(plan)}>View</button>
                                    </li>
                                `)}
                            </ul>
                        <//>
                    `}

                    <${DetailCard} 
                        title="Recent History" 
                        icon=${icons.history}
                        actionButton=${html`<button class="btn-link" onClick=${viewFullHistory} style="font-size:0.85rem;">View All</button>`}
                    >
                        ${recentHistory.length > 0 ? html`
                            <ul class="compact-list">
                                ${recentHistory.map(log => html`
                                    <li class="compact-list-item">
                                        <div class="history-item-compact">
                                            <span class="log-action ${log.action}">${log.action}</span>
                                            <div class="history-item-compact-details">
                                                <span 
                                                    class="change-summary" 
                                                    dangerouslySetInnerHTML=${{ __html: getHistorySummary(log, deviceColumnConfig) }}
                                                ></span>
                                                <div class="item-sub-text">${new Date(log.timestamp).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </li>
                                `)}
                            </ul>
                        ` : html`
                            <p style="font-size: 0.9rem; color: var(--subtle-font-color); padding: 0.5rem 0;">No history found.</p>
                        `}
                    <//>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>Close</button>
            <button type="button" class="btn btn-primary" onClick=${() => setModal({ type: 'device', data: device })}>Edit Device</button>
        </div>
    `;
};
