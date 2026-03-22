
import { html } from 'htm/preact';
import { useState } from 'preact/hooks';
import { icons } from '../../constants/icons';

const EnumSubSection = ({ enumKey, enumLabel, enumerations, setModal, toggleEnumDeletedStatus, renderEnumImportExportDropdown }) => {
    const [localSearch, setLocalSearch] = useState('');
    
    let enumData = enumerations[enumKey] || [];
    if (localSearch) {
        const lowerCaseSearch = localSearch.toLowerCase();
        enumData = enumData.filter(item => item.label.toLowerCase().includes(lowerCaseSearch));
    }

    const handleCopy = (item) => {
        const { id, ...itemCopy } = item;
        itemCopy.label = `${item.label} (Copy)`;
        setModal({ type: 'enum', enumType: enumKey, enumTypeName: enumLabel, data: itemCopy });
    };

    return html`
        <div class="vpn-subsection" style="padding: 1rem 0; border-top: 1px solid var(--border-color);">
            <div class="settings-header" style="padding: 0 0.5rem 1rem 0.5rem;">
                <h3 style="font-size: 1.1rem;">${enumLabel}</h3>
                <div class="header-actions">
                     <div class="search-input-container">
                        ${icons.search}
                        <input
                            type="search"
                            class="search-input"
                            placeholder="Search ${enumLabel}..."
                            value=${localSearch}
                            onInput=${e => setLocalSearch(e.currentTarget.value)}
                        />
                    </div>
                    ${renderEnumImportExportDropdown(enumKey)}
                </div>
            </div>
            <div class="table-container" style="border: 1px solid var(--border-color); box-shadow: none;">
                <div class="table-wrapper enum-table">
                     <table>
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th style="width:120px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${enumData.map(item => html`
                                <tr class=${item.isDeleted ? 'deleted-row' : ''}>
                                    <td>${item.label}</td>
                                    <td class="actions">
                                        <button class="btn-copy" onClick=${() => handleCopy(item)} title="Copy" disabled=${item.isDeleted}>${icons.copy}</button>
                                        <button class="btn-edit" onClick=${() => setModal({ type: 'enum', enumType: enumKey, enumTypeName: enumLabel, data: item })} title="Edit" disabled=${item.isDeleted}>${icons.edit}</button>
                                        ${item.isDeleted
                                            ? html`<button class="btn-restore" onClick=${() => toggleEnumDeletedStatus(enumKey, item.id)} title="Restore">${icons.restore}</button>`
                                            : html`<button class="btn-delete" onClick=${() => toggleEnumDeletedStatus(enumKey, item.id)} title="Delete">${icons.delete}</button>`
                                        }
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};

export const L3VpnSettings = (props) => {
    return html`
        <div class="settings-section">
            <div class="settings-header">
                <h3>L3VPN Settings</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem; padding: 0 1rem 1rem 1rem;">
                <${EnumSubSection} ...${props} enumKey="routeDistinguishers" enumLabel="Route Distinguishers" />
                <${EnumSubSection} ...${props} enumKey="vpnTargets" enumLabel="VPN Targets" />
            </div>
        </div>
    `;
};
