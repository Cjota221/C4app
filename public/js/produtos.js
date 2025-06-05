// 📁 js/produtos.js
// Corrigido: Eventos de botões e tratamento de erros melhorado

function initProdutos() {
    console.log('Inicializando Produtos...');
    
    // Corrigido: Verificação de existência dos elementos antes de usar
    const btnAbrirForm = document.getElementById('btn-abrir-form-produto');
    const btnCancelarForm = document.getElementById('btn-cancelar-form-produto');
    const formContainer = document.getElementById('form-produto-container');
    const formProduto = document.getElementById('form-produto');
    const formProdutoTitle = document.getElementById('form-produto-title');
    const listaProdutosEl = document.getElementById('lista-produtos');
    const produtoIdInput = document.getElementById('produto-id');

    if (!btnAbrirForm || !formContainer || !formProduto || !listaProdutosEl) {
        console.error('Elementos essenciais da página de produtos não encontrados');
        return;
    }

    function toggleForm(show, produtoParaEditar = null) {
        if (!formContainer || !formProduto) return;
        
        formContainer.classList.toggle('hidden', !show);
        if (btnAbrirForm) btnAbrirForm.classList.toggle('hidden', show);

        // Corrigido: Verificar se função existe antes de chamar
        if (typeof limparErrosFormulario === 'function') {
            limparErrosFormulario(formProduto);
        }
        
        formProduto.reset();
        if (produtoIdInput) produtoIdInput.value = '';

        if (show) {
            if (produtoParaEditar) {
                if (formProdutoTitle) formProdutoTitle.textContent = 'Editar Produto';
                if (produtoIdInput) produtoIdInput.value = produtoParaEditar.id;
                
                // Corrigido: Verificar existência dos campos antes de preencher
                const campos = {
                    'produto-nome': produtoParaEditar.nome,
                    'produto-categoria': produtoParaEditar.categoria || '',
                    'produto-valor-compra': produtoParaEditar.valor_compra,
                    'produto-valor-venda': produtoParaEditar.valor_venda || '',
                    'produto-estoque': produtoParaEditar.estoque_atual,
                    'produto-imagem-url': produtoParaEditar.imagem_url || ''
                };
                
                Object.entries(campos).forEach(([id, valor]) => {
                    const campo = document.getElementById(id);
                    if (campo) campo.value = valor;
                });
            } else {
                if (formProdutoTitle) formProdutoTitle.textContent = 'Cadastrar Novo Produto';
            }
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Corrigido: Event listeners com verificação de existência
    if (btnAbrirForm) {
        btnAbrirForm.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Botão Novo Produto clicado');
            toggleForm(true);
        });
    }

    if (btnCancelarForm) {
        btnCancelarForm.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Botão Cancelar clicado');
            toggleForm(false);
        });
    }

    if (formProduto) {
        formProduto.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Formulário de produto submetido');
            
            // Corrigido: Verificar getCurrentUser com fallback
            let currentUser;
            try {
                currentUser = getCurrentUser();
            } catch (error) {
                console.error('Erro ao obter usuário:', error);
                if (typeof showToast === 'function') {
                    showToast('Erro de autenticação. Recarregue a página.', 'error');
                }
                return;
            }

            if (!currentUser) {
                if (typeof showToast === 'function') {
                    showToast('Você precisa estar logada para gerenciar produtos.', 'error');
                }
                return;
            }

            // Corrigido: Limpar erros com verificação
            if (typeof limparErrosFormulario === 'function') {
                limparErrosFormulario(formProduto);
            }

            let isValid = true;
            
            // Corrigido: Validações com verificação de funções
            const validarCampo = (id, validador, ...args) => {
                const campo = document.getElementById(id);
                if (campo && typeof validador === 'function') {
                    return validador(campo, ...args);
                }
                return true;
            };

            isValid &= validarCampo('produto-nome', validarCampoTextoObrigatorio, 'Nome do produto');
            isValid &= validarCampo('produto-valor-compra', validarCampoNumero, 'Valor de compra', { permiteZero: true, obrigatorio: true });
            isValid &= validarCampo('produto-valor-venda', validarCampoNumero, 'Valor de venda', { permiteZero: true, obrigatorio: false });
            isValid &= validarCampo('produto-estoque', validarCampoNumero, 'Estoque', { permiteZero: true, obrigatorio: true, permiteNegativo: false });

            if (!isValid) {
                if (typeof showToast === 'function') {
                    showToast('Por favor, corrija os erros no formulário.', 'error');
                }
                return;
            }

            // Corrigido: Coleta de dados com verificação de campos
            const obterValorCampo = (id) => {
                const campo = document.getElementById(id);
                return campo ? campo.value.trim() : '';
            };

            const produtoId = produtoIdInput ? produtoIdInput.value : '';
            const produtoData = {
                nome: obterValorCampo('produto-nome'),
                categoria: obterValorCampo('produto-categoria') || null,
                valor_compra: typeof moedaParaNumero === 'function' ? moedaParaNumero(obterValorCampo('produto-valor-compra')) : parseFloat(obterValorCampo('produto-valor-compra')),
                valor_venda: typeof moedaParaNumero === 'function' ? moedaParaNumero(obterValorCampo('produto-valor-venda')) : parseFloat(obterValorCampo('produto-valor-venda')) || null,
                estoque_atual: parseInt(obterValorCampo('produto-estoque')),
                imagem_url: obterValorCampo('produto-imagem-url') || null,
                user_id: currentUser.id
            };

            // Corrigido: Tratamento de valor_venda
            if (produtoData.valor_venda === 0 && obterValorCampo('produto-valor-venda') !== "0") {
                produtoData.valor_venda = null;
            }

            let endpoint = `${C4APP_CONFIG.DB_ENDPOINT}/produtos`;
            let method = 'POST';
            const headers = { 'Prefer': 'return=representation' };

            if (produtoId) {
                endpoint += `?id=eq.${produtoId}`;
                method = 'PATCH';
            }

            try {
                const resultado = await supabaseFetch(endpoint, method, produtoData, headers);
                if (typeof showToast === 'function') {
                    showToast(`Produto ${produtoId ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
                }
                toggleForm(false);
                carregarListaProdutos();
            } catch (error) {
                console.error('Erro ao salvar produto:', error);
                if (typeof showToast === 'function') {
                    showToast(`Erro ao salvar produto: ${error.message}`, 'error');
                }
            }
        });
    }

    async function carregarListaProdutos() {
        if (!listaProdutosEl) return;
        
        listaProdutosEl.innerHTML = '<div class="loading-message col-span-full"><div class="spinner"></div><p>Carregando produtos...</p></div>';
        
        // Corrigido: Verificar getCurrentUser com fallback
        let currentUser;
        try {
            currentUser = getCurrentUser();
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            listaProdutosEl.innerHTML = '<p class="error-message col-span-full p-m">Erro de autenticação. Recarregue a página.</p>';
            return;
        }

        if (!currentUser) {
            listaProdutosEl.innerHTML = '<p class="empty-message col-span-full p-m">Faça login para ver seus produtos.</p>';
            return;
        }

        try {
            const produtos = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?select=*&user_id=eq.${currentUser.id}&order=nome.asc`);
            
            if (produtos && produtos.length > 0) {
                listaProdutosEl.innerHTML = '';
                produtos.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'card card-produto';
                    
                    // Corrigido: Verificar função formatarMoeda
                    const formatMoney = (valor) => {
                        if (typeof formatarMoeda === 'function') {
                            return formatarMoeda(valor);
                        }
                        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
                    };

                    const displayValorVenda = p.valor_venda ? formatMoney(p.valor_venda) : `<em>(${formatMoney(p.valor_compra * 1.7)})</em>`;

                    card.innerHTML = `
                        <img src="${p.imagem_url || 'https://via.placeholder.com/150x150/f0f0f0/999999?text=Produto'}" alt="${p.nome}" class="card-image">
                        <div class="card-content" style="padding: var(--espaco-s) var(--espaco-m) var(--espaco-m);">
                            <h3 class="produto-nome">${p.nome}</h3>
                            <p class="produto-preco">Venda: ${displayValorVenda}</p>
                            <p class="text-sm text-gray">Custo: ${formatMoney(p.valor_compra)} | Estoque: ${p.estoque_atual}</p>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-outline-primary btn-sm btn-edit-produto" data-id="${p.id}" aria-label="Editar ${p.nome}">
                                <span class="icon" aria-hidden="true">✏️</span> Editar
                            </button>
                            <button class="btn btn-danger btn-sm btn-delete-produto" data-id="${p.id}" aria-label="Excluir ${p.nome}" style="background-color: transparent; color: var(--vermelho-erro); border-color: var(--vermelho-erro);">
                                <span class="icon" aria-hidden="true">🗑️</span> Excluir
                            </button>
                        </div>
                    `;
                    
                    // Corrigido: Event listeners para botões dinâmicos
                    const editBtn = card.querySelector('.btn-edit-produto');
                    const deleteBtn = card.querySelector('.btn-delete-produto');
                    
                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            console.log('Editando produto:', p.nome);
                            toggleForm(true, p);
                        });
                    }
                    
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            console.log('Excluindo produto:', p.nome);
                            confirmarExclusaoProduto(p.id, p.nome);
                        });
                    }
                    
                    listaProdutosEl.appendChild(card);
                });
            } else {
                listaProdutosEl.innerHTML = '<p class="empty-message col-span-full p-m">Nenhum produto cadastrado ainda. Que tal adicionar um?</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            listaProdutosEl.innerHTML = `<p class="error-message col-span-full p-m">Falha ao carregar produtos: ${error.message}</p>`;
        }
    }

    async function confirmarExclusaoProduto(produtoId, produtoNome) {
        // Corrigido: Verificar se showAppModal existe
        if (typeof showAppModal !== 'function') {
            const confirmacao = confirm(`Tem certeza que deseja excluir o produto "${produtoNome}"?`);
            if (!confirmacao) return;
            
            try {
                await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?id=eq.${produtoId}`, 'DELETE');
                if (typeof showToast === 'function') {
                    showToast(`Produto "${produtoNome}" excluído com sucesso.`, 'success');
                }
                carregarListaProdutos();
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                if (typeof showToast === 'function') {
                    showToast(`Erro ao excluir produto: ${error.message}`, 'error');
                }
            }
            return;
        }

        showAppModal(
            'Confirmar Exclusão',
            `<p>Tem certeza que deseja excluir o produto "<strong>${produtoNome}</strong>"? Esta ação não pode ser desfeita.</p>`,
            `<button class="btn btn-outline-primary" data-dismiss-modal="confirmDeleteProdutoModal">Cancelar</button>
             <button class="btn btn-danger" id="btnConfirmDeleteProduto">Excluir</button>`,
            'confirmDeleteProdutoModal'
        );

        // Corrigido: Aguardar modal ser criado antes de adicionar listener
        setTimeout(() => {
            const confirmBtn = document.getElementById('btnConfirmDeleteProduto');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', async () => {
                    try {
                        await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?id=eq.${produtoId}`, 'DELETE');
                        if (typeof showToast === 'function') {
                            showToast(`Produto "${produtoNome}" excluído com sucesso.`, 'success');
                        }
                        carregarListaProdutos();
                    } catch (error) {
                        console.error('Erro ao excluir produto:', error);
                        if (typeof showToast === 'function') {
                            showToast(`Erro ao excluir produto: ${error.message}`, 'error');
                        }
                    } finally {
                        if (typeof closeAppModal === 'function') {
                            closeAppModal('confirmDeleteProdutoModal');
                        }
                    }
                }, { once: true });
            }
        }, 100);
    }

    // Corrigido: Carregar lista com tratamento de erro
    try {
        carregarListaProdutos();
    } catch (error) {
        console.error('Erro ao inicializar lista de produtos:', error);
    }
}

console.log('produtos.js carregado e corrigido');

