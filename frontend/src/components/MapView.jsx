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

// Component to adjust map view when data changes
function MapAdjuster({ pollutionData }) {
  const map = useMap();
  
  useEffect(() => {
    if (pollutionData?.riskZones?.length > 0) {
      // Create bounds object to encompass all risk zones
      const bounds = L.latLngBounds();
      
      // Check if all points have the same coordinates
      let allSamePosition = true;
      const firstZone = pollutionData.riskZones[0];
      const firstLat = firstZone.latitude;
      const firstLon = firstZone.longitude;
      
      pollutionData.riskZones.forEach(zone => {
        if (Math.abs(zone.latitude - firstLat) > 0.001 || Math.abs(zone.longitude - firstLon) > 0.001) {
          allSamePosition = false;
        }
        bounds.extend([zone.latitude, zone.longitude]);
      });
      
      console.log("All risk zones at same position:", allSamePosition);
      
      // If all points are at the same position, use a fixed zoom level
      if (allSamePosition) {
        map.setView([firstLat, firstLon], 10);
      } else {
        // Otherwise fit to bounds
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 12,
          animate: true,
          duration: 1
        });
      }
    }
  }, [pollutionData, map]);
  
  return null;
}

const MapView = ({ pollutionData, regionBoundary, loading }) => {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState({
    densityMarkers: true,
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
    let color1, color2, opacity;
    
    switch(riskLevel) {
      case 'high':
        color1 = 'rgba(220, 53, 69, 0.6)';
        color2 = 'rgba(255, 99, 132, 0.8)';
        opacity = 0.5;
        break;
      case 'medium':
        color1 = 'rgba(255, 193, 7, 0.6)';
        color2 = 'rgba(255, 205, 86, 0.8)';
        opacity = 0.4;
        break;
      case 'low':
        color1 = 'rgba(40, 167, 69, 0.5)';
        color2 = 'rgba(75, 192, 192, 0.7)';
        opacity = 0.3;
        break;
      default:
        color1 = 'rgba(13, 110, 253, 0.6)';
        color2 = 'rgba(13, 202, 240, 0.8)';
        opacity = 0.3;
    }
    
    return {
      fillOpacity: opacity,
      fillColor: color1,
      color: color2,
      weight: 1.5
    };
  };

  // Prepare data for visualization
  let densityPoints = [];
  let highRiskPoints = [];
  
  if (pollutionData && pollutionData.riskZones) {
    // Debug the positions of risk zones
    console.log("Risk zone positions:", pollutionData.riskZones.map(zone => 
      `${zone.risk_level}: [${zone.latitude}, ${zone.longitude}]`
    ));

    // Apply offset to distribute risk zones if they're all at the same position
    const firstZone = pollutionData.riskZones[0];
    let allSamePosition = true;
    
    // Check if all coordinates are the same
    pollutionData.riskZones.forEach(zone => {
      if (Math.abs(zone.latitude - firstZone.latitude) > 0.001 || 
          Math.abs(zone.longitude - firstZone.longitude) > 0.001) {
        allSamePosition = false;
      }
    });
    
    // If all zones are at the same position, distribute them in a pattern
    if (allSamePosition && pollutionData.riskZones.length > 1) {
      console.log("Applying distribution to overlapping risk zones");
      
      // Create offsets based on risk level
      const offsetMap = {
        high: { lat: 0.02, lng: 0.02 },
        medium: { lat: -0.02, lng: 0.02 },
        low: { lat: 0, lng: -0.02 }
      };
      
      // Count zones by risk level to create dynamic offsets
      const riskCounts = { high: 0, medium: 0, low: 0 };
      pollutionData.riskZones.forEach(zone => {
        if (zone.risk_level in riskCounts) {
          riskCounts[zone.risk_level]++;
        }
      });
      
      // Apply offsets to create a distributed pattern
      pollutionData.riskZones = pollutionData.riskZones.map((zone, idx) => {
        // For each risk level, arrange in a semi-circle pattern
        const level = zone.risk_level;
        const count = riskCounts[level] || 1;
        const position = idx % count;
        const angle = (Math.PI / count) * position;
        const distance = 0.02; // ~2km
        
        // Calculate offset based on angle and distance
        const offsetLat = Math.sin(angle) * distance * (level === 'high' ? 1 : level === 'medium' ? 0.8 : 0.6);
        const offsetLng = Math.cos(angle) * distance * (level === 'high' ? 1 : level === 'medium' ? 0.8 : 0.6);
        
        return {
          ...zone,
          originalLat: zone.latitude,
          originalLng: zone.longitude,
          latitude: zone.latitude + offsetLat,
          longitude: zone.longitude + offsetLng
        };
      });
    }

    // Continue with normal processing
    densityPoints = pollutionData.riskZones.map(zone => ({
      position: [zone.latitude, zone.longitude],
      intensity: zone.pollution_index * 10,
      radius: zone.pollution_index * 5 + 5,
      color: getRiskColor(zone.risk_level, 0.3)
    }));
    
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
        center={[21.1458, 79.0882]} // Initial center, will be adjusted by MapAdjuster
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={setMap}
      >
        {/* Base Tile Layer */}
        <TileLayer
          attribution={baseMaps[selectedBaseMap].attribution}
          url={baseMaps[selectedBaseMap].url}
        />
        
        {/* Component to automatically adjust map view based on data */}
        <MapAdjuster pollutionData={pollutionData} />
        
        {/* Info overlay when all risk zones are in the same location */}
        {pollutionData && pollutionData.riskZones && pollutionData.riskZones.length > 0 && pollutionData.riskZones[0].originalLat && (
          <div className="absolute top-16 left-3 z-10 bg-white bg-opacity-80 rounded-md shadow-md p-2 max-w-xs text-xs">
            <p className="font-bold text-orange-600">Note: Risk zones have been artificially distributed for better visibility.</p>
            <p>All pollution data points were detected at the same location.</p>
          </div>
        )}
        
        {/* Density points visualization */}
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
          
          // Calculate radius based on pollution level and affected population
          let baseRadius = 800; // Default base radius
          
          if (zone.estimated_affected_population) {
            // Scale based on affected population with a square root to prevent extremely large circles
            baseRadius = Math.sqrt(zone.estimated_affected_population) * 2;
          } else if (zone.pollution_index) {
            // If no population data, scale based on pollution index
            baseRadius = zone.pollution_index * 800;
          }
            
          // Apply risk level multiplier  
          const radius = zone.risk_level === 'high' 
            ? baseRadius * 1.2
            : zone.risk_level === 'medium' 
              ? baseRadius * 1.0
              : baseRadius * 0.8;
            
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
                    
                    {/* Show original coordinates if they were adjusted */}
                    {zone.originalLat && (
                      <>
                        <div className="text-gray-600 text-xs">Note:</div>
                        <div className="font-semibold text-right text-orange-600">Position adjusted for visibility</div>
                      </>
                    )}
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