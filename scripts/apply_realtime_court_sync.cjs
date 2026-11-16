const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const filePath = repoRoot + '/public/admin.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inserir declaração de cloudDbs no topo do script 11 para que pullCourtsFromCloud nunca falhe com ReferenceError
const script11Marker = `<script>
/* ========================================================================= */
/* MONITOR DE QUADRAS - ARENA LIMOEIRO                                      */
/* ========================================================================= */`;

const script11Replacement = `<script>
/* ========================================================================= */
/* MONITOR DE QUADRAS - ARENA LIMOEIRO                                      */
/* ========================================================================= */
const cloudDbs = window.ARENA_CLOUD_DBS || {
  db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
  db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
  db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
  db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
};`;

if (!content.includes(script11Marker)) {
  console.error('script11Marker not found!');
  process.exit(1);
}
content = content.replace(script11Marker, script11Replacement);
console.log('1. cloudDbs defined at top of script 11 in admin.html');

// 2. Chamar pullCourtsFromCloud() imediatamente no boot de script 11 e adicionar listener para 'courts_updated'
const courtStateInitMarker = `let courtState = loadCourtState();`;
const courtStateInitReplacement = `let courtState = loadCourtState();

// Puxa imediatamente os dados da nuvem no boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (typeof window.pullCourtsFromCloud === 'function') {
      window.pullCourtsFromCloud();
    }
  }, 50);

  // Ouve atualizações de outras abas/dispositivos
  try {
    const bcCourts = new BroadcastChannel('arena_limoeiro_sync');
    bcCourts.addEventListener('message', ev => {
      if (ev && ev.data && ev.data.type === 'courts_updated' && Array.isArray(ev.data.courts)) {
        courtState.courts = ev.data.courts;
        try { localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState)); } catch(e) {}
        if (typeof renderCourtsMonitor === 'function') renderCourtsMonitor();
        if (typeof window.syncDirectBookingCourtOptions === 'function') window.syncDirectBookingCourtOptions();
        if (typeof autoCalculateDirectBookingPrice === 'function') autoCalculateDirectBookingPrice();
        if (typeof renderBalcaoTimeSlots === 'function') renderBalcaoTimeSlots();
      }
    });
  } catch(e) {}
}`;

if (!content.includes(courtStateInitMarker)) {
  console.error('courtStateInitMarker not found!');
  process.exit(1);
}
content = content.replace(courtStateInitMarker, courtStateInitReplacement);
console.log('2. Early pullCourtsFromCloud and BroadcastChannel listener added to script 11');

// 3. Adicionar window.pullCourtsFromCloud() ao loop periódico de polling e ao visibilitychange em script 14
const pollingMarker = `      // 3. Sincronização contínua com os bancos de dados na nuvem (já renderiza partidas ao concluir)
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
    }, 4000);

    // Sincronização instantânea ao reativar a aba
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
    });`;

const pollingReplacement = `      // 3. Sincronização contínua com os bancos de dados na nuvem (partidas e quadras em tempo real)
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
      if (typeof window.pullCourtsFromCloud === 'function') {
        window.pullCourtsFromCloud();
      }
    }, 4000);

    // Sincronização instantânea ao reativar a aba
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (typeof window.pullDataFromCloudDatabases === 'function') {
          window.pullDataFromCloudDatabases();
        }
        if (typeof window.pullCourtsFromCloud === 'function') {
          window.pullCourtsFromCloud();
        }
      }
    });`;

if (!content.includes(pollingMarker)) {
  console.error('pollingMarker not found!');
  process.exit(1);
}
content = content.replace(pollingMarker, pollingReplacement);
console.log('3. Periodic and visibilitychange court pulling added to script 14');

// 4. Também adicionar courts_updated no onmessage do BroadcastChannel em script 14
const bcMarker = `      if (ev && ev.data && ev.data.type === 'new_booking') {
        const b = ev.data.booking;
        if (!window.adminGameState.bookings.some(x => x.id === b.id)) {
          window.adminGameState.bookings.unshift(b);
          renderMovementMatches();
          renderCadastrosBookingsList();
        }
      }`;

const bcReplacement = `      if (ev && ev.data && ev.data.type === 'new_booking') {
        const b = ev.data.booking;
        if (!window.adminGameState.bookings.some(x => x.id === b.id)) {
          window.adminGameState.bookings.unshift(b);
          renderMovementMatches();
          renderCadastrosBookingsList();
        }
      } else if (ev && ev.data && ev.data.type === 'courts_updated') {
        if (typeof window.pullCourtsFromCloud === 'function') {
          window.pullCourtsFromCloud();
        }
      }`;

if (!content.includes(bcMarker)) {
  console.error('bcMarker not found!');
  process.exit(1);
}
content = content.replace(bcMarker, bcReplacement);
console.log('4. courts_updated handler added to BroadcastChannel in script 14');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated admin.html with full real-time court syncing across devices!');
