// 📁 js/supabase-config.js
// Corrigido: Sistema localStorage completo e função getCurrentUser global

// CONFIGURAÇÃO: Usando localStorage para desenvolvimento/teste
// Para produção, substitua pelas credenciais reais do Supabase
const SUPABASE_URL = 'LOCAL_STORAGE_MODE';
const SUPABASE_ANON_KEY = 'LOCAL_STORAGE_MODE';

window.C4APP_CONFIG = {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    AUTH_ENDPOINT: `${SUPABASE_URL}/auth/v1`,
    DB_ENDPOINT: `${SUPABASE_URL}/rest/v1`,
    STORAGE_ENDPOINT: `${SUPABASE_URL}/storage/v1`,
    USE_LOCAL_STORAGE: true, // Flag para usar localStorage
};

/**
 * Obtém o token de autenticação da sessão armazenada.
 * @returns {string|null} O token de acesso ou null.
 */
function getAuthToken() {
    if (typeof useLocalStorage === 'undefined' || !useLocalStorage?.getItem) {
        return null;
    }
    const session = useLocalStorage.getItem('c4app_session');
    return session ? session.access_token : null;
}

/**
 * Corrigido: Função getCurrentUser disponível globalmente
 * @returns {object|null} Usuário atual ou null
 */
function getCurrentUser() {
    if (C4APP_CONFIG.USE_LOCAL_STORAGE || C4APP_CONFIG.SUPABASE_URL === 'LOCAL_STORAGE_MODE') {
        // Retorna um usuário padrão para modo localStorage
        return {
            id: 'local_user_001',
            email: 'usuario@local.com',
            name: 'Usuário Local'
        };
    }
    
    // Modo Supabase normal
    try {
        const session = useLocalStorage?.getItem('c4app_session');
        return session ? session.user : null;
    } catch (error) {
        console.warn('Erro ao obter usuário:', error);
        return null;
    }
}

// Corrigido: Tornar a função disponível globalmente
window.getCurrentUser = getCurrentUser;

/**
 * Corrigido: Função supabaseFetch com melhor tratamento de erros
 * @param {string} endpoint - O caminho completo do endpoint
 * @param {string} [method='GET'] - Método HTTP
 * @param {object|null} [body=null] - Corpo da requisição
 * @param {object} [customHeaders={}] - Cabeçalhos adicionais
 * @returns {Promise<any>} A resposta JSON da API
 */
async function supabaseFetch(endpoint, method = 'GET', body = null, customHeaders = {}) {
    // Verificar se está em modo localStorage
    if (C4APP_CONFIG.USE_LOCAL_STORAGE || C4APP_CONFIG.SUPABASE_URL === 'LOCAL_STORAGE_MODE') {
        return handleLocalStorageMode(endpoint, method, body);
    }

    if (!C4APP_CONFIG.SUPABASE_URL || C4APP_CONFIG.SUPABASE_URL === 'SEU_SUPABASE_URL') {
        const errorMessage = "Configuração do Supabase não definida";
        console.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
    }

    const token = getAuthToken();
    const headers = {
        'apikey': C4APP_CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...customHeaders
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method.toUpperCase(),
        headers: headers,
    };

    if (body && ['POST', 'PATCH', 'PUT'].includes(config.method)) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(endpoint, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: response.statusText,
                error_description: null,
                details: null,
                code: response.status.toString()
            }));
            const message = errorData.error_description || errorData.message || errorData.msg || `Erro na API: ${response.status}`;
            const details = errorData.details ? ` Detalhes: ${errorData.details}` : '';
            throw new Error(`${message}${details}`);
        }

        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * Corrigido: Sistema localStorage com melhor tratamento de dados
 */
function handleLocalStorageMode(endpoint, method, body) {
    return new Promise((resolve, reject) => {
        try {
            // Extrair tabela do endpoint
            const urlParts = endpoint.split('/');
            const tableName = urlParts[urlParts.length - 1].split('?')[0];
            
            // Simular delay de rede realista
            setTimeout(() => {
                try {
                    switch (method.toUpperCase()) {
                        case 'GET':
                            resolve(handleLocalStorageGet(tableName, endpoint));
                            break;
                        case 'POST':
                            resolve(handleLocalStoragePost(tableName, body));
                            break;
                        case 'PATCH':
                            resolve(handleLocalStoragePatch(tableName, endpoint, body));
                            break;
                        case 'DELETE':
                            resolve(handleLocalStorageDelete(tableName, endpoint));
                            break;
                        default:
                            reject(new Error(`Método ${method} não suportado no modo localStorage`));
                    }
                } catch (error) {
                    reject(error);
                }
            }, Math.random() * 200 + 50); // Delay entre 50-250ms
        } catch (error) {
            reject(error);
        }
    });
}

