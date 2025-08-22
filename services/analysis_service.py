import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from scipy import stats
import json

def analyze_pollution_levels(sentinel_data, modis_data):
    """
    Combine and analyze pollution data from different sources with enhanced analysis.
    """
    # Merge data on timestamp
    combined_data = pd.merge(
        sentinel_data, 
        modis_data, 
        on='timestamp', 
        suffixes=('_sentinel', '_modis')
    )
    
    # Calculate pollution index based on NO2 and PM2.5 values
    # This is a simplified model for the MVP
    combined_data['pollution_index'] = (
        0.5 * combined_data['no2_value'] / 40 +  # WHO guideline for NO2 is 40 µg/m³
        0.5 * combined_data['pm25_value'] / 25   # WHO guideline for PM2.5 is 25 µg/m³
    )
    
    # Calculate air quality index (US EPA method - simplified)
    combined_data['aqi'] = calculate_aqi(combined_data)
    
    # Calculate health risk index
    combined_data['health_risk'] = calculate_health_risk_index(combined_data)
    
    # Calculate additional metrics
    combined_data['exceeds_who_no2'] = combined_data['no2_value'] > 40
    combined_data['exceeds_who_pm25'] = combined_data['pm25_value'] > 25
    
    # Preserve location before grouping
    # Get the location from either sentinel or modis data (they should be the same now)
    location = combined_data['location_sentinel'].iloc[0] if 'location_sentinel' in combined_data.columns else combined_data['location'].iloc[0]
    
    # Exclude non-numeric columns for the mean calculation
    numeric_data = combined_data.select_dtypes(include=[np.number])
    
    # Group by day and calculate daily averages
    daily_data = numeric_data.groupby(combined_data['timestamp'].dt.date).mean()
    
    # Detect anomalies in pollution levels
    anomalies = detect_anomalies(daily_data)
    # Convert anomaly dates to strings to ensure they're serializable
    anomaly_dates = [str(date) for date in anomalies]
    
    # Add trend analysis
    trend_analysis = analyze_trends(daily_data)
    
    # Convert to dictionary for API response
    result = []
    for date, row in daily_data.iterrows():
        # Convert date to string for comparison and serialization
        date_str = str(date)
        result.append({
            'date': date_str,
            'no2_level': float(row.get('no2_value', 0)),
            'pm25_level': float(row.get('pm25_value', 0)),
            'pollution_index': float(row['pollution_index']),
            'aqi': float(row.get('aqi', 0)),
            'health_risk': float(row.get('health_risk', 0)),
            'is_anomaly': date_str in anomaly_dates,  # Compare strings to strings
            'latitude': float(row.get('latitude_sentinel', row.get('latitude', 0))),
            'longitude': float(row.get('longitude_sentinel', row.get('longitude', 0))),
            'location': location  # Add location back to the result
        })
    
    # Add summary statistics and trends
    if len(result) > 0:
        # Make sure all values are JSON serializable
        result[0]['summary'] = {
            'avg_no2': float(daily_data['no2_value'].mean() if 'no2_value' in daily_data else 0),
            'avg_pm25': float(daily_data['pm25_value'].mean() if 'pm25_value' in daily_data else 0),
            'max_no2': float(daily_data['no2_value'].max() if 'no2_value' in daily_data else 0),
            'max_pm25': float(daily_data['pm25_value'].max() if 'pm25_value' in daily_data else 0),
            'days_exceeding_who_no2': int(daily_data['exceeds_who_no2'].sum() if 'exceeds_who_no2' in daily_data else 0),
            'days_exceeding_who_pm25': int(daily_data['exceeds_who_pm25'].sum() if 'exceeds_who_pm25' in daily_data else 0),
            'trend': make_json_serializable(trend_analysis)
        }
    
    return result

