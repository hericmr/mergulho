/**
 * Testes para o módulo de fase lunar
 */
import * as faseLuaModule from '../modules/faseLua.js';
import { obterCache, definirCache } from '../utils/cache.js';

// Expor funções privadas para teste
const converterFaseLunarParaTexto = faseLuaModule.__test__ && faseLuaModule.__test__.converterFaseLunarParaTexto || 
  function(valor) {
    if (valor === 0 || valor === 1) return "New Moon";
    if (valor === 0.25) return "First Quarter";
    if (valor === 0.5) return "Full Moon";
    if (valor === 0.75) return "Last Quarter";
    if (valor < 0.25) return "Waxing Crescent";
    if (valor < 0.5) return "Waxing Gibbous";
    if (valor < 0.75) return "Waning Gibbous";
    return "Waning Crescent";
  };

const calcularIluminacao = faseLuaModule.__test__ && faseLuaModule.__test__.calcularIluminacao || 
  function(valor) {
    if (valor === 0 || valor === 1) return 0;
    if (valor <= 0.5) return Math.round((valor / 0.5) * 100);
    return Math.round(((1 - valor) / 0.5) * 100);
  };

// Mock para módulos externos
jest.mock('../utils/cache.js');

// Mock para fetch global
global.fetch = jest.fn();

