'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchUniversities, University } from '@/lib/api';

// Utility function to create custom marker icons with name tags
const createCustomIcon = (name: string, color: string, isProperty: boolean = false) => {
  const iconHtml = `
    <div style="
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        color: white;
        font-weight: bold;
        font-size: 16px;
        text-align: center;
        line-height: 1;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">${isProperty ? '🏠' : '🎓'}</div>
    </div>
    <div style="
      background: white;
      border: 2px solid ${color};
      border-radius: 8px;
      padding: 4px 8px;
      margin-top: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      font-size: 11px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      max-width: 140px;
      text-align: center;
      text-overflow: ellipsis;
      overflow: hidden;
    ">${name}</div>
  `;
  
  return {
    html: iconHtml,
    size: [45, 45],
    anchor: [22, 22],
    popupAnchor: [0, -22]
  };
};

// Dynamically import the map component to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
      <p className="text-gray-500">Loading map...</p>
    </div>
  </div>
});

const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false
});

const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false
});

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false
});

const DivIcon = dynamic(() => import('react-leaflet').then((mod) => mod.DivIcon), {
  ssr: false
});

interface MapComponentProps {
  latitude: number | string | null;
  longitude: number | string | null;
  address: string;
  title: string;
}

export default function MapComponent({ latitude, longitude, address, title }: MapComponentProps) {
  // Convert coordinates to numbers
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
  
  // State for universities
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(true);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Load Leaflet CSS, JS and custom marker styles
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Add custom marker styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-div-icon {
        background: transparent !important;
        border: none !important;
      }
      .custom-div-icon div {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // Load Leaflet JavaScript
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
      document.head.removeChild(script);
    };
  }, []);

  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversitiesData = async () => {
      try {
        const universitiesData = await fetchUniversities();
        setUniversities(universitiesData);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    fetchUniversitiesData();
  }, []);

  // Check if coordinates are valid
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Interactive Map</p>
          <p className="text-gray-400 text-sm mt-1">Location coordinates not available</p>
        </div>
      </div>
    );
  }

  // Show loading state while Leaflet is loading
  if (!isLeafletLoaded) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  // Define color palette for universities
  const universityColors = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#84cc16', // Lime
    '#f97316', // Orange
    '#ec4899', // Pink
    '#6366f1', // Indigo
  ];

  return (
    <div className="w-full">
      {/* Map Legend */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Property Marker */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-white text-sm">🏠</span>
              </div>
              <div className="mt-1 text-center text-xs font-medium text-gray-700">Property</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Property Location</div>
              <div className="text-gray-600">The rental property you're viewing</div>
            </div>
          </div>

          {/* University Markers */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-white text-sm">🎓</span>
              </div>
              <div className="mt-1 text-center text-xs font-medium text-gray-700">University</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Universities</div>
              <div className="text-gray-600">Higher education institutions</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-white text-sm">ℹ️</span>
              </div>
              <div className="mt-1 text-center text-xs font-medium text-gray-700">Info</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Interactive Map</div>
              <div className="text-gray-600">Click markers for details & directions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
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
        {/* Property Marker */}
        <Marker 
          position={[lat, lng]}
          icon={typeof window !== 'undefined' && (window as any).L ? new (window as any).L.DivIcon({
            html: createCustomIcon(title.length > 15 ? title.substring(0, 15) + '...' : title, '#ef4444', true).html,
            className: 'custom-div-icon',
            iconSize: [45, 45],
            iconAnchor: [22, 22],
            popupAnchor: [0, -22]
          }) : undefined}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-gray-600 text-xs mb-2">{address}</p>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>📍 {lat.toFixed(6)}, {lng.toFixed(6)}</div>
                <a 
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                  </svg>
                  Open in Google Maps
                </a>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* University Markers */}
        {universities.map((university, index) => {
          const uniLat = typeof university.latitude === 'string' ? parseFloat(university.latitude) : university.latitude;
          const uniLng = typeof university.longitude === 'string' ? parseFloat(university.longitude) : university.longitude;
          
          if (isNaN(uniLat) || isNaN(uniLng)) return null;
          
          // Different colors for different universities
          const color = universityColors[index % universityColors.length];
          const shortName = university.name.length > 12 ? university.name.substring(0, 12) + '...' : university.name;
          
          return (
            <Marker 
              key={university.id} 
              position={[uniLat, uniLng]}
              icon={typeof window !== 'undefined' && (window as any).L ? new (window as any).L.DivIcon({
                html: createCustomIcon(shortName, color, false).html,
                className: 'custom-div-icon',
                iconSize: [45, 45],
                iconAnchor: [22, 22],
                popupAnchor: [0, -22]
              }) : undefined}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-blue-600 text-sm mb-1">🎓 {university.name}</h3>
                  <p className="text-gray-600 text-xs mb-2">{university.city}, {university.country}</p>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <div>📍 {uniLat.toFixed(6)}, {uniLng.toFixed(6)}</div>
                    <a 
                      href={`https://www.google.com/maps?q=${uniLat},${uniLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      </div>
    </div>
  );
}
