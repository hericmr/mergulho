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

    // Conteúdo único e simplificado
    const info = document.createElement('p');
    info.style.textAlign = 'center';
    info.style.fontSize = '0.85rem';
    info.style.color = '#666';
    info.style.lineHeight = '1.6';
    info.innerHTML = `
        Desenvolvido pelo pirata <strong>Héric Moura</strong>. <br>
        Dados de marés e clima: <strong>Marinha do Brasil</strong>, <strong>StormGlass</strong> e <strong>OpenWeatherMap</strong>. <br>
        Fases da Lua: <strong>IAG/USP</strong>.
    `;

    footerContainer.appendChild(info);
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