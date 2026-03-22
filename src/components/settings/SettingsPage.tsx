

import { html } from 'htm/preact';
import { useState, useMemo } from 'preact/hooks';
import { icons } from '../../constants/icons';
import { ColumnToggleDropdown } from '../ColumnToggleDropdown';
import { Enumerations } from '../../types';
import { UISettings } from './UISettings';
import { ModuleSettings } from './ModuleSettings';
import { L2VpnSettings } from './L2VpnSettings';
import { L3VpnSettings } from './L3VpnSettings';
import { Table } from '../Table';
import { SitesAndRacksSettings } from './SitesAndRacksSettings';

const IntegrationSettings = ({ zabbixSettings, setZabbixSettings }) => {
    const [isExpanded, setIsExpanded] = useState(zabbixSettings.enabled);

    const handleToggle = (e) => {
        const checked = e.currentTarget.checked;
        setZabbixSettings(prev => ({ ...prev, enabled: checked }));
        if (!checked) {
            setIsExpanded(false);
        }
    };
    
    const handleExpandToggle = (e) => {
        if (zabbixSettings.enabled) {
            setIsExpanded(!isExpanded);
        }
    };

    return html`
        <div class="settings-section">
            <div class="settings-header">
                <h3>Integration Modules</h3>
            </div>
            <div class="ui-settings-content">
                <div class="ui-setting-item">
                    <div class="ui-setting-item-label" style=${{ flexGrow: 1, cursor: zabbixSettings.enabled ? 'pointer' : 'default', paddingRight: '0' }} onClick=${handleExpandToggle}>
                        <div style=${{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <strong>Zabbix Integration</strong>
                                <p>Connect to a Zabbix instance to monitor network devices.</p>
                            </div>
                            ${zabbixSettings.enabled && html`
                                <span class="chevron ${isExpanded ? 'expanded' : ''}" style="margin-left: 1rem;">${icons.chevron}</span>
                            `}
                        </div>
                    </div>
                    <div class="ui-setting-item-control" onClick=${e => e.stopPropagation()}>
                        <label class="switch">
                            <input 
                                type="checkbox" 
                                checked=${zabbixSettings.enabled} 
                                onChange=${handleToggle}
                            />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                ${isExpanded && zabbixSettings.enabled && html`
                    <div class="integration-settings-expanded" style="padding: 0 1rem 1rem; animation: fadeInSubmenu 0.3s ease-in-out;">
                         <div class="form-grid single-column" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="zabbix-url">Zabbix URL</label>
                                <input id="zabbix-url" type="text" name="zabbixUrl" value=${zabbixSettings.url} onInput=${(e) => setZabbixSettings(prev => ({ ...prev, url: e.currentTarget.value }))} placeholder="https://zabbix.example.com" />
                            </div>
                            <div class="form-group">
                                <label for="zabbix-api-key">API key</label>
                                <input id="zabbix-api-key" type="password" name="zabbixApiKey" value=${zabbixSettings.apiKey} onInput=${(e) => setZabbixSettings(prev => ({ ...prev, apiKey: e.currentTarget.value }))} placeholder="Enter Zabbix API key" />
                            </div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
};

const enumMenu = {
    key: 'enumerations',
    label: 'Enumerations',
    icon: icons.list,
    items: [
        { key: 'vendor', label: 'Vendors' },
        { key: 'legalForm', label: 'Legal Forms' },
        { key: 'deviceGroup', label: 'Device Groups' },
        { key: 'deviceType', label: 'Device Types' },
        { key: 'planCategory', label: 'Plan Categories' },
        { key: 'reportingMethod', label: 'Reporting Methods' },
        { key: 'planPriority', label: 'Plan Priorities' },
        { key: 'addresses', label: 'Addresses' },
        { key: 'templatesList', label: 'Device template' },
    ]
};

const ipamMenu = {
    key: 'ipamSettings',
    label: 'IPAM',
    icon: icons.ipam,
    items: [
        { key: 'ipamRoles', label: 'Roles' },
        { key: 'tags', label: 'Tags' },
        { key: 'l2vpnSettings', label: 'L2VPN Settings' },
        { key: 'l3vpnSettings', label: 'L3VPN Settings' },
    ]
};

