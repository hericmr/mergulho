/**
 * Testes para o módulo de estação
 */
import { ehVerao, diasParaVerao } from '../modules/estacao.js';
import { LOCALIZACAO } from '../config.js';

describe('Módulo de Estação', () => {
    // Mock para a data atual
    let originalDate;
    
    beforeEach(() => {
        // Salvar a implementação original de Date
        originalDate = global.Date;
    });
    
    afterEach(() => {
        // Restaurar a implementação original após cada teste
        global.Date = originalDate;
    });
    
    describe('ehVerao()', () => {
        test('Deve retornar true quando for verão no hemisfério sul', () => {
            // Mock: 15 de janeiro (verão no hemisfério sul)
            const mockDate = new Date(2023, 0, 15); // Janeiro é 0
            global.Date = jest.fn(() => mockDate);
            
            // Forçar hemisfério sul
            LOCALIZACAO.HEMISFERIO_SUL = true;
            
            expect(ehVerao()).toBe(true);
        });
        
        test('Deve retornar false quando não for verão no hemisfério sul', () => {
            // Mock: 15 de junho (inverno no hemisfério sul)
            const mockDate = new Date(2023, 5, 15); // Junho é 5
            global.Date = jest.fn(() => mockDate);
            
            // Forçar hemisfério sul
            LOCALIZACAO.HEMISFERIO_SUL = true;
            
            expect(ehVerao()).toBe(false);
        });
        
        test('Deve retornar true quando for verão no hemisfério norte', () => {
            // Mock: 15 de julho (verão no hemisfério norte)
            const mockDate = new Date(2023, 6, 15); // Julho é 6
            global.Date = jest.fn(() => mockDate);
            
            // Forçar hemisfério norte
            LOCALIZACAO.HEMISFERIO_SUL = false;
            
            expect(ehVerao()).toBe(true);
        });
    });
    
    describe('diasParaVerao()', () => {
        test('Deve retornar 0 quando já for verão no hemisfério sul', () => {
            // Mock: 1 de janeiro (meio do verão no hemisfério sul)
            const mockDate = new Date(2023, 0, 1);
            global.Date = jest.fn(() => mockDate);
            global.Date.now = jest.fn(() => mockDate.getTime());
            
            // Permitir que Date seja chamado com argumentos (para criar novas datas)
            global.Date.prototype = originalDate.prototype;
            
            // Forçar hemisfério sul
            LOCALIZACAO.HEMISFERIO_SUL = true;
            
            expect(diasParaVerao()).toBe(0);
        });
        
        test('Deve calcular dias até o verão quando não for verão no hemisfério sul', () => {
            // Mock: 1 de maio (outono no hemisfério sul)
            const mockDate = new Date(2023, 4, 1);
            global.Date = jest.fn(() => mockDate);
            global.Date.now = jest.fn(() => mockDate.getTime());
            
            // Permitir que Date seja chamado com argumentos (para criar novas datas)
            global.Date.prototype = originalDate.prototype;
            
            // Forçar hemisfério sul
            LOCALIZACAO.HEMISFERIO_SUL = true;
            
            // Resultado esperado: dias até 21 de dezembro
            const diasEsperados = Math.ceil((new Date(2023, 11, 21) - mockDate) / (1000 * 60 * 60 * 24));
            
            expect(diasParaVerao()).toBe(diasEsperados);
        });
    });
}); 