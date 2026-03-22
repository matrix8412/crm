
const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Case conversion utilities ───────────────────────────────
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function mapKeys(obj: any, fn: (key: string) => string): any {
  if (Array.isArray(obj)) return obj.map(item => mapKeys(item, fn));
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[fn(key)] = mapKeys(obj[key], fn);
    }
    return result;
  }
  return obj;
}

function toCamel(obj: any): any { return mapKeys(obj, snakeToCamel); }
function toSnake(obj: any): any { return mapKeys(obj, camelToSnake); }

// ─── Field mapping (frontend ↔ backend differences) ──────────
// The backend DB uses _id suffix for foreign keys, but frontend types don't always match
const FIELD_MAP_TO_FRONTEND: Record<string, Record<string, string>> = {
  customers: { legalFormId: 'legalForm', dateOfBirth: 'dob' },
  devices: { vendorId: 'vendor', deviceGroupId: 'deviceGroup', deviceTypeId: 'deviceType', parentDeviceId: 'parentDevice', rackPosition: 'u_position', rackHeight: 'u_height' },
  plans: { categoryId: 'category', reportingMethodId: 'reportingMethod', priorityId: 'priority' },
  comments: { createdAt: 'timestamp' },
  vlanDomains: { parentDomainId: 'parentId' },
};

const FIELD_MAP_TO_BACKEND: Record<string, Record<string, string>> = {};
// Build reverse maps
for (const entity of Object.keys(FIELD_MAP_TO_FRONTEND)) {
  FIELD_MAP_TO_BACKEND[entity] = {};
  for (const [beKey, feKey] of Object.entries(FIELD_MAP_TO_FRONTEND[entity])) {
    FIELD_MAP_TO_BACKEND[entity][feKey] = beKey;
  }
}

function applyFieldMap(obj: any, fieldMap: Record<string, string>): any {
  if (!fieldMap) return obj;
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = fieldMap[key] || key;
    result[mappedKey] = value;
  }
  return result;
}

function fromBackend(entity: string, data: any): any {
  const camelData = toCamel(data);
  const map = FIELD_MAP_TO_FRONTEND[entity];
  if (!map) return camelData;
  if (Array.isArray(camelData)) return camelData.map(item => applyFieldMap(item, map));
  return applyFieldMap(camelData, map);
}

function toBackend(entity: string, data: any): any {
  const map = FIELD_MAP_TO_BACKEND[entity];
  const mapped = map ? applyFieldMap(data, map) : { ...data };
  // Remove frontend-only fields
  delete mapped.isDeleted;
  delete mapped.id;
  delete mapped.tagIds;
  return toSnake(mapped);
}

// ─── ENUMERATIONS ────────────────────────────────────────────
export async function fetchEnums(): Promise<any[]> {
  const rows = await request<any[]>('/enums');
  return rows.map(r => toCamel(r));
}

export async function createEnum(data: { category: string; label: string; color?: string; ssid?: boolean }): Promise<any> {
  const row = await request<any>('/enums', { method: 'POST', body: JSON.stringify(data) });
  return toCamel(row);
}

export async function updateEnum(id: string, data: { label: string; color?: string; ssid?: boolean }): Promise<any> {
  const row = await request<any>(`/enums/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  return toCamel(row);
}

export async function toggleEnumDelete(id: string): Promise<any> {
  const row = await request<any>(`/enums/${encodeURIComponent(id)}/toggle-delete`, { method: 'PATCH' });
  return toCamel(row);
}

// ─── GENERIC CRUD ────────────────────────────────────────────
async function fetchAll(entityPath: string, entityKey: string): Promise<any[]> {
  const rows = await request<any[]>(`/${entityPath}`);
  return rows.map(r => fromBackend(entityKey, r));
}

async function createOne(entityPath: string, entityKey: string, data: any): Promise<any> {
  const body = toBackend(entityKey, data);
  const row = await request<any>(`/${entityPath}`, { method: 'POST', body: JSON.stringify(body) });
  return fromBackend(entityKey, row);
}

async function updateOne(entityPath: string, entityKey: string, id: string, data: any): Promise<any> {
  const body = toBackend(entityKey, data);
  const row = await request<any>(`/${entityPath}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) });
  return fromBackend(entityKey, row);
}

