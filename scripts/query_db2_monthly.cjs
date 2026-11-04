const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const url = `${SUPABASE_URL}/rest/v1/monthly_members?select=*&limit=100`;

const req = https.get(url, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Total monthly members in DB2:', parsed.length);
      const davi = parsed.filter(m => (m.team_name || '').toLowerCase().includes('davi') || (m.responsible_name || '').toLowerCase().includes('davi'));
      console.log('Davi in DB2 monthly_members:', davi);

      const terca = parsed.filter(m => (m.day_of_week || '').toLowerCase().includes('terca'));
      console.log('Terca in DB2 monthly_members:', terca.map(m => ({ id: m.id, name: m.team_name, day: m.day_of_week, court: m.court_id, time: m.start_time || m.time })));
    } catch(e) {
      console.log('Raw data:', data);
    }
  });
});
req.on('error', e => console.error(e));
