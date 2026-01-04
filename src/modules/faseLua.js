/**
 * Módulo para lidar com fases da lua e suas implicações para mergulho
 * Implementação aprimorada usando a API do U.S. Naval Observatory (USNO)
 * API específica para Santos, Brasil
 */
import { CONFIG } from '../config.js';
import { obterCache, definirCache } from '../utils/cache.js';

// Constantes para Santos, Brasil
const COORDENADAS_SANTOS = {
    LATITUDE: -23.9608,
    LONGITUDE: -46.3336
};

// Tradução das fases lunares do inglês para português
const TRADUCAO_FASES = {
    'New Moon': 'Lua Nova',
    'First Quarter': 'Quarto Crescente',
    'Full Moon': 'Lua Cheia',
    'Last Quarter': 'Quarto Minguante',
    'Waxing Crescent': 'Crescente',
    'Waxing Gibbous': 'Crescente Gibosa',
    'Waning Gibbous': 'Minguante Gibosa',
    'Waning Crescent': 'Minguante'
};

/**
 * Converte valor numérico de fase lunar do OpenWeatherMap para texto descritivo
 * @param {number} faseLuaNumero - Valor entre 0 e 1 representando fase lunar
 * @returns {string} Texto descritivo da fase lunar
 */
function converterFaseLunarParaTexto(faseLuaNumero) {
    // OpenWeatherMap moon_phase: 
    // 0 e 1 são 'lua nova' (new moon)
    // 0.25 é 'quarto crescente' (first quarter)
    // 0.5 é 'lua cheia' (full moon)
    // 0.75 é 'quarto minguante' (last quarter)

    if (faseLuaNumero === 0 || faseLuaNumero === 1) {
        return "Lua Nova";
    } else if (faseLuaNumero > 0 && faseLuaNumero < 0.25) {
        return "Crescente";
    } else if (Math.abs(faseLuaNumero - 0.25) < 0.01) {
        return "Quarto Crescente";
    } else if (faseLuaNumero > 0.25 && faseLuaNumero < 0.5) {
        return "Crescente Gibosa";
    } else if (Math.abs(faseLuaNumero - 0.5) < 0.01) {
        return "Lua Cheia";
    } else if (faseLuaNumero > 0.5 && faseLuaNumero < 0.75) {
        return "Minguante Gibosa";
    } else if (Math.abs(faseLuaNumero - 0.75) < 0.01) {
        return "Quarto Minguante";
    } else {
        return "Minguante";
    }
}

/**
 * Calcula a porcentagem de iluminação com base no valor de fase lunar
 * @param {number} faseLuaNumero - Valor entre 0 e 1 representando fase lunar
 * @returns {number} Porcentagem de iluminação (0-100)
 */
function calcularIluminacao(faseLuaNumero) {
    // Na lua nova (0 ou 1) e na lua cheia (0.5) a iluminação é mais evidente
    // Fase 0/1 = 0% iluminação (lua nova)
    // Fase 0.5 = 100% iluminação (lua cheia)

    // Converter para porcentagem variando de 0 a 100
    if (faseLuaNumero === 0 || faseLuaNumero === 1) {
        return 0; // Lua Nova = 0% iluminação
    } else if (faseLuaNumero <= 0.5) {
        return Math.round((faseLuaNumero / 0.5) * 100);
    } else {
        return Math.round(((1 - faseLuaNumero) / 0.5) * 100);
    }
}

/**
 * Avalia se a fase lunar atual é favorável para mergulho
 * @param {string} faseLua - Texto descritivo da fase lunar
 * @param {number} iluminacao - Porcentagem de iluminação da lua
 * @returns {object} Avaliação da fase para mergulho
 */
