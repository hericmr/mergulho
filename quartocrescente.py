import arrow

# Tabela de referência de fases lunares (exemplo com algumas datas)
fases_lunares = {
    'quarto_crescente': [
        arrow.get('2024-01-11 08:57'),
        arrow.get('2024-02-09 19:59'),
        arrow.get('2024-03-10 06:00'),
        arrow.get('2024-04-08 15:20'),
        arrow.get('2024-05-08 00:21'),
        arrow.get('2024-06-06 09:37'),
        arrow.get('2024-07-05 19:57'),
        arrow.get('2024-08-04 08:13'),
        arrow.get('2024-09-02 22:55'),
        arrow.get('2024-10-02 15:49'),
        arrow.get('2024-11-01 09:47'),
        arrow.get('2024-12-08 12:26')
    ]
}

def dias_para_quarto_crescente():
    now = arrow.now()

    # Procurar o próximo Quarto Crescente
    for fase in fases_lunares['quarto_crescente']:
        if fase > now:
            dias_restantes = (fase - now).days
            return dias_restantes

    return None

# Chamada da função e exibição do resultado
dias_restantes = dias_para_quarto_crescente()
if dias_restantes is not None:
    print(f"Faltam {dias_restantes} dias para o próximo Quarto Crescente.")
else:
    print("Não há dados disponíveis sobre o próximo Quarto Crescente.")
