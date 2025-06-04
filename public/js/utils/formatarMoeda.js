// 📁 js/utils/formatarMoeda.js

/**
 * Formata um número para o padrão monetário brasileiro (R$).
 * @param {number|string} valor - O valor numérico ou string numérica a ser formatado.
 * @returns {string} O valor formatado como string (ex: "R$ 1.234,56"). Retorna "R$ 0,00" para entradas inválidas.
 */
function formatarMoeda(valor) {
    const numero = parseFloat(String(valor).replace(",", ".")); // Tenta converter vírgula para ponto se for string
    if (isNaN(numero)) {
        return "R$ 0,00";
    }
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Converte uma string de moeda formatada (R$ 1.234,56 ou 1.234,56 ou 1234.56) para um número.
 * @param {string} stringMoeda - A string formatada.
 * @returns {number} O valor numérico. Retorna 0 para entradas inválidas.
 */
function moedaParaNumero(stringMoeda) {
    if (typeof stringMoeda !== 'string' || stringMoeda.trim() === "") return 0;

    // Remove "R$", espaços em branco no início/fim
    let valorLimpo = stringMoeda.replace("R$", "").trim();

    // Verifica se o último caractere antes de números é vírgula (padrão BR) ou ponto (padrão US)
    // E se há pontos para milhares.
    const temPontoMilhar = valorLimpo.includes('.');
    const temVirgulaDecimal = valorLimpo.includes(',');

    if (temPontoMilhar && temVirgulaDecimal) { // Ex: 1.234,56
        valorLimpo = valorLimpo.replace(/\./g, ""); // Remove pontos de milhar
        valorLimpo = valorLimpo.replace(",", ".");  // Substitui vírgula decimal por ponto
    } else if (temVirgulaDecimal && !temPontoMilhar) { // Ex: 1234,56
         valorLimpo = valorLimpo.replace(",", ".");
    } else if (temPontoMilhar && !temVirgulaDecimal) { // Ex: 1234.56 (pode ser padrão US ou milhar sem decimal)
        // Se houver mais de um ponto, o último é provavelmente decimal.
        // Esta heurística pode falhar. Para maior robustez, uma lib de parsing seria ideal.
        // Mas, para este caso, vamos assumir que se só há pontos, é formato US ou inteiro com pontos de milhar.
        // Se a intenção é só permitir entrada com vírgula decimal, esta parte pode ser mais restritiva.
        // Por ora, mantendo a conversão simples:
        // A linha abaixo já remove pontos, então "1.234.56" se tornaria "123456"
        // valorLimpo = valorLimpo.replace(/\./g, ""); // Isso está errado se o ponto for decimal
        // Corrigindo: Apenas remove pontos se houver vírgula depois, ou se for só ponto para milhar
        // A lógica anterior era mais simples e pode ser suficiente se a entrada for controlada
        // Vou manter a lógica anterior que é mais simples:
        // valorLimpo = valorLimpo.replace(/\./g, "").replace(",", ".");
        // Reconsiderando: a original `replace(/\./g, "").replace(",", ".")` é boa para "1.234,56" -> "1234.56"
        // Mas falha para "1234.56" (queremos 1234.56) pois o ponto é removido.
        // E para "1,234.56" (padrão americano com vírgula de milhar).

        // Melhor abordagem:
        // 1. Remove tudo que não é dígito, vírgula ou ponto
        valorLimpo = valorLimpo.replace(/[^\d,.-]/g, "");
        // 2. Se tem vírgula E ponto, remove pontos e troca vírgula por ponto
        if (valorLimpo.includes(',') && valorLimpo.includes('.')) {
            if (valorLimpo.lastIndexOf(',') > valorLimpo.lastIndexOf('.')) { // Formato BR: 1.234,56
                valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
            } else { // Formato US: 1,234.56
                valorLimpo = valorLimpo.replace(/,/g, '').replace('.', '.'); // O último replace é redundante mas ok
            }
        } else if (valorLimpo.includes(',')) { // Só vírgula: 1234,56
            valorLimpo = valorLimpo.replace(',', '.');
        }
        // Se só tem ponto, já está no formato "1234.56" ou "1234" (inteiro)
        // Se não tem nem vírgula nem ponto, é um número inteiro ou decimal sem separador (ex: "123456")
    }


    const valorNumerico = parseFloat(valorLimpo);
    return isNaN(valorNumerico) ? 0 : valorNumerico;
}

// console.log('formatarMoeda.js carregado.');
