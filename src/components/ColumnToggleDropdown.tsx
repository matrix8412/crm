import { html } from 'htm/preact';
import { icons } from '../constants/icons';

export const ColumnToggleDropdown = ({ columnConfig, visibleColumns, setVisibleColumns, onReset }) => {
    const handleToggle = (colKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [colKey]: !prev[colKey]
        }));
    };

    const allColumnKeys = Object.keys(columnConfig).filter(key => !columnConfig[key].isAction);

    return html`
        <div class="column-toggle-dropdown">
            <div class="column-toggle-header">Visible Columns</div>
            <div class="column-toggle-body">
                ${allColumnKeys.map(key => html`
                    <label class="column-toggle-item">
                        <input 
                            type="checkbox" 
                            checked=${!!visibleColumns[key]} 
                            onChange=${() => handleToggle(key)} 
                        />
                        <span>${columnConfig[key].label}</span>
                    </label>
                `)}
            </div>
            ${onReset && html`
                <div class="column-toggle-footer">
                    <button class="btn btn-secondary btn-reset" onClick=${onReset}>
                        ${icons.restore} Reset to Default
                    </button>
                </div>
            `}
        </div>
    `;
};