-- ==============================================================================
-- 🛡️ ARENA LIMOEIRO - FINALIZAÇÃO DE JOGOS DOS DIAS ANTERIORES (<= 03/11/2026)
-- Migração Idempotente: 20261104_finalize_past_bookings.sql
-- ==============================================================================

-- 1. FINALIZA TODAS AS RESERVAS REGISTRADAS DE DATAS ANTERIORES (<= 2026-11-03)
UPDATE public.bookings 
SET status = 'finished'
WHERE date <= '2026-11-03' AND status != 'finished';

-- 2. REFORÇO DE RLS E POLÍTICAS DE ACESSO
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
