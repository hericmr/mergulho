/**
 * Componente de header para a aplicação Mestre dos Mares
 */

/**
 * Cria e retorna o elemento header com o conteúdo padrão
 * @returns {HTMLElement} Elemento header pronto para inserção no DOM
 */
export function criarHeader() {
    const header = document.createElement('header');
    
    const titulo = document.createElement('h1');
    titulo.textContent = 'Mestre dos Mares - Santos/SP';
    
    const subtitulo = document.createElement('p');
    subtitulo.textContent = 'Verifique condições de mergulho atuais em Santos';
    
    header.appendChild(titulo);
    header.appendChild(subtitulo);
    
    return header;
}

/**
 * Inicializa o header na página
 * Não faz nada, pois o header está no HTML
 */
export function inicializarHeader() {
    console.log('Header já está presente no HTML');
} 