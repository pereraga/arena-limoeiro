const ARENA_CLOUD_DBS = {
  db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
  db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
  db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
  db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
  syncEndpoint: 'https://arenalimoeiro.vercel.app/api/sync'
};

async function testCloudUpload() {
  console.log('Testing DB2 (aukrcnhuyultkjqsgvea)...');
  try {
    const r2 = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=id,customer_name,date,status&limit=5', {
      headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
    });
    console.log('DB2 status:', r2.status);
    if (r2.ok) {
      const d2 = await r2.json();
      console.log('DB2 bookings sample:', d2);
    } else {
      console.log('DB2 err:', await r2.text());
    }
  } catch (e) {
    console.error('DB2 fetch error:', e.message);
  }

  console.log('\nTesting DB1 (brmclyukjfijommbxhks)...');
  try {
    const r1 = await fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=id,customer_name,date,status&limit=5', {
      headers: { apikey: ARENA_CLOUD_DBS.db1Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key }
    });
    console.log('DB1 status:', r1.status);
    if (r1.ok) {
      const d1 = await r1.json();
      console.log('DB1 bookings sample:', d1);
    } else {
      console.log('DB1 err:', await r1.text());
    }
  } catch (e) {
    console.error('DB1 fetch error:', e.message);
  }

  console.log('\nTesting /api/sync POST (push)...');
  try {
    const rSync = await fetch(ARENA_CLOUD_DBS.syncEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping', test: true })
    });
    console.log('/api/sync POST status:', rSync.status, await rSync.text());
  } catch (e) {
    console.error('/api/sync POST error:', e.message);
  }
}

testCloudUpload();
