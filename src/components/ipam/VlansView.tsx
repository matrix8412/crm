import { html } from 'htm/preact';
import { useState } from 'preact/hooks';
import { icons } from '../../constants/icons';
import { ColumnToggleDropdown } from '../ColumnToggleDropdown';
import { Table } from '../Table';

export const VlansView = (props) => {
    const {
        vlans, vlanDomains,
        vlanColumnConfig, vlanDomainColumnConfig,
        searchQueries, handleSearch, pagination, handlePageChange,
        sortConfig, handleSort, advancedFilters, openFilterPopover,
        setOpenFilterPopover, handleApplyFilter, handleClearFilter,
        showTableHeaderFilters, minRecordsForFilters,
        vlanColumnOrder, setVlanColumnOrder, vlanVisibleCols, setVlanVisibleCols, handleResetVlanCols,
        vlanDomainColumnOrder, setVlanDomainColumnOrder, vlanDomainVisibleCols, setVlanDomainVisibleCols, handleResetVlanDomainCols,
        openDropdown, setOpenDropdown, draggedCol, dndHandlers, dragOverCol,
        renderImportExportDropdown,
    } = props;

    const [activeSubTab, setActiveSubTab] = useState('vlans');

    const renderVlansTable = () => {
        const type = 'vlans';
        const showFilters = showTableHeaderFilters && vlans.length >= minRecordsForFilters;
        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>VLANs</h3>
                    <div class="header-actions">
                        <div class="search-input-container">
                            ${icons.search}
                            <input type="search" class="search-input" placeholder="Search VLANs..." value=${searchQueries.vlans} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                        </div>
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${vlanColumnConfig} visibleColumns=${vlanVisibleCols} setVisibleColumns=${setVlanVisibleCols} onReset=${handleResetVlanCols} />`}
                        </div>
                        ${renderImportExportDropdown(type)}
                    </div>
                </div>
                <${Table}
                    type=${type}
                    data=${vlans}
                    visibleCols=${vlanVisibleCols}
                    columnConfig=${vlanColumnConfig}
                    columnOrder=${vlanColumnOrder}
                    setColumnOrder=${setVlanColumnOrder}
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
                    paginationConfig=${pagination.vlans}
                    handlePageChange=${handlePageChange}
                />
            </div>
        `;
    };

    const renderDomainsTable = () => {
        const type = 'vlanDomains';
        const showFilters = showTableHeaderFilters && vlanDomains.length >= minRecordsForFilters;
        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>VLAN Domains</h3>
                    <div class="header-actions">
                        <div class="search-input-container">
                            ${icons.search}
                            <input type="search" class="search-input" placeholder="Search VLAN Domains..." value=${searchQueries.vlanDomains} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                        </div>
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${vlanDomainColumnConfig} visibleColumns=${vlanDomainVisibleCols} setVisibleColumns=${setVlanDomainVisibleCols} onReset=${handleResetVlanDomainCols} />`}
                        </div>
                        ${renderImportExportDropdown(type)}
                    </div>
                </div>
                <${Table}
                    type=${type}
                    data=${vlanDomains}
                    visibleCols=${vlanDomainVisibleCols}
                    columnConfig=${vlanDomainColumnConfig}
                    columnOrder=${vlanDomainColumnOrder}
                    setColumnOrder=${setVlanDomainColumnOrder}
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
                    paginationConfig=${pagination.vlanDomains}
                    handlePageChange=${handlePageChange}
                />
            </div>
        `;
    };

    const renderContent = () => {
        if (activeSubTab === 'vlans') return renderVlansTable();
        if (activeSubTab === 'domains') return renderDomainsTable();
        return null;
    }

    return html`
        <div class="vlans-view-container">
            <div class="content-header">
                <h2>VLAN Management</h2>
            </div>
            <div class="dashboard-tabs" style="border-bottom: 2px solid var(--border-color);">
                <button 
                    class="dashboard-tab ${activeSubTab === 'vlans' ? 'active' : ''}"
                    onClick=${() => setActiveSubTab('vlans')}
                >
                    VLANs
                </button>
                <button 
                    class="dashboard-tab ${activeSubTab === 'domains' ? 'active' : ''}"
                    onClick=${() => setActiveSubTab('domains')}
                >
                    VLAN Domains
                </button>
            </div>
             <div style="padding-top: 1.5rem;">
                ${renderContent()}
            </div>
        </div>
    `;
};