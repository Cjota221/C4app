// 📁 js/lucro-certo.js
function initLucroCerto() {
    // console.log('Inicializando Lucro Certo...');

    const formLucroCerto = document.getElementById('form-lucro-certo');
    const produtoSelectEl = document.getElementById('lc-produto-select');
    const custoCompraDisplayEl = document.getElementById('lc-custo-compra-display');

    const custoFixoUnitarioInput = document.getElementById('lc-custo-fixo-unitario');
    const custoVariavelUnitarioInput = document.getElementById('lc-custo-variavel-unitario');
    const custoFreteUnitarioInput = document.getElementById('lc-custo-frete-unitario');
    const margemLucroInput = document.getElementById('lc-margem-lucro');

    const resultadoContainer = document.getElementById('resultado-lucro-certo-container');
    const resultadoCustoTotalEl = document.getElementById('lc-resultado-custo-total');
    const resultadoPrecoIdealEl = document.getElementById('lc-resultado-preco-ideal');
    const resultadoLucroBrutoEl = document.getElementById('lc-resultado-lucro-bruto');
    const simulacaoMargensListEl = document.querySelector('#lc-simulacao-margens .simple-list');
    const btnSalvarPrecoProduto = document.getElementById('btn-salvar-preco-produto');

    let produtosDisponiveis = [];
    let produtoSelecionadoAtual = null;

    async function carregarProdutosNoSelect() {
        if (!produtoSelectEl) return;
        produtoSelectEl.innerHTML = '<option value="">Carregando...</option>';
        
        if (!getCurrentUser()) {
            produtoSelectEl.innerHTML = '<option value="">Faça login para carregar produtos</option>';
            custoCompraDisplayEl.textContent = 'Faça login';
            return;
        }

        try {
            // Trazer também valor_venda para comparar ou exibir
            produtosDisponiveis = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/produtos?select=id,nome,valor_compra,valor_venda&user_id=eq.${getCurrentUser().id}&order=nome.asc`);
            if (produtosDisponiveis && produtosDisponiveis.length > 0) {
                produtoSelectEl.innerHTML = '<option value="">Selecione um produto</option>';
                produtosDisponiveis.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.nome;
                    // option.dataset.valorCompra = p.valor_compra; // Não precisa, pegaremos do array
                    produtoSelectEl.appendChild(option);
                });
            } else {
                produtoSelectEl.innerHTML = '<option value="">Nenhum produto cadastrado</option>';
                custoCompraDisplayEl.textContent = 'Nenhum produto';
            }
        } catch (error) {
            console.error('Erro ao carregar produtos para Lucro Certo:', error);
            produtoSelectEl.innerHTML = `<option value="">Erro: ${error.message}</option>`;
            custoCompraDisplayEl.textContent = 'Erro ao carregar';
        }
    }

    produtoSelectEl.addEventListener('change', () => {
        const selectedId = parseInt(produtoSelectEl.value);
        produtoSelecionadoAtual = produtosDisponiveis.find(p => p.id === selectedId);

        if (produtoSelecionadoAtual) {
            custoCompraDisplayEl.textContent = formatarMoeda(produtoSelecionadoAtual.valor_compra);
            // Limpar campos de custos adicionais para novo cálculo
            custoFixoUnitarioInput.value = '0';
            custoVariavelUnitarioInput.value = '0';
            custoFreteUnitarioInput.value = '0';
            // margemLucroInput.value = '50'; // Manter margem ou resetar? Preferência: manter.
            resultadoContainer.classList.add('hidden');
            btnSalvarPrecoProduto.classList.add('hidden');
        } else {
            custoCompraDisplayEl.textContent = 'Selecione um produto';
            resultadoContainer.classList.add('hidden');
            btnSalvarPrecoProduto.classList.add('hidden');
        }
    });

    formLucroCerto.addEventListener('submit', (event) => {
        event.preventDefault();
        limparErrosFormulario(formLucroCerto);

        if (!produtoSelecionadoAtual) {
            exibirErroCampo(produtoSelectEl, 'Por favor, selecione um produto.');
            showToast('Selecione um produto para calcular.', 'error');
            return;
        }

        let isValid = true;
        // Custo fixo, variável, frete podem ser zero, então 'permiteZero:true', 'obrigatorio:false' (se o valor for "0" no input) ou 'obrigatorio:true' se o campo deve ser preenchido, mesmo que com 0.
        // Para cálculo, 0 é um valor válido. A validação aqui é mais sobre o formato do número.
        isValid &= validarCampoNumero(custoFixoUnitarioInput, 'Custo Fixo', { permiteZero: true, obrigatorio: true });
        isValid &= validarCampoNumero(custoVariavelUnitarioInput, 'Custo Variável', { permiteZero: true, obrigatorio: true });
        isValid &= validarCampoNumero(custoFreteUnitarioInput, 'Custo Frete', { permiteZero: true, obrigatorio: true });
        isValid &= validarCampoNumero(margemLucroInput, 'Margem de Lucro', { permiteZero: true, obrigatorio: true, permiteNegativo: false }); // Margem não pode ser negativa

        if (parseFloat(margemLucroInput.value) >= 100) {
            exibirErroCampo(margemLucroInput, 'Margem deve ser menor que 100% para esta fórmula.');
            isValid = false;
        }


        if (!isValid) {
            showToast('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        const valorCompra = produtoSelecionadoAtual.valor_compra;
        const custoFixo = moedaParaNumero(custoFixoUnitarioInput.value);
        const custoVariavel = moedaParaNumero(custoVariavelUnitarioInput.value);
        const custoFrete = moedaParaNumero(custoFreteUnitarioInput.value);
        const margemDesejada = moedaParaNumero(margemLucroInput.value);

        const custoTotal = calcularCustoTotalUnitario(valorCompra, custoFixo, custoVariavel, custoFrete);
        const { precoVendaIdeal, lucroBrutoUnitario } = calcularPrecoVenda(custoTotal, margemDesejada);

        resultadoCustoTotalEl.textContent = formatarMoeda(custoTotal);
        resultadoPrecoIdealEl.textContent = formatarMoeda(precoVendaIdeal);
        resultadoLucroBrutoEl.textContent = formatarMoeda(lucroBrutoUnitario);

        simulacaoMargensListEl.innerHTML = '';
        const margensAdicionais = [10, 20]; // Percentuais a mais sobre a MARGEM DE LUCRO, não sobre o preço.
                                         // Ou poderiam ser margens absolutas: [margemDesejada + 10, margemDesejada + 20]
        margensAdicionais.forEach(adicional => {
            const margemSimulada = margemDesejada + adicional;
            if (margemSimulada < 100) { // Evitar problemas com margens > 100% na fórmula
                const { precoVendaIdeal: pvSimulado } = calcularPrecoVenda(custoTotal, margemSimulada);
                const li = document.createElement('li');
                li.innerHTML = `<span>Margem ${margemSimulada.toFixed(0)}% (+${adicional}%):</span> <span>${formatarMoeda(pvSimulado)}</span>`;
                simulacaoMargensListEl.appendChild(li);
            }
        });
        
        resultadoContainer.classList.remove('hidden');
        btnSalvarPrecoProduto.classList.remove('hidden');
        btnSalvarPrecoProduto.dataset.precoIdealParaSalvar = precoVendaIdeal;

        resultadoContainer.scrollIntoView({ behavior: 'smooth' });
    });

    btnSalvarPrecoProduto.addEventListener('click', async () => {
        if (!produtoSelecionadoAtual || !btnSalvarPrecoProduto.dataset.precoIdealParaSalvar) {
            showToast('Nenhum cálculo válido para salvar.', 'error');
            return;
        }
        if (!getCurrentUser()) {
            showToast('Você precisa estar logada para salvar o preço.', 'error');
            return;
        }

        const precoParaSalvar = parseFloat(btnSalvarPrecoProduto.dataset.precoIdealParaSalvar);

        try {
            await supabaseFetch(
                `${C4APP_CONFIG.DB_ENDPOINT}/produtos?id=eq.${produtoSelecionadoAtual.id}&user_id=eq.${getCurrentUser().id}`, // Garante que só o dono do produto pode alterar
                'PATCH',
                { valor_venda: precoParaSalvar },
                { 'Prefer': 'return=minimal' } // Não precisa do retorno aqui
            );
            showToast(`Preço de venda de "${produtoSelecionadoAtual.nome}" atualizado para ${formatarMoeda(precoParaSalvar)}!`, 'success');
            
            // Atualiza o valor no array local para consistência se o usuário recalcular
            const produtoNoArray = produtosDisponiveis.find(p => p.id === produtoSelecionadoAtual.id);
            if(produtoNoArray) produtoNoArray.valor_venda = precoParaSalvar;

            btnSalvarPrecoProduto.classList.add('hidden'); // Esconde o botão após salvar

        } catch (error) {
            console.error('Erro ao salvar preço no produto:', error);
            showToast(`Erro ao salvar preço: ${error.message}`, 'error');
        }
    });

    carregarProdutosNoSelect();
}
// console.log('lucro-certo.js carregado e revisado.');
