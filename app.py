from flask import Flask, render_template, jsonify, request
import os
from services.satellite_service import fetch_sentinel_data, fetch_modis_data
from services.analysis_service import analyze_pollution_levels, predict_risk_zones
from services.gis_service import get_region_boundaries

app = Flask(__name__)

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

@app.route('/api/region-boundary', methods=['GET'])
def get_region_boundary():
    region = request.args.get('region', 'Nagpur')
    boundary = get_region_boundaries(region)
    return jsonify(boundary)

if __name__ == '__main__':
    app.run(debug=True)