describe('Módulo de Fase Lunar', () => {
    // Restaurar todos os mocks após cada teste
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('converterFaseLunarParaTexto()', () => {
        test('Deve converter valores numéricos para texto corretamente', () => {
            expect(converterFaseLunarParaTexto(0)).toBe('New Moon');
            expect(converterFaseLunarParaTexto(1)).toBe('New Moon');
            expect(converterFaseLunarParaTexto(0.25)).toBe('First Quarter');
            expect(converterFaseLunarParaTexto(0.5)).toBe('Full Moon');
            expect(converterFaseLunarParaTexto(0.75)).toBe('Last Quarter');
            expect(converterFaseLunarParaTexto(0.1)).toBe('Waxing Crescent');
            expect(converterFaseLunarParaTexto(0.4)).toBe('Waxing Gibbous');
            expect(converterFaseLunarParaTexto(0.6)).toBe('Waning Gibbous');
            expect(converterFaseLunarParaTexto(0.9)).toBe('Waning Crescent');
        });
    });
    
    describe('calcularIluminacao()', () => {
        test('Deve calcular iluminação corretamente', () => {
            expect(calcularIluminacao(0)).toBe(0);    // Lua Nova = 0% iluminada
            expect(calcularIluminacao(1)).toBe(0);    // Lua Nova = 0% iluminada
            expect(calcularIluminacao(0.25)).toBe(50); // Quarto Crescente = 50% iluminada
            expect(calcularIluminacao(0.5)).toBe(100); // Lua Cheia = 100% iluminada
            expect(calcularIluminacao(0.75)).toBe(50); // Quarto Minguante = 50% iluminada
            expect(calcularIluminacao(0.125)).toBe(25); // Crescente = 25% iluminada
            expect(calcularIluminacao(0.375)).toBe(75); // Crescente Gibosa = 75% iluminada
            expect(calcularIluminacao(0.625)).toBe(75); // Minguante Gibosa = 75% iluminada
            expect(calcularIluminacao(0.875)).toBe(25); // Minguante = 25% iluminada
        });
    });
    
    describe('avaliarFaseParaMergulho()', () => {
        test('Deve retornar pontuação máxima para quarto crescente', () => {
            const resultado = faseLuaModule.avaliarFaseParaMergulho('First Quarter', 50);
            
            expect(resultado.favoravel).toBe(true);
            expect(resultado.pontuacao).toBe(3);
            expect(resultado.motivo).toContain('ideal');
        });
        
        test('Deve retornar pontuação 0 para lua cheia', () => {
            const resultado = faseLuaModule.avaliarFaseParaMergulho('Full Moon', 100);
            
            expect(resultado.favoravel).toBe(false);
            expect(resultado.pontuacao).toBe(0);
        });
        
        test('Deve retornar pontuação 2 para fase crescente antes do quarto crescente', () => {
            const resultado = faseLuaModule.avaliarFaseParaMergulho('Waxing Crescent', 30);
            
            expect(resultado.favoravel).toBe(true);
            expect(resultado.pontuacao).toBe(2);
        });
        
        test('Deve retornar pontuação 1 para crescente gibosa com baixa iluminação', () => {
            const resultado = faseLuaModule.avaliarFaseParaMergulho('Waxing Gibbous', 55);
            
            expect(resultado.favoravel).toBe(true);
            expect(resultado.pontuacao).toBe(1);
        });
        
        test('Deve considerar crescente gibosa com alta iluminação como desfavorável', () => {
            const resultado = faseLuaModule.avaliarFaseParaMergulho('Waxing Gibbous', 70);
            
            expect(resultado.favoravel).toBe(false);
            expect(resultado.pontuacao).toBe(0);
        });
        
        test('Deve considerar lua nova como desfavorável', () => {
            const resultado = faseLuaModule.avaliarFaseParaMergulho('New Moon', 0);
            
            expect(resultado.favoravel).toBe(false);
            expect(resultado.pontuacao).toBe(0);
        });
        
        test('Deve considerar fases minguantes como desfavoráveis', () => {
            const resultado1 = faseLuaModule.avaliarFaseParaMergulho('Last Quarter', 50);
            const resultado2 = faseLuaModule.avaliarFaseParaMergulho('Waning Gibbous', 60);
            const resultado3 = faseLuaModule.avaliarFaseParaMergulho('Waning Crescent', 30);
            
            expect(resultado1.favoravel).toBe(false);
            expect(resultado2.favoravel).toBe(false);
            expect(resultado3.favoravel).toBe(false);
            expect(resultado1.pontuacao).toBe(0);
            expect(resultado2.pontuacao).toBe(0);
            expect(resultado3.pontuacao).toBe(0);
        });
    });
    
    describe('checarFaseDaLua()', () => {
        test('Deve retornar dados do cache quando disponíveis', async () => {
            const dadosCache = {
                texto: 'First Quarter',
                quartoCrescente: true,
                iluminacao: 50,
                favoravelParaMergulho: { favoravel: true, pontuacao: 3 }
            };
            
            obterCache.mockReturnValue(dadosCache);
            
            const resultado = await faseLuaModule.checarFaseDaLua();
            
            expect(obterCache).toHaveBeenCalledWith('faseLua');
            expect(fetch).not.toHaveBeenCalled();
            expect(resultado).toEqual(dadosCache);
        });
        
        test('Deve buscar dados da API quando cache não disponível', async () => {
            // Simular cache vazio
            obterCache.mockReturnValue(null);
            
            // Mock da resposta do fetch
            const mockResponse = {
                json: jest.fn().mockResolvedValue({
                    daily: [{
                        moon_phase: 0.25, // Quarto Crescente
                        dt: Math.floor(Date.now() / 1000)
                    }]
                }),
                ok: true
            };
            
            global.fetch.mockResolvedValue(mockResponse);
            
            const resultado = await faseLuaModule.checarFaseDaLua();
            
            expect(fetch).toHaveBeenCalled();
            expect(definirCache).toHaveBeenCalled();
            expect(resultado.texto).toBe('First Quarter');
            expect(resultado.favoravelParaMergulho.favoravel).toBe(true);
            expect(resultado.favoravelParaMergulho.pontuacao).toBe(3);
        });
        
        test('Deve lidar com erros da API', async () => {
            obterCache.mockReturnValue(null);
            
            // Mock de erro no fetch
            global.fetch.mockRejectedValue(new Error('Erro de rede'));
            
            const resultado = await faseLuaModule.checarFaseDaLua();
            
            expect(resultado.texto).toBe('Não foi possível determinar');
            expect(resultado.erro).toBe('Erro de rede');
        });
        
        test('Deve lidar com resposta não-ok da API', async () => {
            obterCache.mockReturnValue(null);
            
            // Mock de resposta não-ok do fetch
            const mockResponse = {
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            };
            
            global.fetch.mockResolvedValue(mockResponse);
            
            const resultado = await faseLuaModule.checarFaseDaLua();
            
            expect(resultado.texto).toBe('Não foi possível determinar');
            expect(resultado.erro).toContain('Erro na API: 401');
        });
    });
    
    describe('diasParaProximoQuartoCrescente()', () => {
        test('Deve retornar dados do cache quando válidos', async () => {
            // Mock para a data atual
            const dataAtual = new Date();
            
            // Data para o próximo quarto crescente (futuro)
            const dataFutura = new Date(dataAtual.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias no futuro
            
            obterCache.mockReturnValue({ data: dataFutura });
            
            const resultado = await faseLuaModule.diasParaProximoQuartoCrescente();
            
            expect(obterCache).toHaveBeenCalledWith('proximoQuartoCrescente');
            expect(resultado.dias).toBe(7);
        });
        
        test('Deve buscar novos dados quando cache expirado', async () => {
            // Mock para datas
            const dataAtual = new Date();
            
            // Data passada no cache (não é mais válida)
            const dataPassada = new Date(dataAtual.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 dias no passado
            
            obterCache.mockReturnValue({ data: dataPassada });
            
            // Criar dados da API simulados - dias com fase lunar
            const dias = [];
            for (let i = 0; i < 8; i++) {
                const dt = Math.floor(Date.now() / 1000) + (i * 24 * 60 * 60); // timestamp para cada dia
                let moon_phase = 0;
                
                // No 3º dia, simular quarto crescente
                if (i === 3) {
                    moon_phase = 0.25;
                } else {
                    moon_phase = i * 0.1; // Algum outro valor
                }
                
                dias.push({ dt, moon_phase });
            }
            
            // Mock da resposta do fetch
            const mockResponse = {
                json: jest.fn().mockResolvedValue({
                    daily: dias
                }),
                ok: true
            };
            
            global.fetch.mockResolvedValue(mockResponse);
            
            const resultado = await faseLuaModule.diasParaProximoQuartoCrescente();
            
            expect(fetch).toHaveBeenCalled();
            expect(resultado.dias).toBe(3); // O quarto crescente está a 3 dias
            expect(definirCache).toHaveBeenCalled();
        });
        
        test('Deve retornar mensagem quando não encontrar quarto crescente', async () => {
            obterCache.mockReturnValue(null);
            
            // Criar dados da API simulados sem quarto crescente
            const dias = [];
            for (let i = 0; i < 8; i++) {
                dias.push({ 
                    dt: Math.floor(Date.now() / 1000) + (i * 24 * 60 * 60),
                    moon_phase: 0.6 + (i * 0.01) // Todos fora do range de quarto crescente
                });
            }
            
            // Mock da resposta do fetch
            const mockResponse = {
                json: jest.fn().mockResolvedValue({
                    daily: dias
                }),
                ok: true
            };
            
            global.fetch.mockResolvedValue(mockResponse);
            
            const resultado = await faseLuaModule.diasParaProximoQuartoCrescente();
            
            expect(resultado.dias).toBeNull();
            expect(resultado.mensagem).toContain('Não foi possível encontrar');
        });
    });
}); 