import csv
import json
import os
import re

input_file = os.path.abspath('../fases_lua - 2011-2030.csv')
output_file = os.path.abspath('public/data/json/moon_phases.json')

moon_phases = []
current_year = None

month_map = {
    'JAN': '01', 'Jan': '01',
    'FEV': '02', 'Fev': '02',
    'MAR': '03', 'Mar': '03',
    'ABR': '04', 'Abr': '04',
    'MAI': '05', 'Mai': '05',
    'JUN': '06', 'Jun': '06',
    'JUL': '07', 'Jul': '07',
    'AGO': '08', 'Ago': '08',
    'SET': '09', 'Set': '09',
    'OUT': '10', 'Out': '10',
    'NOV': '11', 'Nov': '11',
    'DEZ': '12', 'Dez': '12'
}

def parse_date(year, month_str, day, hour, min_str):
    if not month_str or not day:
        return None
    month = month_map.get(month_str.strip())
    if not month:
        return None
    
    d = day.strip().zfill(2)
    h = hour.strip().zfill(2) if hour else '00'
    m = min_str.strip().zfill(2) if min_str else '00'
    
    return f"{year}-{month}-{d}T{h}:{m}:00"

print(f"Reading from: {input_file}")

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

for line in lines:
    parts = line.split(',')
    
    # Check for year
    if parts[0] and re.match(r'^\d{4}$', parts[0]):
        current_year = parts[0]
        continue

    # Skip headers or empty lines or "NOVA" lines or 'D,h,min' lines
    if not current_year or len(parts) < 15:
        continue
    if 'NOVA' in parts[0] or parts[1] == 'D':
        continue

    # Nova: 0-3 (Month, Day, Hour, Min)
    if parts[0]:
        date = parse_date(current_year, parts[0], parts[1], parts[2], parts[3])
        if date:
            moon_phases.append({'phase': 'Nova', 'date': date})

    # Crescente: 5-8
    try:
        if parts[5]:
            date = parse_date(current_year, parts[5], parts[6], parts[7], parts[8])
            if date:
                moon_phases.append({'phase': 'Crescente', 'date': date})
    except IndexError:
        pass

    # Cheia: 10-13
    try:
        if parts[10]:
            date = parse_date(current_year, parts[10], parts[11], parts[12], parts[13])
            if date:
                moon_phases.append({'phase': 'Cheia', 'date': date})
    except IndexError:
        pass

    # Minguante: 15-18
    try:
        if parts[15]:
            date = parse_date(current_year, parts[15], parts[16], parts[17], parts[18])
            if date:
                moon_phases.append({'phase': 'Minguante', 'date': date})
    except IndexError:
        pass

# Sort by date
moon_phases.sort(key=lambda x: x['date'])

# Ensure output directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(moon_phases, f, indent=2)

print(f"Successfully parsed {len(moon_phases)} moon phases to {output_file}")
