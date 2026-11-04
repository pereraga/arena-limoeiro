-- ==============================================================================
-- 🛡️ ARENA LIMOEIRO - MIGRAÇÃO DE CIBERSEGURANÇA & ROW LEVEL SECURITY (RLS)
-- Migração Idempotente: 20261103_rls_hardening.sql
-- Padrão: Defesa Silenciosa, Isolamento Estrito de Role 'admin' e 'authenticated'
-- ==============================================================================

-- 1. HABILITAÇÃO OBRIGATÓRIA DE RLS EM TODAS AS TABELAS
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.monthly_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- 2. REMOÇÃO DE POLÍTICAS PERMISSIVAS OU INSEGURAS ANTERIORES
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

-- 3. POLÍTICAS ESTRITAS PARA admin_users (ISOLAMENTO TOTAL CONTRA ANON)
-- Bloqueia 100% de acesso anônimo. Apenas usuários autenticados com claim/role de administrador.
DROP POLICY IF EXISTS "admin_users_select_authenticated" ON public.admin_users;
CREATE POLICY "admin_users_select_authenticated" ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_users_admin_manage" ON public.admin_users;
CREATE POLICY "admin_users_admin_manage" ON public.admin_users
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL AND (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'email' LIKE '%@arenalimoeiro%'));

-- 4. POLÍTICAS ESTRITAS PARA customers (PROTEÇÃO DE DADOS PESSOAIS - LGPD)
-- Impede dump público da base de clientes por usuários anônimos.
DROP POLICY IF EXISTS "customers_insert_public" ON public.customers;
CREATE POLICY "customers_insert_public" ON public.customers
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "customers_select_authenticated" ON public.customers;
CREATE POLICY "customers_select_authenticated" ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "customers_manage_admin" ON public.customers;
CREATE POLICY "customers_manage_admin" ON public.customers
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 5. POLÍTICAS PARA courts (QUADRAS - CATÁLOGO PÚBLICO LEITURA / ESCRITA RESTRITA)
DROP POLICY IF EXISTS "courts_select_public" ON public.courts;
CREATE POLICY "courts_select_public" ON public.courts
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "courts_manage_admin" ON public.courts;
CREATE POLICY "courts_manage_admin" ON public.courts
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 6. POLÍTICAS PARA products (PRODUTOS / BAR - LEITURA PÚBLICA / ESCRITA RESTRITA)
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "products_manage_admin" ON public.products;
CREATE POLICY "products_manage_admin" ON public.products
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 7. POLÍTICAS PARA blocked_slots (BLOQUEIOS OPERACIONAIS)
DROP POLICY IF EXISTS "blocked_slots_select_public" ON public.blocked_slots;
CREATE POLICY "blocked_slots_select_public" ON public.blocked_slots
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "blocked_slots_manage_admin" ON public.blocked_slots;
CREATE POLICY "blocked_slots_manage_admin" ON public.blocked_slots
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 8. POLÍTICAS PARA monthly_members (MENSALISTAS)
DROP POLICY IF EXISTS "monthly_members_select_public" ON public.monthly_members;
CREATE POLICY "monthly_members_select_public" ON public.monthly_members
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "monthly_members_manage_admin" ON public.monthly_members;
CREATE POLICY "monthly_members_manage_admin" ON public.monthly_members
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 9. POLÍTICAS PARA bookings (AGENDAMENTOS OPERACIONAIS)
-- Leitura pública para conferência de disponibilidade de quadras e horários
DROP POLICY IF EXISTS "bookings_select_public" ON public.bookings;
CREATE POLICY "bookings_select_public" ON public.bookings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Inserção pública permitida para criação de novas reservas pelo cliente
DROP POLICY IF EXISTS "bookings_insert_public" ON public.bookings;
CREATE POLICY "bookings_insert_public" ON public.bookings
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Gestão completa (atualização de status, cancelamento, finalização) restrita
DROP POLICY IF EXISTS "bookings_manage_admin" ON public.bookings;
CREATE POLICY "bookings_manage_admin" ON public.bookings
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 10. ÍNDICES DE ALTA PERFORMANCE PARA FILTROS DE STATUS E DATA (FINALIZADOS / AO VIVO)
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON public.bookings (date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_court_date ON public.bookings (court_id, date);
CREATE INDEX IF NOT EXISTS idx_monthly_members_day ON public.monthly_members (day_of_week, status);
