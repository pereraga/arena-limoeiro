const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. UPDATE selectMovementDay TO INCLUDE updateMovementCalendarStrip AND smooth scrolling
const oldSelectDay = `  window.selectMovementDay = function(dateStr, btnEl) {
    window.adminGameState.selectedDate = dateStr;
    
    // Atualiza classes visuais nos botões da régua de 21 dias
    const strip = document.getElementById('movementDaysStrip');
    if (strip) {
      strip.querySelectorAll('.min-w-\\[70px\\], .min-w-\\[75px\\]').forEach(el => {
        el.className = 'min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer';
        const spanSub = el.querySelector('span:first-child');
        if (spanSub) spanSub.className = 'text-[10px] uppercase font-bold text-slate-400 block';
        const spanNum = el.querySelector('span:nth-child(2)');
        if (spanNum) spanNum.className = 'text-base font-black text-slate-800 block';
        const spanMes = el.querySelector('span:nth-child(3)');
        if (spanMes) spanMes.className = 'text-[9px] text-slate-400 block';
      });

      if (btnEl) {
        btnEl.className = 'min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer';
        const spanSub = btnEl.querySelector('span:first-child');
        if (spanSub) spanSub.className = 'text-[10px] uppercase font-bold text-emerald-200 block';
        const spanNum = btnEl.querySelector('span:nth-child(2)');
        if (spanNum) spanNum.className = 'text-lg font-black text-white block';
        const spanMes = btnEl.querySelector('span:nth-child(3)');
        if (spanMes) spanMes.className = 'text-[9px] text-emerald-200 block';
      }
    }

    renderMovementMatches();
  };`;

const newSelectDay = `  // =========================================================================
  // ATUALIZAÇÃO DINÂMICA DA RÉGUA DE CALENDÁRIO COM CONTAGEM REAL DE JOGOS
  // =========================================================================
  window.updateMovementCalendarStrip = function() {
    const strip = document.getElementById('movementDaysStrip');
    if (!strip) return;
    const dayCards = strip.querySelectorAll('.min-w-\\[70px\\], .min-w-\\[75px\\]');
    dayCards.forEach(card => {
      const dateStr = card.getAttribute('data-date');
      if (!dateStr) return;
      const dayMatches = (typeof window.getMatchesForDate === 'function') ? window.getMatchesForDate(dateStr) : [];
      const count = dayMatches.length;
      const badgeText = count === 0 ? 'Sem jogos' : (count === 1 ? '1 jogo' : count + ' jogos');
      
      const spans = card.querySelectorAll('span');
      if (spans.length >= 4) {
        const badgeSpan = spans[spans.length - 1];
        badgeSpan.textContent = badgeText;
        const isSelected = (dateStr === (window.adminGameState ? window.adminGameState.selectedDate : '2026-11-03'));
        if (isSelected) {
          badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block';
        } else {
          if (count > 0) {
            badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block';
          } else {
            badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black inline-block';
          }
        }
      }
    });
  };

  // NAVEGAÇÃO FLUIDA DE DIAS NO CALENDÁRIO (< MÊS, <, >, MÊS >)
  window.navigateMovementDay = function(delta) {
    const datesList = [
      '2026-10-29', '2026-10-30', '2026-10-31',
      '2026-11-01', '2026-11-02', '2026-11-03',
      '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
      '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
      '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
      '2026-11-16', '2026-11-17', '2026-11-18'
    ];
    const current = window.adminGameState.selectedDate || '2026-11-03';
    let idx = datesList.indexOf(current);
    if (idx === -1) idx = 5;
    let newIdx = idx + delta;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= datesList.length) newIdx = datesList.length - 1;
    const targetDate = datesList[newIdx];
    window.selectMovementDay(targetDate);
  };

  window.selectMovementDay = function(dateStr, btnEl) {
    window.adminGameState.selectedDate = dateStr;
    
    // Atualiza classes visuais nos botões da régua de 21 dias
    const strip = document.getElementById('movementDaysStrip');
    if (strip) {
      if (!btnEl) {
        btnEl = strip.querySelector('[data-date="' + dateStr + '"]');
      }
      strip.querySelectorAll('.min-w-\\[70px\\], .min-w-\\[75px\\]').forEach(el => {
        el.className = 'min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer';
        const spanSub = el.querySelector('span:first-child');
        if (spanSub) spanSub.className = 'text-[10px] uppercase font-bold text-slate-400 block';
        const spanNum = el.querySelector('span:nth-child(2)');
        if (spanNum) spanNum.className = 'text-base font-black text-slate-800 block';
        const spanMes = el.querySelector('span:nth-child(3)');
        if (spanMes) spanMes.className = 'text-[9px] text-slate-400 block';
      });

      if (btnEl) {
        btnEl.className = 'min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer';
        const spanSub = btnEl.querySelector('span:first-child');
        if (spanSub) spanSub.className = 'text-[10px] uppercase font-bold text-emerald-200 block';
        const spanNum = btnEl.querySelector('span:nth-child(2)');
        if (spanNum) spanNum.className = 'text-lg font-black text-white block';
        const spanMes = btnEl.querySelector('span:nth-child(3)');
        if (spanMes) spanMes.className = 'text-[9px] text-emerald-200 block';
        if (typeof btnEl.scrollIntoView === 'function') {
          btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }

    // Atualiza mostrador de data no topo do calendário
    const calDisplay = document.getElementById('calendarHeaderDateDisplay');
    if (calDisplay && dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const span = calDisplay.querySelector('span');
        if (span) span.textContent = parts[2] + ' / ' + parts[1] + ' / ' + parts[0];
      }
    }

    renderMovementMatches();
    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
  };`;

