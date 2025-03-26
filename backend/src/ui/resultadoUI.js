/**
 * Módulo para renderização da UI de resultados
 */
import { CONFIG } from '../config.js';

/**
 * Constrói o HTML do resultado da verificação
 * @param {boolean} veraoAtual - Se é verão atualmente
 * @param {number} diasAteVerao - Dias até o início do verão
 * @param {object} faseLua - Dados da fase lunar
 * @param {object} chuva - Dados de precipitação
 * @param {object} mares - Dados de marés
 * @param {object} proximoQuartoCrescente - Informações sobre próximo quarto crescente
 * @param {object} avaliacaoGeral - Resultado da avaliação geral
 * @returns {string} HTML formatado com os resultados
 */
export function construirResultadoHTML(veraoAtual, diasAteVerao, faseLua, chuva, mares, proximoQuartoCrescente, avaliacaoGeral) {
    let html = `
        <div class="resultado-container">
            <div class="avaliacao-geral">
                <div class="pontuacao-container">
                    <div class="pontuacao-circulo" style="background: conic-gradient(#4CAF50 0% ${avaliacaoGeral.percentual}%, #f0f0f0 ${avaliacaoGeral.percentual}% 100%);">
                        <span>${avaliacaoGeral.percentual}%</span>
                    </div>
                    <div class="classificacao">
                        <h3>${avaliacaoGeral.classificacao}</h3>
                        <p>${avaliacaoGeral.recomendacao}</p>
                    </div>
                </div>
            </div>
            
            <div class="detalhes-container">
                <h3>Detalhes da Avaliação</h3>
                <div class="detalhes-grid">
    `;
    
    // Adicionar informações sobre estação
    html += `
        <div class="detalhe-item ${veraoAtual ? 'favoravel' : 'desfavoravel'}">
            <h4>Estação</h4>
            ${veraoAtual ? 
                '<p><strong>Estamos no verão!</strong> Condições favoráveis para mergulho!</p>' : 
                `<p>Ainda não estamos no verão. Faltam ${diasAteVerao} dias para o início do verão.</p>`
            }
        </div>
    `;
    
    // Adicionar informações sobre fase lunar
    const classFaseLunar = faseLua.favoravelParaMergulho && faseLua.favoravelParaMergulho.favoravel ? 'favoravel' : 'desfavoravel';
    html += `
        <div class="detalhe-item ${classFaseLunar}">
            <h4>Fase Lunar</h4>
            <p><strong>Fase atual:</strong> ${faseLua.texto}</p>
            ${faseLua.iluminacao ? `<p><strong>Iluminação:</strong> ${faseLua.iluminacao}%</p>` : ''}
            ${faseLua.favoravelParaMergulho ? 
                `<p><strong>Análise:</strong> ${faseLua.favoravelParaMergulho.motivo}</p>` : 
                '<p>Não foi possível analisar a fase lunar.</p>'
            }
    `;
    
    if (proximoQuartoCrescente && proximoQuartoCrescente.dias) {
        html += `<p>Faltam ${proximoQuartoCrescente.dias} dias para o próximo Quarto Crescente.</p>`;
    } else if (proximoQuartoCrescente && proximoQuartoCrescente.mensagem) {
        html += `<p>${proximoQuartoCrescente.mensagem}</p>`;
    }
    
    html += `</div>`;
    
    // Adicionar informações sobre chuva
    const classChuva = !chuva.choveu ? 'favoravel' : (chuva.detalhes && chuva.detalhes.impactoVisibilidade.nivel === 'Alto' ? 'desfavoravel' : 'moderado');
    html += `
        <div class="detalhe-item ${classChuva}">
            <h4>Precipitação</h4>
            ${chuva.choveu ? 
                `<p><strong>Choveu nos últimos dias</strong></p>
                 <p>Total: ${chuva.totalPrecipitacao}mm em ${chuva.horasComChuva} horas</p>` : 
                '<p><strong>Não houve chuva significativa</strong> nos últimos dias.</p>'
            }
            ${chuva.detalhes ? 
                `<p><strong>Impacto na visibilidade:</strong> ${chuva.detalhes.impactoVisibilidade.descricao}</p>` : 
                ''
            }
        </div>
    `;
    
    // Adicionar informações sobre marés
    const classMare = mares.analise && (mares.analise.condicaoMergulho === 'ideal' || mares.analise.condicaoMergulho === 'boa') ? 
                    'favoravel' : (mares.analise && mares.analise.condicaoMergulho === 'razoável' ? 'moderado' : 'desfavoravel');
    
    html += `
        <div class="detalhe-item ${classMare}">
            <h4>Marés</h4>
            ${mares.analise ? 
                `<p><strong>Próxima maré:</strong> ${mares.analise.tipoProximaMare} 
                    (${new Date(mares.analise.proximaMare).toLocaleTimeString()})</p>
                 <p>${mares.analise.descricao}</p>` : 
                '<p>Não foi possível obter informações sobre marés.</p>'
            }
        </div>
    `;
    
    // Tabela de detalhes de pontuação
    html += `
                </div>
                
                <div class="pontuacao-detalhes">
                    <h3>Fatores de Pontuação</h3>
                    <table class="pontuacao-tabela">
                        <thead>
                            <tr>
                                <th>Fator</th>
                                <th>Pontos</th>
                                <th>Descrição</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    // Adicionar linhas da tabela de pontuação
    for (const detalhe of avaliacaoGeral.detalhes) {
        html += `
            <tr>
                <td>${detalhe.fator}</td>
                <td>${detalhe.pontos}</td>
                <td>${detalhe.descricao}</td>
            </tr>
        `;
    }
    
    html += `
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total</strong></td>
                                <td><strong>${avaliacaoGeral.pontuacao}/10</strong></td>
                                <td>${avaliacaoGeral.classificacao}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            <div class="rodape-resultado">
                <p>Última atualização: ${new Date().toLocaleString()}</p>
                <p>Localização: Latitude ${CONFIG.LATITUDE.toFixed(4)}, Longitude ${CONFIG.LONGITUDE.toFixed(4)}</p>
                <button id="atualizarDados" class="btn-atualizar">Atualizar Dados</button>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Aplica estilos CSS para a interface do aplicativo
 */
export function aplicarEstilosUI() {
    const estilos = `
        .resultado-container {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .avaliacao-geral {
            text-align: center;
            margin-bottom: 30px;
        }

        .pontuacao-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
        }

        .pontuacao-circulo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20px;
            border: 5px solid #f0f0f0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 28px;
            font-weight: bold;
            color: #333;
        }

        .classificacao {
            text-align: left;
        }

        .classificacao h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }

        .detalhes-container {
            margin-top: 20px;
        }

        .detalhes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .detalhe-item {
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .detalhe-item h4 {
            margin-top: 0;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            color: #2c3e50;
        }

        .favoravel {
            background-color:rgb(192, 255, 197);
            border-left: 5px solid #4CAF50;
        }

        .moderado {
            background-color:rgb(255, 240, 190);
            border-left: 5px solid #FFC107;
        }

        .desfavoravel {
            background-color:rgb(255, 194, 203);
            border-left: 5px solid #F44336;
        }

        .pontuacao-tabela {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .pontuacao-tabela th, .pontuacao-tabela td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }

        .pontuacao-tabela th {
            background-color: #f2f2f2;
        }

        .pontuacao-tabela tfoot {
            font-weight: bold;
            background-color: #f5f5f5;
        }

        .rodape-resultado {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #777;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }

        .btn-atualizar {
            background-color: #2196F3;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }

        .btn-atualizar:hover {
            background-color: #0b7dda;
        }

        .error-message {
            background-color: #ffebee;
            border: 1px solid #ffcdd2;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #b71c1c;
        }

        @media (max-width: 968px) {
            .pontuacao-container {
                flex-direction: column;
            }
            
            .pontuacao-circulo {
                margin-right: 0;
                margin-bottom: 20px;
            }
            
            .classificacao {
                text-align: center;
            }
            
            .detalhes-grid {
                grid-template-columns: 1fr;
            }
            
            .rodape-resultado {
                flex-direction: column;
                text-align: center;
            }
            
            .btn-atualizar {
                margin-top: 15px;
            }
        }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.textContent = estilos;
    document.head.appendChild(styleEl);
}

/**
 * Inicializa a estrutura HTML básica do aplicativo
 */
export function inicializarHTML() {
    const appContainer = document.getElementById('app');
    if (appContainer && appContainer.innerHTML.trim() === '') {
        appContainer.innerHTML = `
            <div class="container">
                <header>
                    <h1>Verificador de Condições para Mergulho</h1>
                    <p>Esta ferramenta analisa condições ambientais para determinar se hoje é um bom dia para mergulho.</p>
                </header>
                
                <div class="controles">
                    <button id="verificarBtn" class="btn-principal">Verificar Condições Agora</button>
                    <p id="status" class="status"></p>
                </div>
                
                <div id="resultado" class="hidden"></div>
                
                <footer>
                    <p>Dados fornecidos por StormGlass.io | Desenvolvido para mergulhadores</p>
                </footer>
            </div>
        `;
    }
} 