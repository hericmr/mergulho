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
    
    // Quarto Crescente é a melhor fase para mergulho (mais visibilidade sem excesso de luminosidade)
    if (faseNormalizada.includes('quarto crescente') || 
        faseNormalizada.includes('first quarter')) {
        return { 
            favoravel: true, 
            pontuacao: 3, 
            motivo: 'Quarto crescente é ideal para mergulho com boa visibilidade em Santos!!!' 
        };
    }
    
    // Fases próximas ao quarto crescente - boas para mergulho
    if (faseNormalizada.includes('crescente') && !faseNormalizada.includes('gibosa')) {
        return { 
            favoravel: true, 
            pontuacao: 2, 
            motivo: 'Fase crescente próxima ao quarto crescente - condições favoráveis' 
        };
    }
    
    // Lua cheia - boa iluminação mas pode afetar comportamento marinho
    if (faseNormalizada.includes('lua cheia') || 
        faseNormalizada.includes('full moon')) {
        return { 
            favoravel: false, 
            pontuacao: 1, 
            motivo: 'Só é boa se as demais condições estiverem favoráveis' 
        };
    }
    
    // Lua nova - baixa visibilidade
    if (faseNormalizada.includes('lua nova') || 
        faseNormalizada.includes('new moon')) {
        return { 
            favoravel: false, 
            pontuacao: 0, 
            motivo: 'Lua nova ocorre antes da crescente... normalmente não é boa, mas talvez a agua ainda esteja melhorando para mergulho' 
        };
    }
    
    // Fases minguantes - não ideais para mergulho
    if (faseNormalizada.includes('minguante') || 
        faseNormalizada.includes('last quarter') || 
        faseNormalizada.includes('waning')) {
        return { 
            favoravel: false, 
            pontuacao: 0,
            motivo: 'Fases minguante, pouco favorável para mergulho' 
        };
    }
    
    // Caso padrão
    return { 
        favoravel: false, 
        pontuacao: 0,
        motivo: 'Fase lunar não ideal para condições de mergulho em Santos' 
    };
}

/**
 * Busca e analisa a fase lunar atual usando a API do U.S. Naval Observatory (USNO)
 * Mais confiável para cálculos astronômicos
 * @returns {Promise<object>} Dados da fase lunar com avaliação
 */
