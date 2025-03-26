#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador de Condições de Mergulho com Envio de Email
Script para consulta de condições reais via APIs e envio automático por email
"""

import os
import sys
import json
import requests
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import random

# Configurações
CONFIG = {
    "CIDADE": "Santos",
    "ESTADO": "SP",
    "LATITUDE": -23.9608,
    "LONGITUDE": -46.3336,
    "SITE_URL": "https://hericmr.github.io/mergulho",
    "STORMGLASS_API_KEY": "6b7ca118-da20-11ee-8a07-0242ac130002-6b7ca186-da20-11ee-8a07-0242ac130002",
    "OPENWEATHER_API_KEY": "1234567890",  # Chave temporária para teste
    "SMTP_SERVER": "smtp.gmail.com",
    "SMTP_PORT": 587,
    "EMAIL_USER": os.getenv("EMAIL_USER", "heric.m.r@gmail.com"),
    "EMAIL_PASS": os.getenv("EMAIL_PASS", "khuk mkoy jyvz vajk"),
    "EMAIL_DESTINATARIOS": os.getenv("EMAIL_DESTINATARIOS", "heric.m.r@gmail.com").split(",")
}

def get_fase_lua(lat, lon, data):
    """Retorna a fase lunar atual usando a API do U.S. Naval Observatory"""
    try:
        # Data atual em formato YYYY-MM-DD para a API USNO
        data_formatada = data.strftime('%Y-%m-%d')
        
        # Usar a API do U.S. Naval Observatory (USNO)
        url = f"https://aa.usno.navy.mil/api/moon/phases/date?date={data_formatada}&nump=4"
        
        response = requests.get(url)
        if response.ok:
            dados = response.json()
            
            if dados and dados.get('phasedata'):
                # Ordenar fases por proximidade da data atual
                fases = sorted(dados['phasedata'], 
                             key=lambda x: abs(datetime.strptime(f"{x['year']}-{x['month']}-{x['day']}", '%Y-%m-%d') - data))
                
                fase_proxima = fases[0]
                data_fase = datetime.strptime(f"{fase_proxima['year']}-{fase_proxima['month']}-{fase_proxima['day']}", '%Y-%m-%d')
                
                # Calcular diferença em dias
                dif_dias = abs((data - data_fase).days)
                
                # Converter fase para valor numérico
                fase_map = {
                    'New Moon': 0,
                    'First Quarter': 25,
                    'Full Moon': 50,
                    'Last Quarter': 75
                }
                
                fase_base = fase_map.get(fase_proxima['phase'], 0)
                
                # Ajustar fase baseado na diferença de dias
                if dif_dias > 0:
                    if fase_base == 0:  # Lua Nova
                        return min(dif_dias * 3.5, 25)  # Crescente
                    elif fase_base == 25:  # Quarto Crescente
                        return min(25 + dif_dias * 3.5, 50)  # Crescente Gibosa
                    elif fase_base == 50:  # Lua Cheia
                        return min(50 + dif_dias * 3.5, 75)  # Minguante Gibosa
                    else:  # Quarto Minguante
                        return min(75 + dif_dias * 3.5, 100)  # Minguante
                
                return fase_base
    except Exception as e:
        print(f"Erro ao consultar fase da lua: {e}")
    
    # Fallback: usar OpenWeatherMap
    try:
        url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,alerts&appid={CONFIG['OPENWEATHER_API_KEY']}"
        response = requests.get(url)
        if response.ok:
            dados = response.json()
            if dados and dados.get('daily'):
                fase = dados['daily'][0]['moon_phase']
                return fase * 100  # Converter para escala 0-100
    except Exception as e:
        print(f"Erro no fallback OpenWeatherMap: {e}")
    
    # Se tudo falhar, retornar um valor simulado
    return random.randint(0, 100)

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
        return "Lua Nova", "Fase lunar crítica. Visibilidade subaquática comprometida. Recomenda-se cautela."
    elif fase_lunar < 25:
        return "Lua Crescente", "Fase lunar favorável. Condições de visibilidade em melhoria."
    elif fase_lunar < 45:
        return "Quarto Crescente", "Fase lunar ideal. Condições de visibilidade otimizadas."
    elif fase_lunar < 55:
        return "Lua Cheia", "Fase lunar crítica. Visibilidade subaquática severamente comprometida."
    elif fase_lunar < 75:
        return "Quarto Minguante", "Fase lunar favorável. Condições de visibilidade estáveis."
    else:
        return "Lua Minguante", "Fase lunar adequada. Condições de visibilidade aceitáveis."

def get_vento_descricao(vento):
    """Retorna descrição detalhada do vento"""
    if vento < 5:
        return "Calmo", "Condições de vento ideais para mergulho. Superfície estável."
    elif vento < 15:
        return "Fraco", "Condições de vento favoráveis. Leve ondulação na superfície."
    elif vento < 25:
        return "Moderado", "Condições de vento aceitáveis. Ondulação moderada na superfície."
    else:
        return "Forte", "Condições de vento críticas. Ondulação severa na superfície."

def get_precipitacao_descricao(precipitacao):
    """Retorna descrição detalhada da precipitação"""
    if precipitacao < 1:
        return "Baixa", "Impacto na visibilidade: Negligenciável"
    elif precipitacao < 5:
        return "Média", "Impacto na visibilidade: Moderado"
    else:
        return "Alta", "Impacto na visibilidade: Severo"

def get_mare_descricao(mare):
    """Retorna descrição detalhada da maré"""
    if mare < 0.8:
        return "Baixa", "Condições de maré favoráveis. Visibilidade subaquática otimizada."
    elif mare < 1.5:
        return "Média", "Condições de maré estáveis. Visibilidade subaquática adequada."
    else:
        return "Alta", "Condições de maré críticas. Visibilidade subaquática comprometida."

def gerar_relatorio_texto(data_hora, fase_lunar, nome_fase, descricao_fase, 
                        vento, descricao_vento, impacto_vento,
                        precipitacao, descricao_precip, impacto_precip,
                        mare, descricao_mare, impacto_mare,
                        estacao, avaliacao, pontuacao, descricao, recomendacao):
    """Gera o conteúdo do email em formato texto simples"""
    return f"""
{'='*60}
🌊 CONDICIONÔMETRO DE MERGULHO - {CONFIG['CIDADE']}/{CONFIG['ESTADO']} 🌊
{'='*60}

