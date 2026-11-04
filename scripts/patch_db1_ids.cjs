const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function patchDb1() {
  const ids = [
    'booking-20261103-ariadnes',
    'booking-20261103-aline',
    'booking-20261103-zeluiz'
  ];
  for (const id of ids) {
    const res = await fetch(`${config.db1Url}/rest/v1/bookings?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: config.db1Key,
        Authorization: `Bearer ${config.db1Key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'finished' })
    });
    console.log(`Patch DB1 ${id}: Status ${res.status}`);
  }
}

patchDb1();
