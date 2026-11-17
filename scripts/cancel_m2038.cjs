const DB1_URL = 'https://brmclyukjfijommbxhks.supabase.co';
const DB1_KEY = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
const DB2_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const DB2_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

async function updateM2038() {
  const body = JSON.stringify({
    status: 'cancelled',
    total_price: 0,
    observation: 'TOMBSTONE:::{"deletedId":"ARENA-M2038"}'
  });
  const r1 = await fetch(DB1_URL + '/rest/v1/bookings?id=eq.ARENA-M2038', {
    method: 'PATCH',
    headers: { apikey: DB1_KEY, Authorization: 'Bearer ' + DB1_KEY, 'Content-Type': 'application/json' },
    body
  });
  console.log('Update M2038 on DB1:', r1.status);

  const r2 = await fetch(DB2_URL + '/rest/v1/bookings?id=eq.ARENA-M2038', {
    method: 'PATCH',
    headers: { apikey: DB2_KEY, Authorization: 'Bearer ' + DB2_KEY, 'Content-Type': 'application/json' },
    body
  });
  console.log('Update M2038 on DB2:', r2.status);
}
updateM2038();