if (content.includes(oldSelectDay)) {
  content = content.replace(oldSelectDay, newSelectDay);
  console.log('✓ Injected updateMovementCalendarStrip and navigateMovementDay into selectMovementDay');
} else {
  console.warn('! Could not find oldSelectDay');
}

// 2. ENHANCE persistCourtState AND ADD pullCourtsFromCloud
const oldPersistCourt = `function persistCourtState() {
  try {
    localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
  } catch(e) {}
  renderCourtsMonitor();
}`;

const newPersistCourt = `window.pullCourtsFromCloud = async function() {
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
};

function persistCourtState() {
  try {
    localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
  } catch(e) {}
  renderCourtsMonitor();

  // Dual-Write em tempo real para os 2 Bancos de Dados na Nuvem (DB1 e DB2)
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
  }
}`;

if (content.includes(oldPersistCourt)) {
  content = content.replace(oldPersistCourt, newPersistCourt);
  console.log('✓ Connected Quadras to Supabase Cloud (pullCourtsFromCloud & persistCourtState Dual-Write)');
} else {
  console.warn('! Could not find oldPersistCourt');
}

// 3. ENHANCE BACKUP EXPORT
const oldBackupButton = `onclick="mostrarToast('Backup exportado com sucesso!')"`;
const newBackupButton = `onclick="window.downloadCompleteBackup()"`;
if (content.includes(oldBackupButton)) {
  content = content.replace(oldBackupButton, newBackupButton);
  console.log('✓ Connected Backup button to window.downloadCompleteBackup()');
}

// Add downloadCompleteBackup definition
const backupFnCode = `  // =========================================================================
  // BACKUP & EXPORTAÇÃO REAL DE DADOS EM FORMATO JSON SEGURO
  // =========================================================================
  window.downloadCompleteBackup = function() {
    try {
      const backupData = {
        version: '2.0-cloud',
        exported_at: new Date().toISOString(),
        arena: 'Arena Limoeiro - Complexo Poliesportivo e Lazer',
        bookings: window.adminGameState ? window.adminGameState.bookings : [],
        monthly_members: window.adminGameState ? window.adminGameState.monthlyMembers : [],
        courts: (typeof courtState !== 'undefined' && courtState) ? courtState.courts : [],
        system_status: 'operational_verified'
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arena-limoeiro-backup-' + (window.getSystemToday ? window.getSystemToday() : '2026-11-04') + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (typeof showAdminToast === 'function') {
        showAdminToast('Backup JSON completo baixado com sucesso!');
      } else if (typeof mostrarToast === 'function') {
        mostrarToast('Backup JSON completo baixado com sucesso!');
      }
    } catch(e) {
      alert('Erro ao exportar backup: ' + e.message);
    }
  };`;

if (!content.includes('window.downloadCompleteBackup = function')) {
  content = content.replace('function initAdminGames() {', backupFnCode + '\n\n  function initAdminGames() {');
  console.log('✓ Injected window.downloadCompleteBackup()');
}

// 4. REAL-TIME SUBSCRIPTIONS & 7-SECOND BACKGROUND SYNC LOOP IN initAdminGames
const oldInterval = `  // Atualização periódica em tempo real para os cronômetros do dia atual e virada de dia
  if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {
      const panel = document.getElementById('panel-movement');
      if (panel && !panel.classList.contains('hidden') && panel.style.display !== 'none') {
        if (typeof window.renderMovementMatches === 'function') {
          window.renderMovementMatches();
        }
      }
    }, 30000);
  }`;

const newInterval = `  // =========================================================================
  // ATUALIZAÇÃO AUTOMÁTICA EM TEMPO REAL: SUPABASE REALTIME & RESILIENT POLLING
  // =========================================================================
  function setupArenaRealtimeSync() {
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.ARENA_CLOUD_DBS) {
      try {
        const rtClient = window.supabase.createClient(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key);
        const channel = rtClient.channel('arena_live_system_sync');
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
            console.log('[Realtime] Alteração detectada em bookings:', payload);
            if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, (payload) => {
            console.log('[Realtime] Alteração detectada em monthly_members:', payload);
            if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, (payload) => {
            console.log('[Realtime] Alteração detectada em courts:', payload);
            if (typeof window.pullCourtsFromCloud === 'function') window.pullCourtsFromCloud();
          })
          .subscribe((status) => {
            console.log('[Realtime] Status da conexão Supabase:', status);
          });
        window.__arenaRealtimeChannel = channel;
      } catch(e) {
        console.warn('[Realtime] Aviso ao iniciar websocket realtime:', e);
      }
    }
  }

  // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling)
  if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }
      if (typeof window.updateMovementCalendarStrip === 'function') {
        window.updateMovementCalendarStrip();
      }
    }, 7000);
  }`;

if (content.includes(oldInterval)) {
  content = content.replace(oldInterval, newInterval);
  console.log('✓ Injected Supabase Realtime and 7s active sync loop');
} else {
  console.warn('! Could not find oldInterval');
}

// In initAdminGames, call setupArenaRealtimeSync and pullCourtsFromCloud
const oldInitEnd = `    // Sincroniza em segundo plano com os 2 Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }
  }`;

const newInitEnd = `    // Inicia subscrição Realtime instantânea
    setupArenaRealtimeSync();

    // Sincroniza em segundo plano com os 2 Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }
    if (typeof window.pullCourtsFromCloud === 'function') {
      window.pullCourtsFromCloud();
    }
    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
  }`;

if (content.includes(oldInitEnd)) {
  content = content.replace(oldInitEnd, newInitEnd);
  console.log('✓ Added setupArenaRealtimeSync, pullCourtsFromCloud and updateMovementCalendarStrip to initAdminGames');
} else {
  console.warn('! Could not find oldInitEnd');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Admin html written (Part 2 complete)');
