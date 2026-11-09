const https = require('https');

const dbs = [
  { name: 'DB2', url: 'https://aukrcnhuyultkjqsgvea.supabase.co', key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi' },
  { name: 'DB1', url: 'https://brmclyukjfijommbxhks.supabase.co', key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7' }
];

async function testDelete(db, id) {
  return new Promise(resolve => {
    const url = new URL(`${db.url}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`);
    const options = {
      method: 'DELETE',
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`,
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.end();
  });
}

(async () => {
  // Let's test deleting one of the test bookings like 'ARENA-B8917' (the ggg booking)
  for (const db of dbs) {
    console.log(`\nTesting DELETE on ${db.name} for ARENA-B8917...`);
    const res = await testDelete(db, 'ARENA-B8917');
    console.log(`Response: Status=${res.status}, Body=${res.data}`);
  }
})();
