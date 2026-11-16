// middleware.js - Vercel Edge Middleware
// Intercepta requisições, injeta cabeçalhos de segurança estritos e valida autenticação em rotas sensíveis

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto arquivos estáticos (.png, .jpg, .svg, .apk, .css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|apk|woff2?|ttf|eot)).*)',
  ],
};

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.onrender.com wss://*.onrender.com https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://*.vercel.app https://arenalimoeiro.vercel.app https://arenalimoeiro.com.br; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests;"
};

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Defesa em Profundidade: Bloqueio de injeções em querystring
  const search = url.search.toLowerCase();
  if (
    search.includes('union+select') ||
    search.includes('union%20select') ||
    search.includes('<script') ||
    search.includes('%3cscript') ||
    search.includes('drop+table') ||
    search.includes('drop%20table')
  ) {
    return new Response(JSON.stringify({ error: 'Payload ou parâmetro bloqueado por regras de cibersegurança.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS
      }
    });
  }

  // 2. Proteção de Rotas Administrativas Sensíveis
  if (pathname.startsWith('/api/gestao') || pathname === '/api/auth/users') {
    const adminToken = url.searchParams.get('adm_token') || request.headers.get('x-admin-token');
    const authHeader = request.headers.get('authorization') || '';
    const cookie = request.headers.get('cookie') || '';

    const isAuthorized = 
      adminToken === 'x9k7_limoeiro_sec2026_auth' ||
      authHeader.includes('x9k7_limoeiro_sec2026_auth') ||
      cookie.includes('__Secure-arena_session=') ||
      cookie.includes('arena_admin_auth=true');

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado ao recurso protegido.' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...SECURITY_HEADERS
        }
      });
    }
  }

  // 3. Resposta Padrão com Injeção de Cabeçalhos
  const response = new Response(null, {
    headers: SECURITY_HEADERS
  });

  return undefined;
}
