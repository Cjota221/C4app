// 📁 js/vendas.js
// Corrigido: Eventos de botões e validações melhoradas

function initVendas() {
    console.log('Inicializando Vendas...');
    
    // Corrigido: Verificação de existência dos elementos
    const formVenda = document.getElementById('form-venda');
    const selectProdutoEl = document.getElementById('venda-produto');
    const quantidadeInput = document.getElementById('venda-quantidade');
    const valorUnitarioDisplay = document.getElementById('venda-valor-unitario');
    const valorTotalDisplay = document.getElementById('venda-valor-total');
    const vendasHistoricoListEl = document.getElementById('vendas-historico-list');

    if (!formVenda || !selectProdutoEl || !quantidadeInput || !valorTotalDisplay) {
        console.error('Elementos essenciais da página de vendas não encontrados');
        return;
    }

    let produtosDisponiveis = [];

    async function carregarProdutosParaVenda() {
        if (!selectProdutoEl) return;
        selectProdutoEl.innerHTML = '<option value="">Carregando produtos...</option>';
        
        // Corrigido: Verificar getCurrentUser com fallback
        let currentUser;
        try {
            currentUser = getCurrentUser();
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            selectProdutoEl.innerHTML = '<option value="">Erro de autenticação</option>';
            return;
        }

        if (!currentUser) {
            selectProdutoEl.innerHTML = '<option value="">Faça login para carregar produtos</option>';
            return;
        }

        try {
            const produtos = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?select=id,nome,valor_venda,estoque_atual&user_id=eq.${currentUser.id}&valor_venda=not.is.null&estoque_atual=gt.0&order=nome.asc`);
            produtosDisponiveis = produtos || [];

            if (produtos && produtos.length > 0) {
                selectProdutoEl.innerHTML = '<option value="">Selecione um produto</option>';
                produtos.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    
                    // Corrigido: Verificar função formatarMoeda
                    const formatMoney = (valor) => {
                        if (typeof formatarMoeda === 'function') {
                            return formatarMoeda(valor);
                        }
                        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
                    };
                    
                    option.textContent = `${p.nome} (${formatMoney(p.valor_venda)}) - Estoque: ${p.estoque_atual}`;
                    option.dataset.preco = p.valor_venda;
                    option.dataset.estoqueMax = p.estoque_atual;
                    selectProdutoEl.appendChild(option);
                });
            } else {
                selectProdutoEl.innerHTML = '<option value="">Nenhum produto disponível para venda</option>';
            }
        } catch (error) {
            console.error("Erro ao carregar produtos para venda:", error);
            selectProdutoEl.innerHTML = `<option value="">Erro: ${error.message}</option>`;
        }
    }

    function atualizarCalculoValor() {
        const produtoId = selectProdutoEl.value;
        const quantidade = parseInt(quantidadeInput.value) || 0;

        // Corrigido: Função de formatação com fallback
        const formatMoney = (valor) => {
            if (typeof formatarMoeda === 'function') {
                return formatarMoeda(valor);
            }
            return `R$ ${valor.toFixed(2).replace('.', ',')}`;
        };

        if (produtoId && quantidade > 0) {
            const produtoSelecionado = produtosDisponiveis.find(p => p.id == produtoId);
            if (produtoSelecionado) {
                if (valorUnitarioDisplay) {
                    valorUnitarioDisplay.value = formatMoney(produtoSelecionado.valor_venda);
                }
                if (valorTotalDisplay) {
                    valorTotalDisplay.textContent = formatMoney(produtoSelecionado.valor_venda * quantidade);
                }
                
                // Corrigido: Ajustar max do input
                quantidadeInput.max = produtoSelecionado.estoque_atual;
                if (quantidade > produtoSelecionado.estoque_atual) {
                    quantidadeInput.value = produtoSelecionado.estoque_atual;
                    if (typeof showToast === 'function') {
                        showToast(`Quantidade ajustada para o estoque máximo de ${produtoSelecionado.estoque_atual} unidades.`, 'info');
                    }
                    if (valorTotalDisplay) {
                        valorTotalDisplay.textContent = formatMoney(produtoSelecionado.valor_venda * produtoSelecionado.estoque_atual);
                    }
                }
            } else {
                if (valorUnitarioDisplay) valorUnitarioDisplay.value = 'R$ 0,00';
                if (valorTotalDisplay) valorTotalDisplay.textContent = 'R$ 0,00';
            }
        } else {
            if (valorUnitarioDisplay) valorUnitarioDisplay.value = 'R$ 0,00';
            if (valorTotalDisplay) valorTotalDisplay.textContent = 'R$ 0,00';
        }
    }

    // Corrigido: Event listeners com verificação
    if (selectProdutoEl) {
        selectProdutoEl.addEventListener('change', atualizarCalculoValor);
    }
    if (quantidadeInput) {
        quantidadeInput.addEventListener('input', atualizarCalculoValor);
    }

    if (formVenda) {
        formVenda.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Formulário de venda submetido');
            
            // Corrigido: Verificar getCurrentUser
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
                    showToast('Você precisa estar logada para registrar vendas.', 'error');
                }
                return;
            }

            // Corrigido: Limpar erros com verificação
            if (typeof limparErrosFormulario === 'function') {
                limparErrosFormulario(formVenda);
            }

            let isValid = true;
            
            // Corrigido: Validações com verificação de funções
            const validarCampo = (elemento, validador, ...args) => {
                if (elemento && typeof validador === 'function') {
                    return validador(elemento, ...args);
                }
                return true;
            };

            isValid &= validarCampo(document.getElementById('venda-cliente-nome'), validarCampoTextoObrigatorio, 'Nome da Cliente');
            isValid &= validarCampo(selectProdutoEl, validarCampoTextoObrigatorio, 'Produto Vendido');
            isValid &= validarCampo(quantidadeInput, validarCampoNumero, 'Quantidade', { permiteZero: false, permiteNegativo: false });
            isValid &= validarCampo(document.getElementById('venda-forma-pagamento'), validarCampoTextoObrigatorio, 'Forma de Pagamento');
            
            const produtoSelecionado = produtosDisponiveis.find(p => p.id == selectProdutoEl.value);
            if (produtoSelecionado && parseInt(quantidadeInput.value) > produtoSelecionado.estoque_atual) {
                if (typeof exibirErroCampo === 'function') {
                    exibirErroCampo(quantidadeInput, `Quantidade excede o estoque de ${produtoSelecionado.estoque_atual} unidades.`);
                }
                isValid = false;
            }

            if (!isValid) {
                if (typeof showToast === 'function') {
                    showToast('Por favor, corrija os erros no formulário.', 'error');
                }
                return;
            }

            // Corrigido: Coleta de dados com verificação
            const obterValorCampo = (id) => {
                const campo = document.getElementById(id);
                return campo ? campo.value.trim() : '';
            };

            const vendaData = {
                cliente_nome: obterValorCampo('venda-cliente-nome'),
                cliente_telefone: obterValorCampo('venda-cliente-telefone') || null,
                produto_id: selectProdutoEl.value,
                produto_nome: produtoSelecionado.nome,
                quantidade: parseInt(quantidadeInput.value),
                valor_unitario: produtoSelecionado.valor_venda,
                valor_total: produtoSelecionado.valor_venda * parseInt(quantidadeInput.value),
                forma_pagamento: obterValorCampo('venda-forma-pagamento'),
                numeracao_venda: obterValorCampo('venda-num') || null,
                user_id: currentUser.id
            };

            try {
                // Registrar venda
                await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas`, 'POST', vendaData);
                
                // Atualizar estoque do produto
                const novoEstoque = produtoSelecionado.estoque_atual - vendaData.quantidade;
                await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?id=eq.${vendaData.produto_id}`, 'PATCH', {
                    estoque_atual: novoEstoque
                });

                if (typeof showToast === 'function') {
                    showToast('Venda registrada com sucesso!', 'success');
                }
                
                // Corrigido: Reset do formulário
                formVenda.reset();
                if (valorUnitarioDisplay) valorUnitarioDisplay.value = '';
                if (valorTotalDisplay) valorTotalDisplay.textContent = 'R$ 0,00';
                
                // Recarregar produtos e histórico
                carregarProdutosParaVenda();
                carregarHistoricoVendas();
                
            } catch (error) {
                console.error('Erro ao registrar venda:', error);
                if (typeof showToast === 'function') {
                    showToast(`Erro ao registrar venda: ${error.message}`, 'error');
                }
            }
        });
    }

    async function carregarHistoricoVendas() {
        if (!vendasHistoricoListEl) return;
        
        vendasHistoricoListEl.innerHTML = '<p class="loading-message">Carregando histórico...</p>';
        
        let currentUser;
        try {
            currentUser = getCurrentUser();
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            vendasHistoricoListEl.innerHTML = '<p class="error-message">Erro de autenticação</p>';
            return;
        }

        if (!currentUser) {
            vendasHistoricoListEl.innerHTML = '<p class="empty-message">Faça login para ver o histórico</p>';
            return;
        }

        try {
            const vendas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=*&user_id=eq.${currentUser.id}&order=created_at.desc&limit=10`);
            
            if (vendas && vendas.length > 0) {
                vendasHistoricoListEl.innerHTML = '';
                vendas.forEach(v => {
                    const vendaCard = document.createElement('div');
                    vendaCard.className = 'card';
                    
                    // Corrigido: Formatação de data e moeda
                    const formatMoney = (valor) => {
                        if (typeof formatarMoeda === 'function') {
                            return formatarMoeda(valor);
                        }
                        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
                    };
                    
                    const dataVenda = new Date(v.created_at).toLocaleDateString('pt-BR');
                    
                    vendaCard.innerHTML = `
                        <div class="card-content">
                            <h4>${v.cliente_nome}</h4>
                            <p><strong>${v.produto_nome}</strong> - Qtd: ${v.quantidade}</p>
                            <p>Total: ${formatMoney(v.valor_total)} (${v.forma_pagamento})</p>
                            <p class="text-sm text-gray">${dataVenda}${v.numeracao_venda ? ` - ${v.numeracao_venda}` : ''}</p>
                        </div>
                    `;
                    vendasHistoricoListEl.appendChild(vendaCard);
                });
            } else {
                vendasHistoricoListEl.innerHTML = '<p class="empty-message">Nenhuma venda registrada ainda</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            vendasHistoricoListEl.innerHTML = `<p class="error-message">Erro ao carregar histórico: ${error.message}</p>`;
        }
    }

    // Corrigido: Inicializar com tratamento de erro
    try {
        carregarProdutosParaVenda();
        carregarHistoricoVendas();
    } catch (error) {
        console.error('Erro ao inicializar vendas:', error);
    }
}

console.log('vendas.js carregado e corrigido');

