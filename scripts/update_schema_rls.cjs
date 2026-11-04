const fs = require('fs');

let schema = fs.readFileSync('supabase/schema.sql', 'utf8');
const isCRLF = schema.includes('\r\n');
if (isCRLF) schema = schema.replace(/\r\n/g, '\n');

const migration = fs.readFileSync('supabase/migrations/20261103_rls_hardening.sql', 'utf8').replace(/\r\n/g, '\n');

// Replace the RLS section in schema.sql
const targetOldRLS = schema.match(/-- 🔒 POLÍTICAS DE SEGURANÇA \(ROW LEVEL SECURITY - RLS\)[\s\S]*?-- ==============================================================================\n-- ⚡ ATIVAÇÃO DO SUPABASE REALTIME/);

if (!targetOldRLS) {
  console.error('Could not match old RLS section in schema.sql');
  process.exit(1);
}

const replacementRLS = migration + '\n\n-- ==============================================================================\n-- ⚡ ATIVAÇÃO DO SUPABASE REALTIME';

schema = schema.replace(targetOldRLS[0], replacementRLS);

if (isCRLF) schema = schema.replace(/\n/g, '\r\n');
fs.writeFileSync('supabase/schema.sql', schema, 'utf8');
console.log('supabase/schema.sql updated with hardened RLS policies!');
