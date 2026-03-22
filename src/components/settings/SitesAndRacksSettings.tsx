
import { html } from 'htm/preact';
import { useState } from 'preact/hooks';
import { icons } from '../../constants/icons';
import { ColumnToggleDropdown } from '../ColumnToggleDropdown';
import { Table } from '../Table';

export const SitesAndRacksSettings = (props) => {
    const {
        filteredSites,
        filteredRacks,
        siteColumnConfig, rackColumnConfig,
        searchQueries, handleSearch, pagination, handlePageChange,
        sortConfig, handleSort, advancedFilters, openFilterPopover,
        setOpenFilterPopover, handleApplyFilter, handleClearFilter,
        showTableHeaderFilters, minRecordsForFilters,
        siteColumnOrder, setSiteColumnOrder, siteVisibleCols, setSiteVisibleCols, onResetSiteCols,
        rackColumnOrder, setRackColumnOrder, rackVisibleCols, setRackVisibleCols, onResetRackCols,
        openDropdown, setOpenDropdown, draggedCol, dndHandlers, dragOverCol,
        setModal,
    } = props;

    const [activeSubTab, setActiveSubTab] = useState('sites');
    
    const handleAdd = (type: string) => {
        setModal({ type });
    };

    const renderSitesTable = () => {
        const type = 'sites';
        const data = filteredSites || [];
        const showFilters = showTableHeaderFilters && data.length >= minRecordsForFilters;
        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>Sites</h3>
                    <div class="header-actions">
                        <div class="search-input-container">
                            ${icons.search}
                            <input type="search" class="search-input" placeholder="Search Sites..." value=${searchQueries.sites} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                        </div>
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${siteColumnConfig} visibleColumns=${siteVisibleCols} setVisibleColumns=${setSiteVisibleCols} onReset=${onResetSiteCols} />`}
                        </div>
                        <button class="btn btn-primary" onClick=${() => handleAdd('site')}>Add Site</button>
                    </div>
                </div>
                <${Table}
                    type=${type}
                    data=${data}
                    visibleCols=${siteVisibleCols}
                    columnConfig=${siteColumnConfig}
                    columnOrder=${siteColumnOrder}
                    setColumnOrder=${setSiteColumnOrder}
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
                    paginationConfig=${pagination.sites}
                    handlePageChange=${handlePageChange}
                />
            </div>
        `;
    };

    const renderRacksTable = () => {
        const type = 'racks';
        const data = filteredRacks || [];
        const showFilters = showTableHeaderFilters && data.length >= minRecordsForFilters;
        return html`
            <div class="settings-section">
                <div class="settings-header">
                    <h3>Racks</h3>
                    <div class="header-actions">
                        <div class="search-input-container">
                            ${icons.search}
                            <input type="search" class="search-input" placeholder="Search Racks..." value=${searchQueries.racks} onInput=${e => handleSearch(type, e.currentTarget.value)} />
                        </div>
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === type ? null : type)} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === type && html`<${ColumnToggleDropdown} columnConfig=${rackColumnConfig} visibleColumns=${rackVisibleCols} setVisibleColumns=${setRackVisibleCols} onReset=${onResetRackCols} />`}
                        </div>
                        <button class="btn btn-primary" onClick=${() => handleAdd('rack')}>Add Rack</button>
                    </div>
                </div>
                <${Table}
                    type=${type}
                    data=${data}
                    visibleCols=${rackVisibleCols}
                    columnConfig=${rackColumnConfig}
                    columnOrder=${rackColumnOrder}
                    setColumnOrder=${setRackColumnOrder}
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
                    paginationConfig=${pagination.racks}
                    handlePageChange=${handlePageChange}
                />
            </div>
        `;
    };
    
    const renderContent = () => {
        if (activeSubTab === 'sites') return renderSitesTable();
        if (activeSubTab === 'racks') return renderRacksTable();
        return null;
    }

    return html`
        <div class="vlans-view-container">
            <div class="dashboard-tabs" style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color);">
                <button 
                    class="dashboard-tab ${activeSubTab === 'sites' ? 'active' : ''}"
                    onClick=${() => setActiveSubTab('sites')}
                >
                    Sites
                </button>
                <button 
                    class="dashboard-tab ${activeSubTab === 'racks' ? 'active' : ''}"
                    onClick=${() => setActiveSubTab('racks')}
                >
                    Racks
                </button>
            </div>
             <div>
                ${renderContent()}
            </div>
        </div>
    `;
};