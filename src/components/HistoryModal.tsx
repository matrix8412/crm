
import { html } from 'htm/preact';
import { useState, useMemo } from 'preact/hooks';
import type { AuditLogEntry, AuditLogChange } from '../types';
import { icons } from '../constants/icons';

const ENUM_FIELDS_SET = new Set(['vendor', 'legalForm', 'deviceGroup', 'deviceType', 'planCategory', 'reportingMethod', 'planPriority', 'groupId']);
const REFERENCE_FIELDS = {
    parentDevice: 'devices', // fieldName: mapName in valueMaps
    deviceId: 'devices',
    customerId: 'customers',
    addressId: 'addresses',
};


const getSourceText = (source?: 'form' | 'import' | 'system') => {
    if (!source || source === 'form') return 'via Form';
    if (source === 'import') return 'via Import';
    if (source === 'system') return 'by System';
    return `via ${source}`;
};

const getResolvedValue = (field: string, value: string, maps: { [key: string]: Map<string, any> }) => {
    if (!value || value === '""' || value === 'null') return 'Not Set';

    if (ENUM_FIELDS_SET.has(field)) {
        const mapKey = field === 'groupId' ? 'userGroups' : field;
        if (maps[mapKey]) {
            const mappedValue = maps[mapKey].get(value);
            // Mapped value can be an object with a label, or just a string
            if (typeof mappedValue === 'object' && mappedValue !== null && 'label' in mappedValue) {
                return mappedValue.label;
            }
            if (mappedValue) {
                return String(mappedValue);
            }
        }
    }

    if (REFERENCE_FIELDS[field]) {
        const mapKey = REFERENCE_FIELDS[field];
        if (maps[mapKey]) {
            const mappedValue = maps[mapKey].get(value);
            if (typeof mappedValue === 'object' && mappedValue !== null) {
                // Customer or Device object, try to find a name
                if ('name' in mappedValue) return mappedValue.name;
                if ('firstName' in mappedValue && 'lastName' in mappedValue) return `${mappedValue.firstName} ${mappedValue.lastName}`;
                if ('street' in mappedValue) return `${mappedValue.street}, ${mappedValue.city}`;
            }
            if (mappedValue) {
                return String(mappedValue);
            }
        }
    }
    
    // For boolean-like strings
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';

    return value;
};


const ChangeDetail = ({ change, maps, columnConfig }) => {
    const fieldLabel = columnConfig[change.field]?.label || change.field;
    const oldValue = getResolvedValue(change.field, change.oldValue, maps);
    const newValue = getResolvedValue(change.field, change.newValue, maps);

    return html`
        <li>
            <strong>${fieldLabel}:</strong>
            ${change.oldValue && change.newValue ? html`
                <span class="old-value">${oldValue}</span> → <span class="new-value">${newValue}</span>
            ` : change.newValue ? html`
                Set to <span class="new-value">${newValue}</span>
            ` : html`
                Unset from <span class="old-value">${oldValue}</span>
            `}
        </li>
    `;
};


export const HistoryModal = ({ entityId, entityType, allLogs, getEntityName, dataArrays, onClose, allColumnConfigs, valueMaps }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const entityLogs = useMemo(() => {
        return allLogs.filter(log => log.entityId === entityId);
    }, [allLogs, entityId]);

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return entityLogs;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return entityLogs.filter(log => {
            const searchString = JSON.stringify(log).toLowerCase();
            return searchString.includes(lowerSearchTerm);
        });
    }, [entityLogs, searchTerm]);

    const entityName = useMemo(() => {
        const dataArray = dataArrays[entityType];
        if (!dataArray) return entityId;
        const item = dataArray.find(i => i.id === entityId);
        return item ? getEntityName(entityType, item) : `History for ${entityType} #${entityId}`;
    }, [entityId, entityType, dataArrays, getEntityName]);

    const columnConfig = allColumnConfigs[entityType];

    const toggleExpand = (logId: string) => {
        setExpandedLogId(prev => (prev === logId ? null : logId));
    };

    return html`
        <div class="modal-header">
            <h3>History for ${entityName}</h3>
        </div>
        <div class="modal-body history-modal-body">
            <div class="history-search-container">
                 <div class="search-input-container">
                    ${icons.search}
                    <input
                        type="search"
                        class="search-input"
                        placeholder="Search history..."
                        value=${searchTerm}
                        onInput=${e => setSearchTerm(e.currentTarget.value)}
                    />
                </div>
            </div>
            
            ${filteredLogs.length > 0 ? html`
                <ul class="history-list">
                    ${filteredLogs.map(log => {
                        const isExpanded = expandedLogId === log.id;
                        return html`
                            <li class="history-item">
                                <div class="history-item-header" onClick=${() => toggleExpand(log.id)}>
                                    <div class="history-item-main">
                                        <span class="log-action ${log.action}">${log.action}</span>
                                        <span class="history-item-source">
                                            ${' '}- ${getSourceText(log.source)}
                                        </span>
                                    </div>
                                    <span class="history-item-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                                     <span class="header-chevron ${isExpanded ? 'expanded' : ''}">${icons.chevronRight}</span>
                                </div>
                                ${isExpanded && html`
                                    <div class="history-item-details">
                                        <ul class="change-details-list">
                                            ${log.details.map(change => html`
                                                <${ChangeDetail} change=${change} maps=${valueMaps} columnConfig=${columnConfig} />
                                            `)}
                                        </ul>
                                    </div>
                                `}
                            </li>
                        `
                    })}
                </ul>
            ` : html`
                <div class="history-no-results">
                    No history entries found${searchTerm ? ' for your search.' : '.'}
                </div>
            `}

        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>Close</button>
        </div>
    `;
};
