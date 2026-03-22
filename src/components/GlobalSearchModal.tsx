import { html } from 'htm/preact';
import { icons } from '../constants/icons';
import { useMemo } from 'preact/hooks';

const ResultItem = ({ item, type, onClick, customerMap, deviceMap, companyLegalFormId }) => {
    let title, subtitle;
    switch (type) {
        case 'customers':
            const isCompany = item.legalForm === companyLegalFormId;
            title = isCompany && item.companyName ? item.companyName : `${item.firstName} ${item.lastName}`;
            subtitle = item.email;
            break;
        case 'devices':
            title = item.name;
            subtitle = item.ipAddress;
            break;
        case 'plans':
            const customer = customerMap.get(item.customerId);
            const device = deviceMap.get(item.deviceId);
            title = item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '');
            
            let subtitleParts = [];
            if(customer) {
                const isCustomerCompany = customer.legalForm === companyLegalFormId;
                const displayName = isCustomerCompany && customer.companyName ? customer.companyName : `${customer.firstName} ${customer.lastName}`;
                subtitleParts.push(`for ${displayName}`);
            }
            if(device) subtitleParts.push(`at ${device.name}`);
            
            subtitle = 'Plan ' + subtitleParts.join(' ');
            if (subtitleParts.length === 0) {
                subtitle = 'Unassigned Plan';
            }
            break;
        default:
            return null;
    }

    return html`
        <li class="result-item" onClick=${() => onClick(type, item)}>
            <div class="result-item-info">
                <strong>${title}</strong>
                <span>${subtitle}</span>
            </div>
            <div class="result-item-action">${icons.arrowRight}</div>
        </li>
    `;
};

export const GlobalSearchModal = ({ query, results, onClose, onResultClick, customerMap, deviceMap, enumerations }) => {
    const hasResults = results && (results.customers.length > 0 || results.devices.length > 0 || results.plans.length > 0);

    const companyLegalFormId = useMemo(() => {
        return enumerations?.legalForm.find(form => form.label.toLowerCase() === 'company')?.id;
    }, [enumerations]);

    return html`
        <div class="modal-overlay" onClick=${onClose}>
            <div class="search-results-modal-content" onClick=${e => e.stopPropagation()}>
                <div class="search-results-header">
                    Search results for: <span>"${query}"</span>
                </div>
                <div class="search-results-body">
                    ${!results ? html`
                        <div class="no-results-message">
                            Type to start searching...
                        </div>
                    ` : hasResults ? html`
                        ${results.customers.length > 0 && html`
                            <div class="result-group">
                                <div class="result-group-header">Customers (${results.customers.length})</div>
                                <ul class="result-list">
                                    ${results.customers.map(item => html`
                                        <${ResultItem} item=${item} type="customers" onClick=${onResultClick} companyLegalFormId=${companyLegalFormId} />
                                    `)}
                                </ul>
                            </div>
                        `}
                        ${results.devices.length > 0 && html`
                            <div class="result-group">
                                <div class="result-group-header">Devices (${results.devices.length})</div>
                                <ul class="result-list">
                                     ${results.devices.map(item => html`
                                        <${ResultItem} item=${item} type="devices" onClick=${onResultClick} />
                                    `)}
                                </ul>
                            </div>
                        `}
                        ${results.plans.length > 0 && html`
                            <div class="result-group">
                                <div class="result-group-header">Plans (${results.plans.length})</div>
                                <ul class="result-list">
                                     ${results.plans.map(item => html`
                                        <${ResultItem} item=${item} type="plans" onClick=${onResultClick} customerMap=${customerMap} deviceMap=${deviceMap} companyLegalFormId=${companyLegalFormId} />
                                    `)}
                                </ul>
                            </div>
                        `}
                    ` : html`
                        <div class="no-results-message">
                            No results found. Try a different search term.
                        </div>
                    `}
                </div>
                 <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onClick=${onClose}>Close</button>
                </div>
            </div>
        </div>
    `;
};