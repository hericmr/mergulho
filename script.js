// Configuração de variáveis
const apiKey = "bf5e8542-8a21-11ef-8d8d-0242ac130003-bf5e8614-8a21-11ef-8d8d-0242ac130003";
const lat = -23.9608;
const lon = -46.3336;

// Evento para exibir a div "resultado" e verificar condições ao clicar no botão
document.getElementById('verificarBtn').addEventListener('click', async () => {
    document.getElementById('resultado').classList.remove('hidden');
    await verificarCondicoes();  // Chama a função verificarCondicoes
});

// Função para verificar se é verão
function ehVerao() {
    const mes = new Date().getMonth() + 1; // Obtemos o mês (0 = janeiro, 11 = dezembro)
    return (mes === 12 || mes === 1 || mes === 2); // Verão no Brasil é de dezembro a fevereiro
}

// Função para calcular quantos dias faltam para o verão
function diasParaVerao() {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const inicioVerao = new Date(anoAtual, 11, 21); // 21 de dezembro do ano atual

    return Math.ceil((inicioVerao - hoje + (hoje > inicioVerao ? 365 * 24 * 60 * 60 * 1000 : 0)) / (1000 * 60 * 60 * 24));
}

// Função para calcular quantos dias faltam para o próximo Quarto Crescente
function diasParaProximoQuartoCrescente() {
    const fases_lunares = [
        new Date('2024-01-11 08:57'),
        new Date('2024-02-09 19:59'),
        new Date('2024-03-10 06:00'),
        new Date('2024-04-08 15:20'),
        new Date('2024-05-08 00:21'),
        new Date('2024-06-06 09:37'),
        new Date('2024-07-05 19:57'),
        new Date('2024-08-04 08:13'),
        new Date('2024-09-02 22:55'),
        new Date('2024-10-02 15:49'),
        new Date('2024-11-01 09:47'),
        new Date('2024-12-08 12:26')
    ];

    const hoje = new Date();
    const proximo_quarto_crescente = fases_lunares.find(data => data > hoje);
    
    if (proximo_quarto_crescente) {
        return Math.ceil((proximo_quarto_crescente - hoje) / (1000 * 60 * 60 * 24));
    } else {
        return "Não há mais Quartos Crescentes este ano.";
    }
}

// Função para exibir mensagens no resultado
function exibirResultado(html) {
    document.getElementById('resultado').innerHTML = html;
}

// Função para verificar condições de mergulho
async function verificarCondicoes() {
    const statusDiv = document.getElementById('status');
    exibirResultado(''); // Limpa o resultado
    statusDiv.textContent = 'Verificando...';

    try {
        const [faseDaLua, choveu, { mareAlta, mareBaixa }] = await Promise.all([
            checarFaseDaLua(),
            checarChuva(),
            checarMare()
        ]);

        statusDiv.textContent = 'Condições de mergulho verificadas!';
        let resultadoHtml = '';

        // Verifica se é verão
        if (ehVerao()) {
            resultadoHtml += '<p><strong>Estamos no verão!</strong> Condições favoráveis para mergulho!</p>';
        } else {
            const diasRestantes = diasParaVerao();
            resultadoHtml += `<p>Ainda não estamos no verão. Faltam ${diasRestantes} dias para o início do verão.</p>`;
        }

        // Exibe a fase da lua
        resultadoHtml += `<p><strong>Fase da lua:</strong> ${faseDaLua.texto}</p>`;
        resultadoHtml += faseDaLua.quartoCrescente ? 
            '<p>A lua está em Quarto Crescente, condições favoráveis para mergulho!</p>' : 
            '<p>A lua ainda não está na condição ideal que costuma ser o quarto crescente.</p>';

        // Calcula e exibe os dias para o próximo Quarto Crescente
        const diasParaQuartoCrescente = diasParaProximoQuartoCrescente();
        resultadoHtml += typeof diasParaQuartoCrescente === 'number' ?
            `<p>Faltam ${diasParaQuartoCrescente} dias para o próximo Quarto Crescente.</p>` :
            `<p>${diasParaQuartoCrescente}</p>`;

        // Verifica se choveu
        resultadoHtml += choveu ? 
            '<p>Como choveu nos últimos 3 dias, a visibilidade para mergulho pode estar prejudicada.</p>' : 
            '<p>Não choveu nos últimos 3 dias, a visibilidade na água fica melhor assim.</p>';

        // Exibe informações de maré
        resultadoHtml += mareAlta.length > 0 ? 
            '<p><strong>Próximas marés altas:</strong></p>' + mareAlta.map(mare => 
                `<p>Maré alta em: ${new Date(mare).toLocaleString()}</p>`).join('') : 
            '<p>Nenhuma informação de maré alta disponível.</p>';

        resultadoHtml += mareBaixa.length > 0 ? 
            '<p><strong>Próximas marés baixas:</strong></p>' + mareBaixa.map(mare => 
                `<p>Maré baixa em: ${new Date(mare).toLocaleString()}</p>`).join('') : 
            '<p>Nenhuma informação de maré baixa disponível.</p>';

        exibirResultado(resultadoHtml);

    } catch (error) {
        console.error(error);
        statusDiv.textContent = 'Erro ao verificar as condições. Tente novamente mais tarde.';
    }
}

// Função para checar a fase da lua
async function checarFaseDaLua() {
    const start = Math.floor(Date.now() / 1000);
    const url = `https://api.stormglass.io/v2/astronomy/point?lat=${lat}&lng=${lon}&start=${start}`;

    const resposta = await fetch(url, {
        headers: { 'Authorization': apiKey }
    });

    if (resposta.ok) {
        const dados = await resposta.json();
        const faseLua = dados.data[0].moonPhase.current.text;
        return {
            texto: faseLua,
            quartoCrescente: faseLua === 'First quarter'
        };
    } else {
        throw new Error('Erro ao consultar a fase da lua.');
    }
}

// Função para checar se choveu
async function checarChuva() {
    const start = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);
    const url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&start=${start}&params=precipitation`;

    const resposta = await fetch(url, {
        headers: { 'Authorization': apiKey }
    });

    if (resposta.ok) {
        const dados = await resposta.json();
        return dados.hours.some(entry => entry.precipitation.sg > 0);
    } else {
        throw new Error('Erro ao consultar a chuva.');
    }
}

// Função para checar maré
async function checarMare() {
    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lon}`;

    const resposta = await fetch(url, {
        headers: { 'Authorization': apiKey }
    });

    if (resposta.ok) {
        const dados = await resposta.json();
        return {
            mareAlta: dados.data.filter(entry => entry.type === 'high').map(entry => entry.time),
            mareBaixa: dados.data.filter(entry => entry.type === 'low').map(entry => entry.time)
        };
    } else {
        throw new Error('Erro ao consultar a maré.');
    }
}
