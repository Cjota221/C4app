// 📁 js/calculadoras.js
function initCalculadoras() {
    // console.log('Inicializando Calculadoras Auxiliares...');

    // Calculadora de Custo Fixo Unitário
    const formCustoFixo = document.getElementById('form-calc-custo-fixo');
    const cfuTotalFixoInput = document.getElementById('cfu-total-fixo');
    const cfuTotalUnidadesInput = document.getElementById('cfu-total-unidades');
    const cfuResultadoEl = document.getElementById('cfu-resultado');

    if (formCustoFixo) {
        formCustoFixo.addEventListener('submit', (e) => {
            e.preventDefault();
            limparErrosFormulario(formCustoFixo);
            let isValid = true;
            isValid &= validarCampoNumero(cfuTotalFixoInput, 'Total Custos Fixos', { obrigatorio: true, permiteZero: true });
            isValid &= validarCampoNumero(cfuTotalUnidadesInput, 'Total Unidades', { obrigatorio: true, permiteZero: false });

            if (isValid) {
                const totalFixo = moedaParaNumero(cfuTotalFixoInput.value);
                const totalUnidades = parseInt(cfuTotalUnidadesInput.value);
                const resultado = totalFixo / totalUnidades;
                cfuResultadoEl.textContent = formatarMoeda(resultado);
            } else {
                cfuResultadoEl.textContent = "R$ 0,00"; // Ou "Inválido"
            }
        });
    }

    // Calculadora de Custo Variável Unitário
    const formCustoVariavel = document.getElementById('form-calc-custo-variavel');
    const cvuMaterialInput = document.getElementById('cvu-custo-material');
    const cvuEmbalagemInput = document.getElementById('cvu-custo-embalagem');
    const cvuOutrosInput = document.getElementById('cvu-outros-variaveis');
    const cvuResultadoEl = document.getElementById('cvu-resultado');

    if (formCustoVariavel) {
        formCustoVariavel.addEventListener('submit', (e) => {
            e.preventDefault();
            // Esses campos são opcionais para o cálculo (podem ser zero), mas se preenchidos, devem ser números.
            const material = moedaParaNumero(cvuMaterialInput.value) || 0;
            const embalagem = moedaParaNumero(cvuEmbalagemInput.value) || 0;
            const outros = moedaParaNumero(cvuOutrosInput.value) || 0;
            const resultado = material + embalagem + outros;
            cvuResultadoEl.textContent = formatarMoeda(resultado);
        });
    }

    // Calculadora de Frete Unitário (Recebimento)
    const formFreteUnitario = document.getElementById('form-calc-frete-unitario');
    const fuTotalFreteInput = document.getElementById('fu-total-frete');
    const fuTotalItensInput = document.getElementById('fu-total-itens');
    const fuResultadoEl = document.getElementById('fu-resultado');

    if (formFreteUnitario) {
        formFreteUnitario.addEventListener('submit', (e) => {
            e.preventDefault();
            limparErrosFormulario(formFreteUnitario);
            let isValid = true;
            isValid &= validarCampoNumero(fuTotalFreteInput, 'Custo Total do Frete', { obrigatorio: true, permiteZero: true });
            isValid &= validarCampoNumero(fuTotalItensInput, 'Qtd. Itens', { obrigatorio: true, permiteZero: false });
            
            if (isValid) {
                const totalFrete = moedaParaNumero(fuTotalFreteInput.value);
                const totalItens = parseInt(fuTotalItensInput.value);
                const resultado = calcularFreteUnitario(totalFrete, totalItens); // Usando utilitário
                fuResultadoEl.textContent = formatarMoeda(resultado);
            } else {
                fuResultadoEl.textContent = "R$ 0,00"; // Ou "Inválido"
            }
        });
    }
}
// console.log('calculadoras.js carregado e revisado.');
