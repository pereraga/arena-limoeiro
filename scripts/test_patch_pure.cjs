const https = require('https');

const dbs = [
  {
    name: 'DB2',
    url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  },
  {
    name: 'DB1',
    url: 'https://brmclyukjfijommbxhks.supabase.co',
    key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  }
];

function testPatchOnlyCourtId(db, courtId) {
  return new Promise((resolve) => {
    const url = new URL(`${db.url}/rest/v1/monthly_members?id=eq.mensal-1793143167053`);
    const payload = JSON.stringify({ court_id: courtId });
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  for (const db of dbs) {
    console.log(`\nTesting patch court_id on ${db.name}:`);
    const res = await testPatchOnlyCourtId(db, 'court-beach-1');
    console.log(res);
  }
}

run();
