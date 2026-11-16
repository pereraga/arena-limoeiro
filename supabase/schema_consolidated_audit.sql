-- ==============================================================================
-- 🏟️ ARENA LIMOEIRO - BANCO DE DADOS POSTGRESQL & ROW LEVEL SECURITY (RLS)
-- ARQUITETURA CONSOLIDADA VERCEL + SUPABASE
-- Data: Novembro/2026 | Versão: 2.5
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSÕES & SEGURANÇA
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABELAS RELACIONAIS (DDL ROBUSTO)
-- ------------------------------------------------------------------------------

-- 2.1 TABELA DE CLIENTES (LGPD & DADOS PESSOAIS)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    document TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 TABELA DE QUADRAS E ESPAÇOS ESPORTIVOS
CREATE TABLE IF NOT EXISTS public.courts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    image TEXT,
    base_price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 400.00,
    badge TEXT,
    bookings_count INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    observation TEXT,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 TABELA DE PRODUTOS & ITENS DE BAR
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Bebidas',
    type TEXT NOT NULL DEFAULT 'product',
    price NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    unit TEXT DEFAULT 'unid.',
    image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 TABELA DE CONTRATOS MENSALISTAS (1:N COM COURTS E CUSTOMERS)
CREATE TABLE IF NOT EXISTS public.monthly_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_name TEXT NOT NULL,
    responsible_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    court_id TEXT NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    day_of_week_label TEXT NOT NULL,
    time TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active',
    start_month TEXT,
    observation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 TABELA DE AGENDAMENTOS OPERACIONAIS (RESERVAS AVULSAS & FIXAS)
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    court_id TEXT NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'confirmed',
    booking_type TEXT NOT NULL DEFAULT 'avulso',
    payment_method TEXT NOT NULL DEFAULT 'pix',
    product_cart JSONB NOT NULL DEFAULT '{}'::jsonb,
    observation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 TABELA DE USUÁRIOS GESTORES / AUDITORIA DE ACESSO
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Atendente da Recepção',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 TABELA DE HORÁRIOS BLOQUEADOS (MANUTENÇÃO OU OPERAÇÃO)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id BIGSERIAL PRIMARY KEY,
    court_id TEXT NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Manutenção',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_court_date_time UNIQUE (court_id, date, time)
);

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE (EVITA FULL-TABLE SCANS E RESOLVE N+1)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_court_date ON public.bookings (court_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings (date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON public.bookings (customer_phone);

CREATE INDEX IF NOT EXISTS idx_monthly_court_day ON public.monthly_members (court_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_monthly_status ON public.monthly_members (status);

CREATE INDEX IF NOT EXISTS idx_blocked_court_date ON public.blocked_slots (court_id, date);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);

-- ------------------------------------------------------------------------------
-- 4. ATIVAÇÃO OBRIGATÓRIA DE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- Força RLS mesmo para os donos da tabela se acessados sem bypass
ALTER TABLE public.customers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.courts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. LIMPEZA DE POLÍTICAS EXISTENTES (IDEMPOTÊNCIA)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RESTRITIVAS DE SEGURANÇA (RLS POLICIES)
-- ------------------------------------------------------------------------------

-- === 6.1 TABELA: admin_users (ISOLAMENTO COMPLETO CONTRA ACESSO ANÔNIMO) ===
-- Usuários anônimos recebem zero linhas e não podem inserir, atualizar nem deletar.
CREATE POLICY "admin_users_select_authenticated" ON public.admin_users
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_users_manage_admin" ON public.admin_users
    FOR ALL TO authenticated
    USING (
        auth.uid() IS NOT NULL AND 
        (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'email' LIKE '%@arenalimoeiro%')
    );

-- === 6.2 TABELA: customers (LGPD - PROTEÇÃO CONTRA LEITURA PÚBLICA EM MASSA) ===
-- Clientes podem criar seu cadastro no fluxo público de reserva
CREATE POLICY "customers_insert_public" ON public.customers
    FOR INSERT TO anon, authenticated
    WITH CHECK (name IS NOT NULL AND phone IS NOT NULL);

-- Visualização e gestão restritas à equipe autenticada
CREATE POLICY "customers_select_authenticated" ON public.customers
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_manage_authenticated" ON public.customers
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL);

-- === 6.3 TABELA: courts (CATÁLOGO DE QUADRAS - LEITURA PÚBLICA, EDIÇÃO RESTRITA) ===
CREATE POLICY "courts_select_public" ON public.courts
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "courts_manage_admin" ON public.courts
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL);

-- === 6.4 TABELA: products (CATÁLOGO DE PRODUTOS/BAR) ===
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "products_manage_admin" ON public.products
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL);

-- === 6.5 TABELA: blocked_slots (HORÁRIOS BLOQUEADOS / MANUTENÇÃO) ===
CREATE POLICY "blocked_slots_select_public" ON public.blocked_slots
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "blocked_slots_manage_admin" ON public.blocked_slots
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL);

-- === 6.6 TABELA: monthly_members (CONTRATOS MENSALISTAS) ===
CREATE POLICY "monthly_members_select_public" ON public.monthly_members
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "monthly_members_manage_admin" ON public.monthly_members
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL);

-- === 6.7 TABELA: bookings (AGENDAMENTOS OPERACIONAIS) ===
-- Leitura pública para que a grade exiba horários disponíveis e ocupados
CREATE POLICY "bookings_select_public" ON public.bookings
    FOR SELECT TO anon, authenticated
    USING (true);

-- Criação pública permitida para clientes agendarem
CREATE POLICY "bookings_insert_public" ON public.bookings
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        court_id IS NOT NULL AND 
        date IS NOT NULL AND 
        start_time IS NOT NULL AND 
        customer_name IS NOT NULL AND 
        customer_phone IS NOT NULL
    );

-- Alteração de status, finalização e cancelamento restritos à equipe autenticada
CREATE POLICY "bookings_manage_admin" ON public.bookings
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 7. ATIVAÇÃO DO SUPABASE REALTIME (PUBLICAÇÃO)
-- ------------------------------------------------------------------------------
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
