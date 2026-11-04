const fs = require('fs');
const path = require('path');

const migPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261103_rls_hardening.sql');
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

const indexSql = `
-- 10. ÍNDICES DE ALTA PERFORMANCE PARA FILTROS DE STATUS E DATA (FINALIZADOS / AO VIVO)
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON public.bookings (date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_court_date ON public.bookings (court_id, date);
CREATE INDEX IF NOT EXISTS idx_monthly_members_day ON public.monthly_members (day_of_week, status);
`;

let migContent = fs.readFileSync(migPath, 'utf8');
if (!migContent.includes('idx_bookings_date_status')) {
  migContent += indexSql;
  fs.writeFileSync(migPath, migContent, 'utf8');
  console.log('20261103_rls_hardening.sql atualizado com índices.');
}

let schemaContent = fs.readFileSync(schemaPath, 'utf8');
if (!schemaContent.includes('idx_bookings_date_status')) {
  schemaContent += indexSql;
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('schema.sql atualizado com índices.');
}
