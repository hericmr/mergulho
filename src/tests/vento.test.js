/**
 * Testes para o módulo de vento
 */
import { avaliarImpactoVento, checarVento } from '../modules/vento.js';
import { buscarDadosAPI } from '../api/cliente.js';

// Mock da função buscarDadosAPI
jest.mock('../api/cliente.js', () => ({
    buscarDadosAPI: jest.fn()
}));

describe('Módulo de Vento', () => {
    describe('avaliarImpactoVento()', () => {
        test('Deve classificar corretamente vento fraco (abaixo de 10 km/h)', () => {
            const resultado = avaliarImpactoVento(2.5, 'N');
            
            expect(resultado.intensidade).toBe('Fraco');
            expect(resultado.favoravel).toBe(true);
            expect(resultado.pontuacao).toBe(3);
            expect(parseFloat(resultado.velocidadeKmh)).toBeLessThan(10);
        });
        
        test('Deve classificar corretamente vento moderado (10-20 km/h)', () => {
            const resultado = avaliarImpactoVento(4.5, 'NE');
            
            expect(resultado.intensidade).toBe('Moderado');
            expect(resultado.favoravel).toBe(true);
            expect(resultado.pontuacao).toBe(2);
            expect(parseFloat(resultado.velocidadeKmh)).toBeGreaterThanOrEqual(10);
            expect(parseFloat(resultado.velocidadeKmh)).toBeLessThan(20);
        });
        
        test('Deve classificar corretamente vento forte (20-30 km/h)', () => {
            const resultado = avaliarImpactoVento(7.5, 'S');
            
            expect(resultado.intensidade).toBe('Forte');
            expect(resultado.favoravel).toBe(false);
            expect(resultado.pontuacao).toBe(1);
            expect(parseFloat(resultado.velocidadeKmh)).toBeGreaterThanOrEqual(20);
            expect(parseFloat(resultado.velocidadeKmh)).toBeLessThan(30);
        });
        
        test('Deve classificar corretamente vento muito forte (acima de 30 km/h)', () => {
            const resultado = avaliarImpactoVento(10, 'W');
            
            expect(resultado.intensidade).toBe('Muito Forte');
            expect(resultado.favoravel).toBe(false);
            expect(resultado.pontuacao).toBe(0);
            expect(parseFloat(resultado.velocidadeKmh)).toBeGreaterThanOrEqual(30);
        });
    });
    
    describe('checarVento()', () => {
        beforeEach(() => {
            // Limpar mock antes de cada teste
            buscarDadosAPI.mockClear();
        });
        
        test('Deve retornar dados estruturados corretamente quando API responde com sucesso', async () => {
            // Mock de resposta da API
            const mockApiResponse = {
                hours: [
                    {
                        time: '2023-06-01T12:00:00+00:00',
                        windSpeed: { sg: 5.2 },
                        windDirection: { sg: 45 }
                    }
                ]
            };
            
            buscarDadosAPI.mockResolvedValue(mockApiResponse);
            
            const resultado = await checarVento();
            
            expect(resultado).toHaveProperty('velocidade');
            expect(resultado).toHaveProperty('direcao');
            expect(resultado).toHaveProperty('direcaoCardinal');
            expect(resultado).toHaveProperty('avaliacao');
            expect(resultado.velocidade).toBe(5.2);
            expect(resultado.direcao).toBe(45);
            expect(resultado.direcaoCardinal).toBe('NE');
        });
        
        test('Deve lidar com erros da API corretamente', async () => {
            // Simular erro na API
            buscarDadosAPI.mockRejectedValueOnce(new Error('Erro de API'));
            
            const resultado = await checarVento();
            
            // Verificar que o resultado contém o tratamento de erro e valores padrão
            expect(resultado).toHaveProperty('avaliacao');
            expect(resultado.avaliacao).toBeDefined();
            expect(typeof resultado.velocidade).toBe('number');
            expect(typeof resultado.direcao).toBe('number');
            expect(resultado.direcaoCardinal).toBeDefined();
        });
    });
}); 