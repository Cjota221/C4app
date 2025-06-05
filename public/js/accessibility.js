/* C4 App - Gerenciador de Acessibilidade */
/* Funcionalidades de acessibilidade, navegação por teclado e leitores de tela */

class C4AccessibilityManager {
    constructor() {
        this.isKeyboardNavigation = false;
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');
        
        this.announcer = null;
        this.focusHistory = [];
        this.currentModal = null;
        
        this.init();
    }
    
    init() {
        this.createAnnouncer();
        this.setupKeyboardDetection();
        this.setupSkipLinks();
        this.setupFocusManagement();
        this.setupModalAccessibility();
        this.setupFormAccessibility();
        this.setupLiveRegions();
    }
    
    // ========================================
    // ANUNCIADOR PARA LEITORES DE TELA
    // ========================================
    
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'c4-sr-only';
        this.announcer.id = 'c4-announcer';
        document.body.appendChild(this.announcer);
    }
    
    announce(message, priority = 'polite') {
        if (!this.announcer) return;
        
        // Limpar mensagem anterior
        this.announcer.textContent = '';
        
        // Definir prioridade
        this.announcer.setAttribute('aria-live', priority);
        
        // Anunciar nova mensagem após pequeno delay
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);
        
        // Limpar após 5 segundos
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 5000);
    }
    
    // ========================================
    // DETECÇÃO DE NAVEGAÇÃO POR TECLADO
    // ========================================
    
    setupKeyboardDetection() {
        // Detectar uso do teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.isKeyboardNavigation = true;
                document.body.classList.add('c4-keyboard-navigation');
            }
        });
        
        // Detectar uso do mouse
        document.addEventListener('mousedown', () => {
            this.isKeyboardNavigation = false;
            document.body.classList.remove('c4-keyboard-navigation');
        });
        
        // Atalhos de teclado globais
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
    }
    
    handleGlobalKeyboard(e) {
        // Alt + M: Abrir/fechar menu
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            const menuToggle = document.querySelector('.c4-menu-toggle');
            if (menuToggle) {
                menuToggle.click();
                this.announce('Menu de navegação alternado');
            }
        }
        
        // Alt + S: Ir para conteúdo principal
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            const mainContent = document.querySelector('.c4-main-content');
            if (mainContent) {
                mainContent.focus();
                this.announce('Navegando para conteúdo principal');
            }
        }
        
        // Alt + H: Ir para o topo
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const header = document.querySelector('.c4-header');
            if (header) {
                header.focus();
                this.announce('Navegando para o topo da página');
            }
        }
        
        // Escape: Fechar modais/menus
        if (e.key === 'Escape') {
            this.handleEscape();
        }
    }
    
    handleEscape() {
        // Fechar modal ativo
        if (this.currentModal) {
            this.closeModal(this.currentModal);
            return;
        }
        
        // Fechar menu lateral
        const sidebar = document.querySelector('.c4-sidebar.open');
        if (sidebar && window.C4MenuManager) {
            window.C4MenuManager.close();
            return;
        }
        
        // Fechar FAB menu
        const fabMenu = document.querySelector('.c4-fab-menu.open');
        if (fabMenu && window.C4FABManager) {
            window.C4FABManager.closeMenu();
            return;
        }
    }
    
    // ========================================
    // SKIP LINKS
    // ========================================
    
    setupSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'c4-skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="c4-skip-link">Pular para conteúdo principal</a>
            <a href="#navigation" class="c4-skip-link">Pular para navegação</a>
            <a href="#footer" class="c4-skip-link">Pular para rodapé</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
        
        // Adicionar IDs aos elementos de destino
        this.addSkipTargets();
    }
    
    addSkipTargets() {
        const mainContent = document.querySelector('.c4-main-content');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
            mainContent.setAttribute('tabindex', '-1');
        }
        
        const navigation = document.querySelector('.c4-sidebar-nav, .c4-nav');
        if (navigation && !navigation.id) {
            navigation.id = 'navigation';
            navigation.setAttribute('tabindex', '-1');
        }
    }
    
    // ========================================
    // GERENCIAMENTO DE FOCO
    // ========================================
    
    setupFocusManagement() {
        // Salvar foco anterior ao abrir modais/menus
        document.addEventListener('focusin', (e) => {
            if (!this.isInModal(e.target)) {
                this.focusHistory.push(e.target);
                // Manter apenas os últimos 5 elementos
                if (this.focusHistory.length > 5) {
                    this.focusHistory.shift();
                }
            }
        });
        
        // Gerenciar foco em elementos dinâmicos
        this.setupDynamicFocus();
    }
    
    setupDynamicFocus() {
        // Observer para novos elementos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.enhanceElementAccessibility(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    enhanceElementAccessibility(element) {
        // Adicionar aria-labels ausentes
        this.addMissingAriaLabels(element);
        
        // Configurar navegação por teclado
        this.setupElementKeyboardNav(element);
        
        // Adicionar descrições para leitores de tela
        this.addScreenReaderDescriptions(element);
    }
    
    addMissingAriaLabels(element) {
        // Botões sem aria-label
        const buttons = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            const text = button.textContent.trim();
            const icon = button.querySelector('.c4-sidebar-item-icon, .c4-fab-option-icon');
            
            if (!text && icon) {
                // Botão apenas com ícone
                const iconText = this.getIconDescription(icon.textContent);
                button.setAttribute('aria-label', iconText);
            } else if (text) {
                button.setAttribute('aria-label', text);
            }
        });
        
        // Inputs sem label
        const inputs = element.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        inputs.forEach(input => {
            const label = input.closest('.c4-form-group')?.querySelector('label');
            if (label) {
                const labelId = label.id || `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                label.id = labelId;
                input.setAttribute('aria-labelledby', labelId);
            } else {
                // Tentar usar placeholder como fallback
                const placeholder = input.getAttribute('placeholder');
                if (placeholder) {
                    input.setAttribute('aria-label', placeholder);
                }
            }
        });
        
        // Links sem texto descritivo
        const links = element.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
        links.forEach(link => {
            const text = link.textContent.trim();
            if (!text || text.length < 3) {
                const href = link.getAttribute('href');
                if (href) {
                    link.setAttribute('aria-label', `Navegar para ${href}`);
                }
            }
        });
    }
    
    getIconDescription(iconText) {
        const iconMap = {
            '📊': 'Dashboard',
            '📦': 'Produtos',
            '💰': 'Vendas',
            '👥': 'Clientes',
            '🎯': 'Metas',
            '💸': 'Despesas',
            '📈': 'Relatórios',
            '🧮': 'Calculadoras',
            '💎': 'Lucro Certo',
            '🤖': 'Assistente IA',
            '👤': 'Perfil',
            '+': 'Adicionar',
            '×': 'Fechar',
            '☰': 'Menu'
        };
        
        return iconMap[iconText] || 'Botão';
    }
    
    setupElementKeyboardNav(element) {
        // Navegação em listas
        const lists = element.querySelectorAll('.c4-list-navigation, .c4-sidebar-nav');
        lists.forEach(list => {
            this.setupListKeyboardNav(list);
        });
        
        // Navegação em grids
        const grids = element.querySelectorAll('.c4-grid-2-col, .c4-grid-3-col');
        grids.forEach(grid => {
            this.setupGridKeyboardNav(grid);
        });
    }
    
    setupListKeyboardNav(list) {
        const items = list.querySelectorAll('a, button, [tabindex]');
        
        list.addEventListener('keydown', (e) => {
            const currentIndex = Array.from(items).indexOf(e.target);
            let nextIndex;
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                    items[nextIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    items[0].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    items[items.length - 1].focus();
                    break;
            }
        });
    }
    
    setupGridKeyboardNav(grid) {
        const items = grid.querySelectorAll('.c4-card-clickable, a, button');
        const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
        
        grid.addEventListener('keydown', (e) => {
            const currentIndex = Array.from(items).indexOf(e.target);
            let nextIndex;
            
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                    items[nextIndex].focus();
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = currentIndex + columns;
                    if (nextIndex < items.length) {
                        items[nextIndex].focus();
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = currentIndex - columns;
                    if (nextIndex >= 0) {
                        items[nextIndex].focus();
                    }
                    break;
            }
        });
    }
    
    // ========================================
    // ACESSIBILIDADE DE MODAIS
    // ========================================
    
    setupModalAccessibility() {
        // Observer para novos modais
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const modal = node.querySelector?.('.c4-modal') || 
                                     (node.classList?.contains('c4-modal') ? node : null);
                        if (modal) {
                            this.setupModalFocusTrap(modal);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    setupModalFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(this.focusableElements);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        // Configurar atributos ARIA
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        
        // Adicionar título se não existir
        if (!modal.getAttribute('aria-labelledby')) {
            const title = modal.querySelector('.c4-modal-title, h1, h2, h3');
            if (title) {
                const titleId = title.id || `modal-title-${Date.now()}`;
                title.id = titleId;
                modal.setAttribute('aria-labelledby', titleId);
            }
        }
        
        // Focus trap
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
        
        // Focar no primeiro elemento
        setTimeout(() => {
            firstFocusable?.focus();
        }, 100);
        
        this.currentModal = modal;
    }
    
    closeModal(modal) {
        this.currentModal = null;
        
        // Restaurar foco anterior
        const previousFocus = this.focusHistory.pop();
        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
        }
        
        this.announce('Modal fechado');
    }
    
    // ========================================
    // ACESSIBILIDADE DE FORMULÁRIOS
    // ========================================
    
    setupFormAccessibility() {
        document.addEventListener('submit', (e) => {
            this.validateFormAccessibility(e.target);
        });
        
        // Melhorar feedback de validação
        document.addEventListener('invalid', (e) => {
            this.handleInvalidField(e.target);
        }, true);
        
        // Anunciar mudanças em campos
        document.addEventListener('change', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.announceFieldChange(e.target);
            }
        });
    }
    
    validateFormAccessibility(form) {
        const errors = [];
        
        // Verificar campos obrigatórios
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`Campo ${this.getFieldLabel(field)} é obrigatório`);
            }
        });
        
        // Anunciar erros
        if (errors.length > 0) {
            this.announce(`Formulário contém ${errors.length} erro(s): ${errors.join(', ')}`, 'assertive');
        }
    }
    
    handleInvalidField(field) {
        const label = this.getFieldLabel(field);
        const message = field.validationMessage;
        
        this.announce(`Erro no campo ${label}: ${message}`, 'assertive');
        
        // Adicionar classe de erro
        field.classList.add('error');
        field.closest('.c4-form-group')?.classList.add('error');
    }
    
    announceFieldChange(field) {
        const label = this.getFieldLabel(field);
        const value = field.value;
        
        if (field.type === 'checkbox') {
            const state = field.checked ? 'marcado' : 'desmarcado';
            this.announce(`${label} ${state}`);
        } else if (field.type === 'radio') {
            this.announce(`${label} selecionado: ${value}`);
        } else if (field.tagName === 'SELECT') {
            const selectedOption = field.options[field.selectedIndex];
            this.announce(`${label} alterado para: ${selectedOption.text}`);
        }
    }
    
    getFieldLabel(field) {
        // Tentar encontrar label associado
        const label = document.querySelector(`label[for="${field.id}"]`) ||
                     field.closest('.c4-form-group')?.querySelector('label') ||
                     field.closest('label');
        
        if (label) {
            return label.textContent.trim();
        }
        
        // Fallback para aria-label ou placeholder
        return field.getAttribute('aria-label') ||
               field.getAttribute('placeholder') ||
               field.name ||
               'Campo';
    }
    
    // ========================================
    // LIVE REGIONS
    // ========================================
    
    setupLiveRegions() {
        // Criar regiões live para diferentes tipos de anúncios
        this.createLiveRegion('c4-status', 'status');
        this.createLiveRegion('c4-alerts', 'alert');
        this.createLiveRegion('c4-log', 'log');
    }
    
    createLiveRegion(id, role) {
        if (document.getElementById(id)) return;
        
        const region = document.createElement('div');
        region.id = id;
        region.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.setAttribute('role', role);
        region.className = 'c4-sr-only';
        document.body.appendChild(region);
    }
    
    announceStatus(message) {
        const region = document.getElementById('c4-status');
        if (region) {
            region.textContent = message;
            setTimeout(() => region.textContent = '', 3000);
        }
    }
    
    announceAlert(message) {
        const region = document.getElementById('c4-alerts');
        if (region) {
            region.textContent = message;
            setTimeout(() => region.textContent = '', 5000);
        }
    }
    
    announceLog(message) {
        const region = document.getElementById('c4-log');
        if (region) {
            region.textContent = message;
            setTimeout(() => region.textContent = '', 2000);
        }
    }
    
    // ========================================
    // UTILITÁRIOS
    // ========================================
    
    isInModal(element) {
        return element.closest('.c4-modal') !== null;
    }
    
    addScreenReaderDescriptions(element) {
        // Adicionar descrições para elementos complexos
        const cards = element.querySelectorAll('.c4-card');
        cards.forEach(card => {
            if (!card.getAttribute('aria-describedby')) {
                const description = this.generateCardDescription(card);
                if (description) {
                    const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const descElement = document.createElement('div');
                    descElement.id = descId;
                    descElement.className = 'c4-sr-description';
                    descElement.textContent = description;
                    card.appendChild(descElement);
                    card.setAttribute('aria-describedby', descId);
                }
            }
        });
    }
    
    generateCardDescription(card) {
        const title = card.querySelector('.c4-card-title')?.textContent;
        const content = card.querySelector('.c4-card-body')?.textContent;
        
        if (title && content) {
            return `Card ${title}: ${content.substring(0, 100)}...`;
        }
        
        return null;
    }
    
    // Método público para anunciar mensagens
    static announce(message, priority = 'polite') {
        if (window.C4AccessibilityManager) {
            window.C4AccessibilityManager.announce(message, priority);
        }
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    window.C4AccessibilityManager = new C4AccessibilityManager();
});

// Exportar para uso global
window.C4 = window.C4 || {};
window.C4.AccessibilityManager = C4AccessibilityManager;