def predict_risk_zones(pollution_data):
    """
    Identify and categorize risk zones based on pollution levels.
    Enhanced with more detailed risk classification and population impact.
    """
    # Extract data for clustering
    data_points = np.array([[d['pollution_index'], d['latitude'], d['longitude']] 
                           for d in pollution_data])
    
    # Remember the location
    location = pollution_data[0]['location'] if 'location' in pollution_data[0] else None
    
    # Simple clustering to identify risk zones (for MVP)
    if len(data_points) >= 3:  # Need at least 3 data points for 3 clusters
        kmeans = KMeans(n_clusters=3, random_state=0).fit(data_points)
        
        # Classify clusters by pollution index
        cluster_avg_pollution = {}
        for i, cluster_id in enumerate(kmeans.labels_):
            if cluster_id not in cluster_avg_pollution:
                cluster_avg_pollution[cluster_id] = []
            cluster_avg_pollution[cluster_id].append(data_points[i][0])
        
        for cluster_id in cluster_avg_pollution:
            cluster_avg_pollution[cluster_id] = np.mean(cluster_avg_pollution[cluster_id])
        
        # Sort clusters by pollution level
        sorted_clusters = sorted(cluster_avg_pollution.items(), key=lambda x: x[1], reverse=True)
        risk_mapping = {sorted_clusters[0][0]: 'high', sorted_clusters[1][0]: 'medium', sorted_clusters[2][0]: 'low'}
        
        # Create risk zone data with enhanced information
        risk_zones = []
        for i, cluster_id in enumerate(kmeans.labels_):
            # Get additional data from pollution_data if available
            additional_data = {}
            if i < len(pollution_data):
                if 'aqi' in pollution_data[i]:
                    additional_data['aqi'] = float(pollution_data[i]['aqi'])
                if 'health_risk' in pollution_data[i]:
                    additional_data['health_risk'] = float(pollution_data[i]['health_risk'])
            
            risk_zone = {
                'latitude': float(data_points[i][1]),
                'longitude': float(data_points[i][2]),
                'pollution_index': float(data_points[i][0]),
                'risk_level': risk_mapping[cluster_id],
                'location': location,  # Include location in risk zone data
                'estimated_affected_population': int(estimate_affected_population(location, risk_mapping[cluster_id]))
            }
            
            # Add additional data if available
            risk_zone.update(additional_data)
            risk_zones.append(risk_zone)
        
        return risk_zones
    else:
        # Not enough data for clustering
        return [{'latitude': float(d['latitude']), 'longitude': float(d['longitude']), 
                 'pollution_index': float(d['pollution_index']), 'risk_level': 'unknown',
                 'location': location if location else None,
                 'estimated_affected_population': 0} 
                for d in pollution_data]

def make_json_serializable(obj):
    """Helper function to ensure objects are JSON serializable"""
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_serializable(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient='records')
    elif isinstance(obj, pd.Series):
        return obj.to_dict()
    elif hasattr(obj, 'isoformat'):  # For datetime objects
        return obj.isoformat()
    elif isinstance(obj, bool):  # Explicitly handle boolean
        return bool(obj)
    else:
        return obj

def calculate_aqi(data):
    """Calculate Air Quality Index based on PM2.5 and NO2 values."""
    # Simplified AQI calculation (based on US EPA standards)
    # In a real implementation, this would be more complex and consider more pollutants
    
    # Calculate PM2.5 AQI
    pm25_aqi = data['pm25_value'].apply(lambda x: calculate_pm25_aqi(x))
    
    # Calculate NO2 AQI
    no2_aqi = data['no2_value'].apply(lambda x: calculate_no2_aqi(x))
    
    # Take the maximum of the two AQIs
    return pd.concat([pm25_aqi, no2_aqi], axis=1).max(axis=1)

def calculate_pm25_aqi(pm25):
    """Calculate AQI from PM2.5 concentration."""
    if pm25 <= 12:
        return (50 - 0) / (12 - 0) * (pm25 - 0) + 0
    elif pm25 <= 35.4:
        return (100 - 51) / (35.4 - 12.1) * (pm25 - 12.1) + 51
    elif pm25 <= 55.4:
        return (150 - 101) / (55.4 - 35.5) * (pm25 - 35.5) + 101
    elif pm25 <= 150.4:
        return (200 - 151) / (150.4 - 55.5) * (pm25 - 55.5) + 151
    elif pm25 <= 250.4:
        return (300 - 201) / (250.4 - 150.5) * (pm25 - 150.5) + 201
    else:
        return (500 - 301) / (500 - 250.5) * (pm25 - 250.5) + 301

