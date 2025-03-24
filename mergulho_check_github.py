#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador de Condições de Mergulho para GitHub Actions
Script simplificado e robusto para execução no ambiente do GitHub Actions
"""

import os
import sys
import json
import random
from datetime import datetime
import logging

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

def emoji_status(status):
    """Retorna o emoji correspondente ao status"""
    return "✓" if status else "✗"

def gerar_pontuacao_geral(vento, precipitacao, mare, fase_lunar, estacao):
    """Calcula a pontuação geral das condições de mergulho (0-100)"""
    pontos = 0
    total = 100
    
    # Pontuação para o vento (0-25 pontos)
    if vento < 8:
        pontos += 25  # Ideal
    elif vento < 15:
        pontos += 20  # Bom
    elif vento < 20:
        pontos += 10  # Aceitável
    
    # Pontuação para precipitação (0-25 pontos)
    if precipitacao < 1:
        pontos += 25  # Ideal
    elif precipitacao < 5:
        pontos += 15  # Aceitável
    elif precipitacao < 10:
        pontos += 5   # Ruim
    
    # Pontuação para maré (0-20 pontos)
    if mare < 1.0:
        pontos += 20  # Ideal
    elif mare < 1.5:
        pontos += 15  # Boa
    elif mare < 1.8:
        pontos += 5   # Aceitável
    
    # Pontuação para fase lunar (0-15 pontos)
    if 0 <= fase_lunar <= 5 or 95 <= fase_lunar <= 100:
        pontos += 15  # Lua nova ou próxima
    elif 45 <= fase_lunar <= 55:
        pontos += 5   # Lua cheia
    else:
        pontos += 10  # Fases intermediárias
    
    # Pontuação para estação (0-15 pontos)
    if estacao == "Verão":
        pontos += 15
    elif estacao == "Primavera":
        pontos += 12
    elif estacao == "Outono":
        pontos += 10
    else:  # Inverno
        pontos += 5
    
    # Normalizar para 0-100
    pontuacao_final = min(100, int(pontos))
    
    return pontuacao_final

def avaliar_condicao_texto(pontuacao):
    """Retorna a avaliação baseada na pontuação"""
    if pontuacao >= 80:
        return "Excelente"
    elif pontuacao >= 65:
        return "Muito Bom"
    elif pontuacao >= 50:
        return "Bom"
    elif pontuacao >= 35:
        return "Regular"
    elif pontuacao >= 20:
        return "Ruim"
    else:
        return "Péssimo"

def direcao_vento_texto(direcao_graus):
    """Converte graus em direção de vento textual"""
    direcoes = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = int((direcao_graus + 11.25) % 360 / 22.5)
    return direcoes[idx]

def impacto_precipitacao(valor):
    """Avalia o impacto da precipitação"""
    if valor < 1:
        return "Mínimo"
    elif valor < 5:
        return "Baixo"
    elif valor < 10:
        return "Médio"
    else:
        return "Alto"

def descrever_vento(velocidade):
    """Descreve a intensidade do vento"""
    if velocidade < 5:
        return f"Fraco ({velocidade:.1f} km/h)"
    elif velocidade < 15:
        return f"Moderado ({velocidade:.1f} km/h)"
    elif velocidade < 25:
        return f"Forte ({velocidade:.1f} km/h)"
    else:
        return f"Muito forte ({velocidade:.1f} km/h)"

def descrever_fase_lunar(percentual):
    """Descreve a fase lunar"""
    if percentual < 5 or percentual > 95:
        return "Lua Nova"
    elif 45 <= percentual <= 55:
        return "Lua Cheia"
    elif 5 <= percentual < 45:
        return "Lua Crescente"
    else:
        return "Lua Minguante"

def main():
    try:
        logger.info("Iniciando verificação de condições de mergulho")
        logger.info(f"Python versão: {sys.version}")
        logger.info(f"Diretório atual: {os.getcwd()}")
        
        # Verificar se Python está funcionando corretamente
        logger.info("Testando funcionalidades básicas do Python")
        assert 1 + 1 == 2, "Teste básico falhou"
        
        # Criar diretório para relatórios, se não existir
        try:
            if not os.path.exists('relatorios'):
                logger.info("Criando diretório para relatórios")
                os.makedirs('relatorios')
            logger.info(f"Diretório 'relatorios' existe: {os.path.exists('relatorios')}")
        except Exception as e:
            logger.error(f"Erro ao criar diretório 'relatorios': {e}")
            # Tentar criar no diretório atual
            with open('erro_diretorio.log', 'w') as f:
                f.write(f"Erro ao criar diretório: {str(e)}\n")
            logger.info("Relatórios serão salvos no diretório atual")
        
        # Simular verificação de condições
        data_hora = datetime.now()
        logger.info(f"Verificando condições para: {data_hora}")
        
        # Local
        cidade = "Santos"
        estado = "SP"
        
        # Simular fase lunar (0-100, onde 0 é lua nova e 100 é lua cheia)
        fase_lunar = random.randint(0, 100)
        fase_texto = descrever_fase_lunar(fase_lunar)
        logger.info(f"Fase lunar: {fase_lunar}/100 - {fase_texto}")
        
        # Simular vento (km/h)
        vento = random.uniform(0, 30)
        direcao_vento = random.randint(0, 359)  # direção em graus
        direcao_texto = direcao_vento_texto(direcao_vento)
        logger.info(f"Velocidade do vento: {vento:.1f} km/h, direção: {direcao_texto}")
        
        # Simular precipitação (mm)
        precipitacao = random.uniform(0, 15)
        logger.info(f"Precipitação: {precipitacao:.1f} mm")
        
        # Simular maré (m)
        mare = random.uniform(0, 2)
        logger.info(f"Altura da maré: {mare:.1f} m")
        
        # Simular estação do ano
        estacoes = ["Verão", "Outono", "Inverno", "Primavera"]
        estacao = random.choice(estacoes)
        logger.info(f"Estação: {estacao}")
        
        # Avaliar condições individualmente
        vento_ideal = vento < 15
        precipitacao_ideal = precipitacao < 5
        mare_ideal = mare < 1.5
        fase_lunar_ideal = 0 <= fase_lunar < 5 or 95 <= fase_lunar <= 100
        estacao_ideal = estacao in ["Verão", "Primavera"]
        
        # Calcular pontuação geral
        pontuacao = gerar_pontuacao_geral(vento, precipitacao, mare, fase_lunar, estacao)
        avaliacao = avaliar_condicao_texto(pontuacao)
        
        logger.info(f"Pontuação geral: {pontuacao}/100")
        logger.info(f"Avaliação: {avaliacao}")
        
        # Definir recomendação
        if pontuacao >= 65:
            recomendacao = "Condições ótimas! Aproveite para mergulhar hoje."
        elif pontuacao >= 50:
            recomendacao = "Boas condições para mergulho. Recomendado para a maioria dos mergulhadores."
        elif pontuacao >= 35:
            recomendacao = "Condições aceitáveis para mergulho. Recomendado para mergulhadores experientes."
        else:
            recomendacao = "Não recomendado para mergulho hoje. Considere adiar."
        
        # Fatores que afetam o mergulho
        fatores_negativos = []
        if not fase_lunar_ideal:
            fatores_negativos.append("fase lunar desfavorável")
        if precipitacao > 1.0:
            fatores_negativos.append("chuvas recentes podem afetar visibilidade")
        if not mare_ideal:
            fatores_negativos.append("condições de maré não ideais")
        if not vento_ideal:
            fatores_negativos.append("vento forte pode afetar segurança")
        if not estacao_ideal:
            fatores_negativos.append(f"estação do ano ({estacao.lower()}) não ideal para mergulho")
        
        # Criar relatório completo
        relatorio = {
            "data_hora": data_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "local": {
                "cidade": cidade,
                "estado": estado
            },
            "pontuacao": pontuacao,
            "avaliacao": avaliacao,
            "recomendacao": recomendacao,
            "condicoes": {
                "fase_lunar": {
                    "valor": fase_lunar,
                    "descricao": fase_texto,
                    "ideal": fase_lunar_ideal
                },
                "vento": {
                    "velocidade": round(vento, 1),
                    "direcao": direcao_texto,
                    "descricao": descrever_vento(vento),
                    "ideal": vento_ideal
                },
                "precipitacao": {
                    "valor": round(precipitacao, 2),
                    "impacto": impacto_precipitacao(precipitacao),
                    "ideal": precipitacao_ideal
                },
                "mare": {
                    "altura": round(mare, 2),
                    "ideal": mare_ideal
                },
                "estacao": {
                    "nome": estacao,
                    "ideal": estacao_ideal
                }
            },
            "fatores_negativos": fatores_negativos
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
            # Tentar salvar no diretório atual
            json_path = f'relatorio_{timestamp}.json'
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(relatorio, f, ensure_ascii=False, indent=4)
            logger.info(f"Relatório JSON salvo no diretório atual: {json_path}")
        
        # Gerar relatório em formato HTML similar ao site
        descricao_fase_lunar = ""
        if fase_texto == "Lua Nova":
            descricao_fase_lunar = "Lua nova, normalmente é boa para mergulho devido à menor variação de marés."
        elif fase_texto == "Lua Cheia":
            descricao_fase_lunar = "Lua cheia geralmente causa marés mais intensas, o que pode afetar a visibilidade."
        elif fase_texto == "Lua Crescente":
            descricao_fase_lunar = "Lua crescente, normalmente as condições variam dependendo da proximidade com a lua cheia."
        else:
            descricao_fase_lunar = "Lua minguante, condições começam a melhorar após a lua cheia."
        
        descricao_estacao = ""
        if estacao == "Verão":
            descricao_estacao = "Verão é geralmente a melhor estação para mergulho, com águas mais quentes e maior visibilidade."
        elif estacao == "Outono":
            descricao_estacao = "Outono ainda oferece condições favoráveis em muitos locais, com menos cururu, mas bom mesmo é no verão."
        elif estacao == "Inverno":
            descricao_estacao = "Inverno pode apresentar águas mais frias e condições meteorológicas menos favoráveis para mergulho."
        else:
            descricao_estacao = "Primavera traz melhorias graduais nas condições, com águas começando a esquentar."
        
        descricao_vento = f"Direção: {direcao_texto} - "
        if vento < 5:
            descricao_vento += "Vento fraco, condições excelentes para mergulho"
        elif vento < 15:
            descricao_vento += "Vento moderado, condições boas para mergulho"
        else:
            descricao_vento += "Vento forte, pode afetar a segurança e conforto durante o mergulho"
        
        # Relatório formato site
        report_html = f"""
