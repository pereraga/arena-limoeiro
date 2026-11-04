const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body length:', body.length);
    console.log('Contains renderMovementCalendarStrip:', body.includes('renderMovementCalendarStrip'));
    console.log('Contains selectMovementDay:', body.includes('selectMovementDay'));
    console.log('Contains lastKnownSystemDate:', body.includes('__lastKnownSystemDate'));
    console.log('Contains window.initAdminGames:', body.includes('window.initAdminGames'));
  });
}).on('error', (e) => {
  console.error('Fetch error:', e.message);
});