export async function checarFaseDaLua() {
    const chaveCache = 'faseLua';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        return dadosCache;
    }
    
    try {
        // Data atual em formato YYYY-MM-DD para a API USNO
        const hoje = new Date();
        const dataFormatada = `${hoje.getFullYear()}-${hoje.getMonth() + 1}-${hoje.getDate()}`;
        
        // Usar a API do U.S. Naval Observatory (USNO) - altamente confiável para cálculos astronômicos
        // Primeiro, tentamos obter os dados através do endpoint de frações iluminadas
        const url = `https://aa.usno.navy.mil/api/moon/phases/date?date=${dataFormatada}&nump=4`;
        
        const resposta = await fetch(url);
        if (!resposta.ok) {
            throw new Error(`Erro na API de fase lunar: ${resposta.status} - ${resposta.statusText}`);
        }
        
        const dados = await resposta.json();
        
        if (!dados || !dados.phasedata || dados.phasedata.length === 0) {
            throw new Error('Dados inválidos da API de fase lunar: formato de resposta inesperado');
        }
        
        // Determinar a fase atual encontrando a fase mais próxima (antes ou depois)
        const fasesProximas = dados.phasedata.sort((a, b) => {
            const dataA = new Date(`${a.year}-${a.month}-${a.day}T${a.time}Z`);
            const dataB = new Date(`${b.year}-${b.month}-${b.day}T${b.time}Z`);
            return Math.abs(dataA - hoje) - Math.abs(dataB - hoje);
        });
        
        const faseMaisProxima = fasesProximas[0];
        const dataFase = new Date(`${faseMaisProxima.year}-${faseMaisProxima.month}-${faseMaisProxima.day}T${faseMaisProxima.time}Z`);
        
        // Calcular a diferença em dias para determinar a fase intermediária
        const difDias = Math.abs(Math.round((hoje - dataFase) / (1000 * 60 * 60 * 24)));
        const direcao = hoje > dataFase ? 'após' : 'antes';
        
        let faseAtual = faseMaisProxima.phase;
        let iluminacao = 0;
        
        // Determinar fase intermediária e iluminação aproximada
        if (difDias >= 1) {
            // Estamos em uma fase intermediária
            const proximaFase = fasesProximas[1]?.phase || faseMaisProxima.phase;
            
            if (faseAtual === 'New Moon' && direcao === 'após') {
                faseAtual = 'Waxing Crescent';
                iluminacao = Math.min(difDias * 7, 49); // Aproximadamente 7% por dia
            } else if (faseAtual === 'First Quarter' && direcao === 'após') {
                faseAtual = 'Waxing Gibbous';
                iluminacao = 50 + Math.min(difDias * 7, 49);
            } else if (faseAtual === 'Full Moon' && direcao === 'após') {
                faseAtual = 'Waning Gibbous';
                iluminacao = 100 - Math.min(difDias * 7, 49);
            } else if (faseAtual === 'Last Quarter' && direcao === 'após') {
                faseAtual = 'Waning Crescent';
                iluminacao = 50 - Math.min(difDias * 7, 49);
            } else if (faseAtual === 'New Moon' && direcao === 'antes') {
                faseAtual = 'Waning Crescent';
                iluminacao = Math.min(difDias * 7, 49);
            } else if (faseAtual === 'First Quarter' && direcao === 'antes') {
                faseAtual = 'Waxing Crescent';
                iluminacao = 50 - Math.min(difDias * 7, 49);
            } else if (faseAtual === 'Full Moon' && direcao === 'antes') {
                faseAtual = 'Waxing Gibbous';
                iluminacao = 100 - Math.min(difDias * 7, 49);
            } else if (faseAtual === 'Last Quarter' && direcao === 'antes') {
                faseAtual = 'Waning Gibbous';
                iluminacao = 50 + Math.min(difDias * 7, 49);
            }
        } else {
            // Estamos exatamente na fase principal
            if (faseAtual === 'New Moon') iluminacao = 0;
            else if (faseAtual === 'First Quarter') iluminacao = 50;
            else if (faseAtual === 'Full Moon') iluminacao = 100;
            else if (faseAtual === 'Last Quarter') iluminacao = 50;
        }
        
        // Traduzir fase para português
        const fasePtBr = TRADUCAO_FASES[faseAtual] || faseAtual;
        
        const resultado = {
            texto: fasePtBr,
            quartoCrescente: faseAtual === 'First Quarter',
            iluminacao: iluminacao,
            favoravelParaMergulho: avaliarFaseParaMergulho(fasePtBr, iluminacao)
        };
        
        definirCache(chaveCache, resultado, CONFIG.CACHE_EXPIRACAO);
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar fase da lua:', erro);
        
        // Fallback para o método alternativo usando OpenWeatherMap
        try {
            return await checarFaseDaLuaFallback();
        } catch (erroFallback) {
            return {
                texto: 'Não foi possível determinar',
                quartoCrescente: false,
                iluminacao: 0,
                favoravelParaMergulho: { 
                    favoravel: false, 
                    pontuacao: 0, 
                    motivo: 'Informação não disponível para Santos' 
                },
                erro: `${erro.message}. Fallback também falhou: ${erroFallback.message}`,
                erroCompleto: `Erro no módulo de fase lunar: ${erro.message}`
            };
        }
    }
}

/**
 * Método alternativo para obter fase lunar usando OpenWeatherMap
 * Usado como fallback se o USNO falhar
 * @returns {Promise<object>} Dados da fase lunar
 */
