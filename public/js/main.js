// 📁 js/main.js
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const navItems = document.querySelectorAll('.nav-item');
    const headerTitleEl = document.getElementById('header-title'); // Renomeado para clareza
    const appContainer = document.getElementById('app-container');

    // Cache para evitar recarregar/re-executar scripts desnecessariamente
    // O valor pode ser a própria função init para ser chamada.
    const loadedPageScripts = {};

    /**
     * Carrega o conteúdo HTML e o script JS de uma página.
     * @param {string} pageName - O nome da página (ex: 'dashboard').
     * @param {boolean} [pushToHistory=true] - Se deve adicionar ao histórico do navegador.
     */
    async function loadPage(pageName, pushToHistory = true) {
        if (!mainContent || !headerTitleEl) {
            console.error('#main-content ou #header-title não encontrados.');
            return;
        }
        mainContent.innerHTML = '<div class="spinner-container" style="display: flex; justify-content: center; align-items: center; height: 100%;"><div class="spinner"></div></div>';
        headerTitleEl.textContent = 'Carregando...';

        // Remove classes de página anteriores do appContainer e adiciona a nova
        if (appContainer.dataset.currentPage) {
            appContainer.classList.remove('app-page-' + appContainer.dataset.currentPage);
        }
        appContainer.classList.add('app-page-' + pageName);
        appContainer.dataset.currentPage = pageName; // Guarda a página atual

        try {
            const response = await fetch(`../html/${pageName}.html`);
            if (!response.ok) throw new Error(`Página ${pageName}.html não encontrada (status ${response.status})`);
            
            mainContent.innerHTML = await response.text();

            // Atualiza o título do Header (busca .page-title dentro do conteúdo carregado)
            const pageTitleElement = mainContent.querySelector('.page-title');
            const titleText = pageTitleElement ? pageTitleElement.textContent.trim() : pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
            headerTitleEl.textContent = titleText;
            document.title = `${titleText} - C4 App`; // Atualiza o título da aba do navegador

            // Carrega e executa o script JS da página
            const scriptPath = `../js/${pageName}.js`;
            const initFunctionName = `init${pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, '')}`;

            if (loadedPageScripts[pageName] && typeof loadedPageScripts[pageName] === 'function') {
                // Se o script já foi carregado e temos a função init, chama novamente
                // console.log(`Re-executando ${initFunctionName} para a página ${pageName}.`);
                loadedPageScripts[pageName]();
            } else {
                try {
                    const scriptResponse = await fetch(scriptPath);
                    if (scriptResponse.ok) {
                        const scriptText = await scriptResponse.text();
                        // Avalia o script. Para segurança, o ideal seria não usar eval ou new Function.
                        // Mas para este escopo "sem libs/frameworks", é uma forma de carregar dinamicamente.
                        // A execução direta em um <script> tag é mais segura.
                        const tempScript = document.createElement('script');
                        tempScript.textContent = scriptText;
                        document.body.appendChild(tempScript).remove(); // Executa o script
                        
                        if (typeof window[initFunctionName] === 'function') {
                            // console.log(`Executando ${initFunctionName} pela primeira vez para ${pageName}.`);
                            window[initFunctionName]();
                            loadedPageScripts[pageName] = window[initFunctionName]; // Cacheia a função init
                        } else {
                            // console.warn(`Função ${initFunctionName} não encontrada no script ${scriptPath}. O script foi carregado, mas a inicialização específica da página pode não ocorrer.`);
                            loadedPageScripts[pageName] = true; // Marca como carregado, mas sem init func
                        }
                    } else {
                        // console.warn(`Script ${scriptPath} não encontrado para a página ${pageName}.`);
                        loadedPageScripts[pageName] = null; // Marca que tentou e não achou
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
            window.scrollTo(0, 0); // Rola para o topo da página

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
            // Verifica se a página clicada já é a ativa para evitar recarregamento desnecessário
            const currentActive = document.querySelector('.nav-item.active');
            if (currentActive && currentActive.dataset.page === page) {
                // console.log(`Página ${page} já está ativa.`);
                return;
            }
            if (page) loadPage(page);
        });
    });

    window.addEventListener('popstate', (event) => {
        const pageToLoad = (event.state && event.state.page) || (new URLSearchParams(window.location.search).get('page')) || 'dashboard';
        loadPage(pageToLoad, false);
    });

    // Lógica de Autenticação Inicial (Exemplo Simplificado)
    // Em um app real, isso seria mais robusto, talvez com uma tela de login dedicada.
    if (!getCurrentUser() && (new URLSearchParams(window.location.search).get('page')) !== 'perfil') {
        // Se não há usuário e a página não é 'perfil' (que pode ter um formulário de login)
        // Poderia redirecionar para uma página de login:
        // loadPage('login', false); // Supondo que 'login.html' exista
        // Por enquanto, se não houver usuário, o app ainda carrega,
        // mas as funcionalidades que dependem de auth podem falhar ou exibir mensagens.
        // O ideal é ter rotas protegidas.
        // console.warn("Nenhum usuário logado. Algumas funcionalidades podem não estar disponíveis.");
    }


    const initialPage = new URLSearchParams(window.location.search).get('page') || 'dashboard';
    loadPage(initialPage, !new URLSearchParams(window.location.search).has('page'));


    // Funções Globais de UI (Modal e Toast)
    window.showAppModal = (title, bodyHtml, footerHtml = '', modalId = 'appDefaultModal') => {
        const modalPlaceholder = document.getElementById('modal-placeholder');
        if (!modalPlaceholder) return;

        // Remove modal anterior com mesmo ID se existir
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop';
        modalBackdrop.id = modalId;

        let footerContent = '';
        if (footerHtml) {
            footerContent = `<div class="modal-footer">${footerHtml}</div>`;
        }

        modalBackdrop.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close-btn" aria-label="Fechar modal" data-dismiss-modal="${modalId}">&times;</button>
                </div>
                <div class="modal-body">
                    ${bodyHtml}
                </div>
                ${footerContent}
            </div>
        `;
        modalPlaceholder.appendChild(modalBackdrop);
        
        // Adiciona listener para fechar
        modalBackdrop.querySelector('.modal-close-btn').addEventListener('click', () => closeAppModal(modalId));
        modalBackdrop.addEventListener('click', (e) => { // Fechar ao clicar no backdrop
            if (e.target === modalBackdrop) closeAppModal(modalId);
        });

        // Força reflow para animação
        void modalBackdrop.offsetWidth;
        modalBackdrop.classList.add('active');
    };

    window.closeAppModal = (modalId = 'appDefaultModal') => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.classList.remove('active');
            // Espera a transição de opacidade terminar antes de remover
            modalElement.addEventListener('transitionend', () => {
                if (!modalElement.classList.contains('active')) { // Verifica se ainda não foi reaberto
                    modalElement.remove();
                }
            }, { once: true });
        }
    };

    window.showToast = (message, type = 'info', duration = 3500) => {
        const toastContainer = document.getElementById('toast-placeholder-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`; // Classes de animations.css e style.css
        toast.textContent = message;

        toastContainer.appendChild(toast);
        
        // Força reflow para animação de entrada
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
            }, { once: true });
        }, duration);
    };
});
// console.log('main.js carregado.');
