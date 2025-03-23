/**
 * Componente de footer para a aplicação Mestre dos Mares
 */

/**
 * Cria e retorna o elemento footer com o conteúdo padrão
 * @returns {HTMLElement} Elemento footer pronto para inserção no DOM
 */
export function criarFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer-fixed';
    
    // Container para organizar o conteúdo
    const footerContainer = document.createElement('div');
    footerContainer.className = 'footer-content';
    
    // Seção principal com copyright e APIs
    const mainSection = document.createElement('div');
    
    const copyright = document.createElement('p');
    copyright.innerHTML = '<strong>Mestre dos Mares</strong> © 2025';
    
    const apisInfo = document.createElement('p');
    apisInfo.innerHTML = 'Dados fornecidos por <span class="api-badge">StormGlass API</span> e <span class="api-badge">OpenWeatherMap API</span>';
    
    mainSection.appendChild(copyright);
    mainSection.appendChild(apisInfo);
    
    // Seção de créditos
    const creditSection = document.createElement('div');
    
    const credito = document.createElement('p');
    credito.className = 'text-sm';
    credito.innerHTML = 'Desenvolvido pelo pirata <strong>Héric Moura</strong>';
    
    creditSection.appendChild(credito);
    
    // Adicionar todas as seções ao footer
    footerContainer.appendChild(mainSection);
    footerContainer.appendChild(creditSection);
    footer.appendChild(footerContainer);
    
    return footer;
}

/**
 * Inicializa o footer na página
 * Substitui o footer existente ou adiciona um novo se não existir
 */
export function inicializarFooter() {
    const container = document.querySelector('.container');
    
    if (!container) {
        console.error('Container não encontrado para adicionar o footer');
        return;
    }
    
    // Remover footer existente se houver
    const footerExistente = container.querySelector('footer');
    if (footerExistente) {
        footerExistente.remove();
    }
    
    // Adicionar novo footer
    container.appendChild(criarFooter());
    
    console.log('Footer inicializado com sucesso');
} 