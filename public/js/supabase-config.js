// 📁 js/supabase-config.js

// Adicione suas credenciais do Supabase aqui
const SUPABASE_URL = 'SEU_SUPABASE_URL'; // Ex: https://xyzabcdefghijklmnop.supabase.co
const SUPABASE_ANON_KEY = 'SUA_SUPABASE_ANON_KEY'; // Chave anônima pública

window.C4APP_CONFIG = {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    AUTH_ENDPOINT: `${SUPABASE_URL}/auth/v1`,
    DB_ENDPOINT: `${SUPABASE_URL}/rest/v1`,
    STORAGE_ENDPOINT: `${SUPABASE_URL}/storage/v1`,
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
    if (!C4APP_CONFIG.SUPABASE_URL || C4APP_CONFIG.SUPABASE_URL === 'SEU_SUPABASE_URL') {
        const errorMessage = "Configuração do Supabase (URL/Chave) não definida em js/supabase-config.js";
        console.error(errorMessage);
        // Em vez de showToast aqui (que pode não estar carregado), vamos lançar um erro claro.
        return Promise.reject(new Error(errorMessage));
    }

    const token = getAuthToken(); // Definida em supabase-config.js, usa useLocalStorage.js

    const headers = {
        'apikey': C4APP_CONFIG.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        ...customHeaders // Permite sobrescrever Content-Type ou adicionar 'Prefer'
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
            // Tenta parsear o erro do Supabase, senão usa o statusText
            const errorData = await response.json().catch(() => ({
                message: response.statusText,
                error_description: null, // Para consistência
                details: null, // Para consistência
                code: response.status.toString() // Código HTTP como string
            }));
            // console.error('Supabase API Error:', response.status, errorData);
            // A API de auth do Supabase retorna `error_description` ou `msg` (signup)
            // A API de DB (PostgREST) retorna `message` e `details`
            const message = errorData.error_description || errorData.message || errorData.msg || `Erro na API: ${response.status}`;
            const details = errorData.details ? ` Detalhes: ${errorData.details}` : '';
            throw new Error(`${message}${details}`);
        }

        if (response.status === 204) { // No Content (ex: DELETE bem-sucedido)
            return null; // Ou um objeto de sucesso { success: true }
        }
        return await response.json();
    } catch (error) {
        // console.error(`Falha na chamada Supabase para ${method} ${endpoint}:`, error);
        // Relança o erro para ser tratado pela função chamadora
        throw error;
    }
}
