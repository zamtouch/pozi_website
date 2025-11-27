'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Create the click handler component separately to avoid hook issues
const MapClickHandler = dynamic(
  () => Promise.resolve(function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const { useMapEvents } = require('react-leaflet');
    useMapEvents({
      click: (e: any) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      },
    });
    return null;
  }),
  { ssr: false }
);

// Dynamically import the map components
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-2"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false
});

const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false
});

interface MapPickerProps {
  latitude: number | string | null;
  longitude: number | string | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

export default function MapPicker({ latitude, longitude, onLocationSelect, height = '400px' }: MapPickerProps) {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [center, setCenter] = useState<[number, number]>([-15.3875, 28.3228]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (!mounted) return;

    if (typeof window !== 'undefined' && (window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    const existingScript = document.querySelector('script[src*="leaflet.js"]');

    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => setIsLeafletLoaded(true);
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && (window as any).L) {
      setIsLeafletLoaded(true);
    }
  }, [mounted]);

  // Initialize position
  useEffect(() => {
    if (!mounted) return;
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      setMarkerPosition([lat, lng]);
      setCenter([lat, lng]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, [latitude, longitude, mounted]);

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  const handleMarkerDrag = (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setMarkerPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  if (!mounted || !isLeafletLoaded) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  const createMarkerIcon = () => {
    if (typeof window === 'undefined' || !(window as any).L) return undefined;
    return (window as any).L.divIcon({
      className: 'map-picker-marker',
      html: `<div style="background: #ef4444; border: 3px solid white; border-radius: 50%; width: 30px; height: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid white;"></div></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  };

  return (
    <div className="w-full">
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Click anywhere on the map to set the location, or drag the marker to adjust.
        </p>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-300" style={{ height }}>
        <MapContainer
          center={center}
          zoom={markerPosition ? 15 : 10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDrag }}
              icon={createMarkerIcon()}
            />
          )}
        </MapContainer>
      </div>
      {markerPosition && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Selected Location:</strong>{' '}
            <span className="font-mono text-gray-900">
              {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
