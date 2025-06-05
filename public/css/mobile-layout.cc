/* C4 App - Layout Mobile-First e Navegação */
/* Menu hambúrguer lateral, navegação otimizada e layout responsivo */

/* ========================================
   HEADER E NAVEGAÇÃO PRINCIPAL
======================================== */

.c4-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: var(--c4-bg-secondary);
    border-bottom: 1px solid var(--c4-bg-tertiary);
    box-shadow: var(--c4-shadow-sm);
    z-index: var(--c4-z-fixed);
    display: flex;
    align-items: center;
    padding: 0 var(--c4-space-4);
}

.c4-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.c4-logo {
    display: flex;
    align-items: center;
    gap: var(--c4-space-2);
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-xl);
    font-weight: var(--c4-font-bold);
    color: var(--c4-primary);
    text-decoration: none;
}

.c4-logo-icon {
    width: 32px;
    height: 32px;
    background: var(--c4-gradient-primary);
    border-radius: var(--c4-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--c4-text-lg);
}

/* ========================================
   MENU HAMBÚRGUER
======================================== */

.c4-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--c4-touch-min); /* 44px */
    height: var(--c4-touch-min);
    background: none;
    border: none;
    cursor: pointer;
    border-radius: var(--c4-radius-lg);
    transition: all var(--c4-transition-fast);
    position: relative;
    z-index: var(--c4-z-modal);
}

.c4-menu-toggle:hover {
    background: var(--c4-bg-tertiary);
}

.c4-menu-toggle:focus {
    outline: 2px solid var(--c4-primary);
    outline-offset: 2px;
}

/* Ícone hambúrguer animado */
.c4-hamburger {
    width: 24px;
    height: 18px;
    position: relative;
    transform: rotate(0deg);
    transition: 0.3s ease-in-out;
}

.c4-hamburger span {
    display: block;
    position: absolute;
    height: 3px;
    width: 100%;
    background: var(--c4-text-primary);
    border-radius: 2px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: 0.25s ease-in-out;
}

.c4-hamburger span:nth-child(1) {
    top: 0px;
}

.c4-hamburger span:nth-child(2) {
    top: 7px;
}

.c4-hamburger span:nth-child(3) {
    top: 14px;
}

/* Estado ativo (X) */
.c4-menu-toggle.active .c4-hamburger span:nth-child(1) {
    top: 7px;
    transform: rotate(135deg);
}

.c4-menu-toggle.active .c4-hamburger span:nth-child(2) {
    opacity: 0;
    left: -60px;
}

.c4-menu-toggle.active .c4-hamburger span:nth-child(3) {
    top: 7px;
    transform: rotate(-135deg);
}

/* ========================================
   MENU LATERAL (SIDEBAR)
======================================== */

.c4-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background: var(--c4-bg-secondary);
    box-shadow: var(--c4-shadow-xl);
    z-index: var(--c4-z-modal);
    transform: translateX(-100%);
    transition: transform var(--c4-transition-normal);
    overflow-y: auto;
    border-right: 1px solid var(--c4-bg-tertiary);
}

.c4-sidebar.open {
    transform: translateX(0);
}

.c4-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--c4-bg-overlay);
    z-index: calc(var(--c4-z-modal) - 1);
    opacity: 0;
    visibility: hidden;
    transition: all var(--c4-transition-normal);
}

.c4-sidebar-overlay.show {
    opacity: 1;
    visibility: visible;
}

/* Header do sidebar */
.c4-sidebar-header {
    padding: var(--c4-space-6) var(--c4-space-4);
    border-bottom: 1px solid var(--c4-bg-tertiary);
    background: var(--c4-gradient-primary);
    color: white;
}

.c4-sidebar-title {
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-xl);
    font-weight: var(--c4-font-semibold);
    margin: 0;
}

.c4-sidebar-subtitle {
    font-size: var(--c4-text-sm);
    opacity: 0.9;
    margin: var(--c4-space-1) 0 0 0;
}

/* Navegação do sidebar */
.c4-sidebar-nav {
    padding: var(--c4-space-4) 0;
}

.c4-sidebar-section {
    margin-bottom: var(--c4-space-6);
}

.c4-sidebar-section-title {
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-xs);
    font-weight: var(--c4-font-semibold);
    color: var(--c4-text-light);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 var(--c4-space-4);
    margin-bottom: var(--c4-space-3);
}