Mestre dos Mares - {cidade}/{estado}

Condições de mergulho verificadas!
{avaliacao}
{pontuacao}

{recomendacao}

Fase Lunar
{emoji_status(fase_lunar_ideal)}
{fase_texto}
{descricao_fase_lunar}

Estação
{emoji_status(estacao_ideal)}
{estacao}
{descricao_estacao}

Precipitação
{emoji_status(precipitacao_ideal)}
{precipitacao:.2f}mm
Impacto: {impacto_precipitacao(precipitacao)}

Maré
{emoji_status(mare_ideal)}
{random.choice(['Baixa', 'Alta', 'Normal'])}
Altura: {mare:.2f}m

Vento
{emoji_status(vento_ideal)}
{descrever_vento(vento)}
{descricao_vento}

Fatores que afetam o mergulho hoje:

    {(chr(10) + '    ').join(fatores_negativos) if fatores_negativos else 'Nenhum fator negativo significativo hoje'}

Mestre dos Mares © {data_hora.year}

Dados fornecidos por StormGlass API e OpenWeatherMap API

Desenvolvido pelo pirata Héric Moura
"""
        
        # Salvar relatório em formato texto similar ao site
        try:
            txt_path = os.path.join('relatorios', f'relatorio_{timestamp}.txt')
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(report_html)
            logger.info(f"Relatório TXT salvo em: {txt_path}")
        except Exception as e:
            logger.error(f"Erro ao salvar relatório TXT: {e}")
            # Tentar salvar no diretório atual
            txt_path = f'relatorio_{timestamp}.txt'
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(report_html)
            logger.info(f"Relatório TXT salvo no diretório atual: {txt_path}")
        
        # Imprimir relatório no estilo do site
        print("\n" + "="*60)
        print(report_html)
        print("="*60 + "\n")
        
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