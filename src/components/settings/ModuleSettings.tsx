

import { html } from 'htm/preact';

interface ModuleSettingsProps {
    moduleVisibility: {
        customers: boolean;
        devices: boolean;
        planning: boolean;
        invoicing: boolean;
        warehouse: boolean;
        tools: boolean;
        ipam: boolean;
    };
    onModuleVisibilityChange: (updater: (prev: any) => any) => void;
}

const modules = [
    { key: 'customers', name: 'Customers', description: 'Enable or disable the Customers module in the main navigation.' },
    { key: 'devices', name: 'Devices', description: 'Enable or disable the Devices module in the main navigation.' },
    { key: 'planning', name: 'Planning', description: 'Enable or disable the Planning module in the main navigation.' },
    { key: 'ipam', name: 'IPAM', description: 'Enable or disable the IP Address Management module.' },
    { key: 'invoicing', name: 'Invoicing', description: 'Enable or disable the Invoicing module in the main navigation.' },
    { key: 'warehouse', name: 'Warehouse', description: 'Enable or disable the Warehouse module in the main navigation.' },
    { key: 'tools', name: 'Tools', description: 'Enable or disable the Tools menu, including calculators, in the main navigation.' },
];

export const ModuleSettings = ({ moduleVisibility, onModuleVisibilityChange }: ModuleSettingsProps) => {
    
    const handleToggle = (key: string, checked: boolean) => {
        onModuleVisibilityChange(prev => ({
            ...prev,
            [key]: checked,
        }));
    };

    return html`
        <div class="settings-section">
            <div class="settings-header">
                <h3>Modules</h3>
            </div>
            <div class="ui-settings-content">
                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Module Visibility</strong>
                        <p>Toggle top-level modules on and off in the application sidebar.</p>
                    </div>
                </div>
                ${modules.map(module => {
                    const isCustomersModule = module.key === 'customers';
                    return html`
                        <div class="ui-setting-item">
                            <div class="ui-setting-item-label">
                                <strong>${module.name} ${isCustomersModule && html`<span style=${{ fontSize: '0.8rem', color: 'var(--subtle-font-color)', marginLeft: '0.5rem' }}>(Core Module)</span>`}</strong>
                                <p>${module.description}</p>
                            </div>
                            <div class="ui-setting-item-control">
                                <label class="switch" title=${isCustomersModule ? "The Customers module is a core feature and cannot be disabled." : ""}>
                                    <input 
                                        type="checkbox" 
                                        checked=${isCustomersModule ? true : moduleVisibility[module.key] !== false} 
                                        onChange=${(e) => !isCustomersModule && handleToggle(module.key, e.currentTarget.checked)}
                                        disabled=${isCustomersModule}
                                    />
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
};