// 📁 js/utils/useLocalStorage.js
const useLocalStorage = {
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Erro ao salvar no LocalStorage (key: ${key}):`, error);
            // Poderia disparar um evento ou fallback se o LocalStorage estiver cheio/indisponível
        }
    },
    getItem: (key) => {
        try {
            const serializedValue = localStorage.getItem(key);
            return serializedValue === null ? null : JSON.parse(serializedValue);
        } catch (error) {
            console.error(`Erro ao recuperar do LocalStorage (key: ${key}):`, error);
            return null;
        }
    },
    removeItem: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Erro ao remover do LocalStorage (key: ${key}):`, error);
        }
    },
    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Erro ao limpar o LocalStorage:', error);
        }
    }
};

const C4APP_SESSION_KEY = 'c4app_session'; // Chave para os dados da sessão

/**
 * Salva os dados da sessão (token, usuário) no LocalStorage.
 * @param {object} sessionData - Objeto contendo access_token, user, etc.
 */
function saveSession(sessionData) {
    useLocalStorage.setItem(C4APP_SESSION_KEY, sessionData);
}

/**
 * Recupera os dados da sessão do LocalStorage.
 * @returns {object|null} Os dados da sessão ou null.
 */
function getSession() {
    return useLocalStorage.getItem(C4APP_SESSION_KEY);
}

/**
 * Limpa os dados da sessão do LocalStorage.
 */
function clearSession() {
    useLocalStorage.removeItem(C4APP_SESSION_KEY);
}

/**
 * Obtém o objeto do usuário atualmente logado.
 * @returns {object|null} O objeto do usuário ou null.
 */
function getCurrentUser() {
    const session = getSession();
    return session ? session.user : null;
}

// console.log('useLocalStorage.js carregado.');
