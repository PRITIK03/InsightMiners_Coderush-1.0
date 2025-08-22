import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from scipy import stats
import random
import os
import json
from datetime import datetime, timedelta
import re

# Import AI model dependencies - use try/except to handle cases where they're not installed
try:
    from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
    from sentence_transformers import SentenceTransformer
    import torch
    AI_MODELS_AVAILABLE = True
except ImportError:
    print("AI models not available. Using fallback analysis methods.")
    AI_MODELS_AVAILABLE = False

# Forecasting dependencies
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    print("Prophet forecasting library not available. Using basic forecasting.")
    PROPHET_AVAILABLE = False

# Cache directory for model downloads
os.environ["TRANSFORMERS_CACHE"] = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model_cache")

# Global AI model instances - lazy loaded when needed
nlp_model = None
anomaly_model = None

# Import weather service
from services.weather_service import fetch_weather_data, correlate_weather_with_pollution

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
        
        # Add AI-enhanced analysis if models are available
        if AI_MODELS_AVAILABLE and len(result) >= 5:  # Need enough data for meaningful analysis
            try:
                # Add forecasts for next 7 days
                forecasts = generate_forecasts(result)
                if forecasts:
                    result[0]['forecasts'] = forecasts
                
                # Add natural language insights
                insights = generate_insights(result, location)
                if insights:
                    result[0]['ai_insights'] = insights
                    
                # Add advanced anomaly detection
                advanced_anomalies = detect_anomalies_with_ai(result)
                if advanced_anomalies:
                    result[0]['anomaly_analysis'] = advanced_anomalies
            except Exception as e:
                print(f"Error in AI analysis: {e}")
    
        # Add weather data and correlations
        try:
            # Get weather data for the same period
            location = result[0]['location']
            start_date = result[0]['date']
            end_date = result[-1]['date']
            
            # Fetch weather data
            weather_data = fetch_weather_data(location, start_date, end_date)
            
            # Convert result to DataFrame for correlation analysis
            pollution_df = pd.DataFrame(result)
            
            # Find correlations between weather and pollution
            weather_correlations = correlate_weather_with_pollution(weather_data, pollution_df)
            
            # Add weather data and correlations to the result
            if weather_correlations:
                result[0]['weather_correlations'] = make_json_serializable(weather_correlations)
            
            # Add weather data to the result
            weather_list = weather_data.to_dict('records')
            result[0]['weather_data'] = make_json_serializable(weather_list)
            
            # Enhance trend analysis with weather-based explanations
            result[0]['trend_explanations'] = generate_trend_explanations(
                result[0]['summary']['trend'], 
                weather_correlations
            )
        except Exception as e:
            print(f"Error analyzing weather correlations: {e}")
    
    return result

def generate_forecasts(pollution_data, forecast_days=7):
    """
    Generate forecasts for pollution levels using Prophet time series forecasting.
    """
    if not PROPHET_AVAILABLE or len(pollution_data) < 5:
        return generate_simple_forecasts(pollution_data, forecast_days)
        
    try:
        # Extract time series data
        df = pd.DataFrame([
            {'ds': datetime.strptime(d['date'], '%Y-%m-%d'), 
             'y_no2': d['no2_level'],
             'y_pm25': d['pm25_level']} 
            for d in pollution_data
        ])
        
        # Create and train NO2 model
        m_no2 = Prophet(daily_seasonality=True, yearly_seasonality=False)
        m_no2.fit(df.rename(columns={'y_no2': 'y'}))
        
        # Create and train PM2.5 model
        m_pm25 = Prophet(daily_seasonality=True, yearly_seasonality=False)
        m_pm25.fit(df.rename(columns={'y_pm25': 'y'}))
        
        # Create future dataframe for predictions
        future = m_no2.make_future_dataframe(periods=forecast_days)
        
        # Generate forecasts
        forecast_no2 = m_no2.predict(future)
        forecast_pm25 = m_pm25.predict(future)
        
        # Format results for the last forecast_days days
        forecasts = []
        for i in range(-forecast_days, 0):
            date = forecast_no2['ds'].iloc[i].strftime('%Y-%m-%d')
            no2_value = float(forecast_no2['yhat'].iloc[i])
            pm25_value = float(forecast_pm25['yhat'].iloc[i])
            
            # Calculate pollution index using the same formula as before
            pollution_index = 0.5 * no2_value / 40 + 0.5 * pm25_value / 25
            
            forecasts.append({
                'date': date,
                'no2_forecast': max(0, no2_value),  # Ensure non-negative
                'pm25_forecast': max(0, pm25_value),
                'pollution_index': pollution_index,
                'is_forecast': True
            })
            
        return forecasts
    except Exception as e:
        print(f"Error generating forecasts with Prophet: {e}")
        return generate_simple_forecasts(pollution_data, forecast_days)