export function avaliarFaseParaMergulho(faseLua, iluminacao) {
    const faseNormalizada = faseLua.toLowerCase();

    // Quarto Crescente é a melhor fase para mergulho
    if (faseNormalizada.includes('quarto crescente') ||
        faseNormalizada.includes('first quarter')) {
        return {
            favoravel: true,
            pontuacao: 3,
            motivo: 'Quarto crescente é ideal para mergulho com boa visibilidade em Santos porque nessa de maré de quadratura (morta). A baixa amplitude das marés reduz correntes e suspensão de sedimentos, proporcionando visibilidade cristalina em Santos.'
        };
    }

    // Fases próximas ao quarto crescente
    if (faseNormalizada.includes('crescente') && !faseNormalizada.includes('gibosa')) {
        return {
            favoravel: true,
            pontuacao: 2,
            motivo: 'Fase de transição com marés moderadas. Condições favoráveis com tendência à melhoria da visibilidade.'
        };
    }

    // Lua cheia
    if (faseNormalizada.includes('lua cheia') ||
        faseNormalizada.includes('full moon')) {
        return {
            favoravel: false,
            pontuacao: 1,
            motivo: 'Marés de sizígia. A alta luminosidade é interessante, mas a grande variação de maré pode elevar a turbidez da água.'
        };
    }

    // Lua nova
    if (faseNormalizada.includes('lua nova') ||
        faseNormalizada.includes('new moon')) {
        return {
            favoravel: false,
            pontuacao: 0,
            motivo: 'Marés de sizígia. Ausência de luminosidade natural e grande variação de maré, o que costuma reduzir a visibilidade subaquática.'
        };
    }

    // Fases minguantes
    if (faseNormalizada.includes('minguante') ||
        faseNormalizada.includes('last quarter') ||
        faseNormalizada.includes('waning')) {
        return {
            favoravel: false,
            pontuacao: 0,
            motivo: 'Condições de visibilidade instáveis devido ao movimento residual das grandes marés de sizígia.'
        };
    }

    // Caso padrão
    return {
        favoravel: false,
        pontuacao: 0,
        motivo: 'Fase lunar não ideal para condições de mergulho em Santos'
    };
}

// Tabela de Fases da Lua 2025 - Fonte: Departamento de Astronomia do IAG/USP
const FASES_LUA_2025 = [
    { data: "2025-01-06T20:56:00", fase: "Quarto Crescente" }, { data: "2025-01-13T19:26:00", fase: "Lua Cheia" }, { data: "2025-01-21T17:30:00", fase: "Quarto Minguante" }, { data: "2025-01-29T09:35:00", fase: "Lua Nova" },
    { data: "2025-02-05T05:02:00", fase: "Quarto Crescente" }, { data: "2025-02-12T10:53:00", fase: "Lua Cheia" }, { data: "2025-02-20T14:32:00", fase: "Quarto Minguante" }, { data: "2025-02-27T21:44:00", fase: "Lua Nova" },
    { data: "2025-03-06T13:31:00", fase: "Quarto Crescente" }, { data: "2025-03-14T03:54:00", fase: "Lua Cheia" }, { data: "2025-03-22T08:29:00", fase: "Quarto Minguante" }, { data: "2025-03-29T07:57:00", fase: "Lua Nova" },
    { data: "2025-04-04T23:14:00", fase: "Quarto Crescente" }, { data: "2025-04-12T21:22:00", fase: "Lua Cheia" }, { data: "2025-04-20T22:35:00", fase: "Quarto Minguante" }, { data: "2025-04-27T16:31:00", fase: "Lua Nova" },
    { data: "2025-05-04T10:51:00", fase: "Quarto Crescente" }, { data: "2025-05-12T13:55:00", fase: "Lua Cheia" }, { data: "2025-05-20T08:58:00", fase: "Quarto Minguante" }, { data: "2025-05-27T00:02:00", fase: "Lua Nova" },
    { data: "2025-06-03T00:40:00", fase: "Quarto Crescente" }, { data: "2025-06-11T04:43:00", fase: "Lua Cheia" }, { data: "2025-06-18T16:19:00", fase: "Quarto Minguante" }, { data: "2025-06-25T07:31:00", fase: "Lua Nova" },
    { data: "2025-07-02T16:30:00", fase: "Quarto Crescente" }, { data: "2025-07-10T17:36:00", fase: "Lua Cheia" }, { data: "2025-07-17T21:37:00", fase: "Quarto Minguante" }, { data: "2025-07-24T16:11:00", fase: "Lua Nova" },
    { data: "2025-08-01T09:41:00", fase: "Quarto Crescente" }, { data: "2025-08-09T04:55:00", fase: "Lua Cheia" }, { data: "2025-08-16T02:12:00", fase: "Quarto Minguante" }, { data: "2025-08-23T03:06:00", fase: "Lua Nova" },
    { data: "2025-08-31T03:25:00", fase: "Quarto Crescente" }, { data: "2025-09-07T15:08:00", fase: "Lua Cheia" }, { data: "2025-09-14T07:32:00", fase: "Quarto Minguante" }, { data: "2025-09-21T16:54:00", fase: "Lua Nova" },
    { data: "2025-09-29T20:53:00", fase: "Quarto Crescente" }, { data: "2025-10-07T00:47:00", fase: "Lua Cheia" }, { data: "2025-10-13T15:12:00", fase: "Quarto Minguante" }, { data: "2025-10-21T09:25:00", fase: "Lua Nova" },
    { data: "2025-10-29T13:20:00", fase: "Quarto Crescente" }, { data: "2025-11-05T10:19:00", fase: "Lua Cheia" }, { data: "2025-11-12T02:28:00", fase: "Quarto Minguante" }, { data: "2025-11-20T03:47:00", fase: "Lua Nova" },
    { data: "2025-11-28T03:58:00", fase: "Quarto Crescente" }, { data: "2025-12-04T20:14:00", fase: "Lua Cheia" }, { data: "2025-12-11T17:51:00", fase: "Lua Quarto Minguante" }, { data: "2025-12-19T22:43:00", fase: "Lua Nova" },
    { data: "2025-12-27T16:09:00", fase: "Quarto Crescente" }
];

