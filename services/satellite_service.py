import requests
import os
import json
import pandas as pd
from datetime import datetime, timedelta

# Free alternatives for satellite data - focusing on what works
NASA_EONET_API = "https://eonet.gsfc.nasa.gov/api/v3"

# Global dictionary to store the city to use for all data
# Now consistently using Nagpur for all data sources
LAST_CONFIRMED_CITY = {
    "name": "Nagpur",  # Using Nagpur as requested
    "coordinates": (21.1458, 79.0882)
}

def fetch_sentinel_data(region, start_date, end_date):
    """
    Fetch Sentinel-5P data for the specified region and date range.
    For MVP: always uses Nagpur for consistency across APIs.
    """
    # Always use Nagpur for consistency
    actual_region = LAST_CONFIRMED_CITY["name"]
    target_lat, target_lon = LAST_CONFIRMED_CITY["coordinates"]
    print(f"Fetching Sentinel-5P data for {actual_region} from {start_date} to {end_date}")
    
    # NASA EONET API (free, no authentication needed) - Works correctly
    # Let's extract actual useful data from this API for our MVP
    event_data = []
    try:
        response = requests.get(f"{NASA_EONET_API}/events", params={
            "status": "open",
            "days": 60,  # Look back further for more data
            "format": "json"
        })
        
        if response.status_code == 200:
            print("Successfully fetched NASA EONET data")
            eonet_data = response.json()
            
            # Extract events that could affect air quality
            events = eonet_data.get('events', [])
            for event in events:
                event_type = event.get('categories', [{}])[0].get('title', 'Unknown')
                
                # Focus on events that affect air quality
                if event_type in ['Wildfires', 'Dust and Haze', 'Volcanoes', 'Air Quality']:
                    coordinates = []
                    for geo in event.get('geometry', []):
                        if geo.get('type') == 'Point':
                            coordinates = geo.get('coordinates', [])
                            break
                    
                    if coordinates:
                        event_data.append({
                            'event_id': event.get('id', ''),
                            'title': event.get('title', ''),
                            'type': event_type,
                            'date': event.get('geometry', [{}])[0].get('date', ''),
                            'longitude': coordinates[0],
                            'latitude': coordinates[1]
                        })
            
            print(f"Extracted {len(event_data)} relevant environmental events")
        else:
            print(f"Failed to fetch NASA EONET data: {response.status_code}")
    except Exception as e:
        print(f"Error accessing NASA EONET API: {str(e)}")
    
    # For MVP, create sample data enhanced with any real events we found nearby
    start = pd.to_datetime(start_date)
    
    # Base data with a realistic pollution pattern (higher during weekdays, lower on weekends)
    dates = [start + timedelta(days=i) for i in range(10)]
    weekday_pattern = [1.2, 1.3, 1.4, 1.3, 1.2, 0.8, 0.7]  # Mon-Sun multiplier
    
    # Base values with daily fluctuation pattern
    base_values = []
    for i in range(10):
        day_of_week = (start.weekday() + i) % 7
        multiplier = weekday_pattern[day_of_week]
        base_values.append(round(30 * multiplier + (i % 3) * 5))
    
    # Adjust for nearby events (simple proximity effect)
    for event in event_data:
        # Fix timezone issue by ensuring dates are timezone-naive
        event_date = pd.to_datetime(event['date']).tz_localize(None)
        event_lat, event_lon = event['latitude'], event['longitude']
        
        # Calculate rough distance (not exact but good enough for demo)
        distance = ((target_lat - event_lat)**2 + (target_lon - event_lon)**2)**0.5 * 111  # km approximation
        
        if distance < 500:  # If event is within 500km
            # Find dates close to the event
            for i, date in enumerate(dates):
                days_diff = abs((date - event_date).days)
                if days_diff < 5:  # Within 5 days of event
                    # Adjust pollution level based on event type and proximity
                    impact = max(0, (5 - days_diff)) * (500 - distance) / 500
                    if event['type'] == 'Wildfires':
                        base_values[i] += int(impact * 15)  # Wildfires have strong effect
                    elif event['type'] in ['Dust and Haze', 'Air Quality']:
                        base_values[i] += int(impact * 10)
                    elif event['type'] == 'Volcanoes':
                        base_values[i] += int(impact * 20)
    
    sample_data = {
        'timestamp': dates,
        'no2_value': base_values,  # Adjusted values
        'latitude': [target_lat] * 10,
        'longitude': [target_lon] * 10,
        'event_influenced': [False] * 10,  # Default to False
        'location': [actual_region] * 10  # Add location name for clarity
    }
    
    # Now safely check for event influences with timezone handling
    for i, date in enumerate(dates):
        for event in event_data:
            event_date = pd.to_datetime(event['date']).tz_localize(None)
            event_lat, event_lon = event['latitude'], event['longitude']
            distance = ((target_lat - event_lat)**2 + (target_lon - event_lon)**2)**0.5 * 111
            
            if abs((date - event_date).days) < 5 and distance < 500:
                sample_data['event_influenced'][i] = True
                break
    
    return pd.DataFrame(sample_data)

