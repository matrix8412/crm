





import { render } from 'preact';
import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { html } from 'htm/preact';

// FIX: Correctly import all necessary types from the types module.
import { View, Customer, NetworkDevice, Plan, User, UserGroup, AuditLogEntry, AuditLogChange, Enumerations, EnumValue, AddressValue, Comment, DeviceTemplate, Prefix, VLAN, VLANDomain, NavItem, L2VPN, L3VPN, Site, Rack } from './types';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useUI } from './contexts/ToastContext';
import { icons } from './constants/icons';
import { defaultEnumerations } from './constants/defaults';
import * as api from './utils/api';
// FIX: All column config creator functions are now correctly imported.
import { createCustomerColumnConfig, createDeviceColumnConfig, createPlanColumnConfig, createUserColumnConfig, createUserGroupColumnConfig, createAddressEnumColumnConfig, createDeviceTemplateColumnConfig, createPrefixColumnConfig, createVlanColumnConfig, createVlanDomainColumnConfig, createL2VpnColumnConfig, createL3VpnColumnConfig, createSiteColumnConfig, createRackColumnConfig } from './constants/columns';
import { createInitialVisibility } from './utils/helpers';
import { sortData } from './utils/sorting';

import { Modal } from './components/Modal';
import { HistoryModal } from './components/HistoryModal';
import { ColumnToggleDropdown } from './components/ColumnToggleDropdown';
import { CustomerForm } from './components/forms/CustomerForm';
import { DeviceForm } from './components/forms/DeviceForm';
import { PlanForm } from './components/forms/PlanForm';
import { UserForm } from './components/forms/UserForm';
import { UserGroupForm } from './components/forms/UserGroupForm';
import { EnumForm } from './components/forms/EnumForm';
import { AddressForm } from './components/forms/AddressForm';
import { DeviceTemplateForm } from './components/forms/DeviceTemplateForm';
import { SiteForm } from './components/forms/SiteForm';
import { RackForm } from './components/forms/RackForm';
import { PlaceholderContent } from './components/PlaceholderContent';
import { SettingsPage } from './components/settings/SettingsPage';
import { CalendarView } from './components/calendar/CalendarView';
import { Dashboard } from './components/dashboard/Dashboard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DeviceDetailsModal } from './components/DeviceDetailsModal';
import { DeviceTreeView } from './components/devices/DeviceTreeView';
import { DeviceMapView } from './components/devices/DeviceMapView';
import { SubnetCalculator } from './components/tools/SubnetCalculator';
import { CoinCounter } from './components/tools/CoinCounter';
import { IpamPage } from './components/ipam/IpamPage';
import { PrefixForm } from './components/forms/PrefixForm';
import { VlanForm } from './components/forms/VlanForm';
import { VlanDomainForm } from './components/forms/VlanDomainForm';
import { L2VpnForm } from './components/forms/L2VpnForm';
import { L3VpnForm } from './components/forms/L3VpnForm';
import { Table } from './components/Table';

const downloadFile = (filename: string, content: BlobPart, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
};

const navConfig: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard, view: 'dashboard' },
    { id: 'customers', label: 'Customers', icon: icons.customers, view: 'customers' },
    { id: 'devices', label: 'Devices', icon: icons.devices, view: 'devices' },
    { 
        id: 'ipam', 
        label: 'IPAM', 
        icon: icons.ipam, 
        subItems: [
            { id: 'ipamPrefixes', label: 'Prefixes', view: 'ipamPrefixes' },
            { id: 'ipamVlans', label: 'VLANs', view: 'ipamVlans' },
            { id: 'ipamVpn', label: 'VPN', view: 'ipamVpn' }
        ] 
    },
    { id: 'planning', label: 'Planning', icon: icons.planning, view: 'planning' },
    { id: 'invoicing', label: 'Invoicing', icon: icons.invoicing, view: 'invoicing' },
    { id: 'warehouse', label: 'Warehouse', icon: icons.warehouse, view: 'warehouse' },
    { 
        id: 'tools', 
        label: 'Tools', 
        icon: icons.tools, 
        subItems: [
            { id: 'subnetCalculator', label: 'Subnet Calculator', view: 'subnetCalculator' },
            { id: 'coinCounter', label: 'Coin Counter', view: 'coinCounter' }
        ] 
    },
    { id: 'settings', label: 'Settings', icon: icons.settings, view: 'settings' }
];

// FIX: Moved menu configurations from SettingsPage.tsx to App.tsx to resolve scope issues.
const enumMenu = {
    key: 'enumerations',
    label: 'Enumerations',
    icon: icons.list,
    items: [
        { key: 'vendor', label: 'Vendors' },
        { key: 'legalForm', label: 'Legal Forms' },
        { key: 'deviceGroup', label: 'Device Groups' },
        { key: 'deviceType', label: 'Device Types' },
        { key: 'planCategory', label: 'Plan Categories' },
        { key: 'reportingMethod', label: 'Reporting Methods' },
        { key: 'planPriority', label: 'Plan Priorities' },
        { key: 'addresses', label: 'Addresses' },
        { key: 'templatesList', label: 'Device template' },
        { key: 'sitesAndRacks', label: 'Sites & Racks' },
    ]
};

const ipamMenu = {
    key: 'ipamSettings',
    label: 'IPAM',
    icon: icons.ipam,
    items: [
        { key: 'ipamRoles', label: 'Roles' },
        { key: 'tags', label: 'Tags' },
        { key: 'l2vpnSettings', label: 'L2VPN Settings' },
        { key: 'l3vpnSettings', label: 'L3VPN Settings' },
    ]
};

const systemMenu = {
    key: 'systemSettings',
    label: 'System Settings',
    icon: icons.settings,
    items: [
        { key: 'uiSettings', label: 'UI Settings' },
        { key: 'moduleSettings', label: 'Modules' },
        { key: 'integrationModules', label: 'Integration modules' },
    ]
};

const settingsMenu = [
    {
        key: 'userManagement',
        label: 'User Management',
        icon: icons.userManagement,
        items: [
            { key: 'users', label: 'Users' },
            { key: 'groups', label: 'User Groups' }
        ] as const
    },
    enumMenu,
    ipamMenu,
    systemMenu,
];


interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export const App = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [expandedNavs, setExpandedNavs] = useState(() => new Set(['tools', 'ipam']));
  const [isSidebarHovered, setSidebarHovered] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [enumerations, setEnumerations] = useState<Enumerations>(defaultEnumerations as Enumerations);

  // IPAM State
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [vlanDomains, setVlanDomains] = useState<VLANDomain[]>([]);
  const [l2vpns, setL2vpns] = useState<L2VPN[]>([]);
  const [l3vpns, setL3vpns] = useState<L3VPN[]>([]);

  const [dataLoaded, setDataLoaded] = useState(false);

  const [modal, setModal] = useState<{ type: string; data?: any, entityId?: string, entityType?: string, enumType?: keyof Enumerations, enumTypeName?: string } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{ title: string; message: string; confirmText: string; confirmClass?: string; onConfirm: () => void; } | null>(null);
  const [planningView, setPlanningView] = useState<'list' | 'calendar'>('calendar');
  const [deviceView, setDeviceView] = useState<'list' | 'tree' | 'map'>('list');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openRowActionDropdown, setOpenRowActionDropdown] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState({
    customers: '',
    devices: '',
    plans: '',
    users: '',
    userGroups: '',
    addresses: '',
    deviceTemplates: '',
    prefixes: '',
    vlans: '',
    vlanDomains: '',
    l2vpns: '',
    l3vpns: '',
    sites: '',
    racks: '',
  });
  const [debouncedSearchQueries, setDebouncedSearchQueries] = useState(searchQueries);

  // --- UI & Filter State (loaded from DB settings) ---
  const [appName, setAppNameLocal] = useState<string>('CRM App');
  const [rowsPerPage, setRowsPerPageLocal] = useState<number>(25);
  const [showTableHeaderFilters, setShowTableHeaderFiltersLocal] = useState<boolean>(true);
  const [minRecordsForFilters, setMinRecordsForFiltersLocal] = useState<number>(5);
  const [defaultPlanDuration, setDefaultPlanDurationLocal] = useState<number>(1);
  const [advancedFilters, setAdvancedFilters] = useLocalStorageState<Record<string, any>>('crm_advanced_filters', {});
  const [openFilterPopover, setOpenFilterPopover] = useState<{ view: string; colKey: string } | null>(null);
    
  const [pagination, setPagination] = useState({
    customers: { currentPage: 1, rowsPerPage: rowsPerPage },
    devices: { currentPage: 1, rowsPerPage: rowsPerPage },
    plans: { currentPage: 1, rowsPerPage: rowsPerPage },
    users: { currentPage: 1, rowsPerPage: rowsPerPage },
    userGroups: { currentPage: 1, rowsPerPage: rowsPerPage },
    addresses: { currentPage: 1, rowsPerPage: rowsPerPage },
    deviceTemplates: { currentPage: 1, rowsPerPage: rowsPerPage },
    sites: { currentPage: 1, rowsPerPage: rowsPerPage },
    racks: { currentPage: 1, rowsPerPage: rowsPerPage },
    prefixes: { currentPage: 1, rowsPerPage: rowsPerPage },
    vlans: { currentPage: 1, rowsPerPage: rowsPerPage },
    vlanDomains: { currentPage: 1, rowsPerPage: rowsPerPage },
    l2vpns: { currentPage: 1, rowsPerPage: rowsPerPage },
    l3vpns: { currentPage: 1, rowsPerPage: rowsPerPage },
  });
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isModalFormDirty, setModalFormDirty] = useState(false);
  const [sortConfig, setSortConfig] = useLocalStorageState<{ [key: string]: SortConfig }>('crm_sort_config', {
      customers: { key: 'customerNumber', direction: 'asc' },
      devices: { key: 'name', direction: 'asc' },
      plans: { key: 'scheduledFrom', direction: 'desc' },
      users: { key: 'name', direction: 'asc' },
      userGroups: { key: 'name', direction: 'asc' },
      addresses: { key: 'street', direction: 'asc' },
      deviceTemplates: { key: 'name', direction: 'asc' },
      sites: { key: 'name', direction: 'asc' },
      racks: { key: 'name', direction: 'asc' },
      vendor: { key: 'label', direction: 'asc' },
      legalForm: { key: 'label', direction: 'asc' },
      deviceGroup: { key: 'label', direction: 'asc' },
      deviceType: { key: 'label', direction: 'asc' },
      planCategory: { key: 'label', direction: 'asc' },
      reportingMethod: { key: 'label', direction: 'asc' },
      planPriority: { key: 'label', direction: 'asc' },
      ipamRoles: { key: 'label', direction: 'asc' },
      tags: { key: 'label', direction: 'asc' },
      prefixes: { key: 'prefix', direction: 'asc' },
      vlans: { key: 'vlanId', direction: 'asc' },
      vlanDomains: { key: 'name', direction: 'asc' },
      l2vpns: { key: 'name', direction: 'asc' },
      l3vpns: { key: 'name', direction: 'asc' },
  });

  const [moduleVisibility, setModuleVisibilityLocal] = useState({
    customers: true,
    devices: true,
    ipam: true,
    planning: true,
    invoicing: true,
    warehouse: true,
    tools: true,
  });

  const [zabbixSettings, setZabbixSettingsLocal] = useState({
    enabled: false,
    url: '',
    apiKey: '',
  });

  const { 
    addToast,
    theme, setTheme,
    isSidebarAutohide, setSidebarAutohide,
    toastOpacity, setToastOpacity,
    toastPosition, setToastPosition,
    toastTextColor, setToastTextColor,
    isGlossy, setGlossy,
  } = useUI();

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  // --- Settings wrapper functions (save to DB) ---
  const setAppName = useCallback((v: string) => { setAppNameLocal(v); api.saveSetting('appName', v); }, []);
  const setRowsPerPage = useCallback((v: number) => { setRowsPerPageLocal(v); api.saveSetting('rowsPerPage', v); }, []);
  const setShowTableHeaderFilters = useCallback((v: boolean) => { setShowTableHeaderFiltersLocal(v); api.saveSetting('showTableHeaderFilters', v); }, []);
  const setMinRecordsForFilters = useCallback((v: number) => { setMinRecordsForFiltersLocal(v); api.saveSetting('minRecordsForFilters', v); }, []);
  const setDefaultPlanDuration = useCallback((v: number) => { setDefaultPlanDurationLocal(v); api.saveSetting('defaultPlanDuration', v); }, []);
  const setModuleVisibility = useCallback((v: any) => {
    const newVal = typeof v === 'function' ? v(moduleVisibility) : v;
    setModuleVisibilityLocal(newVal);
    api.saveSetting('moduleVisibility', newVal);
  }, [moduleVisibility]);
  const setZabbixSettings = useCallback((v: any) => {
    const newVal = typeof v === 'function' ? v(zabbixSettings) : v;
    setZabbixSettingsLocal(newVal);
    api.saveSetting('zabbixSettings', newVal);
  }, [zabbixSettings]);

  // --- Load all data from API on mount ---
  useEffect(() => {
    let cancelled = false;
    api.fetchAllData().then(data => {
      if (cancelled) return;
      setEnumerations(data.enumerations as Enumerations);
      setCustomers(data.customers);
      setUsers(data.users);
      setUserGroups(data.userGroups);
      setDevices(data.devices);
      setPlans(data.plans);
      setComments(data.comments);
      setAuditLog(data.auditLogs);
      setPrefixes(data.prefixes);
      setVlans(data.vlans);
      setVlanDomains(data.vlanDomains);
      setL2vpns(data.l2vpns);
      setL3vpns(data.l3vpns);

      // Apply settings from DB
      const s = data.settings;
      if (s.appName) setAppNameLocal(s.appName);
      if (s.rowsPerPage) setRowsPerPageLocal(s.rowsPerPage);
      if (s.showTableHeaderFilters !== undefined) setShowTableHeaderFiltersLocal(s.showTableHeaderFilters);
      if (s.minRecordsForFilters) setMinRecordsForFiltersLocal(s.minRecordsForFilters);
      if (s.defaultPlanDuration) setDefaultPlanDurationLocal(s.defaultPlanDuration);
      if (s.moduleVisibility) setModuleVisibilityLocal(s.moduleVisibility);
      if (s.zabbixSettings) setZabbixSettingsLocal(s.zabbixSettings);

      setDataLoaded(true);
    }).catch(err => {
      if (!cancelled) {
        console.error('Failed to load data from API:', err);
        setDataLoaded(true); // Continue with defaults
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setPagination(prev => {
        const newPagination = { ...prev };
        for (const key in newPagination) {
            newPagination[key].rowsPerPage = rowsPerPage;
        }
        return newPagination;
    });
  }, [rowsPerPage]);

  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchQueries(searchQueries);
    }, 300);

    return () => {
        clearTimeout(handler);
    };
  }, [searchQueries]);

  useEffect(() => {
    if (isSidebarAutohide && !isSidebarHovered) {
      setExpandedNavs(new Set());
    }
  }, [isSidebarAutohide, isSidebarHovered]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((openDropdown || openRowActionDropdown) && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
        setOpenRowActionDropdown(null);
      }
      if (openFilterPopover && !event.target.closest('.filter-popover-container')) {
        setOpenFilterPopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, openFilterPopover, openRowActionDropdown]);

  // --- Memoized Maps for efficient lookups ---
  const customerMap = useMemo(() => new Map(customers.filter(c => c && c.id).map(c => [c.id, c])), [customers]);
  const deviceMap = useMemo(() => new Map(devices.filter(d => d && d.id).map(d => [d.id, d])), [devices]);
  const userMap = useMemo(() => new Map(users.filter(u => u && u.id).map(u => [u.id, u])), [users]);
  const userGroupMap = useMemo(() => new Map(userGroups.filter(g => g && g.id && g.name).map(g => [g.id, g.name])), [userGroups]);
  const addressMap = useMemo(() => new Map((enumerations.addresses || []).filter(a => a && a.id).map(a => [a.id, a])), [enumerations.addresses]);
  const vlanDomainMap = useMemo(() => new Map(vlanDomains.filter(d => d && d.id).map(d => [d.id, d])), [vlanDomains]);
  const enumMaps = useMemo(() => {
    const maps: { [key: string]: Map<string, any> } = {};
    // FIX: Replaced `Object.keys` with a `for...in` loop to safely iterate over an object's properties without TypeScript complaining about symbol index types.
    for (const key in enumerations) {
        if (Object.prototype.hasOwnProperty.call(enumerations, key)) {
            if (key === 'addresses' || key === 'deviceTemplates') continue;
            const valueArray = enumerations[key as keyof Enumerations] || [];
            maps[key] = new Map((valueArray as any[]).filter(item => item && item.id && (item.label || item.name)).map(item => [item.id, item]));
        }
    }
    return maps;
  }, [enumerations]);

  const companyLegalFormId = useMemo(() => {
    return enumerations.legalForm.find(form => form.label.toLowerCase() === 'company')?.id;
  }, [enumerations.legalForm]);

  const allValueMaps = useMemo(() => ({
    ...enumMaps,
    userGroups: userGroupMap,
    devices: new Map(devices.filter(d => d && d.id && d.name).map(d => [d.id, d.name])),
    customers: customerMap,
    addresses: addressMap,
  }), [enumMaps, userGroupMap, devices, customerMap, addressMap]);

  // Reverse maps for import
  const reverseEnumMaps = useMemo(() => {
    const maps: { [key: string]: Map<string, string> } = {};
    // FIX: Replaced `Object.keys` with a `for...in` loop to safely iterate over an object's properties without TypeScript complaining about symbol index types.
    for (const key in enumerations) {
        if (Object.prototype.hasOwnProperty.call(enumerations, key)) {
            if (key === 'addresses' || key === 'deviceTemplates') continue;
            const valueArray = enumerations[key as keyof Enumerations] || [];
            maps[key] = new Map((valueArray as any[]).filter(item => item && item.id && item.label).map(item => [item.label.toLowerCase(), item.id]));
        }
    }
    return maps;
  }, [enumerations]);

  // --- Data Arrays for centralized management ---
  const dataArrays = { customers, devices, plans, users, userGroups, prefixes, vlans, vlanDomains, l2vpns, l3vpns };

  // --- Core Action Callbacks ---
  const getEntityName = useCallback((entityType, item) => {
    if (!item) return 'N/A';
    switch(entityType) {
        case 'customers': return `${item.firstName} ${item.lastName}`;
        case 'devices': return item.name;
        case 'plans': {
            const customer = customerMap.get(item.customerId);
            const device = deviceMap.get(item.deviceId);
            
            let target = '';
            if (customer && device) {
                target = `for ${customer.firstName} ${customer.lastName} at ${device.name}`;
            } else if (customer) {
                target = `for ${customer.firstName} ${customer.lastName}`;
            } else if (device) {
                target = `at ${device.name}`;
            } else {
                target = '(unassigned)';
            }
            
            return `Plan ${target}`;
        }
        case 'users': return `User ${item.name} ${item.surname}`;
        case 'userGroups': return `Group: ${item.name}`;
        case 'prefixes': return `Prefix: ${item.name} (${item.prefix})`;
        case 'vlans': return `VLAN: ${item.vlanId} - ${item.name}`;
        case 'vlanDomains': return `VLAN Domain: ${item.name}`;
        case 'l2vpns': return `L2VPN: ${item.name} (VC ID: ${item.vcId})`;
        case 'l3vpns': return `L3VPN: ${item.name} (RD: ${item.routeDistinguisher})`;
        case 'comment':
            const planForComment = plans.find(p => p.id === item.planId);
            const userForComment = userMap.get(item.userId);
            const planName = planForComment ? getEntityName('plans', planForComment) : `Unknown Plan (${item.planId})`;
            const userName = userForComment ? `${userForComment.name} ${userForComment.surname}` : 'Unknown User';
            return `Comment by ${userName} on ${planName}`;
        default: return `Item ID: ${item.id}`;
    }
  }, [customerMap, deviceMap, plans, userMap]);
  
  const logAction = useCallback((action: 'create' | 'update' | 'delete', entityType: string, newData: any, oldData: any = null, source: 'form' | 'import' | 'system' = 'form') => {
    let details: AuditLogChange[] = [];

    if (action === 'create') {
        details = Object.keys(newData).map(key => ({
            field: key,
            oldValue: '',
            newValue: String(newData[key] ?? ''),
        }));
    } else if (action === 'delete') {
         details = Object.keys(oldData).map(key => ({
            field: key,
            oldValue: String(oldData[key] ?? ''),
            newValue: '',
        }));
    } else if (action === 'update' && oldData && newData) {
        const changes: AuditLogChange[] = [];
        Object.keys(newData).forEach(key => {
            if (key === 'id') return;
            const oldValueStr = String(oldData[key] ?? '');
            const newValueStr = String(newData[key] ?? '');

            if (oldValueStr !== newValueStr) {
                changes.push({ field: key, oldValue: oldValueStr, newValue: newValueStr });
            }
        });
        if (changes.length === 0) return;
        details = changes;
    }

    const newEntry: Omit<AuditLogEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        action,
        entityType,
        entityId: newData?.id || oldData?.id,
        entityName: getEntityName(entityType, newData || oldData),
        details,
        source,
    };
    setAuditLog(prev => [{ ...newEntry, id: self.crypto.randomUUID() }, ...prev]);
  }, [getEntityName, setAuditLog]);

  // --- Refresh functions: re-fetch data from API after mutations ---
  const refreshEntity = useCallback(async (type: string) => {
    const apiMap: Record<string, any> = {
      customers: api.customersApi,
      devices: api.devicesApi,
      plans: api.plansApi,
      users: api.usersApi,
      userGroups: api.userGroupsApi,
      prefixes: api.prefixesApi,
      vlans: api.vlansApi,
      vlanDomains: api.vlanDomainsApi,
      l2vpns: api.l2VpnsApi,
      l3vpns: api.l3VpnsApi,
    };
    const setterMap: Record<string, any> = {
      customers: setCustomers,
      devices: setDevices,
      plans: setPlans,
      users: setUsers,
      userGroups: setUserGroups,
      prefixes: setPrefixes,
      vlans: setVlans,
      vlanDomains: setVlanDomains,
      l2vpns: setL2vpns,
      l3vpns: setL3vpns,
    };
    const entityApi = apiMap[type];
    const setter = setterMap[type];
    if (!entityApi || !setter) return;
    try {
      let data = await entityApi.fetchAll();
      if (entityApi.fetchTags) {
        data = await Promise.all(data.map(async (item: any) => ({ ...item, tagIds: await entityApi.fetchTags(item.id) })));
      }
      setter(data);
    } catch (err) {
      console.error(`Failed to refresh ${type}:`, err);
    }
  }, []);

  const refreshEnums = useCallback(async () => {
    try {
      const [enumRows, addresses, deviceTemplates, sites, racks] = await Promise.all([
        api.fetchEnums(),
        api.addressesApi.fetchAll(),
        api.deviceTemplatesApi.fetchAll(),
        api.sitesApi.fetchAll(),
        api.racksApi.fetchAll(),
      ]);
      const grouped: Record<string, any[]> = {};
      for (const row of enumRows) {
        const cat = row.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ id: row.id, label: row.label, color: row.color, ssid: row.ssid, isDeleted: row.isDeleted });
      }
      setEnumerations({
        vendor: grouped['vendor'] || [],
        legalForm: grouped['legalForm'] || [],
        deviceGroup: grouped['deviceGroup'] || [],
        deviceType: grouped['deviceType'] || [],
        planCategory: grouped['planCategory'] || [],
        reportingMethod: grouped['reportingMethod'] || [],
        planPriority: grouped['planPriority'] || [],
        addresses,
        deviceTemplates,
        ipamRoles: grouped['ipamRoles'] || [],
        tags: grouped['tags'] || [],
        l2VpnEncapsulation: grouped['l2VpnEncapsulation'] || [],
        l2VpnMode: grouped['l2VpnMode'] || [],
        l2VpnSignalization: grouped['l2VpnSignalization'] || [],
        routeDistinguishers: grouped['routeDistinguishers'] || [],
        vpnTargets: grouped['vpnTargets'] || [],
        sites,
        racks,
      } as Enumerations);
    } catch (err) {
      console.error('Failed to refresh enums:', err);
    }
  }, []);

  const refreshComments = useCallback(async () => {
    try {
      const data = await api.fetchComments();
      setComments(data);
    } catch (err) {
      console.error('Failed to refresh comments:', err);
    }
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    try {
      const logs = await api.fetchAuditLogs();
      setAuditLog(logs);
    } catch (err) {
      console.error('Failed to refresh audit logs:', err);
    }
  }, []);

  const toggleDeleteStatus = useCallback((type, id) => {
    const items = dataArrays[type];
    const oldItem = items.find(i => i.id === id);
    if (!oldItem) return;

    const isDeleting = !oldItem.isDeleted;

    const apiMap = {
      customers: api.customersApi,
      devices: api.devicesApi,
      plans: api.plansApi,
      users: api.usersApi,
      userGroups: api.userGroupsApi,
      prefixes: api.prefixesApi,
      vlans: api.vlansApi,
      vlanDomains: api.vlanDomainsApi,
      l2vpns: api.l2VpnsApi,
      l3vpns: api.l3VpnsApi,
    };

    setConfirmationModal({
      title: isDeleting ? 'Confirm Deletion' : 'Confirm Restoration',
      message: `Are you sure you want to ${isDeleting ? 'delete' : 'restore'} this item?`,
      confirmText: isDeleting ? 'Delete' : 'Restore',
      confirmClass: isDeleting ? 'btn-danger' : 'btn-success',
      onConfirm: async () => {
        try {
          const entityApi = apiMap[type];
          await entityApi.toggleDelete(id);
          await refreshEntity(type);
          addToast(`Item ${isDeleting ? 'deleted' : 'restored'}.`, isDeleting ? 'warning' : 'success');
          setConfirmationModal(null);
          setOpenRowActionDropdown(null);
          refreshAuditLogs();
        } catch (err) {
          addToast(`Error: ${err.message}`, 'error');
          setConfirmationModal(null);
        }
      },
    });
  }, [dataArrays, addToast, setConfirmationModal, refreshEntity, refreshAuditLogs]);

  const toggleEnumDeletedStatus = useCallback((enumType: keyof Enumerations, id: string) => {
    const list = enumerations[enumType] as (AddressValue | EnumValue | DeviceTemplate | Site | Rack)[];
    const item = list.find(i => i.id === id);
    if (!item) return;

    const isDeleting = !item.isDeleted;
    
    setConfirmationModal({
      title: isDeleting ? 'Confirm Deletion' : 'Confirm Restoration',
      message: isDeleting
        ? 'Are you sure you want to delete this value? It will be hidden from dropdowns but existing records will retain it.'
        : 'Are you sure you want to restore this value? It will become available in dropdowns again.',
      confirmText: isDeleting ? 'Delete' : 'Restore',
      confirmClass: isDeleting ? 'btn-danger' : 'btn-success',
      onConfirm: async () => {
        try {
          if (enumType === 'addresses') {
            await api.addressesApi.toggleDelete(id);
          } else if (enumType === 'deviceTemplates') {
            await api.deviceTemplatesApi.toggleDelete(id);
          } else if (enumType === 'sites') {
            await api.sitesApi.toggleDelete(id);
          } else if (enumType === 'racks') {
            await api.racksApi.toggleDelete(id);
          } else {
            await api.toggleEnumDelete(id);
          }
          await refreshEnums();
          addToast(`Value ${isDeleting ? 'deleted' : 'restored'}.`, isDeleting ? 'warning' : 'success');
          setConfirmationModal(null);
          refreshAuditLogs();
        } catch (err) {
          addToast(`Error: ${err.message}`, 'error');
          setConfirmationModal(null);
        }
      },
    });
  }, [enumerations, addToast, setConfirmationModal, refreshEnums, refreshAuditLogs]);
  
  // --- Column Configurations (Memoized) ---
  const customerColumnConfig = useMemo(() => createCustomerColumnConfig(setModal, toggleDeleteStatus, enumMaps, addressMap, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, enumMaps, addressMap, openRowActionDropdown]);
  const deviceColumnConfig = useMemo(() => createDeviceColumnConfig(setModal, toggleDeleteStatus, enumMaps, deviceMap, addressMap, addToast, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, enumMaps, deviceMap, addressMap, addToast, openRowActionDropdown]);
  const planColumnConfig = useMemo(() => createPlanColumnConfig(setModal, toggleDeleteStatus, customerMap, deviceMap, enumMaps, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, customerMap, deviceMap, enumMaps, openRowActionDropdown]);
  const userColumnConfig = useMemo(() => createUserColumnConfig(setModal, toggleDeleteStatus, userGroupMap, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, userGroupMap, openRowActionDropdown]);
  const userGroupColumnConfig = useMemo(() => createUserGroupColumnConfig(setModal, toggleDeleteStatus, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, openRowActionDropdown]);
  const addressEnumColumnConfig = useMemo(() => createAddressEnumColumnConfig(setModal, toggleEnumDeletedStatus, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleEnumDeletedStatus, openRowActionDropdown]);
  const deviceTemplateColumnConfig = useMemo(() => createDeviceTemplateColumnConfig(setModal, toggleEnumDeletedStatus, enumMaps, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleEnumDeletedStatus, enumMaps, openRowActionDropdown]);
  const siteColumnConfig = useMemo(() => createSiteColumnConfig(setModal, toggleEnumDeletedStatus, addressMap, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleEnumDeletedStatus, addressMap, openRowActionDropdown]);
  const rackColumnConfig = useMemo(() => createRackColumnConfig(setModal, toggleEnumDeletedStatus, enumMaps, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleEnumDeletedStatus, enumMaps, openRowActionDropdown]);
  const prefixColumnConfig = useMemo(() => createPrefixColumnConfig(setModal, toggleDeleteStatus, enumMaps, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, enumMaps, openRowActionDropdown]);
  const vlanColumnConfig = useMemo(() => createVlanColumnConfig(setModal, toggleDeleteStatus, enumMaps, vlanDomainMap, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, enumMaps, vlanDomainMap, openRowActionDropdown]);
  const vlanDomainColumnConfig = useMemo(() => createVlanDomainColumnConfig(setModal, toggleDeleteStatus, enumMaps, vlanDomainMap, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, enumMaps, vlanDomainMap, openRowActionDropdown]);
  const l2VpnColumnConfig = useMemo(() => createL2VpnColumnConfig(setModal, toggleDeleteStatus, customerMap, companyLegalFormId, enumMaps, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, customerMap, companyLegalFormId, enumMaps, openRowActionDropdown]);
  const l3VpnColumnConfig = useMemo(() => createL3VpnColumnConfig(setModal, toggleDeleteStatus, customerMap, companyLegalFormId, enumMaps, openRowActionDropdown, setOpenRowActionDropdown), [setModal, toggleDeleteStatus, customerMap, companyLegalFormId, enumMaps, openRowActionDropdown]);

  const entityColumnConfigs = useMemo(() => ({
      customers: customerColumnConfig,
      devices: deviceColumnConfig,
      plans: planColumnConfig,
      users: userColumnConfig,
      userGroups: userGroupColumnConfig,
      addresses: addressEnumColumnConfig,
      deviceTemplates: deviceTemplateColumnConfig,
      sites: siteColumnConfig,
      racks: rackColumnConfig,
      prefixes: prefixColumnConfig,
      vlans: vlanColumnConfig,
      vlanDomains: vlanDomainColumnConfig,
      l2vpns: l2VpnColumnConfig,
      l3vpns: l3VpnColumnConfig,
  }), [customerColumnConfig, deviceColumnConfig, planColumnConfig, userColumnConfig, userGroupColumnConfig, addressEnumColumnConfig, deviceTemplateColumnConfig, siteColumnConfig, rackColumnConfig, prefixColumnConfig, vlanColumnConfig, vlanDomainColumnConfig, l2VpnColumnConfig, l3VpnColumnConfig]);

  const allColumnConfigs = entityColumnConfigs;

  // --- Search, Filter, and Sort Logic ---
  const handleSearch = (view: keyof typeof searchQueries, query: string) => {
    setSearchQueries(prev => ({ ...prev, [view]: query }));
    setPagination(prev => ({ ...prev, [view]: { ...prev[view], currentPage: 1 } }));
  };
  
  const handlePageChange = (view: keyof typeof pagination, newPage: number) => {
    setPagination(prev => ({ ...prev, [view]: { ...prev[view], currentPage: newPage } }));
  };
  
  const handleSort = (view: string, key: string) => {
    setSortConfig(prev => {
        const current = prev[view];
        let direction: 'asc' | 'desc' = 'asc';
        if (current && current.key === key && current.direction === 'asc') {
            direction = 'desc';
        }
        return { ...prev, [view]: { key, direction } };
    });
    setPagination(prev => ({ ...prev, [view]: { ...prev[view], currentPage: 1 } }));
  };

  const handleApplyFilter = (view, colKey, filter) => {
    setAdvancedFilters(prev => ({
        ...prev,
        [view]: {
            ...prev[view],
            [colKey]: filter,
        },
    }));
    setOpenFilterPopover(null);
    handlePageChange(view, 1);
  };

  const handleClearFilter = (view, colKey) => {
    setAdvancedFilters(prev => {
        const newViewFilters = { ...prev[view] };
        delete newViewFilters[colKey];
        return {
            ...prev,
            [view]: newViewFilters,
        };
    });
    setOpenFilterPopover(null);
    handlePageChange(view, 1);
  };

    const applyAdvancedFilters = (items, filters, columnConfig) => {
        if (!filters || Object.keys(filters).length === 0) return items;

        return items.filter(item => {
            return Object.entries(filters).every(([key, filter]: [string, any]) => {
                if (!filter) return true;
                const { operator, value } = filter;
                const itemValueRaw = columnConfig[key]?.exportValue ? columnConfig[key].exportValue(item) : item[key];
                const itemValue = String(itemValueRaw ?? '').toLowerCase();
                const filterValue = String(value ?? '').toLowerCase();

                switch (operator) {
                    case 'contains': return itemValue.includes(filterValue);
                    case 'notContains': return !itemValue.includes(filterValue);
                    case 'startsWith': return itemValue.startsWith(filterValue);
                    case 'endsWith': return itemValue.endsWith(filterValue);
                    case 'equals': return itemValue === filterValue;
                    case 'notEquals': return itemValue !== filterValue;
                    case 'isEmpty': return itemValueRaw == null || itemValueRaw === '';
                    case 'isNotEmpty': return itemValueRaw != null && itemValueRaw !== '';
                    default: return true;
                }
            });
        });
    };

    const searchFilter = (query: string, items: any[]) => {
        if (!query) return items;
        const lowercasedQuery = query.toLowerCase().trim();
        const terms = lowercasedQuery.split(' ').filter(t => t);
        if (terms.length === 0) return items;
        return items.filter(item => {
            const searchableText = JSON.stringify(item).toLowerCase(); // Simple but effective
            return terms.every(term => searchableText.includes(term));
        });
    };

    const filteredCustomers = useMemo(() => {
        let results = customers.filter(c => c && c.firstName && c.lastName);
        results = searchFilter(debouncedSearchQueries.customers, results);
        results = applyAdvancedFilters(results, advancedFilters.customers, customerColumnConfig);
        return sortData(results, sortConfig.customers, customerColumnConfig);
    }, [customers, debouncedSearchQueries.customers, advancedFilters.customers, sortConfig.customers]);

    const filteredDevices = useMemo(() => {
        let results = devices.filter(d => d && d.name);
        results = searchFilter(debouncedSearchQueries.devices, results);
        results = applyAdvancedFilters(results, advancedFilters.devices, deviceColumnConfig);
        return sortData(results, sortConfig.devices, deviceColumnConfig);
    }, [devices, debouncedSearchQueries.devices, advancedFilters.devices, sortConfig.devices]);

    const filteredPlans = useMemo(() => {
        let results = plans.filter(p => p && p.id);
        results = searchFilter(debouncedSearchQueries.plans, results);
        results = applyAdvancedFilters(results, advancedFilters.plans, planColumnConfig);
        return sortData(results, sortConfig.plans, planColumnConfig);
    }, [plans, debouncedSearchQueries.plans, advancedFilters.plans, sortConfig.plans]);
    
    const filteredUsers = useMemo(() => {
        let results = users.filter(u => u && u.name && u.surname);
        results = searchFilter(debouncedSearchQueries.users, results);
        results = applyAdvancedFilters(results, advancedFilters.users, userColumnConfig);
        return sortData(results, sortConfig.users, userColumnConfig);
    }, [users, debouncedSearchQueries.users, advancedFilters.users, sortConfig.users]);

    const filteredUserGroups = useMemo(() => {
        let results = userGroups.filter(g => g && g.name);
        results = searchFilter(debouncedSearchQueries.userGroups, results);
        results = applyAdvancedFilters(results, advancedFilters.userGroups, userGroupColumnConfig);
        return sortData(results, sortConfig.userGroups, userGroupColumnConfig);
    }, [userGroups, debouncedSearchQueries.userGroups, advancedFilters.userGroups, sortConfig.userGroups]);
    
    const filteredAddresses = useMemo(() => {
        let results = (enumerations.addresses || []).filter(a => a && a.street);
        results = searchFilter(debouncedSearchQueries.addresses, results);
        results = applyAdvancedFilters(results, advancedFilters.addresses, addressEnumColumnConfig);
        return sortData(results, sortConfig.addresses, addressEnumColumnConfig);
    }, [enumerations.addresses, debouncedSearchQueries.addresses, advancedFilters.addresses, sortConfig.addresses]);

    const filteredDeviceTemplates = useMemo(() => {
        let results = (enumerations.deviceTemplates || []).filter(t => t && t.name);
        results = searchFilter(debouncedSearchQueries.deviceTemplates, results);
        results = applyAdvancedFilters(results, advancedFilters.deviceTemplates, deviceTemplateColumnConfig);
        return sortData(results, sortConfig.deviceTemplates, deviceTemplateColumnConfig);
    }, [enumerations.deviceTemplates, debouncedSearchQueries.deviceTemplates, advancedFilters.deviceTemplates, sortConfig.deviceTemplates]);

    const filteredSites = useMemo(() => {
        let results = (enumerations.sites || []).filter(t => t && t.name);
        results = searchFilter(debouncedSearchQueries.sites, results);
        results = applyAdvancedFilters(results, advancedFilters.sites, siteColumnConfig);
        return sortData(results, sortConfig.sites, siteColumnConfig);
    }, [enumerations.sites, debouncedSearchQueries.sites, advancedFilters.sites, sortConfig.sites]);

    const filteredRacks = useMemo(() => {
        let results = (enumerations.racks || []).filter(t => t && t.name);
        results = searchFilter(debouncedSearchQueries.racks, results);
        results = applyAdvancedFilters(results, advancedFilters.racks, rackColumnConfig);
        return sortData(results, sortConfig.racks, rackColumnConfig);
    }, [enumerations.racks, debouncedSearchQueries.racks, advancedFilters.racks, sortConfig.racks]);

    const filteredPrefixes = useMemo(() => {
        let results = prefixes.filter(p => p && p.prefix);
        results = searchFilter(debouncedSearchQueries.prefixes, results);
        results = applyAdvancedFilters(results, advancedFilters.prefixes, prefixColumnConfig);
        return sortData(results, sortConfig.prefixes, prefixColumnConfig);
    }, [prefixes, debouncedSearchQueries.prefixes, advancedFilters.prefixes, sortConfig.prefixes]);
    
    const filteredVlans = useMemo(() => {
        let results = vlans.filter(v => v && v.vlanId && v.name);
        results = searchFilter(debouncedSearchQueries.vlans, results);
        results = applyAdvancedFilters(results, advancedFilters.vlans, vlanColumnConfig);
        return sortData(results, sortConfig.vlans, vlanColumnConfig);
    }, [vlans, debouncedSearchQueries.vlans, advancedFilters.vlans, sortConfig.vlans]);
    
    const filteredVlanDomains = useMemo(() => {
        let results = vlanDomains.filter(d => d && d.name);
        results = searchFilter(debouncedSearchQueries.vlanDomains, results);
        results = applyAdvancedFilters(results, advancedFilters.vlanDomains, vlanDomainColumnConfig);
        return sortData(results, sortConfig.vlanDomains, vlanDomainColumnConfig);
    }, [vlanDomains, debouncedSearchQueries.vlanDomains, advancedFilters.vlanDomains, sortConfig.vlanDomains]);

    const filteredL2vpns = useMemo(() => {
        let results = l2vpns.filter(v => v && v.name);
        results = searchFilter(debouncedSearchQueries.l2vpns, results);
        results = applyAdvancedFilters(results, advancedFilters.l2vpns, l2VpnColumnConfig);
        return sortData(results, sortConfig.l2vpns, l2VpnColumnConfig);
    }, [l2vpns, debouncedSearchQueries.l2vpns, advancedFilters.l2vpns, sortConfig.l2vpns]);

    const filteredL3vpns = useMemo(() => {
        let results = l3vpns.filter(v => v && v.name);
        results = searchFilter(debouncedSearchQueries.l3vpns, results);
        results = applyAdvancedFilters(results, advancedFilters.l3vpns, l3VpnColumnConfig);
        return sortData(results, sortConfig.l3vpns, l3VpnColumnConfig);
    }, [l3vpns, debouncedSearchQueries.l3vpns, advancedFilters.l3vpns, sortConfig.l3vpns]);


    // --- Global Search ---
    const handleGlobalSearch = (query: string) => {
        setGlobalSearchQuery(query);
        setGlobalSearchOpen(true);
    };

    const globalSearchResults = useMemo(() => {
        if (!globalSearchQuery) return null;

        const customerResults = searchFilter(globalSearchQuery, customers.filter(c => c && c.firstName && c.lastName));
        const deviceResults = searchFilter(globalSearchQuery, devices.filter(d => d && d.name));
        const planResults = searchFilter(globalSearchQuery, plans.filter(p => p && p.id));

        return {
            customers: customerResults,
            devices: deviceResults,
            plans: planResults,
        };
    }, [globalSearchQuery, customers, devices, plans]);

    const handleResultClick = (type, item) => {
        let view: View;
        let query: string;
        switch (type) {
            case 'customers': 
                view = 'customers';
                query = item.customerNumber;
                break;
            case 'devices': 
                view = 'devices';
                query = item.name;
                break;
            case 'plans': 
                view = 'planning';
                query = item.description;
                break;
            default: return;
        }

        setActiveView(view);
        handleSearch(type, query);
        setGlobalSearchOpen(false);
        setGlobalSearchQuery('');
    };

    const handleModalClose = () => {
        if (isModalFormDirty) {
            setConfirmationModal({
                title: 'Discard unsaved changes?',
                message: 'You have unsaved changes. Are you sure you want to discard them?',
                confirmText: 'Discard',
                confirmClass: 'btn-danger',
                onConfirm: () => {
                    setModal(null);
                    setModalFormDirty(false);
                    setConfirmationModal(null);
                },
            });
        } else {
            setModal(null);
        }
    };

  // --- Handlers & Logic ---
  const addOrUpdate = async (type, data, options: { showToast?: boolean; toastMessage?: string; closeModal?: boolean; } = {}) => {
    const { showToast = true, toastMessage = 'Item saved successfully.', closeModal = true } = options;

    const apiMap = {
      customers: api.customersApi,
      devices: api.devicesApi,
      plans: api.plansApi,
      users: api.usersApi,
      userGroups: api.userGroupsApi,
      prefixes: api.prefixesApi,
      vlans: api.vlansApi,
      vlanDomains: api.vlanDomainsApi,
      l2vpns: api.l2VpnsApi,
      l3vpns: api.l3VpnsApi,
    };
    const entityApi = apiMap[type];
    if (!entityApi) return;

    try {
      if (data.id) { // Update
        await entityApi.update(data.id, data);
        if (data.tagIds && entityApi.saveTags) {
          await entityApi.saveTags(data.id, data.tagIds);
        }
      } else { // Add
        const newItem = await entityApi.create(data);
        if (data.tagIds && entityApi.saveTags) {
          await entityApi.saveTags(newItem.id, data.tagIds);
        }
      }
      
      await refreshEntity(type);
      if (showToast) addToast(toastMessage, 'success');
      if (closeModal) { setModal(null); setModalFormDirty(false); }
      refreshAuditLogs();
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    }
  };
  
    const addOrUpdateEnum = async (enumType: keyof Enumerations, data: EnumValue | Site | Rack) => {
        // Sites and Racks use their own API endpoints
        if (enumType === 'sites') {
            try {
                if (data.id) {
                    await api.sitesApi.update(data.id, data);
                } else {
                    await api.sitesApi.create(data);
                }
                await refreshEnums();
                addToast('Value saved successfully.', 'success');
                setModal(null); setModalFormDirty(false);
                refreshAuditLogs();
            } catch (err) { addToast(`Error: ${err.message}`, 'error'); }
            return;
        }
        if (enumType === 'racks') {
            try {
                if (data.id) {
                    await api.racksApi.update(data.id, data);
                } else {
                    await api.racksApi.create(data);
                }
                await refreshEnums();
                addToast('Value saved successfully.', 'success');
                setModal(null); setModalFormDirty(false);
                refreshAuditLogs();
            } catch (err) { addToast(`Error: ${err.message}`, 'error'); }
            return;
        }

        // Regular enum values
        try {
            const enumData = data as EnumValue;
            if (enumData.id) {
                await api.updateEnum(enumData.id, { label: enumData.label, color: enumData.color, ssid: enumData.ssid });
            } else {
                await api.createEnum({ category: enumType as string, label: enumData.label, color: enumData.color, ssid: enumData.ssid });
            }
            await refreshEnums();
            addToast('Value saved successfully.', 'success');
            setModal(null); setModalFormDirty(false);
            refreshAuditLogs();
        } catch (err) { addToast(`Error: ${err.message}`, 'error'); }
    };

    const addOrUpdateAddress = async (data: AddressValue) => {
        try {
            if (data.id) {
                await api.addressesApi.update(data.id, data);
            } else {
                await api.addressesApi.create(data);
            }
            await refreshEnums();
            addToast('Address saved successfully.', 'success');
            setModal(null); setModalFormDirty(false);
            refreshAuditLogs();
        } catch (err) { addToast(`Error: ${err.message}`, 'error'); }
    };

    const addOrUpdateDeviceTemplate = async (data: DeviceTemplate) => {
        try {
            if (data.id) {
                await api.deviceTemplatesApi.update(data.id, data);
            } else {
                await api.deviceTemplatesApi.create(data);
            }
            await refreshEnums();
            addToast('Device template saved successfully.', 'success');
            setModal(null); setModalFormDirty(false);
            refreshAuditLogs();
        } catch (err) { addToast(`Error: ${err.message}`, 'error'); }
    };

  const addComment = useCallback(async (planId: string, text: string) => {
    const currentUser = users.find(u => !u.isDeleted);
    if (!currentUser) {
        addToast('An active user is required to post comments.', 'error');
        return;
    }

    try {
      await api.createComment({
        plan_id: planId,
        user_id: currentUser.id,
        text,
      });

      await refreshComments();
      addToast('Comment added successfully.', 'success');
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    }
  }, [users, addToast, refreshComments]);

  // Column Reordering State
  const [customerColumnOrder, setCustomerColumnOrder] = useLocalStorageState<string[]>('crm_cols_customer', Object.keys(customerColumnConfig));
  const [deviceColumnOrder, setDeviceColumnOrder] = useLocalStorageState<string[]>('crm_cols_device', Object.keys(deviceColumnConfig));
  const [planColumnOrder, setPlanColumnOrder] = useLocalStorageState<string[]>('crm_cols_plan', Object.keys(planColumnConfig));
  const [userColumnOrder, setUserColumnOrder] = useLocalStorageState<string[]>('crm_cols_user', Object.keys(userColumnConfig));
  const [userGroupColumnOrder, setUserGroupColumnOrder] = useLocalStorageState<string[]>('crm_cols_user_group', Object.keys(userGroupColumnConfig));
  const [addressEnumColumnOrder, setAddressEnumColumnOrder] = useLocalStorageState<string[]>('crm_cols_address_enum', Object.keys(addressEnumColumnConfig));
  const [deviceTemplateColumnOrder, setDeviceTemplateColumnOrder] = useLocalStorageState<string[]>('crm_cols_device_template', Object.keys(deviceTemplateColumnConfig));
  const [siteColumnOrder, setSiteColumnOrder] = useLocalStorageState<string[]>('crm_cols_site', Object.keys(siteColumnConfig));
  const [rackColumnOrder, setRackColumnOrder] = useLocalStorageState<string[]>('crm_cols_rack', Object.keys(rackColumnConfig));
  const [prefixColumnOrder, setPrefixColumnOrder] = useLocalStorageState<string[]>('crm_cols_prefix', Object.keys(prefixColumnConfig));
  const [vlanColumnOrder, setVlanColumnOrder] = useLocalStorageState<string[]>('crm_cols_vlan', Object.keys(vlanColumnConfig));
  const [vlanDomainColumnOrder, setVlanDomainColumnOrder] = useLocalStorageState<string[]>('crm_cols_vlan_domain', Object.keys(vlanDomainColumnConfig));
  const [l2VpnColumnOrder, setL2VpnColumnOrder] = useLocalStorageState<string[]>('crm_cols_l2vpn', Object.keys(l2VpnColumnConfig));
  const [l3VpnColumnOrder, setL3VpnColumnOrder] = useLocalStorageState<string[]>('crm_cols_l3vpn', Object.keys(l3VpnColumnConfig));


  // Column Visibility State
  const [customerVisibleCols, setCustomerVisibleCols] = useLocalStorageState('crm_vis_customer', createInitialVisibility(customerColumnConfig, ['companyName', 'ico', 'dic', 'icDph', 'dob', 'idCardNumber', 'personalId', 'mobile', 'state', 'referenceNumber', 'descriptiveNumber']));
  const [deviceVisibleCols, setDeviceVisibleCols] = useLocalStorageState('crm_vis_device', createInitialVisibility(deviceColumnConfig, ['gpsLat', 'gpsLon', 'ssid']));
  const [planVisibleCols, setPlanVisibleCols] = useLocalStorageState('crm_vis_plan', createInitialVisibility(planColumnConfig));
  const [userVisibleCols, setUserVisibleCols] = useLocalStorageState('crm_vis_user', createInitialVisibility(userColumnConfig));
  const [userGroupVisibleCols, setUserGroupVisibleCols] = useLocalStorageState('crm_vis_user_group', createInitialVisibility(userGroupColumnConfig));
  const [addressEnumVisibleCols, setAddressEnumVisibleCols] = useLocalStorageState('crm_vis_address_enum', createInitialVisibility(addressEnumColumnConfig));
  const [deviceTemplateVisibleCols, setDeviceTemplateVisibleCols] = useLocalStorageState('crm_vis_device_template', createInitialVisibility(deviceTemplateColumnConfig));
  const [siteVisibleCols, setSiteVisibleCols] = useLocalStorageState('crm_vis_site', createInitialVisibility(siteColumnConfig));
  const [rackVisibleCols, setRackVisibleCols] = useLocalStorageState('crm_vis_rack', createInitialVisibility(rackColumnConfig));
  const [prefixVisibleCols, setPrefixVisibleCols] = useLocalStorageState('crm_vis_prefix', createInitialVisibility(prefixColumnConfig));
  const [vlanVisibleCols, setVlanVisibleCols] = useLocalStorageState('crm_vis_vlan', createInitialVisibility(vlanColumnConfig));
  const [vlanDomainVisibleCols, setVlanDomainVisibleCols] = useLocalStorageState('crm_vis_vlan_domain', createInitialVisibility(vlanDomainColumnConfig));
  const [l2VpnVisibleCols, setL2VpnVisibleCols] = useLocalStorageState('crm_vis_l2vpn', createInitialVisibility(l2VpnColumnConfig));
  const [l3VpnVisibleCols, setL3VpnVisibleCols] = useLocalStorageState('crm_vis_l3vpn', createInitialVisibility(l3VpnColumnConfig));


  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // --- Column D&D and Visibility Handlers ---
  const handleColDragStart = (e, colKey) => { setDraggedCol(colKey); e.dataTransfer.effectAllowed = 'move'; };
  const handleColDragEnd = () => { setDraggedCol(null); setDragOverCol(null); };
  const handleColDragOver = (e) => { e.preventDefault(); };
  const handleColDragEnter = (e, targetColKey) => { e.preventDefault(); if (draggedCol && draggedCol !== targetColKey) setDragOverCol(targetColKey); };
  const handleColDrop = (e, targetColKey, currentColOrder, setColOrder) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetColKey) { setDragOverCol(null); return; }
    const draggedIndex = currentColOrder.indexOf(draggedCol);
    const targetIndex = currentColOrder.indexOf(targetColKey);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const newOrder = [...currentColOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    setColOrder(newOrder);
    setDragOverCol(null);
    setDraggedCol(null);
  };
  const dndHandlers = { onColDragStart: handleColDragStart, onColDragEnd: handleColDragEnd, onColDragOver: handleColDragOver, onColDragEnter: handleColDragEnter, onColDrop: handleColDrop };
  
  const handleResetColumns = (setOrder, setVisibility, defaultConfig, defaultHidden = []) => {
      setOrder(Object.keys(defaultConfig));
      setVisibility(createInitialVisibility(defaultConfig, defaultHidden));
      setOpenDropdown(null);
  };

  // --- Import / Export ---
    const handleExport = (format: 'csv' | 'xls', type: 'customers' | 'devices' | 'plans' | 'users' | 'userGroups' | 'prefixes' | 'vlans' | 'vlanDomains' | 'l2vpns' | 'l3vpns') => {
        const dataSources = {
            customers: filteredCustomers,
            devices: filteredDevices,
            plans: filteredPlans,
            users: filteredUsers,
            userGroups: filteredUserGroups,
            prefixes: filteredPrefixes,
            vlans: filteredVlans,
            vlanDomains: filteredVlanDomains,
            l2vpns: filteredL2vpns,
            l3vpns: filteredL3vpns,
        };
        const columnConfigs = {
            customers: customerColumnConfig,
            devices: deviceColumnConfig,
            plans: planColumnConfig,
            users: userColumnConfig,
            userGroups: userGroupColumnConfig,
            prefixes: prefixColumnConfig,
            vlans: vlanColumnConfig,
            vlanDomains: vlanDomainColumnConfig,
            l2vpns: l2VpnColumnConfig,
            l3vpns: l3VpnColumnConfig,
        };
        const columnOrders = {
            customers: customerColumnOrder,
            devices: deviceColumnOrder,
            plans: planColumnOrder,
            users: userColumnOrder,
            userGroups: userGroupColumnOrder,
            prefixes: prefixColumnOrder,
            vlans: vlanColumnOrder,
            vlanDomains: vlanDomainColumnOrder,
            l2vpns: l2VpnColumnOrder,
            l3vpns: l3VpnColumnOrder,
        };
        const visibleColumns = {
            customers: customerVisibleCols,
            devices: deviceVisibleCols,
            plans: planVisibleCols,
            users: userVisibleCols,
            userGroups: userGroupVisibleCols,
            prefixes: prefixVisibleCols,
            vlans: vlanVisibleCols,
            vlanDomains: vlanDomainVisibleCols,
            l2vpns: l2VpnVisibleCols,
            l3vpns: l3VpnVisibleCols,
        };

        const data = dataSources[type];
        const config = columnConfigs[type];
        const order = columnOrders[type];
        const visible = visibleColumns[type];

        if (!data || !config || !order || !visible) return;

        const exportableColumns = order.filter(key => visible[key] && !config[key].isAction);
        let headers = exportableColumns.map(key => config[key].label);

        // For customers, split "Name" column into "First Name" and "Last Name"
        if (type === 'customers') {
            const nameIndex = headers.indexOf('Name');
            if (nameIndex !== -1) {
                headers.splice(nameIndex, 1, 'First Name', 'Last Name');
            }
        }

        const rows = data.map(item => {
            const rowData: (string | number)[] = [];
            exportableColumns.forEach(key => {
                if (type === 'customers' && key === 'name') {
                    rowData.push(item.firstName ?? '');
                    rowData.push(item.lastName ?? '');
                    return;
                }

                const colConfig = config[key];
                if (colConfig.exportValue) {
                    rowData.push(colConfig.exportValue(item));
                    return;
                }
                const renderOutput = colConfig.render(item);
                if (typeof renderOutput === 'string' || typeof renderOutput === 'number') {
                    rowData.push(renderOutput);
                } else if (renderOutput && renderOutput.props && renderOutput.props.children) {
                    const children = Array.isArray(renderOutput.props.children) ? renderOutput.props.children : [renderOutput.props.children];
                    rowData.push(children.filter(c => typeof c === 'string' || typeof c === 'number').join(''));
                } else {
                    rowData.push('');
                }
            });
            return rowData;
        });

        const escapeCsvCell = (cell) => {
            const strCell = String(cell ?? '');
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        };
        
        const fileExtension = format === 'csv' ? 'csv' : 'xlsx';
        const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        let fileContent: BlobPart;

        if (format === 'csv') {
            fileContent = [
                headers.map(escapeCsvCell).join(','),
                ...rows.map(row => row.map(escapeCsvCell).join(','))
            ].join('\n');
        } else { // xls
            if (!(window as any).XLSX) {
                addToast('Excel export library not available.', 'error');
                return;
            }
            const worksheet = (window as any).XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const workbook = (window as any).XLSX.utils.book_new();
            (window as any).XLSX.utils.book_append_sheet(workbook, worksheet, type);
            fileContent = (window as any).XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        }
        
        downloadFile(`${type}.${fileExtension}`, fileContent, mimeType);
        addToast(`Data exported to ${type}.${fileExtension}`, 'success');
        setOpenDropdown(null);
    };

    const processImportedData = (dataRows: any[][], headers: string[], type: 'customers' | 'devices' | 'plans' | 'users' | 'userGroups' | 'prefixes' | 'vlans' | 'vlanDomains' | 'l2vpns' | 'l3vpns') => {
        const config = allColumnConfigs[type];
        const labelToKeyMap = new Map<string, string>();
        Object.entries(config).forEach(([key, value]) => {
            labelToKeyMap.set(value.label.toLowerCase(), key);
        });

        const deviceNameToIdMap = new Map(devices.filter(d => d && d.name).map(d => [d.name.toLowerCase(), d.id]));
        const customerNameToIdMap = new Map(customers.filter(c => c && c.firstName && c.lastName).map(c => [`${c.firstName} ${c.lastName}`.toLowerCase(), c.id]));
        const userGroupNameToIdMap = new Map(userGroups.filter(g => g && g.name).map(g => [g.name.toLowerCase(), g.id]));
        const vlanDomainNameToIdMap = new Map(vlanDomains.filter(d => d && d.name).map(d => [d.name.toLowerCase(), d.id]));

        const newItems = dataRows.map(row => {
            const newItem: any = {};
            const processedHeaders = new Set<string>();
            const lowerCaseHeaders = headers.map(h => h.toLowerCase());

            // Handle customer name import specially to support both "Name" and "First Name"/"Last Name"
            if (type === 'customers') {
                const firstNameIndex = lowerCaseHeaders.indexOf('first name');
                const lastNameIndex = lowerCaseHeaders.indexOf('last name');
                const nameIndex = lowerCaseHeaders.indexOf('name');

                if (firstNameIndex !== -1 && lastNameIndex !== -1) {
                    newItem.firstName = row[firstNameIndex] || '';
                    newItem.lastName = row[lastNameIndex] || '';
                    processedHeaders.add('first name');
                    processedHeaders.add('last name');
                } else if (nameIndex !== -1) {
                    const nameValue = row[nameIndex] || '';
                    const parts = nameValue.split(' ');
                    newItem.firstName = parts[0] || '';
                    newItem.lastName = parts.slice(1).join(' ') || '';
                    processedHeaders.add('name');
                }
            }

            row.forEach((cellValue, index) => {
                const header = lowerCaseHeaders[index];
                if (processedHeaders.has(header)) return;

                const key = labelToKeyMap.get(header);
                if (!key) return;

                let value = cellValue;
                
                if (reverseEnumMaps[key]) {
                    value = reverseEnumMaps[key].get(String(cellValue).toLowerCase()) || null;
                }
                
                switch(key) {
                    case 'parentDevice':
                        value = deviceNameToIdMap.get(String(cellValue).toLowerCase()) || null;
                        break;
                    case 'customerId':
                        value = customerNameToIdMap.get(String(cellValue).toLowerCase()) || null;
                        break;
                    case 'groupId':
                        value = userGroupNameToIdMap.get(String(cellValue).toLowerCase()) || null;
                        break;
                    case 'domainId':
                        value = vlanDomainNameToIdMap.get(String(cellValue).toLowerCase()) || null;
                        break;
                }

                newItem[key] = value;
            });
            
            if (type === 'customers' && !newItem.customerNumber) {
                 newItem.customerNumber = `CUST-${Date.now().toString().slice(-6)}`;
            }

            return newItem;
        });

        const apiMap = {
          customers: api.customersApi,
          devices: api.devicesApi,
          plans: api.plansApi,
          users: api.usersApi,
          userGroups: api.userGroupsApi,
          prefixes: api.prefixesApi,
          vlans: api.vlansApi,
          vlanDomains: api.vlanDomainsApi,
          l2vpns: api.l2VpnsApi,
          l3vpns: api.l3VpnsApi,
        };
        const entityApi = apiMap[type];

        // Create items via API
        (async () => {
          let successCount = 0;
          for (const item of newItems) {
            try {
              const created = await entityApi.create(item);
              if (item.tagIds && entityApi.saveTags) {
                await entityApi.saveTags(created.id, item.tagIds);
              }
              successCount++;
            } catch (err) {
              console.error('Import item error:', err);
            }
          }
          await refreshEntity(type);
          addToast(`${successCount} items imported successfully to ${type}.`, 'success');
          setOpenDropdown(null);
          refreshAuditLogs();
        })();
    };

    const handleImport = (type: 'customers' | 'devices' | 'plans' | 'users' | 'userGroups' | 'prefixes' | 'vlans' | 'vlanDomains' | 'l2vpns' | 'l3vpns') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const data = event.target?.result;
                if (!data) {
                    addToast('Failed to read file.', 'error');
                    return;
                }

                try {
                    const workbook = (window as any).XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json: any[][] = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (json.length < 2) {
                        addToast('Import file is empty or has only a header row.', 'warning');
                        return;
                    }
                    const headers = json[0].map(h => String(h));
                    const dataRows = json.slice(1);
                    
                    processImportedData(dataRows, headers, type);

                } catch (error) {
                    console.error('Import error:', error);
                    addToast(`Failed to process the file. Error: ${error.message}`, 'error');
                }
            };
            reader.readAsBinaryString(file);
        };
        input.click();
    };

  const renderImportExportDropdown = (type: 'customers' | 'devices' | 'plans' | 'users' | 'userGroups' | 'prefixes' | 'vlans' | 'vlanDomains' | 'l2vpns' | 'l3vpns') => {
    let singularType: string;
    switch (type) {
        case 'userGroups':
            singularType = 'group';
            break;
        case 'prefixes':
            singularType = 'prefix';
            break;
        case 'l2vpns':
            singularType = 'l2vpn';
            break;
        case 'l3vpns':
            singularType = 'l3vpn';
            break;
        default:
            singularType = type.slice(0, -1);
            break;
    }
    
    return html`
        <div class="dropdown-container">
            <div class="split-button-container">
                <button class="btn btn-primary split-button-main" onClick=${() => setModal({ type: singularType })}>
                    Add
                </button>
                <button class="btn btn-primary split-button-toggle" onClick=${() => setOpenDropdown(openDropdown === `${type}-io` ? null : `${type}-io`)}>
                    ${icons.chevron}
                </button>
            </div>
            ${openDropdown === `${type}-io` && html`
                <div class="column-toggle-dropdown">
                    <div class="io-dropdown-section">
                        <div class="io-dropdown-header">Import</div>
                        <button class="io-dropdown-item" onClick=${() => handleImport(type)}>
                            ${icons.upload} Import from File...
                        </button>
                    </div>
                    <div class="io-dropdown-section">
                        <div class="io-dropdown-header">Export</div>
                        <button class="io-dropdown-item" onClick=${() => handleExport('csv', type)}>
                            ${icons.download} Export as CSV
                        </button>
                        <button class="io-dropdown-item" onClick=${() => handleExport('xls', type)}>
                            ${icons.download} Export as XLS
                        </button>
                    </div>
                </div>
            `}
        </div>
    `;
  };

    const renderEnumImportExportDropdown = (type: string) => (
    html`
        <div class="dropdown-container">
            <div class="split-button-container">
                <button class="btn btn-primary split-button-main" onClick=${() => {
                    // FIX: The `find` method can return undefined. Added a check for the result of `find` before accessing the 'label' property.
                    const allMenuItems = [...enumMenu.items, ...ipamMenu.items];
                    const menuItem = allMenuItems.find(i => i.key === type);

                    if (menuItem) {
                        const enumTypeName = menuItem.label;
                        let modalType = 'enum';
                        
                        let enumKeyForModal: string = type;
                        if (type === 'addresses') modalType = 'address';
                        if (type === 'templatesList') {
                            modalType = 'deviceTemplate';
                            enumKeyForModal = 'deviceTemplates'; // Map to correct key for Enumerations
                        }
                        if (type === 'sites') modalType = 'site';
                        if (type === 'racks') modalType = 'rack';
                        setModal({ type: modalType, enumType: enumKeyForModal as keyof Enumerations, enumTypeName: enumTypeName });
                    }
                }}>
                    Add
                </button>
                <button class="btn btn-primary split-button-toggle" onClick=${() => setOpenDropdown(openDropdown === `${String(type)}-io` ? null : `${String(type)}-io`)}>
                    ${icons.chevron}
                </button>
            </div>
             ${openDropdown === `${String(type)}-io` && html`
                 <div class="column-toggle-dropdown">
                     <div class="io-dropdown-section">
                        <div class="io-dropdown-header">Import</div>
                         <button class="io-dropdown-item" onClick=${() => addToast('Import for this enumeration is not yet supported.', 'info')}>
                            ${icons.upload} Import from File...
                        </button>
                    </div>
                    <div class="io-dropdown-section">
                        <div class="io-dropdown-header">Export</div>
                        <button class="io-dropdown-item" onClick=${() => addToast('Export for this enumeration is not yet supported.', 'info')}>
                            ${icons.download} Export as CSV
                        </button>
                        <button class="io-dropdown-item" onClick=${() => addToast('Export for this enumeration is not yet supported.', 'info')}>
                            ${icons.download} Export as XLS
                        </button>
                    </div>
                </div>
            `}
        </div>
    `
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return html`<${Dashboard} plans=${plans} customers=${customers} devices=${devices} enumerations=${enumerations} />`;
      case 'customers':
        const showCustomerFilters = showTableHeaderFilters && filteredCustomers.length >= minRecordsForFilters;
        return html`
            <div class="content-header">
                <h2>Customers</h2>
                <div class="header-actions">
                    <div class="search-input-container">
                        ${icons.search}
                        <input type="search" class="search-input" placeholder="Search customers..." value=${searchQueries.customers} onInput=${e => handleSearch('customers', e.currentTarget.value)} />
                    </div>
                    <div class="dropdown-container">
                        <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === 'customers' ? null : 'customers')} title="Toggle Columns">${icons.columns}</button>
                        ${openDropdown === 'customers' && html`<${ColumnToggleDropdown} columnConfig=${customerColumnConfig} visibleColumns=${customerVisibleCols} setVisibleColumns=${setCustomerVisibleCols} onReset=${() => handleResetColumns(setCustomerColumnOrder, setCustomerVisibleCols, customerColumnConfig, ['companyName', 'ico', 'dic', 'icDph', 'dob', 'idCardNumber', 'personalId', 'mobile', 'state', 'referenceNumber', 'descriptiveNumber'])} />`}
                    </div>
                    ${renderImportExportDropdown('customers')}
                </div>
            </div>
            <${Table}
                type="customers"
                data=${filteredCustomers}
                visibleCols=${customerVisibleCols}
                columnConfig=${customerColumnConfig}
                columnOrder=${customerColumnOrder}
                setColumnOrder=${setCustomerColumnOrder}
                dndHandlers=${dndHandlers}
                draggedCol=${draggedCol}
                dragOverCol=${dragOverCol}
                sortConfig=${sortConfig}
                handleSort=${handleSort}
                showFilters=${showCustomerFilters}
                advancedFilters=${advancedFilters}
                openFilterPopover=${openFilterPopover}
                setOpenFilterPopover=${setOpenFilterPopover}
                handleApplyFilter=${handleApplyFilter}
                handleClearFilter=${handleClearFilter}
                paginationConfig=${pagination.customers}
                handlePageChange=${handlePageChange}
            />
        `;
      case 'devices':
        const showDeviceFilters = showTableHeaderFilters && filteredDevices.length >= minRecordsForFilters;
        
        return html`
            <div class="content-header">
                <h2>Devices</h2>
                <div class="header-actions">
                    ${deviceView === 'list' && html`
                    <div class="search-input-container">
                        ${icons.search}
                        <input type="search" class="search-input" placeholder="Search devices..." value=${searchQueries.devices} onInput=${e => handleSearch('devices', e.currentTarget.value)} />
                    </div>
                    `}
                    <div class="view-toggle">
                        <button class=${deviceView === 'list' ? 'active' : ''} onClick=${() => setDeviceView('list')}>${icons.list} List</button>
                        <button class=${deviceView === 'tree' ? 'active' : ''} onClick=${() => setDeviceView('tree')}>${icons.tree} Tree</button>
                        <button class=${deviceView === 'map' ? 'active' : ''} onClick=${() => setDeviceView('map')}>${icons.map} Map</button>
                    </div>
                    ${deviceView === 'list' && html`
                    <div class="dropdown-container">
                        <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === 'devices' ? null : 'devices')} title="Toggle Columns">${icons.columns}</button>
                        ${openDropdown === 'devices' && html`<${ColumnToggleDropdown} columnConfig=${deviceColumnConfig} visibleColumns=${deviceVisibleCols} setVisibleColumns=${setDeviceVisibleCols} onReset=${() => handleResetColumns(setDeviceColumnOrder, setDeviceVisibleCols, deviceColumnConfig, ['gpsLat', 'gpsLon', 'ssid'])} />`}
                    </div>
                    `}
                    ${renderImportExportDropdown('devices')}
                </div>
            </div>
            ${deviceView === 'list' && html`
                <${Table}
                    type="devices"
                    data=${filteredDevices}
                    visibleCols=${deviceVisibleCols}
                    columnConfig=${deviceColumnConfig}
                    columnOrder=${deviceColumnOrder}
                    setColumnOrder=${setDeviceColumnOrder}
                    dndHandlers=${dndHandlers}
                    draggedCol=${draggedCol}
                    dragOverCol=${dragOverCol}
                    sortConfig=${sortConfig}
                    handleSort=${handleSort}
                    showFilters=${showDeviceFilters}
                    advancedFilters=${advancedFilters}
                    openFilterPopover=${openFilterPopover}
                    setOpenFilterPopover=${setOpenFilterPopover}
                    handleApplyFilter=${handleApplyFilter}
                    handleClearFilter=${handleClearFilter}
                    paginationConfig=${pagination.devices}
                    handlePageChange=${handlePageChange}
                />
            `}
            ${deviceView === 'tree' && html`<${DeviceTreeView} devices=${devices} deviceMap=${deviceMap} enumMaps=${enumMaps} setModal=${setModal} toggleDeleteStatus=${toggleDeleteStatus} addToast=${addToast} openRowActionDropdown=${openRowActionDropdown} setOpenRowActionDropdown=${setOpenRowActionDropdown} />`}
            ${deviceView === 'map' && html`<${DeviceMapView} devices=${devices} filteredDevices=${filteredDevices} setModal=${setModal} toggleDeleteStatus=${toggleDeleteStatus} addToast=${addToast} />`}
        `;
      case 'planning':
        const showPlanFilters = showTableHeaderFilters && filteredPlans.length >= minRecordsForFilters;

        return html`
            <div class="content-header">
                <h2>Planning</h2>
                <div class="header-actions">
                    ${planningView === 'list' && html`
                    <div class="search-input-container">
                        ${icons.search}
                        <input type="search" class="search-input" placeholder="Search plans..." value=${searchQueries.plans} onInput=${e => handleSearch('plans', e.currentTarget.value)} />
                    </div>
                    `}
                    <div class="view-toggle">
                        <button class=${planningView === 'list' ? 'active' : ''} onClick=${() => setPlanningView('list')}>${icons.list} List</button>
                        <button class=${planningView === 'calendar' ? 'active' : ''} onClick=${() => setPlanningView('calendar')}>${icons.planning} Calendar</button>
                    </div>
                    ${planningView === 'list' && html`
                    <div class="dropdown-container">
                        <button class="btn btn-secondary btn-icon" onClick=${() => setOpenDropdown(openDropdown === 'plans' ? null : 'plans')} title="Toggle Columns">${icons.columns}</button>
                        ${openDropdown === 'plans' && html`<${ColumnToggleDropdown} columnConfig=${planColumnConfig} visibleColumns=${planVisibleCols} setVisibleColumns=${setPlanVisibleCols} onReset=${() => handleResetColumns(setPlanColumnOrder, setPlanVisibleCols, planColumnConfig)} />`}
                    </div>
                    `}
                     ${renderImportExportDropdown('plans')}
                </div>
            </div>
            ${planningView === 'list' ? html`
                <${Table}
                    type="plans"
                    data=${filteredPlans}
                    visibleCols=${planVisibleCols}
                    columnConfig=${planColumnConfig}
                    columnOrder=${planColumnOrder}
                    setColumnOrder=${setPlanColumnOrder}
                    dndHandlers=${dndHandlers}
                    draggedCol=${draggedCol}
                    dragOverCol=${dragOverCol}
                    sortConfig=${sortConfig}
                    handleSort=${handleSort}
                    showFilters=${showPlanFilters}
                    advancedFilters=${advancedFilters}
                    openFilterPopover=${openFilterPopover}
                    setOpenFilterPopover=${setOpenFilterPopover}
                    handleApplyFilter=${handleApplyFilter}
                    handleClearFilter=${handleClearFilter}
                    paginationConfig=${pagination.plans}
                    handlePageChange=${handlePageChange}
                />
            ` : html`
                <${CalendarView} plans=${plans} setModal=${setModal} customerMap=${customerMap} deviceMap=${deviceMap} addOrUpdate=${addOrUpdate} enumMaps=${enumMaps} defaultPlanDuration=${defaultPlanDuration} />
            `}
        `;
      case 'ipamPrefixes':
      case 'ipamVlans':
      case 'ipamVpn':
        return html`<${IpamPage} 
            ...${{
                activeView,
                prefixes: filteredPrefixes,
                vlans: filteredVlans,
                vlanDomains: filteredVlanDomains,
                l2vpns: filteredL2vpns,
                l3vpns: filteredL3vpns,
                devices,
                setModal,
                toggleDeleteStatus,
                // Prefixes props
                prefixColumnConfig,
                prefixColumnOrder, setPrefixColumnOrder,
                prefixVisibleCols, setPrefixVisibleCols,
                handleResetPrefixCols: () => handleResetColumns(setPrefixColumnOrder, setPrefixVisibleCols, prefixColumnConfig),
                // VLANs props
                vlanColumnConfig,
                vlanColumnOrder, setVlanColumnOrder,
                vlanVisibleCols, setVlanVisibleCols,
                handleResetVlanCols: () => handleResetColumns(setVlanColumnOrder, setVlanVisibleCols, vlanColumnConfig),
                // VLAN Domains props
                vlanDomainColumnConfig,
                vlanDomainColumnOrder, setVlanDomainColumnOrder,
                vlanDomainVisibleCols, setVlanDomainVisibleCols,
                handleResetVlanDomainCols: () => handleResetColumns(setVlanDomainColumnOrder, setVlanDomainVisibleCols, vlanDomainColumnConfig),
                // VPN props
                l2VpnColumnConfig,
                l2VpnColumnOrder, setL2VpnColumnOrder,
                l2VpnVisibleCols, setL2VpnVisibleCols,
                handleResetL2VpnCols: () => handleResetColumns(setL2VpnColumnOrder, setL2VpnVisibleCols, l2VpnColumnConfig),
                l3VpnColumnConfig,
                l3VpnColumnOrder, setL3VpnColumnOrder,
                l3VpnVisibleCols, setL3VpnVisibleCols,
                handleResetL3VpnCols: () => handleResetColumns(setL3VpnColumnOrder, setL3VpnVisibleCols, l3VpnColumnConfig),

                openDropdown, setOpenDropdown, draggedCol, dndHandlers, dragOverCol,
                pagination, handlePageChange, searchQueries, handleSearch,
                sortConfig, handleSort, advancedFilters, openFilterPopover, setOpenFilterPopover,
                handleApplyFilter, handleClearFilter, showTableHeaderFilters, minRecordsForFilters, rowsPerPage,
                renderImportExportDropdown,
                openRowActionDropdown, setOpenRowActionDropdown,
            }}
        />`;
      case 'subnetCalculator':
        return html`<${SubnetCalculator} />`;
      case 'coinCounter':
        return html`<${CoinCounter} />`;
      case 'settings':
        return html`<${SettingsPage} 
            users=${filteredUsers}
            userGroups=${filteredUserGroups}
            setModal=${setModal}
            userColumnOrder=${userColumnOrder}
            setUserColumnOrder=${setUserColumnOrder}
            userColumnConfig=${userColumnConfig}
            userGroupColumnOrder=${userGroupColumnOrder}
            setUserGroupColumnOrder=${setUserGroupColumnOrder}
            userGroupColumnConfig=${userGroupColumnConfig}
            draggedCol=${draggedCol}
            dragOverCol=${dragOverCol}
            dndHandlers=${dndHandlers}
            userVisibleCols=${userVisibleCols}
            setUserVisibleCols=${setUserVisibleCols}
            userGroupVisibleCols=${userGroupVisibleCols}
            setUserGroupVisibleCols=${setUserGroupVisibleCols}
            openDropdown=${openDropdown}
            setOpenDropdown=${setOpenDropdown}
            enumerations=${enumerations}
            toggleEnumDeletedStatus=${toggleEnumDeletedStatus}
            filteredAddresses=${filteredAddresses}
            searchQueries=${searchQueries}
            handleSearch=${handleSearch}
            pagination=${pagination}
            handlePageChange=${handlePageChange}
            onResetUsers=${() => handleResetColumns(setUserColumnOrder, setUserVisibleCols, userColumnConfig)}
            onResetUserGroups=${() => handleResetColumns(setUserGroupColumnOrder, setUserGroupVisibleCols, userGroupColumnConfig)}
            renderImportExportDropdown=${renderImportExportDropdown}
            renderEnumImportExportDropdown=${renderEnumImportExportDropdown}
            addressEnumColumnConfig=${addressEnumColumnConfig}
            addressEnumColumnOrder=${addressEnumColumnOrder}
            setAddressEnumColumnOrder=${setAddressEnumColumnOrder}
            addressEnumVisibleCols=${addressEnumVisibleCols}
            setAddressEnumVisibleCols=${setAddressEnumVisibleCols}
            onResetAddressEnumCols=${() => handleResetColumns(setAddressEnumColumnOrder, setAddressEnumVisibleCols, addressEnumColumnConfig)}
            filteredDeviceTemplates=${filteredDeviceTemplates}
            deviceTemplateColumnConfig=${deviceTemplateColumnConfig}
            deviceTemplateColumnOrder=${deviceTemplateColumnOrder}
            setDeviceTemplateColumnOrder=${setDeviceTemplateColumnOrder}
            deviceTemplateVisibleCols=${deviceTemplateVisibleCols}
            setDeviceTemplateVisibleCols=${setDeviceTemplateVisibleCols}
            onResetDeviceTemplateCols=${() => handleResetColumns(setDeviceTemplateColumnOrder, setDeviceTemplateVisibleCols, deviceTemplateColumnConfig)}
            filteredSites=${filteredSites}
            siteColumnConfig=${siteColumnConfig}
            siteColumnOrder=${siteColumnOrder}
            setSiteColumnOrder=${setSiteColumnOrder}
            siteVisibleCols=${siteVisibleCols}
            setSiteVisibleCols=${setSiteVisibleCols}
            onResetSiteCols=${() => handleResetColumns(setSiteColumnOrder, setSiteVisibleCols, siteColumnConfig)}
            filteredRacks=${filteredRacks}
            rackColumnConfig=${rackColumnConfig}
            rackColumnOrder=${rackColumnOrder}
            setRackColumnOrder=${setRackColumnOrder}
            rackVisibleCols=${rackVisibleCols}
            setRackVisibleCols=${setRackVisibleCols}
            onResetRackCols=${() => handleResetColumns(setRackColumnOrder, setRackVisibleCols, rackColumnConfig)}
            isSidebarAutohide=${isSidebarAutohide}
            setSidebarAutohide=${setSidebarAutohide}
            toastOpacity=${toastOpacity}
            setToastOpacity=${setToastOpacity}
            theme=${theme}
            setTheme=${setTheme}
            toastPosition=${toastPosition}
            setToastPosition=${setToastPosition}
            toastTextColor=${toastTextColor}
            setToastTextColor=${setToastTextColor}
            isGlossy=${isGlossy}
            setGlossy=${setGlossy}
            advancedFilters=${advancedFilters}
            openFilterPopover=${openFilterPopover}
            setOpenFilterPopover=${setOpenFilterPopover}
            handleApplyFilter=${handleApplyFilter}
            handleClearFilter=${handleClearFilter}
            sortConfig=${sortConfig}
            handleSort=${handleSort}
            showTableHeaderFilters=${showTableHeaderFilters}
            setShowTableHeaderFilters=${setShowTableHeaderFilters}
            minRecordsForFilters=${minRecordsForFilters}
            setMinRecordsForFilters=${setMinRecordsForFilters}
            rowsPerPage=${rowsPerPage}
            setRowsPerPage=${setRowsPerPage}
            moduleVisibility=${moduleVisibility}
            setModuleVisibility=${setModuleVisibility}
            zabbixSettings=${zabbixSettings}
            setZabbixSettings=${setZabbixSettings}
            defaultPlanDuration=${defaultPlanDuration}
            setDefaultPlanDuration=${setDefaultPlanDuration}
            appName=${appName}
            setAppName=${setAppName}
            openRowActionDropdown=${openRowActionDropdown} 
            setOpenRowActionDropdown=${setOpenRowActionDropdown}
            settingsMenu=${settingsMenu}
        />`;
      default:
        return html`<${PlaceholderContent} title="Coming Soon" message="This feature is not yet available." />`;
    }
  };

  const renderModalContent = () => {
    if (!modal) return null;
    switch (modal.type) {
        case 'customer': return html`<${CustomerForm} onSubmit=${(data) => addOrUpdate('customers', data)} onCancel=${handleModalClose} customer=${modal.data} isEdit=${!!modal.data?.id} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'device': return html`<${DeviceForm} onSubmit=${(data) => addOrUpdate('devices', data)} onCancel=${handleModalClose} device=${modal.data} isEdit=${!!modal.data?.id} devices=${devices} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'plan': return html`<${PlanForm} onSubmit=${(data) => addOrUpdate('plans', data)} onCancel=${handleModalClose} plan=${modal.data} isEdit=${!!modal.data?.id} customers=${customers} devices=${devices} enumerations=${enumerations} setFormDirty=${setModalFormDirty} comments=${comments.filter(c => c.planId === modal.data?.id)} users=${users} onAddComment=${addComment} />`;
        case 'user': return html`<${UserForm} onSubmit=${(data) => addOrUpdate('users', data)} onCancel=${handleModalClose} user=${modal.data} isEdit=${!!modal.data?.id} userGroups=${userGroups} setFormDirty=${setModalFormDirty} />`;
        case 'group': return html`<${UserGroupForm} onSubmit=${(data) => addOrUpdate('userGroups', data)} onCancel=${handleModalClose} group=${modal.data} isEdit=${!!modal.data?.id} setFormDirty=${setModalFormDirty} />`;
        case 'enum': return html`<${EnumForm} onSubmit=${(data) => addOrUpdateEnum(modal.enumType, data)} onCancel=${handleModalClose} enumItem=${modal.data} isEdit=${!!modal.data?.id} enumTypeName=${modal.enumTypeName} setFormDirty=${setModalFormDirty} />`;
        case 'address': return html`<${AddressForm} onSubmit=${addOrUpdateAddress} onCancel=${handleModalClose} address=${modal.data} isEdit=${!!modal.data?.id} setFormDirty=${setModalFormDirty} />`;
        case 'deviceTemplate': return html`<${DeviceTemplateForm} onSubmit=${addOrUpdateDeviceTemplate} onCancel=${handleModalClose} template=${modal.data} isEdit=${!!modal.data?.id} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'site': return html`<${SiteForm} onSubmit=${(data) => addOrUpdateEnum('sites', data)} onCancel=${handleModalClose} site=${modal.data} isEdit=${!!modal.data?.id} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'rack': return html`<${RackForm} onSubmit=${(data) => addOrUpdateEnum('racks', data)} onCancel=${handleModalClose} rack=${modal.data} isEdit=${!!modal.data?.id} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'prefix': return html`<${PrefixForm} onSubmit=${(data) => addOrUpdate('prefixes', data)} onCancel=${handleModalClose} prefix=${modal.data} isEdit=${!!modal.data?.id} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'vlan': return html`<${VlanForm} onSubmit=${(data) => addOrUpdate('vlans', data)} onCancel=${handleModalClose} vlan=${modal.data} isEdit=${!!modal.data?.id} vlanDomains=${vlanDomains} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'vlanDomain': return html`<${VlanDomainForm} onSubmit=${(data) => addOrUpdate('vlanDomains', data)} onCancel=${handleModalClose} vlanDomain=${modal.data} isEdit=${!!modal.data?.id} vlanDomains=${vlanDomains} enumerations=${enumerations} setFormDirty=${setModalFormDirty} />`;
        case 'l2vpn': return html`<${L2VpnForm} onSubmit=${(data) => addOrUpdate('l2vpns', data)} onCancel=${handleModalClose} vpn=${modal.data} isEdit=${!!modal.data?.id} customers=${customers} enumerations=${enumerations} setFormDirty=${setModalFormDirty} companyLegalFormId=${companyLegalFormId} />`;
        case 'l3vpn': return html`<${L3VpnForm} onSubmit=${(data) => addOrUpdate('l3vpns', data)} onCancel=${handleModalClose} vpn=${modal.data} isEdit=${!!modal.data?.id} customers=${customers} enumerations=${enumerations} setFormDirty=${setModalFormDirty} companyLegalFormId=${companyLegalFormId} />`;
        case 'history': return html`<${HistoryModal} entityId=${modal.entityId} entityType=${modal.entityType} allLogs=${auditLog} getEntityName=${getEntityName} dataArrays=${dataArrays} onClose=${handleModalClose} allColumnConfigs=${allColumnConfigs} valueMaps=${allValueMaps} />`;
        case 'deviceDetails': return html`<${DeviceDetailsModal} device=${modal.data} allPlans=${plans} allDevices=${devices} allLogs=${auditLog} valueMaps=${allValueMaps} onClose=${handleModalClose} setModal=${setModal} setActiveView=${setActiveView} handleSearch=${handleSearch} addToast=${addToast} />`;
        case 'confirmation': return html`<${ConfirmationModal} ...${modal.data} onCancel=${() => { setConfirmationModal(null); handleModalClose(); }} />`;
        default: return null;
    }
  };
  
  const handleNavClick = (view, navId) => {
    setActiveView(view);
    setMenuOpen(false);
  };
  
  const handleNavGroupClick = (e, groupId) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNavs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const visibleNavConfig = navConfig.filter(item => {
    const visibilityKey = item.id === 'ipamPrefixes' || item.id === 'ipamVlans' ? 'ipam' : item.id;
    return moduleVisibility[visibilityKey] !== false;
  });

  return html`
    <div class="app-layout ${isMenuOpen ? 'sidebar-open' : ''} ${isSidebarAutohide ? 'sidebar-autohide-enabled' : ''}">
      <div class=${`sidebar ${isSidebarAutohide && !isSidebarHovered ? 'autohide' : ''}`} onMouseEnter=${() => setSidebarHovered(true)} onMouseLeave=${() => setSidebarHovered(false)}>
          <div class="sidebar-header">
              <div class="logo-container">
                  ${icons.logo}
                  <h1>${appName}</h1>
              </div>
               ${!isSidebarAutohide && html`
                <button class="pin-toggle" onClick=${() => setSidebarAutohide(true)} title="Autohide Sidebar">
                    ${icons.pinOff}
                </button>
               `}
          </div>
          <div class="sidebar-content-wrapper">
              <div class="global-search-container-mobile">
                 <div class="search-input-container">
                    ${icons.search}
                    <input
                        type="search"
                        class="search-input"
                        placeholder="Search everywhere..."
                        onSearch=${(e) => handleGlobalSearch(e.currentTarget.value)}
                        onKeyDown=${(e) => { if (e.key === 'Enter') handleGlobalSearch(e.currentTarget.value) }}
                    />
                </div>
            </div>
            <nav class="sidebar-nav">
                <ul class="nav-list">
                    ${visibleNavConfig.map(item => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedNavs.has(item.id);
                        const isActiveParent = hasSubItems && item.subItems.some(sub => sub.view === activeView);
                        
                        return html`
                            <li key=${item.id}>
                                <a 
                                    class=${`nav-item ${item.view === activeView ? 'active' : ''} ${isActiveParent ? 'active-parent' : ''}`}
                                    onClick=${() => hasSubItems ? handleNavGroupClick(event, item.id) : handleNavClick(item.view, item.id)}
                                >
                                    <div class="nav-item-group">
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            ${item.icon}
                                            <span>${item.label}</span>
                                        </div>
                                        ${hasSubItems && html`
                                            <span class="chevron ${isExpanded ? 'expanded' : ''}">${icons.chevron}</span>
                                        `}
                                    </div>
                                </a>
                                ${hasSubItems && html`
                                    <ul class="nav-submenu ${isExpanded ? 'expanded' : ''}">
                                        ${item.subItems.map(subItem => html`
                                            <li key=${subItem.id}>
                                                <a class="nav-submenu-item ${subItem.view === activeView ? 'active' : ''}" onClick=${() => handleNavClick(subItem.view, subItem.id)}>
                                                    ${subItem.label}
                                                </a>
                                            </li>
                                        `)}
                                    </ul>
                                `}
                            </li>
                        `
                    })}
                </ul>
            </nav>
          </div>
           ${isSidebarAutohide && html`
            <div style="padding: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <button class="pin-toggle" onClick=${() => setSidebarAutohide(false)} title="Pin Sidebar Open" style="width: 100%;">
                    ${icons.pin}
                </button>
            </div>
           `}
      </div>
      <div class="sidebar-overlay" onClick=${() => setMenuOpen(false)}></div>
      <div class="main-wrapper">
          <header class="app-header">
              <button class="menu-toggle" onClick=${() => setMenuOpen(!isMenuOpen)}>
                  ${icons.menu}
              </button>
              <div class="global-search-container">
                 <div class="search-input-container">
                    ${icons.search}
                    <input
                        type="search"
                        class="search-input"
                        placeholder="Search everywhere... (Press Enter)"
                        onKeyDown=${(e) => { if (e.key === 'Enter') handleGlobalSearch(e.currentTarget.value) }}
                    />
                </div>
              </div>
              <div class="header-user-menu">
                  <div class="user-info">
                    ${users.length > 0 ? `${users[0].name} ${users[0].surname}` : 'No User'}
                  </div>
              </div>
          </header>
          <main class="main-content">
              ${renderContent()}
          </main>
      </div>
       ${modal && html`<${Modal} onClose=${handleModalClose} customClass=${modal.type === 'deviceDetails' ? 'modal-device-details' : ''}>${renderModalContent()}<//>`}
       ${confirmationModal && html`<${Modal} onClose=${() => setConfirmationModal(null)}><${ConfirmationModal} ...${confirmationModal} onCancel=${() => setConfirmationModal(null)} /><//>`}
       ${isGlobalSearchOpen && html`<${GlobalSearchModal} query=${globalSearchQuery} results=${globalSearchResults} onClose=${() => setGlobalSearchOpen(false)} onResultClick=${handleResultClick} customerMap=${customerMap} deviceMap=${deviceMap} enumerations=${enumerations} />`}
    </div>
  `;
};
