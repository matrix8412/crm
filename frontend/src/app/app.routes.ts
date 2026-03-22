import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'customers', loadComponent: () => import('./pages/customers/customers.component').then(m => m.CustomersComponent) },
  { path: 'devices', loadComponent: () => import('./pages/devices/devices.component').then(m => m.DevicesComponent) },
  { path: 'planning', loadComponent: () => import('./pages/planning/planning.component').then(m => m.PlanningComponent) },
  { path: 'ipam/prefixes', loadComponent: () => import('./pages/ipam/prefixes.component').then(m => m.PrefixesComponent) },
  { path: 'ipam/vlans', loadComponent: () => import('./pages/ipam/vlans.component').then(m => m.VlansComponent) },
  { path: 'ipam/vpn', loadComponent: () => import('./pages/ipam/vpn.component').then(m => m.VpnComponent) },
  { path: 'tools/subnet-calculator', loadComponent: () => import('./pages/tools/subnet-calculator.component').then(m => m.SubnetCalculatorComponent) },
  { path: 'tools/coin-counter', loadComponent: () => import('./pages/tools/coin-counter.component').then(m => m.CoinCounterComponent) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: 'dashboard' },
];
