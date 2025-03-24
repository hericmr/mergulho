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
        
        # Simular fase lunar (0-100, onde 0 é lua nova e 100 é lua cheia)
        fase_lunar = random.randint(0, 100)
        logger.info(f"Fase lunar: {fase_lunar}/100")
        
        # Simular vento (km/h)
        vento = random.uniform(0, 30)
        logger.info(f"Velocidade do vento: {vento:.1f} km/h")
        
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
        
        # Avaliar condições gerais
        # Verificar condições de mergulho
        # Condições ideais:
        # - Vento < 15 km/h
        # - Precipitação < 5 mm
        # - Maré < 1.5 m
        
        condicoes_ideais = (vento < 15 and precipitacao < 5 and mare < 1.5)
        
        if condicoes_ideais:
            avaliacao = "Condições Ótimas para Mergulho"
            recomendacao = "Recomendado para todos os níveis"
        elif vento < 20 and precipitacao < 10 and mare < 1.8:
            avaliacao = "Condições Boas para Mergulho"
            recomendacao = "Recomendado para mergulhadores intermediários e avançados"
        else:
            avaliacao = "Condições Desfavoráveis para Mergulho"
            recomendacao = "Não recomendado - considere adiar"
        
        logger.info(f"Avaliação: {avaliacao}")
        logger.info(f"Recomendação: {recomendacao}")
        
        # Criar relatório
        relatorio = {
            "data_hora": data_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "fase_lunar": fase_lunar,
            "vento": round(vento, 1),
            "precipitacao": round(precipitacao, 1),
            "mare": round(mare, 1),
            "estacao": estacao,
            "avaliacao": avaliacao,
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
            # Tentar salvar no diretório atual
            json_path = f'relatorio_{timestamp}.json'
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(relatorio, f, ensure_ascii=False, indent=4)
            logger.info(f"Relatório JSON salvo no diretório atual: {json_path}")
        
        # Gerar relatório em texto para visualização no GitHub
        try:
            txt_path = os.path.join('relatorios', f'relatorio_{timestamp}.txt')
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"RELATÓRIO DE CONDIÇÕES DE MERGULHO\n")
                f.write(f"Data/Hora: {relatorio['data_hora']}\n")
                f.write(f"Fase Lunar: {relatorio['fase_lunar']}/100\n")
                f.write(f"Vento: {relatorio['vento']} km/h\n")
                f.write(f"Precipitação: {relatorio['precipitacao']} mm\n")
                f.write(f"Maré: {relatorio['mare']} m\n")
                f.write(f"Estação: {relatorio['estacao']}\n")
                f.write(f"Avaliação: {relatorio['avaliacao']}\n")
                f.write(f"Recomendação: {relatorio['recomendacao']}\n")
            logger.info(f"Relatório TXT salvo em: {txt_path}")
        except Exception as e:
            logger.error(f"Erro ao salvar relatório TXT: {e}")
            # Tentar salvar no diretório atual
            txt_path = f'relatorio_{timestamp}.txt'
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(f"RELATÓRIO DE CONDIÇÕES DE MERGULHO\n")
                f.write(f"Data/Hora: {relatorio['data_hora']}\n")
                f.write(f"Fase Lunar: {relatorio['fase_lunar']}/100\n")
                f.write(f"Vento: {relatorio['vento']} km/h\n")
                f.write(f"Precipitação: {relatorio['precipitacao']} mm\n")
                f.write(f"Maré: {relatorio['mare']} m\n")
                f.write(f"Estação: {relatorio['estacao']}\n")
                f.write(f"Avaliação: {relatorio['avaliacao']}\n")
                f.write(f"Recomendação: {relatorio['recomendacao']}\n")
            logger.info(f"Relatório TXT salvo no diretório atual: {txt_path}")
        
        # Criar um relatório resumido para o stdout do GitHub Actions
        print("\n" + "="*50)
        print("RELATÓRIO DE CONDIÇÕES DE MERGULHO - RESUMO")
        print("="*50)
        print(f"Data/Hora: {relatorio['data_hora']}")
        print(f"Vento: {relatorio['vento']} km/h")
        print(f"Precipitação: {relatorio['precipitacao']} mm")
        print(f"Maré: {relatorio['mare']} m")
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