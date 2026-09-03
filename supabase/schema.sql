-- ==============================================================================
-- 🏟️ ARENA LIMOEIRO - BANCO DE DADOS POSTGRESQL (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase para criar a estrutura completa.
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
    base_price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 140.00,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    badge TEXT,
    bookings_count INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 1,
    description TEXT,
    observation TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE PRODUTOS & ITENS DE BAR
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
    role TEXT NOT NULL DEFAULT 'Atendente da Recepção',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE HORÁRIOS BLOQUEADOS (MANUTENÇÃO)
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
-- 🔒 POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Políticas públicas
DROP POLICY IF EXISTS "Permitir leitura pública de quadras" ON public.courts;
CREATE POLICY "Permitir leitura pública de quadras" ON public.courts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON public.products;
CREATE POLICY "Permitir leitura pública de produtos" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos" ON public.bookings;
CREATE POLICY "Permitir leitura pública de agendamentos" ON public.bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de agendamentos" ON public.bookings;
CREATE POLICY "Permitir inserção de agendamentos" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura pública de clientes" ON public.customers;
CREATE POLICY "Permitir leitura pública de clientes" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de clientes" ON public.customers;
CREATE POLICY "Permitir inserção de clientes" ON public.customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura pública de mensalistas" ON public.monthly_members;
CREATE POLICY "Permitir leitura pública de mensalistas" ON public.monthly_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de mensalistas" ON public.monthly_members;
CREATE POLICY "Permitir inserção de mensalistas" ON public.monthly_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura pública de bloqueios" ON public.blocked_slots;
CREATE POLICY "Permitir leitura pública de bloqueios" ON public.blocked_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir leitura de gestores" ON public.admin_users;
CREATE POLICY "Permitir leitura de gestores" ON public.admin_users FOR SELECT USING (true);

-- Modificações gerais
DROP POLICY IF EXISTS "Permitir gerenciamento completo de quadras" ON public.courts;
CREATE POLICY "Permitir gerenciamento completo de quadras" ON public.courts FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento completo de produtos" ON public.products;
CREATE POLICY "Permitir gerenciamento completo de produtos" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento completo de mensalistas" ON public.monthly_members;
CREATE POLICY "Permitir gerenciamento completo de mensalistas" ON public.monthly_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento completo de bloqueios" ON public.blocked_slots;
CREATE POLICY "Permitir gerenciamento completo de bloqueios" ON public.blocked_slots FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento completo de gestores" ON public.admin_users;
CREATE POLICY "Permitir gerenciamento completo de gestores" ON public.admin_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento completo de clientes" ON public.customers;
CREATE POLICY "Permitir gerenciamento completo de clientes" ON public.customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir gerenciamento completo de agendamentos" ON public.bookings;
CREATE POLICY "Permitir gerenciamento completo de agendamentos" ON public.bookings FOR ALL USING (true);

-- ==============================================================================
-- ⚡ ATIVAÇÃO DO SUPABASE REALTIME
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
-- 🌱 DADOS INICIAIS (SEEDS DA ARENA LIMOEIRO)
-- ==============================================================================
INSERT INTO public.admin_users (id, name, email, password, role)
VALUES 
  ('admin-1', 'Administrador Geral', 'admin@arenalimoeiro.com.br', 'admin123', 'Administrador Geral'),
  ('admin-2', 'Recepção & Atendimento', 'recepcao@arenalimoeiro.com.br', 'arena123', 'Atendente da Recepção')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.courts (id, name, category, category_label, image, base_price_per_hour, monthly_price, badge, bookings_count, order_index, description, observation, specs)
VALUES
(
  'court-society-1',
  'Campo Society 01 - Grama Sintética Premium',
  'society',
  'Futebol Society',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  140.00,
  500.00,
  '🔥 Mais Agendado da Semana',
  48,
  1,
  'Campo de futebol society de alto padrão com dimensões oficiais, grama monofilamento macia e excelente drenagem.',
  'Permitido apenas chuteiras society ou tênis (proibido travas de campo).',
  '{"type": "Grama Sintética 60mm Monofilamento (FIFA Quality)", "capacity": "14 a 16 Jogadores (7x7 / 8x8)", "features": ["Iluminação LED 800W Pro", "Placar Eletrônico Digital", "Vestiários com Ducha Quente", "Churrasqueira Anexa"], "status": "Disponível"}'::jsonb
),
(
  'court-society-2',
  'Campo Society 02 - Coberto Climatizado',
  'society',
  'Futebol Society',
  'https://images.unsplash.com/photo-1529900245534-47fbf8204bca?w=800&auto=format&fit=crop&q=80',
  160.00,
  580.00,
  '⚡ Alta Procura (100% Coberto)',
  42,
  2,
  'Espaço 100% coberto e protegido de chuvas e sol forte, com ventilação forçada e amortecimento reforçado.',
  'Espaço perfeito para dias de chuva ou jogos nos horários de pico.',
  '{"type": "Grama Sintética Bicolor Coberta", "capacity": "12 a 14 Jogadores (6x6 / 7x7)", "features": ["100% Coberto (Sem chuva)", "Ventilação Forçada", "Gramado com Amortecimento", "Câmeras de Gravação"], "status": "Disponível"}'::jsonb
),
(
  'court-beach-1',
  'Quadra de Areia A - Beach Tennis & Futevôlei',
  'beach',
  'Beach Tennis / Futevôlei',
  'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80',
  90.00,
  320.00,
  '🔥 Mais Agendado (Beach)',
  39,
  3,
  'Quadra com areia fina e lavada que não esquenta o pé, nivelamento a laser e rede com regulagem de altura rápida.',
  'Disponíveis duchas higiênicas logo na saída da quadra.',
  '{"type": "Areia Especial Tratada e Filtrada (Não queima o pé)", "capacity": "4 a 8 Jogadores", "features": ["Rede Oficial Regulável", "Iluminação Noturna sem Ofuscamento", "Duchas ao Lado", "Kiosk Bar Próximo"], "status": "Disponível"}'::jsonb
),
(
  'court-beach-2',
  'Quadra de Areia B - Beach Sports Master',
  'beach',
  'Beach Tennis / Vôlei',
  'https://images.unsplash.com/photo-1592656094267-764a45160876?w=800&auto=format&fit=crop&q=80',
  90.00,
  320.00,
  'Areia Branca',
  26,
  4,
  'Ideal para torneios e jogos entre amigos de Beach Tennis, Vôlei de Praia e Futevôlei.',
  'Consulte o aluguel de raquetes na recepção se necessário.',
  '{"type": "Areia de Quartzo Branca Filtrada", "capacity": "4 a 8 Jogadores", "features": ["Rede de Futevôlei / Vôlei / Beach", "Refletores LED Direcionais", "Área de Descanso com Puffs"], "status": "Disponível"}'::jsonb
),
(
  'court-gym-1',
  'Ginásio Poliesportivo 01 (Futsal, Basquete e Vôlei)',
  'futsal',
  'Ginásio Poliesportivo',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
  130.00,
  460.00,
  'Piso Flutuante',
  31,
  5,
  'Ginásio coberto de alta absorção com piso modular esportivo, tabelas hidráulicas móveis de basquete e traves de futsal.',
  'Uso obrigatório de tênis com solado flat (não marcante).',
  '{"type": "Piso Flutuante de Madeira Tratada / Poliuretano", "capacity": "10 a 20 Jogadores", "features": ["Marcações Oficiais Futsal/Basquete/Vôlei", "Tabelas Hidráulicas", "Placar Eletrônico", "Vestiários Completos"], "status": "Disponível"}'::jsonb
),
(
  'court-padel-1',
  'Quadra de Padel & Tênis Panorâmica',
  'padel',
  'Padel & Tênis',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80',
  110.00,
  400.00,
  'Panorâmica',
  22,
  6,
  'Quadra panorâmica moderna com vidro temperado de 12mm e iluminação anti-reflexo.',
  'Raquetes e bolinhas podem ser alugadas à parte.',
  '{"type": "Vidro Temperado Panorâmico + Grama Fina", "capacity": "4 Jogadores (Duplas)", "features": ["Vidro 12mm Oficial", "Piso de Alta Performance", "Iluminação LED Especial de Alto Contraste"], "status": "Disponível"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, category, type, price, unit, image)
VALUES
  ('prod-agua', 'Água Mineral Crystal 500ml (Gelada)', 'Bebidas', 'product', 4.00, 'unid.', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=200&auto=format&fit=crop&q=80'),
  ('prod-isotonico', 'Gatorade / Isotônico 500ml (Vários Sabores)', 'Bebidas', 'product', 9.00, 'unid.', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=200&auto=format&fit=crop&q=80'),
  ('prod-refrigerante', 'Refrigerante Lata 350ml (Coca / Guaraná)', 'Bebidas', 'product', 6.00, 'lata', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80'),
  ('prod-cerveja', 'Cerveja Heineken Long Neck 330ml', 'Bebidas', 'product', 12.00, 'unid.', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&auto=format&fit=crop&q=80'),
  ('prod-gelo', 'Saco de Gelo Filtrado 5kg', 'Bebidas & Gelo', 'product', 15.00, 'saco', 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?w=200&auto=format&fit=crop&q=80'),
  ('prod-espetinho', 'Combo 3 Espetinhos Gourmet na Brasa (Carne / Frango / Queijo)', 'Alimentos', 'product', 28.00, 'combo', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&auto=format&fit=crop&q=80'),
  ('prod-carvao', 'Saco de Carvão Vegetal 3kg + Acendedor', 'Churrasco', 'product', 22.00, 'saco', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, name, phone, email)
VALUES
  ('cust-1', 'Carlos Eduardo', '(81) 99876-1122', 'carlos@exemplo.com'),
  ('cust-2', 'Matheus Silveira', '(81) 98844-5566', 'matheus@exemplo.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.monthly_members (id, team_name, responsible_name, phone, customer_id, court_id, day_of_week, day_of_week_label, time, start_time, end_time, monthly_price, status, start_month, observation)
VALUES
  ('mensal-1', 'Pelada dos Amigos da Terça', 'Carlos Eduardo', '(81) 99876-1122', 'cust-1', 'court-society-1', 'terca', 'Toda Terça-feira', '19:00', '19:00', '20:00', 500.00, 'active', 'Setembro/2026', 'Horário fixo semanal'),
  ('mensal-2', 'Galera do Futsal Noturno', 'Matheus Silveira', '(81) 98844-5566', 'cust-2', 'court-gym-1', 'quinta', 'Toda Quinta-feira', '20:00', '20:00', '21:00', 460.00, 'active', 'Setembro/2026', 'Horário fixo semanal')
ON CONFLICT (id) DO NOTHING;