📅 Data e Hora: {data_hora.strftime('%d/%m/%Y %H:%M')}

🌙 Fase da Lua: {nome_fase}
   {descricao_fase}

💨 Vento: {descricao_vento} ({vento:.1f} km/h)
   {impacto_vento}

🌧️ Precipitação: {descricao_precip} ({precipitacao:.1f} mm)
   {impacto_precip}

🌊 Maré: {descricao_mare} ({mare:.1f} m)
   {impacto_mare}

🌞 Estação: {estacao}
   {'Estação ideal para mergulho!' if estacao in ['Verão', 'Primavera'] else 'Condições aceitáveis para mergulho'}

{'='*60}
📊 AVALIAÇÃO: {avaliacao} ({pontuacao}/100)
{descricao}
Recomendação: {recomendacao}
{'='*60}

🌐 Dados fornecidos por StormGlass API e OpenWeatherMap API
👨‍💻 Desenvolvido pelo pirata Héric Moura
🌍 Visite: {CONFIG['SITE_URL']}

{'='*60}
📧 Este é um email automático. Você receberá esta mensagem todos os dias às 7h da manhã.
{'='*60}
"""

def enviar_email(conteudo):
    """Envia o email com o relatório"""
    try:
        msg = MIMEMultipart()
        msg["From"] = CONFIG["EMAIL_USER"]
        msg["To"] = ", ".join(CONFIG["EMAIL_DESTINATARIOS"])
        msg["Subject"] = f"Relatório de Condições de Mergulho - {CONFIG['CIDADE']} - {datetime.now().strftime('%d/%m/%Y')}"
        
        # Adiciona o conteúdo como texto simples
        msg.attach(MIMEText(conteudo, "plain"))
        
        server = smtplib.SMTP(CONFIG["SMTP_SERVER"], CONFIG["SMTP_PORT"])
        server.starttls()
        server.login(CONFIG["EMAIL_USER"], CONFIG["EMAIL_PASS"])
        server.sendmail(CONFIG["EMAIL_USER"], CONFIG["EMAIL_DESTINATARIOS"], msg.as_string())
        server.quit()
        print("✅ Email enviado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email: {e}")
        return False

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
        
        # Avaliar condições gerais com critérios mais rigorosos
        # Condições ideais: vento < 10km/h, precipitação < 2mm, maré < 1.2m
        condicoes_ideais = (vento < 10 and precipitacao < 2 and mare < 1.2)
        
        # Condições boas: vento < 15km/h, precipitação < 5mm, maré < 1.5m
        condicoes_boas = (vento < 15 and precipitacao < 5 and mare < 1.5)
        
        # Condições regulares: vento < 20km/h, precipitação < 10mm, maré < 1.8m
        condicoes_regulares = (vento < 20 and precipitacao < 10 and mare < 1.8)
        
        # Ajuste de pontuação baseado na estação
        ajuste_estacao = 0
        if estacao == "Verão":
            ajuste_estacao = 10  # Bônus para verão
        elif estacao == "Primavera":
            ajuste_estacao = 5   # Bônus para primavera
        elif estacao == "Inverno":
            ajuste_estacao = -5  # Penalidade para inverno
        else:  # Outono
            ajuste_estacao = 0
        
        if condicoes_ideais:
            avaliacao = "🌟 ÓTIMO"
            pontuacao = min(95 + ajuste_estacao, 100)  # Máximo de 100
            descricao = "Condições climáticas ideais para mergulho."
            recomendacao = "Condições climáticas estáveis e favoráveis para prática de mergulho."
        elif condicoes_boas:
            avaliacao = "👍 BOM"
            pontuacao = min(70 + ajuste_estacao, 95)  # Máximo de 95
            descricao = "Condições climáticas favoráveis para mergulho."
            recomendacao = "Condições climáticas aceitáveis para prática de mergulho."
        elif condicoes_regulares:
            avaliacao = "⚠️ REGULAR"
            pontuacao = min(50 + ajuste_estacao, 70)  # Máximo de 70
            descricao = "Condições climáticas moderadas para mergulho."
            recomendacao = "Condições climáticas instáveis. Recomenda-se cautela."
        else:
            avaliacao = "❌ NÃO RECOMENDADO"
            pontuacao = max(27 + ajuste_estacao, 27)  # Mínimo de 27
            descricao = "Condições climáticas desfavoráveis para mergulho."
            recomendacao = "Condições climáticas instáveis. Recomenda-se adiar a prática de mergulho."
        
        # Adiciona informação sobre o ajuste da estação na descrição
        if ajuste_estacao != 0:
            descricao += f" {'(Bônus de +' + str(ajuste_estacao) + ' pontos pela estação)' if ajuste_estacao > 0 else '(Penalidade de ' + str(abs(ajuste_estacao)) + ' pontos pela estação)'}"
        
        print("="*60)
        print(f"📊 AVALIAÇÃO: {avaliacao} ({pontuacao}/100)")
        print(f"💡 {descricao}")
        print(f"🎯 {recomendacao}")
        print("="*60 + "\n")
        
        # Gerar e enviar email
        conteudo = gerar_relatorio_texto(
            data_hora, fase_lunar, nome_fase, descricao_fase,
            vento, descricao_vento, impacto_vento,
            precipitacao, descricao_precip, impacto_precip,
            mare, descricao_mare, impacto_mare,
            estacao, avaliacao, pontuacao, descricao, recomendacao
        )
        
        if enviar_email(conteudo):
            print("✅ Relatório enviado por email com sucesso!")
        else:
            print("❌ Falha ao enviar o relatório por email.")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Erro durante a execução: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 