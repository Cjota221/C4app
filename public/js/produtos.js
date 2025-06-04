// 📁 js/produtos.js
function initProdutos() {
    // console.log('Inicializando Produtos...');
    const btnAbrirForm = document.getElementById('btn-abrir-form-produto');
    const btnCancelarForm = document.getElementById('btn-cancelar-form-produto');
    const formContainer = document.getElementById('form-produto-container');
    const formProduto = document.getElementById('form-produto');
    const formProdutoTitle = document.getElementById('form-produto-title');
    const listaProdutosEl = document.getElementById('lista-produtos');
    const produtoIdInput = document.getElementById('produto-id');

    function toggleForm(show, produtoParaEditar = null) {
        formContainer.classList.toggle('hidden', !show);
        if (btnAbrirForm) btnAbrirForm.classList.toggle('hidden', show);

        limparErrosFormulario(formProduto);
        formProduto.reset();
        produtoIdInput.value = ''; // Limpa ID

        if (show) {
            if (produtoParaEditar) {
                formProdutoTitle.textContent = 'Editar Produto';
                produtoIdInput.value = produtoParaEditar.id;
                document.getElementById('produto-nome').value = produtoParaEditar.nome;
                document.getElementById('produto-categoria').value = produtoParaEditar.categoria || '';
                document.getElementById('produto-valor-compra').value = produtoParaEditar.valor_compra;
                document.getElementById('produto-valor-venda').value = produtoParaEditar.valor_venda || '';
                document.getElementById('produto-estoque').value = produtoParaEditar.estoque_atual;
                document.getElementById('produto-imagem-url').value = produtoParaEditar.imagem_url || '';
            } else {
                formProdutoTitle.textContent = 'Cadastrar Novo Produto';
            }
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    if (btnAbrirForm) btnAbrirForm.addEventListener('click', () => toggleForm(true));
    if (btnCancelarForm) btnCancelarForm.addEventListener('click', () => toggleForm(false));

    if (formProduto) {
        formProduto.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!getCurrentUser()) {
                showToast('Você precisa estar logada para gerenciar produtos.', 'error');
                return;
            }
            limparErrosFormulario(formProduto);

            let isValid = true;
            isValid &= validarCampoTextoObrigatorio(document.getElementById('produto-nome'), 'Nome do produto');
            isValid &= validarCampoNumero(document.getElementById('produto-valor-compra'), 'Valor de compra', { permiteZero: true, obrigatorio: true });
            // valor_venda é opcional no form, mas se preenchido, deve ser número
            isValid &= validarCampoNumero(document.getElementById('produto-valor-venda'), 'Valor de venda', { permiteZero: true, obrigatorio: false });
            isValid &= validarCampoNumero(document.getElementById('produto-estoque'), 'Estoque', { permiteZero: true, obrigatorio: true, permiteNegativo: false });


            if (!isValid) {
                showToast('Por favor, corrija os erros no formulário.', 'error');
                return;
            }

            const produtoId = produtoIdInput.value;
            const produtoData = {
                nome: document.getElementById('produto-nome').value.trim(),
                categoria: document.getElementById('produto-categoria').value.trim() || null,
                valor_compra: moedaParaNumero(document.getElementById('produto-valor-compra').value),
                valor_venda: moedaParaNumero(document.getElementById('produto-valor-venda').value) || null, // Pode ser null
                estoque_atual: parseInt(document.getElementById('produto-estoque').value),
                imagem_url: document.getElementById('produto-imagem-url').value.trim() || null,
                user_id: getCurrentUser().id
            };
            if (produtoData.valor_venda === 0 && document.getElementById('produto-valor-venda').value.trim() !== "0") { // Se explicitamente 0 é permitido, caso contrário null.
                produtoData.valor_venda = null;
            }


            let endpoint = `${C4APP_CONFIG.DB_ENDPOINT}/produtos`;
            let method = 'POST';
            const headers = { 'Prefer': 'return=representation' }; // Para obter o registro de volta

            if (produtoId) { // Modo de edição
                endpoint += `?id=eq.${produtoId}`;
                method = 'PATCH';
            }

            try {
                const resultado = await supabaseFetch(endpoint, method, produtoData, headers);
                showToast(`Produto ${produtoId ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
                toggleForm(false);
                carregarListaProdutos(); // Atualiza a lista
            } catch (error) {
                console.error('Erro ao salvar produto:', error);
                showToast(`Erro ao salvar produto: ${error.message}`, 'error');
            }
        });
    }

    async function carregarListaProdutos() {
        if (!listaProdutosEl) return;
        listaProdutosEl.innerHTML = '<div class="loading-message col-span-full"><div class="spinner"></div><p>Carregando produtos...</p></div>';
        
        if (!getCurrentUser()) {
            listaProdutosEl.innerHTML = '<p class="empty-message col-span-full p-m">Faça login para ver seus produtos.</p>';
            return;
        }

        try {
            const produtos = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?select=*&user_id=eq.${getCurrentUser().id}&order=nome.asc`);
            if (produtos && produtos.length > 0) {
                listaProdutosEl.innerHTML = '';
                produtos.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'card card-produto';
                    // Se valor_venda não existir ou for 0, usar uma estimativa (ex: valor_compra * 1.7) para exibição, mas não salvar isso.
                    const displayValorVenda = p.valor_venda ? formatarMoeda(p.valor_venda) : `<em>(${formatarMoeda(p.valor_compra * 1.7)})</em>`;

                    card.innerHTML = `
                        <img src="${p.imagem_url || '../assets/img/placeholder_produto.png'}" alt="${p.nome}" class="card-image">
                        <div class="card-content" style="padding: var(--espaco-s) var(--espaco-m) var(--espaco-m);">
                            <h3 class="produto-nome">${p.nome}</h3>
                            <p class="produto-preco">Venda: ${displayValorVenda}</p>
                            <p class="text-sm text-gray">Custo: ${formatarMoeda(p.valor_compra)} | Estoque: ${p.estoque_atual}</p>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-outline-primary btn-sm btn-edit-produto" data-id="${p.id}" aria-label="Editar ${p.nome}"><span class="icon" aria-hidden="true">✏️</span> Editar</button>
                            <button class="btn btn-danger btn-sm btn-delete-produto" data-id="${p.id}" aria-label="Excluir ${p.nome}" style="background-color: transparent; color: var(--vermelho-erro); border-color: var(--vermelho-erro);"><span class="icon" aria-hidden="true">🗑️</span> Excluir</button>
                        </div>
                    `;
                    card.querySelector('.btn-edit-produto').addEventListener('click', () => toggleForm(true, p));
                    card.querySelector('.btn-delete-produto').addEventListener('click', () => confirmarExclusaoProduto(p.id, p.nome));
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
        // Usar o modal global showAppModal
        window.showAppModal(
            'Confirmar Exclusão',
            `<p>Tem certeza que deseja excluir o produto "<strong>${produtoNome}</strong>"? Esta ação não pode ser desfeita.</p>`,
            `<button class="btn btn-outline-primary" data-dismiss-modal="confirmDeleteProdutoModal">Cancelar</button>
             <button class="btn btn-danger" id="btnConfirmDeleteProduto">Excluir</button>`,
            'confirmDeleteProdutoModal'
        );

        document.getElementById('btnConfirmDeleteProduto').addEventListener('click', async () => {
            try {
                await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?id=eq.${produtoId}`, 'DELETE');
                showToast(`Produto "${produtoNome}" excluído com sucesso.`, 'success');
                carregarListaProdutos();
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                showToast(`Erro ao excluir produto: ${error.message}`, 'error');
            } finally {
                window.closeAppModal('confirmDeleteProdutoModal');
            }
        }, { once: true }); // Garante que o listener seja adicionado e removido corretamente
    }
    carregarListaProdutos();
}
// console.log('produtos.js carregado e revisado.');
