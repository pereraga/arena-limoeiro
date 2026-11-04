const fs = require('fs');
const https = require('https');

function fetchDB2(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'aukrcnhuyultkjqsgvea.supabase.co',
      path: endpoint,
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
        'Authorization': 'Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function inspectAll() {
  const bookings = await fetchDB2('/rest/v1/bookings?select=*&order=date.asc');
  const members = await fetchDB2('/rest/v1/monthly_members?select=*');

  console.log('Total bookings in DB2:', bookings.length);
  console.log('Total monthly members in DB2:', members.length);

  const nov3 = bookings.filter(b => b.date === '2026-11-03');
  console.log('\n--- Bookings for 2026-11-03 (' + nov3.length + ') ---');
  nov3.forEach(b => {
    console.log(`id: ${b.id} | name: ${b.customer_name} | time: ${b.start_time} | status: ${b.status} | court: ${b.court_id} | price: ${b.total_price}`);
  });

  const tuesMembers = members.filter(m => {
    const day = (m.day_of_week || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return day === 'terca' || day === 'ter';
  });
  console.log('\n--- Tuesday Monthly Members (' + tuesMembers.length + ') ---');
  tuesMembers.forEach(m => {
    console.log(`id: ${m.id} | team: ${m.team_name || m.responsible_name} | time: ${m.start_time} | court: ${m.court_id} | price: ${m.monthly_price}`);
  });
}

inspectAll();
