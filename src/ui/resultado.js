/**
 * Componente para a área de resultados da aplicação Mestre dos Mares
 */

/**
 * Cria e retorna o elemento para exibição dos resultados
 * @returns {HTMLElement} Elemento div para os resultados
 */
export function criarAreaResultado() {
    const resultado = document.createElement('div');
    resultado.id = 'resultado-mergulho';
    resultado.style.display = 'none';
    
    return resultado;
}

/**
 * Inicializa a área de resultados na página
 * Substitui a área existente ou adiciona uma nova se não existir
 */
export function inicializarAreaResultado() {
    const container = document.querySelector('.container');
    
    if (!container) {
        console.error('Container não encontrado para adicionar a área de resultados');
        return;
    }
    
    // Remover área de resultados existente se houver
    const resultadoExistente = document.getElementById('resultado-mergulho');
    if (resultadoExistente) {
        resultadoExistente.remove();
    }
    
    // Encontrar os controles para inserir após eles
    const controles = container.querySelector('.controles');
    
    // Criar a nova área de resultados
    const resultado = criarAreaResultado();
    
    // Inserir após os controles se eles existirem, senão como último elemento antes do footer
    if (controles && controles.nextSibling) {
        container.insertBefore(resultado, controles.nextSibling);
    } else if (controles) {
        container.appendChild(resultado);
    } else {
        // Se não houver controles, inserir antes do footer
        const footer = container.querySelector('footer');
        if (footer) {
            container.insertBefore(resultado, footer);
        } else {
            container.appendChild(resultado);
        }
    }
    
    console.log('Área de resultados inicializada com sucesso');
} 