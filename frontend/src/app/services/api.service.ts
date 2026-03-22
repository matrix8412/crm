import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Customer, Device, Plan, Comment, User, UserGroup,
  EnumValue, Address, Site, Rack, DeviceTemplate,
  Prefix, Vlan, VlanDomain, L2Vpn, L3Vpn,
  AuditLog, DashboardStats, AppSettings
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  // ─── Generic CRUD ──────────────────────
  private list<T>(path: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.base}/${path}`);
  }
  private getOne<T>(path: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${path}/${id}`);
  }
  private create<T>(path: string, data: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.base}/${path}`, data);
  }
  private update<T>(path: string, id: string, data: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.base}/${path}/${id}`, data);
  }
  private toggleDel<T>(path: string, id: string): Observable<T> {
    return this.http.patch<T>(`${this.base}/${path}/${id}/toggle-delete`, {});
  }
  private remove(path: string, id: string): Observable<any> {
    return this.http.delete(`${this.base}/${path}/${id}`);
  }

  // ─── Customers ─────────────────────────
  getCustomers() { return this.list<Customer>('customers'); }
  getCustomer(id: string) { return this.getOne<Customer>('customers', id); }
  createCustomer(d: Partial<Customer>) { return this.create<Customer>('customers', d); }
  updateCustomer(id: string, d: Partial<Customer>) { return this.update<Customer>('customers', id, d); }
  toggleDeleteCustomer(id: string) { return this.toggleDel<Customer>('customers', id); }

  // ─── Devices ───────────────────────────
  getDevices() { return this.list<Device>('devices'); }
  getDevice(id: string) { return this.getOne<Device>('devices', id); }
  createDevice(d: Partial<Device>) { return this.create<Device>('devices', d); }
  updateDevice(id: string, d: Partial<Device>) { return this.update<Device>('devices', id, d); }
  toggleDeleteDevice(id: string) { return this.toggleDel<Device>('devices', id); }

  // ─── Plans ─────────────────────────────
  getPlans() { return this.list<Plan>('plans'); }
  getPlan(id: string) { return this.getOne<Plan>('plans', id); }
  createPlan(d: Partial<Plan>) { return this.create<Plan>('plans', d); }
  updatePlan(id: string, d: Partial<Plan>) { return this.update<Plan>('plans', id, d); }
  toggleDeletePlan(id: string) { return this.toggleDel<Plan>('plans', id); }

  // ─── Comments ──────────────────────────
  getComments(planId?: string) {
    const params = planId ? `?plan_id=${planId}` : '';
    return this.http.get<Comment[]>(`${this.base}/comments${params}`);
  }
  createComment(d: Partial<Comment>) { return this.create<Comment>('comments', d); }
  deleteComment(id: string) { return this.remove('comments', id); }

  // ─── Users ─────────────────────────────
  getUsers() { return this.list<User>('users'); }
  createUser(d: Partial<User>) { return this.create<User>('users', d); }
  updateUser(id: string, d: Partial<User>) { return this.update<User>('users', id, d); }
  toggleDeleteUser(id: string) { return this.toggleDel<User>('users', id); }

  // ─── User Groups ───────────────────────
  getUserGroups() { return this.list<UserGroup>('user-groups'); }
  createUserGroup(d: Partial<UserGroup>) { return this.create<UserGroup>('user-groups', d); }
  updateUserGroup(id: string, d: Partial<UserGroup>) { return this.update<UserGroup>('user-groups', id, d); }
  toggleDeleteUserGroup(id: string) { return this.toggleDel<UserGroup>('user-groups', id); }

  // ─── Enum Values ───────────────────────
  getEnums() { return this.list<EnumValue>('enums'); }
  getEnumsByCategory(cat: string) { return this.http.get<EnumValue[]>(`${this.base}/enums/${cat}`); }
  createEnum(d: Partial<EnumValue>) { return this.create<EnumValue>('enums', d); }
  updateEnum(id: string, d: Partial<EnumValue>) { return this.update<EnumValue>('enums', id, d); }
  toggleDeleteEnum(id: string) { return this.toggleDel<EnumValue>('enums', id); }

  // ─── Addresses ─────────────────────────
  getAddresses() { return this.list<Address>('addresses'); }
  createAddress(d: Partial<Address>) { return this.create<Address>('addresses', d); }
  updateAddress(id: string, d: Partial<Address>) { return this.update<Address>('addresses', id, d); }
  toggleDeleteAddress(id: string) { return this.toggleDel<Address>('addresses', id); }

  // ─── Sites ─────────────────────────────
  getSites() { return this.list<Site>('sites'); }
  createSite(d: Partial<Site>) { return this.create<Site>('sites', d); }
  updateSite(id: string, d: Partial<Site>) { return this.update<Site>('sites', id, d); }
  toggleDeleteSite(id: string) { return this.toggleDel<Site>('sites', id); }

  // ─── Racks ─────────────────────────────
  getRacks() { return this.list<Rack>('racks'); }
  createRack(d: Partial<Rack>) { return this.create<Rack>('racks', d); }
  updateRack(id: string, d: Partial<Rack>) { return this.update<Rack>('racks', id, d); }
  toggleDeleteRack(id: string) { return this.toggleDel<Rack>('racks', id); }

  // ─── Device Templates ──────────────────
  getDeviceTemplates() { return this.list<DeviceTemplate>('device-templates'); }
  createDeviceTemplate(d: Partial<DeviceTemplate>) { return this.create<DeviceTemplate>('device-templates', d); }
  updateDeviceTemplate(id: string, d: Partial<DeviceTemplate>) { return this.update<DeviceTemplate>('device-templates', id, d); }
  toggleDeleteDeviceTemplate(id: string) { return this.toggleDel<DeviceTemplate>('device-templates', id); }

  // ─── Prefixes ──────────────────────────
  getPrefixes() { return this.list<Prefix>('prefixes'); }
  createPrefix(d: Partial<Prefix>) { return this.create<Prefix>('prefixes', d); }
  updatePrefix(id: string, d: Partial<Prefix>) { return this.update<Prefix>('prefixes', id, d); }
  toggleDeletePrefix(id: string) { return this.toggleDel<Prefix>('prefixes', id); }

  // ─── VLANs ─────────────────────────────
  getVlans() { return this.list<Vlan>('vlans'); }
  createVlan(d: Partial<Vlan>) { return this.create<Vlan>('vlans', d); }
  updateVlan(id: string, d: Partial<Vlan>) { return this.update<Vlan>('vlans', id, d); }
  toggleDeleteVlan(id: string) { return this.toggleDel<Vlan>('vlans', id); }

  // ─── VLAN Domains ──────────────────────
  getVlanDomains() { return this.list<VlanDomain>('vlan-domains'); }
  createVlanDomain(d: Partial<VlanDomain>) { return this.create<VlanDomain>('vlan-domains', d); }
  updateVlanDomain(id: string, d: Partial<VlanDomain>) { return this.update<VlanDomain>('vlan-domains', id, d); }
  toggleDeleteVlanDomain(id: string) { return this.toggleDel<VlanDomain>('vlan-domains', id); }

  // ─── L2 VPNs ───────────────────────────
  getL2Vpns() { return this.list<L2Vpn>('l2-vpns'); }
  createL2Vpn(d: Partial<L2Vpn>) { return this.create<L2Vpn>('l2-vpns', d); }
  updateL2Vpn(id: string, d: Partial<L2Vpn>) { return this.update<L2Vpn>('l2-vpns', id, d); }
  toggleDeleteL2Vpn(id: string) { return this.toggleDel<L2Vpn>('l2-vpns', id); }

  // ─── L3 VPNs ───────────────────────────
  getL3Vpns() { return this.list<L3Vpn>('l3-vpns'); }
  createL3Vpn(d: Partial<L3Vpn>) { return this.create<L3Vpn>('l3-vpns', d); }
  updateL3Vpn(id: string, d: Partial<L3Vpn>) { return this.update<L3Vpn>('l3-vpns', id, d); }
  toggleDeleteL3Vpn(id: string) { return this.toggleDel<L3Vpn>('l3-vpns', id); }

  // ─── Tags ──────────────────────────────
  getTags(entityPath: string, id: string) {
    return this.http.get<string[]>(`${this.base}/${entityPath}/${id}/tags`);
  }
  setTags(entityPath: string, id: string, tagIds: string[]) {
    return this.http.put(`${this.base}/${entityPath}/${id}/tags`, { tagIds });
  }

  // ─── Audit Logs ────────────────────────
  getAuditLogs(entityType?: string, entityId?: string) {
    const params: string[] = [];
    if (entityType) params.push(`entity_type=${entityType}`);
    if (entityId) params.push(`entity_id=${entityId}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.http.get<AuditLog[]>(`${this.base}/audit-logs${qs}`);
  }

  // ─── Settings ──────────────────────────
  getSettings() { return this.http.get<Record<string, any>>(`${this.base}/settings`); }
  updateSetting(key: string, value: any) {
    return this.http.put(`${this.base}/settings/${key}`, { value });
  }

  // ─── Dashboard ─────────────────────────
  getDashboardStats() { return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`); }

  // ─── Global Search ─────────────────────
  globalSearch(q: string) {
    return this.http.get<{ customers: Customer[]; devices: Device[]; plans: Plan[] }>(
      `${this.base}/search?q=${encodeURIComponent(q)}`
    );
  }

  // ─── Health ────────────────────────────
  health() { return this.http.get(`${this.base}/health`); }
}
