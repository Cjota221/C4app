// 📁 js/c4-ai.js
function initC4Ai() {
    // console.log('Inicializando C4 IA...');

    const nichoInput = document.getElementById('c4-ai-nicho');
    const perguntaInput = document.getElementById('c4-ai-pergunta');
    const btnPedirSugestao = document.getElementById('btn-c4-ai-pedir-sugestao');
    const respostaContainer = document.getElementById('c4-ai-resposta-container');
    const respostaTextoEl = document.getElementById('c4-ai-resposta-texto');
    const quickActionButtons = document.querySelectorAll('.c4-ai-page .quick-actions .btn'); // Mais específico


    const DICAS_CONTEUDO = [
        "Que tal um post 'Antes e Depois' mostrando o impacto real do seu produto/serviço estrela?",
        "Crie um Reels ou TikTok divertido mostrando os bastidores da sua produção ou um dia típico de trabalho. Humaniza a marca!",
        "Publique um Carrossel no Instagram com 3 dicas rápidas e valiosas relacionadas ao seu nicho.",
        "Faça uma Enquete nos Stories para engajar e conhecer melhor as dores e desejos das suas clientes.",
        "Compartilhe um depoimento autêntico de uma cliente satisfeita (lembre-se de pedir permissão!). Prova social é ouro!",
        "Grave um vídeo curto e direto explicando um benefício chave do seu produto mais vendido. Foque na transformação!",
        "Mostre como seu produto/serviço resolve um problema comum ou facilita a vida do seu público-alvo.",
        "Crie um post 'Mitos e Verdades' sobre seu nicho para educar sua audiência e se posicionar como autoridade.",
        "Faça uma live colaborativa com outra empreendedora de nicho complementar para alcançar novos públicos."
    ];
    const DICAS_VENDER_MAIS = [
        "Crie uma oferta especial e irresistível por tempo limitado (ex: 'Só nas próximas 48 horas!'). Escassez vende!",
        "Ofereça um combo de produtos sinérgicos com um pequeno desconto. Aumenta o ticket médio!",
        "Desenvolva um programa de fidelidade simples: a cada X compras, um brinde ou desconto especial.",
        "Peça indicações para suas clientes mais fiéis e ofereça um mimo ou comissão por cada nova cliente trazida.",
        "Invista em fotos de alta qualidade e descrições detalhadas e persuasivas para seus produtos. Valorize sua vitrine online!",
        "Mantenha contato próximo com clientes antigas, informando sobre novidades e ofertas exclusivas para elas.",
        "Use os Stories do Instagram para mostrar os produtos em uso, criar desejo e fazer chamadas para ação diretas (Ex: 'Arraste para cima!').",
        "Ofereça frete grátis acima de um certo valor para incentivar um carrinho maior.",
        "Realize um sorteio ou concurso cultural para aumentar o engajamento e atrair novas seguidoras/clientes."
    ];

    function getSugestaoAleatoria(tipo, nicho = "") {
        let sugestoes = [];
        let prefixo = nicho ? `Para seu nicho de **${nicho}**, que tal... ` : "Que tal... ";
        let sufixoComum = "\n\nLembre-se de adaptar a linguagem para sua persona e caprichar na imagem/vídeo! 😉";

        switch (tipo) {
            case 'ideia-conteudo':
                sugestoes = DICAS_CONTEUDO;
                break;
            case 'vender-mais':
                sugestoes = DICAS_VENDER_MAIS;
                break;
            case 'post-produto':
                const produtoNomePlaceholder = nicho || "[Nome do Seu Produto Incrível]";
                const nichoHashtag = nicho ? nicho.replace(/\s+/g, '').toLowerCase() : "seuproduto";
                const marcaHashtag = "suamarca"; // Idealmente viria do perfil da usuária

                return `✨ Lançamento Especial para você que ama **${produtoNomePlaceholder}**! ✨\n\nMeninas, preparem o coração (e o carrinho 🛒) porque o nosso queridinho [Nome do Produto Específico ou Característica] chegou para arrasar! 😍\n\nEle é simplesmente perfeito para [Principal Benefício ou Solução que ele oferece], feito com [Detalhe Especial ou Material de Qualidade] e vai transformar o seu [Momento, Ocasião ou Problema que ele resolve].\n\n💖 Por que você vai amar?\n* [Vantagem 1]\n* [Vantagem 2]\n* [Vantagem 3]\n\n🛍️ Garanta já o seu por apenas ${formatarMoeda(Math.random() * 80 + 20)}! Edição limitada!\nClique no link da bio ou me chame no direct para mais informações! 😉\n\n#${nichoHashtag} #NovidadeNaLoja #${marcaHashtag} #EmpoderamentoFeminino #CompreDeQuemFaz`;
            default:
                return "Desculpe, não entendi o que você gostaria. Tente uma das opções rápidas ou seja mais específica.";
        }
        const randomIndex = Math.floor(Math.random() * sugestoes.length);
        return prefixo + sugestoes[randomIndex] + sufixoComum;
    }

    function exibirResposta(texto) {
        respostaTextoEl.innerHTML = '<div class="spinner" style="margin: var(--espaco-m) auto;"></div><p class="text-center">Gerando sugestão...</p>';
        respostaContainer.classList.remove('hidden');
        respostaContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            // Simples Markdown para negrito (**texto**) e quebra de linha (\n)
            const textoFormatado = texto
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrito
                .replace(/\n/g, '<br>'); // Quebra de linha
            respostaTextoEl.innerHTML = textoFormatado;
        }, 800 + Math.random() * 500); // Simula um pequeno delay da "IA"
    }

    if (btnPedirSugestao) {
        btnPedirSugestao.addEventListener('click', () => {
            const nicho = nichoInput.value.trim();
            const pergunta = perguntaInput.value.trim();
            let sugestao;

            if (pergunta) {
                if (pergunta.toLowerCase().includes("cor de batom") || pergunta.toLowerCase().includes("maquiagem")) {
                    sugestao = `Para a pergunta sobre **"${pergunta}"**, aqui vai uma dica de expert: sempre recomende pesquisar tons que complementem o subtom de pele da cliente! 💄\nPara morenas, tons terrosos, vinhos e vermelhos fechados costumam ficar um arraso! Para peles claras, nudes rosados, pêssegos e vermelhos abertos são ótimas pedidas. Mas o mais importante é a cliente se sentir poderosa e confiante! 😉`;
                } else if (pergunta.toLowerCase().includes("divulgar") || pergunta.toLowerCase().includes("promover")) {
                    sugestao = `Sobre como divulgar "${nicho || 'seus produtos'}", uma ótima estratégia é: ${getSugestaoAleatoria('vender-mais', nicho)}`;
                } else {
                    sugestao = `Para sua pergunta sobre **"${pergunta.substring(0,40)}..."**, uma boa ideia seria: ${getSugestaoAleatoria('ideia-conteudo', nicho)}. Lembre-se de adaptar para sua audiência e nicho específico!`;
                }
            } else if (nicho) {
                sugestao = getSugestaoAleatoria('ideia-conteudo', nicho);
            } else {
                sugestao = "Por favor, me diga seu nicho ou faça uma pergunta para eu poder te ajudar melhor! 😊 Se precisar de inspiração, clique nos botões de sugestão rápida!";
            }
            exibirResposta(sugestao);
        });
    }
    
    quickActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tipoSugestao = button.dataset.sugestao;
            const nicho = nichoInput.value.trim();
            const sugestao = getSugestaoAleatoria(tipoSugestao, nicho);
            exibirResposta(sugestao);
            perguntaInput.value = ''; // Limpa pergunta específica se usou botão rápido
            if (tipoSugestao === 'post-produto' && !nicho) {
                nichoInput.focus(); // Pede para preencher o nicho
            }
        });
    });
}
// console.log('c4-ai.js carregado e revisado.');
