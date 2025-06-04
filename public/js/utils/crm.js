// 📁 js/utils/crm.js

/**
 * Verifica clientes que compraram há mais de X dias.
 * @param {Array<Object>} vendas - Array de objetos de venda. Cada venda deve ter `cliente_nome` e `data_venda` (Date object ou ISO string).
 * @param {number} [diasLimite=30] - Número de dias para considerar um cliente "inativo".
 * @returns {Array<Object>} Lista de clientes para contato com `nome`, `diasDesdeUltimaCompra` e `ultimaCompraDataFormatada`.
 */
function verificarClientesParaContato(vendas, diasLimite = 30) {
    if (!Array.isArray(vendas)) return [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normaliza para o início do dia para comparações consistentes

    const clientesParaContato = [];
    // Agrupa as vendas por cliente e pega a data da última compra de cada um
    const clientesUltimaCompra = vendas.reduce((acc, venda) => {
        const nomeCliente = String(venda.cliente_nome || 'Cliente Desconhecido').trim();
        if (!nomeCliente || nomeCliente === 'Cliente Desconhecido') return acc; // Pula vendas sem nome de cliente válido

        try {
            const dataVenda = new Date(venda.data_venda);
            dataVenda.setHours(0,0,0,0); // Normaliza data da venda

            if (isNaN(dataVenda.getTime())) return acc; // Pula datas inválidas

            if (!acc[nomeCliente] || dataVenda > acc[nomeCliente].data) {
                acc[nomeCliente] = { data: dataVenda, idVenda: venda.id };
            }
        } catch (e) { /* Ignora datas inválidas */ }
        return acc;
    }, {});


    for (const nomeCliente in clientesUltimaCompra) {
        const ultimaCompraData = clientesUltimaCompra[nomeCliente].data;
        const diffTempo = hoje.getTime() - ultimaCompraData.getTime();
        const diffDias = Math.floor(diffTempo / (1000 * 3600 * 24));

        if (diffDias >= diasLimite) {
            clientesParaContato.push({
                nome: nomeCliente,
                diasDesdeUltimaCompra: diffDias,
                ultimaCompraDataFormatada: ultimaCompraData.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})
            });
        }
    }

    // Ordena por dias desde a última compra, do maior para o menor (mais "antigos" primeiro)
    clientesParaContato.sort((a, b) => b.diasDesdeUltimaCompra - a.diasDesdeUltimaCompra);

    return clientesParaContato;
}

// console.log('crm.js carregado.');
