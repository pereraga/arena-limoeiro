const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const ANON_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

function checkEndpoint(table) {
  return new Promise((resolve) => {
    const req = https.get(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=5`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({ table, status: res.statusCode, data: d.slice(0, 200) });
      });
    });
    req.on('error', e => resolve({ table, error: e.message }));
  });
}

async function run() {
  const tables = ['admin_users', 'customers', 'bookings', 'courts', 'products', 'monthly_members'];
  for (const t of tables) {
    const res = await checkEndpoint(t);
    console.log(`${res.table}: status ${res.status} -> ${res.data}`);
  }
}

run();