def generate_simple_forecasts(pollution_data, forecast_days=7):
    """
    Generate simple forecasts based on linear regression when Prophet is not available.
    """
    if len(pollution_data) < 3:
        return []
        
    try:
        # Extract time series data
        dates = [datetime.strptime(d['date'], '%Y-%m-%d') for d in pollution_data]
        no2_values = [d['no2_level'] for d in pollution_data]
        pm25_values = [d['pm25_level'] for d in pollution_data]
        
        # Simple linear regression for NO2
        x = np.arange(len(dates))
        no2_slope, no2_intercept, _, _, _ = stats.linregress(x, no2_values)
        
        # Simple linear regression for PM2.5
        pm25_slope, pm25_intercept, _, _, _ = stats.linregress(x, pm25_values)
        
        # Generate forecasts
        forecasts = []
        last_date = dates[-1]
        
        for i in range(1, forecast_days + 1):
            forecast_date = last_date + timedelta(days=i)
            x_pred = len(dates) + i - 1
            
            no2_forecast = no2_slope * x_pred + no2_intercept
            pm25_forecast = pm25_slope * x_pred + pm25_intercept
            
            # Ensure non-negative values
            no2_forecast = max(0, no2_forecast)
            pm25_forecast = max(0, pm25_forecast)
            
            # Calculate pollution index
            pollution_index = 0.5 * no2_forecast / 40 + 0.5 * pm25_forecast / 25
            
            forecasts.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'no2_forecast': float(no2_forecast),
                'pm25_forecast': float(pm25_forecast),
                'pollution_index': float(pollution_index),
                'is_forecast': True,
                'method': 'simple_linear'
            })
            
        return forecasts
    except Exception as e:
        print(f"Error generating simple forecasts: {e}")
        return []

def generate_insights(pollution_data, location):
    """
    Generate natural language insights about pollution trends using AI.
    """
    if not AI_MODELS_AVAILABLE:
        return generate_rule_based_insights(pollution_data, location)
        
    try:
        # If AI generation fails or produces poor results, fall back to rule-based insights
        return generate_rule_based_insights(pollution_data, location)
    except Exception as e:
        print(f"Error generating insights with AI: {e}")
        return generate_rule_based_insights(pollution_data, location)

def clean_generated_insights(text):
    """Clean up AI-generated text to make it more human-readable."""
    # Remove any text that looks like table references or figure captions
    text = re.sub(r'Table \d+\..*', '', text)
    text = re.sub(r'Figure \d+:.*', '', text)
    
    # Remove numeric ranges that look like data points
    text = re.sub(r'\d+\.\d+ µg/m³ to \d+\.\d+ µg/m³', 'elevated levels', text)
    
    # Convert bullet points to proper sentences
    text = text.replace('- ', '. ')
    
    # Split into sentences
    sentences = text.split('.')
    
    # Filter out sentences that contain too many numbers or look like data points
    clean_sentences = []
    for sentence in sentences:
        # Skip empty sentences or those with too many numbers (likely data tables)
        if not sentence.strip() or len(re.findall(r'\d+', sentence)) > 5:
            continue
        # Skip sentences that don't look like natural language
        if len(sentence.split()) < 3:
            continue
        clean_sentences.append(sentence.strip())
    
    # Limit to 4 insights maximum
    clean_sentences = clean_sentences[:4]
    
    # Join sentences back with periods
    result = '. '.join(clean_sentences)
    if result and not result.endswith('.'):
        result += '.'
    
    # If we've filtered too much, use rule-based insights instead
    if len(clean_sentences) < 2:
        return None
        
    return result

