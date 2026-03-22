import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SubnetInfo {
  network: string; broadcast: string; firstHost: string; lastHost: string;
  totalHosts: number; usableHosts: number; subnetMask: string; wildcardMask: string;
  cidr: number; binaryMask: string; ipClass: string;
}

@Component({
  selector: 'app-subnet-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header"><h1>Subnet Calculator</h1></div>
    <div class="calc-card">
      <div class="input-row">
        <div class="form-group"><label>IP Address / CIDR</label><input type="text" [(ngModel)]="ipInput" placeholder="192.168.1.0/24" class="form-control" (keyup.enter)="calculate()"></div>
        <button class="btn btn-primary" (click)="calculate()">Calculate</button>
      </div>
      @if (error) { <div class="error">{{ error }}</div> }
      @if (info) {
        <div class="result-grid">
          <div class="result-item"><span class="label">Network</span><span class="value">{{ info.network }}</span></div>
          <div class="result-item"><span class="label">Broadcast</span><span class="value">{{ info.broadcast }}</span></div>
          <div class="result-item"><span class="label">First Host</span><span class="value">{{ info.firstHost }}</span></div>
          <div class="result-item"><span class="label">Last Host</span><span class="value">{{ info.lastHost }}</span></div>
          <div class="result-item"><span class="label">Total Hosts</span><span class="value">{{ info.totalHosts | number }}</span></div>
          <div class="result-item"><span class="label">Usable Hosts</span><span class="value">{{ info.usableHosts | number }}</span></div>
          <div class="result-item"><span class="label">Subnet Mask</span><span class="value">{{ info.subnetMask }}</span></div>
          <div class="result-item"><span class="label">Wildcard Mask</span><span class="value">{{ info.wildcardMask }}</span></div>
          <div class="result-item"><span class="label">CIDR</span><span class="value">/{{ info.cidr }}</span></div>
          <div class="result-item"><span class="label">IP Class</span><span class="value">{{ info.ipClass }}</span></div>
          <div class="result-item full"><span class="label">Binary Mask</span><span class="value mono">{{ info.binaryMask }}</span></div>
        </div>
      }
      @if (subnets.length) {
        <h3>Subnet Breakdown</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Subnet</th><th>Network</th><th>First Host</th><th>Last Host</th><th>Broadcast</th><th>Hosts</th></tr></thead>
            <tbody>
              @for (s of subnets; track s.network) {
                <tr><td>{{ s.cidr }}</td><td>{{ s.network }}</td><td>{{ s.firstHost }}</td><td>{{ s.lastHost }}</td><td>{{ s.broadcast }}</td><td>{{ s.usableHosts | number }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 16px; } .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .calc-card { background: var(--bg-card,#fff); border-radius: 12px; border: 1px solid var(--border-color,#e5e7eb); padding: 24px; }
    .input-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 20px; }
    .input-row .form-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .input-row label { font-size: 13px; font-weight: 500; color: var(--text-secondary,#666); }
    .form-control { padding: 8px 12px; border: 1px solid var(--border-color,#ddd); border-radius: 8px; font-size: 14px; background: var(--bg-input,#fff); color: var(--text-primary,#333); }
    .btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #3498db; color: #fff; }
    .error { color: #e74c3c; margin-bottom: 12px; font-size: 14px; }
    .result-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .result-item { background: var(--bg-secondary,#f8f9fa); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .result-item.full { grid-column: 1 / -1; }
    .result-item .label { font-size: 12px; color: var(--text-secondary,#666); font-weight: 500; }
    .result-item .value { font-size: 15px; font-weight: 600; color: var(--text-primary,#333); }
    .mono { font-family: monospace; }
    h3 { margin: 16px 0 12px; font-size: 16px; font-weight: 600; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border-color,#eee); }
    th { font-weight: 600; color: var(--text-secondary,#666); font-size: 12px; }
  `]
})
export class SubnetCalculatorComponent {
  ipInput = '';
  info: SubnetInfo | null = null;
  error = '';
  subnets: SubnetInfo[] = [];

  calculate() {
    this.error = ''; this.info = null; this.subnets = [];
    const m = this.ipInput.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!m) { this.error = 'Invalid format. Use IP/CIDR (e.g. 192.168.1.0/24)'; return; }
    const ip = m[1]; const cidr = parseInt(m[2], 10);
    if (cidr < 0 || cidr > 32) { this.error = 'CIDR must be 0–32'; return; }
    const octets = ip.split('.').map(Number);
    if (octets.some(o => o < 0 || o > 255)) { this.error = 'Invalid IP octets'; return; }
    this.info = this.calcSubnet(octets, cidr);
    if (cidr < 30) { this.generateSubnets(octets, cidr); }
  }

  private ipToLong(o: number[]): number { return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0; }
  private longToIp(n: number): string { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }

  private calcSubnet(octets: number[], cidr: number): SubnetInfo {
    const ip = this.ipToLong(octets);
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = Math.pow(2, 32 - cidr);
    const usable = cidr >= 31 ? total : Math.max(total - 2, 0);
    const first = cidr >= 31 ? network : (network + 1) >>> 0;
    const last = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
    const maskOctets = [(mask >>> 24) & 255, (mask >>> 16) & 255, (mask >>> 8) & 255, mask & 255];
    const wild = (~mask >>> 0);
    const wildOctets = [(wild >>> 24) & 255, (wild >>> 16) & 255, (wild >>> 8) & 255, wild & 255];
    const binaryMask = maskOctets.map(o => o.toString(2).padStart(8, '0')).join('.');
    let ipClass = 'N/A';
    const fb = octets[0];
    if (fb < 128) ipClass = 'A'; else if (fb < 192) ipClass = 'B'; else if (fb < 224) ipClass = 'C'; else if (fb < 240) ipClass = 'D'; else ipClass = 'E';
    return {
      network: this.longToIp(network), broadcast: this.longToIp(broadcast), firstHost: this.longToIp(first), lastHost: this.longToIp(last),
      totalHosts: total, usableHosts: usable, subnetMask: maskOctets.join('.'), wildcardMask: wildOctets.join('.'),
      cidr, binaryMask, ipClass
    };
  }

  private generateSubnets(octets: number[], cidr: number) {
    const nextCidr = Math.min(cidr + 2, 30);
    const subnetSize = Math.pow(2, 32 - nextCidr);
    const ip = this.ipToLong(octets);
    const parentMask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const parentNetwork = (ip & parentMask) >>> 0;
    const parentBroadcast = (parentNetwork | (~parentMask >>> 0)) >>> 0;
    const maxSubnets = 16;
    let current = parentNetwork;
    let count = 0;
    while (current <= parentBroadcast && count < maxSubnets) {
      const sOctets = [(current >>> 24) & 255, (current >>> 16) & 255, (current >>> 8) & 255, current & 255];
      this.subnets.push(this.calcSubnet(sOctets, nextCidr));
      current = (current + subnetSize) >>> 0;
      count++;
    }
  }
}
