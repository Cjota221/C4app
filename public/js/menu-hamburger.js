/* C4 App - Menu Hambúrguer e Navegação Mobile */
/* Sistema de navegação lateral responsivo e touch-friendly */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o gerenciador de menu
    const menuManager = new C4MenuManager();
    
    // Inicializar o gerenciador de FAB (botão flutuante)
    const fabManager = new C4FABManager();
    
    // Destacar a página atual no menu
    menuManager.highlightCurrentPage();
});

class C4MenuManager {
    constructor() {
        this.sidebar = null;
        this.overlay = null;
        this.menuToggle = null;
        this.isOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isSwipeGesture = false;
        
        this.init();
    }
    
    init() {
        this.createMenuStructure();
        this.bindEvents();
        this.setupSwipeGestures();
        this.setupKeyboardNavigation();
    }
    
    createMenuStructure() {
        // Criar overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'c4-sidebar-overlay';
        document.body.appendChild(this.overlay);
        
        // Criar sidebar
        this.sidebar = document.createElement('aside');
        this.sidebar.className = 'c4-sidebar';
        this.sidebar.setAttribute('aria-label', 'Menu de navegação');
        this.sidebar.innerHTML = this.getMenuHTML();
        document.body.appendChild(this.sidebar);
        
        // Encontrar ou criar botão toggle
        this.menuToggle = document.querySelector('.c4-menu-toggle');
        if (!this.menuToggle) {
            this.createMenuToggle();
        }
    }
    
    createMenuToggle() {
        const header = document.querySelector('header') || document.querySelector('.c4-header') || document.querySelector('.header-main');
        if (!header) {
            // Se não encontrar um header, cria um botão flutuante
            this.createFloatingMenuToggle();
            return;
        }
        
        this.menuToggle = document.createElement('button');
        this.menuToggle.className = 'c4-menu-toggle';
        this.menuToggle.setAttribute('aria-label', 'Abrir menu de navegação');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.innerHTML = `
            <div class="c4-hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        // Inserir no início do header
        header.insertBefore(this.menuToggle, header.firstChild);
    }
    
    createFloatingMenuToggle() {
        this.menuToggle = document.createElement('button');
        this.menuToggle.className = 'c4-menu-toggle c4-menu-toggle-floating';
        this.menuToggle.setAttribute('aria-label', 'Abrir menu de navegação');
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.innerHTML = `
            <div class="c4-hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        // Estilizar como botão flutuante
        this.menuToggle.style.position = 'fixed';
        this.menuToggle.style.top = '10px';
        this.menuToggle.style.left = '10px';
        this.menuToggle.style.zIndex = '1050';
        this.menuToggle.style.background = 'var(--c4-bg-secondary, white)';
        this.menuToggle.style.boxShadow = 'var(--c4-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))';
        this.menuToggle.style.borderRadius = 'var(--c4-radius-lg, 0.75rem)';
        
        document.body.appendChild(this.menuToggle);
    }
    
