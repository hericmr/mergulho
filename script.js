// Configurações globais
const API_KEY = "bf5e8542-8a21-11ef-8d8d-0242ac130003-bf5e8614-8a21-11ef-8d8d-0242ac130003";
const LATITUDE = -23.9608;
const LONGITUDE = -46.3336;
const HEMISFERIO_SUL = (LATITUDE < 0);
const CACHE_EXPIRACAO = 3600000; // 1 hora em milissegundos

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('verificarBtn').addEventListener('click', async () => {
        document.getElementById('resultado').classList.remove('hidden');
        document.getElementById('resultado').innerHTML = '<p>Carregando dados...</p>';
        await verificarCondicoes();
    });
});

// Sistema de cache para reduzir chamadas à API
function obterCache(chave) {
    const item = localStorage.getItem(chave);
    if (!item) return null;
    
    const dadosCache = JSON.parse(item);
    if (Date.now() - dadosCache.timestamp > CACHE_EXPIRACAO) {
        localStorage.removeItem(chave);
        return null;
    }
    
    return dadosCache.dados;
}

function definirCache(chave, dados) {
    const dadosCache = {
        dados: dados,
        timestamp: Date.now()
    };
    localStorage.setItem(chave, JSON.stringify(dadosCache));
}

// Função para verificar se é verão (adaptada para hemisfério)
function ehVerao() {
    const mesAtual = new Date().getMonth() + 1; // getMonth() retorna 0-11
    
    if (HEMISFERIO_SUL) {
        return [12, 1, 2, 3].includes(mesAtual); // Verão no hemisfério sul: dez-mar
    } else {
        return [6, 7, 8, 9].includes(mesAtual); // Verão no hemisfério norte: jun-set
    }
}

// Função para calcular dias até o verão
function diasParaVerao() {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    let inicioVerao;
    
    if (HEMISFERIO_SUL) {
        inicioVerao = new Date(hoje.getMonth() >= 11 ? anoAtual : anoAtual - 1, 11, 21);
        const fimVerao = new Date(anoAtual, 2, 21); // 21 de março
        
        if (hoje >= inicioVerao && hoje <= fimVerao) {
            return 0; // Já estamos no verão
        }
        
        // Se já passamos do verão, o próximo é no final do ano
        if (hoje > fimVerao) {
            inicioVerao = new Date(anoAtual, 11, 21);
        }
    } else {
        inicioVerao = new Date(anoAtual, 5, 21); // 21 de junho
        const fimVerao = new Date(anoAtual, 8, 23); // 23 de setembro
        
        if (hoje >= inicioVerao && hoje <= fimVerao) {
            return 0; // Já estamos no verão
        }
        
        // Se já passamos do verão, o próximo é no próximo ano
        if (hoje > fimVerao) {
            inicioVerao = new Date(anoAtual + 1, 5, 21);
        }
    }
    
    const diferencaDias = Math.ceil((inicioVerao - hoje) / (1000 * 60 * 60 * 24));
    return diferencaDias;
}

// Função para obter dados da API com tratamento de erros e retry
async function buscarDadosAPI(url, tentativas = 3) {
    let tentativaAtual = 0;
    let ultimoErro;
    
    while (tentativaAtual < tentativas) {
        try {
            const resposta = await fetch(url, { 
                headers: { 'Authorization': API_KEY },
                timeout: 10000 // 10 segundos de timeout
            });
            
            if (!resposta.ok) {
                if (resposta.status === 429) {
                    throw new Error(`Limite de requisições API excedido. Tente mais tarde. Status: ${resposta.status}`);
                } else {
                    throw new Error(`Erro na API: ${resposta.status} - ${resposta.statusText}`);
                }
            }
            
            return await resposta.json();
        } catch (erro) {
            ultimoErro = erro;
            tentativaAtual++;
            
            // Espera crescente entre tentativas (1s, 2s, 4s)
            if (tentativaAtual < tentativas) {
                await new Promise(r => setTimeout(r, Math.pow(2, tentativaAtual - 1) * 1000));
            }
        }
    }
    
    throw ultimoErro;
}

