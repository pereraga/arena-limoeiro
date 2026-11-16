const https = require('https');

const db = {
  name: 'DB2',
  url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
  key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
};

function fetchTable(table, query) {
  return new Promise((resolve) => {
    const url = new URL(`${db.url}/rest/v1/${table}?${query}`);
    https.get(url, {
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve([]); }
      });
    });
  });
}

async function run() {
  const members = await fetchTable('monthly_members', 'select=*');
  console.log('Total members in DB2:', members.length);
  members.forEach(m => {
    console.log(`Member #${m.id}: resp="${m.responsible_name}" team="${m.team_name}" court="${m.court_id}" day="${m.day_of_week}" start="${m.start_time || m.time}" end="${m.end_time}" status="${m.status}"`);
  });
}

run();
