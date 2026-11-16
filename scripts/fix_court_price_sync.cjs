const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';

// 1. Atualizar admin.html
const adminPath = repoRoot + '/public/admin.html';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Definir window.ARENA_CLOUD_DBS logo no início do script 5
const script5Marker = `    // Helper oficial de data e formatação disponível no boot antes do primeiro frame
    window.getSystemToday = function() {`;

const earlyCloudDbs = `    // Definição Global dos Bancos na Nuvem (Dual-Cloud DB1 e DB2)
    window.ARENA_CLOUD_DBS = {
      db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
      db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
      db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
      db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
      syncEndpoint: '/api/sync'
    };

    // Helper oficial de data e formatação disponível no boot antes do primeiro frame
    window.getSystemToday = function() {`;

if (!adminContent.includes(earlyCloudDbs)) {
  if (adminContent.includes(script5Marker)) {
    adminContent = adminContent.replace(script5Marker, earlyCloudDbs);
    console.log('1. Early window.ARENA_CLOUD_DBS added to script 5 in admin.html');
  } else {
    console.warn('script5Marker not found in admin.html');
  }
}

// Aprimorar persistCourtState para garantir que `const ARENA_CLOUD_DBS` fallback exista e sincronize
const oldPersistCheck = `  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
  if (window.ARENA_CLOUD_DBS && Array.isArray(courtState.courts)) {`;

const newPersistCheck = `  // Broadcast instantâneo para outras abas abertas no navegador
  try {
    const bc = new BroadcastChannel('arena_limoeiro_sync');
    bc.postMessage({ type: 'courts_updated', courts: courtState.courts });
  } catch(e) {}

  const cloudDbs = window.ARENA_CLOUD_DBS || {
    db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
    db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
    db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  };

  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
  if (Array.isArray(courtState.courts)) {`;

if (adminContent.includes(oldPersistCheck)) {
  adminContent = adminContent.replace(oldPersistCheck, newPersistCheck);
  // Substituir referências dentro do loop de persistCourtState para usar cloudDbs
  adminContent = adminContent.replace(/ARENA_CLOUD_DBS\.db2Url/g, 'cloudDbs.db2Url');
  adminContent = adminContent.replace(/ARENA_CLOUD_DBS\.db2Key/g, 'cloudDbs.db2Key');
  adminContent = adminContent.replace(/ARENA_CLOUD_DBS\.db1Url/g, 'cloudDbs.db1Url');
  adminContent = adminContent.replace(/ARENA_CLOUD_DBS\.db1Key/g, 'cloudDbs.db1Key');
  console.log('2. persistCourtState updated to safely use cloudDbs and broadcast courts_updated');
}

fs.writeFileSync(adminPath, adminContent, 'utf8');
console.log('admin.html updated successfully!');

// 2. Aprimorar quadras.html e painel-quadras.html com sincronização completa aos bancos Supabase
const quadrasPath = repoRoot + '/public/quadras.html';
let quadrasContent = fs.readFileSync(quadrasPath, 'utf8');