.c4-sidebar-item {
    display: flex;
    align-items: center;
    gap: var(--c4-space-3);
    min-height: var(--c4-touch-min); /* 44px */
    padding: var(--c4-space-3) var(--c4-space-4);
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-base);
    font-weight: var(--c4-font-medium);
    color: var(--c4-text-secondary);
    text-decoration: none;
    transition: all var(--c4-transition-fast);
    border-left: 3px solid transparent;
}

.c4-sidebar-item:hover {
    background: var(--c4-bg-tertiary);
    color: var(--c4-text-primary);
    border-left-color: var(--c4-primary);
}

.c4-sidebar-item.active {
    background: rgba(236, 72, 153, 0.1);
    color: var(--c4-primary);
    border-left-color: var(--c4-primary);
    font-weight: var(--c4-font-semibold);
}

.c4-sidebar-item-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.c4-sidebar-item-badge {
    margin-left: auto;
    background: var(--c4-primary);
    color: white;
    font-size: var(--c4-text-xs);
    font-weight: var(--c4-font-semibold);
    padding: var(--c4-space-1) var(--c4-space-2);
    border-radius: var(--c4-radius-full);
    min-width: 20px;
    text-align: center;
}

/* Footer do sidebar */
.c4-sidebar-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--c4-space-4);
    border-top: 1px solid var(--c4-bg-tertiary);
    background: var(--c4-bg-tertiary);
}

.c4-sidebar-user {
    display: flex;
    align-items: center;
    gap: var(--c4-space-3);
    padding: var(--c4-space-3);
    border-radius: var(--c4-radius-lg);
    background: var(--c4-bg-secondary);
}

.c4-sidebar-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--c4-gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: var(--c4-font-semibold);
}

.c4-sidebar-user-info {
    flex: 1;
    min-width: 0;
}