async function toggleDelete(entityPath: string, entityKey: string, id: string): Promise<any> {
  const row = await request<any>(`/${entityPath}/${encodeURIComponent(id)}/toggle-delete`, { method: 'PATCH' });
  return fromBackend(entityKey, row);
}

async function hardDelete(entityPath: string, id: string): Promise<void> {
  await request(`/${entityPath}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── TAG OPERATIONS ──────────────────────────────────────────
async function fetchTags(entityPath: string, id: string): Promise<string[]> {
  return request<string[]>(`/${entityPath}/${encodeURIComponent(id)}/tags`);
}

async function saveTags(entityPath: string, id: string, tagIds: string[]): Promise<void> {
  await request(`/${entityPath}/${encodeURIComponent(id)}/tags`, { method: 'PUT', body: JSON.stringify({ tagIds }) });
}

// ─── ENTITY-SPECIFIC API ────────────────────────────────────
function entityApi(entityPath: string, entityKey: string) {
  return {
    fetchAll: () => fetchAll(entityPath, entityKey),
    create: (data: any) => createOne(entityPath, entityKey, data),
    update: (id: string, data: any) => updateOne(entityPath, entityKey, id, data),
    toggleDelete: (id: string) => toggleDelete(entityPath, entityKey, id),
    delete: (id: string) => hardDelete(entityPath, id),
  };
}

function entityApiWithTags(entityPath: string, entityKey: string) {
  return {
    ...entityApi(entityPath, entityKey),
    fetchTags: (id: string) => fetchTags(entityPath, id),
    saveTags: (id: string, tagIds: string[]) => saveTags(entityPath, id, tagIds),
  };
}

export const customersApi = entityApi('customers', 'customers');
export const usersApi = entityApi('users', 'users');
export const userGroupsApi = entityApi('user-groups', 'userGroups');
export const devicesApi = entityApi('devices', 'devices');
export const plansApi = entityApi('plans', 'plans');
export const addressesApi = entityApi('addresses', 'addresses');
export const deviceTemplatesApi = entityApi('device-templates', 'deviceTemplates');
export const sitesApi = entityApi('sites', 'sites');
export const racksApi = entityApi('racks', 'racks');
export const prefixesApi = entityApiWithTags('prefixes', 'prefixes');
export const vlansApi = entityApiWithTags('vlans', 'vlans');
export const vlanDomainsApi = entityApiWithTags('vlan-domains', 'vlanDomains');
export const l2VpnsApi = entityApiWithTags('l2-vpns', 'l2vpns');
export const l3VpnsApi = entityApiWithTags('l3-vpns', 'l3vpns');

// ─── COMMENTS ────────────────────────────────────────────────
export async function fetchComments(planId?: string): Promise<any[]> {
  const qs = planId ? `?plan_id=${encodeURIComponent(planId)}` : '';
  const rows = await request<any[]>(`/comments${qs}`);
  return rows.map(r => fromBackend('comments', r));
}

export async function createComment(data: { plan_id: string; user_id: string; text: string }): Promise<any> {
  const row = await request<any>('/comments', { method: 'POST', body: JSON.stringify(data) });
  return fromBackend('comments', row);
}

export async function deleteComment(id: string): Promise<void> {
  await request(`/comments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── AUDIT LOGS ──────────────────────────────────────────────
export async function fetchAuditLogs(entityType?: string, entityId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (entityType) params.set('entity_type', entityType);
  if (entityId) params.set('entity_id', entityId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const rows = await request<any[]>(`/audit-logs${qs}`);
  return rows.map(r => toCamel(r));
}

// ─── SETTINGS ────────────────────────────────────────────────
export async function fetchSettings(): Promise<Record<string, any>> {
  return request<Record<string, any>>('/settings');
}

export async function saveSetting(key: string, value: any): Promise<void> {
  await request(`/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) });
}

// ─── DASHBOARD ───────────────────────────────────────────────
export async function fetchDashboardStats(): Promise<any> {
  return request('/dashboard/stats');
}

// ─── GLOBAL SEARCH ───────────────────────────────────────────
export async function globalSearch(q: string): Promise<any> {
  const data = await request<any>(`/search?q=${encodeURIComponent(q)}`);
  return {
    customers: (data.customers || []).map((r: any) => fromBackend('customers', r)),
    devices: (data.devices || []).map((r: any) => fromBackend('devices', r)),
    plans: (data.plans || []).map((r: any) => fromBackend('plans', r)),
  };
}

// ─── CURRENCIES ──────────────────────────────────────────────
export async function fetchCurrencies(): Promise<any[]> {
  const rows = await request<any[]>('/currencies');
  return rows.map(r => toCamel(r));
}

// ─── HEALTH ──────────────────────────────────────────────────
export async function checkHealth(): Promise<{ status: string; database: string }> {
  return request('/health');
}

// ─── Helper: Fetch all data for initial load ─────────────────
export async function fetchAllData() {
  const [
    enumRows,
    customers,
    users,
    userGroups,
    devices,
    plans,
    comments,
    auditLogs,
    addresses,
    deviceTemplates,
    sites,
    racks,
    prefixes,
    vlans,
    vlanDomains,
    l2vpns,
    l3vpns,
    settings,
  ] = await Promise.all([
    fetchEnums(),
    customersApi.fetchAll(),
    usersApi.fetchAll(),
    userGroupsApi.fetchAll(),
    devicesApi.fetchAll(),
    plansApi.fetchAll(),
    fetchComments(),
    fetchAuditLogs(),
    addressesApi.fetchAll(),
    deviceTemplatesApi.fetchAll(),
    sitesApi.fetchAll(),
    racksApi.fetchAll(),
    prefixesApi.fetchAll(),
    vlansApi.fetchAll(),
    vlanDomainsApi.fetchAll(),
    l2VpnsApi.fetchAll(),
    l3VpnsApi.fetchAll(),
    fetchSettings(),
  ]);

  // Fetch tags for IPAM entities
  const [prefixesWithTags, vlansWithTags, vlanDomainsWithTags, l2vpnsWithTags, l3vpnsWithTags] = await Promise.all([
    Promise.all(prefixes.map(async (p: any) => ({ ...p, tagIds: await prefixesApi.fetchTags(p.id) }))),
    Promise.all(vlans.map(async (v: any) => ({ ...v, tagIds: await vlansApi.fetchTags(v.id) }))),
    Promise.all(vlanDomains.map(async (d: any) => ({ ...d, tagIds: await vlanDomainsApi.fetchTags(d.id) }))),
    Promise.all(l2vpns.map(async (v: any) => ({ ...v, tagIds: await l2VpnsApi.fetchTags(v.id) }))),
    Promise.all(l3vpns.map(async (v: any) => ({ ...v, tagIds: await l3VpnsApi.fetchTags(v.id) }))),
  ]);

  // Group enums by category
  const enumerations: Record<string, any[]> = {};
  for (const row of enumRows) {
    const cat = row.category;
    if (!enumerations[cat]) enumerations[cat] = [];
    enumerations[cat].push({ id: row.id, label: row.label, color: row.color, ssid: row.ssid, isDeleted: row.isDeleted });
  }

  return {
    enumerations: {
      vendor: enumerations['vendor'] || [],
      legalForm: enumerations['legalForm'] || [],
      deviceGroup: enumerations['deviceGroup'] || [],
      deviceType: enumerations['deviceType'] || [],
      planCategory: enumerations['planCategory'] || [],
      reportingMethod: enumerations['reportingMethod'] || [],
      planPriority: enumerations['planPriority'] || [],
      addresses,
      deviceTemplates,
      ipamRoles: enumerations['ipamRoles'] || [],
      tags: enumerations['tags'] || [],
      l2VpnEncapsulation: enumerations['l2VpnEncapsulation'] || [],
      l2VpnMode: enumerations['l2VpnMode'] || [],
      l2VpnSignalization: enumerations['l2VpnSignalization'] || [],
      routeDistinguishers: enumerations['routeDistinguishers'] || [],
      vpnTargets: enumerations['vpnTargets'] || [],
      sites,
      racks,
    },
    customers,
    users,
    userGroups,
    devices,
    plans,
    comments,
    auditLogs,
    prefixes: prefixesWithTags,
    vlans: vlansWithTags,
    vlanDomains: vlanDomainsWithTags,
    l2vpns: l2vpnsWithTags,
    l3vpns: l3vpnsWithTags,
    settings,
  };
}
