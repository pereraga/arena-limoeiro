const fs = require('fs');
const path = require('path');
const https = require('https');

const dbs = [
  { name: 'DB2', url: 'https://aukrcnhuyultkjqsgvea.supabase.co', key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi' },
  { name: 'DB1', url: 'https://brmclyukjfijommbxhks.supabase.co', key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7' }
];

async function fetchAll(db, table) {
  return new Promise(resolve => {
    https.get(`${db.url}/rest/v1/${table}?select=*`, {
      headers: { apikey: db.key, Authorization: `Bearer ${db.key}` }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

(async () => {
  for (const table of ['monthly_members', 'customers', 'courts']) {
    const r1 = await fetchAll(dbs[1], table);
    const r2 = await fetchAll(dbs[0], table);
    console.log(`Table ${table}: DB1 count=${r1.length}, DB2 count=${r2.length}`);
  }
})();
