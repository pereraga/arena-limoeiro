const fs = require('fs');
const path = require('path');
const https = require('https');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Pull bookings from DB2
const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const req = https.get(`${db2Url}/rest/v1/bookings?select=*`, {
  headers: {
    apikey: db2Key,
    Authorization: `Bearer ${db2Key}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const bookings = JSON.parse(data);
    console.log(`Fetched ${bookings.length} bookings from DB2.`);

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

    // Extract getMatchesForDate
    const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
    const eIdx = content.indexOf('function renderMovementMatches() {');
    const funcCode = content.substring(sIdx, eIdx);

    try {
      eval(funcCode);
      console.log('Evaluated getMatchesForDate successfully.');
      const matches = getMatchesForDate('2026-11-09');
      console.log(`getMatchesForDate('2026-11-09') returned ${matches.length} matches!`);
      if (matches.length > 0) {
        console.log('First match:', matches[0].id, matches[0].customer_name, matches[0].time, matches[0].status);
      }
    } catch (err) {
      console.error('CRASH inside getMatchesForDate:', err);
    }
  });
});
