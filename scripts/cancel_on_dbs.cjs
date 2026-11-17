const DB1_URL = 'https://brmclyukjfijommbxhks.supabase.co';
const DB1_KEY = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
const DB2_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const DB2_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

async function cancelOnDBs() {
  const ids = ['ARENA-B1689', 'ARENA-1641', 'ARENA-2529', 'ARENA-M2038', 'test-noshow-1794941088778'];
  for (const id of ids) {
    const payload = {
      status: 'cancelled',
      total_price: 0,
      observation: 'TOMBSTONE:::' + JSON.stringify({ deletedId: id, at: Date.now() })
    };

    const r1 = await fetch(DB1_URL + '/rest/v1/bookings?id=eq.' + id, {
      method: 'PATCH',
      headers: { apikey: DB1_KEY, Authorization: 'Bearer ' + DB1_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const r2 = await fetch(DB2_URL + '/rest/v1/bookings?id=eq.' + id, {
      method: 'PATCH',
      headers: { apikey: DB2_KEY, Authorization: 'Bearer ' + DB2_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(id, 'DB1 PATCH status:', r1.status, 'DB2 PATCH status:', r2.status);

    // Also send to /api/sync delete_booking
    try {
      await fetch('https://arenalimoeiro.vercel.app/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_booking', payload: { id: id } })
      });
    } catch(e) {}
  }
}
cancelOnDBs();
