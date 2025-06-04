// 📁 js/perfil.js
function initPerfil() {
    // console.log('Inicializando Perfil...');

    const displayNomeEl = document.getElementById('perfil-display-nome');
    const displayEmailEl = document.getElementById('perfil-display-email');
    const displayTelefoneEl = document.getElementById('perfil-display-telefone');
    const displayPlanoEl = document.getElementById('perfil-display-plano');

    const btnAbrirEdicao = document.getElementById('btn-abrir-edicao-perfil');
    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao-perfil');
    const btnLogout = document.getElementById('btn-logout');

    const formEdicaoContainer = document.getElementById('form-perfil-edicao-container');
    const formEdicao = document.getElementById('form-perfil-edicao');
    const infoDisplayContainer = document.getElementById('perfil-info-display');

    const editNomeInput = document.getElementById('perfil-edit-nome');
    const editTelefoneInput = document.getElementById('perfil-edit-telefone');
    const editSenhaAtualInput = document.getElementById('perfil-edit-senha-atual');
    const editNovaSenhaInput = document.getElementById('perfil-edit-nova-senha');
    const editConfirmaNovaSenhaInput = document.getElementById('perfil-edit-confirma-nova-senha');

    let usuarioLogado = null; // Para armazenar o objeto do usuário

    function preencherDadosDisplay(usuario) {
        if (!usuario) {
            displayNomeEl.textContent = 'Não conectado';
            displayEmailEl.textContent = '-';
            displayTelefoneEl.textContent = '-';
            displayPlanoEl.textContent = '-';
            if (btnLogout) btnLogout.innerHTML = '<span class="icon" aria-hidden="true">🔑</span> Fazer Login';
            if (btnAbrirEdicao) btnAbrirEdicao.classList.add('hidden');
            return;
        }
        displayNomeEl.textContent = (usuario.user_metadata && usuario.user_metadata.full_name) || 'Não informado';
        displayEmailEl.textContent = usuario.email;
        displayTelefoneEl.textContent = (usuario.user_metadata && usuario.user_metadata.phone) || 'Não informado';
        displayPlanoEl.textContent = (usuario.user_metadata && usuario.user_metadata.plan) || 'Básico'; // Exemplo
        
        if (btnLogout) btnLogout.innerHTML = '<span class="icon" aria-hidden="true">🚪</span> Encerrar Sessão';
        if (btnAbrirEdicao) btnAbrirEdicao.classList.remove('hidden');

        // Preencher formulário de edição com dados atuais (caso o usuário abra)
        editNomeInput.value = (usuario.user_metadata && usuario.user_metadata.full_name) || '';
        editTelefoneInput.value = (usuario.user_metadata && usuario.user_metadata.phone) || '';
    }

    function carregarDadosUsuario() {
        usuarioLogado = getCurrentUser(); // Função de useLocalStorage.js
        preencherDadosDisplay(usuarioLogado);

        if (!usuarioLogado && (new URLSearchParams(window.location.search).get('page')) === 'perfil') {
            // Se está na página de perfil e não logado, talvez mostrar um formulário de login simples.
            // Por agora, apenas a mensagem "Não conectado".
            // Em um app real, main.js poderia redirecionar para uma tela de login dedicada.
            // ou esta página poderia se transformar em uma tela de login/registro.
            // showLoginForm(); // Função hipotética
        }
    }

    function toggleEditMode(show) {
        infoDisplayContainer.classList.toggle('hidden', show);
        formEdicaoContainer.classList.toggle('hidden', !show);
        if (show) {
            limparErrosFormulario(formEdicao);
            // Repopular com os dados mais recentes caso o objeto usuarioLogado tenha sido atualizado
            if (usuarioLogado && usuarioLogado.user_metadata) {
                editNomeInput.value = usuarioLogado.user_metadata.full_name || '';
                editTelefoneInput.value = usuarioLogado.user_metadata.phone || '';
            }
            editSenhaAtualInput.value = '';
            editNovaSenhaInput.value = '';
            editConfirmaNovaSenhaInput.value = '';
            formEdicaoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    if (btnAbrirEdicao) btnAbrirEdicao.addEventListener('click', () => {
        if (!usuarioLogado) {
            showToast('Faça login para editar seu perfil.', 'info');
            return;
        }
        toggleEditMode(true);
    });
    if (btnCancelarEdicao) btnCancelarEdicao.addEventListener('click', () => toggleEditMode(false));

    if (formEdicao) {
        formEdicao.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!usuarioLogado) {
                showToast('Nenhum usuário logado para atualizar.', 'error');
                return;
            }
            limparErrosFormulario(formEdicao);

            let isValid = true;
            isValid &= validarCampoTextoObrigatorio(editNomeInput, 'Nome Completo');
            // Telefone é opcional, mas se preenchido, pode ter uma validação de formato (não implementada aqui)

            const nome = editNomeInput.value.trim();
            const telefone = editTelefoneInput.value.trim();
            const senhaAtual = editSenhaAtualInput.value; // Não é enviada para Supabase /user endpoint com JWT
            const novaSenha = editNovaSenhaInput.value;
            const confirmaNovaSenha = editConfirmaNovaSenhaInput.value;

            const dadosParaAtualizar = {
                data: { // user_metadata
                    full_name: nome,
                    phone: telefone
                }
            };

            if (novaSenha) {
                if (novaSenha.length < 6) {
                    isValid = false;
                    exibirErroCampo(editNovaSenhaInput, 'Nova senha deve ter no mínimo 6 caracteres.');
                }
                if (novaSenha !== confirmaNovaSenha) {
                    isValid = false;
                    exibirErroCampo(editConfirmaNovaSenhaInput, 'Confirmação de senha não confere com a nova senha.');
                }
                if(isValid) {
                    dadosParaAtualizar.password = novaSenha;
                    // Para a API REST do Supabase, a senha atual não é necessária no endpoint /user
                    // se o usuário já estiver autenticado (com um JWT válido).
                    // Se uma verificação de senha atual for desejada, seria um fluxo customizado.
                }
            }

            if (!isValid) {
                showToast('Por favor, corrija os erros no formulário.', 'error');
                return;
            }

            try {
                const updatedUserResponse = await supabaseFetch(
                    `${C4APP_CONFIG.AUTH_ENDPOINT}/user`,
                    'PUT',
                    dadosParaAtualizar
                );

                const session = getSession();
                if (session) {
                    session.user = updatedUserResponse; // API /user retorna o objeto user atualizado
                    saveSession(session);
                    usuarioLogado = updatedUserResponse; // Atualiza a variável local
                }

                showToast('Perfil atualizado com sucesso!', 'success');
                preencherDadosDisplay(usuarioLogado); // Recarrega display com novos dados
                toggleEditMode(false);

            } catch (error) {
                console.error('Erro ao atualizar perfil:', error);
                showToast(`Erro ao atualizar perfil: ${error.message}`, 'error');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if(!usuarioLogado) { // Botão age como "Fazer Login"
                // main.js deveria ter uma função para navegar, ex: window.navigateTo('loginPage')
                // Por enquanto, uma simples simulação ou alerta:
                showToast('Funcionalidade de login a ser implementada.', 'info');
                // Se a página de login fosse "perfil.html" com um form de login,
                // aqui poderíamos exibir esse form.
                // Por ora, apenas recarrega a página para que o main.js decida o que fazer
                // (que no momento não tem uma página de login)
                // loadPage('perfil'); // Se perfil tivesse um estado de login
                return;
            }

            try {
                const token = getAuthToken();
                if (token) { // Só tenta deslogar do Supabase se houver token
                    await supabaseFetch(`${C4APP_CONFIG.AUTH_ENDPOINT}/logout`, 'POST', null, {'Authorization': `Bearer ${token}`});
                }
            } catch (e) {
                // console.warn("Erro ao tentar deslogar do Supabase (pode ser token já expirado ou erro de rede):", e.message);
                // Continua com o logout local mesmo se a chamada ao Supabase falhar
            } finally {
                clearSession();
                usuarioLogado = null;
                showToast('Sessão encerrada. Até breve!', 'info');
                preencherDadosDisplay(null); // Atualiza a UI para estado deslogado
                // Idealmente, redirecionar para dashboard ou login.
                // main.js no carregamento inicial (após reload) irá para dashboard
                // e o dashboard ou outras páginas devem verificar se há usuário logado.
                // Forçar um recarregamento para que o main.js execute sua lógica inicial.
                setTimeout(() => {
                    // Navega para dashboard, que deve então verificar o estado de login
                    // e talvez redirecionar para uma página de login (se existir)
                    const dashboardButton = document.querySelector('.nav-item[data-page="dashboard"]');
                    if (dashboardButton) dashboardButton.click(); else window.location.reload();
                }, 1500);
            }
        });
    }
    carregarDadosUsuario();
}
// console.log('perfil.js carregado e revisado.');
