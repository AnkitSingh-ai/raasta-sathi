// GoogleMapComponent.jsx
import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { AlertTriangle, Shield, Construction, Car, Cloud, Crown, CheckCircle } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090
};

const mockReports = [
  {
    id: '1',
    type: 'accident',
    position: { lat: 28.6304, lng: 77.2177 },
    title: 'Minor Accident',
    description: 'Two vehicle collision, traffic moving slowly',
    severity: 'medium',
    timestamp: '5 mins ago',
    verified: true
  },
  {
    id: '2',
    type: 'police',
    position: { lat: 28.6200, lng: 77.2100 },
    title: 'Police Checkpoint',
    description: 'Random checks',
    severity: 'low',
    timestamp: '10 mins ago',
    verified: false
  }
];

export function GoogleMapComponent({
  reports = mockReports,
  onMapClick,
  center = defaultCenter,
  zoom = 12,
  height = '400px'
}) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapError, setMapError] = useState(false);

  const getMarkerIcon = (type, severity) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444'
    };

    return {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 'circle',
      fillColor: colors[severity] || '#6B7280',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8
    };
  };

  const getTypeIcon = (type) => {
    const icons = {
      accident: AlertTriangle,
      police: Shield,
      construction: Construction,
      congestion: Car,
      weather: Cloud,
      vip: Crown
    };
    return icons[type] || AlertTriangle;
  };

  // If no Google Maps API key, show a placeholder
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE") {
    return (
      <div style={{ height }} className="bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Map View</h3>
          <p className="text-gray-500 mb-4">Google Maps API key not configured</p>
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="bg-white p-3 rounded border">
                <div className="flex items-center space-x-2">
                  {React.createElement(getTypeIcon(report.type), { className: "h-4 w-4" })}
                  <span className="font-medium">{report.title}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onClick={onMapClick}
          onError={() => setMapError(true)}
        >
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={report.position}
              icon={getMarkerIcon(report.type, report.severity)}
              onClick={() => setSelectedMarker(report)}
            />
          ))}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={{ minWidth: '200px' }}>
                <h3 className="font-semibold text-lg mb-2">{selectedMarker.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedMarker.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Severity: {selectedMarker.severity}</span>
                  <span>{selectedMarker.timestamp}</span>
                </div>
                {selectedMarker.verified && (
                  <div className="flex items-center mt-2 text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">Verified</span>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}