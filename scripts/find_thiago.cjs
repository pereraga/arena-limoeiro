const https = require('https');

const dbs = [
  {
    name: 'DB1 (brmclyukjfijommbxhks)',
    url: 'https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?select=*&customer_name=ilike.*Thiago*',
    key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  },
  {
    name: 'DB2 (aukrcnhuyultkjqsgvea)',
    url: 'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?select=*&customer_name=ilike.*Thiago*',
    key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  }
];

function fetchDb(db) {
  return new Promise((resolve, reject) => {
    const req = https.get(db.url, {
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ name: db.name, items: JSON.parse(data) });
        } catch(e) {
          resolve({ name: db.name, error: e.message, raw: data });
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const results = await Promise.all(dbs.map(fetchDb));
  results.forEach(r => {
    console.log(`=== ${r.name} ===`);
    if (r.error) console.log('Error:', r.error);
    else console.log(JSON.stringify(r.items, null, 2));
  });
}

run();
