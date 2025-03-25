/**
 * Componente de footer para a aplicação Mestre dos Mares
 */

/**
 * Cria e retorna o elemento footer com o conteúdo padrão
 * @returns {HTMLElement} Elemento footer pronto para inserção no DOM
 */
export function criarFooter() {
    const footer = document.createElement('footer');
    
    // Container para organizar o conteúdo
    const footerContainer = document.createElement('div');
    footerContainer.className = 'footer-content';
    
    // Seção de APIs
    const apiBadges = document.createElement('div');
    apiBadges.className = 'api-badges';
    
    const stormGlassBadge = document.createElement('span');
    stormGlassBadge.className = 'api-badge';
    stormGlassBadge.textContent = 'StormGlass API';
    
    const openWeatherBadge = document.createElement('span');
    openWeatherBadge.className = 'api-badge';
    openWeatherBadge.textContent = 'OpenWeatherMap API';
    
    apiBadges.appendChild(stormGlassBadge);
    apiBadges.appendChild(openWeatherBadge);
    
    // Seção de texto
    const footerText = document.createElement('div');
    footerText.className = 'footer-text';
    
    const copyright = document.createElement('p');
    copyright.textContent = 'Mestre dos Mares © 2024';
    
    const credito = document.createElement('p');
    credito.className = 'text-sm';
    credito.innerHTML = 'Desenvolvido pelo pirata <a href="https://hericmr.github.io/me" target="_blank" class="text-blue-500 underline">Héric Moura</a>';
    
    footerText.appendChild(copyright);
    footerText.appendChild(credito);
    
    // Adicionar todas as seções ao footer
    footerContainer.appendChild(apiBadges);
    footerContainer.appendChild(footerText);
    footer.appendChild(footerContainer);
    
    return footer;
}

/**
 * Inicializa o footer na página
 * Não faz nada, pois o footer está no HTML
 */
export function inicializarFooter() {
    console.log('Footer já está presente no HTML');
} 