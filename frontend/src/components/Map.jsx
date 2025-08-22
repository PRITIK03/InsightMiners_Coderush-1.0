import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ pollutionData, selectedRegion }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  
  // Remove the mapMode state and set it directly to 'markers'
  const mapMode = 'markers'; // Default and only mode now
  
  // Default center coordinates for different regions
  const defaultCenters = {
    'Nagpur': [21.1458, 79.0882],
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.6139, 77.2090],
    'London': [51.5074, -0.1278],
    'Shanghai': [31.2304, 121.4737],
  };

  useEffect(() => {
    // Initialize map if it doesn't exist yet
    if (!mapInstanceRef.current && mapRef.current) {
      const center = defaultCenters[selectedRegion] || [21.1458, 79.0882]; // Default to Nagpur
      mapInstanceRef.current = L.map(mapRef.current, {
        center,
        zoom: 12,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false, // We'll add zoom control manually
        attributionControl: false,
      });
      
      // Add attribution control in a better position
      L.control.attribution({
        position: 'bottomleft',
        prefix: 'Leaflet | Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);
      
      // Add zoom control to the right
      L.control.zoom({
        position: 'topright'
      }).addTo(mapInstanceRef.current);
      
      // Add the base map layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
      
      // Add scale control
      L.control.scale({
        imperial: false,
        position: 'bottomright'
      }).addTo(mapInstanceRef.current);
      
      // Initialize layers
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
    
    return () => {
      // Cleanup on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update map when region changes
    if (mapInstanceRef.current) {
      const center = defaultCenters[selectedRegion] || [21.1458, 79.0882];
      mapInstanceRef.current.setView(center, 12);
    }
  }, [selectedRegion]);

  useEffect(() => {
    // Update map when data changes
    if (mapInstanceRef.current && pollutionData) {
      updateMapWithData();
    }
  }, [pollutionData, mapMode]);

  const updateMapWithData = () => {
    if (!pollutionData || !pollutionData.riskZones) return;
    
    // Clear existing markers
    markersLayerRef.current.clearLayers();
    
    // Remove existing heat layer if exists
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    
    if (mapMode === 'markers') {
      // Add markers for risk zones
      pollutionData.riskZones.forEach(zone => {
        const riskColor = {
          'high': 'red',
          'medium': 'orange',
          'low': 'green',
        }[zone.risk_level] || 'blue';
        
        const markerRadius = zone.risk_level === 'high' ? 10 : 
                           zone.risk_level === 'medium' ? 8 : 6;
        
        // Create circular marker
        const marker = L.circleMarker([zone.latitude, zone.longitude], {
          radius: markerRadius,
          fillColor: riskColor,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7,
        }).addTo(markersLayerRef.current);
        
        // Add popup with information
        marker.bindPopup(`
          <div class="popup-content">
            <h3 class="text-lg font-bold" style="color:${riskColor};">${zone.risk_level.toUpperCase()} RISK</h3>
            <div>
              <strong>Pollution Index:</strong> ${zone.pollution_index.toFixed(2)}
            </div>
            <div>
              <strong>Location:</strong> ${zone.location}
            </div>
            <div>
              <strong>Affected Population:</strong> ~${zone.estimated_affected_population.toLocaleString()}
            </div>
          </div>
        `);
      });
    } else {
      // Create heatmap layer
      const heatPoints = [];
      pollutionData.riskZones.forEach(zone => {
        const intensity = zone.risk_level === 'high' ? 1.0 : 
                         zone.risk_level === 'medium' ? 0.6 : 0.3;
        
        heatPoints.push([
          zone.latitude, 
          zone.longitude,
          intensity * zone.pollution_index
        ]);
      });
      
      if (window.L.heatLayer) {
        heatLayerRef.current = window.L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 15,
          gradient: {
            0.0: 'green',
            0.4: 'yellow',
            0.7: 'orange',
            0.9: 'red'
          }
        }).addTo(mapInstanceRef.current);
      } else {
        console.warn("Leaflet.heat plugin not loaded. Falling back to markers.");
        setMapMode('markers');
      }
    }
    
    // Set map view to fit markers if needed
    if (pollutionData.riskZones.length > 0) {
      const firstZone = pollutionData.riskZones[0];
      const center = [firstZone.latitude, firstZone.longitude];
      
      // If we don't have a valid center yet, use the first zone
      if (!mapInstanceRef.current.getCenter() || 
          (mapInstanceRef.current.getCenter().lat === 0 && 
           mapInstanceRef.current.getCenter().lng === 0)) {
        mapInstanceRef.current.setView(center, 12);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white p-2 border-b flex justify-between items-center">
        <h3 className="font-bold text-gray-800">
          Air Quality Visualization - {selectedRegion}
        </h3>
        {/* Remove the toggle buttons div completely */}
      </div>
      <div ref={mapRef} className="flex-1" />
      <div className="p-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between items-center">
        <div>
          {pollutionData && pollutionData.riskZones && (
            <span>Showing {pollutionData.riskZones.length} pollution data points</span>
          )}
        </div>
        <div>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md mr-2">High Risk</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md mr-2">Medium Risk</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">Low Risk</span>
        </div>
      </div>
    </div>
  );
};

export default Map;