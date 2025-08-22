import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Popup, GeoJSON, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Legend from './Legend';

// Custom map control for toggling layers
function LayerControl({ layers, onToggle }) {
  const map = useMap();
  
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar bg-white shadow-md rounded-md p-2 m-2">
        <h4 className="text-sm font-semibold mb-2">Map Layers</h4>
        {Object.keys(layers).map(key => (
          <div key={key} className="flex items-center mb-1">
            <input 
              type="checkbox" 
              id={`layer-${key}`} 
              className="mr-2"
              checked={layers[key]}
              onChange={() => onToggle(key)}
            />
            <label htmlFor={`layer-${key}`} className="text-xs cursor-pointer">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

// Animated pulsing marker for highlighting key areas
function PulsingMarker({ position, color }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    
    // Create and add pulsing circle
    const pulsingIcon = L.divIcon({
      className: 'custom-pulsing-marker',
      html: `<div class="pulse-marker" style="background-color: ${color}"></div>`,
      iconSize: [20, 20]
    });
    
    markerRef.current = L.marker(position, { icon: pulsingIcon }).addTo(map);
    
    return () => {
      if (markerRef.current) map.removeLayer(markerRef.current);
    };
  }, [map, position, color]);
  
  return null;
}

const MapView = ({ pollutionData, regionBoundary, loading }) => {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState({
    densityMarkers: true, // Replace heatmap with density markers
    riskZones: true,
    boundary: true,
    pulsingMarkers: true
  });
  const [selectedBaseMap, setSelectedBaseMap] = useState('streets');
  
  // Base map options
  const baseMaps = {
    streets: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      name: 'Streets'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      name: 'Satellite'
    },
    dark: {
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      name: 'Dark'
    }
  };
  
  // Center map on data points when they load
  useEffect(() => {
    if (map && pollutionData && pollutionData.riskZones && pollutionData.riskZones.length > 0) {
      // Get center point of all zones
      const latitudes = pollutionData.riskZones.map(zone => zone.latitude);
      const longitudes = pollutionData.riskZones.map(zone => zone.longitude);
      
      const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
      const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
      
      // Calculate appropriate zoom level based on spread of points
      const latRange = Math.max(...latitudes) - Math.min(...latitudes);
      const lngRange = Math.max(...longitudes) - Math.min(...longitudes);
      const maxRange = Math.max(latRange, lngRange);
      
      // Rough heuristic for zoom level
      let zoomLevel = 12;
      if (maxRange > 0.5) zoomLevel = 9;
      if (maxRange > 1) zoomLevel = 8;
      if (maxRange > 2) zoomLevel = 7;
      
      map.setView([avgLat, avgLng], zoomLevel);
      
      // Apply a smooth fly-to animation
      map.flyTo([avgLat, avgLng], zoomLevel, {
        animate: true,
        duration: 1.5
      });
    }
  }, [map, pollutionData]);

  const toggleLayer = (layerKey) => {
    setLayers(prevLayers => ({
      ...prevLayers,
      [layerKey]: !prevLayers[layerKey]
    }));
  };
  
  const handleBaseMapChange = (mapKey) => {
    setSelectedBaseMap(mapKey);
  };

  const getRiskColor = (riskLevel, opacity = 0.7) => {
    switch(riskLevel) {
      case 'high': return `rgba(220, 53, 69, ${opacity})`; // Red with specified opacity
      case 'medium': return `rgba(255, 193, 7, ${opacity})`; // Yellow with specified opacity
      case 'low': return `rgba(40, 167, 69, ${opacity})`; // Green with specified opacity
      default: return `rgba(13, 110, 253, ${opacity})`; // Blue with specified opacity
    }
  };
  
  const getGradientStyle = (riskLevel) => {
    let color1, color2;
    
    switch(riskLevel) {
      case 'high':
        color1 = 'rgba(220, 53, 69, 0.9)';
        color2 = 'rgba(255, 99, 132, 0.6)';
        break;
      case 'medium':
        color1 = 'rgba(255, 193, 7, 0.9)';
        color2 = 'rgba(255, 205, 86, 0.6)';
        break;
      case 'low':
        color1 = 'rgba(40, 167, 69, 0.9)';
        color2 = 'rgba(75, 192, 192, 0.6)';
        break;
      default:
        color1 = 'rgba(13, 110, 253, 0.9)';
        color2 = 'rgba(13, 202, 240, 0.6)';
    }
    
    return {
      fillOpacity: 0.6,
      fillColor: color1,
      color: color2,
      weight: 1
    };
  };

  // Prepare data for visualization
  let densityPoints = [];
  let highRiskPoints = [];
  
  if (pollutionData && pollutionData.riskZones) {
    // Use for density visualization (alternative to heatmap)
    densityPoints = pollutionData.riskZones.map(zone => ({
      position: [zone.latitude, zone.longitude],
      intensity: zone.pollution_index * 10,
      radius: zone.pollution_index * 5 + 5, // Scale radius based on pollution
      color: getRiskColor(zone.risk_level, 0.3)
    }));
    
    // Get high risk points for pulsing markers
    highRiskPoints = pollutionData.riskZones
      .filter(zone => zone.risk_level === 'high')
      .map(zone => ({
        position: [zone.latitude, zone.longitude],
        color: getRiskColor('high', 1)
      }));
  }

  return (
    <div className="relative h-full">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded shadow-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2">Loading pollution data...</p>
          </div>
        </div>
      )}
      
      {/* Base map switcher */}
      <div className="absolute top-3 left-3 z-10 bg-white rounded-md shadow-md p-2">
        <div className="flex space-x-2">
          {Object.keys(baseMaps).map(key => (
            <button
              key={key}
              className={`px-2 py-1 text-xs rounded ${selectedBaseMap === key ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              onClick={() => handleBaseMapChange(key)}
            >
              {baseMaps[key].name}
            </button>
          ))}
        </div>
      </div>
      
      <MapContainer 
        center={[21.1458, 79.0882]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        {/* Base Tile Layer */}
        <TileLayer
          attribution={baseMaps[selectedBaseMap].attribution}
          url={baseMaps[selectedBaseMap].url}
        />
        
        {/* Density points visualization (alternative to heatmap) */}
        {layers.densityMarkers && densityPoints.map((point, index) => (
          <CircleMarker
            key={`density-${index}`}
            center={point.position}
            radius={point.radius}
            pathOptions={{
              fillColor: point.color,
              fillOpacity: 0.6,
              stroke: false
            }}
          />
        ))}
        
        {/* Region boundary */}
        {layers.boundary && regionBoundary && (
          <GeoJSON 
            data={regionBoundary}
            style={{ 
              color: "#3388ff",
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.1,
              fillColor: "#3388ff"
            }}
          />
        )}
        
        {/* Risk zones */}
        {layers.riskZones && pollutionData && pollutionData.riskZones && pollutionData.riskZones.map((zone, index) => {
          const style = getGradientStyle(zone.risk_level);
          
          // Calculate radius based on population or fixed value
          const baseRadius = zone.estimated_affected_population 
            ? Math.sqrt(zone.estimated_affected_population) * 2
            : 800;
            
          const radius = zone.risk_level === 'high' 
            ? baseRadius * 1.5 
            : zone.risk_level === 'medium' 
              ? baseRadius * 1.2 
              : baseRadius;
            
          return (
            <Circle
              key={`zone-${index}`}
              center={[zone.latitude, zone.longitude]}
              radius={radius}
              pathOptions={style}
            >
              <Popup className="custom-popup">
                <div className="text-sm">
                  <div className={`text-white text-center py-1 px-2 mb-2 rounded font-bold ${
                    zone.risk_level === 'high' 
                      ? 'bg-red-600' 
                      : zone.risk_level === 'medium' 
                        ? 'bg-yellow-500' 
                        : 'bg-green-600'
                  }`}>
                    {zone.risk_level.toUpperCase()} RISK ZONE
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    <div className="text-gray-600 text-xs">Pollution Index:</div>
                    <div className="font-semibold text-right">{zone.pollution_index.toFixed(2)}</div>
                    
                    <div className="text-gray-600 text-xs">Air Quality:</div>
                    <div className="font-semibold text-right">
                      {zone.pollution_index < 1 ? 'Good' : zone.pollution_index < 1.5 ? 'Moderate' : zone.pollution_index < 2 ? 'Poor' : 'Very Poor'}
                    </div>
                    
                    {zone.estimated_affected_population && (
                      <>
                        <div className="text-gray-600 text-xs">Population Affected:</div>
                        <div className="font-semibold text-right">{zone.estimated_affected_population.toLocaleString()}</div>
                      </>
                    )}
                    
                    <div className="text-gray-600 text-xs">Location:</div>
                    <div className="font-semibold text-right">{zone.location}</div>
                  </div>
                  
                  <div className="text-xs text-center mt-1 text-gray-500">
                    Click for detailed report
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}
        
        {/* Pulsing markers for high risk areas */}
        {layers.pulsingMarkers && highRiskPoints.map((point, index) => (
          <PulsingMarker 
            key={`pulse-${index}`} 
            position={point.position} 
            color={point.color} 
          />
        ))}
        
        {/* Layer controls */}
        <LayerControl 
          layers={layers}
          onToggle={toggleLayer}
        />
      </MapContainer>
      
      <Legend />
      
      {/* CSS for pulsing effect */}
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 3px 14px rgba(0,0,0,0.2);
        }
        
        .pulse-marker {
          border-radius: 50%;
          height: 14px;
          width: 14px;
          transform-origin: center;
          animation: pulse 1.5s ease-out infinite;
          box-shadow: 0 0 0 rgba(220, 53, 69, 0.4);
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(220, 53, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default MapView;