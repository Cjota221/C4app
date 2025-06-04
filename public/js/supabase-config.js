// 📁 js/supabase-config.js

// CONFIGURAÇÃO ALTERNATIVA: Usando localStorage para desenvolvimento/teste
// Para produção, substitua pelas credenciais reais do Supabase
const SUPABASE_URL = 'LOCAL_STORAGE_MODE'; // Modo localStorage para desenvolvimento
const SUPABASE_ANON_KEY = 'LOCAL_STORAGE_MODE'; // Modo localStorage para desenvolvimento

window.C4APP_CONFIG = {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    AUTH_ENDPOINT: `${SUPABASE_URL}/auth/v1`,
    DB_ENDPOINT: `${SUPABASE_URL}/rest/v1`,
    STORAGE_ENDPOINT: `${SUPABASE_URL}/storage/v1`,
    USE_LOCAL_STORAGE: true, // Flag para usar localStorage
};
// console.log('Configurações Supabase (para Fetch API) carregadas.');

/**
 * Obtém o token de autenticação da sessão armazenada.
 * Esta função é uma dependência para supabaseFetch.
 * @returns {string|null} O token de acesso ou null.
 */
function getAuthToken() {
    if (typeof useLocalStorage === 'undefined' || !useLocalStorage?.getItem) {
        // console.warn('useLocalStorage não está disponível. Não é possível obter token.');
        return null;
    }
    const session = useLocalStorage.getItem('c4app_session');
    return session ? session.access_token : null;
}

/**
 * Função genérica para realizar chamadas à API REST do Supabase.
 * @param {string} endpoint - O caminho completo do endpoint (ex: `${C4APP_CONFIG.DB_ENDPOINT}/tabela`).
 * @param {string} [method='GET'] - Método HTTP (GET, POST, PATCH, DELETE, PUT).
 * @param {object|null} [body=null] - Corpo da requisição para POST, PATCH, PUT.
 * @param {object} [customHeaders={}] - Cabeçalhos adicionais ou para sobrescrever.
 * @returns {Promise<any>} A resposta JSON da API.
 * @throws {Error} Se a requisição falhar ou a resposta não for OK.
 */
async function supabaseFetch(endpoint, method = 'GET', body = null, customHeaders = {}) {
    // Verificar se está em modo localStorage
    if (C4APP_CONFIG.USE_LOCAL_STORAGE || C4APP_CONFIG.SUPABASE_URL === 'LOCAL_STORAGE_MODE') {
        return handleLocalStorageMode(endpoint, method, body);
    }

    if (!C4APP_CONFIG.SUPABASE_URL || C4APP_CONFIG.SUPABASE_URL === 'SEU_SUPABASE_URL') {
        const errorMessage = "Configuração do Supabase (URL/Chave) não definida em js/supabase-config.js";
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
 * Função para simular operações de banco de dados usando localStorage
 */
function handleLocalStorageMode(endpoint, method, body) {
    return new Promise((resolve, reject) => {
        try {
            // Extrair tabela do endpoint
            const urlParts = endpoint.split('/');
            const tableName = urlParts[urlParts.length - 1].split('?')[0];
            
            // Simular delay de rede
            setTimeout(() => {
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
            }, 100); // Simular 100ms de delay
        } catch (error) {
            reject(error);
        }
    });
}

function handleLocalStorageGet(tableName, endpoint) {
    const data = JSON.parse(localStorage.getItem(`c4app_${tableName}`) || '[]');
    
    // Filtrar por user_id se especificado
    if (endpoint.includes('user_id=eq.')) {
        const userId = endpoint.match(/user_id=eq\.([^&]+)/)?.[1];
        if (userId) {
            return data.filter(item => item.user_id === userId);
        }
    }
    
    // Filtrar por estoque > 0 se especificado
    if (endpoint.includes('estoque_atual=gt.0')) {
        return data.filter(item => item.estoque_atual > 0);
    }
    
    // Filtrar por valor_venda não nulo
    if (endpoint.includes('valor_venda=not.is.null')) {
        return data.filter(item => item.valor_venda !== null && item.valor_venda !== undefined);
    }
    
    return data;
}

function handleLocalStoragePost(tableName, body) {
    const data = JSON.parse(localStorage.getItem(`c4app_${tableName}`) || '[]');
    const newItem = {
        ...body,
        id: Date.now().toString(), // ID simples baseado em timestamp
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

/**
 * Função para simular usuário logado no modo localStorage
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
    const session = useLocalStorage?.getItem('c4app_session');
    return session ? session.user : null;
}

// Tornar a função disponível globalmente
window.getCurrentUser = getCurrentUser;

