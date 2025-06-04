// 📁 js/utils/calcularLucro.js

/**
 * Calcula o preço de venda ideal com base nos custos e margem de lucro sobre o PREÇO DE VENDA.
 * PV = CustoTotalUnitario / (1 - (MargemLucroPercentual / 100))
 * @param {number|string} custoTotalUnitario - Custo total do produto por unidade.
 * @param {number|string} margemLucroPercentual - Margem de lucro desejada sobre o preço de venda (ex: 50 para 50%).
 * @returns {object} Contendo precoVendaIdeal e lucroBrutoUnitario.
 */
function calcularPrecoVenda(custoTotalUnitario, margemLucroPercentual) {
    const custoNum = parseFloat(String(custoTotalUnitario).replace(",", ".")) || 0;
    const margemNum = parseFloat(String(margemLucroPercentual).replace(",", ".")) || 0;

    // Limita a margem para o cálculo a um valor ligeiramente menor que 100%
    // para evitar divisão por zero ou resultados irreais se a margem for >= 100%.
    const margemCalculo = Math.min(margemNum, 99.999);

    let precoVendaIdeal = 0;
    const divisor = 1 - (margemCalculo / 100);

    if (custoNum === 0 && margemCalculo >= 0) { // Se o custo é zero, o preço de venda é zero (sem markup)
        precoVendaIdeal = 0;
    } else if (divisor > 0) {
         precoVendaIdeal = custoNum / divisor;
    } else {
        // Se o divisor é zero ou negativo (margem >= 100%) e custo > 0,
        // o preço ideal tenderia ao infinito ou seria negativo, o que não é prático.
        // Retornar um valor muito alto ou o próprio custo pode ser um indicador.
        // Para este app, vamos considerar que margens >= 100% são impraticáveis na fórmula.
        // A UI deve limitar a entrada da margem (ex: max="99").
        // Se chegar aqui, pode ser um erro de input não validado.
        // Vamos retornar o próprio custo + uma margem de erro simbólica se a margem for muito alta.
        precoVendaIdeal = custoNum * 100; // Exemplo: Sinaliza um preço muito alto / erro
    }

    const lucroBrutoUnitario = precoVendaIdeal - custoNum;

    return {
        precoVendaIdeal: parseFloat(precoVendaIdeal.toFixed(2)),
        lucroBrutoUnitario: parseFloat(lucroBrutoUnitario.toFixed(2))
    };
}

/**
 * Calcula o custo total unitário de um produto.
 * @param {number|string} valorCompra - Valor de compra do produto.
 * @param {number|string} custoFixoUnitario - Custo fixo rateado por unidade.
 * @param {number|string} custoVariavelUnitario - Custo variável por unidade.
 * @param {number|string} custoFreteUnitario - Custo de frete por unidade para receber o produto.
 * @returns {number} Custo total unitário.
 */
function calcularCustoTotalUnitario(valorCompra, custoFixoUnitario, custoVariavelUnitario, custoFreteUnitario) {
    const total = (parseFloat(String(valorCompra).replace(",", ".")) || 0) +
                  (parseFloat(String(custoFixoUnitario).replace(",", ".")) || 0) +
                  (parseFloat(String(custoVariavelUnitario).replace(",", ".")) || 0) +
                  (parseFloat(String(custoFreteUnitario).replace(",", ".")) || 0);
    return parseFloat(total.toFixed(2));
}

// console.log('calcularLucro.js carregado e revisado.');