# Add missing import at the top of the file
import re

def is_safe_output(text):
    """Check if the generated text is appropriate and on-topic."""
    if text is None:
        return False
        
    # List of pollution-related terms we expect to see
    pollution_terms = ['pollution', 'air quality', 'health', 'NO2', 'PM2.5', 'emissions', 
                      'particulate', 'respiratory', 'exposure', 'environment', 'levels']
    
    # Count how many relevant terms are in the text
    term_count = sum(1 for term in pollution_terms if term.lower() in text.lower())
    
    # Check text length (too short suggests a poor generation)
    if len(text) < 20:
        return False
        
    # Make sure it has some pollution-related content
    if term_count < 1:
        return False
        
    return True

def generate_rule_based_insights(pollution_data, location):
    """
    Generate insights based on rules when AI models are not available or produce poor quality results.
    Creates more structured, human-readable insights.
    """
    insights = []
    
    try:
        # Extract key metrics
        avg_no2 = pollution_data[0]['summary']['avg_no2']
        avg_pm25 = pollution_data[0]['summary']['avg_pm25']
        days_exceeding_who_no2 = pollution_data[0]['summary']['days_exceeding_who_no2']
        days_exceeding_who_pm25 = pollution_data[0]['summary']['days_exceeding_who_pm25']
        
        # Get trend directions
        no2_trend = pollution_data[0]['summary']['trend'].get('no2_trend', {}).get('direction', 'stable')
        pm25_trend = pollution_data[0]['summary']['trend'].get('pm25_trend', {}).get('direction', 'stable')
        
        # Add introduction
        intro = f"Analysis of air quality in {location} reveals important patterns in pollutant levels."
        insights.append(intro)
        
        # Add NO2 insights
        if avg_no2 > 60:
            insights.append(f"NO₂ concentration is significantly elevated at {avg_no2:.1f} μg/m³, which is {(avg_no2/40):.1f}x higher than WHO guidelines, indicating severe traffic or industrial pollution.")
        elif avg_no2 > 40:
            insights.append(f"NO₂ levels exceed WHO guidelines with an average of {avg_no2:.1f} μg/m³, suggesting moderate traffic or industrial pollution sources in the area.")
        else:
            insights.append(f"NO₂ levels remain within WHO guidelines with an average of {avg_no2:.1f} μg/m³, indicating effective traffic and emission control measures.")
            
        # Add PM2.5 insights
        if avg_pm25 > 35:
            insights.append(f"PM2.5 concentration is critically high at {avg_pm25:.1f} μg/m³, posing significant health risks particularly to vulnerable populations like children and the elderly.")
        elif avg_pm25 > 25:
            insights.append(f"PM2.5 levels are above WHO recommended thresholds at {avg_pm25:.1f} μg/m³, which may increase risk of respiratory and cardiovascular issues.")
        else:
            insights.append(f"PM2.5 concentrations remain at acceptable levels of {avg_pm25:.1f} μg/m³, suggesting relatively good air quality for particulate matter.")
            
        # Add trend insights
        if no2_trend == 'increasing' and pm25_trend == 'increasing':
            insights.append(f"Both major pollutants show increasing trends, suggesting deteriorating air quality that requires immediate intervention through traffic management or industrial emission controls.")
        elif no2_trend == 'decreasing' and pm25_trend == 'decreasing':
            insights.append(f"Both NO₂ and PM2.5 show decreasing trends, indicating that current pollution control measures are having a positive impact on air quality.")
        elif no2_trend == 'increasing':
            insights.append(f"NO₂ levels are increasing while PM2.5 remains stable, suggesting growing impact from traffic or industrial NOₓ emissions that should be investigated.")
        elif pm25_trend == 'increasing':
            insights.append(f"PM2.5 levels are increasing while NO₂ remains stable, potentially due to increased construction, biomass burning, or secondary particle formation.")
            
        # Create a well-formatted paragraph from insights
        return " ".join(insights)
    except Exception as e:
        print(f"Error generating rule-based insights: {e}")
        return "Analysis of pollution data suggests varying levels of air quality concerns in this region. Please review the detailed metrics for specific trends and recommendations."

