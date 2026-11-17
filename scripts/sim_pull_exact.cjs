const https = require('https');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function check() {
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';
  const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?select=*&order=date.asc';

  const cloudBookings = await fetch(db2Url, { apikey: db2Key, Authorization: 'Bearer ' + db2Key });

  // Tombstones logic:
  const tombstones = new Set();
  cloudBookings.forEach(b => {
    if (!b) return;
    const isTombstone = String(b.id).startsWith('tombstone-') || (b.observation && b.observation.startsWith('TOMBSTONE:::'));
    if (isTombstone && b.observation && b.observation.startsWith('TOMBSTONE:::')) {
      try {
        const payload = JSON.parse(b.observation.slice(b.observation.startsWith('TOMBSTONE:::member:::') ? 21 : 12));
        if (payload && payload.deletedId) tombstones.add(String(payload.deletedId));
      } catch(e) {}
    }
  });

  const cleanBookings = cloudBookings.filter(b => {
    if (!b) return false;
    if (String(b.id).startsWith('arena-note-') || (b.observation && b.observation.startsWith('NOTE_SYNC:::'))) return false;
    if (String(b.id).startsWith('tombstone-') || (b.observation && b.observation.startsWith('TOMBSTONE:::'))) return false;
    if (tombstones.has(String(b.id))) return false;
    if (b.status === 'cancelled' && (b.observation?.includes('TOMBSTONE') || String(b.customer_name).includes('DELETED_SYNC'))) return false;
    return true;
  });

  console.log('Total clean bookings:', cleanBookings.length);
  const nov17 = cleanBookings.filter(b => b.date === '2026-11-17');
  console.log('Nov 17 clean bookings:', nov17.map(b => ({ id: b.id, name: b.customer_name, status: b.status, court: b.court_id, type: b.booking_type })));
}
check();
