// ─── Base ─────────────────────────────────
export interface BaseEntity {
  id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Enum Value ──────────────────────────
export interface EnumValue extends BaseEntity {
  category: string;
  label: string;
  color?: string;
  ssid?: boolean;
}

// ─── Address ─────────────────────────────
export interface Address extends BaseEntity {
  street: string;
  descriptive_number: string;
  reference_number?: string;
  city: string;
  zip_code: string;
  state: string;
  gps_lat?: number;
  gps_lon?: number;
}

// ─── Site ────────────────────────────────
export interface Site extends BaseEntity {
  name: string;
  address_id?: string;
  description?: string;
}

// ─── Rack ────────────────────────────────
export interface Rack extends BaseEntity {
  name: string;
  site_id: string;
  u_height: number;
  description?: string;
}

// ─── Customer ────────────────────────────
export interface Customer extends BaseEntity {
  customer_number: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  ico?: string;
  dic?: string;
  ic_dph?: string;
  personal_id?: string;
  id_card_number?: string;
  date_of_birth?: string;
  address_id?: string;
  correspondence_address_id?: string;
  email: string;
  phone?: string;
  mobile?: string;
  legal_form_id?: string;
}

// ─── User Group ──────────────────────────
export interface UserGroup extends BaseEntity {
  name: string;
  description?: string;
}

// ─── User ────────────────────────────────
export interface User extends BaseEntity {
  name: string;
  surname?: string;
  email?: string;
  group_id?: string;
}

// ─── Device ──────────────────────────────
export interface Device extends BaseEntity {
  name: string;
  vendor_id?: string;
  device_group_id?: string;
  address_id?: string;
  gps_lat?: number;
  gps_lon?: number;
  parent_device_id?: string;
  ip_address?: string;
  device_type_id?: string;
  ssid?: string;
  ssh_enabled: boolean;
  ssh_port?: number;
  ssh_user?: string;
  ssh_password?: string;
  http_enabled: boolean;
  http_port?: number;
  https_enabled: boolean;
  https_port?: number;
  api_enabled: boolean;
  api_port?: number;
  api_user?: string;
  api_password?: string;
  rack_id?: string;
  rack_position?: number;
  rack_height?: number;
}

// ─── Plan ────────────────────────────────
export interface Plan extends BaseEntity {
  category_id?: string;
  reporting_method_id?: string;
  priority_id?: string;
  description: string;
  customer_id?: string;
  device_id?: string;
  scheduled_from?: string;
  scheduled_to?: string;
}

// ─── Comment ─────────────────────────────
export interface Comment {
  id: string;
  plan_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

// ─── Device Template ─────────────────────
export interface DeviceTemplate extends BaseEntity {
  name: string;
  vendor_id?: string;
  front_image?: string;
  back_image?: string;
}

// ─── VLAN Domain ─────────────────────────
export interface VlanDomain extends BaseEntity {
  name: string;
  parent_domain_id?: string;
  description?: string;
}

// ─── VLAN ────────────────────────────────
export interface Vlan extends BaseEntity {
  vlan_id: number;
  name?: string;
  domain_id?: string;
  role_id?: string;
  site_id?: string;
}

// ─── Prefix ──────────────────────────────
export interface Prefix extends BaseEntity {
  prefix: string;
  name?: string;
  status: 'active' | 'container' | 'reserved';
  role_id?: string;
  site_id?: string;
  is_pool: boolean;
  description?: string;
}

// ─── L2 VPN ──────────────────────────────
export interface L2Vpn extends BaseEntity {
  name: string;
  vc_id?: string;
  customer_id?: string;
  description?: string;
  encapsulation_id?: string;
  mode_id?: string;
  signalization_id?: string;
}

// ─── L3 VPN ──────────────────────────────
export interface L3Vpn extends BaseEntity {
  name: string;
  route_distinguisher?: string;
  import_target?: string;
  export_target?: string;
  customer_id?: string;
  description?: string;
}

// ─── Audit Log ───────────────────────────
export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  entity_name: string;
  details: { field: string; oldValue: string; newValue: string }[];
  source: 'form' | 'import' | 'system';
}

// ─── Settings ────────────────────────────
export interface AppSettings {
  appName: string;
  theme: 'light' | 'dark' | 'system';
  sidebarAutohide: boolean;
  toastOpacity: number;
  toastPosition: string;
  toastTextColor: string;
  glossyMode: boolean;
  rowsPerPage: number;
  showTableHeaderFilters: boolean;
  minRecordsForFilters: number;
  defaultPlanDuration: number;
  moduleVisibility: ModuleVisibility;
  zabbixSettings: ZabbixSettings;
}

export interface ModuleVisibility {
  customers: boolean;
  devices: boolean;
  ipam: boolean;
  planning: boolean;
  invoicing: boolean;
  warehouse: boolean;
  tools: boolean;
}

export interface ZabbixSettings {
  enabled: boolean;
  url: string;
  apiKey: string;
}

// ─── Dashboard Stats ─────────────────────
export interface DashboardStats {
  customers: number;
  devices: number;
  plans: number;
  users: number;
  plansByCategory: { label: string; color: string; count: number }[];
  customersByLegalForm: { label: string; count: number }[];
  devicesByType: { label: string; count: number }[];
}

// ─── Sort Config ─────────────────────────
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | '';
}

// ─── Column Config ───────────────────────
export interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'actions';
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { value: string; label: string }[];
  visible?: boolean;
  render?: (item: any) => string;
}
