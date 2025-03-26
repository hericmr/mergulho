"""
Service to handle all API requests to Stormglass.
"""
import requests
from typing import Optional, Dict, Any
from ..config.settings import API_KEYS, LOCATION, STORMGLASS_ENDPOINTS

class StormglassService:
    def __init__(self):
        self.api_keys = API_KEYS
        self.location = LOCATION
        self.endpoints = STORMGLASS_ENDPOINTS

    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Makes a request to the Stormglass API using available API keys.
        
        Args:
            endpoint: The API endpoint to call
            params: Parameters for the API request
            
        Returns:
            JSON response if successful, None otherwise
        """
        url = self.endpoints[endpoint]
        
        for api_key in self.api_keys:
            print(f"Tentando chave API: {api_key}")
            response = requests.get(url, params=params, headers={'Authorization': api_key})
            
            if response.status_code == 200:
                print(f"Sucesso com a chave: {api_key}")
                return response.json()
            elif response.status_code == 402:
                print(f"Chave {api_key} atingiu o limite. Tentando próxima chave...")
            else:
                print(f"Erro na API da Stormglass: {response.status_code} com a chave {api_key}")
                return None
        return None

    def get_astronomy_data(self, start: int, end: int) -> Optional[Dict[str, Any]]:
        """Get astronomy data for a specific time period."""
        params = {
            'lat': self.location['lat'],
            'lng': self.location['lon'],
            'start': start,
            'end': end,
        }
        return self._make_request('astronomy', params)

    def get_tide_data(self) -> Optional[Dict[str, Any]]:
        """Get tide data for the current location."""
        params = {
            'lat': self.location['lat'],
            'lng': self.location['lon'],
        }
        return self._make_request('tide', params)

    def get_weather_data(self, start: int, end: int) -> Optional[Dict[str, Any]]:
        """Get weather data for a specific time period."""
        params = {
            'lat': self.location['lat'],
            'lng': self.location['lon'],
            'start': start,
            'end': end,
            'params': 'precipitation'
        }
        return self._make_request('weather', params) 