"""
Configuration settings for the diving conditions checker.
"""

# API Configuration
API_KEYS = [
    "ea996e2a-88a5-11ef-ae24-0242ac130003-ea996e98-88a5-11ef-ae24-0242ac130003",
    "6b7ca118-da20-11ee-8a07-0242ac130002-6b7ca186-da20-11ee-8a07-0242ac130002",
    "1d6c47a6-8a21-11ef-a0d5-0242ac130003-1d6c4814-8a21-11ef-a0d5-0242ac130003",
    "bf5e8542-8a21-11ef-8d8d-0242ac130003-bf5e8614-8a21-11ef-8d8d-0242ac130003"
]

# Location coordinates
LOCATION = {
    'lat': -23.9608,
    'lon': -46.3336
}

# API Endpoints
STORMGLASS_ENDPOINTS = {
    'astronomy': 'https://api.stormglass.io/v2/astronomy/point',
    'tide': 'https://api.stormglass.io/v2/tide/extremes/point',
    'weather': 'https://api.stormglass.io/v2/weather/point'
}

# Time configurations
SUMMER_MONTHS = [12, 1, 2]
SUMMER_START_DAY = 21
SUMMER_START_MONTH = 12
RAIN_CHECK_DAYS = 3 