/**
 * Testes para o componente footer
 */
import { criarFooter, inicializarFooter } from '../ui/footer.js';

describe('Componente Footer', () => {
    // Setup
    beforeEach(() => {
        // Limpar o DOM antes de cada teste
        document.body.innerHTML = '<div class="container"></div>';
    });
    
    test('criarFooter deve retornar um elemento footer com a estrutura correta', () => {
        const footer = criarFooter();
        
        // Verificar se é um elemento footer
        expect(footer.tagName).toBe('FOOTER');
        expect(footer.className).toBe('footer-fixed');
        
        // Verificar se contém um container de conteúdo
        const footerContent = footer.querySelector('.footer-content');
        expect(footerContent).not.toBeNull();
        
        // Verificar se contém parágrafos com o conteúdo correto
        const paragrafos = footer.querySelectorAll('p');
        expect(paragrafos.length).toBe(3);
        
        // Verificar se os textos estão presentes
        const conteudoFooter = footer.textContent;
        expect(conteudoFooter).toContain('Mestre dos Mares');
        expect(conteudoFooter).toContain('2025');
        expect(conteudoFooter).toContain('StormGlass API');
        expect(conteudoFooter).toContain('OpenWeatherMap API');
        expect(conteudoFooter).toContain('Héric Moura');
        
        // Verificar badges de API
        const apiBadges = footer.querySelectorAll('.api-badge');
        expect(apiBadges.length).toBe(2);
    });
    
    test('inicializarFooter deve adicionar o footer ao container', () => {
        // Chamar a função
        inicializarFooter();
        
        // Verificar se o footer foi adicionado
        const footer = document.querySelector('.container footer');
        expect(footer).not.toBeNull();
        expect(footer.className).toBe('footer-fixed');
    });
    
    test('inicializarFooter deve substituir o footer existente', () => {
        // Adicionar um footer pré-existente
        const container = document.querySelector('.container');
        const footerExistente = document.createElement('footer');
        footerExistente.innerHTML = '<p>Footer antigo</p>';
        container.appendChild(footerExistente);
        
        // Verificar que temos um footer
        expect(document.querySelectorAll('footer').length).toBe(1);
        
        // Chamar a função
        inicializarFooter();
        
        // Verificar que ainda temos apenas um footer (substituído)
        expect(document.querySelectorAll('footer').length).toBe(1);
        
        // Verificar que o conteúdo foi atualizado
        const footer = document.querySelector('.container footer');
        const footerContent = footer.querySelector('.footer-content');
        expect(footerContent).not.toBeNull();
        
        // Verificar badges de API
        const apiBadges = footer.querySelectorAll('.api-badge');
        expect(apiBadges.length).toBe(2);
    });
}); 