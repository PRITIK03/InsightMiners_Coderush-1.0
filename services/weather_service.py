import requests
import pandas as pd
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv

# Load environment variables for API keys
load_dotenv()

# OpenWeatherMap API for historical data
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', 'demo_key')  # Free tier has limited historical data

def fetch_weather_data(region, start_date, end_date):
    """
    Fetch historical weather data for a specific region and date range.
    For MVP: Generate realistic synthetic data based on region's climate patterns
    """
    print(f"Fetching weather data for {region} from {start_date} to {end_date}")
    
    # Convert dates to datetime objects
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    
    # For MVP, generate realistic weather data based on region climate patterns
    # In production: Replace with actual API call to OpenWeatherMap or similar
    
    # Get coordinates for the region
    region_coords = get_region_coordinates(region)
    
    # Get climate pattern for the region
    climate_pattern = get_climate_pattern(region)
    
    # Generate daily weather data
    dates = pd.date_range(start=start, end=end)
    weather_data = []
    
    for date in dates:
        # Generate temperature based on month and climate pattern
        month = date.month
        month_temp_range = climate_pattern[month]
        
        # Base temperature from monthly average
        base_temp = (month_temp_range['min'] + month_temp_range['max']) / 2
        
        # Add daily variation (higher in afternoon, lower at night)
        daily_variation = random.uniform(-3, 3)
        temperature = base_temp + daily_variation
        
        # Humidity tends to be inversely related to temperature
        humidity = random.uniform(month_temp_range['humidity_min'], month_temp_range['humidity_max'])
        
        # Wind speed - random but realistic
        wind_speed = random.uniform(2, 15)  # in km/h
        
        # Precipitation - more likely in rainy months
        precipitation = 0
        if random.random() < month_temp_range['rain_probability']:
            precipitation = random.uniform(0.5, 25)  # in mm
            
        # Atmospheric pressure - normal range with variations
        pressure = random.uniform(995, 1025)  # in hPa
            
        weather_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'temperature': round(temperature, 1),
            'humidity': round(humidity, 1),
            'wind_speed': round(wind_speed, 1),
            'precipitation': round(precipitation, 1),
            'pressure': round(pressure, 1),
            'location': region,
            'latitude': region_coords[0],
            'longitude': region_coords[1]
        })
    
    # Try to get some actual current data if API key is available
    if OPENWEATHER_API_KEY != 'demo_key':
        try:
            lat, lon = region_coords
            current_weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
            response = requests.get(current_weather_url)
            
            if response.status_code == 200:
                current_data = response.json()
                print(f"Successfully fetched current weather for {region}")
                
                # Update the last entry with actual current data
                if weather_data:
                    weather_data[-1].update({
                        'temperature': current_data['main']['temp'],
                        'humidity': current_data['main']['humidity'],
                        'wind_speed': current_data['wind']['speed'] * 3.6,  # Convert m/s to km/h
                        'pressure': current_data['main']['pressure']
                    })
        except Exception as e:
            print(f"Error fetching current weather: {e}")
    
    return pd.DataFrame(weather_data)

def get_region_coordinates(region):
    """Get coordinates for a named region"""
    # Simple mapping of regions to coordinates
    region_coords = {
        'Nagpur': (21.1458, 79.0882),
        'Mumbai': (19.0760, 72.8777),
        'Delhi': (28.6139, 77.2090),
        'Bangalore': (12.9716, 77.5946),
        'Chennai': (13.0827, 80.2707),
        'London': (51.5074, -0.1278),
        'New York': (40.7128, -74.0060),
        'Shanghai': (31.2304, 121.4737)
    }
    return region_coords.get(region, (21.1458, 79.0882))  # Default to Nagpur

def get_climate_pattern(region):
    """
    Get climate patterns for different regions throughout the year.
    Returns monthly patterns of temperature ranges and rain probability.
    """
    # Simplified climate patterns by region and month
    # For each month: min temp, max temp, humidity range, rain probability
    climate_patterns = {
        'Nagpur': {
            1: {'min': 15, 'max': 28, 'humidity_min': 25, 'humidity_max': 45, 'rain_probability': 0.05},  # Jan
            2: {'min': 18, 'max': 31, 'humidity_min': 25, 'humidity_max': 40, 'rain_probability': 0.05},  # Feb
            3: {'min': 22, 'max': 35, 'humidity_min': 20, 'humidity_max': 35, 'rain_probability': 0.10},  # Mar
            4: {'min': 27, 'max': 40, 'humidity_min': 15, 'humidity_max': 30, 'rain_probability': 0.10},  # Apr
            5: {'min': 30, 'max': 43, 'humidity_min': 20, 'humidity_max': 35, 'rain_probability': 0.15},  # May
            6: {'min': 27, 'max': 38, 'humidity_min': 45, 'humidity_max': 70, 'rain_probability': 0.50},  # Jun
            7: {'min': 25, 'max': 32, 'humidity_min': 65, 'humidity_max': 85, 'rain_probability': 0.75},  # Jul
            8: {'min': 25, 'max': 30, 'humidity_min': 70, 'humidity_max': 90, 'rain_probability': 0.80},  # Aug
            9: {'min': 24, 'max': 32, 'humidity_min': 60, 'humidity_max': 85, 'rain_probability': 0.60},  # Sep
            10: {'min': 21, 'max': 33, 'humidity_min': 45, 'humidity_max': 70, 'rain_probability': 0.25},  # Oct
            11: {'min': 17, 'max': 30, 'humidity_min': 35, 'humidity_max': 55, 'rain_probability': 0.05},  # Nov
            12: {'min': 14, 'max': 28, 'humidity_min': 30, 'humidity_max': 50, 'rain_probability': 0.05}   # Dec
        }
    }
    
    # Default to Nagpur climate if region not found
    default_climate = climate_patterns['Nagpur']
    
    # For regions not specifically defined, use rough climate approximations based on latitude
    if region not in climate_patterns:
        coords = get_region_coordinates(region)
        lat = coords[0]
        
        if lat > 40:  # Northern cities like London, NY
            for month in range(1, 13):
                if month <= 2 or month >= 11:  # Winter
                    default_climate[month] = {'min': -5, 'max': 10, 'humidity_min': 60, 'humidity_max': 85, 'rain_probability': 0.40}
                elif month in [3, 4, 9, 10]:  # Spring/Fall
                    default_climate[month] = {'min': 5, 'max': 20, 'humidity_min': 50, 'humidity_max': 75, 'rain_probability': 0.35}
                else:  # Summer
                    default_climate[month] = {'min': 15, 'max': 30, 'humidity_min': 45, 'humidity_max': 70, 'rain_probability': 0.30}
        elif lat < 15:  # Tropical cities
            for month in range(1, 13):
                default_climate[month] = {'min': 23, 'max': 33, 'humidity_min': 65, 'humidity_max': 90, 'rain_probability': 0.60}
    
    return climate_patterns.get(region, default_climate)

