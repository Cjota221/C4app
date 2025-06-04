// 📁 js/utils/calcularFrete.js

/**
 * Calcula o custo de frete unitário.
 * @param {number|string} custoTotalFrete - O valor total pago no frete.
 * @param {number|string} quantidadeItensFrete - A quantidade de itens que vieram nesse frete.
 * @returns {number} O custo de frete por unidade. Retorna 0 para entradas inválidas.
 */
function calcularFreteUnitario(custoTotalFrete, quantidadeItensFrete) {
    const custoTotalNum = parseFloat(String(custoTotalFrete).replace(",", ".")) || 0;
    const quantidadeNum = parseInt(String(quantidadeItensFrete)) || 0;

    if (custoTotalNum < 0 || quantidadeNum <= 0) {
        // console.warn("Valores inválidos para cálculo de frete unitário.");
        return 0;
    }
    return parseFloat((custoTotalNum / quantidadeNum).toFixed(2));
}

// console.log('calcularFrete.js carregado.');
