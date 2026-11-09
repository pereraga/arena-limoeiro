const https = require('https');

const dbs = [
  { name: 'DB1', url: 'https://brmclyukjfijommbxhks.supabase.co', key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7' },
  { name: 'DB2', url: 'https://aukrcnhuyultkjqsgvea.supabase.co', key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi' }
];

async function testEndpoint(db, table) {
  return new Promise((resolve) => {
    const url = `${db.url}/rest/v1/${table}?select=*`;
    const req = https.get(url, {
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, count: Array.isArray(parsed) ? parsed.length : null, data: parsed });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.setTimeout(5000, () => {
      req.abort();
      resolve({ error: 'timeout' });
    });
  });
}

(async () => {
  for (const db of dbs) {
    console.log(`\n--- Testing ${db.name} (${db.url}) ---`);
    for (const table of ['bookings', 'monthly_members', 'customers', 'courts']) {
      const result = await testEndpoint(db, table);
      console.log(`Table [${table}]: Status=${result.status}, Count=${result.count}, Error=${result.error || (result.data && result.data.message)}`);
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log(`  Sample 1st item ID:`, result.data[0].id, result.data[0].name || result.data[0].customer_name);
      }
    }
  }
})();
