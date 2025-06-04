// 📁 js/relatorios.js
function initRelatorios() {
    // console.log('Inicializando Relatórios...');

    const formFiltros = document.getElementById('form-filtros-relatorios');
    const selectTipoRelatorio = document.getElementById('relatorio-tipo');
    const selectPeriodo = document.getElementById('relatorio-periodo');
    const periodoCustomizadoFields = document.getElementById('periodo-customizado-fields');
    const dataInicioInput = document.getElementById('relatorio-data-inicio');
    const dataFimInput = document.getElementById('relatorio-data-fim');
    const resultadoTituloEl = document.getElementById('relatorio-resultado-titulo');
    const resultadoConteudoEl = document.getElementById('relatorio-resultado-conteudo');

    function setDefaultDates() {
        const { inicio, fim } = getDatasFromPeriodo(selectPeriodo.value);
        dataInicioInput.value = inicio;
        dataFimInput.value = fim;
    }

    if (selectPeriodo) {
        selectPeriodo.addEventListener('change', function() {
            periodoCustomizadoFields.classList.toggle('hidden', this.value !== 'customizado');
            if (this.value !== 'customizado') {
                setDefaultDates();
                // Dispara o submit do formulário automaticamente ao mudar período pré-definido
                // formFiltros.dispatchEvent(new Event('submit', { bubbles: true })); // bubbles pode ajudar se houver nested forms
            } else {
                // Limpa datas customizadas se voltar de um período pré-definido
                dataInicioInput.value = '';
                dataFimInput.value = '';
            }
        });
    }
    
    function getDatasFromPeriodo(periodo) {
        const hoje = new Date();
        let dataInicio = new Date(hoje);
        let dataFim = new Date(hoje);

        dataInicio.setHours(0,0,0,0); // Normaliza para início do dia
        dataFim.setHours(23,59,59,999); // Normaliza para fim do dia

        switch (periodo) {
            case 'hoje':
                // já é hoje
                break;
            case 'ontem':
                dataInicio.setDate(hoje.getDate() - 1);
                dataFim.setDate(hoje.getDate() - 1);
                break;
            case 'semana_atual':
                // Segunda-feira desta semana (getDay() retorna 0 para Domingo, 1 para Segunda, ..., 6 para Sábado)
                const primeiroDiaSemana = hoje.getDate() - hoje.getDay() + (hoje.getDay() === 0 ? -6 : 1);
                dataInicio = new Date(hoje.setDate(primeiroDiaSemana));
                dataInicio.setHours(0,0,0,0);
                // Domingo desta semana
                dataFim = new Date(dataInicio); // Começa da data de início da semana
                dataFim.setDate(dataInicio.getDate() + 6);
                dataFim.setHours(23,59,59,999);
                break;
            case 'semana_passada':
                const primeiroDiaSemanaPassada = hoje.getDate() - hoje.getDay() - 6;
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), primeiroDiaSemanaPassada);
                dataInicio.setHours(0,0,0,0);
                dataFim = new Date(dataInicio);
                dataFim.setDate(dataInicio.getDate() + 6);
                dataFim.setHours(23,59,59,999);
                break;
            case 'mes_atual':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'mes_passado':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'ultimos_30_dias':
                dataInicio.setDate(hoje.getDate() - 29); // Hoje menos 29 dias = 30 dias no total
                // dataFim é hoje (já normalizado)
                break;
            default: // Caso customizado ou inesperado, retorna datas vazias ou atuais
                 return { inicio: '', fim: '' };
        }
        return {
            inicio: dataInicio.toISOString().split('T')[0],
            fim: dataFim.toISOString().split('T')[0]
        };
    }

    formFiltros.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!getCurrentUser()) {
            resultadoConteudoEl.innerHTML = '<p class="empty-message p-m">Faça login para gerar relatórios.</p>';
            resultadoTituloEl.textContent = 'Faça Login';
            return;
        }
        resultadoConteudoEl.innerHTML = '<div class="loading-message"><div class="spinner"></div><p>Gerando relatório...</p></div>';
        limparErrosFormulario(formFiltros);

        const tipoRelatorio = selectTipoRelatorio.value;
        const periodoSelecionado = selectPeriodo.value;
        let dataInicioStr, dataFimStr;

        if (periodoSelecionado === 'customizado') {
            dataInicioStr = dataInicioInput.value;
            dataFimStr = dataFimInput.value;
            let customDateValid = true;
            customDateValid &= validarCampoData(dataInicioInput, 'Data de Início', true);
            customDateValid &= validarCampoData(dataFimInput, 'Data Final', true);
            if (!customDateValid) {
                resultadoConteudoEl.innerHTML = '<p class="error-message p-m">Datas inválidas para período customizado.</p>';
                showToast('Datas inválidas para período customizado.', 'error');
                return;
            }
            if (new Date(dataFimStr) < new Date(dataInicioStr)) {
                exibirErroCampo(dataFimInput, 'Data final não pode ser anterior à data inicial.');
                resultadoConteudoEl.innerHTML = '<p class="error-message p-m">Data final anterior à data inicial.</p>';
                showToast('Data final não pode ser anterior à data inicial.', 'error');
                return;
            }
        } else {
            const datas = getDatasFromPeriodo(periodoSelecionado);
            dataInicioStr = datas.inicio;
            dataFimStr = datas.fim;
        }
        
        const dataInicioQuery = `${dataInicioStr}T00:00:00.000Z`;
        const dataFimQuery = `${dataFimStr}T23:59:59.999Z`;

        resultadoTituloEl.textContent = `Relatório de ${tipoRelatorio.replace("_", " ")} (${new Date(dataInicioQuery).toLocaleDateString('pt-BR')} - ${new Date(dataFimQuery).toLocaleDateString('pt-BR')})`;

        try {
            const userId = getCurrentUser().id;
            if (tipoRelatorio === 'vendas') {
                const vendas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=*,produtos(nome)&data_venda=gte.${dataInicioQuery}&data_venda=lte.${dataFimQuery}&user_id=eq.${userId}&order=data_venda.desc`);
                renderRelatorioVendas(vendas);
            } else if (tipoRelatorio === 'despesas') {
                const despesas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/despesas?select=*&data_criacao=gte.${dataInicioQuery}&data_criacao=lte.${dataFimQuery}&user_id=eq.${userId}&order=data_criacao.desc`);
                renderRelatorioDespesas(despesas);
            } else if (tipoRelatorio === 'lucratividade_produtos') {
                const vendas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=quantidade,valor_unitario,produtos(id,nome,valor_compra)&data_venda=gte.${dataInicioQuery}&data_venda=lte.${dataFimQuery}&user_id=eq.${userId}`);
                renderLucratividadeProdutos(vendas);
            } else if (tipoRelatorio === 'geral') {
                 const [vendasData, despesasData] = await Promise.all([
                    supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/vendas?select=valor_total&data_venda=gte.${dataInicioQuery}&data_venda=lte.${dataFimQuery}&user_id=eq.${userId}`),
                    supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/despesas?select=valor&data_criacao=gte.${dataInicioQuery}&data_criacao=lte.${dataFimQuery}&user_id=eq.${userId}`)
                ]);
                renderResumoGeral(vendasData, despesasData);
            }

        } catch (error) {
            console.error(`Erro ao gerar relatório de ${tipoRelatorio}:`, error);
            resultadoConteudoEl.innerHTML = `<p class="error-message p-m">Falha ao gerar relatório: ${error.message}</p>`;
        }
    });

    function renderRelatorioVendas(vendas) { /* Implementação anterior OK */ }
    function renderRelatorioDespesas(despesas) { /* Implementação anterior OK */ }
    function renderResumoGeral(vendas, despesas) { /* Implementação anterior OK */ }
    // Re-colocando as funções de renderização para completude do arquivo
    function renderRelatorioVendas(vendas) {
        if (!vendas || vendas.length === 0) {
            resultadoConteudoEl.innerHTML = '<p class="p-m text-center empty-message">Nenhuma venda encontrada para este período.</p>';
            return;
        }
        let totalVendido = 0;
        let html = '<ul class="simple-list">';
        vendas.forEach(v => {
            totalVendido += v.valor_total;
            html += `
                <li class="card-list-item">
                    <div class="item-details" style="flex-grow:1;">
                        <span class="item-name">${v.produtos ? v.produtos.nome : 'Produto não identificado'} (Qtd: ${v.quantidade})</span>
                        <small style="display:block; color:var(--cinza-texto-secundario)">Cliente: ${v.cliente_nome || 'Não informado'} - ${new Date(v.data_venda).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'})}</small>
                    </div>
                    <span class="item-value text-right" style="color: var(--verde-sucesso); min-width: 100px;">${formatarMoeda(v.valor_total)}</span>
                </li>`;
        });
        html += '</ul>';
        html += `<p class="text-right mt-m" style="font-size: 1.2rem; font-weight: bold;"><strong>Total Vendido: ${formatarMoeda(totalVendido)}</strong></p>`;
        resultadoConteudoEl.innerHTML = html;
    }
    
    function renderRelatorioDespesas(despesas) {
        if (!despesas || despesas.length === 0) {
            resultadoConteudoEl.innerHTML = '<p class="p-m text-center empty-message">Nenhuma despesa encontrada para este período.</p>';
            return;
        }
        let totalDespesas = 0;
        let html = '<ul class="simple-list">';
        despesas.forEach(d => {
            totalDespesas += d.valor;
             html += `
                <li class="card-list-item">
                    <div class="item-details" style="flex-grow:1;">
                        <span class="item-name">${d.descricao} (${d.tipo_despesa})</span>
                        <small style="display:block; color:var(--cinza-texto-secundario)">Data: ${new Date(d.data_criacao).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'})}</small>
                    </div>
                    <span class="item-value text-right" style="color: var(--vermelho-erro); min-width: 100px;">${formatarMoeda(d.valor)}</span>
                </li>`;
        });
        html += '</ul>';
        html += `<p class="text-right mt-m" style="font-size: 1.2rem; font-weight: bold;"><strong>Total Despesas: ${formatarMoeda(totalDespesas)}</strong></p>`;
        resultadoConteudoEl.innerHTML = html;
    }

    function renderLucratividadeProdutos(vendas) {
        if (!vendas || vendas.length === 0) {
            resultadoConteudoEl.innerHTML = '<p class="p-m text-center empty-message">Nenhuma venda encontrada para calcular lucratividade.</p>';
            return;
        }

        const produtosLucro = {}; // { produtoId: { nome: 'Nome', totalVendido: X, totalCusto: Y, totalLucro: Z, qtdVendida: N } }

        vendas.forEach(venda => {
            if (!venda.produtos || typeof venda.produtos.valor_compra === 'undefined') return; // Precisa do custo

            const produtoId = venda.produtos.id;
            if (!produtosLucro[produtoId]) {
                produtosLucro[produtoId] = {
                    nome: venda.produtos.nome,
                    totalVendidoValor: 0,
                    totalCustoValor: 0,
                    totalLucroValor: 0,
                    qtdVendida: 0
                };
            }
            const custoProdutoVenda = venda.produtos.valor_compra * venda.quantidade;
            const valorVendaProduto = venda.valor_unitario * venda.quantidade; // Usa valor_unitario da venda, não o valor_venda do produto (pode ter tido desconto)

            produtosLucro[produtoId].qtdVendida += venda.quantidade;
            produtosLucro[produtoId].totalVendidoValor += valorVendaProduto;
            produtosLucro[produtoId].totalCustoValor += custoProdutoVenda;
            produtosLucro[produtoId].totalLucroValor += (valorVendaProduto - custoProdutoVenda);
        });

        const sortedProdutos = Object.values(produtosLucro).sort((a, b) => b.totalLucroValor - a.totalLucroValor);

        if (sortedProdutos.length === 0) {
             resultadoConteudoEl.innerHTML = '<p class="p-m text-center empty-message">Não foi possível calcular a lucratividade dos produtos vendidos (verifique os custos).</p>';
            return;
        }
        
        let html = '<ul class="simple-list">';
        let lucroTotalGeral = 0;
        sortedProdutos.forEach(p => {
            lucroTotalGeral += p.totalLucroValor;
            html += `
                <li class="card-list-item" style="flex-wrap: wrap;">
                    <div style="flex-basis: 100%; margin-bottom: var(--espaco-xs);"><strong>${p.nome}</strong> (Qtd: ${p.qtdVendida})</div>
                    <small style="flex-basis: 50%; color: var(--cinza-texto-secundario);">Total Vendido: ${formatarMoeda(p.totalVendidoValor)}</small>
                    <small style="flex-basis: 50%; color: var(--cinza-texto-secundario); text-align: right;">Total Custo: ${formatarMoeda(p.totalCustoValor)}</small>
                    <strong style="flex-basis: 100%; text-align: right; color: ${p.totalLucroValor >=0 ? 'var(--verde-sucesso)' : 'var(--vermelho-erro)'}; font-size: 1.1rem; margin-top: var(--espaco-xs);">Lucro do Produto: ${formatarMoeda(p.totalLucroValor)}</strong>
                </li>
            `;
        });
        html += '</ul>';
        html += `<p class="text-right mt-m" style="font-size: 1.2rem; font-weight: bold;"><strong>Lucro Total (Produtos Listados): ${formatarMoeda(lucroTotalGeral)}</strong></p>`;
        resultadoConteudoEl.innerHTML = html;

    }

    function renderResumoGeral(vendasData, despesasData) {
        const totalVendas = vendasData.reduce((sum, v) => sum + v.valor_total, 0);
        const totalDespesas = despesasData.reduce((sum, d) => sum + d.valor, 0);
        const lucroPrejuizo = totalVendas - totalDespesas;

        let html = `
            <div class="resumo-geral-item" style="padding-bottom: var(--espaco-m); margin-bottom:var(--espaco-m); border-bottom: 1px dashed var(--rosa-clarinho);">
                <h4 style="font-size: 1.3rem; color: var(--verde-sucesso); font-weight:700;">Total de Vendas: ${formatarMoeda(totalVendas)}</h4>
                <small>${vendasData.length} transações</small>
            </div>
            <div class="resumo-geral-item" style="padding-bottom: var(--espaco-m); margin-bottom:var(--espaco-m); border-bottom: 1px dashed var(--rosa-clarinho);">
                <h4 style="font-size: 1.3rem; color: var(--vermelho-erro); font-weight:700;">Total de Despesas: ${formatarMoeda(totalDespesas)}</h4>
                 <small>${despesasData.length} registros</small>
            </div>
             <div class="resumo-geral-item" style="margin-top: var(--espaco-l);">
                <h4 style="font-size: 1.5rem; color: ${lucroPrejuizo >= 0 ? 'var(--verde-sucesso)' : 'var(--vermelho-erro)'}; font-weight: bold; text-align: center;">
                    ${lucroPrejuizo >= 0 ? '🎉 Lucro do Período 🎉' : '⚠️ Prejuízo do Período ⚠️'}<br>${formatarMoeda(lucroPrejuizo)}
                </h4>
            </div>
        `;
        resultadoConteudoEl.innerHTML = html;
    }

    // Disparar um load inicial para "Este Mês" e "Resumo Geral"
    setDefaultDates();
    if(formFiltros) formFiltros.dispatchEvent(new Event('submit', { bubbles: true }));
}
// console.log('relatorios.js carregado e revisado.');
