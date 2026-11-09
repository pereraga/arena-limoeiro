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
      getSystemToday: () => '2026-11-09'
    };

    function getCourtById(id) {
      return { id: id || 'court-society-1', name: 'Campo Society 01', type: 'society' };
    }

    const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
    const eIdx = content.indexOf('function renderMovementMatches() {');
    const funcCode = content.substring(sIdx, eIdx);
    eval(funcCode);

    const matches = getMatchesForDate('2026-11-09');
    console.log(`Total matches on 2026-11-09: ${matches.length}`);
    matches.forEach((m, i) => {
      console.log(`[${i+1}] ID: ${m.id} | Name: ${m.customer_name} | Time: ${m.time} | Court: ${m.court_id} | Status: ${m.status} | isMensalista: ${m.isMensalista}`);
    });
  });
});