const systemMenu = {
    key: 'systemSettings',
    label: 'System Settings',
    icon: icons.settings,
    items: [
        { key: 'uiSettings', label: 'UI Settings' },
        { key: 'moduleSettings', label: 'Modules' },
        { key: 'integrationModules', label: 'Integration modules' },
    ]
};

const settingsMenu = [
    {
        key: 'userManagement',
        label: 'User Management',
        icon: icons.userManagement,
        items: [
            { key: 'users', label: 'Users' },
            { key: 'groups', label: 'User Groups' }
        ] as const
    },
    enumMenu,
    ipamMenu,
    systemMenu,
];

type ActiveSetting = 'users' | 'groups' | keyof Enumerations | 'templatesList' | 'uiSettings' | 'moduleSettings' | 'integrationModules' | 'l2vpnSettings' | 'l3vpnSettings' | 'sitesAndRacks';

export const SettingsPage = (props) => { 
    const { 
    users, userGroups, setModal,
    userColumnOrder, setUserColumnOrder, userColumnConfig,
    userGroupColumnOrder, setUserGroupColumnOrder, userGroupColumnConfig,
    draggedCol, dragOverCol, dndHandlers,
    userVisibleCols, setUserVisibleCols,
    userGroupVisibleCols, setUserGroupVisibleCols,
    openDropdown, setOpenDropdown,
    enumerations, toggleEnumDeletedStatus,
    filteredAddresses,
    searchQueries, handleSearch,
    pagination, handlePageChange,
    onResetUsers, onResetUserGroups,
    renderImportExportDropdown,
    renderEnumImportExportDropdown,
    addressEnumColumnConfig,
    addressEnumColumnOrder, setAddressEnumColumnOrder,
    addressEnumVisibleCols, setAddressEnumVisibleCols,
    onResetAddressEnumCols,
    filteredDeviceTemplates,
    deviceTemplateColumnConfig,
    deviceTemplateColumnOrder, setDeviceTemplateColumnOrder,
    deviceTemplateVisibleCols, setDeviceTemplateVisibleCols,
    onResetDeviceTemplateCols,
    isSidebarAutohide,
    setSidebarAutohide,
    toastOpacity,
    setToastOpacity,
    theme,
    setTheme,
    toastPosition,
    setToastPosition,
    toastTextColor,
    setToastTextColor,
    isGlossy,
    setGlossy,
    advancedFilters,
    openFilterPopover,
    setOpenFilterPopover,
    handleApplyFilter,
    handleClearFilter,
    sortConfig,
    handleSort,
    showTableHeaderFilters,
    setShowTableHeaderFilters,
    minRecordsForFilters,
    setMinRecordsForFilters,
    rowsPerPage,
    setRowsPerPage,
    moduleVisibility,
    setModuleVisibility,
    zabbixSettings,
    setZabbixSettings,
    defaultPlanDuration, 
    setDefaultPlanDuration,
    appName,
    setAppName,
    settingsMenu,
} = props;
    const [activeSetting, setActiveSetting] = useState<ActiveSetting>('users');
    const [expandedCategory, setExpandedCategory] = useState<string | null>('userManagement');

    const handleCategoryClick = (key) => {
        setExpandedCategory(prev => prev === key ? null : key);
    };

    const activeEnumLabel = useMemo(() => {
        const allItems = [...(settingsMenu.find(m => m.key === 'enumerations')?.items || []), ...(settingsMenu.find(m => m.key === 'ipamSettings')?.items || [])];
        return allItems.find(item => item.key === activeSetting)?.label || 'Items';
    }, [activeSetting, settingsMenu]);

    const renderSimpleEnumTable = (enumKey, enumLabel) => {
        const [localSearch, setLocalSearch] = useState('');
        
        let enumData = enumerations[enumKey] || [];
        if (localSearch) {
            const lowerCaseSearch = localSearch.toLowerCase();
            enumData = enumData.filter(item => item.label.toLowerCase().includes(lowerCaseSearch));
        }

        const hasColor = enumKey === 'tags' || enumKey === 'planCategory' || enumKey === 'planPriority' || enumKey === 'ipamRoles';
        const handleCopy = (item) => {
            const { id, ...itemCopy } = item;
            itemCopy.label = `${item.label} (Copy)`;
            setModal({ type: 'enum', enumType: enumKey, enumTypeName: enumLabel, data: itemCopy });
        };

        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>${enumLabel}</h3>
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
                <div class="table-container">
                    <div class="table-wrapper enum-table">
                         <table>
                            <thead>
                                <tr>
                                    <th>Label</th>
                                    ${hasColor && html`<th>Color</th>`}
                                    <th style="width:120px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${enumData.map(item => html`
                                    <tr class=${item.isDeleted ? 'deleted-row' : ''}>
                                        <td>${item.label}</td>
                                        ${hasColor && html`<td>
                                            <div style="display:flex; align-items: center; gap: 0.5rem;">
                                                <span style="width: 20px; height: 20px; border-radius: 4px; background-color: ${item.color || 'transparent'}; border: 1px solid var(--border-color);"></span>
                                                ${item.color}
                                            </div>
                                        </td>`}
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

    const renderContent = () => {
        switch (activeSetting) {
            case 'users': {
                const type = 'users';
                const showFilters = showTableHeaderFilters && users.length >= minRecordsForFilters;
                return html`
                    <div class="settings-section">
                        <div class="settings-header">
                            <h3>Users</h3>
                            <div class="header-actions">
                                <div class="search-input-container">
                                    ${icons.search}
                                    <input type="search" class="search-input" placeholder="Search Users..." value=${searchQueries[type]} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                                </div>
                                <div class="dropdown-container">
                                    <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                                    ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${userColumnConfig} visibleColumns=${userVisibleCols} setVisibleColumns=${setUserVisibleCols} onReset=${onResetUsers} />`}
                                </div>
                                ${renderImportExportDropdown(type)}
                            </div>
                        </div>
                        <${Table}
                            type=${type}
                            data=${users}
                            visibleCols=${userVisibleCols}
                            columnConfig=${userColumnConfig}
                            columnOrder=${userColumnOrder}
                            setColumnOrder=${setUserColumnOrder}
                            dndHandlers=${dndHandlers}
                            draggedCol=${draggedCol}
                            dragOverCol=${dragOverCol}
                            sortConfig=${sortConfig}
                            handleSort=${handleSort}
                            showFilters=${showFilters}
                            advancedFilters=${advancedFilters}
                            openFilterPopover=${openFilterPopover}
                            setOpenFilterPopover=${setOpenFilterPopover}
                            handleApplyFilter=${handleApplyFilter}
                            handleClearFilter=${handleClearFilter}
                            paginationConfig=${pagination[type]}
                            handlePageChange=${handlePageChange}
                        />
                    </div>
                `;
            }
            case 'groups': {
                const type = 'userGroups';
                const showFilters = showTableHeaderFilters && userGroups.length >= minRecordsForFilters;
                return html`
                     <div class="settings-section">
                        <div class="settings-header">
                            <h3>User Groups</h3>
                            <div class="header-actions">
                                <div class="search-input-container">
                                    ${icons.search}
                                    <input type="search" class="search-input" placeholder="Search User Groups..." value=${searchQueries[type]} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                                </div>
                                <div class="dropdown-container">
                                    <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                                    ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${userGroupColumnConfig} visibleColumns=${userGroupVisibleCols} setVisibleColumns=${setUserGroupVisibleCols} onReset=${onResetUserGroups} />`}
                                </div>
                                ${renderImportExportDropdown(type)}
                            </div>
                        </div>
                        <${Table}
                            type=${type}
                            data=${userGroups}
                            visibleCols=${userGroupVisibleCols}
                            columnConfig=${userGroupColumnConfig}
                            columnOrder=${userGroupColumnOrder}
                            setColumnOrder=${setUserGroupColumnOrder}
                            dndHandlers=${dndHandlers}
                            draggedCol=${draggedCol}
                            dragOverCol=${dragOverCol}
                            sortConfig=${sortConfig}
                            handleSort=${handleSort}
                            showFilters=${showFilters}
                            advancedFilters=${advancedFilters}
                            openFilterPopover=${openFilterPopover}
                            setOpenFilterPopover=${setOpenFilterPopover}
                            handleApplyFilter=${handleApplyFilter}
                            handleClearFilter=${handleClearFilter}
                            paginationConfig=${pagination[type]}
                            handlePageChange=${handlePageChange}
                        />
                    </div>
                `;
            }
            case 'addresses': {
                const type = 'addresses';
                const showFilters = showTableHeaderFilters && filteredAddresses.length >= minRecordsForFilters;
                 return html`
                     <div class="settings-section">
                        <div class="settings-header">
                            <h3>Addresses</h3>
                            <div class="header-actions">
                                <div class="search-input-container">
                                    ${icons.search}
                                    <input type="search" class="search-input" placeholder="Search Addresses..." value=${searchQueries[type]} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                                </div>
                                <div class="dropdown-container">
                                    <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                                    ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${addressEnumColumnConfig} visibleColumns=${addressEnumVisibleCols} setVisibleColumns=${setAddressEnumVisibleCols} onReset=${onResetAddressEnumCols} />`}
                                </div>
                                ${renderEnumImportExportDropdown(type)}
                            </div>
                        </div>
                        <${Table}
                            type=${type}
                            data=${filteredAddresses}
                            visibleCols=${addressEnumVisibleCols}
                            columnConfig=${addressEnumColumnConfig}
                            columnOrder=${addressEnumColumnOrder}
                            setColumnOrder=${setAddressEnumColumnOrder}
                            dndHandlers=${dndHandlers}
                            draggedCol=${draggedCol}
                            dragOverCol=${dragOverCol}
                            sortConfig=${sortConfig}
                            handleSort=${handleSort}
                            showFilters=${showFilters}
                            advancedFilters=${advancedFilters}
                            openFilterPopover=${openFilterPopover}
                            setOpenFilterPopover=${setOpenFilterPopover}
                            handleApplyFilter=${handleApplyFilter}
                            handleClearFilter=${handleClearFilter}
                            paginationConfig=${pagination[type]}
                            handlePageChange=${handlePageChange}
                        />
                    </div>
                `;
            }
            case 'templatesList': {
                const type = 'deviceTemplates';
                const showFilters = showTableHeaderFilters && filteredDeviceTemplates.length >= minRecordsForFilters;
                return html`
                     <div class="settings-section">
                        <div class="settings-header">
                            <h3>Device Templates</h3>
                            <div class="header-actions">
                                <div class="search-input-container">
                                    ${icons.search}
                                    <input type="search" class="search-input" placeholder="Search Templates..." value=${searchQueries[type]} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                                </div>
                                <div class="dropdown-container">
                                    <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                                    ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${deviceTemplateColumnConfig} visibleColumns=${deviceTemplateVisibleCols} setVisibleColumns=${setDeviceTemplateVisibleCols} onReset=${onResetDeviceTemplateCols} />`}
                                </div>
                                <button class="btn btn-primary" onClick=${() => setModal({ type: 'deviceTemplate' })}>Add</button>
                            </div>
                        </div>
                        <${Table}
                            type=${type}
                            data=${filteredDeviceTemplates}
                            visibleCols=${deviceTemplateVisibleCols}
                            columnConfig=${deviceTemplateColumnConfig}
                            columnOrder=${deviceTemplateColumnOrder}
                            setColumnOrder=${setDeviceTemplateColumnOrder}
                            dndHandlers=${dndHandlers}
                            draggedCol=${draggedCol}
                            dragOverCol=${dragOverCol}
                            sortConfig=${sortConfig}
                            handleSort=${handleSort}
                            showFilters=${showFilters}
                            advancedFilters=${advancedFilters}
                            openFilterPopover=${openFilterPopover}
                            setOpenFilterPopover=${setOpenFilterPopover}
                            handleApplyFilter=${handleApplyFilter}
                            handleClearFilter=${handleClearFilter}
                            paginationConfig=${pagination[type]}
                            handlePageChange=${handlePageChange}
                        />
                    </div>
                `;
            }
            case 'sitesAndRacks':
                return html`<${SitesAndRacksSettings} ...${props} />`;
            case 'uiSettings':
                return html`<${UISettings} 
                    isSidebarAutohide=${isSidebarAutohide} 
                    onToggleSidebarAutohide=${setSidebarAutohide}
                    toastOpacity=${toastOpacity}
                    onSetToastOpacity=${setToastOpacity}
                    theme=${theme}
                    onThemeChange=${setTheme}
                    toastPosition=${toastPosition}
                    onToastPositionChange=${setToastPosition}
                    toastTextColor=${toastTextColor}
                    onSetToastTextColor=${setToastTextColor}
                    isGlossy=${isGlossy}
                    onToggleGlossy=${setGlossy}
                    showTableHeaderFilters=${showTableHeaderFilters}
                    onToggleShowTableHeaderFilters=${setShowTableHeaderFilters}
                    minRecordsForFilters=${minRecordsForFilters}
                    onSetMinRecordsForFilters=${setMinRecordsForFilters}
                    rowsPerPage=${rowsPerPage}
                    onSetRowsPerPage=${setRowsPerPage}
                    defaultPlanDuration=${defaultPlanDuration}
                    onSetDefaultPlanDuration=${setDefaultPlanDuration}
                    appName=${appName}
                    onAppNameChange=${setAppName}
                />`;
            case 'moduleSettings':
                return html`<${ModuleSettings}
                    moduleVisibility=${moduleVisibility}
                    onModuleVisibilityChange=${setModuleVisibility}
                />`;
            case 'integrationModules':
                return html`<${IntegrationSettings} zabbixSettings=${zabbixSettings} setZabbixSettings=${setZabbixSettings} />`;
            case 'l2vpnSettings':
                return html`<${L2VpnSettings}
                    enumerations=${enumerations}
                    renderEnumImportExportDropdown=${renderEnumImportExportDropdown}
                    setModal=${setModal}
                    toggleEnumDeletedStatus=${toggleEnumDeletedStatus}
                />`;
            case 'l3vpnSettings':
                return html`<${L3VpnSettings}
                    enumerations=${enumerations}
                    renderEnumImportExportDropdown=${renderEnumImportExportDropdown}
                    setModal=${setModal}
                    toggleEnumDeletedStatus=${toggleEnumDeletedStatus}
                />`;
            default:
                if (settingsMenu.flatMap(m => m.items).some(i => i.key === activeSetting)) {
                    return renderSimpleEnumTable(activeSetting, activeEnumLabel);
                }
                return null;
        }
    };

    return html`
        <div class="content-header">
            <h2>Settings</h2>
        </div>
        <div class="settings-layout">
            <nav class="settings-nav">
                <ul>
                    ${settingsMenu.map(category => html`
                        <li class="settings-nav-category">
                            <button class="settings-nav-group" onClick=${() => handleCategoryClick(category.key)} aria-expanded=${expandedCategory === category.key}>
                                <div class="group-label">
                                    ${category.icon}
                                    <span>${category.label}</span>
                                </div>
                                <span class="chevron ${expandedCategory === category.key ? 'expanded' : ''}">${icons.chevron}</span>
                            </button>
                            ${expandedCategory === category.key && html`
                                <ul class="settings-nav-submenu">
                                    ${category.items.map(item => html`
                                        <li>
                                            <button 
                                                class=${`settings-nav-item ${activeSetting === item.key ? 'active' : ''}`} 
                                                onClick=${() => setActiveSetting(item.key as ActiveSetting)}>
                                                ${item.label}
                                            </button>
                                        </li>
                                    `)}
                                </ul>
                            `}
                        </li>
                    `)}
                </ul>
            </nav>
            <div class="settings-content">
                ${renderContent()}
            </div>
        </div>
    `;
};