function handleLocalStorageGet(tableName, endpoint) {
    const data = JSON.parse(localStorage.getItem(`c4app_${tableName}`) || '[]');
    let filteredData = [...data];
    
    // Corrigido: Melhor parsing de filtros do endpoint
    if (endpoint.includes('user_id=eq.')) {
        const userId = endpoint.match(/user_id=eq\.([^&]+)/)?.[1];
        if (userId) {
            filteredData = filteredData.filter(item => item.user_id === userId);
        }
    }
    
    if (endpoint.includes('estoque_atual=gt.0')) {
        filteredData = filteredData.filter(item => item.estoque_atual > 0);
    }
    
    if (endpoint.includes('valor_venda=not.is.null')) {
        filteredData = filteredData.filter(item => item.valor_venda !== null && item.valor_venda !== undefined);
    }
    
    // Corrigido: Suporte a ordenação
    if (endpoint.includes('order=')) {
        const orderMatch = endpoint.match(/order=([^&]+)/);
        if (orderMatch) {
            const [field, direction = 'asc'] = orderMatch[1].split('.');
            filteredData.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (direction === 'desc') {
                    return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
            });
        }
    }
    
    return filteredData;
}

function handleLocalStoragePost(tableName, body) {
    const data = JSON.parse(localStorage.getItem(`c4app_${tableName}`) || '[]');
    const newItem = {
        ...body,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // ID único
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    data.push(newItem);
    localStorage.setItem(`c4app_${tableName}`, JSON.stringify(data));
    return [newItem]; // Retorna array como o Supabase
}

function handleLocalStoragePatch(tableName, endpoint, body) {
    const data = JSON.parse(localStorage.getItem(`c4app_${tableName}`) || '[]');
    
    // Extrair ID do endpoint
    const idMatch = endpoint.match(/id=eq\.([^&]+)/);
    if (!idMatch) {
        throw new Error('ID não encontrado no endpoint para PATCH');
    }
    
    const id = idMatch[1];
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
        throw new Error(`Item com ID ${id} não encontrado`);
    }
    
    data[index] = {
        ...data[index],
        ...body,
        updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(`c4app_${tableName}`, JSON.stringify(data));
    return [data[index]];
}

function handleLocalStorageDelete(tableName, endpoint) {
    const data = JSON.parse(localStorage.getItem(`c4app_${tableName}`) || '[]');
    
    // Extrair ID do endpoint
    const idMatch = endpoint.match(/id=eq\.([^&]+)/);
    if (!idMatch) {
        throw new Error('ID não encontrado no endpoint para DELETE');
    }
    
    const id = idMatch[1];
    const filteredData = data.filter(item => item.id !== id);
    
    localStorage.setItem(`c4app_${tableName}`, JSON.stringify(filteredData));
    return null; // DELETE retorna null
}

// Corrigido: Inicializar dados de exemplo se não existirem
function initializeExampleData() {
    const produtos = localStorage.getItem('c4app_produtos');
    if (!produtos || JSON.parse(produtos).length === 0) {
        const produtosExemplo = [
            {
                id: "exemplo_1",
                nome: "Batom Vermelho Intenso",
                categoria: "Maquiagem",
                valor_compra: 15.50,
                valor_venda: 35.00,
                estoque_atual: 25,
                imagem_url: "https://via.placeholder.com/150x150/ff6b9d/ffffff?text=Batom",
                user_id: "local_user_001",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: "exemplo_2",
                nome: "Base Líquida Natural",
                categoria: "Maquiagem",
                valor_compra: 22.00,
                valor_venda: 48.00,
                estoque_atual: 15,
                imagem_url: "https://via.placeholder.com/150x150/c44569/ffffff?text=Base",
                user_id: "local_user_001",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('c4app_produtos', JSON.stringify(produtosExemplo));
        console.log('Dados de exemplo inicializados');
    }
}

// Corrigido: Inicializar dados quando o script carrega
if (C4APP_CONFIG.USE_LOCAL_STORAGE) {
    initializeExampleData();
}

console.log('supabase-config.js carregado e corrigido');

