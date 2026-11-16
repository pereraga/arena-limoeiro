const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/vercel.json';
let v = JSON.parse(fs.readFileSync(path, 'utf8'));

// Substituir as rotas com query params antigos por query params atualizados ou limpos
const timestamp = Date.now();
v.rewrites = v.rewrites.map(r => {
  if (r.source === '/adm-sec-x9k7-limoeiro-2026-auth') {
    return {
      source: '/adm-sec-x9k7-limoeiro-2026-auth',
      destination: `/index-sistema1.html?adm_token=x9k7_limoeiro_sec2026_auth&v=${timestamp}`
    };
  }
  if (r.source === '/adm-sec-x9k7-limoeiro-2026') {
    return {
      source: '/adm-sec-x9k7-limoeiro-2026',
      destination: `/index-sistema1.html?adm_token=x9k7_limoeiro_sec2026_auth&v=${timestamp}`
    };
  }
  if (r.source === '/admin') {
    return {
      source: '/admin',
      destination: `/index-sistema1.html?v=${timestamp}`
    };
  }
  return r;
});

// Adicionar rewrite para raiz / e /gestao se o usuário acessar
if (!v.rewrites.some(r => r.source === '/')) {
  v.rewrites.unshift({
    source: '/',
    destination: `/index-sistema1.html?v=${timestamp}`
  });
}

fs.writeFileSync(path, JSON.stringify(v, null, 2), 'utf8');
console.log('Updated vercel.json rewrites with fresh cache-busting timestamp!');
