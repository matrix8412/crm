import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { ThemeService } from './services/theme.service';
import { ToastService, Toast } from './services/toast.service';
import { ModuleVisibility } from './models';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: { id: string; label: string; route: string }[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  appName = 'CRM Application';
  isMenuOpen = true;
  isSidebarHovered = false;
  sidebarAutohide = false;
  expandedNavs: Record<string, boolean> = {};
  searchQuery = '';
  searchResults: any = null;
  showSearch = false;
  toasts: Toast[] = [];
  toastPosition = 'top-right';
  toastOpacity = 0.95;
  toastTextColor = '#ffffff';
  glossyMode = false;
  moduleVisibility: ModuleVisibility = {
    customers: true, devices: true, ipam: true,
    planning: true, invoicing: true, warehouse: true, tools: true
  };

  navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { id: 'customers', label: 'Customers', icon: '👥', route: '/customers' },
    { id: 'devices', label: 'Devices', icon: '🖥️', route: '/devices' },
    { id: 'ipam', label: 'IPAM', icon: '🌐', children: [
      { id: 'prefixes', label: 'Prefixes', route: '/ipam/prefixes' },
      { id: 'vlans', label: 'VLANs', route: '/ipam/vlans' },
      { id: 'vpn', label: 'VPN', route: '/ipam/vpn' },
    ]},
    { id: 'planning', label: 'Planning', icon: '📅', route: '/planning' },
    { id: 'invoicing', label: 'Invoicing', icon: '💰', route: '' },
    { id: 'warehouse', label: 'Warehouse', icon: '📦', route: '' },
    { id: 'tools', label: 'Tools', icon: '🛠️', children: [
      { id: 'subnet-calculator', label: 'Subnet Calculator', route: '/tools/subnet-calculator' },
      { id: 'coin-counter', label: 'Coin Counter', route: '/tools/coin-counter' },
    ]},
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' },
  ];

  constructor(
    public router: Router,
    private api: ApiService,
    public theme: ThemeService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.toastService.toasts$.subscribe(t => this.toasts = t);
    this.loadSettings();
    // Reload settings when navigating away from settings page
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => this.loadSettings());
  }

  loadSettings() {
    this.api.getSettings().subscribe(s => {
      if (s['appName']) this.appName = s['appName'];
      if (s['sidebarAutohide'] !== undefined) this.sidebarAutohide = s['sidebarAutohide'];
      if (s['moduleVisibility']) this.moduleVisibility = s['moduleVisibility'] as ModuleVisibility;
      if (s['theme']) this.theme.setTheme(s['theme'] as string);
      if (s['glossyMode'] !== undefined) {
        this.glossyMode = s['glossyMode'];
        this.theme.setGlossy(this.glossyMode);
      }
      if (s['toastPosition'] !== undefined) this.toastPosition = s['toastPosition'] as string;
      if (s['toastOpacity'] !== undefined) this.toastOpacity = s['toastOpacity'] as number;
      if (s['toastTextColor'] !== undefined) this.toastTextColor = s['toastTextColor'] as string;
    });
  }

  get filteredNavItems(): NavItem[] {
    return this.navItems.filter(item => {
      const vis = this.moduleVisibility as any;
      if (vis[item.id] === false) return false;
      return true;
    });
  }

  toggleNav(id: string) {
    this.expandedNavs[id] = !this.expandedNavs[id];
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSearch() {
    if (this.searchQuery.length < 2) { this.searchResults = null; return; }
    this.api.globalSearch(this.searchQuery).subscribe(r => {
      this.searchResults = r;
      this.showSearch = true;
    });
  }

  closeSearch() {
    this.showSearch = false;
    this.searchResults = null;
    this.searchQuery = '';
  }

  goToResult(type: string, item: any) {
    this.closeSearch();
    if (type === 'customers') this.router.navigate(['/customers']);
    else if (type === 'devices') this.router.navigate(['/devices']);
    else if (type === 'plans') this.router.navigate(['/planning']);
  }

  removeToast(id: number) {
    this.toastService.remove(id);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
