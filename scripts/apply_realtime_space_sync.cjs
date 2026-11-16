const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Mapeamento de IDs para sincronizar com Supabase
const courtMappingCode = `
  const COURT_TO_DB_ID = {
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
`;

// Inserir os mapeamentos caso ainda não existam no escopo de quadras
if (!content.includes('const COURT_TO_DB_ID =')) {
  const insertPos = content.indexOf('const COURT_STORAGE_KEY =');
  content = content.replace('const COURT_STORAGE_KEY =', courtMappingCode + '\nconst COURT_STORAGE_KEY =');
  console.log('Inserted court ID mappings: SUCCESS');
}

// 2. Substituir pullCourtsFromCloud para atualizar courtState, ADMIN_COURTS e adminGameState.courts
const oldPullCourts = `window.pullCourtsFromCloud = async function() {
  try {
    console.log('[ArenaCloud] Sincronizando quadras com o banco de dados...');
    const res = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/courts?select=*&order=order_index.asc', {
      headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
    });
    if (res.ok) {
      const cloudCourts = await res.json();
      if (Array.isArray(cloudCourts) && cloudCourts.length > 0) {
        cloudCourts.forEach(cc => {
          const existing = courtState.courts.find(c => c.id === cc.id);
          if (existing) {
            existing.name = cc.name || existing.name;
            existing.cat = cc.category || existing.cat;
            existing.rate = cc.base_price_per_hour || existing.rate;
            existing.status = cc.observation || existing.status || 'operacional';
            existing.image = cc.image || existing.image;
          } else {
            courtState.courts.push({
              id: cc.id,
              name: cc.name,
              cat: cc.category || 'poliesportiva',
              rate: cc.base_price_per_hour || 100,
              status: cc.observation || 'operacional',
              image: cc.image || ''
            });
          }
        });
        try {
          localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
        } catch(e) {}
        if (typeof renderCourtsMonitor === 'function') renderCourtsMonitor();
      }
    }
  } catch(e) {
    console.warn('[ArenaCloud] Erro ao sincronizar quadras:', e);
  }
};`;

const newPullCourts = `window.pullCourtsFromCloud = async function() {
  try {
    console.log('[ArenaCloud] Sincronizando quadras com o banco de dados em tempo real...');
    const res = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/courts?select=*&order=order_index.asc', {
      headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
    });
    if (res.ok) {
      const cloudCourts = await res.json();
      if (Array.isArray(cloudCourts) && cloudCourts.length > 0) {
        cloudCourts.forEach(cc => {
          // Resolve o ID local canônico
          const localId = DB_TO_COURT_ID[cc.id] || cc.id;
          const existing = courtState.courts.find(c => c.id === localId || c.id === cc.id);
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
            existing.image = cc.image || existing.image;
          } else {
            courtState.courts.push({
              id: localId,
              name: cc.name,
              type: cc.category_label || cc.category || 'Quadra poliesportiva',
              floor: fl,
              capacity: cap,
              price: priceNum,
              promo: promoNum,
              promoStart: pStart,
              promoEnd: pEnd,
              hours: hOpen + ' às ' + hClose,
              status: 'operacional',
              image: cc.image || ''
            });
          }

          // Atualiza também ADMIN_COURTS e adminGameState.courts
          if (typeof ADMIN_COURTS !== 'undefined' && Array.isArray(ADMIN_COURTS)) {
            const admC = ADMIN_COURTS.find(c => c.id === localId || c.id === cc.id);
            if (admC) {
              admC.name = cc.name || admC.name;
              admC.normal = priceNum;
              admC.price = priceNum;
              admC.promo = promoNum;
            }
          }
        });

        try {
          localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
        } catch(e) {}

        if (typeof renderCourtsMonitor === 'function') renderCourtsMonitor();
        if (typeof window.syncDirectBookingCourtOptions === 'function') window.syncDirectBookingCourtOptions();
        if (typeof autoCalculateDirectBookingPrice === 'function') autoCalculateDirectBookingPrice();
        if (typeof renderBalcaoTimeSlots === 'function') renderBalcaoTimeSlots();
      }
    }
  } catch(e) {
    console.warn('[ArenaCloud] Erro ao sincronizar quadras:', e);
  }
};`;

