const fs = require('fs');
const path = require('path');
const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const db1Url = 'https://brmclyukjfijommbxhks.supabase.co';
const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'

async function checkExcluidos() {
  // Let's check table columns or tables in DB2
  return new Promise(resolve => {
    https.get(`${db2Url}/rest/v1/cancelled_bookings?select=*`, {
      headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` }
    }, res => {
      resolve(res.statusCode);
    }).on('error', () => resolve(500));
  });
}

(async () => {
  const code = await checkExcluidos();
  console.log('cancelled_bookings status:', code);
})();
