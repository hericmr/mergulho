/**
 * Módulo de inicialização da interface de usuário
 */
import { inicializarHeader } from './header.js';
import { inicializarControles } from './controles.js';
import { inicializarAreaResultado } from './resultado.js';
import { inicializarFooter } from './footer.js';

/**
 * Inicializa todos os componentes da interface em ordem
 */
export function inicializarUI() {
    console.log('Inicializando componentes da interface...');
    
    // Inicializar componentes na ordem correta
    inicializarHeader();
    inicializarControles();
    inicializarAreaResultado();
    inicializarFooter();
    
    // Adicionar listener para erros globais
    window.addEventListener('error', function(event) {
        console.error('Erro global capturado:', event.error);
    });

    console.log('Interface inicializada com sucesso');
}

/**
 * Função para configurar eventos do botão principal após carregamento do DOM
 */
export function configurarEventos() {
    console.log('Configurando eventos...');
    
    // Teste direto do botão
    const botao = document.getElementById('verificarBtn');
    console.log('Botão encontrado:', botao);
    
    if (botao) {
        botao.addEventListener('click', function() {
            console.log('Botão clicado via evento inline');
            // Forçar exibição do elemento de resultado
            const resultado = document.getElementById('resultado-mergulho');
            if (resultado) {
                resultado.style.display = 'block';
                resultado.innerHTML = '<div class="carregando"><div class="spinner"></div><p>Verificando via script de depuração...</p></div>';
            }
        });
    }
} 