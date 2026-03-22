import { html } from 'htm/preact';
import { useState } from 'preact/hooks';
import { icons } from '../../constants/icons';
import { ColumnToggleDropdown } from '../ColumnToggleDropdown';
import { Table } from '../Table';

export const VpnView = (props) => {
    const {
        l2vpns, l3vpns,
        l2VpnColumnConfig, l3VpnColumnConfig,
        searchQueries, handleSearch, pagination, handlePageChange,
        sortConfig, handleSort, advancedFilters, openFilterPopover,
        setOpenFilterPopover, handleApplyFilter, handleClearFilter,
        showTableHeaderFilters, minRecordsForFilters,
        l2VpnColumnOrder, setL2VpnColumnOrder, l2VpnVisibleCols, setL2VpnVisibleCols, handleResetL2VpnCols,
        l3VpnColumnOrder, setL3VpnColumnOrder, l3VpnVisibleCols, setL3VpnVisibleCols, handleResetL3VpnCols,
        openDropdown, setOpenDropdown, draggedCol, dndHandlers, dragOverCol,
        renderImportExportDropdown,
    } = props;

    const [activeSubTab, setActiveSubTab] = useState('l2vpn');

    const renderL2VpnsTable = () => {
        const type = 'l2vpns';
        const showFilters = showTableHeaderFilters && l2vpns.length >= minRecordsForFilters;
        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>L2VPNs</h3>
                    <div class="header-actions">
                        <div class="search-input-container">
                            ${icons.search}
                            <input type="search" class="search-input" placeholder="Search L2VPNs..." value=${searchQueries.l2vpns} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                        </div>
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${l2VpnColumnConfig} visibleColumns=${l2VpnVisibleCols} setVisibleColumns=${setL2VpnVisibleCols} onReset=${handleResetL2VpnCols} />`}
                        </div>
                        ${renderImportExportDropdown(type)}
                    </div>
                </div>
                <${Table}
                    type=${type}
                    data=${l2vpns}
                    visibleCols=${l2VpnVisibleCols}
                    columnConfig=${l2VpnColumnConfig}
                    columnOrder=${l2VpnColumnOrder}
                    setColumnOrder=${setL2VpnColumnOrder}
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
                    paginationConfig=${pagination.l2vpns}
                    handlePageChange=${handlePageChange}
                />
            </div>
        `;
    };

    const renderL3VpnsTable = () => {
        const type = 'l3vpns';
        const showFilters = showTableHeaderFilters && l3vpns.length >= minRecordsForFilters;
        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>L3VPNs</h3>
                    <div class="header-actions">
                        <div class="search-input-container">
                            ${icons.search}
                            <input type="search" class="search-input" placeholder="Search L3VPNs..." value=${searchQueries.l3vpns} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                        </div>
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${l3VpnColumnConfig} visibleColumns=${l3VpnVisibleCols} setVisibleColumns=${setL3VpnVisibleCols} onReset=${handleResetL3VpnCols} />`}
                        </div>
                        ${renderImportExportDropdown(type)}
                    </div>
                </div>
                <${Table}
                    type=${type}
                    data=${l3vpns}
                    visibleCols=${l3VpnVisibleCols}
                    columnConfig=${l3VpnColumnConfig}
                    columnOrder=${l3VpnColumnOrder}
                    setColumnOrder=${setL3VpnColumnOrder}
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
                    paginationConfig=${pagination.l3vpns}
                    handlePageChange=${handlePageChange}
                />
            </div>
        `;
    };
    
    const renderContent = () => {
        if (activeSubTab === 'l2vpn') return renderL2VpnsTable();
        if (activeSubTab === 'l3vpn') return renderL3VpnsTable();
        return null;
    }

    return html`
        <div class="vpn-view-container">
            <div class="content-header">
                <h2>VPN Management</h2>
            </div>
            <div class="dashboard-tabs" style="border-bottom: 2px solid var(--border-color);">
                <button 
                    class="dashboard-tab ${activeSubTab === 'l2vpn' ? 'active' : ''}"
                    onClick=${() => setActiveSubTab('l2vpn')}
                >
                    L2VPN
                </button>
                <button 
                    class="dashboard-tab ${activeSubTab === 'l3vpn' ? 'active' : ''}"
                    onClick=${() => setActiveSubTab('l3vpn')}
                >
                    L3VPN
                </button>
            </div>
             <div style="padding-top: 1.5rem;">
                ${renderContent()}
            </div>
        </div>
    `;
};