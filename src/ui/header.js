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
 * Substitui o header existente ou adiciona um novo se não existir
 */
export function inicializarHeader() {
    const container = document.querySelector('.container');
    
    if (!container) {
        console.error('Container não encontrado para adicionar o header');
        return;
    }
    
    // Remover header existente se houver
    const headerExistente = container.querySelector('header');
    if (headerExistente) {
        headerExistente.remove();
    }
    
    // Criar o novo header e adicionar como primeiro filho do container
    const header = criarHeader();
    
    // Se já existe algum elemento filho no container, inserir antes do primeiro filho
    // Se não, apenas adicionar no final
    if (container.firstChild) {
        container.insertBefore(header, container.firstChild);
    } else {
        container.appendChild(header);
    }
    
    console.log('Header inicializado com sucesso');
} 