async function checarFaseDaLuaFallback() {
    // Usar a API OneCall 3.0 do OpenWeatherMap para obter dados da lua
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${COORDENADAS_SANTOS.LATITUDE}&lon=${COORDENADAS_SANTOS.LONGITUDE}&exclude=minutely,hourly,alerts&appid=${CONFIG.OPENWEATHER_KEY}&units=metric`;
    
    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error(`Erro na API de fase lunar fallback: ${resposta.status} - ${resposta.statusText}`);
    }
    
    const dados = await resposta.json();
    
    if (!dados || !dados.daily || dados.daily.length === 0 || dados.daily[0].moon_phase === undefined) {
        throw new Error('Dados inválidos da API de fase lunar fallback: formato de resposta inesperado');
    }
    
    // Obtém a fase lunar do dia atual (primeiro dia do array daily)
    const faseLuaNumero = dados.daily[0].moon_phase;
    const faseLuaTexto = converterFaseLunarParaTexto(faseLuaNumero);
    const iluminacao = calcularIluminacao(faseLuaNumero);
    
    return {
        texto: faseLuaTexto,
        quartoCrescente: faseLuaTexto.toLowerCase().includes('quarto crescente'),
        iluminacao: iluminacao,
        favoravelParaMergulho: avaliarFaseParaMergulho(faseLuaTexto, iluminacao)
    };
}

/**
 * Calcula dias até o próximo quarto crescente 
 * @returns {Promise<object>} Informações sobre o próximo quarto crescente
 */
export async function diasParaProximoQuartoCrescente() {
    const chaveCache = 'proximoQuartoCrescente';
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
        // Usar a API do U.S. Naval Observatory para obter as próximas fases da lua
        const hoje = new Date();
        const dataFormatada = `${hoje.getFullYear()}-${hoje.getMonth() + 1}-${hoje.getDate()}`;
        
        // Solicitar as próximas 8 fases da lua (cobrindo aproximadamente 2 meses)
        const url = `https://aa.usno.navy.mil/api/moon/phases/date?date=${dataFormatada}&nump=8`;
        
        const resposta = await fetch(url);
        if (!resposta.ok) {
            throw new Error(`Erro na API de fases lunares: ${resposta.status} - ${resposta.statusText}`);
        }
        
        const dados = await resposta.json();
        
        if (!dados || !dados.phasedata || dados.phasedata.length === 0) {
            throw new Error('Dados inválidos da API de fases lunares');
        }
        
        // Encontrar o próximo quarto crescente
        const proximoQuartoCrescente = dados.phasedata.find(fase => 
            fase.phase === 'First Quarter' && 
            new Date(`${fase.year}-${fase.month}-${fase.day}T${fase.time}Z`) > hoje
        );
        
        if (proximoQuartoCrescente) {
            const dataQuartoCrescente = new Date(`${proximoQuartoCrescente.year}-${proximoQuartoCrescente.month}-${proximoQuartoCrescente.day}T${proximoQuartoCrescente.time}Z`);
            
            const resultado = {
                dias: Math.ceil((dataQuartoCrescente - hoje) / (1000 * 60 * 60 * 24)),
                data: dataQuartoCrescente
            };
            
            definirCache(chaveCache, { data: dataQuartoCrescente }, 24 * 60 * 60 * 1000); // Cache de 24h
            return resultado;
        }
        
        // Fallback para o método alternativo
        return await diasParaProximoQuartoCrescenteFallback();
    } catch (erro) {
        console.error('Erro ao calcular próximo quarto crescente:', erro);
        
        // Fallback para o método alternativo
        try {
            return await diasParaProximoQuartoCrescenteFallback();
        } catch (erroFallback) {
            return {
                dias: null,
                mensagem: "Não foi possível determinar o próximo quarto crescente para Santos",
                erro: `${erro.message}. Fallback também falhou: ${erroFallback.message}`
            };
        }
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