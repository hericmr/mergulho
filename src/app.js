/**
 * Aplicativo principal para verificação de condições de mergulho
 */
import { avaliarCondicoesGerais } from './modules/avaliacao.js';
import { limparCache } from './utils/cache.js';
import { exibirResultado, exibirCarregamento, exibirErro } from './ui/interface.js';
import { inicializarUI, configurarEventos } from './ui/init.js';
import { resetarControleChaves } from './api/cliente.js';

console.log('App.js carregado');

/**
 * Função principal para verificar todas as condições de mergulho
 */
async function verificarCondicoes() {
    console.log('Iniciando verificação de condições');
    const statusDiv = document.getElementById('status');
    if (statusDiv) statusDiv.textContent = 'Verificando condições de mergulho...';
    
    try {
        // Exibir indicador de carregamento
        exibirCarregamento();
        
        // Avalia todas as condições (incluindo vento)
        const resultadoAvaliacao = await avaliarCondicoesGerais();
        console.log('Avaliação concluída:', resultadoAvaliacao);
        
        // Verificar se há erros nos módulos
        const erros = [];
        
        // Checar erros nos diferentes módulos
        if (resultadoAvaliacao.fatoresAnalisados.faseLua.erro) {
            erros.push(`Erro na fase lunar: ${resultadoAvaliacao.fatoresAnalisados.faseLua.erro}`);
        }
        
        if (resultadoAvaliacao.fatoresAnalisados.vento.erro) {
            erros.push(`Erro nos dados de vento: ${resultadoAvaliacao.fatoresAnalisados.vento.erro}`);
        }
        
        if (resultadoAvaliacao.fatoresAnalisados.precipitacao.erro) {
            erros.push(`Erro nos dados de precipitação: ${resultadoAvaliacao.fatoresAnalisados.precipitacao.erro}`);
        }
        
        if (resultadoAvaliacao.fatoresAnalisados.mare.erro) {
            erros.push(`Erro nos dados de maré: ${resultadoAvaliacao.fatoresAnalisados.mare.erro}`);
        }
        
        if (resultadoAvaliacao.fatoresAnalisados.estacao.erro) {
            erros.push(`Erro nos dados de estação: ${resultadoAvaliacao.fatoresAnalisados.estacao.erro}`);
        }
        
        // Se houver erros, exibir alerta
        if (erros.length > 0) {
            // Adicionar os erros ao resultado para exibição
            resultadoAvaliacao.errosAPI = erros;
            console.warn('Alertas de API detectados:', erros);
        }
        
        // Atualizar interface com o resultado
        exibirResultado(resultadoAvaliacao);
        
        if (statusDiv) statusDiv.textContent = 'Condições de mergulho verificadas!';
        
    } catch (erro) {
        console.error('Erro ao verificar condições:', erro);
        if (statusDiv) statusDiv.textContent = 'Erro ao verificar as condições. Tente novamente mais tarde.';
        
        // Verificar se é um erro específico de API
        const mensagemErro = erro.message || 'Erro ao processar dados de mergulho';
        const mensagemDetalhada = erro.erroCompleto || mensagemErro;
        
        exibirErro(mensagemDetalhada);
    }
}

/**
 * Inicializa a aplicação
 */
function inicializarApp() {
    console.log('Inicializando aplicação...');
    
    // Resetar o controle de chaves da API
    resetarControleChaves();
    
    // Inicializar a interface do usuário
    inicializarUI();
    
    // Configurar eventos adicionais
    configurarEventos();
    
    console.log('Aplicação inicializada com sucesso');
    
    // Adicionar handler para o botão
    const botao = document.getElementById('verificarBtn');
    if (botao) {
        botao.addEventListener('click', verificarCondicoes);
    } else {
        console.error('Botão de verificação não encontrado');
    }
}

// Disponibilizar a função de verificação globalmente
window.iniciarVerificacao = verificarCondicoes;

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando app...');
    inicializarApp();
}); 