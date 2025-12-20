/**
 * Utilitários para gerenciamento de cache
 */
import { CONFIG } from '../config.js';

/**
 * Obtém dados do cache se ainda forem válidos
 * @param {string} chave - A chave do cache para recuperar
 * @returns {object|null} Os dados armazenados ou null se expirado/não existir
 */
export function obterCache(chave) {
    const item = localStorage.getItem(chave);
    if (!item) return null;
    
    const dadosCache = JSON.parse(item);
    if (Date.now() - dadosCache.timestamp > CONFIG.CACHE_EXPIRACAO) {
        localStorage.removeItem(chave);
        return null;
    }
    
    return dadosCache.dados;
}

/**
 * Armazena dados em cache com timestamp
 * @param {string} chave - A chave para armazenar os dados
 * @param {object} dados - Os dados a serem armazenados
 */
export function definirCache(chave, dados) {
    const dadosCache = {
        dados: dados,
        timestamp: Date.now()
    };
    localStorage.setItem(chave, JSON.stringify(dadosCache));
}

/**
 * Limpa todos os itens de cache relacionados à aplicação
 * @param {Array<string>} [chaves] - Lista opcional de chaves específicas para limpar
 */
export function limparCache(chaves = ['faseLua', 'dadosChuva', 'dadosMare', 'proximoQuartoCrescente']) {
    chaves.forEach(chave => {
        localStorage.removeItem(chave);
    });
} 