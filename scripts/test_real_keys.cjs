const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const match = content.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
if (match) {
  console.log('ARENA_CLOUD_DBS:', match[1]);
  const config = eval('(' + match[1] + ')');
  
  async function testWithRealKeys() {
    const tables = ['bookings', 'courts', 'monthly_members', 'customers', 'sports', 'blocked_slots'];
    console.log('\n--- Testing DB2 (Active) ---');
    for (const t of tables) {
      try {
        const res = await fetch(`${config.db2Url}/rest/v1/${t}?select=*&limit=1`, {
          headers: { apikey: config.db2Key, Authorization: `Bearer ${config.db2Key}` }
        });
        console.log(`DB2 table '${t}': Status ${res.status}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`   Columns in '${t}':`, data[0] ? Object.keys(data[0]) : '(empty)');
        }
      } catch(e) {
        console.log(`DB2 table '${t}' error:`, e.message);
      }
    }

    console.log('\n--- Testing DB1 (Backup) ---');
    for (const t of tables) {
      try {
        const res = await fetch(`${config.db1Url}/rest/v1/${t}?select=*&limit=1`, {
          headers: { apikey: config.db1Key, Authorization: `Bearer ${config.db1Key}` }
        });
        console.log(`DB1 table '${t}': Status ${res.status}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`   Columns in '${t}':`, data[0] ? Object.keys(data[0]) : '(empty)');
        }
      } catch(e) {
        console.log(`DB1 table '${t}' error:`, e.message);
      }
    }
  }

  testWithRealKeys();
} else {
  console.log('ARENA_CLOUD_DBS not found');
}
