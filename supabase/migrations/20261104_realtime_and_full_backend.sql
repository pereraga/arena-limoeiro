-- ==============================================================================
-- 🛡️ ARENA LIMOEIRO - MIGRAÇÃO DE ATUALIZAÇÃO AUTOMÁTICA EM TEMPO REAL & BACKEND
-- Migração Idempotente: 20261104_realtime_and_full_backend.sql
-- ==============================================================================

-- 1. GARANTE A EXISTÊNCIA DA TABELA blocked_slots
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id TEXT PRIMARY KEY,
    court_id TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT DEFAULT 'Manutenção / Bloqueio Operacional',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS imediatamente
ALTER TABLE IF EXISTS public.blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_slots_select_public" ON public.blocked_slots;
CREATE POLICY "blocked_slots_select_public" ON public.blocked_slots
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "blocked_slots_manage_admin" ON public.blocked_slots;
CREATE POLICY "blocked_slots_manage_admin" ON public.blocked_slots
    FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- 2. HABILITAÇÃO DO SUPABASE REALTIME PARA SINCRONIZAÇÃO INSTANTÂNEA
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'monthly_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_members;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'courts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.courts;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. ÍNDICES DE BUSCA E PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_blocked_slots_court_date ON public.blocked_slots (court_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_court_time ON public.bookings (date, court_id, start_time);
