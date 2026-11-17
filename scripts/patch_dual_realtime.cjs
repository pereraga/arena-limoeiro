const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

const s = html.indexOf('function setupArenaRealtimeSync()');
const e = html.indexOf('// Sincroniza quadras na nuvem no carregamento inicial', s);

if (s !== -1 && e !== -1) {
  const newRealtimeSetup = `function setupArenaRealtimeSync() {
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.ARENA_CLOUD_DBS) {
      const subscribeDb = (dbUrl, dbKey, channelName) => {
        try {
          const client = window.supabase.createClient(dbUrl, dbKey);
          const channel = client.channel(channelName);
          channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
              console.log('[Realtime ' + channelName + '] Alteração em bookings:', payload);
              window.__lastBookingsSig = null;
              if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, (payload) => {
              console.log('[Realtime ' + channelName + '] Alteração em monthly_members:', payload);
              window.__lastMembersSig = null;
              if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, (payload) => {
              console.log('[Realtime ' + channelName + '] Alteração em courts:', payload);
              if (typeof window.pullCourtsFromCloud === 'function') window.pullCourtsFromCloud();
            })
            .subscribe((status) => {
              console.log('[Realtime ' + channelName + '] Status:', status);
            });
          return channel;
        } catch(e) {
          console.warn('[Realtime ' + channelName + '] Aviso:', e);
          return null;
        }
      };

      window.__arenaRealtimeChannel2 = subscribeDb(cloudDbs.db2Url, cloudDbs.db2Key, 'arena_live_db2');
      window.__arenaRealtimeChannel1 = subscribeDb(cloudDbs.db1Url, cloudDbs.db1Key, 'arena_live_db1');
    }
  }

  `;

  html = html.substring(0, s) + newRealtimeSetup + html.substring(e);
  console.log('Successfully updated setupArenaRealtimeSync');
  fs.writeFileSync(adminPath, html, 'utf8');
} else {
  console.log('Could not find setupArenaRealtimeSync bounds');
}
