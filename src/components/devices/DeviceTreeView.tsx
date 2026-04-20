


import { html } from 'htm/preact';
import { useMemo, useState } from 'preact/hooks';
import { TreeNode } from './TreeNode';
import { icons } from '../../constants/icons';
import type { NetworkDevice } from '../../types';

interface DeviceTreeNode extends NetworkDevice {
    children: DeviceTreeNode[];
}

const buildTree = (devices: NetworkDevice[]): DeviceTreeNode[] => {
    const tree: DeviceTreeNode[] = [];
    const deviceMap = new Map<string, DeviceTreeNode>(devices.map(d => [d.id, { ...d, children: [] }]));

    devices.forEach(device => {
        const deviceNode = deviceMap.get(device.id);
        if (device.parentDevice && deviceMap.has(device.parentDevice)) {
            const parentNode = deviceMap.get(device.parentDevice);
            if (parentNode && deviceNode) {
                parentNode.children.push(deviceNode);
            }
        } else if (deviceNode) {
            tree.push(deviceNode);
        }
    });

    return tree;
};

const filterTree = (nodes: DeviceTreeNode[], searchTerm: string): DeviceTreeNode[] => {
    if (!searchTerm) return nodes;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const filter = (nodesToFilter: DeviceTreeNode[]): DeviceTreeNode[] => {
        return nodesToFilter.reduce((acc: DeviceTreeNode[], node) => {
            const children = filter(node.children || []);
            const nameMatch = node.name && node.name.toLowerCase().includes(lowerSearchTerm);
            const ipMatch = node.ipAddress && node.ipAddress.toLowerCase().includes(lowerSearchTerm);
            
            if (nameMatch || ipMatch || children.length > 0) {
                acc.push({ ...node, children });
            }
            return acc;
        }, []);
    };
    
    return filter(nodes);
};

export const DeviceTreeView = ({ devices, deviceMap, enumMaps, setModal, toggleDeleteStatus, addToast, openRowActionDropdown, setOpenRowActionDropdown }) => {
    const [expandedNodes, setExpandedNodes] = useState(new Set<string>());
    const [searchTerm, setSearchTerm] = useState('');

    const deviceTree = useMemo(() => buildTree(devices), [devices]);
    const filteredDeviceTree: DeviceTreeNode[] = useMemo(() => filterTree(deviceTree, searchTerm), [deviceTree, searchTerm]);
    
    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };
    
    // Expand all nodes when searching to reveal matches
    useEffect(() => {
        if (searchTerm) {
            const allNodeIds = new Set<string>();
            const collectIds = (nodes: DeviceTreeNode[]) => {
                nodes.forEach(node => {
                    if (node.children.length > 0) {
                        allNodeIds.add(node.id);
                        collectIds(node.children);
                    }
                });
            };
            collectIds(filteredDeviceTree);
            setExpandedNodes(allNodeIds);
        }
    }, [searchTerm, filteredDeviceTree]);


    return html`
        <div class="device-tree-container">
            <div class="tree-search-bar">
                 <div class="search-input-container">
                    ${icons.search}
                    <input 
                        type="search" 
                        class="search-input" 
                        placeholder="Search tree by name or IP..."
                        value=${searchTerm}
                        onInput=${e => setSearchTerm(e.currentTarget.value)}
                    />
                </div>
            </div>
            <ul class="device-tree">
                ${filteredDeviceTree.map(node => html`
                    <${TreeNode} 
                        key=${node.id} 
                        node=${node} 
                        level=${0} 
                        expandedNodes=${expandedNodes} 
                        onToggle=${toggleNode}
                        setModal=${setModal}
                        toggleDeleteStatus=${toggleDeleteStatus}
                        addToast=${addToast}
                        openRowActionDropdown=${openRowActionDropdown}
                        setOpenRowActionDropdown=${setOpenRowActionDropdown}
                    />
                `)}
                ${filteredDeviceTree.length === 0 && html`
                    <li class="no-results-message" style="padding: 2rem;">No devices found.</li>
                `}
            </ul>
        </div>
    `;
};