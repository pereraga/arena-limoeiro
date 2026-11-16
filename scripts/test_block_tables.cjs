const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const tables = ['court_blocks', 'court_schedules', 'maintenance_blocks', 'blocks', 'time_slots'];

tables.forEach(table => {
  const url = `${db2Url}/rest/v1/${table}?select=*&limit=1`;
  const req = https.request(url, {
    method: 'GET',
    headers: {
      'apikey': db2Key,
      'Authorization': 'Bearer ' + db2Key
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Table ${table} -> Status:`, res.statusCode);
      if (res.statusCode === 200) {
        console.log(`Table ${table} EXISTS! Body:`, body);
      }
    });
  });
  req.on('error', e => console.error(table, e.message));
  req.end();
});
