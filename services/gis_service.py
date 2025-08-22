import geopandas as gpd
import json

def get_region_boundaries(region_name):
    """
    Retrieve GIS boundary data for the specified region.
    For MVP, we'll return simplified boundary data.
    """
    # In a production system, this would fetch data from a GIS API
    # For MVP, we'll return hardcoded sample data for Nagpur
    
    if region_name.lower() == 'nagpur':
        # Simplified polygon boundaries for Nagpur
        boundary = {
            'type': 'FeatureCollection',
            'features': [{
                'type': 'Feature',
                'properties': {'name': 'Nagpur'},
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [
                        [
                            [79.0182, 21.0815],
                            [79.1582, 21.0815],
                            [79.1582, 21.2015],
                            [79.0182, 21.2015],
                            [79.0182, 21.0815]
                        ]
                    ]
                }
            }]
        }
        return boundary
    else:
        # Return a default boundary if region not found
        return None
