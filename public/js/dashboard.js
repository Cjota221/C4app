// 📁 js/dashboard.js
function initDashboard() {
    // console.log('Inicializando Dashboard...');
    const lucroEstimadoEl = document.getElementById('db-lucro-estimado');
    const produtosAtivosEl = document.getElementById('db-produtos-ativos');
    const vendasMesEl = document.getElementById('db-vendas-mes');
    const crmListEl = document.getElementById('db-crm-list');

    async function carregarDadosDashboard() {
        if (!getCurrentUser()) {
            if (lucroEstimadoEl) lucroEstimadoEl.textContent = 'N/A';
            if (produtosAtivosEl) produtosAtivosEl.textContent = 'N/A';
            if (vendasMesEl) vendasMesEl.textContent = 'N/A';
            if (crmListEl) crmListEl.innerHTML = '<p class="text-center empty-message p-m">Faça login para ver seus dados.</p>';
            return;
        }

        try {
            // 1. Produtos Ativos e Lucro Estimado
            const produtos = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?select=valor_compra,valor_venda,estoque_atual&user_id=eq.${getCurrentUser().id}`);
            
            if (produtosAtivosEl) produtosAtivosEl.textContent = produtos.length.toString();
            
            let lucroTotalEstimado = 0;
            if (produtos && produtos.length > 0) {
                produtos.forEach(p => {
                    const precoVenda = p.valor_venda || (p.valor_compra * 1.7); // Estimativa se não houver valor_venda
                    const lucroUnitario = precoVenda - p.valor_compra;
                    if (lucroUnitario > 0 && p.estoque_atual > 0) {
                        lucroTotalEstimado += lucroUnitario * p.estoque_atual;
                    }
                });
            }
            if (lucroEstimadoEl) lucroEstimadoEl.textContent = formatarMoeda(lucroTotalEstimado);

            // 2. Vendas do Mês
            const hoje = new Date();
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
            const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

            const vendas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=valor_total&data_venda=gte.${inicioMes}&data_venda=lte.${fimMes}&user_id=eq.${getCurrentUser().id}`);
            const totalVendasMes = vendas.reduce((sum, v) => sum + v.valor_total, 0);
            if (vendasMesEl) vendasMesEl.textContent = formatarMoeda(totalVendasMes);

            // 3. CRM Lembretes
            const todasVendasCRM = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=cliente_nome,data_venda&user_id=eq.${getCurrentUser().id}&order=data_venda.desc`);
            const clientesContato = verificarClientesParaContato(todasVendasCRM, 30); // Usando crm.js

            if (crmListEl) {
                if (clientesContato.length > 0) {
                    crmListEl.innerHTML = ''; // Limpa mensagem padrão
                    clientesContato.forEach(cliente => {
                        const item = document.createElement('div');
                        item.className = 'card-list-item';
                        item.innerHTML = `
                            <div class="crm-client-info">
                                <span class="crm-client-name">${cliente.nome}</span>
                                <small class="crm-last-purchase">Última compra: ${cliente.ultimaCompraDataFormatada} (${cliente.diasDesdeUltimaCompra} dias)</small>
                            </div>
                            <div class="crm-action">
                                <button class="btn btn-secondary btn-sm" data-cliente-nome="${cliente.nome}">Lembrar</button>
                            </div>
                        `;
                        // Adicionar event listener ao botão "Lembrar" se necessário
                        item.querySelector('.btn-secondary').addEventListener('click', (e) => {
                            const nome = e.target.dataset.clienteNome;
                            showToast(`Lembrete para ${nome}: Enviar uma mensagem ou oferta especial!`, 'info', 5000);
                        });
                        crmListEl.appendChild(item);
                    });
                } else {
                    crmListEl.innerHTML = '<p class="text-center empty-message p-m">Todos os clientes ativos recentemente!</p>';
                }
            }

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            if (lucroEstimadoEl) lucroEstimadoEl.textContent = 'Erro';
            if (produtosAtivosEl) produtosAtivosEl.textContent = 'Erro';
            if (vendasMesEl) vendasMesEl.textContent = 'Erro';
            if (crmListEl) crmListEl.innerHTML = `<p class="error-message p-m">Falha ao carregar lembretes: ${error.message}</p>`;
            showToast(`Erro ao carregar dashboard: ${error.message}`, 'error');
        }
    }
    carregarDadosDashboard();
}
// console.log('dashboard.js carregado e revisado.');