def correlate_weather_with_pollution(weather_data, pollution_data):
    """
    Analyze correlations between weather parameters and pollution levels
    Returns correlation coefficients and potential explanations
    """
    if len(weather_data) == 0 or len(pollution_data) == 0:
        return None
        
    # Merge weather and pollution data on date
    merged_data = pd.merge(
        weather_data,
        pollution_data,
        left_on='date',
        right_on='date',
        how='inner'
    )
    
    if len(merged_data) == 0:
        return None
    
    # Calculate correlations
    correlations = {}
    weather_factors = ['temperature', 'humidity', 'wind_speed', 'precipitation', 'pressure']
    pollution_factors = ['no2_level', 'pm25_level']
    
    for w_factor in weather_factors:
        if w_factor in merged_data.columns:
            for p_factor in pollution_factors:
                if p_factor in merged_data.columns:
                    try:
                        # Add check for zero standard deviation
                        if merged_data[w_factor].std() > 0 and merged_data[p_factor].std() > 0:
                            corr = merged_data[w_factor].corr(merged_data[p_factor])
                            correlations[f"{w_factor}_{p_factor}"] = corr
                        else:
                            correlations[f"{w_factor}_{p_factor}"] = 0
                    except:
                        correlations[f"{w_factor}_{p_factor}"] = 0
    
    # Generate explanations for significant correlations
    explanations = []
    
    for key, corr in correlations.items():
        if abs(corr) >= 0.3:  # Significant correlation threshold
            w_factor, p_factor = key.split('_', 1)
            direction = "positively" if corr > 0 else "negatively"
            strength = "strongly" if abs(corr) > 0.6 else "moderately"
            
            explanation = {
                'correlation': f"{w_factor}_{p_factor}",
                'value': corr,
                'explanation': get_weather_correlation_explanation(w_factor, p_factor, corr)
            }
            explanations.append(explanation)
    
    return {
        'correlations': correlations,
        'explanations': explanations
    }

def get_weather_correlation_explanation(weather_factor, pollution_factor, correlation_value):
    """Generate explanation for correlation between weather factor and pollution level"""
    pollutant = "NO₂" if pollution_factor == "no2_level" else "PM2.5"
    
    explanations = {
        'temperature': {
            'positive': f"Higher temperatures are associated with increased {pollutant} levels, possibly due to increased photochemical reactions forming secondary pollutants or higher energy consumption.",
            'negative': f"Lower temperatures are associated with increased {pollutant} levels, potentially due to increased heating/burning activities or temperature inversions trapping pollutants near the ground."
        },
        'humidity': {
            'positive': f"Higher humidity is associated with increased {pollutant} levels. This may be due to humid conditions slowing the dispersion of pollutants or facilitating secondary pollutant formation.",
            'negative': f"Lower humidity is associated with increased {pollutant} levels. Dry air may promote dust suspension and particulate matter accumulation in the atmosphere."
        },
        'wind_speed': {
            'positive': f"Higher wind speeds correlate with increased {pollutant} levels, which is unusual and might suggest transport of pollutants from upwind sources.",
            'negative': f"Lower wind speeds correlate with increased {pollutant} levels, likely due to reduced dispersion and ventilation of pollutants in stagnant air conditions."
        },
        'precipitation': {
            'positive': f"Higher precipitation is associated with increased {pollutant} levels, which is unusual and might indicate measurement interference or other complex factors.",
            'negative': f"Lower precipitation is associated with increased {pollutant} levels, as rainfall typically washes out pollutants from the air ('wet deposition')."
        },
        'pressure': {
            'positive': f"Higher atmospheric pressure is associated with increased {pollutant} levels, potentially indicating stable air conditions that trap pollutants.",
            'negative': f"Lower atmospheric pressure is associated with increased {pollutant} levels, which might be related to changing weather systems bringing in polluted air masses."
        }
    }
    
    factor_explanation = explanations.get(weather_factor, {})
    direction = 'positive' if correlation_value > 0 else 'negative'
    
    return factor_explanation.get(direction, f"There is a {direction} correlation between {weather_factor} and {pollutant} levels.")
