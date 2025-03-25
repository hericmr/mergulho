/**
 * Módulo para interação com a interface do usuário
 */

/**
 * Exibe o resultado da avaliação na interface
 * @param {object} resultadoAvaliacao - Resultado completo da avaliação
 */
export function exibirResultado(resultadoAvaliacao) {
    const containerElemento = document.getElementById('resultado-mergulho');
    if (!containerElemento) {
        console.error('Elemento de resultado não encontrado!');
        return;
    }
    
    // Limpar conteúdo anterior
    containerElemento.innerHTML = '';
    
    // Elemento principal de resultado
    const resultadoElemento = document.createElement('div');
    resultadoElemento.className = `resultado-card ${obterClasseCSS(resultadoAvaliacao.classificacao)}`;
    
    // Cabeçalho com pontuação e classificação
    const cabecalho = document.createElement('div');
    cabecalho.className = 'resultado-cabecalho';
    cabecalho.innerHTML = `
        <h2>${resultadoAvaliacao.classificacao}</h2>
        <div class="pontuacao-circulo">
            <span>${resultadoAvaliacao.pontuacao}</span>
        </div>
    `;
    
    // Recomendação
    const recomendacao = document.createElement('p');
    recomendacao.className = 'recomendacao';
    recomendacao.textContent = resultadoAvaliacao.recomendacao;
    
    // Detalhes dos fatores
    const detalhesElemento = document.createElement('div');
    detalhesElemento.className = 'detalhes-fatores';
    
    // Fase Lunar
    const faseLuaElemento = criarCardFator(
        'Fase Lunar', 
        resultadoAvaliacao.fatoresAnalisados.faseLua.texto,
        resultadoAvaliacao.fatoresAnalisados.faseLua.favoravel,
        resultadoAvaliacao.fatoresAnalisados.faseLua.motivo
    );
    
    // Estação
    const estacaoElemento = criarCardFator(
        'Estação', 
        resultadoAvaliacao.fatoresAnalisados.estacao.atual,
        resultadoAvaliacao.fatoresAnalisados.estacao.favoravel,
        resultadoAvaliacao.fatoresAnalisados.estacao.motivo
    );
    
    // Precipitação
    const chuvaElemento = criarCardFator(
        'Precipitação', 
        `${resultadoAvaliacao.fatoresAnalisados.precipitacao.totalPrecipitacao}mm`,
        !resultadoAvaliacao.fatoresAnalisados.precipitacao.choveu,
        resultadoAvaliacao.fatoresAnalisados.precipitacao.choveu ? 
            `Impacto: ${resultadoAvaliacao.fatoresAnalisados.precipitacao.impactoVisibilidade}` : 
            'Sem chuvas recentes'
    );
    
    // Maré
    const mareElemento = criarCardFator(
        'Maré', 
        resultadoAvaliacao.fatoresAnalisados.mare.estado,
        resultadoAvaliacao.fatoresAnalisados.mare.favoravel,
        `Altura: ${resultadoAvaliacao.fatoresAnalisados.mare.altura}m`
    );
    
    // Vento
    const ventoElemento = criarCardFator(
        'Vento',
        `${resultadoAvaliacao.fatoresAnalisados.vento.intensidade} (${resultadoAvaliacao.fatoresAnalisados.vento.velocidade} km/h)`,
        resultadoAvaliacao.fatoresAnalisados.vento.favoravel,
        `Direção: ${resultadoAvaliacao.fatoresAnalisados.vento.direcao} - ${resultadoAvaliacao.fatoresAnalisados.vento.descricao}`
    );
    
    // Adicionar elementos ao container de detalhes
    detalhesElemento.appendChild(faseLuaElemento);
    detalhesElemento.appendChild(estacaoElemento);
    detalhesElemento.appendChild(chuvaElemento);
    detalhesElemento.appendChild(mareElemento);
    detalhesElemento.appendChild(ventoElemento);
    
    // Montagem final
    resultadoElemento.appendChild(cabecalho);
    resultadoElemento.appendChild(recomendacao);
    resultadoElemento.appendChild(detalhesElemento);
    
    // Adicionar fatores negativos, se houver
    if (resultadoAvaliacao.fatoresNegativos && resultadoAvaliacao.fatoresNegativos.length > 0) {
        const fatoresnegativosElemento = document.createElement('div');
        fatoresnegativosElemento.className = 'fatores-negativos';
        fatoresnegativosElemento.innerHTML = `
            <h3>Fatores que afetam o mergulho hoje:</h3>
            <ul>
                ${resultadoAvaliacao.fatoresNegativos.map(fator => `<li>${fator}</li>`).join('')}
            </ul>
        `;
        resultadoElemento.appendChild(fatoresnegativosElemento);
    }
    
    // Adicionar alertas de API, se houver
    if (resultadoAvaliacao.errosAPI && resultadoAvaliacao.errosAPI.length > 0) {
        const errosAPIElemento = document.createElement('div');
        errosAPIElemento.className = 'erros-api';
        errosAPIElemento.innerHTML = `
            <h3>Atenção: Alertas nas APIs</h3>
            <div class="alerta-api">
                <p>Os seguintes erros foram detectados nas APIs de dados:</p>
                <ul>
                    ${resultadoAvaliacao.errosAPI.map(erro => `<li>${erro}</li>`).join('')}
                </ul>
                <p>Note que estes erros podem afetar a precisão dos resultados exibidos.</p>
            </div>
        `;
        resultadoElemento.appendChild(errosAPIElemento);
    }
    
    // Adicionar ao container principal
    containerElemento.appendChild(resultadoElemento);
    
    // Mostrar o container
    containerElemento.style.display = 'block';
}

