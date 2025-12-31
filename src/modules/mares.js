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
        const response = await fetch('public/data/json/tabela.json');
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
            analise: {
                condicaoMergulho,
                descricao: recomendacao
            }
        };
    } catch (err) {
        console.error('Erro no módulo de marés:', err);
        return { error: err.message, favoravel: false };
    }
}
