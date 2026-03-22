

import { html } from 'htm/preact';
import { icons } from '../../constants/icons';

export const PrefixNode = ({ node, level, expandedNodes, onToggle, setModal, toggleDeleteStatus }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const hasUsedIps = node.status === 'active' && node.usedIps && node.usedIps.length > 0;

    const handleCopy = (prefix) => {
        const { id, ...prefixCopy } = prefix;
        prefixCopy.prefix = '';
        prefixCopy.name = `${prefix.name} (Copy)`;
        setModal({ type: 'prefix', data: prefixCopy });
    };

    return html`
        <li class="tree-node ${node.isDeleted ? 'deleted-row' : ''}" style=${{ '--level': level }}>
            <div class="tree-node-content">
                <div class="tree-node-info">
                    <button 
                        class="tree-node-toggle" 
                        onClick=${() => onToggle(node.id)}
                        style=${{ visibility: (hasChildren || hasUsedIps) ? 'visible' : 'hidden' }}
                        aria-label=${isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <span class="row-chevron ${isExpanded ? 'expanded' : ''}">${icons.chevronRight}</span>
                    </button>
                    <span class="tree-node-icon">${icons.ipam}</span>
                    <div class="tree-node-text">
                        <strong>${node.name || (node.status === 'container' ? 'Container' : 'Unnamed')}</strong>
                        <span>${node.prefix}</span>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-copy" onClick=${() => handleCopy(node)} title="Copy" disabled=${node.isDeleted}>${icons.copy}</button>
                    <button class="btn-edit" onClick=${() => setModal({ type: 'prefix', data: node })} title="Edit" disabled=${node.isDeleted}>${icons.edit}</button>
                    ${node.isDeleted
                        ? html`<button class="btn-restore" onClick=${() => toggleDeleteStatus('prefixes', node.id)} title="Restore">${icons.restore}</button>`
                        : html`<button class="btn-delete" onClick=${() => toggleDeleteStatus('prefixes', node.id)} title="Delete">${icons.delete}</button>`
                    }
                </div>
            </div>
            ${isExpanded && html`
                ${hasChildren && html`
                    <ul class="tree-node-children">
                         ${node.children.map(child => html`
                            <${PrefixNode} 
                                key=${child.id}
                                node=${child}
                                level=${level + 1}
                                expandedNodes=${expandedNodes}
                                onToggle=${onToggle}
                                setModal=${setModal}
                                toggleDeleteStatus=${toggleDeleteStatus}
                            />
                         `)}
                    </ul>
                `}
                ${hasUsedIps && html`
                    <ul class="tree-node-children">
                        ${node.usedIps.map(device => html`
                            <li class="tree-node ${device.isDeleted ? 'deleted-row' : ''}" style=${{ '--level': level + 1 }}>
                                <div class="tree-node-content">
                                    <div class="tree-node-info">
                                        <span class="tree-node-toggle" style="visibility: hidden;"></span>
                                        <span class="tree-node-icon" style="color: var(--subtle-font-color);">${icons.devices}</span>
                                        <div class="tree-node-text">
                                            <strong>${device.name}</strong>
                                            <span>${device.ipAddress}</span>
                                        </div>
                                    </div>
                                    <div class="actions">
                                        <button class="btn-info" onClick=${() => setModal({ type: 'deviceDetails', data: device })} title="View Device Details">${icons.info}</button>
                                    </div>
                                </div>
                            </li>
                        `)}
                    </ul>
                `}
            `}
        </li>
    `;
};