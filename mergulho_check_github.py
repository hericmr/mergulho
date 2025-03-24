#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador de Condições de Mergulho para GitHub Actions
Script para consulta de condições reais via APIs
"""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
import logging

# Configurações
CONFIG = {
    "CIDADE": "Santos",
    "ESTADO": "SP",
    "LATITUDE": -23.9608,
    "LONGITUDE": -46.3336,
    "SITE_URL": "https://mestredosmares.com.br",
    "STORMGLASS_API_KEY": os.environ.get('STORMGLASS_API_KEY'),
    "OPENWEATHER_API_KEY": os.environ.get('OPENWEATHER_API_KEY')
}

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mergulho_check.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger('MergulhoCheck')

def get_fase_lua(lat, lon, data):
    """Consulta a fase lunar via StormGlass API"""
    try:
        url = "https://api.stormglass.io/v2/astronomy/point"
        params = {
            "lat": lat,
            "lng": lon,
            "start": data.strftime("%Y-%m-%d"),
            "end": data.strftime("%Y-%m-%d")
        }
        headers = {"Authorization": CONFIG["STORMGLASS_API_KEY"]}
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data.get("hours"):
            moon_phase = data["hours"][0]["moonPhase"]["noaa"]
            return moon_phase
        return None
    except Exception as e:
        logger.error(f"Erro ao consultar fase lunar: {e}")
        return None

def get_vento(lat, lon):
    """Consulta velocidade do vento via OpenWeatherMap API"""
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": CONFIG["OPENWEATHER_API_KEY"],
            "units": "metric"
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if "wind" in data:
            return data["wind"]["speed"] * 3.6  # Converter m/s para km/h
        return None
    except Exception as e:
        logger.error(f"Erro ao consultar vento: {e}")
        return None

def get_precipitacao(lat, lon):
    """Consulta precipitação via OpenWeatherMap API"""
    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": CONFIG["OPENWEATHER_API_KEY"],
            "units": "metric"
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if "rain" in data:
            return data["rain"].get("1h", 0)  # Precipitação na última hora
        return 0
    except Exception as e:
        logger.error(f"Erro ao consultar precipitação: {e}")
        return 0

def get_mare(lat, lon, data):
    """Consulta altura da maré via StormGlass API"""
    try:
        url = "https://api.stormglass.io/v2/tide/extremes/point"
        params = {
            "lat": lat,
            "lng": lon,
            "start": data.strftime("%Y-%m-%d"),
            "end": data.strftime("%Y-%m-%d")
        }
        headers = {"Authorization": CONFIG["STORMGLASS_API_KEY"]}
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data.get("data"):
            # Encontrar a maré mais próxima do horário atual
            now = datetime.now()
            mare_atual = min(data["data"], 
                           key=lambda x: abs((datetime.fromisoformat(x["time"].replace("Z", "+00:00")) - now).total_seconds()))
            return mare_atual["height"]
        return None
    except Exception as e:
        logger.error(f"Erro ao consultar maré: {e}")
        return None

def get_estacao():
    """Determina a estação do ano baseado na data atual"""
    hoje = datetime.now()
    mes = hoje.month
    
    if 12 <= mes <= 2:
        return "Verão"
    elif 3 <= mes <= 5:
        return "Outono"
    elif 6 <= mes <= 8:
        return "Inverno"
    else:
        return "Primavera"

def get_fase_lua_descricao(fase_lunar):
    """Retorna descrição detalhada da fase lunar"""
    if fase_lunar < 5:
        return "Lua Nova", "Lua nova logo após o quarto crescente, normalmente não é boa, mas talvez a agua ainda esteja boa para mergulho"
    elif fase_lunar < 25:
        return "Lua Crescente", "Fase crescente, condições favoráveis para mergulho"
    elif fase_lunar < 45:
        return "Quarto Crescente", "Quarto crescente, boas condições para mergulho"
    elif fase_lunar < 55:
        return "Lua Cheia", "Lua cheia, condições desfavoráveis para mergulho"
    elif fase_lunar < 75:
        return "Quarto Minguante", "Quarto minguante, condições favoráveis para mergulho"
    else:
        return "Lua Minguante", "Lua minguante, boas condições para mergulho"

def get_vento_descricao(vento):
    """Retorna descrição detalhada do vento"""
    if vento < 5:
        return "Calmo", "Condições excelentes para mergulho"
    elif vento < 15:
        return "Fraco", "Vento fraco, condições excelentes para mergulho"
    elif vento < 25:
        return "Moderado", "Vento moderado, condições aceitáveis para mergulho"
    else:
        return "Forte", "Vento forte, condições desfavoráveis para mergulho"

def get_precipitacao_descricao(precipitacao):
    """Retorna descrição detalhada da precipitação"""
    if precipitacao < 1:
        return "Baixa", "Impacto: Baixo"
    elif precipitacao < 5:
        return "Média", "Impacto: Médio"
    else:
        return "Alta", "Impacto: Alto"

def get_mare_descricao(mare):
    """Retorna descrição detalhada da maré"""
    if mare < 0.8:
        return "Baixa", "Condições favoráveis para mergulho"
    elif mare < 1.5:
        return "Média", "Condições aceitáveis para mergulho"
    else:
        return "Alta", "Condições desfavoráveis para mergulho"

def main():
    try:
        logger.info("Iniciando verificação de condições de mergulho")
        logger.info(f"Python versão: {sys.version}")
        logger.info(f"Diretório atual: {os.getcwd()}")
        
        # Verificar se as chaves de API estão configuradas
        api_keys = [
            ("STORMGLASS_API_KEY", CONFIG["STORMGLASS_API_KEY"]),
            ("OPENWEATHER_API_KEY", CONFIG["OPENWEATHER_API_KEY"])
        ]
        
        chaves_faltantes = [nome for nome, valor in api_keys if not valor]
        if chaves_faltantes:
            raise ValueError(f"Chaves de API não configuradas no ambiente: {', '.join(chaves_faltantes)}")
        
        # Criar diretório para relatórios, se não existir
        try:
            if not os.path.exists('relatorios'):
                logger.info("Criando diretório para relatórios")
                os.makedirs('relatorios')
            logger.info(f"Diretório 'relatorios' existe: {os.path.exists('relatorios')}")
        except Exception as e:
            logger.error(f"Erro ao criar diretório 'relatorios': {e}")
            with open('erro_diretorio.log', 'w') as f:
                f.write(f"Erro ao criar diretório: {str(e)}\n")
            logger.info("Relatórios serão salvos no diretório atual")
        
        # Obter data/hora atual
        data_hora = datetime.now()
        logger.info(f"Verificando condições para: {data_hora}")
        
        # Consultar condições reais via APIs
        fase_lunar = get_fase_lua(CONFIG["LATITUDE"], CONFIG["LONGITUDE"], data_hora)
        if fase_lunar is None:
            raise ValueError("Não foi possível obter a fase lunar")
        nome_fase, descricao_fase = get_fase_lua_descricao(fase_lunar)
        logger.info(f"Fase lunar: {fase_lunar}/100")
        
        vento = get_vento(CONFIG["LATITUDE"], CONFIG["LONGITUDE"])
        if vento is None:
            raise ValueError("Não foi possível obter a velocidade do vento")
        descricao_vento, impacto_vento = get_vento_descricao(vento)
        logger.info(f"Velocidade do vento: {vento:.1f} km/h")
        
        precipitacao = get_precipitacao(CONFIG["LATITUDE"], CONFIG["LONGITUDE"])
        descricao_precip, impacto_precip = get_precipitacao_descricao(precipitacao)
        logger.info(f"Precipitação: {precipitacao:.1f} mm")
        
        mare = get_mare(CONFIG["LATITUDE"], CONFIG["LONGITUDE"], data_hora)
        if mare is None:
            raise ValueError("Não foi possível obter a altura da maré")
        descricao_mare, impacto_mare = get_mare_descricao(mare)
        logger.info(f"Altura da maré: {mare:.1f} m")
        
        estacao = get_estacao()
        logger.info(f"Estação: {estacao}")
        
        # Avaliar condições gerais
        condicoes_ideais = (vento < 15 and precipitacao < 5 and mare < 1.5)
        
        if condicoes_ideais:
            avaliacao = "Ótimo"
            pontuacao = 90
            descricao = "Condições ideais para mergulho hoje!"
            recomendacao = "Aproveite! As condições estão ótimas para praticar mergulho."
        elif vento < 20 and precipitacao < 10 and mare < 1.8:
            avaliacao = "Bom"
            pontuacao = 70
            descricao = "Boas condições para mergulho hoje."
            recomendacao = "Você pode mergulhar com relativa tranquilidade."
        elif vento < 25 and precipitacao < 15 and mare < 2.0:
            avaliacao = "Regular"
            pontuacao = 50
            descricao = "Condições aceitáveis para mergulho hoje."
            recomendacao = "Mergulhe com cautela e atenção às mudanças nas condições."
        else:
            avaliacao = "Péssimo"
            pontuacao = 27
            descricao = "Condições não recomendadas para mergulho hoje."
            recomendacao = "Não recomendado para mergulho hoje. Considere adiar."
        
        logger.info(f"Avaliação: {avaliacao}")
        logger.info(f"Recomendação: {recomendacao}")
        
        # Criar relatório
        relatorio = {
            "data_hora": data_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "fase_lunar": {
                "valor": fase_lunar,
                "nome": nome_fase,
                "descricao": descricao_fase
            },
            "vento": {
                "valor": round(vento, 1),
                "descricao": descricao_vento,
                "impacto": impacto_vento
            },
            "precipitacao": {
                "valor": round(precipitacao, 1),
                "descricao": descricao_precip,
                "impacto": impacto_precip
            },
            "mare": {
                "valor": round(mare, 1),
                "descricao": descricao_mare,
                "impacto": impacto_mare
            },
            "estacao": estacao,
            "avaliacao": avaliacao,
            "pontuacao": pontuacao,
            "descricao": descricao,
            "recomendacao": recomendacao
        }
        
        # Gerar nome do arquivo baseado na data/hora
        timestamp = data_hora.strftime("%Y%m%d_%H%M%S")
        
        # Salvar relatório em formato JSON
        try:
            json_path = os.path.join('relatorios', f'relatorio_{timestamp}.json')
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(relatorio, f, ensure_ascii=False, indent=4)
            logger.info(f"Relatório JSON salvo em: {json_path}")
        except Exception as e:
            logger.error(f"Erro ao salvar relatório JSON: {e}")
            json_path = f'relatorio_{timestamp}.json'
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(relatorio, f, ensure_ascii=False, indent=4)
            logger.info(f"Relatório JSON salvo no diretório atual: {json_path}")
        
        # Gerar relatório em texto para visualização no GitHub
        try:
            txt_path = os.path.join('relatorios', f'relatorio_{timestamp}.txt')
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"Verifique condições de mergulho atuais em {CONFIG['CIDADE']}\n\n")
                f.write(f"Condições de mergulho verificadas!\n")
                f.write(f"{avaliacao}\n")
                f.write(f"{pontuacao}\n\n")
                f.write(f"{recomendacao}\n\n")
                f.write(f"Fase Lunar\n")
                f.write(f"{'✓' if fase_lunar < 25 or fase_lunar > 75 else '✗'}\n")
                f.write(f"{nome_fase}\n")
                f.write(f"{descricao_fase}\n\n")
                f.write(f"Estação\n")
                f.write(f"{'✓' if estacao in ['Verão', 'Primavera'] else '✗'}\n")
                f.write(f"{estacao}\n")
                f.write(f"{'Estação ideal para mergulho' if estacao in ['Verão', 'Primavera'] else 'Condições aceitáveis'}\n\n")
                f.write(f"Precipitação\n")
                f.write(f"{'✓' if precipitacao < 5 else '✗'}\n")
                f.write(f"{precipitacao:.2f}mm\n")
                f.write(f"Impacto: {impacto_precip}\n\n")
                f.write(f"Maré\n")
                f.write(f"{'✓' if mare < 1.5 else '✗'}\n")
                f.write(f"{descricao_mare}\n")
                f.write(f"Altura: {mare:.1f}m\n\n")
                f.write(f"Vento\n")
                f.write(f"{'✓' if vento < 15 else '✗'}\n")
                f.write(f"{descricao_vento} ({vento:.1f} km/h)\n")
                f.write(f"{impacto_vento}\n\n")
                f.write("Fatores que afetam o mergulho hoje:\n\n")
                
                # Listar fatores negativos
                fatores_negativos = []
                if fase_lunar >= 25 and fase_lunar <= 75:
                    fatores_negativos.append("fase lunar desfavorável")
                if precipitacao > 5:
                    fatores_negativos.append("chuvas recentes podem afetar visibilidade")
                if mare > 1.5:
                    fatores_negativos.append("condições de maré não ideais")
                if vento > 15:
                    fatores_negativos.append("vento forte pode afetar a visibilidade")
                
                for fator in fatores_negativos:
                    f.write(f"    {fator}\n")
                
                f.write(f"\nMestre dos Mares © {data_hora.year}\n\n")
                f.write("Dados fornecidos por StormGlass API e OpenWeatherMap API\n\n")
                f.write("Desenvolvido pelo pirata Héric Moura\n\n")
                f.write(f"Visite: {CONFIG['SITE_URL']}\n")
                
            logger.info(f"Relatório TXT salvo em: {txt_path}")
        except Exception as e:
            logger.error(f"Erro ao salvar relatório TXT: {e}")
            txt_path = f'relatorio_{timestamp}.txt'
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"Verifique condições de mergulho atuais em {CONFIG['CIDADE']}\n\n")
                f.write(f"Condições de mergulho verificadas!\n")
                f.write(f"{avaliacao}\n")
                f.write(f"{pontuacao}\n\n")
                f.write(f"{recomendacao}\n\n")
                f.write(f"Fase Lunar\n")
                f.write(f"{'✓' if fase_lunar < 25 or fase_lunar > 75 else '✗'}\n")
                f.write(f"{nome_fase}\n")
                f.write(f"{descricao_fase}\n\n")
                f.write(f"Estação\n")
                f.write(f"{'✓' if estacao in ['Verão', 'Primavera'] else '✗'}\n")
                f.write(f"{estacao}\n")
                f.write(f"{'Estação ideal para mergulho' if estacao in ['Verão', 'Primavera'] else 'Condições aceitáveis'}\n\n")
                f.write(f"Precipitação\n")
                f.write(f"{'✓' if precipitacao < 5 else '✗'}\n")
                f.write(f"{precipitacao:.2f}mm\n")
                f.write(f"Impacto: {impacto_precip}\n\n")
                f.write(f"Maré\n")
                f.write(f"{'✓' if mare < 1.5 else '✗'}\n")
                f.write(f"{descricao_mare}\n")
                f.write(f"Altura: {mare:.1f}m\n\n")
                f.write(f"Vento\n")
                f.write(f"{'✓' if vento < 15 else '✗'}\n")
                f.write(f"{descricao_vento} ({vento:.1f} km/h)\n")
                f.write(f"{impacto_vento}\n\n")
                f.write("Fatores que afetam o mergulho hoje:\n\n")
                
                # Listar fatores negativos
                fatores_negativos = []
                if fase_lunar >= 25 and fase_lunar <= 75:
                    fatores_negativos.append("fase lunar desfavorável")
                if precipitacao > 5:
                    fatores_negativos.append("chuvas recentes podem afetar visibilidade")
                if mare > 1.5:
                    fatores_negativos.append("condições de maré não ideais")
                if vento > 15:
                    fatores_negativos.append("vento forte pode afetar a visibilidade")
                
                for fator in fatores_negativos:
                    f.write(f"    {fator}\n")
                
                f.write(f"\nMestre dos Mares © {data_hora.year}\n\n")
                f.write("Dados fornecidos por StormGlass API e OpenWeatherMap API\n\n")
                f.write("Desenvolvido pelo pirata Héric Moura\n\n")
                f.write(f"Visite: {CONFIG['SITE_URL']}\n")
                
            logger.info(f"Relatório TXT salvo no diretório atual: {txt_path}")
        
        # Criar um relatório resumido para o stdout do GitHub Actions
        print("\n" + "="*50)
        print("RELATÓRIO DE CONDIÇÕES DE MERGULHO - RESUMO")
        print("="*50)
        print(f"Data/Hora: {relatorio['data_hora']}")
        print(f"Vento: {relatorio['vento']['valor']} km/h")
        print(f"Precipitação: {relatorio['precipitacao']['valor']} mm")
        print(f"Maré: {relatorio['mare']['valor']} m")
        print(f"Avaliação: {relatorio['avaliacao']}")
        print(f"Recomendação: {relatorio['recomendacao']}")
        print("="*50 + "\n")
        
        logger.info("Verificação concluída com sucesso!")
        return 0  # Código de saída 0 indica sucesso
        
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}", exc_info=True)
        # Criar arquivo de erro para debug
        with open('erro_execucao.log', 'w') as f:
            f.write(f"Erro durante a execução: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
        return 1  # Código de saída 1 indica falha

if __name__ == "__main__":
    sys.exit(main()) 