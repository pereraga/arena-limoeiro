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

function getColumns(table) {
  return new Promise((resolve) => {
    const url = new URL(`${dbs[0].url}/rest/v1/${table}?limit=1`);
    https.get(url, {
      headers: {
        'apikey': dbs[0].key,
        'Authorization': `Bearer ${dbs[0].key}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.length > 0 ? Object.keys(parsed[0]) : []);
        } catch(e) {
          resolve([]);
        }
      });
    });
  });
}

async function check() {
  console.log('monthly_members columns:', await getColumns('monthly_members'));
  console.log('bookings columns:', await getColumns('bookings'));
  console.log('customers columns:', await getColumns('customers'));
}

check();
