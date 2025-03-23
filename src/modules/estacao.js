/**
 * Módulo para cálculos relacionados às estações do ano
 */
import { LOCALIZACAO } from '../config.js';

/**
 * Verifica se é verão na localização atual
 * @returns {boolean} Verdadeiro se for verão no momento
 */
export function ehVerao() {
    const mesAtual = new Date().getMonth() + 1; // getMonth() retorna 0-11
    
    if (LOCALIZACAO.HEMISFERIO_SUL) {
        return [12, 1, 2, 3].includes(mesAtual); // Verão no hemisfério sul: dez-mar
    } else {
        return [6, 7, 8, 9].includes(mesAtual); // Verão no hemisfério norte: jun-set
    }
}

/**
 * Calcula quantos dias faltam para o início do verão
 * @returns {number} Dias até o verão (0 se já for verão)
 */
export function diasParaVerao() {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    let inicioVerao;
    
    if (LOCALIZACAO.HEMISFERIO_SUL) {
        inicioVerao = new Date(hoje.getMonth() >= 11 ? anoAtual : anoAtual - 1, 11, 21);
        const fimVerao = new Date(anoAtual, 2, 21); // 21 de março
        
        if (hoje >= inicioVerao && hoje <= fimVerao) {
            return 0; // Já estamos no verão
        }
        
        // Se já passamos do verão, o próximo é no final do ano
        if (hoje > fimVerao) {
            inicioVerao = new Date(anoAtual, 11, 21);
        }
    } else {
        inicioVerao = new Date(anoAtual, 5, 21); // 21 de junho
        const fimVerao = new Date(anoAtual, 8, 23); // 23 de setembro
        
        if (hoje >= inicioVerao && hoje <= fimVerao) {
            return 0; // Já estamos no verão
        }
        
        // Se já passamos do verão, o próximo é no próximo ano
        if (hoje > fimVerao) {
            inicioVerao = new Date(anoAtual + 1, 5, 21);
        }
    }
    
    const diferencaDias = Math.ceil((inicioVerao - hoje) / (1000 * 60 * 60 * 24));
    return diferencaDias;
}

/**
 * Verifica a estação do ano atual e sua adequação para mergulho
 * @returns {Object} Informações sobre a estação atual
 */
export function checarEstacao() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1; // getMonth() retorna 0-11
    let nome, adequadaParaMergulho;
    
    if (LOCALIZACAO.HEMISFERIO_SUL) {
        // Estações no hemisfério sul
        if ([12, 1, 2].includes(mesAtual)) {
            nome = "Verão";
            adequadaParaMergulho = {
                favoravel: true,
                pontuacao: 4,
                motivo: "Verão é a estação ideal para mergulho, com águas mais quentes e maior visibilidade."
            };
        } else if ([3, 4, 5].includes(mesAtual)) {
            nome = "Outono";
            adequadaParaMergulho = {
                favoravel: false,
                pontuacao: 2,
                motivo: "Outono ainda oferece condições favoráveis em muitos locais, com menos cururu, mas bom mesmo é no verão."
            };
        } else if ([6, 7, 8].includes(mesAtual)) {
            nome = "Inverno";
            adequadaParaMergulho = {
                favoravel: false,
                pontuacao: 1,
                motivo: "Temperaturas mais baixas podem exigir equipamento adicional para conforto."
            };
        } else {
            nome = "Primavera";
            adequadaParaMergulho = {
                favoravel: true,
                pontuacao: 1,
                motivo: "Primavera eu naoa sei se a agua é boa, vou dar nota baixa."
            };
        }
    } else {
        // Estações no hemisfério norte
        if ([12, 1, 2].includes(mesAtual)) {
            nome = "Inverno";
            adequadaParaMergulho = {
                favoravel: false,
                pontuacao: 0,
                motivo: "Temperaturas mais baixas podem exigir equipamento adicional para conforto."
            };
        } else if ([3, 4, 5].includes(mesAtual)) {
            nome = "Primavera";
            adequadaParaMergulho = {
                favoravel: true,
                pontuacao: 1,
                motivo: "Primavera traz melhores condições, mas a água ainda pode estar se aquecendo."
            };
        } else if ([6, 7, 8].includes(mesAtual)) {
            nome = "Verão";
            adequadaParaMergulho = {
                favoravel: true,
                pontuacao: 3,
                motivo: "Verão é a estação ideal para mergulho, com águas mais quentes e maior visibilidade."
            };
        } else {
            nome = "Outono";
            adequadaParaMergulho = {
                favoravel: false,
                pontuacao: 1,
                motivo: "Outono ainda oferece condições favoráveis em muitos locais, com menos turistas."
            };
        }
    }
    
    return {
        nome,
        adequadaParaMergulho,
        diasParaVerao: ehVerao() ? 0 : diasParaVerao()
    };
} 