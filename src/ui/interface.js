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
    const mareRaw = resultadoAvaliacao.fatoresAnalisados.mare.raw || {};
    const hasTideData = mareRaw.amplitude !== undefined;
    const mareStatus = hasTideData ? (mareRaw.pontuacao >= 3 ? 'favoravel' : (mareRaw.pontuacao === 2 ? 'favoravel' : (mareRaw.pontuacao === 1 ? 'regular' : 'ruim'))) : 'desfavoravel';

    const mareElemento = criarCardFator(
        `Maré (${mareRaw.classificacao || 'Erro'})`,
        resultadoAvaliacao.fatoresAnalisados.mare.estado || 'Indisponível',
        resultadoAvaliacao.fatoresAnalisados.mare.favoravel,
        hasTideData ? `${mareRaw.detalhe} (Amplitude: ${mareRaw.amplitude.toFixed(2)}m)` : (mareRaw.error || 'Dados de maré não disponíveis'),
        mareStatus
    );

    // Injetar container do gráfico no card de maré
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<canvas id="tideChart"></canvas>';
    mareElemento.appendChild(chartContainer);

    // Vento
    const ventoElemento = criarCardFator(
        'Vento',
        `${resultadoAvaliacao.fatoresAnalisados.vento.intensidade} (${resultadoAvaliacao.fatoresAnalisados.vento.velocidade} km/h)`,
        resultadoAvaliacao.fatoresAnalisados.vento.favoravel,
        `Direção: ${resultadoAvaliacao.fatoresAnalisados.vento.direcao} - ${resultadoAvaliacao.fatoresAnalisados.vento.descricao}`
    );

    // Adicionar elementos ao container de detalhes (exceto maré que será full-width)
    detalhesElemento.appendChild(faseLuaElemento);
    detalhesElemento.appendChild(estacaoElemento);
    detalhesElemento.appendChild(chuvaElemento);
    detalhesElemento.appendChild(ventoElemento);

    // Montagem final
    resultadoElemento.appendChild(cabecalho);
    resultadoElemento.appendChild(recomendacao);

    // Adicionar Maré com destaque (full-width)
    mareElemento.style.marginBottom = '20px';
    resultadoElemento.appendChild(mareElemento);

    resultadoElemento.appendChild(detalhesElemento);

    // Renderizar o gráfico após adicionar ao DOM
    setTimeout(() => {
        const mareData = resultadoAvaliacao.fatoresAnalisados.mare.raw;
        if (mareData && mareData.waveData) {
            renderTideChart(mareData);
        }
    }, 100);

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
function criarCardFator(titulo, valor, favoravel, descricao, statusForcado = null) {
    const cardElemento = document.createElement('div');
    const classeStatus = statusForcado || (favoravel ? 'favoravel' : 'desfavoravel');
    cardElemento.className = `fator-card ${classeStatus}`;

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

/**
 * Renderiza o gráfico de marés usando Chart.js
 * @param {object} data - Dados de maré (waveData, dayEntries, nowMinutes)
 */
function renderTideChart(data) {
    const canvas = document.getElementById('tideChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Nível (m)',
                    data: data.waveData,
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Picos',
                    data: data.dayEntries.map(e => ({ x: timeToMinutes(e.time), y: e.height })),
                    pointBackgroundColor: data.dayEntries.map((e, idx) => {
                        let isHigh = false;
                        if (idx === 0) isHigh = e.height > data.dayEntries[1]?.height;
                        else isHigh = e.height > data.dayEntries[idx - 1].height;
                        return isHigh ? '#2ecc71' : '#e74c3c';
                    }),
                    pointRadius: 4,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: (items) => {
                            const minSymbol = items[0].parsed.x;
                            const hh = String(Math.floor(minSymbol / 60) % 24).padStart(2, '0');
                            const mm = String(Math.floor(minSymbol % 60)).padStart(2, '0');
                            return `${hh}:${mm}`;
                        },
                        label: (ctx) => ` Altura: ${ctx.parsed.y.toFixed(2)}m`
                    }
                }
            },
            scales: {
                y: {
                    display: true,
                    min: -0.5,
                    max: 2.0,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { font: { size: 10 } }
                },
                x: {
                    type: 'linear',
                    display: true,
                    min: 0,
                    max: 1440,
                    grid: { display: false },
                    ticks: {
                        stepSize: 240,
                        font: { size: 10 },
                        callback: (val) => String(Math.floor(val / 60)).padStart(2, '0') + ':00'
                    }
                }
            }
        },
        plugins: [{
            id: 'peakLines',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                ctx.save();
                ctx.setLineDash([2, 5]);
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                data.dayEntries.forEach(peak => {
                    const x = xAxis.getPixelForValue(timeToMinutes(peak.time));
                    const y = yAxis.getPixelForValue(peak.height);

                    // Vertical line to X axis
                    ctx.beginPath();
                    ctx.moveTo(x, yAxis.bottom);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    // Text label (PREAMAR/BAIXAMAR)
                    let isHigh = false;
                    const idx = data.dayEntries.indexOf(peak);
                    if (idx === 0) isHigh = peak.height > data.dayEntries[1]?.height;
                    else isHigh = peak.height > data.dayEntries[idx - 1].height;

                    ctx.fillStyle = isHigh ? '#27ae60' : '#c0392b';
                    ctx.font = 'bold 10px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(isHigh ? 'PREAMAR' : 'BAIXAMAR', x, y - 10);
                    ctx.fillStyle = '#666';
                    ctx.fillText(`${peak.height.toFixed(1)}m`, x, y + 15);
                });

                if (data.nowMinutes !== -1 && data.nowMinutes <= 1440) {
                    const xNow = xAxis.getPixelForValue(data.nowMinutes);
                    ctx.strokeStyle = '#f1c40f';
                    ctx.setLineDash([3, 3]);
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(xNow, yAxis.top); ctx.lineTo(xNow, yAxis.bottom);
                    ctx.stroke();

                    ctx.fillStyle = '#f39c12';
                    ctx.font = 'bold 11px Inter, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('AGORA', xNow + 5, yAxis.top + 15);
                }
                ctx.restore();
            }
        }]
    });
}

function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}
