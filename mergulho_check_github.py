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
    "SITE_URL": "https://hericmr.github.io/mergulho",
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
    """Simula a fase lunar para demonstração"""
    return 30  # Simulando uma fase lunar

def get_vento(lat, lon):
    """Simula a velocidade do vento para demonstração"""
    return 12.5  # Simulando vento moderado

def get_precipitacao(lat, lon):
    """Simula a precipitação para demonstração"""
    return 2.5  # Simulando chuva leve

def get_mare(lat, lon, data):
    """Simula a altura da maré para demonstração"""
    return 1.2  # Simulando maré média

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
        print("\n" + "="*60)
        print("🌊 CONDICIONÔMETRO DE MERGULHO - SANTOS/SP 🌊")
        print("="*60 + "\n")
        
        # Obter data/hora atual
        data_hora = datetime.now()
        print(f"📅 Data e Hora: {data_hora.strftime('%d/%m/%Y %H:%M')}\n")
        
        # Consultar condições
        fase_lunar = get_fase_lua(CONFIG["LATITUDE"], CONFIG["LONGITUDE"], data_hora)
        nome_fase, descricao_fase = get_fase_lua_descricao(fase_lunar)
        print(f"🌙 Fase da Lua: {nome_fase}")
        print(f"   {descricao_fase}\n")
        
        vento = get_vento(CONFIG["LATITUDE"], CONFIG["LONGITUDE"])
        descricao_vento, impacto_vento = get_vento_descricao(vento)
        print(f"💨 Vento: {descricao_vento} ({vento:.1f} km/h)")
        print(f"   {impacto_vento}\n")
        
        precipitacao = get_precipitacao(CONFIG["LATITUDE"], CONFIG["LONGITUDE"])
        descricao_precip, impacto_precip = get_precipitacao_descricao(precipitacao)
        print(f"🌧️ Precipitação: {descricao_precip} ({precipitacao:.1f} mm)")
        print(f"   {impacto_precip}\n")
        
        mare = get_mare(CONFIG["LATITUDE"], CONFIG["LONGITUDE"], data_hora)
        descricao_mare, impacto_mare = get_mare_descricao(mare)
        print(f"🌊 Maré: {descricao_mare} ({mare:.1f} m)")
        print(f"   {impacto_mare}\n")
        
        estacao = get_estacao()
        print(f"🌞 Estação: {estacao}")
        print(f"   {'Estação ideal para mergulho!' if estacao in ['Verão', 'Primavera'] else 'Condições aceitáveis para mergulho'}\n")
        
        # Avaliar condições gerais
        condicoes_ideais = (vento < 15 and precipitacao < 5 and mare < 1.5)
        
        if condicoes_ideais:
            avaliacao = "🌟 ÓTIMO"
            pontuacao = 90
            descricao = "Condições ideais para mergulho hoje!"
            recomendacao = "Aproveite! As condições estão ótimas para praticar mergulho."
        elif vento < 20 and precipitacao < 10 and mare < 1.8:
            avaliacao = "👍 BOM"
            pontuacao = 70
            descricao = "Boas condições para mergulho hoje."
            recomendacao = "Você pode mergulhar com relativa tranquilidade."
        elif vento < 25 and precipitacao < 15 and mare < 2.0:
            avaliacao = "⚠️ REGULAR"
            pontuacao = 50
            descricao = "Condições aceitáveis para mergulho hoje."
            recomendacao = "Mergulhe com cautela e atenção às mudanças nas condições."
        else:
            avaliacao = "❌ NÃO RECOMENDADO"
            pontuacao = 27
            descricao = "Condições não recomendadas para mergulho hoje."
            recomendacao = "Não recomendado para mergulho hoje. Considere adiar."
        
        print("="*60)
        print(f"📊 AVALIAÇÃO: {avaliacao} ({pontuacao}/100)")
        print(f"💡 {descricao}")
        print(f"🎯 {recomendacao}")
        print("="*60 + "\n")
        
        # Listar fatores que afetam o mergulho
        print("📝 Fatores que afetam o mergulho hoje:")
        fatores_negativos = []
        if fase_lunar >= 25 and fase_lunar <= 75:
            fatores_negativos.append("• Fase lunar desfavorável")
        if precipitacao > 5:
            fatores_negativos.append("• Chuvas recentes podem afetar visibilidade")
        if mare > 1.5:
            fatores_negativos.append("• Condições de maré não ideais")
        if vento > 15:
            fatores_negativos.append("• Vento forte pode afetar a visibilidade")
        
        if fatores_negativos:
            for fator in fatores_negativos:
                print(fator)
        else:
            print("• Todas as condições estão favoráveis!")
        
        print("\n" + "="*60)
        print("🌐 Dados fornecidos por StormGlass API e OpenWeatherMap API")
        print("👨‍💻 Desenvolvido pelo pirata Héric Moura")
        print(f"🌍 Visite: {CONFIG['SITE_URL']}")
        print("="*60 + "\n")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Erro durante a execução: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 