const https = require('https');

const dbs = [
  {
    name: 'DB2 (Aukrcnhuy)',
    url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  },
  {
    name: 'DB1 (Brmclyuk)',
    url: 'https://brmclyukjfijommbxhks.supabase.co',
    key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  }
];

async function queryTable(db, table, filter = '') {
  return new Promise((resolve) => {
    const fullUrl = `${db.url}/rest/v1/${table}?${filter}`;
    const req = https.get(fullUrl, {
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, error: e.message, raw: data });
        }
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
  });
}

async function run() {
  for (const db of dbs) {
    console.log(`\n=== Checking ${db.name} ===`);
    
    // Check monthly_members
    const members = await queryTable(db, 'monthly_members', 'select=*');
    console.log('monthly_members count:', Array.isArray(members.body) ? members.body.length : members);
    if (Array.isArray(members.body)) {
      members.body.forEach(m => {
        console.log(`  Member #${m.id}: resp="${m.responsible_name}" team="${m.team_name}" court_id="${m.court_id}" court_name="${m.court_name}" day="${m.day_of_week}" time="${m.start_time || m.time}" obs="${m.observation}"`);
      });
    }

    // Check bookings for Genilson or 2026-11-10
    const bookings = await queryTable(db, 'bookings', 'select=*&order=date.desc&limit=20');
    console.log('recent bookings count:', Array.isArray(bookings.body) ? bookings.body.length : bookings);
    if (Array.isArray(bookings.body)) {
      bookings.body.forEach(b => {
        if ((b.customer_name && b.customer_name.toLowerCase().includes('genilson')) || b.date === '2026-11-10' || (b.id && String(b.id).includes('monthly'))) {
          console.log(`  Booking #${b.id}: cust="${b.customer_name}" court_id="${b.court_id}" date="${b.date}" time="${b.start_time}-${b.end_time}" type="${b.booking_type}" status="${b.status}"`);
        }
      });
    }

    // Check customers
    const customers = await queryTable(db, 'customers', 'select=*');
    console.log('customers count:', Array.isArray(customers.body) ? customers.body.length : customers);
    if (Array.isArray(customers.body)) {
      customers.body.forEach(c => {
        if (c.name && c.name.toLowerCase().includes('genilson')) {
          console.log(`  Customer #${c.id}: name="${c.name}" phone="${c.phone}" doc="${c.document}"`);
        }
      });
    }
  }
}

run();