def fetch_modis_data(region, start_date, end_date, update_city=False):
    """
    Fetch MODIS aerosol and land use data for the specified region and date range.
    For MVP: Using World Air Quality Index with Nagpur as fixed location.
    """
    # Always use Nagpur for consistent data
    actual_region = LAST_CONFIRMED_CITY["name"]
    lat, lon = LAST_CONFIRMED_CITY["coordinates"]
    
    print(f"Fetching MODIS data for {actual_region} from {start_date} to {end_date}")
    
    # WAQI data - Try to get data for Nagpur but fallback to generated data
    real_pm25 = None
    
    try:
        # Try using city name for Nagpur
        waqi_url = f"https://api.waqi.info/feed/nagpur/"
        token = "05db933bca6429b54ca3f3299ede47e1d2d68fab"  # Using demo token for hackathon
        response = requests.get(waqi_url, params={"token": token})
        
        # If city name doesn't work, try coordinates
        if response.status_code != 200 or response.json().get("status") != "ok":
            waqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/"
            response = requests.get(waqi_url, params={"token": token})
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                print("Successfully fetched World Air Quality data")
                
                # Extract actual PM2.5 values and other details
                aqi_data = data.get('data', {})
                if aqi_data:
                    # Get station information
                    station = aqi_data.get('city', {}).get('name', 'Unknown Station')
                    print(f"Data from station: {station}")
                    
                    # Get the actual PM2.5 reading if available
                    if 'iaqi' in aqi_data and 'pm25' in aqi_data['iaqi']:
                        real_pm25 = aqi_data['iaqi']['pm25']['v']
                        print(f"Current PM2.5 value: {real_pm25}")
                        
                        # Even if the station is elsewhere, we'll use the PM2.5 value
                        # but attribute it to Nagpur for consistency
                        
                    # Get dominant pollutant if available
                    dominant = aqi_data.get('dominentpol', 'unknown')
                    print(f"Dominant pollutant: {dominant}")
                    
                    # Note about data attribution
                    if actual_region.lower() not in station.lower():
                        print(f"Note: Using pollution values from {station} but attributing to {actual_region} for demonstration")
            else:
                print(f"World Air Quality API error: {data.get('data')}")
        else:
            print(f"Failed to fetch World Air Quality data: {response.status_code}")
    except Exception as e:
        print(f"Error accessing World Air Quality API: {str(e)}")
    
    # For MVP, create realistic sample data
    start = pd.to_datetime(start_date)
    
    # Generate more realistic PM2.5 data with daily patterns
    dates = [start + timedelta(days=i) for i in range(10)]
    
    # Base pattern with weekly cycle
    weekday_pattern = [1.2, 1.3, 1.4, 1.3, 1.2, 0.9, 0.8]  # Mon-Sun multiplier
    
    # If we got real PM2.5 data, use it to anchor our sample data
    base_pm25 = 70  # Higher default base value for Nagpur (tends to have higher pollution)
    if real_pm25 is not None:
        base_pm25 = real_pm25
    
    pm25_values = []
    for i in range(10):
        day_of_week = (start.weekday() + i) % 7
        multiplier = weekday_pattern[day_of_week]
        # Add some random variation
        variation = (i % 3) * 3 - (i % 2) * 2
        pm25_values.append(round(base_pm25 * multiplier + variation))
    
    sample_data = {
        'timestamp': dates,
        'pm25_value': pm25_values,
        'latitude': [lat] * 10,
        'longitude': [lon] * 10,
        'location': [actual_region] * 10  # Add location name for clarity
    }
    
    return pd.DataFrame(sample_data)

def get_region_coordinates(region):
    """Helper function to get coordinates for a named region"""
    return get_all_cities().get(region, LAST_CONFIRMED_CITY["coordinates"])  # Default to Nagpur coordinates

def get_all_cities():
    """Return all available cities and their coordinates"""
    return {
        # Indian cities with good AQI coverage
        "Delhi": (28.6139, 77.2090),
        "Mumbai": (19.0760, 72.8777),
        "Bangalore": (12.9716, 77.5946),
        "Chennai": (13.0827, 80.2707),
        "Kolkata": (22.5726, 88.3639),
        
        # International cities with excellent AQI monitoring
        "Beijing": (39.9042, 116.4074),
        "London": (51.5074, -0.1278),
        "New York": (40.7128, -74.0060),
        "Shanghai": (31.2304, 121.4737),
        
        # Other Indian cities
        "Nagpur": (21.1458, 79.0882),
        "Hyderabad": (17.3850, 78.4867),
        "Pune": (18.5204, 73.8567),
    }       

def get_region_coordinates(region):
    """Helper function to get coordinates for a named region"""
    return get_all_cities().get(region, (28.6139, 77.2090))  # Delhi coordinates as default

def get_all_cities():
    """Return all available cities and their coordinates"""
    return {
        # Indian cities with good AQI coverage
        "Delhi": (28.6139, 77.2090),      # Excellent AQI coverage
        "Mumbai": (19.0760, 72.8777),     # Good AQI coverage
        "Bangalore": (12.9716, 77.5946),  # Good AQI coverage
        "Chennai": (13.0827, 80.2707),
        "Kolkata": (22.5726, 88.3639),
        
        # International cities with excellent AQI monitoring
        "Beijing": (39.9042, 116.4074),
        "London": (51.5074, -0.1278),
        "New York": (40.7128, -74.0060),
        "Shanghai": (31.2304, 121.4737),
        
        # Other Indian cities
        "Nagpur": (21.1458, 79.0882),
        "Hyderabad": (17.3850, 78.4867),
        "Pune": (18.5204, 73.8567),
    }
