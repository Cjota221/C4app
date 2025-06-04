// 📁 js/utils/validarCampos.js

/**
 * Limpa todas as mensagens de erro e classes 'error' de um formulário ou container.
 * @param {HTMLElement} containerElement - O elemento do formulário ou container.
 */
function limparErrosFormulario(containerElement) {
    const camposComErro = containerElement.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error');
    camposComErro.forEach(campo => campo.classList.remove('error'));

    const mensagensErro = containerElement.querySelectorAll('.form-field-message.error');
    mensagensErro.forEach(msg => {
        msg.textContent = '';
        msg.style.display = 'none'; // Garante que está oculto
    });
}

/**
 * Exibe uma mensagem de erro para um campo específico.
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} campoElement - O elemento do campo.
 * @param {string} mensagem - A mensagem de erro a ser exibida.
 */
function exibirErroCampo(campoElement, mensagem) {
    campoElement.classList.add('error');
    let mensagemErroElement = campoElement.parentNode.querySelector('.form-field-message.error');
    if (!mensagemErroElement) { // Se não existir, cria
        mensagemErroElement = document.createElement('p');
        mensagemErroElement.className = 'form-field-message error';
        // Insere após o campo, ou após um elemento 'small' se existir
        const smallSibling = campoElement.nextElementSibling;
        if (smallSibling && smallSibling.tagName === 'SMALL') {
            smallSibling.insertAdjacentElement('afterend', mensagemErroElement);
        } else {
            campoElement.insertAdjacentElement('afterend', mensagemErroElement);
        }
    }
    mensagemErroElement.textContent = mensagem;
    mensagemErroElement.style.display = 'block';
}

/**
 * Valida se um campo de texto não está vazio.
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} campoElement - O elemento do campo.
 * @param {string} nomeCampo - Nome amigável do campo para mensagens de erro.
 * @returns {boolean} True se válido, false caso contrário.
 */
function validarCampoTextoObrigatorio(campoElement, nomeCampo) {
    const valor = campoElement.value.trim();
    if (valor === "") {
        exibirErroCampo(campoElement, `${nomeCampo} é obrigatório.`);
        return false;
    }
    return true;
}

/**
 * Valida se um campo numérico é um número válido e opcionalmente positivo/não-zero.
 * @param {HTMLInputElement} campoElement - O elemento do campo.
 * @param {string} nomeCampo - Nome amigável do campo.
 * @param {object} [options] - Opções de validação.
 * @param {boolean} [options.permiteZero=false] - Se true, zero é considerado válido.
 * @param {boolean} [options.permiteNegativo=false] - Se true, números negativos são válidos.
 * @param {boolean} [options.obrigatorio=true] - Se o campo é obrigatório.
 * @returns {boolean} True se válido, false caso contrário.
 */
function validarCampoNumero(campoElement, nomeCampo, options = {}) {
    const { permiteZero = false, permiteNegativo = false, obrigatorio = true } = options;
    const valorString = campoElement.value.trim();

    if (obrigatorio && valorString === "") {
        exibirErroCampo(campoElement, `${nomeCampo} é obrigatório.`);
        return false;
    }
    if (!obrigatorio && valorString === "") { // Se não é obrigatório e está vazio, é válido.
        return true;
    }

    const valor = moedaParaNumero(valorString); // Usa moedaParaNumero para flexibilidade na entrada

    if (isNaN(valor)) {
        exibirErroCampo(campoElement, `${nomeCampo} deve ser um número válido.`);
        return false;
    }
    if (!permiteNegativo && valor < 0) {
        exibirErroCampo(campoElement, `${nomeCampo} não pode ser negativo.`);
        return false;
    }
    if (!permiteZero && valor === 0 && obrigatorio) { // Se for obrigatório e zero não é permitido
        exibirErroCampo(campoElement, `${nomeCampo} deve ser diferente de zero.`);
        return false;
    }
    // Se permite negativo, mas não zero (ex: valor_objetivo > 0)
    if(permiteNegativo && !permiteZero && valor === 0 && obrigatorio) {
        exibirErroCampo(campoElement, `${nomeCampo} deve ser diferente de zero.`);
        return false;
    }


    return true;
}

/**
 * Valida um e-mail usando uma regex simples.
 * @param {HTMLInputElement} campoEmailElement - O elemento do campo de e-mail.
 * @param {boolean} [obrigatorio=true] - Se o campo é obrigatório.
 * @returns {boolean} True se o formato do e-mail for válido, false caso contrário.
 */
function validarEmail(campoEmailElement, obrigatorio = true) {
    const email = campoEmailElement.value.trim();
    if (obrigatorio && email === "") {
        exibirErroCampo(campoEmailElement, "E-mail é obrigatório.");
        return false;
    }
    if (!obrigatorio && email === "") {
        return true; // Válido se não obrigatório e vazio
    }

    // Regex simples para validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        exibirErroCampo(campoEmailElement, "Formato de e-mail inválido.");
        return false;
    }
    return true;
}

/**
 * Valida um campo de data.
 * @param {HTMLInputElement} campoDataElement - O elemento do campo de data.
 * @param {string} nomeCampo - Nome amigável do campo.
 * @param {boolean} [obrigatorio=true] - Se o campo é obrigatório.
 * @returns {boolean} True se válido, false caso contrário.
 */
function validarCampoData(campoDataElement, nomeCampo, obrigatorio = true) {
    const data = campoDataElement.value; // Formato YYYY-MM-DD
    if (obrigatorio && !data) {
        exibirErroCampo(campoDataElement, `${nomeCampo} é obrigatório.`);
        return false;
    }
    if (!obrigatorio && !data) {
        return true;
    }
    // Validação simples do formato (navegador já ajuda com type="date")
    // Pode adicionar validação de data válida (ex: não é 30/02) se necessário, mas Date.parse faria isso.
    if (data && isNaN(Date.parse(data + "T00:00:00"))) { // Adiciona T00:00:00 para evitar problemas de fuso no parse
        exibirErroCampo(campoDataElement, `${nomeCampo} contém uma data inválida.`);
        return false;
    }
    return true;
}

// console.log('validarCampos.js carregado.');