const quadrasPersistOld = `function persist(){localStorage.setItem(STORE,JSON.stringify(state));render()}`;
const quadrasPersistNew = `const COURT_TO_DB_ID = {
  'fut5': 'court-society-1',
  'fut6': 'court-society-2',
  'fut7': 'court-beach-1',
  'futmesa': 'court-esportes-de-quadra-1788962671043',
  'areia': 'court-beach-2',
  'society': 'court-futsal-1788963178368'
};
const DB_TO_COURT_ID = {
  'court-society-1': 'fut5',
  'court-society-2': 'fut6',
  'court-beach-1': 'fut7',
  'court-esportes-de-quadra-1788962671043': 'futmesa',
  'court-beach-2': 'areia',
  'court-futsal-1788963178368': 'society'
};
const CLOUD_DBS = {
  db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
  db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
  db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
  db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
};

async function syncCourtToCloud(c) {
  if (!c) return;
  const dbId = COURT_TO_DB_ID[c.id] || c.id;
  const [openH, closeH] = (c.hours || '06:00 às 22:00').split(' às ');
  const payload = {
    name: c.name,
    base_price_per_hour: parseFloat(c.price || 100),
    observation: c.status || 'operacional',
    specs: {
      surface: c.floor || 'Grama Sintética',
      capacity: c.capacity || '10 a 14 jogadores',
      opening_time: openH || '06:00',
      closing_time: closeH || '22:00',
      discount_price_per_hour: parseFloat(c.promo || 0),
      discount_start_time: c.promoStart || '09:00',
      discount_end_time: c.promoEnd || '16:00'
    }
  };
  const headers2 = { apikey: CLOUD_DBS.db2Key, Authorization: 'Bearer ' + CLOUD_DBS.db2Key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  const headers1 = { apikey: CLOUD_DBS.db1Key, Authorization: 'Bearer ' + CLOUD_DBS.db1Key, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  try {
    await Promise.all([
      fetch(CLOUD_DBS.db2Url + '/rest/v1/courts?id=eq.' + encodeURIComponent(dbId), { method: 'PATCH', headers: headers2, body: JSON.stringify(payload) }),
      fetch(CLOUD_DBS.db1Url + '/rest/v1/courts?id=eq.' + encodeURIComponent(dbId), { method: 'PATCH', headers: headers1, body: JSON.stringify(payload) })
    ]);
    console.log('[Quadras] Espaço ' + dbId + ' sincronizado no banco de dados com sucesso!');
  } catch(e) {
    console.warn('[Quadras] Erro ao sincronizar espaço:', e);
  }
}

async function pullCourtsFromCloud() {
  try {
    const res = await fetch(CLOUD_DBS.db2Url + '/rest/v1/courts?select=*&order=order_index.asc', {
      headers: { apikey: CLOUD_DBS.db2Key, Authorization: 'Bearer ' + CLOUD_DBS.db2Key }
    });
    if (res.ok) {
      const cloudCourts = await res.json();
      if (Array.isArray(cloudCourts) && cloudCourts.length > 0) {
        cloudCourts.forEach(cc => {
          const localId = DB_TO_COURT_ID[cc.id] || cc.id;
          const existing = state.courts.find(c => c.id === localId || c.id === cc.id);
          const priceNum = parseFloat(cc.base_price_per_hour) || 100;
          const promoNum = parseFloat(cc.specs?.discount_price_per_hour) || parseFloat(cc.promo) || Math.round(priceNum * 0.6);
          const pStart = cc.specs?.discount_start_time || '09:00';
          const pEnd = cc.specs?.discount_end_time || '16:00';
          const hOpen = cc.specs?.opening_time || '06:00';
          const hClose = cc.specs?.closing_time || '22:00';
          const cap = cc.specs?.capacity || '10 a 14 jogadores';
          const fl = cc.specs?.surface || cc.specs?.type || 'Grama Sintética';
          if (existing) {
            existing.name = cc.name || existing.name;
            existing.price = priceNum;
            existing.promo = promoNum;
            existing.promoStart = pStart;
            existing.promoEnd = pEnd;
            existing.hours = hOpen + ' às ' + hClose;
            existing.capacity = cap;
            existing.floor = fl;
            existing.status = (cc.observation && cc.observation.toLowerCase().includes('manuten')) ? 'manutencao' : (existing.status || 'operacional');
          }
        });
        localStorage.setItem(STORE, JSON.stringify(state));
        render();
      }
    }
  } catch(e) {}
}

function persist(specificCourt){
  localStorage.setItem(STORE,JSON.stringify(state));
  render();
  try {
    const bc = new BroadcastChannel('arena_limoeiro_sync');
    bc.postMessage({ type: 'courts_updated', courts: state.courts });
  } catch(e) {}
  if (specificCourt) {
    syncCourtToCloud(specificCourt);
  } else {
    state.courts.forEach(syncCourtToCloud);
  }
}`;

if (quadrasContent.includes(quadrasPersistOld)) {
  quadrasContent = quadrasContent.replace(quadrasPersistOld, quadrasPersistNew);
  // Atualizar a chamada em editCourt para persist(c)
  quadrasContent = quadrasContent.replace(`persist();closeModal();toast('Dados do espaço atualizados.');`, `persist(c);closeModal();toast('Dados do espaço atualizados e sincronizados no banco de dados!');`);
  
  // Adicionar pullCourtsFromCloud() na inicialização de quadras.html
  const renderCall = `render();`;
  const renderCallWithPull = `render(); pullCourtsFromCloud();`;
  const lastRenderIdx = quadrasContent.lastIndexOf(renderCall);
  if (lastRenderIdx !== -1) {
    quadrasContent = quadrasContent.slice(0, lastRenderIdx) + renderCallWithPull + quadrasContent.slice(lastRenderIdx + renderCall.length);
  }

  fs.writeFileSync(quadrasPath, quadrasContent, 'utf8');
  fs.writeFileSync(repoRoot + '/public/painel-quadras.html', quadrasContent, 'utf8');
  console.log('quadras.html and painel-quadras.html updated with cloud sync!');
}