// Função aprimorada para verificar fase da lua
async function checarFaseDaLua() {
    const chaveCache = 'faseLua';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        return dadosCache;
    }
    
    try {
        const start = Math.floor(Date.now() / 1000);
        const url = `https://api.stormglass.io/v2/astronomy/point?lat=${LATITUDE}&lng=${LONGITUDE}&start=${start}`;
        
        const dados = await buscarDadosAPI(url);
        
        if (!dados || !dados.data || dados.data.length === 0 || !dados.data[0].moonPhase) {
            throw new Error('Dados inválidos da API de fase lunar');
        }
        
        const faseLua = dados.data[0].moonPhase.current.text;
        const porcentagemIluminada = dados.data[0].moonPhase.illumination || 0;
        
        const resultado = {
            texto: faseLua,
            quartoCrescente: faseLua.toLowerCase().includes('first quarter'),
            iluminacao: porcentagemIluminada,
            favoravelParaMergulho: avaliarFaseParaMergulho(faseLua, porcentagemIluminada)
        };
        
        definirCache(chaveCache, resultado);
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar fase da lua:', erro);
        return {
            texto: 'Não foi possível determinar',
            quartoCrescente: false,
            iluminacao: 0,
            favoravelParaMergulho: false,
            erro: erro.message
        };
    }
}

// Função para avaliar se a fase lunar é favorável para mergulho
function avaliarFaseParaMergulho(faseLua, iluminacao) {
    const faseNormalizada = faseLua.toLowerCase();
    
    // Fases ideais para mergulho: Quarto Crescente e próximo a ele
    if (faseNormalizada.includes('first quarter')) {
        return { favoravel: true, pontuacao: 3, motivo: 'Quarto crescente é ideal para mergulho' };
    }
    
    // Lua Nova também pode ser boa para alguns tipos de mergulho
    if (faseNormalizada.includes('new')) {
        return { favoravel: true, pontuacao: 2, motivo: 'Lua nova oferece boas condições para mergulho noturno' };
    }
    
    // Lua Cheia geralmente não é ideal (muita luminosidade, pode afetar vida marinha)
    if (faseNormalizada.includes('full')) {
        return { favoravel: false, pontuacao: 0, motivo: 'Lua cheia pode não ser ideal para observação da vida marinha' };
    }
    
    // Quarto Minguante - condições moderadas
    if (faseNormalizada.includes('last quarter')) {
        return { favoravel: true, pontuacao: 1, motivo: 'Quarto minguante oferece condições moderadas' };
    }
    
    // Fases crescentes são geralmente melhores que minguantes
    if (faseNormalizada.includes('waxing')) {
        return { favoravel: true, pontuacao: 2, motivo: 'Fase crescente geralmente traz boas condições' };
    }
    
    // Outras fases - condições moderadas
    return { 
        favoravel: iluminacao < 75, 
        pontuacao: iluminacao < 75 ? 1 : 0,
        motivo: iluminacao < 75 ? 'Condições moderadas' : 'Iluminação alta pode afetar visibilidade'
    };
}