/**
 * Cria um card para exibir informações de um fator
 * @param {string} titulo - Título do fator
 * @param {string} valor - Valor principal do fator
 * @param {boolean} favoravel - Se o fator é favorável
 * @param {string} descricao - Descrição adicional
 * @returns {HTMLElement} Elemento do card
 */
function criarCardFator(titulo, valor, favoravel, descricao) {
    const cardElemento = document.createElement('div');
    cardElemento.className = `fator-card ${favoravel ? 'favoravel' : 'desfavoravel'}`;
    
    // Adicionar classe específica para outono
    if (valor === 'Outono') {
        cardElemento.classList.add('outono');
    }
    
    const icone = favoravel ? '✓' : '✗';
    
    cardElemento.innerHTML = `
        <div class="fator-cabecalho">
            <h3>${titulo}</h3>
            <span class="indicador">${icone}</span>
        </div>
        <div class="fator-valor">${valor}</div>
        <div class="fator-descricao">${descricao}</div>
    `;
    
    return cardElemento;
}

/**
 * Obtém a classe CSS com base na classificação
 * @param {string} classificacao - Classificação da condição de mergulho
 * @returns {string} Classe CSS correspondente
 */
function obterClasseCSS(classificacao) {
    switch (classificacao.toLowerCase()) {
        case 'excelente':
            return 'resultado-excelente';
        case 'bom':
            return 'resultado-bom';
        case 'regular':
            return 'resultado-regular';
        case 'ruim':
            return 'resultado-ruim';
        default:
            return 'resultado-pessimo';
    }
}

/**
 * Exibe mensagem de carregamento na interface
 */
export function exibirCarregamento() {
    const containerElemento = document.getElementById('resultado-mergulho');
    if (!containerElemento) return;
    
    containerElemento.innerHTML = `
        <div class="carregando">
            <div class="spinner"></div>
            <p>Analisando condições de mergulho...</p>
        </div>
    `;
    
    containerElemento.style.display = 'block';
}

/**
 * Exibe mensagem de erro na interface
 * @param {string} mensagem - Mensagem de erro
 */
export function exibirErro(mensagem) {
    const containerElemento = document.getElementById('resultado-mergulho');
    if (!containerElemento) return;
    
    containerElemento.innerHTML = `
        <div class="erro">
            <h3>Erro ao avaliar condições</h3>
            <div class="erro-detalhes">
                <p>${mensagem}</p>
                ${mensagem.includes('API') ? 
                    `<div class="erro-api-info">
                        <p><strong>Causas possíveis:</strong></p>
                        <ul>
                            <li>Problemas de conexão com a API de dados meteorológicos</li>
                            <li>Chave de API inválida ou expirada</li>
                            <li>Indisponibilidade temporária do serviço</li>
                        </ul>
                    </div>` : ''}
            </div>
            <button id="tentar-novamente" class="botao-retry">Tentar Novamente</button>
        </div>
    `;
    
    containerElemento.style.display = 'block';
    
    // Adicionar listener ao botão de retry
    const botaoRetry = document.getElementById('tentar-novamente');
    if (botaoRetry) {
        botaoRetry.addEventListener('click', () => {
            window.location.reload();
        });
    }
} 