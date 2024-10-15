import random
import string

def gerar_parte_hexadecimal(tamanho):
    """Gera uma parte hexadecimal aleatória de tamanho especificado."""
    return ''.join(random.choice('0123456789abcdef') for _ in range(tamanho))

def gerar_api_key():
    """Gera uma chave de API seguindo o padrão especificado."""
    parte1 = gerar_parte_hexadecimal(8)  # 8 caracteres
    parte2 = gerar_parte_hexadecimal(4)  # 4 caracteres
    parte3 = '11ef'  # Fixo
    parte4 = gerar_parte_hexadecimal(4)  # 4 caracteres
    parte5 = '0242ac130003'  # Fixo
    
    # O último bloco deve ser uma repetição dos 8 primeiros caracteres
    api_key = f"{parte1}-{parte2}-{parte3}-{parte4}-{parte5}-{parte1}"
    return api_key

# Gerar e imprimir 5 chaves de API
for _ in range(5):
    print(gerar_api_key())
