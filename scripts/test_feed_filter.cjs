const fs = require('fs');
const path = require('path');
const https = require('https');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Pull bookings from DB2
const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

https.get(`${db2Url}/rest/v1/bookings?select=*`, {
  headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const bookings = JSON.parse(data);

    // Mock environment
    const window = {
      adminGameState: {
        bookings: bookings,
        monthlyMembers: [],
        customers: [],
        selectedDate: '2026-11-09',
        movementFilterCourt: 'all',
        movementFilterStatus: 'all'
      },
      __matchesCacheByDate: new Map(),
      getSystemToday: () => '2026-11-09',
      checkIsMatchLive: () => false
    };

    function getCourtById(id) {
      return { id: id || 'court-society-1', name: 'Campo Society 01', type: 'society' };
    }

    const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
    const eIdx = content.indexOf('function renderMovementMatches() {');
    const funcCode = content.substring(sIdx, eIdx);
    eval(funcCode);

    const allMatches = getMatchesForDate('2026-11-09');
    console.log(`Total getMatchesForDate: ${allMatches.length}`);

    // Now test filters in renderMovementMatches
    let matches = allMatches;
    const statusFilter = 'all'; // Default
    matches = matches.filter(m => m.status !== 'finished');
    console.log(`Filtered matches (status !== finished): ${matches.length}`);
    matches.forEach(m => console.log(`- ${m.id} | ${m.customer_name} | ${m.time} | status: ${m.status}`));
  });
});
