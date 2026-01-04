/**
 * Módulo para avaliação geral das condições de mergulho
 */
import { checarFaseDaLua } from './faseLua.js';
import { checarEstacao } from './estacao.js';
import { checarChuva } from './precipitacao.js';
import { checarMare } from './mares.js';
import { checarVento } from './vento.js';

/**
 * Avalia as condições gerais para mergulho considerando diversos fatores
 * @returns {Promise<object>} Avaliação geral das condições
 */
export async function avaliarCondicoesGerais() {
    // Coleta de dados
    const [faseLua, estacao, precipitacao, mare, vento] = await Promise.all([
        checarFaseDaLua(),
        checarEstacao(),
        checarChuva(),
        checarMare(),
        checarVento()
    ]);

    // Critérios de pontuação (0 a 3, onde 3 é ótimo)
    const pontuacoes = {
        faseLua: faseLua.favoravelParaMergulho?.pontuacao || 0,
        estacao: estacao.adequadaParaMergulho?.pontuacao || 0,
        precipitacao: precipitacao.choveu ? 0 : 3,
        mare: mare.pontuacao,
        vento: vento.avaliacao?.pontuacao || 0
    };

    // Peso de cada fator
    const pesos = {
        faseLua: 0.2,
        estacao: 0.1,
        precipitacao: 0.3,
        mare: 0.2,
        vento: 0.2 // Adicionado peso para o vento
    };

    // Cálculo da pontuação ponderada
    const pontuacaoPonderada =
        (pontuacoes.faseLua * pesos.faseLua) +
        (pontuacoes.estacao * pesos.estacao) +
        (pontuacoes.precipitacao * pesos.precipitacao) +
        (pontuacoes.mare * pesos.mare) +
        (pontuacoes.vento * pesos.vento);

    // Normalização para escala 0-100
    const pontuacaoFinal = Math.round((pontuacaoPonderada / 3) * 100);

    // Classificação das condições
    let classificacao;
    if (pontuacaoFinal >= 85) {
        classificacao = 'Excelente';
    } else if (pontuacaoFinal >= 70) {
        classificacao = 'Bom';
    } else if (pontuacaoFinal >= 50) {
        classificacao = 'Regular';
    } else if (pontuacaoFinal >= 30) {
        classificacao = 'Ruim';
    } else {
        classificacao = 'Péssimo';
    }

    // Texto de recomendação
    let recomendacao;
    if (pontuacaoFinal >= 70) {
        recomendacao = 'Condições favoráveis para mergulho. Aproveite!';
    } else if (pontuacaoFinal >= 50) {
        recomendacao = 'Condições aceitáveis, mas fique atento às mudanças.';
    } else {
        recomendacao = 'Não recomendado para mergulho hoje. Considere adiar.';
    }

    // Fatores negativos específicos para o texto
    const fatoresNegativos = [];

    if (pontuacoes.faseLua < 1) fatoresNegativos.push('fase lunar desfavorável');
    if (pontuacoes.estacao < 1) fatoresNegativos.push('estação do ano menos adequada');
    if (pontuacoes.precipitacao < 2) fatoresNegativos.push('chuvas recentes podem afetar visibilidade');
    if (pontuacoes.mare < 1) fatoresNegativos.push('condições de maré não ideais');
    if (pontuacoes.vento < 2) fatoresNegativos.push('vento forte pode gerar ondulação ou turbidez');

    // Resultado detalhado
    return {
        pontuacao: pontuacaoFinal,
        classificacao,
        recomendacao,
        fatoresAnalisados: {
            faseLua: {
                texto: faseLua.texto,
                favoravel: faseLua.favoravelParaMergulho?.favoravel || false,
                pontuacao: pontuacoes.faseLua,
                motivo: faseLua.favoravelParaMergulho?.motivo || 'Não disponível'
            },
            estacao: {
                atual: estacao.nome,
                favoravel: estacao.adequadaParaMergulho?.favoravel || false,
                pontuacao: pontuacoes.estacao,
                motivo: estacao.adequadaParaMergulho?.motivo || 'Não disponível'
            },
            precipitacao: {
                choveu: precipitacao.choveu,
                totalPrecipitacao: precipitacao.totalPrecipitacao,
                impactoVisibilidade: precipitacao.detalhes?.impactoVisibilidade.nivel || 'Não disponível',
                pontuacao: pontuacoes.precipitacao
            },
            mare: {
                estado: mare.estado,
                altura: mare.altura,
                favoravel: mare.favoravel,
                pontuacao: pontuacoes.mare,
                raw: mare // Passa os dados brutos para o gráfico
            },
            vento: {
                intensidade: vento.avaliacao?.intensidade || 'Não disponível',
                velocidade: vento.avaliacao?.velocidadeKmh || '0',
                direcao: vento.direcaoCardinal || 'N/D',
                favoravel: vento.avaliacao?.favoravel || false,
                pontuacao: pontuacoes.vento,
                descricao: vento.avaliacao?.descricao || 'Não disponível'
            }
        },
        fatoresNegativos: fatoresNegativos.length > 0 ? fatoresNegativos : null
    };
} 