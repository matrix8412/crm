import { html } from 'htm/preact';
import { useState, useMemo } from 'preact/hooks';
import { icons } from '../../constants/icons';
import { ColumnToggleDropdown } from '../ColumnToggleDropdown';
import { PrefixNode } from './PrefixNode';
import type { Prefix, NetworkDevice } from '../../types';
import { Table } from '../Table';

interface PrefixNodeData extends Prefix {
    children: PrefixNodeData[];
    usedIps?: NetworkDevice[];
    ipValue: number | bigint;
    cidr: number;
}

const ipv4ToLong = (ip: string): number => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;

const ipv6ToBigInt = (ip: string): bigint | null => {
    try {
        const parts = ip.split('::').map(part => part.split(':').filter(p => p.length > 0));
        if (parts.length > 2 || (parts.length === 1 && parts[0].length > 8)) {
            return null; // Invalid IPv6
        }
        
        let representation = parts.length > 1 
            ? [...parts[0], ...Array(8 - parts[0].length - parts[1].length).fill('0'), ...parts[1]] 
            : parts[0];

        if (representation.length !== 8) {
             // Handle case where '::' is not present but length is not 8 (e.g., '1:2:3')
             if (parts.length === 1 && parts[0].length < 8) {
                representation = [...parts[0], ...Array(8 - parts[0].length).fill('0')];
             } else {
                return null;
             }
        }
        
        return representation.reduce((acc, val) => (acc << 16n) | BigInt('0x' + val), 0n);
    } catch (e) {
        return null; // Error during parsing
    }
};

const buildTree = (prefixes: Prefix[], devices: NetworkDevice[]): PrefixNodeData[] => {
    if (!prefixes || prefixes.length === 0) return [];
    
    const isIPv4 = prefixes[0]?.prefix.includes('.');

    const nodes = prefixes.map(p => {
        const [ipStr, cidrStr] = p.prefix.split('/');
        return {
            ...p,
            ipValue: isIPv4 ? ipv4ToLong(ipStr) : ipv6ToBigInt(ipStr),
            cidr: parseInt(cidrStr, 10),
            children: [],
            usedIps: [],
        };
    }).filter(n => n.ipValue !== null && !isNaN(n.cidr)) as PrefixNodeData[];

    nodes.sort((a, b) => {
        if (a.ipValue < b.ipValue) return -1;
        if (a.ipValue > b.ipValue) return 1;
        return a.cidr - b.cidr;
    });

    const getNetworkAddress = (ip: number | bigint, cidr: number) => {
        if (isIPv4) {
            if (cidr < 0 || cidr > 32) return null;
            const mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
            return (ip as number) & mask;
        } else {
            if (cidr < 0 || cidr > 128) return null;
            const mask = (2n ** BigInt(128) - 1n) ^ (2n ** BigInt(128 - cidr) - 1n);
            return (ip as bigint) & mask;
        }
    };
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const rootNodeIds = new Set(nodes.map(n => n.id));

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let parent: (typeof nodes[0]) | null = null;
        
        for (let j = i - 1; j >= 0; j--) {
            const potentialParent = nodes[j];
            
            if (potentialParent.cidr < node.cidr) {
                const nodeNetworkAddress = getNetworkAddress(node.ipValue, potentialParent.cidr);
                const parentNetworkAddress = getNetworkAddress(potentialParent.ipValue, potentialParent.cidr);
                
                if (nodeNetworkAddress !== null && nodeNetworkAddress === parentNetworkAddress) {
                    parent = potentialParent;
                    break; 
                }
            }
        }

        if (parent) {
            const parentNodeFromMap = nodeMap.get(parent.id);
            if (parentNodeFromMap) {
                parentNodeFromMap.children.push(node);
                rootNodeIds.delete(node.id);
            }
        }
    }
    
    const tree = Array.from(rootNodeIds).map(id => nodeMap.get(id)!);

    // Assign used IPs to active prefixes
    const ipDevices = devices.filter(d => d.ipAddress).map(d => {
        const isDeviceIPv4 = d.ipAddress.includes('.');
        return {
            ...d,
            ipValue: isDeviceIPv4 ? ipv4ToLong(d.ipAddress) : ipv6ToBigInt(d.ipAddress),
            isIPv4: isDeviceIPv4
        };
    }).filter(d => d.ipValue !== null);

    const assignUsedIps = (nodesToProcess: PrefixNodeData[]) => {
        nodesToProcess.forEach(node => {
            if (node.status === 'active') {
                const nodeIsIPv4 = node.prefix.includes('.');
                const networkAddress = getNetworkAddress(node.ipValue, node.cidr);

                if (networkAddress !== null) {
                    if (nodeIsIPv4) {
                        const subnetSize = Math.pow(2, 32 - node.cidr);
                        const broadcastAddress = (networkAddress as number) + subnetSize - 1;
                        
                        node.usedIps = ipDevices
                            .filter(d => d.isIPv4 === nodeIsIPv4)
                            .filter(d => {
                                const dIpValue = d.ipValue as number;
                                return dIpValue >= (networkAddress as number) && dIpValue <= broadcastAddress;
                            });
                    } else { // IPv6
                        const subnetSize = 2n ** BigInt(128 - node.cidr);
                        const broadcastAddress = (networkAddress as bigint) + subnetSize - 1n;
                        
                        node.usedIps = ipDevices
                            .filter(d => d.isIPv4 === nodeIsIPv4)
                            .filter(d => {
                                const dIpValue = d.ipValue as bigint;
                                return dIpValue >= (networkAddress as bigint) && dIpValue <= broadcastAddress;
                            });
                    }
                }
            }
            if (node.children.length > 0) {
                assignUsedIps(node.children);
            }
        });
    };

    assignUsedIps(tree);
    return tree;
};


