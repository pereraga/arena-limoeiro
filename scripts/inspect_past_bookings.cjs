const https = require('https');

const DB2_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const DB2_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a3Jjbmh1eXVsdGtqcXNndmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5MjY3NywiZXhwIjoyMDc5NDY4Njc3fQ.b1Q9A1_sWJ4vJgT_hYy6xT1iS1k67a2167vWb7cstg4';

const DB1_URL = 'https://brmclyukjfijommbxhks.supabase.co';
const DB1_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybWNseXVramZpam9tbWJ4aGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzg5MDM3NCwiZXhwIjoyMDQ5NDY2Mzc0fQ.z046_WJ2jXj3jQe7b_5sXbXqM0oX1qW_6zX9vW_3ksc';

function fetchQuery(url, key, path) {
  return new Promise((resolve) => {
    const u = new URL(path, url);
    const options = {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    };
    https.get(u, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ error: e.message, raw: data });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function run() {
  console.log('Querying DB2 bookings <= 2026-11-03...');
  const db2Bookings = await fetchQuery(DB2_URL, DB2_KEY, '/rest/v1/bookings?date=lte.2026-11-03&select=id,customer_name,date,start_time,status');
  console.log('DB2 count <= 2026-11-03:', Array.isArray(db2Bookings) ? db2Bookings.length : db2Bookings);
  if (Array.isArray(db2Bookings)) {
    const statuses = {};
    db2Bookings.forEach(b => { statuses[b.status] = (statuses[b.status] || 0) + 1; });
    console.log('DB2 statuses <= 2026-11-03:', statuses);
  }

  console.log('Querying DB1 bookings <= 2026-11-03...');
  const db1Bookings = await fetchQuery(DB1_URL, DB1_KEY, '/rest/v1/bookings?date=lte.2026-11-03&select=id,customer_name,date,start_time,status');
  console.log('DB1 count <= 2026-11-03:', Array.isArray(db1Bookings) ? db1Bookings.length : db1Bookings);
  if (Array.isArray(db1Bookings)) {
    const statuses = {};
    db1Bookings.forEach(b => { statuses[b.status] = (statuses[b.status] || 0) + 1; });
    console.log('DB1 statuses <= 2026-11-03:', statuses);
  }
}

run();
