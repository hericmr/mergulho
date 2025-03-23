/**
 * Módulo para análise de precipitação e seu impacto no mergulho
 */
import { CONFIG } from '../config.js';
import { buscarDadosAPI } from '../api/cliente.js';
import { obterCache, definirCache } from '../utils/cache.js';

/**
 * Avalia o impacto da chuva na visibilidade para mergulho
 * @param {number} totalPrecipitacao - Total de precipitação em mm
 * @param {number} horasComChuva - Quantidade de horas com ocorrência de chuva
 * @returns {object} Avaliação do impacto na visibilidade
 */
export function avaliarImpactoChuva(totalPrecipitacao, horasComChuva) {
    if (totalPrecipitacao > 20 || horasComChuva > 72) {
        return { nivel: 'Alto', descricao: 'Chuva recente foi intensa, isso pode ter afetado significativamente a visibilidade' };
    } else if (totalPrecipitacao > 10 || horasComChuva > 12) {
        return { nivel: 'Médio', descricao: 'Visibilidade moderadamente afetada pela chuva que aconteceu recentemente' };
    } else if (totalPrecipitacao > 2.5 || horasComChuva > 5) {
        return { nivel: 'Baixo', descricao: 'Pequeno impacto na visibilidade' };
    } else {
        return { nivel: 'Muito Baixo', descricao: 'Visibilidade praticamente não afetada' };
    }
}

/**
 * Consulta e analisa dados de precipitação recente
 * @returns {Promise<object>} Dados de precipitação com análise de impacto
 */
export async function checarChuva() {
    const chaveCache = 'dadosChuva';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        return dadosCache;
    }
    
    try {
        const start = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60); // 3 dias atrás
        const end = Math.floor(Date.now() / 1000); // Agora
        const url = `https://api.stormglass.io/v2/weather/point?lat=${CONFIG.LATITUDE}&lng=${CONFIG.LONGITUDE}&start=${start}&end=${end}&params=precipitation`;
        
        const dados = await buscarDadosAPI(url);
        
        if (!dados || !dados.hours || dados.hours.length === 0) {
            throw new Error('Dados inválidos da API de precipitação');
        }
        
        let totalPrecipitacao = 0;
        let horasComChuva = 0;
        
        for (const hora of dados.hours) {
            if (hora.precipitation && hora.precipitation.sg !== undefined) {
                const precipitacao = parseFloat(hora.precipitation.sg);
                if (precipitacao > 0) {
                    totalPrecipitacao += precipitacao;
                    horasComChuva++;
                }
            }
        }
        
        // Considera chuva significativa se houver mais de 2mm no total
        // ou se choveu por mais de 6 horas nos últimos 3 dias
        const choveuSignificativo = totalPrecipitacao > 2 || horasComChuva > 6;
        
        const resultado = {
            choveu: choveuSignificativo,
            totalPrecipitacao: totalPrecipitacao.toFixed(2),
            horasComChuva: horasComChuva,
            detalhes: {
                chuvaForte: totalPrecipitacao > 10,
                chuvaPersistente: horasComChuva > 12,
                impactoVisibilidade: avaliarImpactoChuva(totalPrecipitacao, horasComChuva)
            }
        };
        
        definirCache(chaveCache, resultado);
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar dados de chuva:', erro);
        return {
            choveu: false,
            totalPrecipitacao: 0,
            horasComChuva: 0,
            erro: erro.message
        };
    }
} 