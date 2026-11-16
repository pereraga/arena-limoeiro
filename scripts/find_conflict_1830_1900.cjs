const https = require('https');

const db = {
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
  const targetMembers = members.filter(m => {
    const sm = m.start_time || m.time || '';
    const em = m.end_time || '';
    return (sm.includes('18:30') || sm.includes('19:00') || em.includes('18:30') || em.includes('19:00') || em.includes('19:30') || em.includes('20:00'));
  });

  console.log('Monthly members around 18:30 / 19:00:');
  targetMembers.forEach(m => {
    console.log(`  Member #${m.id}: resp="${m.responsible_name}" court_id="${m.court_id}" day="${m.day_of_week}" start="${m.start_time || m.time}" end="${m.end_time}"`);
  });

  const bookings = await fetchTable('bookings', 'select=*&order=date.desc&limit=100');
  const targetBookings = bookings.filter(b => {
    const sm = b.start_time || (b.time ? b.time.split(' ')[0] : '');
    const em = b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : '');
    return (sm.includes('18:30') || sm.includes('19:00') || em.includes('18:30') || em.includes('19:00') || em.includes('19:30') || em.includes('20:00'));
  });

  console.log('\nBookings around 18:30 / 19:00:');
  targetBookings.forEach(b => {
    console.log(`  Booking #${b.id}: cust="${b.customer_name}" court_id="${b.court_id}" date="${b.date}" start="${b.start_time}" end="${b.end_time}" time="${b.time}" status="${b.status}"`);
  });
}

run();