// Função para calcular dias até o próximo quarto crescente
async function diasParaProximoQuartoCrescente() {
    const chaveCache = 'proximoQuartoCrescente';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        const dataCache = new Date(dadosCache.data);
        const hoje = new Date();
        
        if (dataCache > hoje) {
            return {
                dias: Math.ceil((dataCache - hoje) / (1000 * 60 * 60 * 24)),
                data: dataCache
            };
        }
    }
    
    try {
        const hoje = new Date();
        const start = Math.floor(hoje.getTime() / 1000);
        const end = Math.floor((hoje.getTime() + 90 * 24 * 60 * 60 * 1000) / 1000); // 90 dias à frente
        
        const url = `https://api.stormglass.io/v2/astronomy/point?lat=${LATITUDE}&lng=${LONGITUDE}&start=${start}&end=${end}`;
        
        const dados = await buscarDadosAPI(url);
        
        if (!dados || !dados.data || dados.data.length === 0) {
            throw new Error('Dados inválidos da API para previsão lunar');
        }
        
        // Busca o próximo quarto crescente
        for (const ponto of dados.data) {
            if (ponto.moonPhase && 
                ponto.moonPhase.current && 
                ponto.moonPhase.current.text && 
                ponto.moonPhase.current.text.toLowerCase().includes('first quarter')) {
                
                const dataQuartoCrescente = new Date(ponto.time);
                
                if (dataQuartoCrescente > hoje) {
                    const resultado = {
                        dias: Math.ceil((dataQuartoCrescente - hoje) / (1000 * 60 * 60 * 24)),
                        data: dataQuartoCrescente
                    };
                    
                    definirCache(chaveCache, { data: dataQuartoCrescente });
                    return resultado;
                }
            }
        }
        
        return {
            dias: null,
            mensagem: "Não foi possível encontrar o próximo quarto crescente nos próximos 90 dias."
        };
    } catch (erro) {
        console.error('Erro ao calcular próximo quarto crescente:', erro);
        return {
            dias: null,
            mensagem: "Erro ao calcular próximo quarto crescente: " + erro.message
        };
    }
}

// Função melhorada para verificar chuva
async function checarChuva() {
    const chaveCache = 'dadosChuva';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        return dadosCache;
    }
    
    try {
        const start = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60); // 3 dias atrás
        const end = Math.floor(Date.now() / 1000); // Agora
        const url = `https://api.stormglass.io/v2/weather/point?lat=${LATITUDE}&lng=${LONGITUDE}&start=${start}&end=${end}&params=precipitation`;
        
        const dados = await buscarDadosAPI(url);
        
        if (!dados || !dados.hours || dados.hours.length === 0) {
            throw new Error('Dados inválidos da API de precipitação');
        }
        
        let totalPrecipitacao = 0;
        let horasComChuva = 0;
        
        for (const hora of dados.hours) {
            if (hora.precipitation && hora.precipitation.sg !== undefined) {
                const precipitacao = parseFloat(hora.precipitation.sg);
                if (precipitacao > 0) {
                    totalPrecipitacao += precipitacao;
                    horasComChuva++;
                }
            }
        }
        
        // Considera chuva significativa se houver mais de 2mm no total
        // ou se choveu por mais de 6 horas nos últimos 3 dias
        const choveuSignificativo = totalPrecipitacao > 2 || horasComChuva > 6;
        
        const resultado = {
            choveu: choveuSignificativo,
            totalPrecipitacao: totalPrecipitacao.toFixed(2),
            horasComChuva: horasComChuva,
            detalhes: {
                chuvaForte: totalPrecipitacao > 10,
                chuvaPersistente: horasComChuva > 12,
                impactoVisibilidade: avaliarImpactoChuva(totalPrecipitacao, horasComChuva)
            }
        };
        
        definirCache(chaveCache, resultado);
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar dados de chuva:', erro);
        return {
            choveu: false,
            totalPrecipitacao: 0,
            horasComChuva: 0,
            erro: erro.message
        };
    }
}

// Função para avaliar o impacto da chuva na visibilidade
function avaliarImpactoChuva(totalPrecipitacao, horasComChuva) {
    if (totalPrecipitacao > 20 || horasComChuva > 24) {
        return { nivel: 'Alto', descricao: 'Chuva recente foi intensa, isso pode ter afetado significativamente a visibilidade' };
    } else if (totalPrecipitacao > 10 || horasComChuva > 12) {
        return { nivel: 'Médio', descricao: 'Visibilidade moderadamente afetada pela chuva que aconteceu recentemente' };
    } else if (totalPrecipitacao > 2 || horasComChuva > 6) {
        return { nivel: 'Baixo', descricao: 'Pequeno impacto na visibilidade' };
    } else {
        return { nivel: 'Muito Baixo', descricao: 'Visibilidade praticamente não afetada' };
    }
}

