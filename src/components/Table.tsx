import { html } from 'htm/preact';
import { icons } from '../constants/icons';
import { Pagination } from './Pagination';
import { AdvancedFilterPopover } from './AdvancedFilterPopover';

export const Table = ({
    type,
    data,
    visibleCols,
    columnConfig,
    columnOrder,
    setColumnOrder,
    dndHandlers,
    draggedCol,
    dragOverCol,
    sortConfig,
    handleSort,
    showFilters,
    advancedFilters,
    openFilterPopover,
    setOpenFilterPopover,
    handleApplyFilter,
    handleClearFilter,
    paginationConfig,
    handlePageChange,
}) => {
    const { currentPage, rowsPerPage } = paginationConfig;
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const visibleColumnKeys = columnOrder.filter(key => visibleCols[key]);

    return html`
        <div class="table-container">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            ${visibleColumnKeys.map(colKey => {
                                const isSortable = columnConfig[colKey].sortType && !columnConfig[colKey].isAction;
                                return html`
                                    <th
                                        draggable=${!columnConfig[colKey].isAction}
                                        class=${`${draggedCol === colKey ? 'dragging-col' : ''} ${dragOverCol === colKey ? 'drag-over-col' : ''} ${isSortable ? 'th-sortable' : ''}`}
                                        onClick=${isSortable ? () => handleSort(type, colKey) : null}
                                        ondragstart=${(e) => dndHandlers.onColDragStart(e, colKey)}
                                        ondragend=${dndHandlers.onColDragEnd}
                                        ondragover=${dndHandlers.onColDragOver}
                                        ondragenter=${(e) => dndHandlers.onColDragEnter(e, colKey)}
                                        ondrop=${(e) => dndHandlers.onColDrop(e, colKey, columnOrder, setColumnOrder)}>
                                        <div class="th-inner">
                                            <span class="th-content">${columnConfig[colKey].label}</span>
                                            <div class="th-controls">
                                                ${isSortable && html`
                                                    <span class="sort-icon ${sortConfig[type]?.key === colKey ? 'active' : ''}">
                                                        ${sortConfig[type]?.key === colKey ? (sortConfig[type]?.direction === 'asc' ? icons.sortAsc : icons.sortDesc) : icons.sort}
                                                    </span>
                                                `}
                                                ${showFilters && !columnConfig[colKey].isAction && html`
                                                    <div class="filter-popover-container">
                                                        <button class="btn filter-btn ${advancedFilters[type]?.[colKey] ? 'active' : ''}" onClick=${(e) => { e.stopPropagation(); setOpenFilterPopover(prev => (prev?.view === type && prev.colKey === colKey) ? null : { view: type, colKey: colKey })}} title="Advanced Filter">${icons.filter}</button>
                                                        ${openFilterPopover?.view === type && openFilterPopover?.colKey === colKey && html`<${AdvancedFilterPopover} filter=${advancedFilters[type]?.[colKey]} onApply=${(f) => handleApplyFilter(type, colKey, f)} onClear=${() => handleClearFilter(type, colKey)} columnName=${columnConfig[colKey].label} filterType=${columnConfig[colKey].filterType} filterOptions=${columnConfig[colKey].filterOptions} />`}
                                                    </div>
                                                `}
                                            </div>
                                        </div>
                                    </th>
                                `;
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedData.length > 0 ? paginatedData.map(item => html`
                            <tr class=${item.isDeleted ? 'deleted-row' : ''}>
                                ${visibleColumnKeys.map(colKey => html`
                                    <td data-label=${columnConfig[colKey].label} class=${columnConfig[colKey].isAction ? 'actions' : ''}>
                                        ${columnConfig[colKey].render(item)}
                                    </td>
                                `)}
                            </tr>
                        `) : html`
                            <tr>
                                <td colspan=${visibleColumnKeys.length} style="text-align: center; padding: 2rem;">No items found.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
            ${totalPages > 1 && html`
                <${Pagination}
                    currentPage=${currentPage}
                    totalPages=${totalPages}
                    onPageChange=${(newPage) => handlePageChange(type, newPage)}
                />
            `}
        </div>
    `;
};