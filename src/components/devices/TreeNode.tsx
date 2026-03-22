

import { html } from 'htm/preact';
import { icons } from '../../constants/icons';

export const TreeNode = ({ node, level, expandedNodes, onToggle, setModal, toggleDeleteStatus, addToast, openRowActionDropdown, setOpenRowActionDropdown }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const handlePing = (e) => {
        e.stopPropagation();
        if (!node.ipAddress) return;
        navigator.clipboard.writeText(`ping ${node.ipAddress}`).then(() => {
            addToast(`Ping command for ${node.ipAddress} copied to clipboard.`, 'info');
        }).catch(err => {
            console.error('Failed to copy command: ', err);
            addToast('Failed to copy command.', 'error');
        });
    };
    
    const handleCopy = (device) => {
        const { id, ...deviceCopy } = device;
        deviceCopy.name = `${device.name} (Copy)`;
        deviceCopy.ipAddress = '';
        setModal({ type: 'device', data: deviceCopy });
        setOpenRowActionDropdown(null);
    };

    const handleAction = (action) => {
        action();
        setOpenRowActionDropdown(null);
    };

    return html`
        <li class="tree-node ${node.isDeleted ? 'deleted-row' : ''}" style=${{ '--level': level }}>
            <div class="tree-node-content">
                <div class="tree-node-info">
                    <button 
                        class="tree-node-toggle" 
                        onClick=${() => onToggle(node.id)}
                        style=${{ visibility: hasChildren ? 'visible' : 'hidden' }}
                        aria-label=${isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <span class="row-chevron ${isExpanded ? 'expanded' : ''}">${icons.chevronRight}</span>
                    </button>
                    <span class="tree-node-icon">${icons.devices}</span>
                    <div class="tree-node-text">
                        <strong>${node.name}</strong>
                        <span>
                            <button class="btn-ping-ip" onClick=${handlePing} title="Copy ping command">${node.ipAddress}</button>
                        </span>
                    </div>
                </div>
                <div class="actions">
                    <div class="split-button-container">
                        <button class="btn btn-warning split-button-main" onClick=${() => setModal({ type: 'device', data: node })} title="Edit" disabled=${node.isDeleted}>${icons.edit}</button>
                        <div class="dropdown-container">
                            <button class="btn btn-warning split-button-toggle" onClick=${(e) => { e.stopPropagation(); setOpenRowActionDropdown(openRowActionDropdown === node.id ? null : node.id); }}>
                                ${icons.chevron}
                            </button>
                            ${openRowActionDropdown === node.id && html`
                                <div class="column-toggle-dropdown">
                                    <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'deviceDetails', data: node }))}>${icons.info} Details</button>
                                    <button class="io-dropdown-item" onClick=${() => handleAction(() => handleCopy(node))} disabled=${node.isDeleted}>${icons.copy} Copy</button>
                                    ${node.isDeleted
                                        ? html`<button class="io-dropdown-item success" onClick=${() => handleAction(() => toggleDeleteStatus('devices', node.id))}>${icons.restore} Restore</button>`
                                        : html`<button class="io-dropdown-item danger" onClick=${() => handleAction(() => toggleDeleteStatus('devices', node.id))}>${icons.delete} Delete</button>`
                                    }
                                    <button class="io-dropdown-item" onClick=${() => handleAction(() => setModal({ type: 'history', entityId: node.id, entityType: 'devices' }))}>${icons.history} History</button>
                                    ${node.gpsLat && node.gpsLon && html`
                                        <button class="io-dropdown-item" onClick=${() => handleAction(() => window.open(`https://www.google.com/maps?q=${node.gpsLat},${node.gpsLon}`, '_blank'))}>${icons.mapPin} Navigate</button>
                                    `}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            ${hasChildren && isExpanded && html`
                <ul class="tree-node-children">
                     ${node.children.map(child => html`
                        <${TreeNode} 
                            key=${child.id}
                            node=${child}
                            level=${level + 1}
                            expandedNodes=${expandedNodes}
                            onToggle=${onToggle}
                            setModal=${setModal}
                            toggleDeleteStatus=${toggleDeleteStatus}
                            addToast=${addToast}
                            openRowActionDropdown=${openRowActionDropdown}
                            setOpenRowActionDropdown=${setOpenRowActionDropdown}
                        />
                     `)}
                </ul>
            `}
        </li>
    `;
};