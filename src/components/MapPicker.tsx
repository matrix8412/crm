import { html } from 'htm/preact';
import { useEffect, useRef } from 'preact/hooks';

declare var L: any;

interface MapPickerProps {
    lat: string;
    lon: string;
    onPositionChange: (lat: string, lon: string) => void;
}

export const MapPicker = ({ lat, lon, onPositionChange }: MapPickerProps) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any | null>(null);
    const markerRef = useRef<any | null>(null);
    const isUpdatingFromProps = useRef(false);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const initialLat = parseFloat(lat) || 50.0755;
            const initialLon = parseFloat(lon) || 14.4378;
            const initialZoom = (lat && lon) ? 15 : 7;
            
            mapRef.current = L.map(mapContainerRef.current).setView([initialLat, initialLon], initialZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
            
            markerRef.current = L.marker([initialLat, initialLon], { draggable: true }).addTo(mapRef.current);

            markerRef.current.on('dragend', (event) => {
                const position = event.target.getLatLng();
                onPositionChange(position.lat.toFixed(6), position.lng.toFixed(6));
            });

            mapRef.current.on('click', (event) => {
                const position = event.latlng;
                markerRef.current.setLatLng(position);
                onPositionChange(position.lat.toFixed(6), position.lng.toFixed(6));
            });
        }
    }, []);

    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            const currentLat = parseFloat(lat);
            const currentLon = parseFloat(lon);
            
            if (!isNaN(currentLat) && !isNaN(currentLon)) {
                const markerPos = markerRef.current.getLatLng();
                // Only update map if position is different to avoid loops
                if (Math.abs(markerPos.lat - currentLat) > 1e-6 || Math.abs(markerPos.lng - currentLon) > 1e-6) {
                    isUpdatingFromProps.current = true;
                    const newLatLng = L.latLng(currentLat, currentLon);
                    markerRef.current.setLatLng(newLatLng);
                    mapRef.current.panTo(newLatLng);
                    setTimeout(() => { isUpdatingFromProps.current = false; }, 100);
                }
            }
        }
    }, [lat, lon]);

    return html`<div class="map-picker-container" ref=${mapContainerRef}></div>`;
};