/**
 * Busca e analisa a fase lunar atual usando o arquivo local JSON
 * @returns {Promise<object>} Dados da fase lunar com avaliação
 */
export async function checarFaseDaLua() {
    const chaveCache = 'faseLua_v_local_fix';
    const dadosCache = obterCache(chaveCache);

    if (dadosCache) {
        return dadosCache;
    }

    try {
        const cacheBuster = `v=${new Date().getTime()}`;
        let response = await fetch(`public/data/json/moon_phases.json?${cacheBuster}`);
        if (!response.ok && CONFIG.PUBLIC_URL) {
            response = await fetch(`${CONFIG.PUBLIC_URL}/public/data/json/moon_phases.json?${cacheBuster}`.replace(/\/+/g, '/'));
        }

        if (!response.ok) throw new Error("Falha ao carregar dados de fases da lua");

        const moonData = await response.json();
        const hoje = new Date();
        const nowTime = hoje.getTime();

        // Encontrar a última fase que já ocorreu
        let currentPhaseIdx = -1;
        for (let i = 0; i < moonData.length; i++) {
            const pDate = new Date(moonData[i].date).getTime();
            if (pDate > nowTime) {
                currentPhaseIdx = i - 1;
                break;
            }
        }
        if (currentPhaseIdx === -1 && moonData.length > 0) {
            // Verificar se a primeira data ainda é futuro -> então anterior seria desconhecido? ou assumimos algo?
            // Se moonData[0] é futuro, não temos info do passado. Mas JSON começa em 2011.
            // Se hoje > ultimo dado, pega o ultimo.
            const firstDate = new Date(moonData[0].date).getTime();
            if (nowTime >= firstDate) {
                currentPhaseIdx = moonData.length - 1;
            }
        }

        if (currentPhaseIdx === -1) {
            throw new Error("Data atual fora do alcance dos dados lunares");
        }

        const currentEvent = moonData[currentPhaseIdx];
        const rawPhase = currentEvent.phase; // Nova, Crescente, Cheia, Minguante

        // Mapeamento
        // O CSV original usa nomes em português: NOVA, CRESCENTE, CHEIA, MINGUANTE
        // O código existente espera nomes parciais ou inglês. Vamos mapear para o padrão esperado por avaliarFaseParaMergulho
        // avaliarFaseParaMergulho verifica includes('lua nova'), includes('quarto crescente'), etc.

        // Mapeamento Expresso:
        // Nova -> Lua Nova
        // Crescente -> Quarto Crescente
        // Cheia -> Lua Cheia
        // Minguante -> Quarto Minguante

        let faseTexto = rawPhase;
        if (rawPhase === 'Nova') faseTexto = 'Lua Nova';
        if (rawPhase === 'Crescente') faseTexto = 'Quarto Crescente';
        if (rawPhase === 'Cheia') faseTexto = 'Lua Cheia';
        if (rawPhase === 'Minguante') faseTexto = 'Quarto Minguante';

        // Iluminação aproximada
        let iluminacao = 0;
        if (faseTexto === 'Lua Nova') iluminacao = 0;
        else if (faseTexto === 'Quarto Crescente') iluminacao = 50;
        else if (faseTexto === 'Lua Cheia') iluminacao = 100;
        else if (faseTexto === 'Quarto Minguante') iluminacao = 50;

        // Avaliação
        const avaliacao = avaliarFaseParaMergulho(faseTexto, iluminacao);

        const resultado = {
            texto: faseTexto,
            quartoCrescente: faseTexto === 'Quarto Crescente',
            iluminacao: iluminacao,
            favoravelParaMergulho: avaliacao,
            fonte: "Dados Internos (2011-2030)"
        };

        definirCache(chaveCache, resultado, CONFIG.CACHE_EXPIRACAO);
        return resultado;

    } catch (erro) {
        console.error('Erro ao consultar fases da lua locais:', erro);
        return {
            texto: 'Erro',
            quartoCrescente: false,
            iluminacao: 0,
            favoravelParaMergulho: { favoravel: false, pontuacao: 0, motivo: "Erro ao carregar dados lunares" },
            erro: erro.message
        };
    }
}

