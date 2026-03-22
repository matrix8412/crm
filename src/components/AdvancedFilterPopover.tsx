import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { icons } from '../constants/icons';

export const AdvancedFilterPopover = ({ filter, onApply, onClear, columnName, filterType = 'text', filterOptions = [] }) => {
    const [value, setValue] = useState(filter?.value || '');
    const [operator, setOperator] = useState(filter?.operator || (filterType === 'select' ? 'equals' : 'contains'));

    const textOperators = [
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Does not contain' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'equals', label: 'Is equal to' },
        { value: 'notEquals', label: 'Is not equal to' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
    ];

    const selectOperators = [
        { value: 'equals', label: 'Is' },
        { value: 'notEquals', label: 'Is not' },
        { value: 'isEmpty', label: 'Is not set' },
        { value: 'isNotEmpty', label: 'Is set' },
    ];

    const operators = filterType === 'select' ? selectOperators : textOperators;
    const isValueDisabled = operator === 'isEmpty' || operator === 'isNotEmpty';

    useEffect(() => {
        if (isValueDisabled) {
            setValue('');
        }
    }, [operator, isValueDisabled]);

    // When switching to select, if operator is not valid for select, reset it
    useEffect(() => {
        if (filterType === 'select' && !selectOperators.some(op => op.value === operator)) {
            setOperator('equals');
        }
    }, [filterType, operator]);

    const handleApply = (e) => {
        e.preventDefault();
        onApply({ value, operator });
    };

    const handleClear = () => {
        setValue('');
        setOperator(filterType === 'select' ? 'equals' : 'contains');
        onClear();
    };

    return html`
        <div class="advanced-filter-popover" onClick=${(e) => e.stopPropagation()}>
            <div class="popover-header">
                <h5>${columnName}</h5>
                <button type="button" class="btn-subtle" onClick=${handleClear} title="Clear filter">
                    ${icons.close}
                </button>
            </div>
            <form onSubmit=${handleApply}>
                <div class="popover-body">
                    <div class="form-group">
                        <label for="filter-operator">Condition</label>
                        <select id="filter-operator" value=${operator} onChange=${e => setOperator(e.currentTarget.value)}>
                            ${operators.map(op => html`<option value=${op.value}>${op.label}</option>`)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="filter-value">Value</label>
                         ${filterType === 'select' ? html`
                            <select 
                                id="filter-value"
                                value=${value}
                                onChange=${e => setValue(e.currentTarget.value)}
                                disabled=${isValueDisabled}
                            >
                                <option value="">-- Select an option --</option>
                                ${filterOptions.map(opt => html`<option value=${opt.value}>${opt.label}</option>`)}
                            </select>
                         ` : html`
                            <input 
                                id="filter-value"
                                type="text" 
                                value=${value} 
                                onInput=${e => setValue(e.currentTarget.value)}
                                disabled=${isValueDisabled}
                                placeholder=${isValueDisabled ? 'Not applicable' : 'Enter value...'}
                                autofocus
                            />
                         `}
                    </div>
                </div>
                <div class="popover-footer">
                    <button type="submit" class="btn btn-primary" style=${{width: '100%'}}>Apply Filter</button>
                </div>
            </form>
        </div>
    `;
};