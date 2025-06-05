// Supabase Configuration
// Configuração do Supabase para o C4 App

// Configurações do Supabase (substitua pelas suas)
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co', // Substitua pela sua URL
    anonKey: 'your-anon-key', // Substitua pela sua chave anônima
    
    // Configurações opcionais
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
};

// Inicialização do Supabase
let supabase = null;

// Função para inicializar o Supabase
function initSupabase() {
    try {
        // Verifica se o Supabase está disponível
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                SUPABASE_CONFIG.options
            );
            
            console.log('✅ Supabase inicializado com sucesso');
            return true;
        } else {
            console.warn('⚠️ Supabase não encontrado, usando modo offline');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return false;
    }
}

// Função para verificar conexão
async function checkSupabaseConnection() {
    if (!supabase) return false;
    
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        return !error;
    } catch (error) {
        console.warn('⚠️ Conexão com Supabase indisponível:', error);
        return false;
    }
}

// Configuração das tabelas
const TABLES = {
    profiles: 'profiles',
    products: 'products',
    sales: 'sales',
    clients: 'clients',
    expenses: 'expenses',
    goals: 'goals',
    categories: 'categories'
};

// Esquemas das tabelas (para referência)
const SCHEMAS = {
    profiles: {
        id: 'uuid',
        user_id: 'uuid',
        name: 'text',
        email: 'text',
        phone: 'text',
        business_name: 'text',
        business_type: 'text',
        monthly_goal: 'numeric',
        created_at: 'timestamp',
        updated_at: 'timestamp'
    },
    
    products: {
        id: 'uuid',
        user_id: 'uuid',
        name: 'text',
        description: 'text',
        category: 'text',
        cost_price: 'numeric',
        sale_price: 'numeric',
        stock_quantity: 'integer',
        min_stock: 'integer',
        image_url: 'text',
        active: 'boolean',
        created_at: 'timestamp',
        updated_at: 'timestamp'
    },
    
    sales: {
        id: 'uuid',
        user_id: 'uuid',
        client_id: 'uuid',
        product_id: 'uuid',
        quantity: 'integer',
        unit_price: 'numeric',
        total_amount: 'numeric',
        discount: 'numeric',
        shipping: 'numeric',
        payment_method: 'text',
        status: 'text',
        sale_date: 'timestamp',
        created_at: 'timestamp'
    },
    
    clients: {
        id: 'uuid',
        user_id: 'uuid',
        name: 'text',
        email: 'text',
        phone: 'text',
        address: 'text',
        city: 'text',
        state: 'text',
        zip_code: 'text',
        birthday: 'date',
        notes: 'text',
        total_purchases: 'numeric',
        last_purchase: 'timestamp',
        created_at: 'timestamp'
    },
    
    expenses: {
        id: 'uuid',
        user_id: 'uuid',
        description: 'text',
        category: 'text',
        amount: 'numeric',
        expense_type: 'text', // 'fixed', 'variable', 'tax'
        due_date: 'date',
        paid: 'boolean',
        payment_date: 'timestamp',
        recurring: 'boolean',
        created_at: 'timestamp'
    },
    
    goals: {
        id: 'uuid',
        user_id: 'uuid',
        title: 'text',
        target_amount: 'numeric',
        current_amount: 'numeric',
        target_date: 'date',
        category: 'text',
        status: 'text',
        created_at: 'timestamp'
    }
};

// Políticas RLS (Row Level Security) - Para referência
const RLS_POLICIES = `
-- Política para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Política para products
CREATE POLICY "Users can manage own products" ON products FOR ALL USING (auth.uid() = user_id);

-- Política para sales
CREATE POLICY "Users can manage own sales" ON sales FOR ALL USING (auth.uid() = user_id);

-- Política para clients
CREATE POLICY "Users can manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- Política para expenses
CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

-- Política para goals
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
`;

// Função para criar tabelas (SQL para referência)
const CREATE_TABLES_SQL = `
-- Criar tabelas do C4 App
-- Execute este SQL no Supabase SQL Editor

-- Tabela de perfis
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    business_name TEXT,
    business_type TEXT DEFAULT 'mei',
    monthly_goal NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'outros',
    cost_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    birthday DATE,
    notes TEXT,
    total_purchases NUMERIC DEFAULT 0,
    last_purchase TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vendas
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    shipping NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'dinheiro',
    status TEXT DEFAULT 'concluida',
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de despesas
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'outros',
    amount NUMERIC DEFAULT 0,
    expense_type TEXT DEFAULT 'variable',
    due_date DATE,
    paid BOOLEAN DEFAULT false,
    payment_date TIMESTAMP WITH TIME ZONE,
    recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de metas
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    target_date DATE,
    category TEXT DEFAULT 'vendas',
    status TEXT DEFAULT 'ativa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
`;

// Exportar configurações
window.SupabaseConfig = {
    SUPABASE_CONFIG,
    TABLES,
    SCHEMAS,
    initSupabase,
    checkSupabaseConnection,
    getSupabase: () => supabase,
    CREATE_TABLES_SQL
};

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});

