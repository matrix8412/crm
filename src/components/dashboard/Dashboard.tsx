import { html } from 'htm/preact';
import { useState, useMemo } from 'preact/hooks';
import { ChartComponent } from './ChartComponent';
import type { Plan, Customer, NetworkDevice, Enumerations } from '../../types';

interface DashboardProps {
    plans: Plan[];
    customers: Customer[];
    devices: NetworkDevice[];
    enumerations: Enumerations;
}

export const Dashboard = ({ plans, customers, devices, enumerations }: DashboardProps) => {
    const [activeTab, setActiveTab] = useState('planning');

    const chartData = useMemo(() => {
        const enumMaps = {
            planCategory: new Map(enumerations.planCategory.map(e => [e.id, e.label])),
            legalForm: new Map(enumerations.legalForm.map(e => [e.id, e.label])),
            deviceType: new Map(enumerations.deviceType.map(e => [e.id, e.label])),
        };

        const planningData = plans.reduce((acc, plan) => {
            const categoryLabel = enumMaps.planCategory.get(plan.category) || 'Unknown';
            acc[categoryLabel] = (acc[categoryLabel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const customerData = customers.reduce((acc, customer) => {
            const formLabel = enumMaps.legalForm.get(customer.legalForm) || 'Unknown';
            acc[formLabel] = (acc[formLabel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const deviceData = devices.reduce((acc, device) => {
            const typeLabel = enumMaps.deviceType.get(device.deviceType) || 'Unknown';
            acc[typeLabel] = (acc[typeLabel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            planning: {
                labels: Object.keys(planningData),
                datasets: [{
                    label: 'Plans by Category',
                    data: Object.values(planningData),
                    backgroundColor: ['#3498db', '#e74c3c', '#9b59b6', '#f1c40f', '#2ecc71'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            customers: {
                labels: Object.keys(customerData),
                datasets: [{
                    label: 'Customers by Legal Form',
                    data: Object.values(customerData),
                    backgroundColor: ['#1abc9c', '#3498db', '#9b59b6'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            devices: {
                labels: Object.keys(deviceData),
                datasets: [{
                    label: 'Devices by Type',
                    data: Object.values(deviceData),
                    backgroundColor: ['#f39c12', '#d35400', '#2c3e50', '#7f8c8d'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            }
        };
    }, [plans, customers, devices, enumerations]);

    const chartConfigs = {
        planning: {
            type: 'bar',
            data: chartData.planning,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Planning Overview' }
                },
                scales: { y: { beginAtZero: true } }
            }
        },
        customers: {
            type: 'doughnut',
            data: chartData.customers,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Customer Demographics' }
                }
            }
        },
        devices: {
            type: 'polarArea',
            data: chartData.devices,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Network Device Types' }
                }
            }
        }
    };
    
    const tabs = {
        planning: 'Planning Overview',
        customers: 'Customer Demographics',
        devices: 'Device Types'
    };

    return html`
        <div class="content-header">
            <h2>Dashboard</h2>
        </div>
        <div class="dashboard-container">
            <div class="dashboard-tabs">
                ${Object.keys(tabs).map(tabKey => html`
                    <button 
                        class="dashboard-tab ${activeTab === tabKey ? 'active' : ''}"
                        onClick=${() => setActiveTab(tabKey)}
                    >
                        ${tabs[tabKey]}
                    </button>
                `)}
            </div>
            <div class="chart-container">
                <${ChartComponent} config=${chartConfigs[activeTab]} />
            </div>
        </div>
    `;
};