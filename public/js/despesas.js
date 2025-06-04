// 📁 js/despesas.js
function initDespesas() {
    // console.log('Inicializando Despesas...');

    const formContainer = document.getElementById('form-despesa-container');
    const formDespesa = document.getElementById('form-despesa');
    const formDespesaTitle = document.getElementById('form-despesa-title');
    const despesaIdInput = document.getElementById('despesa-id');
    const despesaTipoInput = document.getElementById('despesa-tipo');
    const despesaVencimentoGroup = document.getElementById('despesa-vencimento-group');
    const despesaDescricaoInput = document.getElementById('despesa-descricao');
    const despesaValorInput = document.getElementById('despesa-valor');
    const despesaDataVencimentoInput = document.getElementById('despesa-data-vencimento');


    const btnAddFixa = document.getElementById('btn-add-despesa-fixa');
    const btnAddVariavel = document.getElementById('btn-add-despesa-variavel');
    const btnCancelarForm = document.getElementById('btn-cancelar-form-despesa');

    const listaFixasEl = document.getElementById('lista-despesas-fixas');
    const listaVariaveisEl = document.getElementById('lista-despesas-variaveis');

    function toggleForm(show, tipo = null, despesaParaEditar = null) {
        formContainer.classList.toggle('hidden', !show);
        limparErrosFormulario(formDespesa);
        formDespesa.reset();
        despesaIdInput.value = '';

        if (show && tipo) {
            despesaTipoInput.value = tipo;
            formDespesaTitle.textContent = `Adicionar Custo ${tipo === 'fixa' ? 'Fixo' : 'Variável'}`;
            despesaVencimentoGroup.classList.toggle('hidden', tipo !== 'fixa');
            
            if (despesaParaEditar) {
                formDespesaTitle.textContent = `Editar Custo ${tipo === 'fixa' ? 'Fixo' : 'Variável'}`;
                despesaIdInput.value = despesaParaEditar.id;
                despesaDescricaoInput.value = despesaParaEditar.descricao;
                despesaValorInput.value = despesaParaEditar.valor; // Sem formatar para moeda no input number
                if (tipo === 'fixa' && despesaParaEditar.data_vencimento) {
                    despesaDataVencimentoInput.value = despesaParaEditar.data_vencimento.split('T')[0];
                }
            }
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    if(btnAddFixa) btnAddFixa.addEventListener('click', () => toggleForm(true, 'fixa'));
    if(btnAddVariavel) btnAddVariavel.addEventListener('click', () => toggleForm(true, 'variavel'));
    if(btnCancelarForm) btnCancelarForm.addEventListener('click', () => toggleForm(false));

    formDespesa.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!getCurrentUser()) {
            showToast('Você precisa estar logada para gerenciar despesas.', 'error');
            return;
        }
        limparErrosFormulario(formDespesa);

        let isValid = true;
        isValid &= validarCampoTextoObrigatorio(despesaDescricaoInput, 'Descrição');
        isValid &= validarCampoNumero(despesaValorInput, 'Valor', { permiteZero: false, obrigatorio: true });
        
        const tipo = despesaTipoInput.value;
        if (tipo === 'fixa') {
            // Data de vencimento é opcional, mas se preenchida, deve ser válida
            if (despesaDataVencimentoInput.value) { // Só valida se tiver algo
                isValid &= validarCampoData(despesaDataVencimentoInput, 'Data de vencimento', false);
            }
        }

        if (!isValid) {
            showToast('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        const despesaData = {
            descricao: despesaDescricaoInput.value.trim(),
            valor: moedaParaNumero(despesaValorInput.value), // Garante que é número
            tipo_despesa: tipo,
            user_id: getCurrentUser().id,
            data_criacao: new Date().toISOString() // Adicionado para ordenação
        };
        if (tipo === 'fixa') {
            despesaData.data_vencimento = despesaDataVencimentoInput.value || null;
        }

        const id = despesaIdInput.value;
        let endpoint = `${C4APP_CONFIG.DB_ENDPOINT}/despesas`;
        let method = 'POST';
        const headers = { 'Prefer': 'return=representation' };

        if (id) { // Edição
            endpoint += `?id=eq.${id}`;
            method = 'PATCH';
            delete despesaData.data_criacao; // Não atualiza data de criação na edição
        }

        try {
            await supabaseFetch(endpoint, method, despesaData, headers);
            showToast(`Despesa ${id ? 'atualizada' : 'salva'} com sucesso!`, 'success');
            toggleForm(false);
            carregarDespesas();
        } catch (error) {
            console.error('Erro ao salvar despesa:', error);
            showToast(`Erro ao salvar despesa: ${error.message}`, 'error');
        }
    });

    async function carregarDespesas() {
        if (!listaFixasEl || !listaVariaveisEl) return;

        listaFixasEl.innerHTML = '<div class="loading-message"><div class="spinner"></div></div>';
        listaVariaveisEl.innerHTML = '<div class="loading-message"><div class="spinner"></div></div>';

        if (!getCurrentUser()) {
            listaFixasEl.innerHTML = '<p class="empty-message p-m">Faça login para ver suas despesas.</p>';
            listaVariaveisEl.innerHTML = '<p class="empty-message p-m">Faça login para ver suas despesas.</p>';
            return;
        }

        try {
            const despesas = await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/despesas?select=*&user_id=eq.${getCurrentUser().id}&order=data_criacao.desc`);
            const fixas = despesas.filter(d => d.tipo_despesa === 'fixa');
            const variaveis = despesas.filter(d => d.tipo_despesa === 'variavel');

            renderListaDespesas(listaFixasEl, fixas, 'fixa');
            renderListaDespesas(listaVariaveisEl, variaveis, 'variavel');

        } catch (error) {
            console.error('Erro ao carregar despesas:', error);
            listaFixasEl.innerHTML = `<p class="error-message p-m">Falha ao carregar custos fixos: ${error.message}</p>`;
            listaVariaveisEl.innerHTML = `<p class="error-message p-m">Falha ao carregar custos variáveis: ${error.message}</p>`;
        }
    }

    function renderListaDespesas(element, items, tipo) {
        if (!items || items.length === 0) {
            element.innerHTML = `<p class="text-center empty-message p-m">Nenhum custo ${tipo === 'fixa' ? 'fixo' : 'variável'} cadastrado.</p>`;
            return;
        }
        element.innerHTML = ''; 
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card-list-item';
            let vencimentoHtml = '';
            if (item.tipo_despesa === 'fixa' && item.data_vencimento) {
                const dataVenc = new Date(item.data_vencimento + 'T00:00:00');
                vencimentoHtml = `<small class="item-date" style="display: block; color: var(--cinza-texto-secundario);">Venc: ${dataVenc.toLocaleDateString('pt-BR')}</small>`;
            }
            div.innerHTML = `
                <div style="flex-grow: 1; margin-right: var(--espaco-s);">
                    <span class="item-name">${item.descricao}</span>
                    ${vencimentoHtml}
                </div>
                <div style="text-align: right; min-width: 100px;">
                    <span class="item-value" style="color: var(--vermelho-erro); font-weight: 500;">${formatarMoeda(item.valor)}</span>
                    <div class="item-actions mt-xs">
                        <button class="btn btn-outline-primary btn-sm btn-edit-despesa" data-id="${item.id}" aria-label="Editar despesa ${item.descricao}"><span class="icon" aria-hidden="true">✏️</span></button>
                        <button class="btn btn-danger btn-sm btn-delete-despesa" data-id="${item.id}" aria-label="Excluir despesa ${item.descricao}" style="background-color: transparent; color: var(--vermelho-erro); border-color: var(--vermelho-erro);"><span class="icon" aria-hidden="true">🗑️</span></button>
                    </div>
                </div>
            `;
            div.querySelector('.btn-edit-despesa').addEventListener('click', () => {
                const despesaOriginal = items.find(d => d.id === item.id);
                toggleForm(true, item.tipo_despesa, despesaOriginal);
            });
            div.querySelector('.btn-delete-despesa').addEventListener('click', () => confirmarExclusaoDespesa(item.id, item.descricao));
            element.appendChild(div);
        });
    }

    async function confirmarExclusaoDespesa(id, descricao) {
        window.showAppModal(
            'Confirmar Exclusão',
            `<p>Tem certeza que deseja excluir a despesa "<strong>${descricao}</strong>"?</p>`,
            `<button class="btn btn-outline-primary" data-dismiss-modal="confirmDeleteDespesaModal">Cancelar</button>
             <button class="btn btn-danger" id="btnConfirmDeleteDespesa">Excluir</button>`,
            'confirmDeleteDespesaModal'
        );
        document.getElementById('btnConfirmDeleteDespesa').addEventListener('click', async () => {
            try {
                await supabaseFetch(`${C4APP_CONFIG.DB_ENDPOINT}/despesas?id=eq.${id}`, 'DELETE');
                showToast('Despesa excluída com sucesso.', 'success');
                carregarDespesas();
            } catch (error) {
                console.error('Erro ao excluir despesa:', error);
                showToast(`Erro ao excluir despesa: ${error.message}`, 'error');
            } finally {
                window.closeAppModal('confirmDeleteDespesaModal');
            }
        }, { once: true });
    }
    carregarDespesas();
}
// console.log('despesas.js carregado e revisado.');