.c4-sidebar-user-name {
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-sm);
    font-weight: var(--c4-font-medium);
    color: var(--c4-text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.c4-sidebar-user-email {
    font-size: var(--c4-text-xs);
    color: var(--c4-text-light);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ========================================
   LAYOUT PRINCIPAL
======================================== */

.c4-main {
    margin-top: 64px; /* Altura do header */
    min-height: calc(100vh - 64px);
    background: var(--c4-bg-primary);
    transition: margin-left var(--c4-transition-normal);
}

.c4-main-content {
    padding: var(--c4-space-6) var(--c4-space-4);
    max-width: 1200px;
    margin: 0 auto;
}

/* ========================================
   BOTÃO FLUTUANTE (FAB)
======================================== */

.c4-fab {
    position: fixed;
    bottom: var(--c4-space-6);
    right: var(--c4-space-4);
    width: 56px;
    height: 56px;
    background: var(--c4-gradient-primary);
    border: none;
    border-radius: 50%;
    box-shadow: var(--c4-shadow-lg);
    cursor: pointer;
    z-index: var(--c4-z-fixed);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    transition: all var(--c4-transition-fast);
}

.c4-fab:hover {
    transform: scale(1.1);
    box-shadow: var(--c4-shadow-xl);
}

.c4-fab:active {
    transform: scale(0.95);
}

.c4-fab:focus {
    outline: 3px solid rgba(236, 72, 153, 0.3);
    outline-offset: 2px;
}

/* FAB com menu */
.c4-fab-menu {
    position: relative;
}

.c4-fab-options {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: var(--c4-space-3);
    display: flex;
    flex-direction: column;
    gap: var(--c4-space-2);
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: all var(--c4-transition-normal);
}

.c4-fab-menu.open .c4-fab-options {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.c4-fab-option {
    display: flex;
    align-items: center;
    gap: var(--c4-space-3);
    padding: var(--c4-space-3) var(--c4-space-4);
    background: var(--c4-bg-secondary);
    border: none;
    border-radius: var(--c4-radius-lg);
    box-shadow: var(--c4-shadow-md);
    cursor: pointer;
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-sm);
    font-weight: var(--c4-font-medium);
    color: var(--c4-text-primary);
    white-space: nowrap;
    transition: all var(--c4-transition-fast);
}

.c4-fab-option:hover {
    background: var(--c4-primary);
    color: white;
    transform: translateX(-4px);
}

.c4-fab-option-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

/* ========================================
   GRID RESPONSIVO OTIMIZADO
======================================== */

.c4-grid-responsive {
    display: grid;
    gap: var(--c4-space-4);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.c4-grid-2-col {
    display: grid;
    gap: var(--c4-space-4);
    grid-template-columns: repeat(2, 1fr);
}

.c4-grid-3-col {
    display: grid;
    gap: var(--c4-space-4);
    grid-template-columns: repeat(3, 1fr);
}

/* ========================================
   THUMB ZONE OPTIMIZATION
======================================== */

/* Área de alcance do polegar em dispositivos móveis */
.c4-thumb-zone {
    position: relative;
}

/* Elementos importantes na zona do polegar (parte inferior da tela) */
.c4-thumb-friendly {
    margin-bottom: var(--c4-space-16); /* Espaço para o polegar */
}

/* Botões principais na zona de fácil acesso */
.c4-primary-actions {
    position: sticky;
    bottom: var(--c4-space-4);
    background: var(--c4-bg-secondary);
    padding: var(--c4-space-4);
    border-radius: var(--c4-radius-xl);
    box-shadow: var(--c4-shadow-lg);
    margin-top: var(--c4-space-6);
}

/* ========================================
   RESPONSIVIDADE MOBILE
======================================== */

@media (max-width: 640px) {
    .c4-header {
        height: 56px;
        padding: 0 var(--c4-space-3);
    }
    
    .c4-main {
        margin-top: 56px;
    }
    
    .c4-main-content {
        padding: var(--c4-space-4) var(--c4-space-3);
    }
    
    .c4-sidebar {
        width: 100%;
        max-width: 320px;
    }
    
    .c4-grid-2-col,
    .c4-grid-3-col {
        grid-template-columns: 1fr;
    }
    
    .c4-fab {
        bottom: var(--c4-space-4);
        right: var(--c4-space-3);
        width: 48px;
        height: 48px;
    }
    
    /* Otimização para telas muito pequenas */
    @media (max-width: 360px) {
        .c4-sidebar {
            width: calc(100% - var(--c4-space-4));
        }
        
        .c4-main-content {
            padding: var(--c4-space-3) var(--c4-space-2);
        }
        
        .c4-grid-responsive {
            grid-template-columns: 1fr;
        }
    }
}

/* Landscape mobile */
@media (max-width: 896px) and (orientation: landscape) {
    .c4-sidebar {
        width: 240px;
    }
    
    .c4-main-content {
        padding: var(--c4-space-4);
    }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
    .c4-main {
        margin-left: 0;
    }
    
    .c4-sidebar {
        width: 260px;
    }
    
    .c4-grid-2-col {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .c4-grid-3-col {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop */
@media (min-width: 1025px) {
    .c4-menu-toggle {
        display: none;
    }
    
    .c4-sidebar {
        position: relative;
        transform: translateX(0);
        width: 260px;
        height: calc(100vh - 64px);
        box-shadow: none;
        border-right: 1px solid var(--c4-bg-tertiary);
    }
    
    .c4-sidebar-overlay {
        display: none;
    }
    
    .c4-main {
        margin-left: 260px;
    }
    
    .c4-fab {
        display: none; /* Esconder FAB em desktop */
    }
}

/* ========================================
   ESTADOS DE CARREGAMENTO MOBILE
======================================== */

.c4-mobile-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--c4-bg-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: var(--c4-z-modal);
}

.c4-mobile-loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--c4-bg-tertiary);
    border-top: 4px solid var(--c4-primary);
    border-radius: 50%;
    animation: c4-spin 1s linear infinite;
    margin-bottom: var(--c4-space-4);
}

.c4-mobile-loading-text {
    font-family: var(--c4-font-primary);
    font-size: var(--c4-text-lg);
    color: var(--c4-text-secondary);
    text-align: center;
}

/* ========================================
   ACESSIBILIDADE MOBILE
======================================== */

/* Aumentar área de toque para elementos pequenos */
.c4-touch-target {
    position: relative;
}

.c4-touch-target::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--c4-touch-min);
    height: var(--c4-touch-min);
    transform: translate(-50%, -50%);
    z-index: -1;
}

/* Feedback tátil para ações importantes */
.c4-haptic-feedback {
    -webkit-tap-highlight-color: rgba(236, 72, 153, 0.2);
    tap-highlight-color: rgba(236, 72, 153, 0.2);
}

/* Scroll suave para navegação */
.c4-smooth-scroll {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
}

/* Prevenção de zoom acidental */
.c4-no-zoom {
    touch-action: manipulation;
}

