import { html } from 'htm/preact';
import { icons } from '../constants/icons';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return html`
        <div class="pagination-container">
            <button
                class="btn btn-secondary btn-icon"
                onClick=${() => onPageChange(currentPage - 1)}
                disabled=${currentPage === 1}
                title="Previous Page"
            >
                ${icons.chevronLeft}
            </button>
            <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
            <button
                class="btn btn-secondary btn-icon"
                onClick=${() => onPageChange(currentPage + 1)}
                disabled=${currentPage === totalPages}
                title="Next Page"
            >
                ${icons.chevronRight}
            </button>
        </div>
    `;
};