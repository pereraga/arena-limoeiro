-- ==============================================================================
-- 🏟️ ARENA LIMOEIRO - BANCO DE DADOS POSTGRESQL (SUPABASE OFICIAL)
-- Execute este script no SQL Editor do seu projeto Supabase para criar ou atualizar
-- a estrutura completa com todas as tabelas, permissões RLS e dados reais das quadras.
-- ==============================================================================

-- 1. TABELA DE CLIENTES (CADASTRO SEPARADO)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    document TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE QUADRAS E ESPAÇOS ESPORTIVOS
CREATE TABLE IF NOT EXISTS public.courts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    image TEXT,
    base_price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 90.00,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    badge TEXT,
    bookings_count INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 1,
    description TEXT,
    observation TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE PRODUTOS & ITENS DE BAR (INCLUINDO ESTOQUE DE ÁGUA)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Bebidas',
    type TEXT NOT NULL DEFAULT 'product',
    price NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    unit TEXT DEFAULT 'unid.',
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CONTRATOS MENSALISTAS
CREATE TABLE IF NOT EXISTS public.monthly_members (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    responsible_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    court_id TEXT REFERENCES public.courts(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    day_of_week_label TEXT NOT NULL,
    time TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    monthly_price NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'active',
    start_month TEXT,
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE AGENDAMENTOS (RESERVAS AVULSAS E MENSALISTAS)
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    court_id TEXT REFERENCES public.courts(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'confirmed',
    booking_type TEXT DEFAULT 'avulso',
    payment_method TEXT DEFAULT 'pix',
    product_cart JSONB DEFAULT '{}'::jsonb,
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE USUÁRIOS GESTORES / RESPONSÁVEIS
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Gerente do Sistema',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE HORÁRIOS BLOQUEADOS (MANUTENÇÃO / TREINOS FECHADOS)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id SERIAL PRIMARY KEY,
    court_id TEXT REFERENCES public.courts(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    reason TEXT DEFAULT 'Manutenção',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_court_date_time UNIQUE (court_id, date, time)
);

-- ==============================================================================
-- 🔒 PERMISSÕES E POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas anteriores
DROP POLICY IF EXISTS "Permitir leitura pública de quadras" ON public.courts;
DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos" ON public.bookings;
DROP POLICY IF EXISTS "Permitir inserção de agendamentos" ON public.bookings;
DROP POLICY IF EXISTS "Permitir leitura pública de clientes" ON public.customers;
DROP POLICY IF EXISTS "Permitir inserção de clientes" ON public.customers;
DROP POLICY IF EXISTS "Permitir leitura pública de mensalistas" ON public.monthly_members;
DROP POLICY IF EXISTS "Permitir inserção de mensalistas" ON public.monthly_members;
DROP POLICY IF EXISTS "Permitir leitura pública de bloqueios" ON public.blocked_slots;
DROP POLICY IF EXISTS "Permitir leitura de gestores" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de quadras" ON public.courts;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de mensalistas" ON public.monthly_members;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de bloqueios" ON public.blocked_slots;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de gestores" ON public.admin_users;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de clientes" ON public.customers;
DROP POLICY IF EXISTS "Permitir gerenciamento completo de agendamentos" ON public.bookings;

-- Políticas universais de leitura e escrita para anon e authenticated
CREATE POLICY "Permitir gerenciamento completo de quadras" 
ON public.courts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir gerenciamento completo de produtos" 
ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir gerenciamento completo de clientes" 
ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir gerenciamento completo de agendamentos" 
ON public.bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir gerenciamento completo de mensalistas" 
ON public.monthly_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir gerenciamento completo de bloqueios" 
ON public.blocked_slots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir gerenciamento completo de gestores" 
ON public.admin_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- ⚡ ATIVAÇÃO DO SUPABASE REALTIME (WEBSOCKETS)
-- ==============================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.bookings, 
    public.courts, 
    public.monthly_members, 
    public.blocked_slots,
    public.products,
    public.customers;
COMMIT;

-- ==============================================================================
-- 🌱 DADOS INICIAIS (6 QUADRAS REAIS DA ARENA LIMOEIRO + ADMINISTRADORES)
-- ==============================================================================
INSERT INTO public.admin_users (id, name, email, password, role)
VALUES 
  ('admin-1', 'Gabriel Alves', 'admin@arenalimoeiro.com.br', 'Alves@157620', 'Administrador Geral'),
  ('admin-1788989952703', 'Vinicius Melo', 'vinicius.melo@arenalimoeiro.com.br', 'vinicius@2026!', 'Gerente do Sistema')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- As 6 Quadras Reais da Arena Limoeiro
INSERT INTO public.courts (id, name, category, category_label, image, base_price_per_hour, monthly_price, badge, bookings_count, order_index, description, observation, specs)
VALUES
(
  'court-society-1',
  'FUT 5 - SOCCER 5',
  'poliesportiva',
  'Quadra Poliesportiva',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  90.00,
  500.00,
  '🔥 Mais Agendada da Semana',
  48,
  1,
  'Espaço projetado para jogos ágeis e de muita movimentação. Com dimensões otimizadas para o futebol rápido, possui amortecimento e excelente absorção de impacto.',
  'Permitido apenas chuteiras society ou tênis (proibido travas de campo).',
  '{"type": "Grama Sintética 60mm", "surface": "Grama Sintética 60mm", "capacity": "10 a 12 Jogadores", "features": ["Iluminação LED", "Vestiários", "Churrasqueira Anexa"], "status": "Disponível", "opening_time": "06:00", "closing_time": "22:00", "discount_price_per_hour": 50.00, "discount_start_time": "09:00", "discount_end_time": "16:00"}'::jsonb
),
(
  'court-society-2',
  'FUT 6 - SOCCER 6',
  'poliesportiva',
  'Quadra Poliesportiva',
  'https://images.unsplash.com/photo-1529900245534-47fbf8204bca?w=800&auto=format&fit=crop&q=80',
  100.00,
  600.00,
  '⭐ Preferida da Galera',
  42,
  2,
  'O meio-termo ideal entre o jogo rápido de salão e o campo tradicional. Com gramado sintético de alta durabilidade e iluminação potente para partidas noturnas.',
  'Permitido apenas chuteiras society ou tênis (proibido travas de campo).',
  '{"type": "Grama Sintética 60mm", "surface": "Grama Sintética 60mm", "capacity": "12 a 14 Jogadores", "features": ["Iluminação LED", "Vestiários", "100% Coberto"], "status": "Disponível", "opening_time": "06:00", "closing_time": "22:00", "discount_price_per_hour": 60.00, "discount_start_time": "09:00", "discount_end_time": "16:00"}'::jsonb
),
(
  'court-beach-1',
  'FUT 7 - SOCCER 7',
  'poliesportiva',
  'Quadra Poliesportiva',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  110.00,
  650.00,
  '🔥 Mais Agendada da Semana',
  39,
  3,
  'Estrutura padrão de futebol society com dimensões oficiais e grama sintética de alto rendimento. Perfeita para campeonatos, torneios e partidas com amigos.',
  'Permitido apenas chuteiras society ou tênis (proibido travas de campo).',
  '{"type": "Grama Sintética 60mm", "surface": "Grama Sintética 60mm", "capacity": "14 a 20 Jogadores", "features": ["Iluminação LED", "Vestiários", "Placar Digital"], "status": "Disponível", "opening_time": "06:00", "closing_time": "22:00", "discount_price_per_hour": 70.00, "discount_start_time": "09:00", "discount_end_time": "16:00"}'::jsonb
),
(
  'court-esportes-de-quadra-1788962671043',
  'FOOT TABLE - FUTMESA',
  'foot-skill',
  'Foot-Skill',
  'https://images.unsplash.com/photo-1518604666864-7423958f7660?w=800&auto=format&fit=crop&q=80',
  35.00,
  200.00,
  '🎯 Melhor Custo-Benefício',
  48,
  4,
  'Área dedicada à prática de futmesa com piso nivelado e mesa de alta qualidade com curvatura padrão oficial para treinos de técnica e disputas dinâmicas.',
  'Uso com tênis apropriado ou descalço na área da mesa.',
  '{"type": "Grama Sintética 60mm", "surface": "Grama Sintética 60mm", "capacity": "10 a 14 Jogadores", "features": ["Mesa Oficial", "Iluminação LED", "Vestiários"], "status": "Disponível", "opening_time": "06:00", "closing_time": "22:00", "discount_price_per_hour": 25.00, "discount_start_time": "09:00", "discount_end_time": "16:00"}'::jsonb
),
(
  'court-beach-2',
  'QUADRA DE AREIA - SAND COURT',
  'beach',
  'Arena Beach',
  'https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80',
  50.00,
  320.00,
  '🏖️ Areia Fina Tratada',
  26,
  5,
  'Quadra de areia nivelada e higienizada, projetada para absorção de impacto e máximo esforço físico sem sobrecarga articular. Ideal para futevôlei e beach tennis.',
  'Duchas ao lado disponíveis. Aluguel de bolas e raquetes na recepção.',
  '{"type": "Areia Branca", "surface": "Areia Branca", "capacity": "4 a 8 Jogadores", "features": ["Areia Lavada", "Refletores LED", "Duchas Anexas"], "status": "Disponível", "opening_time": "06:00", "closing_time": "22:00", "discount_price_per_hour": 30.00, "discount_start_time": "09:00", "discount_end_time": "16:00"}'::jsonb
),
(
  'court-futsal-1788963178368',
  'QUADRA SOCIETY',
  'society',
  'Society',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
  60.00,
  400.00,
  '⚡ Alta Procura',
  49,
  6,
  'Quadra poliesportiva em piso de cimento polido, ideal para jogos rápidos e com alto controle de bola. Espaço versátil com marcações esportivas atualizadas.',
  'Obrigatório o uso de tênis esportivo ou de futsal. Proibido travas.',
  '{"type": "Cimento Polido", "surface": "Cimento Polido", "capacity": "10 a 14 Jogadores", "features": ["Piso Polido", "Iluminação LED", "Vestiários"], "status": "Disponível", "opening_time": "06:00", "closing_time": "22:00", "discount_price_per_hour": 40.00, "discount_start_time": "09:00", "discount_end_time": "16:00"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  base_price_per_hour = EXCLUDED.base_price_per_hour,
  monthly_price = EXCLUDED.monthly_price,
  badge = EXCLUDED.badge,
  order_index = EXCLUDED.order_index,
  description = EXCLUDED.description,
  observation = EXCLUDED.observation,
  specs = EXCLUDED.specs;

-- Produtos Iniciais
INSERT INTO public.products (id, name, category, type, price, unit, image)
VALUES
  ('prod-agua', 'Água Mineral Crystal 500ml (Gelada)', 'Bebidas', 'product', 4.00, 'unid.', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=200&auto=format&fit=crop&q=80'),
  ('prod-isotonico', 'Gatorade / Isotônico 500ml (Vários Sabores)', 'Bebidas', 'product', 9.00, 'unid.', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&auto=format&fit=crop&q=80'),
  ('prod-refrigerante', 'Refrigerante Lata 350ml (Coca / Guaraná)', 'Bebidas', 'product', 6.00, 'lata', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80'),
  ('prod-cerveja', 'Cerveja Heineken Long Neck 330ml', 'Bebidas', 'product', 12.00, 'unid.', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&auto=format&fit=crop&q=80'),
  ('prod-gelo', 'Saco de Gelo Filtrado 5kg', 'Bebidas & Gelo', 'product', 15.00, 'saco', 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?w=200&auto=format&fit=crop&q=80'),
  ('prod-espetinho', 'Combo 3 Espetinhos Gourmet na Brasa (Carne / Frango / Queijo)', 'Alimentos', 'product', 28.00, 'combo', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80'),
  ('prod-carvao', 'Saco de Carvão Vegetal 3kg + Acendedor', 'Churrasco', 'product', 22.00, 'saco', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit;