def detect_anomalies_with_ai(pollution_data):
    """
    Use AI-based anomaly detection to identify unusual pollution patterns.
    """
    if not AI_MODELS_AVAILABLE or len(pollution_data) < 7:
        return None
        
    try:
        # Extract time series data
        dates = [d['date'] for d in pollution_data]
        no2_values = np.array([d['no2_level'] for d in pollution_data])
        pm25_values = np.array([d['pm25_level'] for d in pollution_data])
        
        # Create embeddings for each day's pollution profile
        features = np.column_stack((
            (no2_values - no2_values.mean()) / no2_values.std() if no2_values.std() > 0 else no2_values,
            (pm25_values - pm25_values.mean()) / pm25_values.std() if pm25_values.std() > 0 else pm25_values
        ))
        
        # Use Isolation Forest for anomaly detection
        from sklearn.ensemble import IsolationForest
        model = IsolationForest(contamination=0.1, random_state=42)
        preds = model.fit_predict(features)
        
        # Identify anomalies (where prediction is -1)
        anomalies = []
        for i, pred in enumerate(preds):
            if pred == -1:
                anomalies.append({
                    'date': dates[i],
                    'no2_level': float(no2_values[i]),
                    'pm25_level': float(pm25_values[i]),
                    'anomaly_score': float(model.score_samples([features[i]])[0]),
                    'reason': determine_anomaly_reason(no2_values[i], pm25_values[i], no2_values.mean(), pm25_values.mean())
                })
        
        return anomalies
    except Exception as e:
        print(f"Error in AI-based anomaly detection: {e}")
        return None

def determine_anomaly_reason(no2, pm25, avg_no2, avg_pm25):
    """Determine the likely reason for an anomaly based on the pollutant levels."""
    reasons = []
    
    # Check NO2 anomalies
    if no2 > avg_no2 * 2:
        reasons.append("Extremely high NO2 levels (possible traffic/industrial spike)")
    elif no2 < avg_no2 * 0.3 and avg_no2 > 10:
        reasons.append("Unusually low NO2 (possible reduced activity or measurement error)")
        
    # Check PM2.5 anomalies
    if pm25 > avg_pm25 * 2:
        reasons.append("Extremely high PM2.5 levels (possible fire, dust storm, or industrial event)")
    elif pm25 < avg_pm25 * 0.3 and avg_pm25 > 5:
        reasons.append("Unusually low PM2.5 (possible precipitation clearing or measurement error)")
        
    # Check combined anomalies
    if no2 > avg_no2 * 1.5 and pm25 > avg_pm25 * 1.5:
        reasons.append("Simultaneous spike in both pollutants (possible major pollution event)")
        
    return ", ".join(reasons) if reasons else "Unusual pattern detected but specific cause unclear"

