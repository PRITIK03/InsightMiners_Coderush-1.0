# Pollution Detection System

A satellite and GIS-based system for monitoring and predicting pollution levels.

## Features

- Satellite data integration (Sentinel-5P and MODIS)
- Pollution level analysis (NO2 and PM2.5)
- Risk zone prediction
- Interactive map visualization
- Time series analysis of pollution data

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:5000`

## API Usage

The application provides a REST API for accessing pollution data:

- GET `/api/pollution-data?region=<region>&start_date=<date>&end_date=<date>`

## Future Enhancements

- Crop burning impact modeling
- Temporal anomaly detection
- Machine learning for improved predictions
- Integration with more satellite data sources
