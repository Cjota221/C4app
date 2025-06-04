// 📁 js/vendas.js
function initVendas() {
    // console.log('Inicializando Vendas...');
    const formVenda = document.getElementById('form-venda');
    const selectProdutoEl = document.getElementById('venda-produto');
    const quantidadeInput = document.getElementById('venda-quantidade');
    const valorUnitarioDisplay = document.getElementById('venda-valor-unitario');
    const valorTotalDisplay = document.getElementById('venda-valor-total');
    const vendasHistoricoListEl = document.getElementById('vendas-historico-list');

    let produtosDisponiveis = []; // Cache de produtos com estoque e preço

    async function carregarProdutosParaVenda() {
        if (!selectProdutoEl) return;
        selectProdutoEl.innerHTML = '<option value="">Carregando...</option>';
        
        if (!getCurrentUser()) {
            selectProdutoEl.innerHTML = '<option value="">Faça login para carregar produtos</option>';
            return;
        }

        try {
            // Carregar apenas produtos com valor_venda definido e estoque > 0
            const produtos = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?select=id,nome,valor_venda,estoque_atual&user_id=eq.${getCurrentUser().id}&valor_venda=not.is.null&estoque_atual=gt.0&order=nome.asc`);
            produtosDisponiveis = produtos;

            if (produtos && produtos.length > 0) {
                selectProdutoEl.innerHTML = '<option value="">Selecione um produto</option>';
                produtos.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = `${p.nome} (${formatarMoeda(p.valor_venda)}) - Estoque: ${p.estoque_atual}`;
                    option.dataset.preco = p.valor_venda;
                    option.dataset.estoqueMax = p.estoque_atual;
                    selectProdutoEl.appendChild(option);
                });
            } else {
                selectProdutoEl.innerHTML = '<option value="">Nenhum produto disponível para venda (verifique estoque/preço)</option>';
            }
        } catch (error) {
            console.error("Erro ao carregar produtos para venda:", error);
            selectProdutoEl.innerHTML = `<option value="">Erro: ${error.message}</option>`;
        }
    }

    function atualizarCalculoValor() {
        const produtoId = selectProdutoEl.value;
        const quantidade = parseInt(quantidadeInput.value) || 0;

        if (produtoId && quantidade > 0) {
            const produtoSelecionado = produtosDisponiveis.find(p => p.id == produtoId);
            if (produtoSelecionado) {
                valorUnitarioDisplay.value = formatarMoeda(produtoSelecionado.valor_venda);
                valorTotalDisplay.textContent = formatarMoeda(produtoSelecionado.valor_venda * quantidade);
                // Ajustar o max do input de quantidade para o estoque disponível
                quantidadeInput.max = produtoSelecionado.estoque_atual;
                if (quantidade > produtoSelecionado.estoque_atual) {
                    quantidadeInput.value = produtoSelecionado.estoque_atual; // Corrige para o máximo
                    showToast(`Quantidade ajustada para o estoque máximo de ${produtoSelecionado.estoque_atual} unidades.`, 'info');
                    // Recalcula com a quantidade corrigida
                    valorTotalDisplay.textContent = formatarMoeda(produtoSelecionado.valor_venda * produtoSelecionado.estoque_atual);
                }
            } else {
                valorUnitarioDisplay.value = 'R$ 0,00';
                valorTotalDisplay.textContent = 'R$ 0,00';
            }
        } else {
            valorUnitarioDisplay.value = 'R$ 0,00';
            valorTotalDisplay.textContent = 'R$ 0,00';
        }
    }

    if (selectProdutoEl) selectProdutoEl.addEventListener('change', atualizarCalculoValor);
    if (quantidadeInput) quantidadeInput.addEventListener('input', atualizarCalculoValor);

    if (formVenda) {
        formVenda.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!getCurrentUser()) {
                showToast('Você precisa estar logada para registrar vendas.', 'error');
                return;
            }
            limparErrosFormulario(formVenda);

            let isValid = true;
            isValid &= validarCampoTextoObrigatorio(document.getElementById('venda-cliente-nome'), 'Nome da Cliente');
            isValid &= validarCampoTextoObrigatorio(selectProdutoEl, 'Produto Vendido');
            isValid &= validarCampoNumero(quantidadeInput, 'Quantidade', { permiteZero: false, permiteNegativo: false });
            isValid &= validarCampoTextoObrigatorio(document.getElementById('venda-forma-pagamento'), 'Forma de Pagamento');
            
            const produtoSelecionado = produtosDisponiveis.find(p => p.id == selectProdutoEl.value);
            if (produtoSelecionado && parseInt(quantidadeInput.value) > produtoSelecionado.estoque_atual) {
                exibirErroCampo(quantidadeInput, `Quantidade excede o estoque de ${produtoSelecionado.estoque_atual} unidades.`);
                isValid = false;
            }


            if (!isValid) {
                showToast('Por favor, corrija os erros no formulário.', 'error');
                return;
            }

            const valorTotalNumerico = moedaParaNumero(valorTotalDisplay.textContent);

            const vendaData = {
                cliente_nome: document.getElementById('venda-cliente-nome').value.trim(),
                cliente_telefone: document.getElementById('venda-cliente-telefone').value.trim() || null,
                produto_id: parseInt(selectProdutoEl.value),
                quantidade: parseInt(quantidadeInput.value),
                valor_unitario: produtoSelecionado ? produtoSelecionado.valor_venda : 0,
                valor_total: valorTotalNumerico,
                forma_pagamento: document.getElementById('venda-forma-pagamento').value,
                numero_venda: document.getElementById('venda-num').value.trim() || null,
                data_venda: new Date().toISOString(), // Data atual
                user_id: getCurrentUser().id
            };

            try {
                // 1. Registrar a venda
                const headers = { 'Prefer': 'return=representation' };
                const vendaRegistrada = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas`, 'POST', vendaData, headers);

                // 2. Dar baixa no estoque do produto
                if (produtoSelecionado) {
                    const novoEstoque = produtoSelecionado.estoque_atual - vendaData.quantidade;
                    await supabaseFetch(
                        `${C4APP_CONFIG.DB_ENDPOINT}/produtos?id=eq.${produtoSelecionado.id}`,
                        'PATCH',
                        { estoque_atual: novoEstoque }
                    );
                }

                showToast('Venda registrada com sucesso!', 'success');
                formVenda.reset();
                valorTotalDisplay.textContent = 'R$ 0,00'; // Reseta o display de total
                valorUnitarioDisplay.value = '';
                carregarProdutosParaVenda(); // Recarrega produtos para atualizar estoque no select
                carregarHistoricoVendas(); // Atualiza histórico

            } catch (error) {
                console.error('Erro ao registrar venda:', error);
                showToast(`Erro ao registrar venda: ${error.message}`, 'error');
            }
        });
    }

    async function carregarHistoricoVendas() {
        if (!vendasHistoricoListEl) return;
        vendasHistoricoListEl.innerHTML = '<div class="loading-message"><div class="spinner"></div></div>';

        if (!getCurrentUser()) {
            vendasHistoricoListEl.innerHTML = '<p class="empty-message p-m">Faça login para ver o histórico.</p>';
            return;
        }
        
        try {
            const vendas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=*,produtos(nome)&user_id=eq.${getCurrentUser().id}&order=data_venda.desc&limit=10`);
            if (vendas && vendas.length > 0) {
                vendasHistoricoListEl.innerHTML = ''; // Limpa
                vendas.forEach(v => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'card-list-item';
                    itemDiv.innerHTML = `
                        <div class="item-details">
                            <span class="item-name">${v.produtos ? v.produtos.nome : 'Produto Indisponível'} (Qtd: ${v.quantidade})</span>
                            <small>Cliente: ${v.cliente_nome || 'Não informado'}</small>
                            <small>Data: ${new Date(v.data_venda).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour:'2-digit', minute:'2-digit' })}</small>
                        </div>
                        <span class="item-value">${formatarMoeda(v.valor_total)}</span>
                    `;
                    vendasHistoricoListEl.appendChild(itemDiv);
                });
            } else {
                vendasHistoricoListEl.innerHTML = '<p class="empty-message p-m text-center">Nenhuma venda registrada recentemente.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de vendas:', error);
            vendasHistoricoListEl.innerHTML = `<p class="error-message p-m">Falha ao carregar histórico: ${error.message}</p>`;
        }
    }

    carregarProdutosParaVenda();
    carregarHistoricoVendas();
}
// console.log('vendas.js carregado e revisado.');