// Função aprimorada para verificar marés
async function checarMare() {
    const chaveCache = 'dadosMare';
    const dadosCache = obterCache(chaveCache);
    
    if (dadosCache) {
        // Verifica se os dados ainda são relevantes (tem marés futuras)
        const agora = new Date();
        const temMaresFuturas = dadosCache.mareAlta.some(mare => new Date(mare) > agora) || 
                               dadosCache.mareBaixa.some(mare => new Date(mare) > agora);
        
        if (temMaresFuturas) {
            return dadosCache;
        }
    }
    
    try {
        const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${LATITUDE}&lng=${LONGITUDE}`;
        
        const dados = await buscarDadosAPI(url);
        
        if (!dados || !dados.data || dados.data.length === 0) {
            throw new Error('Dados inválidos da API de marés');
        }
        
        // Extrair dados de marés
        const mareAlta = dados.data
            .filter(entry => entry.type === 'high')
            .map(entry => entry.time);
        
        const mareBaixa = dados.data
            .filter(entry => entry.type === 'low')
            .map(entry => entry.time);
        
        // Análise das próximas marés
        const proximasMaresAnalise = analisarProximasMares(mareAlta, mareBaixa);
        
        const resultado = {
            mareAlta: mareAlta,
            mareBaixa: mareBaixa,
            analise: proximasMaresAnalise
        };
        
        definirCache(chaveCache, resultado);
        return resultado;
    } catch (erro) {
        console.error('Erro ao consultar marés:', erro);
        return {
            mareAlta: [],
            mareBaixa: [],
            erro: erro.message
        };
    }
}

// Função para analisar e interpretar dados de maré para mergulho
function analisarProximasMares(mareAlta, mareBaixa) {
    const agora = new Date();
    const proximasHoras = new Date(agora.getTime() + 12 * 60 * 60 * 1000); // 12 horas à frente
    
    // Filtrar apenas marés nas próximas 12 horas
    const proximaMareAlta = mareAlta
        .map(mare => new Date(mare))
        .filter(mare => mare > agora && mare < proximasHoras)
        .sort((a, b) => a - b)[0];
    
    const proximaMareBaixa = mareBaixa
        .map(mare => new Date(mare))
        .filter(mare => mare > agora && mare < proximasHoras)
        .sort((a, b) => a - b)[0];
    
    // Determinar qual é a próxima maré (alta ou baixa)
    let proximaMare = null;
    let tipoProximaMare = null;
    
    if (proximaMareAlta && proximaMareBaixa) {
        if (proximaMareAlta < proximaMareBaixa) {
            proximaMare = proximaMareAlta;
            tipoProximaMare = 'alta';
        } else {
            proximaMare = proximaMareBaixa;
            tipoProximaMare = 'baixa';
        }
    } else if (proximaMareAlta) {
        proximaMare = proximaMareAlta;
        tipoProximaMare = 'alta';
    } else if (proximaMareBaixa) {
        proximaMare = proximaMareBaixa;
        tipoProximaMare = 'baixa';
    }
    
    // Análise para mergulho baseada nas marés
    let condicaoMergulho = 'indefinida';
    let descricao = '';
    
    if (proximaMare) {
        const horasAteProximaMare = (proximaMare - agora) / (1000 * 60 * 60);
        
        if (tipoProximaMare === 'baixa') {
            if (horasAteProximaMare < 1) {
                condicaoMergulho = 'ideal';
                descricao = 'Maré baixa iminente, condições ideais para mergulho em recifes costeiros';
            } else if (horasAteProximaMare < 3) {
                condicaoMergulho = 'boa';
                descricao = 'Aproximando-se da maré baixa, boas condições para mergulho';
            } else {
                condicaoMergulho = 'razoável';
                descricao = 'Maré baixa em algumas horas, condições razoáveis';
            }
        } else {
            if (horasAteProximaMare < 1) {
                condicaoMergulho = 'boa';
                descricao = 'Maré alta iminente, boas condições para profundidade';
            } else if (horasAteProximaMare < 3) {
                condicaoMergulho = 'razoável';
                descricao = 'Aproximando-se da maré alta, condições razoáveis';
            } else {
                condicaoMergulho = 'razoável';
                descricao = 'Maré alta em algumas horas, condições razoáveis';
            }
        }
    } else {
        condicaoMergulho = 'desconhecida';
        descricao = 'Não há informações de marés para as próximas horas';
    }
    
    return {
        proximaMare: proximaMare ? proximaMare.toISOString() : null,
        tipoProximaMare: tipoProximaMare,
        condicaoMergulho: condicaoMergulho,
        descricao: descricao
    };
}

// Função para avaliar todas as condições e gerar pontuação de mergulho
function avaliarCondicoesGerais(faseLua, chuva, marés, estacaoVerao) {
    let pontuacao = 0;
    let detalhes = [];
    
    // Avaliação da fase lunar (0-3 pontos)
    pontuacao += faseLua.favoravelParaMergulho ? faseLua.favoravelParaMergulho.pontuacao : 0;
    detalhes.push({
        fator: 'Fase Lunar',
        pontos: faseLua.favoravelParaMergulho ? faseLua.favoravelParaMergulho.pontuacao : 0,
        descricao: faseLua.favoravelParaMergulho ? faseLua.favoravelParaMergulho.motivo : 'Dados insuficientes'
    });
    
    // Avaliação de chuva (0-3 pontos)
    let pontosChuva = 3; // Máximo se não choveu
    if (chuva.choveu) {
        if (chuva.detalhes && chuva.detalhes.impactoVisibilidade) {
            if (chuva.detalhes.impactoVisibilidade.nivel === 'Alto') {
                pontosChuva = 0;
            } else if (chuva.detalhes.impactoVisibilidade.nivel === 'Médio') {
                pontosChuva = 1;
            } else if (chuva.detalhes.impactoVisibilidade.nivel === 'Baixo') {
                pontosChuva = 2;
            }
        } else {
            pontosChuva = 1; // Valor padrão se choveu mas não temos detalhe
        }
    }
    pontuacao += pontosChuva;
    detalhes.push({
        fator: 'Precipitação',
        pontos: pontosChuva,
        descricao: chuva.detalhes ? chuva.detalhes.impactoVisibilidade.descricao : 'Dados insuficientes'
    });
    
    // Avaliação da estação (0-2 pontos)
    const pontosEstacao = estacaoVerao ? 2 : 0;
    pontuacao += pontosEstacao;
    detalhes.push({
        fator: 'Estação',
        pontos: pontosEstacao,
        descricao: estacaoVerao ? 'Verão - condições favoráveis' : 'Não é verão - temperatura da água pode ser desconfortável'
    });
    
    // Avaliação das marés (0-2 pontos)
    let pontosMaré = 0;
    if (marés.analise) {
        if (marés.analise.condicaoMergulho === 'ideal') {
            pontosMaré = 2;
        } else if (marés.analise.condicaoMergulho === 'boa') {
            pontosMaré = 1.5;
        } else if (marés.analise.condicaoMergulho === 'razoável') {
            pontosMaré = 1;
        }
    }
    pontuacao += pontosMaré;
    detalhes.push({
        fator: 'Marés',
        pontos: pontosMaré,
        descricao: marés.analise ? marés.analise.descricao : 'Dados insuficientes'
    });
    
    // Pontuação máxima: 10 pontos
    const percentual = (pontuacao / 10) * 100;
    
    // Classificação final
    let classificacao;
    let recomendacao;
    
    if (percentual >= 80) {
        classificacao = 'Excelente';
        recomendacao = 'Condições perfeitas pra mergulho. Aproveite!';
    } else if (percentual >= 60) {
        classificacao = 'Boa';
        recomendacao = 'Boas condições para mergulho. Experiência satisfatória.';
    } else if (percentual >= 40) {
        classificacao = 'Razoável';
        recomendacao = 'Condições moderadas. O Mergulho é possível, mas a água não deve estar muito legal.';
    } else {
        classificacao = 'Desfavorável';
        recomendacao = 'Condições não ideais. Considere adiar o mergulho se possível.';
    }
    
    return {
        pontuacao: pontuacao.toFixed(1),
        percentual: percentual.toFixed(0),
        classificacao: classificacao,
        recomendacao: recomendacao,
        detalhes: detalhes
    };
}

// Função principal para verificar condições
async function verificarCondicoes() {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Verificando condições de mergulho...';
    
    try {
        // Verificação da estação do ano
        const veraoAtual = ehVerao();
        const diasAteVerao = diasParaVerao();
        
        // Buscar dados das APIs em paralelo
        const [faseLua, chuva, mares, proximoQuartoCrescente] = await Promise.all([
            checarFaseDaLua(),
            checarChuva(),
            checarMare(),
            diasParaProximoQuartoCrescente()
        ]);
        
        // Avaliar condições gerais
        const avaliacaoGeral = avaliarCondicoesGerais(faseLua, chuva, mares, veraoAtual);
        
        // Construir resultado HTML
        let resultadoHtml = construirResultadoHTML(
            veraoAtual, diasAteVerao, faseLua, chuva, 
            mares, proximoQuartoCrescente, avaliacaoGeral
        );
        
        // Atualizar interface
        statusDiv.textContent = 'Condições de mergulho verificadas!';
        document.getElementById('resultado').innerHTML = resultadoHtml;
        
    } catch (erro) {
        console.error('Erro ao verificar condições:', erro);
        statusDiv.textContent = 'Erro ao verificar as condições. Tente novamente mais tarde.';
        document.getElementById('resultado').innerHTML = `
            <div class="error-message">
                <p><strong>Ocorreu um erro:</strong> ${erro.message}</p>
                <p>Por favor, tente novamente em alguns minutos ou verifique sua conexão com a internet.</p>
            </div>
        `;
    }
}

// Função para construir o HTML do resultado
function construirResultadoHTML(veraoAtual, diasAteVerao, faseLua, chuva, mares, proximoQuartoCrescente, avaliacaoGeral) {
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
    
    // Adicionar informações sobre chu
    // Continuação da função construirResultadoHTML a partir de onde foi interrompido:

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
                <p>Localização: Latitude ${LATITUDE.toFixed(4)}, Longitude ${LONGITUDE.toFixed(4)}</p>
                <button id="atualizarDados" class="btn-atualizar">Atualizar Dados</button>
            </div>
        </div>
    `;
    
    return html;
}

// Adicionando evento para o botão de atualizar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('verificarBtn').addEventListener('click', async () => {
        document.getElementById('resultado').classList.remove('hidden');
        document.getElementById('resultado').innerHTML = '<p>Carregando dados...</p>';
        await verificarCondicoes();
    });

    // Evento para o botão de atualizar que será adicionado após a verificação
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'atualizarDados') {
            // Limpar o cache para forçar nova consulta
            ['faseLua', 'dadosChuva', 'dadosMare', 'proximoQuartoCrescente'].forEach(chave => {
                localStorage.removeItem(chave);
            });
            verificarCondicoes();
        }
    });
});

// Estilo CSS para o aplicativo (adicionar ao seu arquivo CSS ou incluir em uma tag style)
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

// Adiciona os estilos ao documento
document.addEventListener('DOMContentLoaded', () => {
    const styleEl = document.createElement('style');
    styleEl.textContent = estilos;
    document.head.appendChild(styleEl);
});

// Adiciona HTML básico se não existir
document.addEventListener('DOMContentLoaded', () => {
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
});