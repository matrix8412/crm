

import { html } from 'htm/preact';
import { render } from 'preact';
import { useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { icons } from '../../constants/icons';
import type { NetworkDevice } from '../../types';

declare var L: any; // Declare Leaflet global

// Popup component to be rendered into the map
const MapPopup = ({ device, setModal, toggleDeleteStatus, addToast }) => {
    const handlePing = (e) => {
        e.stopPropagation();
        if (!device.ipAddress) return;
        navigator.clipboard.writeText(`ping ${device.ipAddress}`).then(() => {
            addToast(`Ping command for ${device.ipAddress} copied to clipboard.`, 'info');
        }).catch(err => {
            console.error('Failed to copy command: ', err);
            addToast('Failed to copy command.', 'error');
        });
    };

    return html`
        <div class="map-popup-content">
            <h5>${device.name}</h5>
            <p><strong>IP:</strong> <button class="btn-ping-ip" onClick=${handlePing} title="Copy ping command">${device.ipAddress}</button></p>
            ${device.ssid && html`<p><strong>SSID:</strong> ${device.ssid}</p>`}
            <div class="actions">
                <button class="btn-info" onClick=${() => setModal({ type: 'deviceDetails', data: device })} title="View Details">${icons.info}</button>
                <button class="btn-edit" onClick=${() => setModal({ type: 'device', data: device })} title="Edit" disabled=${device.isDeleted}>${icons.edit}</button>
                ${device.isDeleted
                    ? html`<button class="btn-restore" onClick=${() => toggleDeleteStatus('devices', device.id)} title="Restore">${icons.restore}</button>`
                    : html`<button class="btn-delete" onClick=${() => toggleDeleteStatus('devices', device.id)} title="Delete">${icons.delete}</button>`
                }
                <button class="btn-history" onClick=${() => setModal({ type: 'history', entityId: device.id, entityType: 'devices' })} title="History">${icons.history}</button>
            </div>
        </div>
    `;
};

export const DeviceMapView = ({ devices, filteredDevices, setModal, toggleDeleteStatus, addToast }) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const popupNodesRef = useRef<HTMLElement[]>([]);
    const tileLayerRef = useRef<any | null>(null);

    const devicesWithGps = useMemo(() => 
        devices.filter(d => d.gpsLat && d.gpsLon && !isNaN(parseFloat(d.gpsLat)) && !isNaN(parseFloat(d.gpsLon))),
        [devices]
    );
    
    const filteredDevicesWithGps = useMemo(() =>
        filteredDevices.filter(d => d.gpsLat && d.gpsLon && !isNaN(parseFloat(d.gpsLat)) && !isNaN(parseFloat(d.gpsLon))),
        [filteredDevices]
    );
    
    const updateMapTheme = () => {
        if (!mapRef.current) return;
        const isDarkMode = document.documentElement.classList.contains('dark-theme');
        
        const tileUrl = isDarkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
        if (tileLayerRef.current) {
            tileLayerRef.current.setUrl(tileUrl);
        }
    };
    
    useEffect(() => {
        updateMapTheme(); // Initial theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', updateMapTheme);
        return () => mediaQuery.removeEventListener('change', updateMapTheme);
    }, []);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([50.0755, 14.4378], 7); // Default to Prague
            tileLayerRef.current = L.tileLayer('', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapRef.current);
            updateMapTheme();
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                tileLayerRef.current = null;
            }
        };
    }, []);
    
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers and unmount popup Preact trees
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        popupNodesRef.current.forEach(node => render(null, node));
        popupNodesRef.current = [];

        const filteredIds = new Set(filteredDevicesWithGps.map(d => d.id));

        devicesWithGps.forEach(device => {
            const isHighlighted = filteredIds.has(device.id);
            const popupNode = document.createElement('div');
            render(html`<${MapPopup} device=${device} setModal=${setModal} toggleDeleteStatus=${toggleDeleteStatus} addToast=${addToast} />`, popupNode);
            popupNodesRef.current.push(popupNode);
            
            const marker = L.marker([parseFloat(device.gpsLat), parseFloat(device.gpsLon)], {
                opacity: isHighlighted ? 1.0 : 0.6
            })
            .addTo(mapRef.current)
            .bindPopup(popupNode);
            
            if (device.isDeleted || !isHighlighted) {
                 L.DomUtil.addClass(marker._icon, 'marker-grey');
            }
             if (isHighlighted && filteredDevices.length < devices.length) {
                L.DomUtil.addClass(marker._icon, 'highlighted-marker');
            }

            markersRef.current.push(marker);
        });

        if (filteredDevicesWithGps.length > 0) {
            const bounds = L.latLngBounds(filteredDevicesWithGps.map(d => [parseFloat(d.gpsLat), parseFloat(d.gpsLon)]));
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else if (devicesWithGps.length > 0) {
            const bounds = L.latLngBounds(devicesWithGps.map(d => [parseFloat(d.gpsLat), parseFloat(d.gpsLon)]));
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [devicesWithGps, filteredDevicesWithGps, setModal, toggleDeleteStatus, addToast]);


    return html`
        ${devicesWithGps.length === 0
            ? html`<div class="device-map-container no-gps-devices-message">No devices with GPS coordinates found.</div>`
            : html`<div class="device-map-container" ref=${mapContainerRef}></div>`
        }
    `;
};