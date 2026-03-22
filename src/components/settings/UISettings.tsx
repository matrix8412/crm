import { html } from 'htm/preact';
import type { ToastPosition } from '../../contexts/ToastContext';

interface UISettingsProps {
    appName: string;
    onAppNameChange: (value: string) => void;
    isSidebarAutohide: boolean;
    onToggleSidebarAutohide: (value: boolean) => void;
    toastOpacity: number;
    onSetToastOpacity: (value: number) => void;
    theme: 'light' | 'dark' | 'system';
    onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
    toastPosition: ToastPosition;
    onToastPositionChange: (position: ToastPosition) => void;
    toastTextColor: string;
    onSetToastTextColor: (color: string) => void;
    showTableHeaderFilters: boolean;
    onToggleShowTableHeaderFilters: (value: boolean) => void;
    minRecordsForFilters: number;
    onSetMinRecordsForFilters: (value: number) => void;
    rowsPerPage: number;
    onSetRowsPerPage: (value: number) => void;
    isGlossy: boolean;
    onToggleGlossy: (value: boolean) => void;
    defaultPlanDuration: number;
    onSetDefaultPlanDuration: (value: number) => void;
}

export const UISettings = ({ 
    appName, onAppNameChange,
    isSidebarAutohide, onToggleSidebarAutohide, 
    toastOpacity, onSetToastOpacity,
    theme, onThemeChange,
    toastPosition, onToastPositionChange,
    toastTextColor, onSetToastTextColor,
    showTableHeaderFilters, onToggleShowTableHeaderFilters,
    minRecordsForFilters, onSetMinRecordsForFilters,
    rowsPerPage, onSetRowsPerPage,
    isGlossy, onToggleGlossy,
    defaultPlanDuration, onSetDefaultPlanDuration
}: UISettingsProps) => {
    
    const toastPositions: {label: string, value: ToastPosition}[] = [
        { label: 'Top Left', value: 'top-left' },
        { label: 'Top Center', value: 'top-center' },
        { label: 'Top Right', value: 'top-right' },
        { label: 'Bottom Left', value: 'bottom-left' },
        { label: 'Bottom Center', value: 'bottom-center' },
        { label: 'Bottom Right', value: 'bottom-right' },
    ];

    return html`
        <div class="settings-section">
            <div class="settings-header">
                <h3>UI Settings</h3>
            </div>
            <div class="ui-settings-content">
                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Application Name</strong>
                        <p>Set the name that appears in the sidebar header and browser tab.</p>
                    </div>
                    <div class="ui-setting-item-control">
                        <div class="form-group" style="margin: 0; width: 240px;">
                            <input
                                type="text"
                                value=${appName}
                                onInput=${(e) => onAppNameChange(e.currentTarget.value)}
                                aria-label="Application Name"
                            />
                        </div>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Appearance</strong>
                        <p>Select your preferred color theme, or follow your system's setting.</p>
                    </div>
                    <div class="ui-setting-item-control">
                        <div class="segmented-control-group">
                            <button
                                class=${theme === 'light' ? 'active' : ''}
                                onClick=${() => onThemeChange('light')}
                                aria-pressed=${theme === 'light'}
                            >
                                Light
                            </button>
                            <button
                                class=${theme === 'dark' ? 'active' : ''}
                                onClick=${() => onThemeChange('dark')}
                                aria-pressed=${theme === 'dark'}
                            >
                                Dark
                            </button>
                            <button
                                class=${theme === 'system' ? 'active' : ''}
                                onClick=${() => onThemeChange('system')}
                                aria-pressed=${theme === 'system'}
                            >
                                System
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Glossy Mode</strong>
                        <p>Enable a glossy, more dimensional interface design.</p>
                    </div>
                    <div class="ui-setting-item-control">
                        <label class="switch">
                            <input 
                                type="checkbox" 
                                checked=${isGlossy} 
                                onChange=${(e) => onToggleGlossy(e.currentTarget.checked)}
                            />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Notification Position</strong>
                        <p>Choose where toast notifications appear on the screen.</p>
                    </div>
                    <div class="ui-setting-item-control">
                         <div class="segmented-control-group position-control">
                            ${toastPositions.map(pos => html`
                                <button
                                    class=${toastPosition === pos.value ? 'active' : ''}
                                    onClick=${() => onToastPositionChange(pos.value)}
                                    aria-pressed=${toastPosition === pos.value}
                                >
                                    ${pos.label}
                                </button>
                            `)}
                        </div>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Toast Notification Opacity</strong>
                        <p>Adjust the transparency of toast notifications.</p>
                    </div>
                    <div class="ui-setting-item-control range-control">
                        <input
                            type="range"
                            min="0.2"
                            max="1"
                            step="0.05"
                            value=${toastOpacity}
                            onInput=${(e) => onSetToastOpacity(parseFloat(e.currentTarget.value))}
                            aria-label="Toast notification opacity"
                        />
                        <span>${Math.round(toastOpacity * 100)}%</span>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Toast Notification Text Color</strong>
                        <p>Choose the color for the text inside toast notifications.</p>
                    </div>
                    <div class="ui-setting-item-control range-control">
                        <input
                            type="color"
                            value=${toastTextColor}
                            onInput=${(e) => onSetToastTextColor(e.currentTarget.value)}
                            style=${{ height: '40px', width: '60px', padding: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' }}
                            aria-label="Toast notification text color"
                        />
                        <span style=${{ fontFamily: 'monospace', minWidth: '70px', textAlign: 'left' }}>${toastTextColor}</span>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Autohide Main Sidebar</strong>
                        <p>Automatically collapse the sidebar when not in use on larger screens.</p>
                    </div>
                    <div class="ui-setting-item-control">
                        <label class="switch">
                            <input 
                                type="checkbox" 
                                checked=${isSidebarAutohide} 
                                onChange=${(e) => onToggleSidebarAutohide(e.currentTarget.checked)}
                            />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
                
                 <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Default Plan Duration</strong>
                        <p>Set the default duration (in minutes) for new plans created from the calendar view.</p>
                    </div>
                    <div class="ui-setting-item-control range-control">
                        <input
                            type="range"
                            min="15"
                            max="480"
                            step="15"
                            value=${defaultPlanDuration}
                            onInput=${(e) => onSetDefaultPlanDuration(parseInt(e.currentTarget.value, 10))}
                            aria-label="Default Plan Duration"
                        />
                        <span>${defaultPlanDuration} min</span>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Show Table Header Filters</strong>
                        <p>Show or hide advanced filter controls in table headers.</p>
                    </div>
                    <div class="ui-setting-item-control">
                        <label class="switch">
                            <input 
                                type="checkbox" 
                                checked=${showTableHeaderFilters} 
                                onChange=${(e) => onToggleShowTableHeaderFilters(e.currentTarget.checked)}
                            />
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Minimum records for filters</strong>
                        <p>Show advanced filters only when the table contains at least this many records.</p>
                    </div>
                    <div class="ui-setting-item-control range-control">
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value=${minRecordsForFilters}
                            onInput=${(e) => onSetMinRecordsForFilters(parseInt(e.currentTarget.value, 10))}
                            aria-label="Minimum records to show filters"
                        />
                        <span>${minRecordsForFilters}</span>
                    </div>
                </div>

                <div class="ui-setting-item">
                    <div class="ui-setting-item-label">
                        <strong>Table Rows Per Page</strong>
                        <p>Set the default number of rows to display in tables.</p>
                    </div>
                    <div class="ui-setting-item-control range-control">
                        <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value=${rowsPerPage}
                            onInput=${(e) => onSetRowsPerPage(parseInt(e.currentTarget.value, 10))}
                            aria-label="Table rows per page"
                        />
                        <span>${rowsPerPage}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};