/**
 * Módulo para análise de marés e seu impacto no mergulho
 */
import { CONFIG } from '../config.js';

// Cosine interpolation between two points (t1, h1) and (t2, h2)
function interpolate(t, t1, h1, t2, h2) {
    const mu = (t - t1) / (t2 - t1);
    const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
    return h1 * (1 - mu2) + h2 * mu2;
}

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function interpolateTideAt(min, points) {
    let p1 = points[0];
    let p2 = points[points.length - 1];
    for (let i = 0; i < points.length - 1; i++) {
        if (min >= points[i].minutes && min <= points[i + 1].minutes) {
            p1 = points[i];
            p2 = points[i + 1];
            break;
        }
    }
    return interpolate(min, p1.minutes, p1.height, p2.minutes, p2.height);
}

/**
 * Consulta e analisa dados de marés usando arquivo local JSON
 * @returns {Promise<object>} Dados de marés com análise para mergulho
 */
export async function checarMare() {
    try {
        // Adicionando um cache buster para garantir que pegamos a versão mais recente
        const cacheBuster = `v=${new Date().getTime()}`;
        const relativePath = `public/data/json/tabela.json?${cacheBuster}`;

        console.log(`Buscando marés em: ${relativePath}`);
        let response = await fetch(relativePath);

        // Se falhar o relativo (status 404), tenta com PUBLIC_URL
        if (!response.ok && CONFIG.PUBLIC_URL) {
            const absolutePath = `${CONFIG.PUBLIC_URL}/public/data/json/tabela.json?${cacheBuster}`.replace(/\/+/g, '/');
            console.log(`Relativo falhou, tentando absoluto: ${absolutePath}`);
            response = await fetch(absolutePath);
        }

        // Fetch Moon Phases
        let moonResponse = null;
        try {
            const moonPath = `public/data/json/moon_phases.json?${cacheBuster}`;
            moonResponse = await fetch(moonPath);
            if (!moonResponse.ok && CONFIG.PUBLIC_URL) {
                moonResponse = await fetch(`${CONFIG.PUBLIC_URL}/public/data/json/moon_phases.json?${cacheBuster}`.replace(/\/+/g, '/'));
            }
        } catch (e) {
            console.warn("Could not fetch moon phases", e);
        }

        const moonData = moonResponse && moonResponse.ok ? await moonResponse.json() : [];

        if (!response.ok) {
            throw new Error(`Falha ao carregar dados de maré: ${response.status} ${response.statusText}`);
        }

        const tideData = await response.json();

        const agora = new Date();
        const y = agora.getFullYear();
        const m = agora.getMonth() + 1;
        const d = agora.getDate();

        const dayEntries = tideData.filter(e => e.year === y && e.month === m && e.day === d);
        if (dayEntries.length === 0) throw new Error('Dados de maré não encontrados para hoje');

        // Sorting for interpolation
        const sortedPeaks = [...tideData].sort((a, b) => {
            const d1 = new Date(a.year, a.month - 1, a.day, ...a.time.split(':')).getTime();
            const d2 = new Date(b.year, b.month - 1, b.day, ...b.time.split(':')).getTime();
            return d1 - d2;
        });

        const firstIdx = sortedPeaks.findIndex(e => e.year === y && e.month === m && e.day === d && e.time === dayEntries[0].time);
        const prevPeak = sortedPeaks[firstIdx - 1];
        const nextPeak = sortedPeaks[firstIdx + dayEntries.length];

        const interpolationPoints = [];
        const startOfDay = new Date(y, m - 1, d).getTime();

        if (prevPeak) {
            const dt = new Date(prevPeak.year, prevPeak.month - 1, prevPeak.day, ...prevPeak.time.split(':')).getTime();
            interpolationPoints.push({ minutes: (dt - startOfDay) / 60000, height: prevPeak.height });
        } else {
            interpolationPoints.push({ minutes: timeToMinutes(dayEntries[0].time) - 360, height: dayEntries[0].height });
        }

        dayEntries.forEach(e => interpolationPoints.push({ minutes: timeToMinutes(e.time), height: e.height }));

        if (nextPeak) {
            const dt = new Date(nextPeak.year, nextPeak.month - 1, nextPeak.day, ...nextPeak.time.split(':')).getTime();
            interpolationPoints.push({ minutes: (dt - startOfDay) / 60000, height: nextPeak.height });
        } else {
            const last = dayEntries[dayEntries.length - 1];
            interpolationPoints.push({ minutes: timeToMinutes(last.time) + 360, height: last.height });
        }

        const nowMinutes = agora.getHours() * 60 + agora.getMinutes();
        const currentHeight = interpolateTideAt(nowMinutes, interpolationPoints);

        // Calculate daily range (amplitude)
        const heights = dayEntries.map(e => e.height);
        const minH = Math.min(...heights);
        const maxH = Math.max(...heights);
        const amplitude = maxH - minH;

        // Classification based on amplitude
        let classificacao = 'Intermediária';
        let detalhe = 'Variação moderada, possível presença de correntes.';
        let pontuacaoTid = 1;

        if (amplitude < 0.6) {
            classificacao = 'Maré Morta';
            detalhe = 'Ideal para visibilidade, com pouco movimento de água.';
            pontuacaoTid = 3;
        } else if (amplitude < 0.9) {
            classificacao = 'Intermediária Baixa';
            detalhe = 'Condição favorável com correnteza moderada.';
            pontuacaoTid = 2;
        } else if (amplitude < 1.2) {
            classificacao = 'Intermediária';
            detalhe = 'Variação moderada, possível presença de correntes.';
            pontuacaoTid = 1;
        } else {
            classificacao = 'Ampla Variação';
            detalhe = 'Grande volume de água em movimento, visibilidade reduzida e correntes fortes.';
            pontuacaoTid = 0;
        }

        // Find next event
        const nextEvent = dayEntries.find(e => timeToMinutes(e.time) > nowMinutes) || nextPeak;

        let condicaoMergulho = 'regular';
        let recomendacao = '';
        let estado = 'indefinido';

        if (nextEvent) {
            const eventMin = nextEvent.minutes !== undefined ? nextEvent.minutes : (nextEvent.day === d ? timeToMinutes(nextEvent.time) : timeToMinutes(nextEvent.time) + 1440);
            const minutesToNext = eventMin - nowMinutes;
            const hoursToNext = Math.floor(minutesToNext / 60);
            const minsRemaining = Math.floor(minutesToNext % 60);

            // Determinar tipo do próximo evento
            const eventIdx = sortedPeaks.findIndex(p => p === nextEvent);
            const isHigh = nextEvent.height > sortedPeaks[eventIdx - 1]?.height;
            const tipoEvento = isHigh ? 'Maré Alta' : 'Maré Baixa';
            estado = isHigh ? 'Enchendo' : 'Secando';

            const tempoRestanteStr = hoursToNext > 0 ? `${hoursToNext}h ${minsRemaining}m` : `${minsRemaining}m`;

            if (classificacao === 'Maré Morta') {
                condicaoMergulho = 'excelente';
                recomendacao = `Maré Morta (Amplitude: ${amplitude.toFixed(2)}m). Pouco movimento de água, ideal para visibilidade. Próxima ${tipoEvento} em ${tempoRestanteStr}.`;
            } else if (!isHigh && hoursToNext < 1.5) {
                condicaoMergulho = 'excelente';
                recomendacao = `Perto do estofo da maré baixa (em ${tempoRestanteStr}). Ideal para visibilidade.`;
            } else if (isHigh && hoursToNext < 1.5) {
                condicaoMergulho = 'boa';
                recomendacao = `Perto da maré alta (em ${tempoRestanteStr}). Bom para profundidade em alguns pontos.`;
            } else {
                condicaoMergulho = (pontuacaoTid >= 2) ? 'boa' : (pontuacaoTid === 1 ? 'regular' : 'ruim');
                recomendacao = `Próxima ${tipoEvento} em ${tempoRestanteStr}. Maré em movimento, correnteza possível.`;
            }
        }

        // Generate curve data for chart
        const waveData = [];
        for (let min = 0; min <= 1440; min += 10) {
            waveData.push({ x: min, y: interpolateTideAt(min, interpolationPoints) });
        }

        // Moon Phase Logic
        let faseLuaInfo = {
            texto: 'Desconhecida',
            favoravel: true,
            motivo: 'Dados indisponíveis'
        };

        if (moonData.length > 0) {
            // Find the last phase event before or equal to now
            const nowTime = agora.getTime();

            // moonData is sorted by date. Find the last one where date <= now
            // Using simple iteration since array is small per year ~50 items, but total 20 years is ~1000.
            // Binary search would be better or just filter.
            // Optimize: search backwards or filter where date <= now

            // We can find the index where the next event is in the future
            let currentPhaseIdx = -1;

            for (let i = 0; i < moonData.length; i++) {
                const pDate = new Date(moonData[i].date).getTime();
                if (pDate > nowTime) {
                    currentPhaseIdx = i - 1;
                    break;
                }
            }

            if (currentPhaseIdx === -1 && moonData.length > 0) {
                // All in past?
                currentPhaseIdx = moonData.length - 1;
            }

            if (currentPhaseIdx >= 0) {
                const currentPhase = moonData[currentPhaseIdx];
                const phaseName = currentPhase.phase; // Nova, Crescente, Cheia, Minguante

                // Map to display text and favorability
                const phaseMap = {
                    'Nova': { text: 'Lua Nova', fav: false, desc: 'Marés de sizígia (maior amplitude).' },
                    'Crescente': { text: 'Lua Crescente', fav: true, desc: 'Marés de quadratura (menor amplitude).' },
                    'Cheia': { text: 'Lua Cheia', fav: false, desc: 'Marés de sizígia (maior amplitude).' },
                    'Minguante': { text: 'Lua Minguante', fav: true, desc: 'Marés de quadratura (menor amplitude).' }
                };

                const info = phaseMap[phaseName] || { text: phaseName, fav: true, desc: '' };

                faseLuaInfo = {
                    texto: info.text,
                    favoravel: info.fav,
                    motivo: info.desc
                };
            }
        }

        return {
            currentHeight,
            dayEntries,
            waveData,
            nowMinutes,
            amplitude,
            classificacao,
            detalhe,
            pontuacao: pontuacaoTid,
            favoravel: pontuacaoTid >= 2,
            estado: estado,
            altura: currentHeight,
            faseLua: faseLuaInfo, // Add explicit faseLua for callers who check it directly
            analise: { // Merge into existing structures if needed, but 'checarMare' returns the whole object usually
                condicaoMergulho,
                descricao: recomendacao
            },
            // Ensure interface.js finds it deep inside if it looks there, 
            // but checking interface.js again, it accesses: resultadoAvaliacao.fatoresAnalisados.faseLua
            // The return of checarMare is result of 'mare' factor? 
            // Wait, looking at interface.js:
            // resultadoAvaliacao.fatoresAnalisados.faseLua
            // This suggests 'checarMare' is NOT the only thing returning the full result.
            // 'checarMare' seems to return TIDE data.
            // There must be a main 'avaliar' function that aggregates everything.
            // I should check 'src/modules/resultado.js' or 'src/app.js'.
            // Because 'checarMare' seems focused on Tides.
            // However, Moon Phase is strongly related to Tides.
            // I will return 'faseLua' here, and let the aggregator pick it up.
        };
    } catch (err) {
        console.error('Erro no módulo de marés:', err);
        return {
            error: err.message,
            favoravel: false,
            pontuacao: 0,
            classificacao: 'Erro',
            detalhe: 'Não foi possível obter dados de maré.',
            waveData: [],
            dayEntries: [],
            amplitude: 0
        };
    }
}
