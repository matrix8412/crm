
import type { Enumerations } from '../types';

export const defaultEnumerations: Enumerations = {
    vendor: [
        { id: self.crypto.randomUUID(), label: 'Cisco' },
        { id: self.crypto.randomUUID(), label: 'Juniper' },
        { id: self.crypto.randomUUID(), label: 'MikroTik' },
    ],
    legalForm: [
        { id: self.crypto.randomUUID(), label: 'Individual' },
        { id: self.crypto.randomUUID(), label: 'Company' },
        { id: self.crypto.randomUUID(), label: 'Sole Proprietor' },
    ],
    deviceGroup: [
        { id: self.crypto.randomUUID(), label: 'Core' },
        { id: self.crypto.randomUUID(), label: 'Distribution' },
        { id: self.crypto.randomUUID(), label: 'Access' },
    ],
    deviceType: [
        { id: self.crypto.randomUUID(), label: 'Router' },
        { id: self.crypto.randomUUID(), label: 'Switch' },
        { id: self.crypto.randomUUID(), label: 'Access Point' },
        { id: self.crypto.randomUUID(), label: 'Other' },
    ],
    planCategory: [
        { id: self.crypto.randomUUID(), label: 'Installation', color: '#2ecc71' },
        { id: self.crypto.randomUUID(), label: 'Maintenance', color: '#3498db' },
        { id: self.crypto.randomUUID(), label: 'Troubleshooting', color: '#e74c3c' },
    ],
    reportingMethod: [
        { id: self.crypto.randomUUID(), label: 'Phone' },
        { id: self.crypto.randomUUID(), label: 'Email' },
        { id: self.crypto.randomUUID(), label: 'System' },
    ],
    planPriority: [
        { id: self.crypto.randomUUID(), label: 'Urgent', color: '#e74c3c' },
        { id: self.crypto.randomUUID(), label: 'Standard', color: '#f39c12' },
        { id: self.crypto.randomUUID(), label: 'Low Priority', color: '#3498db' },
    ],
    addresses: [
        { 
            id: self.crypto.randomUUID(), 
            street: 'Main Street',
            descriptiveNumber: '123',
            referenceNumber: 'A',
            city: 'Anytown',
            zipCode: '12345',
            state: 'Anystate',
            gpsLat: '40.7128',
            gpsLon: '-74.0060',
        }
    ],
    deviceTemplates: [],
    ipamRoles: [
        { id: self.crypto.randomUUID(), label: 'Corporate' },
        { id: self.crypto.randomUUID(), label: 'Guest' },
        { id: self.crypto.randomUUID(), label: 'IoT' },
        { id: self.crypto.randomUUID(), label: 'Management' },
        { id: self.crypto.randomUUID(), label: 'Voice' },
        { id: self.crypto.randomUUID(), label: 'Video Surveillance' },
    ],
    tags: [
        { id: self.crypto.randomUUID(), label: 'Critical', color: '#e74c3c' },
        { id: self.crypto.randomUUID(), label: 'Legacy', color: '#95a5a6' },
        { id: self.crypto.randomUUID(), label: 'Temporary', color: '#f39c12' },
    ],
    l2VpnEncapsulation: [
        { id: self.crypto.randomUUID(), label: 'Raw' },
        { id: self.crypto.randomUUID(), label: 'Tagged' },
    ],
    l2VpnMode: [
        { id: self.crypto.randomUUID(), label: 'VPLS' },
        { id: self.crypto.randomUUID(), label: 'VPWS' },
    ],
    l2VpnSignalization: [
        { id: self.crypto.randomUUID(), label: 'LDP' },
        { id: self.crypto.randomUUID(), label: 'BGP-AD' },
    ],
    routeDistinguishers: [],
    vpnTargets: [],
    sites: [],
    racks: [],
};