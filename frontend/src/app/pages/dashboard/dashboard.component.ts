import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { DashboardStats } from '../../models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.customers || 0 }}</span>
          <span class="stat-label">Customers</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.devices || 0 }}</span>
          <span class="stat-label">Devices</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.plans || 0 }}</span>
          <span class="stat-label">Plans</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats?.users || 0 }}</span>
          <span class="stat-label">Users</span>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <h3>Plans by Category</h3>
        <canvas #planChart></canvas>
      </div>
      <div class="chart-card">
        <h3>Customers by Legal Form</h3>
        <canvas #customerChart></canvas>
      </div>
      <div class="chart-card">
        <h3>Devices by Type</h3>
        <canvas #deviceChart></canvas>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-primary,#333); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-card,#fff); border: 1px solid var(--border-color,#e0e0e0); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; }
    .stat-icon { font-size: 32px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary,#333); }
    .stat-label { font-size: 13px; color: var(--text-secondary,#888); }
    .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .chart-card { background: var(--bg-card,#fff); border: 1px solid var(--border-color,#e0e0e0); border-radius: 12px; padding: 20px; }
    .chart-card h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; color: var(--text-primary,#333); }
    canvas { max-height: 300px; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('planChart') planChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('customerChart') customerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('deviceChart') deviceChartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  private charts: Chart[] = [];

  constructor(private api: ApiService, private theme: ThemeService) {}

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {}

  loadStats() {
    this.api.getDashboardStats().subscribe(s => {
      this.stats = s;
      setTimeout(() => this.renderCharts(), 100);
    });
  }

  renderCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    if (this.stats?.plansByCategory?.length && this.planChartRef) {
      this.charts.push(new Chart(this.planChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.stats.plansByCategory.map(p => p.label),
          datasets: [{
            label: 'Plans',
            data: this.stats.plansByCategory.map(p => p.count),
            backgroundColor: this.stats.plansByCategory.map(p => p.color || '#3498db'),
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      }));
    }

    if (this.stats?.customersByLegalForm?.length && this.customerChartRef) {
      const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
      this.charts.push(new Chart(this.customerChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.stats.customersByLegalForm.map(c => c.label),
          datasets: [{
            data: this.stats.customersByLegalForm.map(c => c.count),
            backgroundColor: colors,
          }]
        },
        options: { responsive: true }
      }));
    }

    if (this.stats?.devicesByType?.length && this.deviceChartRef) {
      const colors = ['#1abc9c', '#e67e22', '#3498db', '#e74c3c', '#9b59b6'];
      this.charts.push(new Chart(this.deviceChartRef.nativeElement, {
        type: 'polarArea',
        data: {
          labels: this.stats.devicesByType.map(d => d.label),
          datasets: [{
            data: this.stats.devicesByType.map(d => d.count),
            backgroundColor: colors.map(c => c + '88'),
          }]
        },
        options: { responsive: true }
      }));
    }
  }
}
