// 📁 public/js/main.js (Corrigido)
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const navItems = document.querySelectorAll('.nav-item');
    const headerTitleEl = document.getElementById('header-title');
    const appContainer = document.getElementById('app-container');
    const loadedPageScripts = {};

    async function loadPage(pageName, pushToHistory = true) {
        if (!mainContent || !headerTitleEl) {
            console.error('#main-content ou #header-title não encontrados.');
            return;
        }
        mainContent.innerHTML = '<div class="spinner-container" style="display: flex; justify-content: center; align-items: center; height: 100%;"><div class="spinner"></div></div>';
        headerTitleEl.textContent = 'Carregando...';

        if (appContainer.dataset.currentPage) {
            appContainer.classList.remove('app-page-' + appContainer.dataset.currentPage);
        }
        appContainer.classList.add('app-page-' + pageName);
        appContainer.dataset.currentPage = pageName;

        try {
            // Caminho corrigido para buscar HTML da raiz de 'public/'
            const response = await fetch(`../${pageName}.html`); // Ex: ../dashboard.html
            if (!response.ok) throw new Error(`Página ${pageName}.html não encontrada (status ${response.status})`);
            
            mainContent.innerHTML = await response.text();

            const pageTitleElement = mainContent.querySelector('.page-title');
            const titleText = pageTitleElement ? pageTitleElement.textContent.trim() : pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
            headerTitleEl.textContent = titleText;
            document.title = `${titleText} - C4 App`;

            // Caminho corrigido para buscar JS da pasta 'js/' (relativo a 'js/main.js')
            const scriptPath = `./${pageName}.js`; // Ex: ./dashboard.js
            const initFunctionName = `init${pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, '')}`;

            if (loadedPageScripts[pageName] && typeof loadedPageScripts[pageName] === 'function') {
                loadedPageScripts[pageName]();
            } else {
                try {
                    const scriptResponse = await fetch(scriptPath);
                    if (scriptResponse.ok) {
                        const scriptText = await scriptResponse.text();
                        const tempScript = document.createElement('script');
                        tempScript.textContent = scriptText;
                        document.body.appendChild(tempScript).remove();
                        
                        if (typeof window[initFunctionName] === 'function') {
                            window[initFunctionName]();
                            loadedPageScripts[pageName] = window[initFunctionName];
                        } else {
                            loadedPageScripts[pageName] = true; 
                        }
                    } else {
                        loadedPageScripts[pageName] = null;
                    }
                } catch (scriptError) {
                    console.error(`Erro ao carregar ou executar script ${scriptPath}:`, scriptError);
                    loadedPageScripts[pageName] = null;
                }
            }

            if (pushToHistory) {
                history.pushState({ page: pageName }, titleText, `?page=${pageName}`);
            }

            navItems.forEach(nav => nav.classList.toggle('active', nav.dataset.page === pageName));
            window.scrollTo(0, 0);

        } catch (error) {
            console.error('Erro ao carregar página:', error);
            mainContent.innerHTML = `<div class="error-message">Oops! Algo deu errado ao carregar esta seção.<br>(${error.message})</div>`;
            headerTitleEl.textContent = 'Erro';
            document.title = 'Erro - C4 App';
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const page = item.dataset.page;
            const currentActive = document.querySelector('.nav-item.active');
            if (currentActive && currentActive.dataset.page === page) {
                return;
            }
            if (page) loadPage(page);
        });
    });

    window.addEventListener('popstate', (event) => {
        const pageToLoad = (event.state && event.state.page) || (new URLSearchParams(window.location.search).get('page')) || 'dashboard';
        loadPage(pageToLoad, false);
    });
    
    if (!getCurrentUser() && (new URLSearchParams(window.location.search).get('page')) !== 'perfil') {
        // Lógica de autenticação inicial
    }

    const initialPage = new URLSearchParams(window.location.search).get('page') || 'dashboard';
    loadPage(initialPage, !new URLSearchParams(window.location.search).has('page'));

    window.showAppModal = (title, bodyHtml, footerHtml = '', modalId = 'appDefaultModal') => {
        const modalPlaceholder = document.getElementById('modal-placeholder');
        if (!modalPlaceholder) return;
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop';
        modalBackdrop.id = modalId;
        let footerContent = footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : '';
        modalBackdrop.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close-btn" aria-label="Fechar modal" data-dismiss-modal="${modalId}">&times;</button>
                </div>
                <div class="modal-body">${bodyHtml}</div>
                ${footerContent}
            </div>
        `;
        modalPlaceholder.appendChild(modalBackdrop);
        modalBackdrop.querySelector('.modal-close-btn').addEventListener('click', () => closeAppModal(modalId));
        modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeAppModal(modalId); });
        void modalBackdrop.offsetWidth;
        modalBackdrop.classList.add('active');
    };

    window.closeAppModal = (modalId = 'appDefaultModal') => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.classList.remove('active');
            modalElement.addEventListener('transitionend', () => {
                if (!modalElement.classList.contains('active')) {
                    modalElement.remove();
                }
            }, { once: true });
        }
    };

    window.showToast = (message, type = 'info', duration = 3500) => {
        const toastContainer = document.getElementById('toast-placeholder-container');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }, duration);
    };
});
