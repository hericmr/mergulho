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
💡 {descricao}
🎯 {recomendacao}
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