/**
 * Componente de controles para a aplicação Mestre dos Mares
 */

/**
 * Cria e retorna o elemento de controles com o botão e status
 * @returns {HTMLElement} Elemento div com os controles
 */
export function criarControles() {
    const controles = document.createElement('div');
    controles.className = 'controles';
    
    // Botão principal
    const botao = document.createElement('button');
    botao.id = 'verificarBtn';
    botao.className = 'btn-principal';
    botao.textContent = 'Verificar Condições';
    
    // Adicionar os atributos onclick para compatibilidade com código existente
    botao.setAttribute('onclick', "if (window.iniciarVerificacao) window.iniciarVerificacao(); console.log('Botão principal clicado via HTML');");
    
    // Status
    const status = document.createElement('p');
    status.id = 'status';
    status.className = 'status';
    status.textContent = 'Pronto para análise em Santos...';
    
    // Adicionar elementos ao container
    controles.appendChild(botao);
    controles.appendChild(status);
    
    return controles;
}

/**
 * Inicializa os controles na página
 * Substitui os controles existentes ou adiciona novos se não existirem
 */
export function inicializarControles() {
    const container = document.querySelector('.container');
    
    if (!container) {
        console.error('Container não encontrado para adicionar os controles');
        return;
    }
    
    // Remover controles existentes se houver
    const controlesExistente = container.querySelector('.controles');
    if (controlesExistente) {
        controlesExistente.remove();
    }
    
    // Encontrar o elemento header para inserir após ele
    const header = container.querySelector('header');
    
    // Criar os novos controles
    const controles = criarControles();
    
    // Inserir após o header se ele existir, senão como primeiro elemento
    if (header && header.nextSibling) {
        container.insertBefore(controles, header.nextSibling);
    } else if (header) {
        container.appendChild(controles);
    } else {
        // Se não houver header, inserir no início
        if (container.firstChild) {
            container.insertBefore(controles, container.firstChild);
        } else {
            container.appendChild(controles);
        }
    }
    
    console.log('Controles inicializados com sucesso');
} 