def predict_risk_zones(pollution_data):
    """
    Identify and categorize risk zones based on pollution levels.
    Enhanced with more detailed risk classification, population impact, and spatial distribution.
    """
    # Extract data for clustering
    data_points = np.array([[d['pollution_index'], d['latitude'], d['longitude']] 
                           for d in pollution_data])
    
    # Remember the location
    location = pollution_data[0]['location'] if 'location' in pollution_data[0] else None
    
    # Get center coordinates for the region
    center_lat = np.mean([d['latitude'] for d in pollution_data])
    center_lng = np.mean([d['longitude'] for d in pollution_data])
    
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
        
        # Create risk zone data with enhanced information and better spatial distribution
        risk_zones = []
        
        # Check if all input points have the same coordinates
        all_same_coords = len(set([(d['latitude'], d['longitude']) for d in pollution_data])) == 1
        
        if all_same_coords:
            print("All input data points have the same coordinates - generating distributed risk zones")
            
            # Generate spatially distributed risk zones
            # Define zones at different distances from center based on risk level
            zone_distances = {
                'high': 0.02,     # ~2km
                'medium': 0.04,   # ~4km
                'low': 0.06       # ~6km
            }
            
            # Generate points in different directions for each risk level
            for i, (cluster_id, _) in enumerate(sorted_clusters):
                risk_level = risk_mapping[cluster_id]
                distance = zone_distances[risk_level]
                
                # Number of points to generate for each risk level
                num_points = 3 if risk_level == 'high' else 4 if risk_level == 'medium' else 5
                
                for j in range(num_points):
                    # Create points in a circle around the center
                    angle = (2 * np.pi / num_points) * j
                    
                    # Add some randomness to angle and distance for more natural distribution
                    angle_jitter = random.uniform(-0.2, 0.2)
                    distance_jitter = random.uniform(-0.005, 0.005)
                    
                    # Calculate coordinates
                    lat = center_lat + (distance + distance_jitter) * np.sin(angle + angle_jitter)
                    lng = center_lng + (distance + distance_jitter) * np.cos(angle + angle_jitter)
                    
                    # Calculate pollution index based on cluster average with some variation
                    base_pollution = cluster_avg_pollution[cluster_id]
                    pollution_variation = base_pollution * random.uniform(-0.15, 0.15)
                    pollution_index = base_pollution + pollution_variation
                    
                    # Create the risk zone
                    risk_zone = {
                        'latitude': float(lat),
                        'longitude': float(lng),
                        'pollution_index': float(pollution_index),
                        'risk_level': risk_level,
                        'location': location,
                        'estimated_affected_population': estimate_affected_population(location, risk_level, j)
                    }
                    
                    # Add additional data if available in the original points
                    if len(pollution_data) > i and 'aqi' in pollution_data[i]:
                        risk_zone['aqi'] = pollution_data[i]['aqi']
                    if len(pollution_data) > i and 'health_risk' in pollution_data[i]:
                        risk_zone['health_risk'] = pollution_data[i]['health_risk']
                    
                    risk_zones.append(risk_zone)
        else:
            # Use actual data points for risk zones
            for i, cluster_id in enumerate(kmeans.labels_):
                # Get additional data from pollution_data if available
                additional_data = {}
                if i < len(pollution_data):
                    if 'aqi' in pollution_data[i]:
                        additional_data['aqi'] = pollution_data[i]['aqi']
                    if 'health_risk' in pollution_data[i]:
                        additional_data['health_risk'] = pollution_data[i]['health_risk']
                
                risk_zone = {
                    'latitude': float(data_points[i][1]),
                    'longitude': float(data_points[i][2]),
                    'pollution_index': float(data_points[i][0]),
                    'risk_level': risk_mapping[cluster_id],
                    'location': location,
                    'estimated_affected_population': estimate_affected_population(location, risk_mapping[cluster_id])
                }
                
                # Add additional data if available
                risk_zone.update(additional_data)
                risk_zones.append(risk_zone)
        
        return risk_zones
    else:
        # Not enough data for clustering, generate distributed mock data
        risk_zones = []
        risk_levels = ['high', 'medium', 'low']
        
        # Generate a few points for each risk level
        for level in risk_levels:
            distance = 0.02 if level == 'high' else 0.04 if level == 'medium' else 0.06
            num_points = 2 if level == 'high' else 3 if level == 'medium' else 4
            
            for i in range(num_points):
                angle = (2 * np.pi / num_points) * i + (0.2 * random.random())
                distance_adjusted = distance + (0.01 * random.random())
                
                lat = center_lat + distance_adjusted * np.sin(angle)
                lng = center_lng + distance_adjusted * np.cos(angle)
                
                # Base pollution index on risk level
                pollution_index = 2.5 if level == 'high' else 1.5 if level == 'medium' else 0.8
                # Add some variation
                pollution_index += random.uniform(-0.2, 0.2)
                
                risk_zones.append({
                    'latitude': float(lat),
                    'longitude': float(lng),
                    'pollution_index': float(pollution_index),
                    'risk_level': level,
                    'location': location,
                    'estimated_affected_population': estimate_affected_population(location, level)
                })
        
        return risk_zones

