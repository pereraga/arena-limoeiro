const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetPullCourts = `window.pullCourtsFromCloud = async function() {
  try {
    console.log('[ArenaCloud] Sincronizando quadras com o banco de dados em tempo real...');
    const res = await fetch(cloudDbs.db2Url + '/rest/v1/courts?select=*&order=order_index.asc', {
      headers: { apikey: cloudDbs.db2Key, Authorization: 'Bearer ' + cloudDbs.db2Key }
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
            const isRecentlyEdited = existing.__lastEditTs && (Date.now() - existing.__lastEditTs < 20000);
            if (!isRecentlyEdited) {
              existing.name = cc.name || existing.name;
            }
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

const replacementPullCourts = `window.pullCourtsFromCloud = async function() {
  try {
    console.log('[ArenaCloud] Sincronizando quadras com o banco de dados em tempo real...');
    
    // Consulta em paralelo o Supabase DB2 e o endpoint redundante /api/sync
    const pDb2 = fetch(cloudDbs.db2Url + '/rest/v1/courts?select=*&order=order_index.asc', {
      headers: { apikey: cloudDbs.db2Key, Authorization: 'Bearer ' + cloudDbs.db2Key }
    }).then(r => r.ok ? r.json() : null).catch(() => null);

    const pSync = fetch('/api/sync')
      .then(r => r.ok ? r.json() : null).catch(() => null);

    const [cloudCourts, syncRes] = await Promise.all([pDb2, pSync]);
    const syncCourts = syncRes?.data?.courts;
    const syncMap = new Map();
    if (Array.isArray(syncCourts)) {
      syncCourts.forEach(sc => {
        if (sc && sc.id) syncMap.set(sc.id, sc);
        if (sc && sc.dbId) syncMap.set(sc.dbId, sc);
      });
    }

    if (Array.isArray(cloudCourts) && cloudCourts.length > 0) {
      cloudCourts.forEach(cc => {
        // Resolve o ID local canônico
        const localId = DB_TO_COURT_ID[cc.id] || cc.id;
        const existing = courtState.courts.find(c => c.id === localId || c.id === cc.id);
        const syncMatch = syncMap.get(cc.id) || syncMap.get(localId);

        // Prevalência de nome atualizado no Gist/Sync redundante ou Supabase
        const bestName = (syncMatch && syncMatch.name) ? syncMatch.name : (cc.name || '');
        const priceNum = parseFloat(syncMatch?.base_price_per_hour || syncMatch?.price || cc.base_price_per_hour) || 100;
        const promoNum = parseFloat(cc.specs?.discount_price_per_hour) || parseFloat(cc.promo) || Math.round(priceNum * 0.6);
        const pStart = cc.specs?.discount_start_time || '09:00';
        const pEnd = cc.specs?.discount_end_time || '16:00';
        const hOpen = cc.specs?.opening_time || '06:00';
        const hClose = cc.specs?.closing_time || '22:00';
        const cap = cc.specs?.capacity || '10 a 14 jogadores';
        const fl = cc.specs?.surface || cc.specs?.type || 'Grama Sintética';

        if (existing) {
          const isRecentlyEdited = existing.__lastEditTs && (Date.now() - existing.__lastEditTs < 20000);
          if (!isRecentlyEdited) {
            existing.name = bestName || existing.name;
          }
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
            name: bestName || cc.name,
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
            const isRecentlyEdited = existing && existing.__lastEditTs && (Date.now() - existing.__lastEditTs < 20000);
            if (!isRecentlyEdited) {
              admC.name = bestName || cc.name || admC.name;
            }
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
  } catch(e) {
    console.warn('[ArenaCloud] Erro ao sincronizar quadras:', e);
  }
};`;

if (content.includes(targetPullCourts)) {
  content = content.replace(targetPullCourts, replacementPullCourts);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('pullCourtsFromCloud upgraded in admin.html!');
} else {
  console.error('targetPullCourts not found in admin.html!');
}
