-- ==============================================================================
-- 🛡️ ARENA LIMOEIRO - RESET E PREPARAÇÃO DOS JOGOS DO DIA 04/11/2026
-- Migração Idempotente: 20261104_revert_day04_confirmed.sql
-- ==============================================================================

-- 1. CANCELA STATUS FINALIZADO E COLOCA JOGOS DO DIA 04 COMO CONFIRMADOS / PRONTOS PARA INICIAR
UPDATE public.bookings 
SET status = 'confirmed', observation = 'Pronto para iniciar'
WHERE date = '2026-11-04';

-- 2. LIMPEZA DE DUPLICATAS AUTOMÁTICAS (SE HOUVER)
DELETE FROM public.bookings
WHERE date = '2026-11-04' 
  AND id LIKE 'monthly-mensal-%';

-- 3. REFORÇO DE RLS
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
