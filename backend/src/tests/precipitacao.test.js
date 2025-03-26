/**
 * Testes para o módulo de precipitação
 */
import { avaliarImpactoChuva, checarChuva } from '../modules/precipitacao.js';
import { buscarDadosAPI } from '../api/cliente.js';
import { obterCache, definirCache } from '../utils/cache.js';

// Mock para módulos externos
jest.mock('../api/cliente.js');
jest.mock('../utils/cache.js');

describe('Módulo de Precipitação', () => {
    // Restaurar todos os mocks após cada teste
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('avaliarImpactoChuva()', () => {
        test('Deve retornar impacto alto para chuva intensa', () => {
            const resultado = avaliarImpactoChuva(25, 10);
            expect(resultado.nivel).toBe('Alto');
        });
        
        test('Deve retornar impacto alto para chuva prolongada', () => {
            const resultado = avaliarImpactoChuva(15, 26);
            expect(resultado.nivel).toBe('Alto');
        });
        
        test('Deve retornar impacto médio para chuva moderada', () => {
            const resultado = avaliarImpactoChuva(15, 10);
            expect(resultado.nivel).toBe('Médio');
        });
        
        test('Deve retornar impacto baixo para chuva leve', () => {
            const resultado = avaliarImpactoChuva(5, 5);
            expect(resultado.nivel).toBe('Baixo');
        });
        
        test('Deve retornar impacto muito baixo sem chuva significativa', () => {
            const resultado = avaliarImpactoChuva(1, 2);
            expect(resultado.nivel).toBe('Muito Baixo');
        });
    });
    
    describe('checarChuva()', () => {
        test('Deve retornar dados do cache quando disponíveis', async () => {
            const dadosCache = {
                choveu: true,
                totalPrecipitacao: '15.50',
                horasComChuva: 8,
                detalhes: {
                    chuvaForte: true,
                    chuvaPersistente: false,
                    impactoVisibilidade: { nivel: 'Médio' }
                }
            };
            
            obterCache.mockReturnValue(dadosCache);
            
            const resultado = await checarChuva();
            
            expect(obterCache).toHaveBeenCalledWith('dadosChuva');
            expect(buscarDadosAPI).not.toHaveBeenCalled();
            expect(resultado).toEqual(dadosCache);
        });
        
        test('Deve buscar dados da API quando cache não disponível', async () => {
            // Simular cache vazio
            obterCache.mockReturnValue(null);
            
            // Dados de retorno da API simulados
            const apiResponse = {
                hours: [
                    { precipitation: { sg: 1.5 } },
                    { precipitation: { sg: 0 } },
                    { precipitation: { sg: 2.3 } },
                    { precipitation: { sg: 3.1 } },
                    { precipitation: { sg: 0 } },
                    { precipitation: { sg: 0.2 } }
                ]
            };
            
            buscarDadosAPI.mockResolvedValue(apiResponse);
            
            const resultado = await checarChuva();
            
            expect(buscarDadosAPI).toHaveBeenCalled();
            expect(definirCache).toHaveBeenCalled();
            
            // Total de precipitação: 1.5 + 0 + 2.3 + 3.1 + 0 + 0.2 = 7.1
            // Horas com chuva: 4 horas (excluindo os zeros)
            expect(resultado.choveu).toBe(true);
            expect(resultado.totalPrecipitacao).toBe('7.10');
            expect(resultado.horasComChuva).toBe(4);
        });
        
        test('Deve lidar com erros da API', async () => {
            obterCache.mockReturnValue(null);
            buscarDadosAPI.mockRejectedValue(new Error('Erro de API'));
            
            const resultado = await checarChuva();
            
            expect(resultado.choveu).toBe(false);
            expect(resultado.erro).toBe('Erro de API');
        });
        
        test('Deve classificar corretamente o impacto da chuva', async () => {
            obterCache.mockReturnValue(null);
            
            // Simular chuva leve
            const apiResponse = {
                hours: Array(5).fill({ precipitation: { sg: 0.5 } })
            };
            
            buscarDadosAPI.mockResolvedValue(apiResponse);
            
            const resultado = await checarChuva();
            
            expect(resultado.detalhes.impactoVisibilidade.nivel).toBe('Muito Baixo');
            
            // Simular chuva forte
            const apiResponseForte = {
                hours: Array(15).fill({ precipitation: { sg: 1.0 } })
            };
            
            buscarDadosAPI.mockResolvedValue(apiResponseForte);
            
            const resultadoForte = await checarChuva();
            
            expect(resultadoForte.detalhes.impactoVisibilidade.nivel).toBe('Médio');
        });
    });
}); 