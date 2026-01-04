"""
Service to analyze diving conditions based on various factors.
"""
import arrow
from typing import List, Tuple, Optional
from ..config.settings import SUMMER_MONTHS, SUMMER_START_DAY, SUMMER_START_MONTH, RAIN_CHECK_DAYS
from .api_service import StormglassService

class DivingConditionsService:
    def __init__(self):
        self.api_service = StormglassService()

    def is_summer(self) -> bool:
        """Check if current date is in summer months."""
        return arrow.now().month in SUMMER_MONTHS

    def days_until_summer(self) -> int:
        """Calculate days until next summer starts."""
        now = arrow.now()
        current_year = now.year
        summer_start = arrow.get(f"{current_year}-{SUMMER_START_MONTH}-{SUMMER_START_DAY}")
        
        if now > summer_start:
            summer_start = summer_start.shift(years=1)

        return (summer_start - now).days

    def get_moon_phase(self) -> Tuple[Optional[str], bool]:
        """Get current moon phase and check if it's first quarter."""
        start = arrow.now().floor('day')
        end = start.shift(days=1).floor('day')

        data = self.api_service.get_astronomy_data(
            start.to('UTC').timestamp(),
            end.to('UTC').timestamp()
        )
        
        if data:
            phase = data['data'][0]['moonPhase']['current']['text']
            return phase, phase == 'First quarter'
        return None, False

    def days_until_first_quarter(self) -> Optional[int]:
        """Calculate days until next first quarter moon."""
        now = arrow.now()
        days = 0

        while True:
            start = now.shift(days=days).floor('day')
            end = start.shift(days=1).floor('day')

            data = self.api_service.get_astronomy_data(
                start.to('UTC').timestamp(),
                end.to('UTC').timestamp()
            )
            
            if data:
                phase = data['data'][0]['moonPhase']['current']['text']
                if phase == 'First quarter':
                    return days
            else:
                return None
            days += 1

    def get_high_tides(self) -> List[arrow.Arrow]:
        """Get list of upcoming high tides."""
        data = self.api_service.get_tide_data()
        high_tides = []
        
        if data:
            for tide in data['data']:
                if tide['type'] == 'high':
                    high_tides.append(arrow.get(tide['time']))
        return high_tides

    def has_recent_rain(self) -> bool:
        """Check if there was rain in the last few days."""
        start = arrow.now().shift(days=-RAIN_CHECK_DAYS).floor('day')
        end = arrow.now().floor('day')

        data = self.api_service.get_weather_data(
            start.to('UTC').timestamp(),
            end.to('UTC').timestamp()
        )
        
        if data:
            for entry in data['hours']:
                if entry['precipitation']['sg'] > 0:
                    return True
        return False

    def analyze_conditions(self) -> None:
        """Analyze and print all diving conditions."""
        agora = arrow.now().format('YYYY-MM-DD HH:mm:ss')
        print(f"Data e hora da verificação: {agora}")

        # Check summer season
        if self.is_summer():
            print("Estamos no verão, época ideal para mergulho.")
        else:
            dias_restantes = self.days_until_summer()
            print(f"Ainda não estamos no verão. Faltam {dias_restantes} dias para o início do verão.")

        # Check moon phase
        dias_quarto_crescente = self.days_until_first_quarter()
        if dias_quarto_crescente is not None:
            print(f"Faltam {dias_quarto_crescente} dias para o próximo Quarto Crescente.")
        else:
            print("Não foi possível determinar quando será o próximo Quarto Crescente.")

        # Check recent rain
        if self.has_recent_rain():
            print("Choveu nos últimos 3 dias. O mergulho pode estar prejudicado.")
        else:
            print("Não houve chuva nos últimos 3 dias, as condições estão favoráveis.")

        # Check current moon phase
        fase_lua, lua_quarto_crescente = self.get_moon_phase()
        print(f"A fase atual da lua é {fase_lua}.")
        if lua_quarto_crescente:
            print("A lua está em Quarto Crescente, o que melhora as condições de maré.")
        else:
            print("A lua não está em Quarto Crescente, o que pode afetar as marés.")

        # Check tides
        mare_alta = self.get_high_tides()
        if mare_alta:
            print("Próximos momentos de maré alta:")
            for mare in mare_alta:
                print(f"Maré alta em: {mare.format('YYYY-MM-DD HH:mm:ss')}")
            print("Este pode ser um bom momento para mergulhar.")
        else:
            print("Nenhuma informação de maré alta disponível no momento.") 