
export type View =
    'dashboard' | 'customers' | 'devices' | 'ipamPrefixes' | 'ipamVlans' | 'ipamVpn' |
    'planning' | 'invoicing' | 'warehouse' | 'subnetCalculator' | 'coinCounter' | 'settings';

export type CalendarMode = 'year' | 'month' | 'week' | 'work-week' | 'day';

export interface BaseEntity {
    id: string;
    isDeleted?: boolean;
}

export interface Customer extends BaseEntity {
    customerNumber: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    ico?: string;
    dic?: string;
    icDph?: string;
    dob?: string;
    idCardNumber?: string;
    phone?: string;
    mobile?: string;
    email: string;
    personalId?: string;
    addressId: string;
    correspondenceAddressId?: string;
    legalForm: string;
}

export interface Site extends BaseEntity {
    name: string;
    addressId?: string;
    description?: string;
}

export interface Rack extends BaseEntity {
    name: string;
    siteId: string;
    uHeight: number;
    description?: string;
}

export interface NetworkDevice extends BaseEntity {
    name: string;
    vendor: string;
    deviceGroup: string;
    addressId?: string;
    gpsLat?: string;
    gpsLon?: string;
    parentDevice?: string;
    ipAddress: string;
    deviceType: string;
    ssid?: string;
    sshPort?: string;
    httpPort?: string;
    httpsPort?: string;
    apiPort?: string;
    apiUser?: string;
    apiPassword?: string;
    sshEnabled?: boolean;
    httpEnabled?: boolean;
    httpsEnabled?: boolean;
    apiEnabled?: boolean;
    rackId?: string;
    u_position?: number;
    u_height?: number;
}

export interface Plan extends BaseEntity {
    category: string;
    reportingMethod: string;
    priority: string;
    description: string;
    customerId?: string;
    deviceId?: string;
    scheduledFrom: string;
    scheduledTo?: string;
}

export interface User extends BaseEntity {
    name: string;
    surname: string;
    email: string;
    groupId: string;
}

export interface UserGroup extends BaseEntity {
    name: string;
    description?: string;
}

export interface AuditLogChange {
    field: string;
    oldValue: string;
    newValue: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: 'create' | 'update' | 'delete';
    entityType: string;
    entityId: string;
    entityName: string;
    details: AuditLogChange[];
    source: 'form' | 'import' | 'system';
}

export interface EnumValue extends BaseEntity {
    label: string;
    ssid?: boolean;
    color?: string;
}

export interface AddressValue extends BaseEntity {
    street: string;
    descriptiveNumber: string;
    referenceNumber?: string;
    city: string;
    zipCode: string;
    state: string;
    gpsLat?: string;
    gpsLon?: string;
}

export interface DeviceTemplate extends BaseEntity {
    name: string;
    vendorId: string;
    frontImage?: string;
    backImage?: string;
}

export interface Tag extends EnumValue {}

export interface Enumerations {
    vendor: EnumValue[];
    legalForm: EnumValue[];
    deviceGroup: EnumValue[];
    deviceType: EnumValue[];
    planCategory: EnumValue[];
    reportingMethod: EnumValue[];
    planPriority: EnumValue[];
    addresses: AddressValue[];
    deviceTemplates: DeviceTemplate[];
    ipamRoles: EnumValue[];
    tags: Tag[];
    l2VpnEncapsulation: EnumValue[];
    l2VpnMode: EnumValue[];
    l2VpnSignalization: EnumValue[];
    routeDistinguishers: EnumValue[];
    vpnTargets: EnumValue[];
    sites: Site[];
    racks: Rack[];
}

export interface Comment {
    id: string;
    planId: string;
    userId: string;
    timestamp: string;
    text: string;
}

export interface Prefix extends BaseEntity {
    prefix: string;
    name: string;
    roleId?: string;
    status: 'active' | 'container' | 'reserved';
    description?: string;
    tagIds: string[];
    isPool?: boolean;
    siteId?: string;
}

export interface VLAN extends BaseEntity {
    vlanId: number | null | ''; // Can be empty in form
    name: string;
    roleId?: string;
    domainId?: string;
    tagIds: string[];
    siteId?: string;
}

export interface VLANDomain extends BaseEntity {
    name: string;
    parentId?: string;
    description?: string;
    tagIds: string[];
}

export interface L2VPN extends BaseEntity {
    name: string;
    vcId: number | null | ''; // can be empty in form
    customerId?: string;
    description?: string;
    tagIds: string[];
    encapsulationId?: string;
    modeId?: string;
    signalizationIds?: string[];
}

export interface L3VPN extends BaseEntity {
    name: string;
    routeDistinguisher: string;
    importTarget?: string;
    exportTarget?: string;
    customerId?: string;
    description?: string;
    tagIds: string[];
}

export interface NavItem {
    id: string;
    label: string;
    icon: any; // preact component
    view?: View;
    subItems?: { id: string; label: string; view: View }[];
}

export interface ColumnDefinition<T> {
    label: string;
    render: (item: T) => any;
    exportValue?: (item: T) => string | number;
    sortType?: 'string' | 'number' | 'date';
    isAction?: boolean;
    filterType?: 'text' | 'select';
    filterOptions?: { value: string; label: string }[];
}

export type ColumnConfig<T> = {
    [K in keyof T | 'actions' | string]?: Partial<ColumnDefinition<T>>;
};