    getMenuHTML() {
        return `
            <div class="c4-sidebar-header">
                <h2 class="c4-sidebar-title">C4 App</h2>
                <p class="c4-sidebar-subtitle">Gestão Financeira Inteligente</p>
            </div>
            
            <nav class="c4-sidebar-nav" role="navigation">
                <div class="c4-sidebar-section">
                    <h3 class="c4-sidebar-section-title">Principal</h3>
                    <a href="dashboard.html" class="c4-sidebar-item" data-page="dashboard">
                        <span class="c4-sidebar-item-icon">📊</span>
                        Dashboard
                    </a>
                    <a href="produtos.html" class="c4-sidebar-item" data-page="produtos">
                        <span class="c4-sidebar-item-icon">📦</span>
                        Produtos
                        <span class="c4-sidebar-item-badge" id="produtos-count">0</span>
                    </a>
                    <a href="vendas.html" class="c4-sidebar-item" data-page="vendas">
                        <span class="c4-sidebar-item-icon">💰</span>
                        Vendas
                    </a>
                    <a href="clientes.html" class="c4-sidebar-item" data-page="clientes">
                        <span class="c4-sidebar-item-icon">👥</span>
                        Clientes
                    </a>
                </div>
                
                <div class="c4-sidebar-section">
                    <h3 class="c4-sidebar-section-title">Gestão</h3>
                    <a href="metas.html" class="c4-sidebar-item" data-page="metas">
                        <span class="c4-sidebar-item-icon">🎯</span>
                        Metas
                    </a>
                    <a href="despesas.html" class="c4-sidebar-item" data-page="despesas">
                        <span class="c4-sidebar-item-icon">💸</span>
                        Despesas
                    </a>
                    <a href="relatorios.html" class="c4-sidebar-item" data-page="relatorios">
                        <span class="c4-sidebar-item-icon">📈</span>
                        Relatórios
                    </a>
                </div>
                
                <div class="c4-sidebar-section">
                    <h3 class="c4-sidebar-section-title">Ferramentas</h3>
                    <a href="calculadoras.html" class="c4-sidebar-item" data-page="calculadoras">
                        <span class="c4-sidebar-item-icon">🧮</span>
                        Calculadoras
                    </a>
                    <a href="lucro-certo.html" class="c4-sidebar-item" data-page="lucro-certo">
                        <span class="c4-sidebar-item-icon">💎</span>
                        Lucro Certo
                    </a>
                    <a href="c4-ai.html" class="c4-sidebar-item" data-page="c4-ai">
                        <span class="c4-sidebar-item-icon">🤖</span>
                        C4 AI
                        <span class="c4-sidebar-item-badge" style="background: var(--c4-secondary);">NEW</span>
                    </a>
                </div>
            </nav>
            
            <div class="c4-sidebar-footer">
                <div class="c4-sidebar-user">
                    <div class="c4-sidebar-avatar">
                        <span id="user-avatar">U</span>
                    </div>
                    <div class="c4-sidebar-user-info">
                        <p class="c4-sidebar-user-name" id="user-name">Usuária</p>
                        <p class="c4-sidebar-user-email" id="user-email">usuario@email.com</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        // Toggle menu
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
        
        // Fechar ao clicar no overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.close();
            });
        }
        
        // Navegação por itens do menu
        if (this.sidebar) {
            this.sidebar.addEventListener('click', (e) => {
                const item = e.target.closest('.c4-sidebar-item');
                if (item) {
                    this.handleNavigation(item);
                }
            });
        }
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1025 && this.isOpen) {
                this.close();
            }
        });
    }
    
    setupSwipeGestures() {
        // Swipe para abrir (da borda esquerda)
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isSwipeGesture = false;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!this.touchStartX) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - this.touchStartX;
            const deltaY = touchY - this.touchStartY;
            
            // Verificar se é um swipe horizontal
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                this.isSwipeGesture = true;
                
                // Swipe da borda esquerda para abrir
                if (this.touchStartX < 20 && deltaX > 50 && !this.isOpen) {
                    this.open();
                }
                
                // Swipe para a esquerda para fechar
                if (deltaX < -50 && this.isOpen) {
                    this.close();
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.isSwipeGesture = false;
        }, { passive: true });
    }
    
    setupKeyboardNavigation() {
        // Navegação por teclado no menu
        if (this.sidebar) {
            this.sidebar.addEventListener('keydown', (e) => {
                const items = this.sidebar.querySelectorAll('.c4-sidebar-item');
                const currentIndex = Array.from(items).findIndex(item => 
                    item === document.activeElement
                );
                
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = (currentIndex + 1) % items.length;
                        items[nextIndex].focus();
                        break;
                        
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                        items[prevIndex].focus();
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
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        if (this.sidebar) this.sidebar.classList.add('open');
        if (this.overlay) this.overlay.classList.add('show');
        if (this.menuToggle) {
            this.menuToggle.classList.add('active');
            this.menuToggle.setAttribute('aria-expanded', 'true');
        }
        
        // Focar no primeiro item do menu
        setTimeout(() => {
            const firstItem = this.sidebar?.querySelector('.c4-sidebar-item');
            if (firstItem) firstItem.focus();
        }, 300);
        
        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
        
        // Disparar evento customizado
        document.dispatchEvent(new CustomEvent('c4:menu:opened'));
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        if (this.sidebar) this.sidebar.classList.remove('open');
        if (this.overlay) this.overlay.classList.remove('show');
        if (this.menuToggle) {
            this.menuToggle.classList.remove('active');
            this.menuToggle.setAttribute('aria-expanded', 'false');
        }
        
        // Restaurar scroll do body
        document.body.style.overflow = '';
        
        // Focar de volta no botão toggle
        if (this.menuToggle) this.menuToggle.focus();
        
        // Disparar evento customizado
        document.dispatchEvent(new CustomEvent('c4:menu:closed'));
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    handleNavigation(item) {
        const page = item.dataset.page;
        const href = item.getAttribute('href');
        
        // Marcar item como ativo
        this.setActiveItem(item);
        
        // Fechar menu em mobile
        if (window.innerWidth < 1025) {
            this.close();
        }
        
        // Disparar evento de navegação
        document.dispatchEvent(new CustomEvent('c4:navigation', {
            detail: { page, href, item }
        }));
    }
    
    setActiveItem(activeItem) {
        // Remover classe active de todos os itens
        if (this.sidebar) {
            const items = this.sidebar.querySelectorAll('.c4-sidebar-item');
            items.forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // Adicionar classe active ao item atual
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    
    updateBadge(page, count) {
        if (!this.sidebar) return;
        
        const badge = this.sidebar.querySelector(`[data-page="${page}"] .c4-sidebar-item-badge`);
        if (badge && typeof count === 'number') {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }
    
    updateUserInfo(name, email) {
        if (!this.sidebar) return;
        
        const nameEl = this.sidebar.querySelector('#user-name');
        const emailEl = this.sidebar.querySelector('#user-email');
        const avatarEl = this.sidebar.querySelector('#user-avatar');
        
        if (nameEl && name) nameEl.textContent = name;
        if (emailEl && email) emailEl.textContent = email;
        if (avatarEl && name) avatarEl.textContent = name.charAt(0).toUpperCase();
    }
    
    highlightCurrentPage() {
        const currentPage = this.getCurrentPage();
        if (!this.sidebar) return;
        
        const currentItem = this.sidebar.querySelector(`[data-page="${currentPage}"]`);
        
        if (currentItem) {
            this.setActiveItem(currentItem);
        }
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '');
        return page || 'dashboard';
    }
}

// Classe para gerenciar o FAB (Floating Action Button)
class C4FABManager {
    constructor() {
        this.fab = null;
        this.isMenuOpen = false;
        this.init();
    }
    
    init() {
        this.createFAB();
        this.bindEvents();
    }
    
    createFAB() {
        // Verificar se já existe um FAB
        if (document.querySelector('.c4-fab-menu')) return;
        
        this.fab = document.createElement('div');
        this.fab.className = 'c4-fab-menu';
        this.fab.innerHTML = `
            <button class="c4-fab" aria-label="Ações rápidas">
                <span id="fab-icon">+</span>
            </button>
            <div class="c4-fab-options">
                <button class="c4-fab-option" data-action="nova-venda">
                    <span class="c4-fab-option-icon">💰</span>
                    Nova Venda
                </button>
                <button class="c4-fab-option" data-action="novo-produto">
                    <span class="c4-fab-option-icon">📦</span>
                    Novo Produto
                </button>
                <button class="c4-fab-option" data-action="novo-cliente">
                    <span class="c4-fab-option-icon">👤</span>
                    Novo Cliente
                </button>
                <button class="c4-fab-option" data-action="calculadora">
                    <span class="c4-fab-option-icon">🧮</span>
                    Calculadora
                </button>
            </div>
        `;
        
        document.body.appendChild(this.fab);
    }
    
    bindEvents() {
        if (!this.fab) return;
        
        const fabButton = this.fab.querySelector('.c4-fab');
        const fabOptions = this.fab.querySelectorAll('.c4-fab-option');
        
        // Toggle menu FAB
        if (fabButton) {
            fabButton.addEventListener('click', () => {
                this.toggleMenu();
            });
        }
        
        // Ações do FAB
        if (fabOptions) {
            fabOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.handleAction(action);
                    this.closeMenu();
                });
            });
        }
        
        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (this.fab && !this.fab.contains(e.target) && this.isMenuOpen) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.isMenuOpen = true;
        if (this.fab) {
            this.fab.classList.add('open');
            
            const icon = this.fab.querySelector('#fab-icon');
            if (icon) icon.textContent = '×';
        }
    }
    
    closeMenu() {
        this.isMenuOpen = false;
        if (this.fab) {
            this.fab.classList.remove('open');
            
            const icon = this.fab.querySelector('#fab-icon');
            if (icon) icon.textContent = '+';
        }
    }
    
    handleAction(action) {
        // Disparar evento customizado
        document.dispatchEvent(new CustomEvent('c4:fab:action', {
            detail: { action }
        }));
        
        // Ações específicas
        switch (action) {
            case 'nova-venda':
                window.location.href = 'vendas.html?action=new';
                break;
                
            case 'novo-produto':
                window.location.href = 'produtos.html?action=new';
                break;
                
            case 'novo-cliente':
                window.location.href = 'clientes.html?action=new';
                break;
                
            case 'calculadora':
                window.location.href = 'calculadoras.html';
                break;
        }
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initC4Navigation);
} else {
    initC4Navigation();
}

function initC4Navigation() {
    // Inicializar o gerenciador de menu
    window.c4MenuManager = new C4MenuManager();
    
    // Inicializar o gerenciador de FAB
    window.c4FabManager = new C4FABManager();
    
    // Destacar a página atual no menu
    window.c4MenuManager.highlightCurrentPage();
}

