/**
 * Cliente de API com retry, rotação de chaves e tratamento de erros
 */
import { CONFIG } from '../config.js';

// Controle de chaves já utilizadas e esgotadas no ciclo atual
let chaveAtualIndex = 0;
let chavesEsgotadas = new Set();

/**
 * Reinicia o controle de chaves esgotadas
 * Usado após um determinado período sem chamadas à API
 */
export function resetarControleChaves() {
    chaveAtualIndex = 0;
    chavesEsgotadas = new Set();
}

/**
 * Obtém a próxima chave API disponível
 * @returns {string|null} Próxima chave disponível ou null se todas estiverem esgotadas
 */
function obterProximaChaveAPI() {
    const totalChaves = CONFIG.API_KEYS.length;
    
    // Se todas as chaves foram esgotadas
    if (chavesEsgotadas.size >= totalChaves) {
        console.warn('Todas as chaves API foram esgotadas. Tente novamente mais tarde.');
        return null;
    }
    
    // Encontrar a próxima chave não esgotada
    let tentativas = 0;
    while (tentativas < totalChaves) {
        const chaveIndex = (chaveAtualIndex + tentativas) % totalChaves;
        const chave = CONFIG.API_KEYS[chaveIndex];
        
        if (!chavesEsgotadas.has(chave)) {
            chaveAtualIndex = chaveIndex;
            return chave;
        }
        
        tentativas++;
    }
    
    return null; // Não deveria chegar aqui, mas por segurança
}

/**
 * Marca uma chave como esgotada para este ciclo
 * @param {string} chave - Chave API que atingiu seu limite
 */
function marcarChaveComoEsgotada(chave) {
    chavesEsgotadas.add(chave);
    console.warn(`Chave API ${chave.substring(0, 8)}... esgotada. ${CONFIG.API_KEYS.length - chavesEsgotadas.size} chaves restantes.`);
}

/**
 * Busca dados da API com rotação de chaves e retry automático
 * @param {string} url - URL da API a ser chamada
 * @param {number} tentativas - Número máximo de tentativas por chave (default: 3)
 * @returns {Promise<object>} - Dados retornados pela API
 * @throws {Error} - Erro após todas as chaves e tentativas falharem
 */
export async function buscarDadosAPI(url, tentativas = 3) {
    let ultimoErro;
    let chaveAtual = CONFIG.API_KEY; // Começa com a chave padrão
    
    // Tentar usando a rotação de chaves
    while (true) {
        // Registrar qual chave está sendo usada (apenas para logs, forma truncada)
        console.log(`Tentando requisição com chave: ${chaveAtual.substring(0, 8)}...`);
        
        // Tentar várias vezes com a mesma chave
        for (let tentativaAtual = 0; tentativaAtual < tentativas; tentativaAtual++) {
            try {
                const resposta = await fetch(url, { 
                    headers: { 'Authorization': chaveAtual },
                    timeout: 10000 // 10 segundos de timeout
                });
                
                if (!resposta.ok) {
                    // Limite de API atingido, trocar de chave
                    if (resposta.status === 402 || resposta.status === 429) {
                        marcarChaveComoEsgotada(chaveAtual);
                        break; // Sai do loop de tentativas para trocar de chave
                    } else {
                        throw new Error(`Erro na API: ${resposta.status} - ${resposta.statusText}`);
                    }
                }
                
                // Sucesso: retornar os dados e registrar que esta chave funciona
                console.log(`Requisição bem-sucedida com chave: ${chaveAtual.substring(0, 8)}...`);
                return await resposta.json();
            } catch (erro) {
                ultimoErro = erro;
                
                // Se não for erro de limite de API, tentar novamente após espera
                if (tentativaAtual < tentativas - 1) {
                    // Espera crescente entre tentativas (1s, 2s, 4s)
                    await new Promise(r => setTimeout(r, Math.pow(2, tentativaAtual) * 1000));
                }
            }
        }
        
        // Se chegou aqui, a chave atual falhou em todas as tentativas
        // Tentar a próxima chave
        chaveAtual = obterProximaChaveAPI();
        
        // Se não há mais chaves disponíveis, lançar o último erro
        if (!chaveAtual) {
            throw new Error("Todas as chaves API estão esgotadas. Tente novamente mais tarde.");
        }
    }
} 