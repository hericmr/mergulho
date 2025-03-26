/**
 * Módulo para análise do vento e seu impacto no mergulho
 */
import { CONFIG } from '../config.js';
import { buscarDadosAPI } from '../api/cliente.js';
import { obterCache, definirCache } from '../utils/cache.js';

/**
 * Avalia o impacto do vento nas condições de mergulho
 * @param {number} velocidadeVento - Velocidade do vento em m/s
 * @param {string} direcaoVento - Direção do vento
 * @returns {object} Avaliação do impacto do vento
 */
export function avaliarImpactoVento(velocidadeVento, direcaoVento) {
    // Conversão para km/h para facilitar interpretação
    const ventoKmh = velocidadeVento * 3.6;
    
    // Avaliação da intensidade do vento
    let intensidade;
    let pontuacao;
    let descricao;
    
    if (ventoKmh < 10) {
        intensidade = 'Fraco';
        pontuacao = 3;
        descricao = 'Vento fraco, condições excelentes para mergulho';
    } else if (ventoKmh < 20) {
        intensidade = 'Moderado';
        pontuacao = 2;
        descricao = 'Vento moderado, pode causar ondulação leve na superfície';
    } else if (ventoKmh < 30) {
        intensidade = 'Forte';
        pontuacao = 1; 
        descricao = 'Vento forte, possibilidade de ondas e correntes superficiais';
    } else {
        intensidade = 'Muito Forte';
        pontuacao = 0;
        descricao = 'Vento muito forte, condições desfavoráveis para mergulho';
    }
    
    // Avaliação geral
    const favoravel = ventoKmh < 25;
    
    return {
        intensidade,
        velocidadeKmh: ventoKmh.toFixed(1),
        direcao: direcaoVento,
        favoravel,
        pontuacao,
        descricao
    };
}

/**
 * Consulta e analisa dados de vento atual
 * @returns {Promise<object>} Dados de vento com análise de impacto
 */
export async function checarVento() {
    const chaveCache = 'dadosVento';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        return dadosCache;
    }
    
    try {
        // Usar OpenWeatherMap API em vez de StormGlass
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${CONFIG.LATITUDE}&lon=${CONFIG.LONGITUDE}&appid=${CONFIG.OPENWEATHER_KEY}&units=metric`;
        
        const resposta = await fetch(url);
        if (!resposta.ok) {
            throw new Error(`Erro na API de vento: ${resposta.status} - ${resposta.statusText}`);
        }
        
        const dados = await resposta.json();
        
        if (!dados || !dados.wind) {
            throw new Error('Dados inválidos da API de vento: formato de resposta inesperado');
        }
        
        // Extrair dados de vento do OpenWeatherMap
        const velocidadeVento = dados.wind.speed; // Velocidade em m/s
        const direcaoVento = dados.wind.deg; // Direção em graus
            
        // Converter direção numérica para cardinal
        const direcaoCardinal = converterDirecaoParaCardinal(direcaoVento);
        
        const resultado = {
            velocidade: velocidadeVento,
            direcao: direcaoVento,
            direcaoCardinal: direcaoCardinal,
            timestamp: Date.now(),
            avaliacao: avaliarImpactoVento(velocidadeVento, direcaoCardinal)
        };
        
        definirCache(chaveCache, resultado, 60 * 60 * 1000); // Cache de 1 hora
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar dados de vento:', erro);
        return {
            velocidade: 0,
            direcao: 0,
            direcaoCardinal: 'N/D',
            avaliacao: avaliarImpactoVento(0, 'N/D'),
            erro: erro.message,
            erroCompleto: `Erro no módulo de vento: ${erro.message}`
        };
    }
}

/**
 * Converte ângulo de direção do vento para direção cardinal
 * @param {number} angulo - Ângulo da direção do vento em graus
 * @returns {string} Direção cardinal do vento
 */
function converterDirecaoParaCardinal(angulo) {
    const direcoes = [
        'N', 'NNE', 'NE', 'ENE', 
        'E', 'ESE', 'SE', 'SSE', 
        'S', 'SSW', 'SW', 'WSW', 
        'W', 'WNW', 'NW', 'NNW'
    ];
    
    // Normalizar o ângulo e calcular o índice
    const indice = Math.round(((angulo % 360) / 22.5)) % 16;
    return direcoes[indice];
} 