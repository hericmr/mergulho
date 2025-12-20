/**
 * Módulo para análise de marés e seu impacto no mergulho
 */
import { CONFIG } from '../config.js';
import { buscarDadosAPI } from '../api/cliente.js';
import { obterCache, definirCache } from '../utils/cache.js';

/**
 * Analisa e interpreta dados de maré para recomendações de mergulho
 * @param {Array<string>} mareAlta - Array com horários de maré alta
 * @param {Array<string>} mareBaixa - Array com horários de maré baixa
 * @returns {object} Análise das próximas marés e condições para mergulho
 */
export function analisarProximasMares(mareAlta, mareBaixa) {
    const agora = new Date();
    const proximasHoras = new Date(agora.getTime() + 12 * 60 * 60 * 1000); // 12 horas à frente

    // Filtrar apenas marés nas próximas 12 horas
    const proximaMareAlta = mareAlta
        .map(mare => ({ time: new Date(mare.time), height: mare.height }))
        .filter(mare => mare.time > agora && mare.time < proximasHoras)
        .sort((a, b) => a.time - b.time)[0];

    const proximaMareBaixa = mareBaixa
        .map(mare => ({ time: new Date(mare.time), height: mare.height }))
        .filter(mare => mare.time > agora && mare.time < proximasHoras)
        .sort((a, b) => a.time - b.time)[0];

    // Determinar qual é a próxima maré (alta ou baixa)
    let proximaMare = null;
    let alturaProximaMare = null;
    let tipoProximaMare = null;

    if (proximaMareAlta && proximaMareBaixa) {
        if (proximaMareAlta.time < proximaMareBaixa.time) {
            proximaMare = proximaMareAlta.time;
            alturaProximaMare = proximaMareAlta.height;
            tipoProximaMare = 'alta';
        } else {
            proximaMare = proximaMareBaixa.time;
            alturaProximaMare = proximaMareBaixa.height;
            tipoProximaMare = 'baixa';
        }
    } else if (proximaMareAlta) {
        proximaMare = proximaMareAlta.time;
        alturaProximaMare = proximaMareAlta.height;
        tipoProximaMare = 'alta';
    } else if (proximaMareBaixa) {
        proximaMare = proximaMareBaixa.time;
        alturaProximaMare = proximaMareBaixa.height;
        tipoProximaMare = 'baixa';
    }

    // Análise para mergulho baseada nas marés
    let condicaoMergulho = 'indefinida';
    let descricao = '';

    if (proximaMare) {
        const horasAteProximaMare = (proximaMare - agora) / (1000 * 60 * 60);

        if (tipoProximaMare === 'baixa') {
            if (horasAteProximaMare < 1) {
                condicaoMergulho = 'ideal';
                descricao = 'Maré baixa iminente, condições ideais para mergulho em recifes costeiros';
            } else if (horasAteProximaMare < 3) {
                condicaoMergulho = 'boa';
                descricao = 'Aproximando-se da maré baixa, boas condições para mergulho';
            } else {
                condicaoMergulho = 'razoável';
                descricao = 'Maré baixa em algumas horas, condições razoáveis';
            }
        } else {
            if (horasAteProximaMare < 1) {
                condicaoMergulho = 'boa';
                descricao = 'Maré alta iminente, boas condições para profundidade';
            } else if (horasAteProximaMare < 3) {
                condicaoMergulho = 'razoável';
                descricao = 'Aproximando-se da maré alta, condições razoáveis';
            } else {
                condicaoMergulho = 'razoável';
                descricao = 'Maré alta em algumas horas, condições razoáveis';
            }
        }
    } else {
        condicaoMergulho = 'desconhecida';
        descricao = 'Não há informações de marés para as próximas horas';
    }

    return {
        proximaMare: proximaMare ? proximaMare.toISOString() : null,
        tipoProximaMare: tipoProximaMare,
        altura: alturaProximaMare,
        condicaoMergulho: condicaoMergulho,
        descricao: descricao
    };
}

/**
 * Consulta e analisa dados de marés
 * @returns {Promise<object>} Dados de marés com análise para mergulho
 */
export async function checarMare() {
    const chaveCache = 'dadosMare';
    const dadosCache = obterCache(chaveCache);

    if (dadosCache) {
        // Verifica se os dados ainda são relevantes (tem marés futuras)
        const agora = new Date();
        const temMaresFuturas = dadosCache.mareAlta.some(mare => new Date(mare) > agora) ||
            dadosCache.mareBaixa.some(mare => new Date(mare) > agora);

        if (temMaresFuturas) {
            return dadosCache;
        }
    }

    try {
        const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${CONFIG.LATITUDE}&lng=${CONFIG.LONGITUDE}`;

        const dados = await buscarDadosAPI(url);

        if (!dados || !dados.data || dados.data.length === 0) {
            throw new Error('Dados inválidos da API de marés');
        }

        // Extrair dados de marés com altura
        const mareAlta = dados.data
            .filter(entry => entry.type === 'high')
            .map(entry => ({ time: entry.time, height: entry.height }));

        const mareBaixa = dados.data
            .filter(entry => entry.type === 'low')
            .map(entry => ({ time: entry.time, height: entry.height }));

        // Análise das próximas marés
        const proximasMaresAnalise = analisarProximasMares(mareAlta, mareBaixa);

        const resultado = {
            mareAlta: mareAlta.map(m => m.time),
            mareBaixa: mareBaixa.map(m => m.time),
            analise: proximasMaresAnalise
        };

        definirCache(chaveCache, resultado);
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar marés:', erro);
        return {
            mareAlta: [],
            mareBaixa: [],
            erro: erro.message
        };
    }
} 