def calculate_no2_aqi(no2):
    """Calculate AQI from NO2 concentration."""
    if no2 <= 53:
        return (50 - 0) / (53 - 0) * (no2 - 0) + 0
    elif no2 <= 100:
        return (100 - 51) / (100 - 54) * (no2 - 54) + 51
    elif no2 <= 360:
        return (150 - 101) / (360 - 101) * (no2 - 101) + 101
    elif no2 <= 649:
        return (200 - 151) / (649 - 361) * (no2 - 361) + 151
    elif no2 <= 1249:
        return (300 - 201) / (1249 - 650) * (no2 - 650) + 201
    else:
        return (500 - 301) / (2049 - 1250) * (no2 - 1250) + 301

def calculate_health_risk_index(data):
    """Calculate a simplified health risk index based on pollution levels."""
    # This is a very simplified model - a real model would be much more sophisticated
    # and would consider more variables including population demographics
    
    # Normalize values to WHO guidelines
    no2_normalized = data['no2_value'] / 40  # WHO guideline for NO2
    pm25_normalized = data['pm25_value'] / 25  # WHO guideline for PM2.5
    
    # PM2.5 has a greater health impact, so we weight it more heavily
    health_risk = (0.4 * no2_normalized + 0.6 * pm25_normalized) * 10
    
    return health_risk

def detect_anomalies(data):
    """Detect anomalies in pollution data using simple statistical methods."""
    anomalies = set()
    
    if 'no2_value' in data.columns and len(data) > 5:
        try:
            # Calculate z-scores for NO2
            z_scores = stats.zscore(data['no2_value'])
            # Find dates with z-scores > 3 (outliers)
            for date, z in zip(data.index, z_scores):
                if abs(z) > 3:
                    anomalies.add(date)
        except Exception as e:
            print(f"Error detecting NO2 anomalies: {e}")
    
    if 'pm25_value' in data.columns and len(data) > 5:
        try:
            # Calculate z-scores for PM2.5
            z_scores = stats.zscore(data['pm25_value'])
            # Find dates with z-scores > 3 (outliers)
            for date, z in zip(data.index, z_scores):
                if abs(z) > 3:
                    anomalies.add(date)
        except Exception as e:
            print(f"Error detecting PM2.5 anomalies: {e}")
    
    return list(anomalies)

def analyze_trends(data):
    """Analyze trends in pollution data."""
    trends = {}
    
    if 'no2_value' in data.columns and len(data) >= 3:
        try:
            # Calculate simple linear regression
            x = np.arange(len(data))
            y = data['no2_value'].values
            slope, _, r_value, p_value, _ = stats.linregress(x, y)
            
            trends['no2_trend'] = {
                'slope': float(slope),
                'r_squared': float(r_value ** 2),
                'p_value': float(p_value),
                'is_significant': bool(p_value < 0.05),  # Explicitly convert to Python bool
                'direction': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
            }
        except Exception as e:
            print(f"Error analyzing NO2 trends: {e}")
    
    if 'pm25_value' in data.columns and len(data) >= 3:
        try:
            # Calculate simple linear regression
            x = np.arange(len(data))
            y = data['pm25_value'].values
            slope, _, r_value, p_value, _ = stats.linregress(x, y)
            
            trends['pm25_trend'] = {
                'slope': float(slope),
                'r_squared': float(r_value ** 2),
                'p_value': float(p_value),
                'is_significant': bool(p_value < 0.05),  # Explicitly convert to Python bool
                'direction': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
            }
        except Exception as e:
            print(f"Error analyzing PM2.5 trends: {e}")
    
    return trends

def estimate_affected_population(location, risk_level):
    """Estimate the population affected by pollution in each risk zone."""
    # This is a simplified model - in reality, this would use detailed population density maps
    
    # Population estimates for each location
    population = {
        'Nagpur': 2400000,
        'Mumbai': 12400000,
        'Delhi': 19000000,
        'London': 8900000
    }.get(location, 1000000)
    
    # Percentage of population in each risk level (simplified model)
    risk_percentages = {
        'high': 0.15,  # 15% of population in high risk areas
        'medium': 0.30,  # 30% of population in medium risk areas
        'low': 0.40,  # 40% of population in low risk areas
        'unknown': 0.05  # 5% of population in unknown risk areas
    }
    
    # Calculate affected population
    return int(population * risk_percentages.get(risk_level, 0.01) / 3)  # Divide by 3 assuming 3 zones per risk level