/**
 * Função mantida para compatibilidade, mas não utilizada no fluxo principal com tabela fixa
 */
async function checarFaseDaLuaFallback() {
    return { texto: "Função Desativada", iluminacao: 0 };
}

/**
 * Calcula dias até o próximo quarto crescente 
 * @returns {Promise<object>} Informações sobre o próximo quarto crescente
 */
/**
 * Calcula dias até o próximo quarto crescente 
 * @returns {Promise<object>} Informações sobre o próximo quarto crescente
 */
export async function diasParaProximoQuartoCrescente() {
    const chaveCache = 'proximoQuartoCrescente_local';
    const dadosCache = obterCache(chaveCache);

    if (dadosCache) {
        const dataCache = new Date(dadosCache.data);
        const hoje = new Date();

        if (dataCache > hoje) {
            return {
                dias: Math.ceil((dataCache - hoje) / (1000 * 60 * 60 * 24)),
                data: dataCache
            };
        }
    }

    try {
        const cacheBuster = `v=${new Date().getTime()}`;
        let response = await fetch(`public/data/json/moon_phases.json?${cacheBuster}`);
        if (!response.ok && CONFIG.PUBLIC_URL) {
            response = await fetch(`${CONFIG.PUBLIC_URL}/public/data/json/moon_phases.json?${cacheBuster}`.replace(/\/+/g, '/'));
        }

        if (!response.ok) throw new Error("Falha ao carregar dados de fases da lua");

        const moonData = await response.json();
        const hoje = new Date();
        const nowTime = hoje.getTime();

        // Encontrar o próximo Quarto Crescente (Crescente no CSV original)
        let proximadata = null;

        for (const evento of moonData) {
            const pDate = new Date(evento.date).getTime();
            if (pDate > nowTime && evento.phase === 'Crescente') {
                proximadata = new Date(evento.date);
                break;
            }
        }

        if (proximadata) {
            const resultado = {
                dias: Math.ceil((proximadata - hoje) / (1000 * 60 * 60 * 24)),
                data: proximadata
            };
            definirCache(chaveCache, { data: proximadata }, 24 * 60 * 60 * 1000);
            return resultado;
        }

        return {
            dias: null,
            mensagem: "Próximo quarto crescente não encontrado nos dados locais."
        };

    } catch (erro) {
        console.error('Erro ao calcular próximo quarto crescente:', erro);
        return {
            dias: null,
            mensagem: "Erro ao buscar dados lunares",
            erro: erro.message
        };
    }
}

/**
 * Método alternativo para calcular dias até o próximo quarto crescente
 * @returns {Promise<object>} Informações sobre o próximo quarto crescente
 */
async function diasParaProximoQuartoCrescenteFallback() {
    // Usar OpenWeatherMap como fallback
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${COORDENADAS_SANTOS.LATITUDE}&lon=${COORDENADAS_SANTOS.LONGITUDE}&exclude=current,minutely,hourly,alerts&appid=${CONFIG.OPENWEATHER_KEY}`;

    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error(`Erro na API: ${resposta.status} - ${resposta.statusText}`);
    }

    const dados = await resposta.json();

    if (!dados || !dados.daily || dados.daily.length === 0) {
        throw new Error('Dados inválidos da API para previsão lunar');
    }

    // Busca o próximo quarto crescente nos próximos dias
    const hoje = new Date();
    let proximaDataQuartoCrescente = null;

    for (let i = 0; i < dados.daily.length; i++) {
        const dia = dados.daily[i];

        // Verifica se é quarto crescente (valor próximo a 0.25)
        if (Math.abs(dia.moon_phase - 0.25) < 0.01) {
            const dataQuartoCrescente = new Date(dia.dt * 1000);
            proximaDataQuartoCrescente = dataQuartoCrescente;
            break;
        }
    }

    if (proximaDataQuartoCrescente) {
        return {
            dias: Math.ceil((proximaDataQuartoCrescente - hoje) / (1000 * 60 * 60 * 24)),
            data: proximaDataQuartoCrescente
        };
    }

    // Se não conseguimos encontrar nos próximos dias, retornamos uma mensagem
    return {
        dias: null,
        mensagem: "Não foi possível encontrar o próximo quarto crescente nos próximos dias para Santos."
    };
}

// Exportação para testes
export const __test__ = {
    converterFaseLunarParaTexto,
    calcularIluminacao
}; 