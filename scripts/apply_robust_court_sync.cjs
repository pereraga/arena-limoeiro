const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar persistCourtState para aceitar parâmetro opcional targetCourtId (ou salvar a quadra modificada imediatamente com await)
// e sincronizar instantaneamente ADMIN_COURTS e adminGameState.courts
const oldPersistFunc = `function persistCourtState() {
  try {
    localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
  } catch(e) {}
  renderCourtsMonitor();

  // Sincroniza imediatamente com a área de Reserva de Balcão e com ADMIN_COURTS
  if (typeof window.syncDirectBookingCourtOptions === 'function') {
    window.syncDirectBookingCourtOptions();
  }
  if (typeof autoCalculateDirectBookingPrice === 'function') {
    autoCalculateDirectBookingPrice();
  }
  if (typeof renderBalcaoTimeSlots === 'function') {
    renderBalcaoTimeSlots();
  }

  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
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
  }
}`;

const newPersistFunc = `async function persistCourtState(specificCourtId) {
  try {
    localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
  } catch(e) {}

  // Sincroniza em memória ADMIN_COURTS e adminGameState.courts
  if (Array.isArray(courtState.courts)) {
    courtState.courts.forEach(c => {
      const pVal = parseFloat(c.price || 100);
      if (typeof ADMIN_COURTS !== 'undefined' && Array.isArray(ADMIN_COURTS)) {
        const adm = ADMIN_COURTS.find(x => x.id === c.id || (typeof COURT_TO_DB_ID !== 'undefined' && COURT_TO_DB_ID[x.id] === c.id));
        if (adm) {
          adm.name = c.name || adm.name;
          adm.normal = pVal;
          adm.price = pVal;
          adm.promo = parseFloat(c.promo || adm.promo || 0);
        }
      }
      if (window.adminGameState && Array.isArray(window.adminGameState.courts)) {
        const agc = window.adminGameState.courts.find(x => x.id === c.id || (typeof COURT_TO_DB_ID !== 'undefined' && COURT_TO_DB_ID[x.id] === c.id));
        if (agc) {
          agc.name = c.name || agc.name;
          agc.normal = pVal;
          agc.price = pVal;
          agc.promo = parseFloat(c.promo || agc.promo || 0);
        }
      }
    });
  }

  renderCourtsMonitor();

  // Sincroniza imediatamente com a área de Reserva de Balcão e cálculos
  if (typeof window.syncDirectBookingCourtOptions === 'function') {
    window.syncDirectBookingCourtOptions();
  }
  if (typeof autoCalculateDirectBookingPrice === 'function') {
    autoCalculateDirectBookingPrice();
  }
  if (typeof renderBalcaoTimeSlots === 'function') {
    renderBalcaoTimeSlots();
  }
  if (typeof renderMatches === 'function') {
    renderMatches();
  }

  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
  if (window.ARENA_CLOUD_DBS && Array.isArray(courtState.courts)) {
    const listToSync = specificCourtId 
      ? courtState.courts.filter(c => c.id === specificCourtId)
      : courtState.courts;

    for (const c of listToSync) {
      try {
        const dbId = (typeof COURT_TO_DB_ID !== 'undefined' && COURT_TO_DB_ID[c.id]) ? COURT_TO_DB_ID[c.id] : c.id;
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

        // Envia em paralelo com headers corretos e captura retorno
        const p1 = fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/courts?id=eq.' + encodeURIComponent(dbId), {
          method: 'PATCH',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('[ArenaCloud] DB2 patch error:', err));

        const p2 = fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/courts?id=eq.' + encodeURIComponent(dbId), {
          method: 'PATCH',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('[ArenaCloud] DB1 patch error:', err));

        await Promise.all([p1, p2]);
        console.log('[ArenaCloud] Quadra ' + dbId + ' atualizada na nuvem com sucesso!');
      } catch(e) {
        console.warn('[ArenaCloud] Erro no patch de quadra:', e);
      }
    }
  }
}`;

if (!content.includes(oldPersistFunc)) {
  console.error('Error: oldPersistFunc not found!');
  process.exit(1);
}
content = content.replace(oldPersistFunc, newPersistFunc);
console.log('1. Updated persistCourtState with await and instant memory sync: SUCCESS');

// 2. Atualizar editCourtItem para passar f.get('id') para persistCourtState
const oldEditConfirm = `    Object.assign(c, {
      name: f.get('name').toUpperCase(),
      type: f.get('type'),
      capacity: f.get('capacity'),
      floor: f.get('floor'),
      price: +f.get('price'),
      promo: +f.get('promo'),
      promoStart: f.get('promoStart'),
      promoEnd: f.get('promoEnd'),
      hours: f.get('open') + ' às ' + f.get('close'),
      status: f.get('status')
    });
    persistCourtState();
    closeCourtModal();
    if (typeof showAdminToast === 'function') showAdminToast('Dados do espaço atualizados!');`;

const newEditConfirm = `    Object.assign(c, {
      name: f.get('name').toUpperCase(),
      type: f.get('type'),
      capacity: f.get('capacity'),
      floor: f.get('floor'),
      price: +f.get('price'),
      promo: +f.get('promo'),
      promoStart: f.get('promoStart'),
      promoEnd: f.get('promoEnd'),
      hours: f.get('open') + ' às ' + f.get('close'),
      status: f.get('status')
    });
    persistCourtState(c.id);
    closeCourtModal();
    if (typeof showAdminToast === 'function') showAdminToast('Dados do espaço atualizados e transmitidos ao banco de dados!');`;

if (!content.includes(oldEditConfirm)) {
  console.error('Error: oldEditConfirm not found!');
  process.exit(1);
}
content = content.replace(oldEditConfirm, newEditConfirm);
console.log('2. Updated editCourtItem to trigger cloud sync with specific id: SUCCESS');

fs.writeFileSync(path, content, 'utf8');
console.log('All updates saved to admin.html!');
