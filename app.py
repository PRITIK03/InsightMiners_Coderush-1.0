from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from services.satellite_service import fetch_sentinel_data, fetch_modis_data
from services.analysis_service import analyze_pollution_levels, predict_risk_zones
from services.gis_service import get_region_boundaries

# Check if weather_service.py exists and import it
try:
    from services.weather_service import fetch_weather_data
    WEATHER_SERVICE_AVAILABLE = True
except ImportError:
    print("Weather service not available")
    WEATHER_SERVICE_AVAILABLE = False

app = Flask(__name__, static_folder='frontend/dist')
# Enable CORS for the React app
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/pollution-data', methods=['GET'])
def get_pollution_data():
    region = request.args.get('region', 'Nagpur')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    
    # Fetch satellite data
    sentinel_data = fetch_sentinel_data(region, start_date, end_date)
    modis_data = fetch_modis_data(region, start_date, end_date)
    
    # Analyze pollution levels
    pollution_levels = analyze_pollution_levels(sentinel_data, modis_data)
    risk_zones = predict_risk_zones(pollution_levels)
    
    return jsonify({
        'pollutionLevels': pollution_levels,
        'riskZones': risk_zones
    })

@app.route('/api/weather-data', methods=['GET'])
def get_weather_data():
    """Separate endpoint for fetching just weather data"""
    if not WEATHER_SERVICE_AVAILABLE:
        return jsonify({
            'error': 'Weather service not available',
            'weatherData': []
        }), 404
        
    region = request.args.get('region', 'Nagpur')
    start_date = request.args.get('start_date', '2023-01-01')
    end_date = request.args.get('end_date', '2023-12-31')
    
    try:
        # Fetch weather data
        weather_data = fetch_weather_data(region, start_date, end_date)
        
        # Convert to list of dictionaries
        weather_list = weather_data.to_dict('records')
        
        return jsonify({
            'weatherData': weather_list
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'weatherData': []
        }), 500

@app.route('/api/region-boundary', methods=['GET'])
def get_region_boundary():
    region = request.args.get('region', 'Nagpur')
    boundary = get_region_boundaries(region)
    return jsonify(boundary)

# Catch-all route to serve the React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
