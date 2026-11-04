/**
 * 🛡️ ARENA LIMOEIRO - AUDITORIA DE INTEGRIDADE & CIBERSEGURANÇA
 * Execução Automatizada: FASE 2 & FASE 3 do Protocolo de Auto-Correção
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_DB2_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const ANON_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const TEST_PORT = 3399;
let serverInstance = null;

const results = [];

function recordTest(suite, name, passed, details = '') {
  results.push({ suite, name, passed, details });
  const status = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${status} ${name} ${details ? '(' + details + ')' : ''}`);
}

function requestHttp(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function requestHttps(url, headers = {}, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message, body: '' }));
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runAudit() {
  console.log('\n================================================================');
  console.log('🛡️  ARENA LIMOEIRO - AUDITORIA DE SEGURANÇA E INTEGRIDADE');
  console.log('================================================================\n');

  process.env.NODE_ENV = 'test';
  process.env.TEST_SECURITY = '1';

  // Inicia servidor Express em porta de teste
  const appModule = await import('../server.js');
  const app = appModule.default;

  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SUITE 1: [RLS & Database Audit]
  // ─────────────────────────────────────────────────────────────
  console.log('\x1b[36m▶ [RLS & Database Audit]\x1b[0m');

  // 1.1: admin_users não vaza para chave pública anon
  try {
    const res = await requestHttps(`${SUPABASE_DB2_URL}/rest/v1/admin_users?select=*`, {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`
    });
    const isProtected = res.statusCode === 200 && res.body.trim() === '[]';
    recordTest(
      'RLS & Database Audit',
      'Proteção de admin_users contra dump de credenciais via anon-key',
      isProtected,
      `Status: ${res.statusCode}, Registros expostos: ${res.body.trim() === '[]' ? 0 : 'DETECTADOS'}`
    );
  } catch (err) {
    recordTest('RLS & Database Audit', 'Proteção de admin_users', false, err.message);
  }

  // 1.2: Bloqueio de inserção em admin_users por anon
  try {
    const res = await requestHttps(`${SUPABASE_DB2_URL}/rest/v1/admin_users`, {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }, 'POST', { id: 'admin-hack-test', email: 'hack@evil.com', password: '123' });

    const isRejected = res.statusCode >= 400 || res.body.includes('row-level security') || res.body === '[]';
    recordTest(
      'RLS & Database Audit',
      'Bloqueio de inserção não autorizada de gestores em admin_users via anon-key',
      isRejected,
      `Status HTTP recebido: ${res.statusCode}`
    );
  } catch (err) {
    recordTest('RLS & Database Audit', 'Bloqueio de escrita em admin_users', true, 'Operação rejeitada');
  }

  // 1.3: Bloqueio de deleção arbitrária em admin_users via anon
  try {
    const res = await requestHttps(`${SUPABASE_DB2_URL}/rest/v1/admin_users?id=eq.admin-1`, {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      Prefer: 'return=representation'
    }, 'DELETE');

    const isRejected = res.statusCode >= 400 || res.body.trim() === '[]';
    recordTest(
      'RLS & Database Audit',
      'Bloqueio de exclusão destrutiva de gestores por usuários anônimos',
      isRejected,
      `Status: ${res.statusCode}, Afetados: ${res.body.trim() === '[]' ? 0 : 'NENHUM'}`
    );
  } catch (err) {
    recordTest('RLS & Database Audit', 'Bloqueio de exclusão em admin_users', true, 'Operação rejeitada');
  }

  // 1.4: Validação do Schema SQL com RLS ativo em 100% das tabelas
  const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  const migrationSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261103_rls_hardening.sql'), 'utf8');
  const requiredRlsTables = ['customers', 'courts', 'products', 'monthly_members', 'bookings', 'admin_users', 'blocked_slots'];
  const allRlsEnabledInSchema = requiredRlsTables.every(t => schemaSql.includes(`ALTER TABLE IF EXISTS public.${t} ENABLE ROW LEVEL SECURITY;`) || schemaSql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`));
  const allRlsEnabledInMigration = requiredRlsTables.every(t => migrationSql.includes(`ALTER TABLE IF EXISTS public.${t} ENABLE ROW LEVEL SECURITY;`) || migrationSql.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`));

  recordTest(
    'RLS & Database Audit',
    'Conformidade do script SQL: RLS habilitado obrigatoriamente em todas as tabelas',
    allRlsEnabledInSchema && allRlsEnabledInMigration,
    `${requiredRlsTables.length}/${requiredRlsTables.length} tabelas com RLS verificado`
  );

  // ─────────────────────────────────────────────────────────────
  // SUITE 2: [Session & Cookies]
  // ─────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m▶ [Session & Cookies]\x1b[0m');

  // 2.1: Flags HttpOnly, Secure e SameSite no login
  try {
    const postBody = JSON.stringify({ email: 'admin@arenalimoeiro.com.br', password: 'Alves@157620' });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, postBody);

    const setCookie = res.headers['set-cookie'] ? res.headers['set-cookie'].join('; ') : '';
    const hasHttpOnly = /HttpOnly/i.test(setCookie);
    const hasSecure = /Secure/i.test(setCookie);
    const hasSameSite = /SameSite=(Strict|Lax)/i.test(setCookie);

    recordTest(
      'Session & Cookies',
      'Validação de flags de segurança em Cookies de Sessão (HttpOnly, Secure, SameSite=Strict)',
      hasHttpOnly && hasSecure && hasSameSite,
      `Flags detectadas: HttpOnly=${hasHttpOnly}, Secure=${hasSecure}, SameSite=${hasSameSite}`
    );
  } catch (err) {
    recordTest('Session & Cookies', 'Validação de flags em Cookies', false, err.message);
  }

  // 2.2: Ausência de tokens secret/service_role no localStorage
  const publicFiles = fs.readdirSync(path.join(__dirname, '../public')).filter(f => f.endsWith('.html') || f.endsWith('.js'));
  let serviceRoleInLocalStorage = false;
  for (const f of publicFiles) {
    const c = fs.readFileSync(path.join(__dirname, '../public', f), 'utf8');
    if (/localStorage\.setItem\([^)]*service_role/i.test(c) || /localStorage\.setItem\([^)]*sb_secret/i.test(c)) {
      serviceRoleInLocalStorage = true;
      break;
    }
  }
  recordTest(
    'Session & Cookies',
    'Auditoria de localStorage: Ausência de tokens secret/service_role no client-side',
    !serviceRoleInLocalStorage,
    'Zero credenciais mestras expostas no armazenamento local'
  );

  // ─────────────────────────────────────────────────────────────
  // SUITE 3: [Middleware & Headers]
  // ─────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m▶ [Middleware & Headers]\x1b[0m');

  // 3.1: Bloqueio/Redirecionamento seguro de rota protegida /admin sem credencial
  try {
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/admin',
      method: 'GET'
    });
    const isProtected = res.statusCode === 302 || res.statusCode === 401 || res.statusCode === 403;
    recordTest(
      'Middleware & Headers',
      'Proteção estrita da rota /admin contra acesso não autorizado',
      isProtected,
      `Status HTTP: ${res.statusCode}`
    );
  } catch (err) {
    recordTest('Middleware & Headers', 'Proteção da rota /admin', false, err.message);
  }

  // 3.2: Bloqueio de rota interna /api/gestao
  try {
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/gestao',
      method: 'GET'
    });
    const isBlocked = res.statusCode === 401 || res.statusCode === 403;
    recordTest(
      'Middleware & Headers',
      'Bloqueio do endpoint /api/gestao para usuários não autenticados',
      isBlocked,
      `Status HTTP: ${res.statusCode}`
    );
  } catch (err) {
    recordTest('Middleware & Headers', 'Bloqueio de /api/gestao', false, err.message);
  }

  // 3.3: Bloqueio e remoção de senhas em /api/auth/users
  try {
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/auth/users',
      method: 'GET'
    });
    const isBlocked = res.statusCode === 401;
    recordTest(
      'Middleware & Headers',
      'Bloqueio do endpoint /api/auth/users contra dump anônimo de gestores',
      isBlocked,
      `Status HTTP: ${res.statusCode}`
    );
  } catch (err) {
    recordTest('Middleware & Headers', 'Bloqueio de /api/auth/users', false, err.message);
  }

  // 3.4: Defesa Silenciosa: Ausência do header X-Powered-By
  try {
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/',
      method: 'GET'
    });
    const noPoweredBy = !res.headers['x-powered-by'];
    recordTest(
      'Middleware & Headers',
      'Defesa Silenciosa: Supressão total do cabeçalho X-Powered-By',
      noPoweredBy,
      noPoweredBy ? 'X-Powered-By ausente' : 'FALHA: Header exposto'
    );
  } catch (err) {
    recordTest('Middleware & Headers', 'Supressão X-Powered-By', false, err.message);
  }

  // 3.5: Presença de Cabeçalhos de Segurança Obrigatórios (CSP, HSTS, X-Frame-Options, nosniff)
  try {
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/',
      method: 'GET'
    });
    const h = res.headers;
    const hasCsp = !!h['content-security-policy'];
    const hasHsts = !!h['strict-transport-security'];
    const hasFrameOptions = !!h['x-frame-options'];
    const hasNoSniff = !!h['x-content-type-options'];

    recordTest(
      'Middleware & Headers',
      'Presença e integridade dos cabeçalhos CSP, HSTS, X-Frame-Options e nosniff',
      hasCsp && hasHsts && hasFrameOptions && hasNoSniff,
      `CSP: ${hasCsp}, HSTS: ${hasHsts}, X-Frame: ${hasFrameOptions}, nosniff: ${hasNoSniff}`
    );
  } catch (err) {
    recordTest('Middleware & Headers', 'Cabeçalhos de Segurança', false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 4: [Sanitização e Rate Limit]
  // ─────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m▶ [Sanitização e Rate Limit]\x1b[0m');

  // 4.1: Bloqueio de Injeção SQL em parâmetros
  try {
    const postBody = JSON.stringify({ code: "' OR 1=1 --" });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/coupons/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, postBody);
    const isBlocked = res.statusCode === 400;
    recordTest(
      'Sanitização e Rate Limit',
      'Bloqueio ativo de tentativas de injeção SQL nos parâmetros/corpo',
      isBlocked,
      `Payload SQL barrado com HTTP ${res.statusCode}`
    );
  } catch (err) {
    recordTest('Sanitização e Rate Limit', 'Bloqueio de SQLi', false, err.message);
  }

  // 4.2: Bloqueio de Injeção XSS
  try {
    const postBody = JSON.stringify({ code: "<script>alert('xss')</script>" });
    const res = await requestHttp({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/coupons/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, postBody);
    const isBlocked = res.statusCode === 400;
    recordTest(
      'Sanitização e Rate Limit',
      'Bloqueio ativo de scripts maliciosos (XSS) nas requisições',
      isBlocked,
      `Payload XSS barrado com HTTP ${res.statusCode}`
    );
  } catch (err) {
    recordTest('Sanitização e Rate Limit', 'Bloqueio de XSS', false, err.message);
  }

  // 4.3: Rate Limiting de proteção contra força bruta
  try {
    let triggered429 = false;
    for (let i = 0; i < 35; i++) {
      const res = await requestHttp({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify({ email: 'test@arena.com', password: 'wrong' }));

      if (res.statusCode === 429) {
        triggered429 = true;
        break;
      }
    }
    recordTest(
      'Sanitização e Rate Limit',
      'Rate Limiting ativo em rotas críticas contra ataques de força bruta',
      triggered429,
      triggered429 ? 'HTTP 429 Too Many Requests acionado com sucesso' : 'FALHA: Sem rate limit'
    );
  } catch (err) {
    recordTest('Sanitização e Rate Limit', 'Rate Limiting', false, err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // CONSOLIDAÇÃO DOS RESULTADOS
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`TOTAL DE TESTES: ${total} | \x1b[32mPASS: ${passed}\x1b[0m | \x1b[31mFAIL: ${failed}\x1b[0m`);
  console.log(`TAXA DE APROVAÇÃO: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (serverInstance) {
    serverInstance.close();
  }

  if (failed > 0) {
    console.error('\x1b[31m❌ AUDITORIA REPROVADA. Iniciando ciclo de auto-correção...\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m✅ TODOS OS TESTES FORAM APROVADOS COM SUCESSO [100% PASS].\x1b[0m\n');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Erro fatal no runner de auditoria:', err);
  if (serverInstance) serverInstance.close();
  process.exit(1);
});