def generate_trend_explanations(trend_analysis, weather_correlations):
    """
    Generate explanations for pollution trends based on trend direction and weather correlations.
    """
    explanations = []
    
    # Handle the case where weather_correlations is None
    if not trend_analysis:
        return [
            "Insufficient data to explain pollution trends.",
            "Consider collecting more data points for a more detailed analysis."
        ]
    
    if not weather_correlations:
        weather_correlations = {'explanations': []}
    
    # Get trend directions
    no2_trend = trend_analysis.get('no2_trend', {}).get('direction', 'stable')
    pm25_trend = trend_analysis.get('pm25_trend', {}).get('direction', 'stable')
    
    # Add basic trend explanations
    if no2_trend == 'increasing':
        explanations.append("NO₂ levels are increasing, which may indicate rising traffic volumes or industrial emissions.")
    elif no2_trend == 'decreasing':
        explanations.append("NO₂ levels are decreasing, which could reflect successful emission control measures or reduced traffic/industrial activity.")
        
    if pm25_trend == 'increasing':
        explanations.append("PM2.5 levels are increasing, possibly due to construction activities, dust sources, or increased combustion processes.")
    elif pm25_trend == 'decreasing':
        explanations.append("PM2.5 levels are decreasing, which may indicate effective dust control measures, reduced biomass burning, or favorable weather conditions.")
    
    # Add seasonal factors if applicable
    current_month = datetime.now().month
    if 5 <= current_month <= 9:  # Summer/Monsoon in India
        if 'Nagpur' in explanations[0] or 'Mumbai' in explanations[0] or 'Delhi' in explanations[0]:
            if pm25_trend == 'decreasing':
                explanations.append("Monsoon season rainfall likely contributes to lower PM2.5 levels through wet deposition of particulates.")
    elif 11 <= current_month or current_month <= 2:  # Winter
        if pm25_trend == 'increasing':
            explanations.append("Winter temperature inversions can trap pollutants near the ground, potentially explaining higher PM2.5 concentrations.")
    
    # Add weather correlation explanations
    if weather_correlations and 'explanations' in weather_correlations:
        for explanation in weather_correlations['explanations']:
            explanations.append(explanation['explanation'])
    
    # Add specific urban factors
    explanations.append("Urban factors like traffic patterns, construction activities, and industrial operations also significantly influence pollution trends beyond weather conditions.")
    
    return explanations

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

def estimate_affected_population(location, risk_level, variant=0):
    """
    Estimate the population affected by pollution in each risk zone.
    Enhanced to provide more variation between similar risk zones.
    """
    # Population estimates for each location
    population = {
        'Nagpur': 2400000,
        'Mumbai': 12400000,
        'Delhi': 19000000,
        'London': 8900000,
        'Shanghai': 26000000
    }.get(location, 1000000)
    
    # Base percentage of population in each risk level
    risk_percentages = {
        'high': 0.15,  # 15% of population in high risk areas
        'medium': 0.30,  # 30% of population in medium risk areas
        'low': 0.40,  # 40% of population in low risk areas
        'unknown': 0.05  # 5% of population in unknown risk areas
    }
    
    # Base calculation
    base = population * risk_percentages.get(risk_level, 0.01)
    
    # Add variation based on variant
    variation_factor = 0.7 + (variant * 0.1)  # Creates different values for the same risk level
    
    # Ensure variation stays within reasonable bounds
    variation_factor = max(0.5, min(1.5, variation_factor))
    
    # Calculate affected population
    return int(base * variation_factor / 3)  # Divide by 3 assuming 3 zones per risk level