if (content.includes(oldPullCourts)) {
  content = content.replace(oldPullCourts, newPullCourts);
  console.log('Replaced pullCourtsFromCloud with full real-time sync: SUCCESS');
} else {
  console.error('Error: oldPullCourts not found in admin.html!');
  process.exit(1);
}

// 3. Atualizar persistCourtState para enviar payload completo com IDs do banco para DB1 e DB2
const oldPersistCourts = `  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
  if (window.ARENA_CLOUD_DBS && Array.isArray(courtState.courts)) {
    courtState.courts.forEach(async (c) => {
      try {
        const payload = {
          id: c.id,
          name: c.name,
          category: c.cat || 'poliesportiva',
          base_price_per_hour: parseFloat(c.rate || 100),
          image: c.image || null,
          observation: c.status || 'operacional'
        };
        fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/courts', {
          method: 'POST',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});

        fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/courts', {
          method: 'POST',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch(e) {}
    });
  }`;

const newPersistCourts = `  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
  if (window.ARENA_CLOUD_DBS && Array.isArray(courtState.courts)) {
    courtState.courts.forEach(async (c) => {
      try {
        const dbId = COURT_TO_DB_ID[c.id] || c.id;
        const [openH, closeH] = (c.hours || '06:00 às 22:00').split(' às ');
        const payload = {
          id: dbId,
          name: c.name,
          base_price_per_hour: parseFloat(c.price || c.rate || 100),
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

        // Salva nos dois bancos Supabase para transmissão instantânea Realtime a todos os dispositivos
        fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/courts?id=eq.' + encodeURIComponent(dbId), {
          method: 'PATCH',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});

        fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/courts?id=eq.' + encodeURIComponent(dbId), {
          method: 'PATCH',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch(e) {}
    });
  }`;

if (content.includes(oldPersistCourts)) {
  content = content.replace(oldPersistCourts, newPersistCourts);
  console.log('Replaced persistCourtState cloud persistence: SUCCESS');
} else {
  console.error('Error: oldPersistCourts not found in admin.html!');
  process.exit(1);
}

// 4. Garantir que no boot e no polling de sincronização, pullCourtsFromCloud seja chamado
const oldSyncLoop = `// Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling & virada de dia)`;
const newSyncLoop = `// Sincroniza quadras na nuvem no carregamento inicial
    if (typeof window.pullCourtsFromCloud === 'function') {
      window.pullCourtsFromCloud();
    }

    // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling & virada de dia)`;

if (content.includes(oldSyncLoop) && !content.includes('window.pullCourtsFromCloud();\n    }\n\n    // Loop ativo e resiliente')) {
  content = content.replace(oldSyncLoop, newSyncLoop);
  console.log('Added initial pullCourtsFromCloud call: SUCCESS');
}

// 5. No loop de polling (setInterval de 7s), adicionar pullCourtsFromCloud para garantir sincronia mesmo se o WebSocket oscilar
const oldPollingAction = `if (typeof window.pullDataFromCloudDatabases === 'function') {
          window.pullDataFromCloudDatabases();
        }`;
const newPollingAction = `if (typeof window.pullDataFromCloudDatabases === 'function') {
          window.pullDataFromCloudDatabases();
        }
        if (typeof window.pullCourtsFromCloud === 'function') {
          window.pullCourtsFromCloud();
        }`;

if (content.includes(oldPollingAction)) {
  content = content.replace(oldPollingAction, newPollingAction);
  console.log('Added pullCourtsFromCloud to 7s polling loop: SUCCESS');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating admin.html with real-time multiplatform space synchronization!');
