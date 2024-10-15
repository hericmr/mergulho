import arrow
import requests

api_keys = [
    "ea996e2a-88a5-11ef-ae24-0242ac130003-ea996e98-88a5-11ef-ae24-0242ac130003",
    "6b7ca118-da20-11ee-8a07-0242ac130002-6b7ca186-da20-11ee-8a07-0242ac130002",
    "1d6c47a6-8a21-11ef-a0d5-0242ac130003-1d6c4814-8a21-11ef-a0d5-0242ac130003",
    "bf5e8542-8a21-11ef-8d8d-0242ac130003-bf5e8614-8a21-11ef-8d8d-0242ac130003"
]
lat = -23.9608
lon = -46.3336

def make_request(url, params):
    for api_key in api_keys:
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

def eh_verao():
    now = arrow.now()
    return now.month in [12, 1, 2]

def dias_para_verao():
    now = arrow.now()
    ano_atual = now.year
    inicio_verao = arrow.get(f"{ano_atual}-12-21")
    
    if now > inicio_verao:
        inicio_verao = inicio_verao.shift(years=1)

    return (inicio_verao - now).days

def dias_para_quarto_crescente():
    now = arrow.now()
    dias = 0

    while True:
        start = now.shift(days=dias).floor('day')
        end = start.shift(days=1).floor('day')

        params = {
            'lat': lat,
            'lng': lon,
            'start': start.to('UTC').timestamp(),
            'end': end.to('UTC').timestamp(),
        }

        dados_json = make_request('https://api.stormglass.io/v2/astronomy/point', params)
        if dados_json:
            fase_lua = dados_json['data'][0]['moonPhase']['current']['text']
            if fase_lua == 'First quarter':
                return dias
        else:
            return None
        dias += 1

def checar_fase_da_lua():
    start = arrow.now().floor('day')
    end = arrow.now().shift(days=1).floor('day')

    params = {
        'lat': lat,
        'lng': lon,
        'start': start.to('UTC').timestamp(),
        'end': end.to('UTC').timestamp(),
    }

    dados_json = make_request('https://api.stormglass.io/v2/astronomy/point', params)
    if dados_json:
        fase_lua = dados_json['data'][0]['moonPhase']['current']['text']
        return fase_lua, fase_lua == 'First quarter'
    else:
        return None, False

def checar_mare():
    params = {
        'lat': lat,
        'lng': lon,
    }

    dados_mare = make_request('https://api.stormglass.io/v2/tide/extremes/point', params)
    if dados_mare:
        mare_alta = []
        for mare in dados_mare['data']:
            if mare['type'] == 'high':
                mare_alta.append(arrow.get(mare['time']))
        return mare_alta
    else:
        return []

def checar_a_chuva():
    choveu = False
    start = arrow.now().shift(days=-3).floor('day')
    end = arrow.now().floor('day')

    params = {
        'lat': lat,
        'lng': lon,
        'start': start.to('UTC').timestamp(),
        'end': end.to('UTC').timestamp(),
        'params': 'precipitation'
    }

    dados_chuva = make_request('https://api.stormglass.io/v2/weather/point', params)
    if dados_chuva:
        for entry in dados_chuva['hours']:
            if entry['precipitation']['sg'] > 0:
                choveu = True
                break
    return choveu

def checar_condicoes_de_mergulho():
    agora = arrow.now().format('YYYY-MM-DD HH:mm:ss')
    print(f"Data e hora da verificação: {agora}")

    if eh_verao():
        print("Estamos no verão, época ideal para mergulho.")
    else:
        dias_restantes = dias_para_verao()
        print(f"Ainda não estamos no verão. Faltam {dias_restantes} dias para o início do verão.")

    dias_quarto_crescente = dias_para_quarto_crescente()
    if dias_quarto_crescente is not None:
        print(f"Faltam {dias_quarto_crescente} dias para o próximo Quarto Crescente.")
    else:
        print("Não foi possível determinar quando será o próximo Quarto Crescente.")

    if checar_a_chuva():
        print("Choveu nos últimos 3 dias. O mergulho pode estar prejudicado.")
    else:
        print("Não houve chuva nos últimos 3 dias, as condições estão favoráveis.")

    fase_lua, lua_quarto_crescente = checar_fase_da_lua()
    print(f"A fase atual da lua é {fase_lua}.")
    if lua_quarto_crescente:
        print("A lua está em Quarto Crescente, o que melhora as condições de maré.")
    else:
        print("A lua não está em Quarto Crescente, o que pode afetar as marés.")

    mare_alta = checar_mare()
    if mare_alta:
        print("Próximos momentos de maré alta:")
        for mare in mare_alta:
            print(f"Maré alta em: {mare.format('YYYY-MM-DD HH:mm:ss')}")
        print("Este pode ser um bom momento para mergulhar.")
    else:
        print("Nenhuma informação de maré alta disponível no momento.")

checar_condicoes_de_mergulho()