export const PrefixesView = (props) => {
    const {
        prefixes, devices, setModal, toggleDeleteStatus, prefixColumnConfig,
        prefixColumnOrder, setPrefixColumnOrder, prefixVisibleCols,
        setPrefixVisibleCols, handleResetPrefixCols, openDropdown,
        setOpenDropdown, draggedCol, dndHandlers, dragOverCol,
        pagination, handlePageChange, searchQueries, handleSearch,
        sortConfig, handleSort, advancedFilters, openFilterPopover,
        setOpenFilterPopover, handleApplyFilter, handleClearFilter,
        showTableHeaderFilters, minRecordsForFilters,
        renderImportExportDropdown,
    } = props;
    
    const [viewMode, setViewMode] = useState('table'); // table, tree
    const [ipVersion, setIpVersion] = useState('ipv4'); // ipv4, ipv6
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    const prefixesForVersion = useMemo(() => 
        prefixes.filter(p => (ipVersion === 'ipv4' ? p.prefix.includes('.') : p.prefix.includes(':'))),
        [prefixes, ipVersion]
    );

    const prefixTree = useMemo(() => buildTree(prefixesForVersion, devices), [prefixesForVersion, devices]);

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
            return newSet;
        });
    };
    
    const showFilters = showTableHeaderFilters && prefixesForVersion.length >= minRecordsForFilters;

    return html`
        <div class="prefixes-view-container">
            <div class="content-header">
                <h2>Prefixes</h2>
                <div class="header-actions">
                    <div class="search-input-container">
                        ${icons.search}
                        <input 
                            type="search" 
                            class="search-input" 
                            placeholder="Search prefixes..."
                            value=${searchQueries.prefixes}
                            onInput=${e => handleSearch('prefixes', e.currentTarget.value)}
                        />
                    </div>
                     <div class="view-toggle">
                        <button class=${ipVersion === 'ipv4' ? 'active' : ''} onClick=${() => setIpVersion('ipv4')}>IPv4</button>
                        <button class=${ipVersion === 'ipv6' ? 'active' : ''} onClick=${() => setIpVersion('ipv6')}>IPv6</button>
                    </div>
                     <div class="view-toggle">
                        <button class=${viewMode === 'table' ? 'active' : ''} onClick=${() => setViewMode('table')}>${icons.list} Table</button>
                        <button class=${viewMode === 'tree' ? 'active' : ''} onClick=${() => setViewMode('tree')}>${icons.tree} Tree</button>
                    </div>
                     ${viewMode === 'table' && html`
                        <div class="dropdown-container">
                            <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === 'prefixes' ? null : 'prefixes')} title="Toggle Columns">${icons.columns}</button>
                            ${openDropdown === 'prefixes' && html`<${ColumnToggleDropdown} columnConfig=${prefixColumnConfig} visibleColumns=${prefixVisibleCols} setVisibleColumns=${setPrefixVisibleCols} onReset=${handleResetPrefixCols} />`}
                        </div>
                    `}
                    ${viewMode === 'table' ? 
                        (renderImportExportDropdown && renderImportExportDropdown('prefixes')) : 
                        html`<button class="btn btn-primary" onClick=${() => setModal({ type: 'prefix' })}>Add</button>`
                    }
                </div>
            </div>
            
            ${viewMode === 'table' ? html`
                <${Table}
                    type="prefixes"
                    data=${prefixesForVersion}
                    visibleCols=${prefixVisibleCols}
                    columnConfig=${prefixColumnConfig}
                    columnOrder=${prefixColumnOrder}
                    setColumnOrder=${setPrefixColumnOrder}
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
                    paginationConfig=${pagination.prefixes}
                    handlePageChange=${handlePageChange}
                />
            ` : html`
                 <div class="device-tree-container">
                    <ul class="device-tree">
                        ${prefixTree.map(node => html`
                            <${PrefixNode} 
                                key=${node.id}
                                node=${node} 
                                level=${0} 
                                expandedNodes=${expandedNodes} 
                                onToggle=${toggleNode}
                                setModal=${setModal}
                                toggleDeleteStatus=${toggleDeleteStatus}
                            />
                        `)}
                        ${prefixTree.length === 0 && html`
                            <li class="no-results-message" style="padding: 2rem;">No prefixes found for this IP version.</li>
                        `}
                    </ul>
                </div>
            `}
        </div>
    `;
};