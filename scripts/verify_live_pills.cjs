const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Has movementFilterPills:', data.includes('movementFilterPills'));
    console.log('Has pillFilterFinished:', data.includes('pillFilterFinished'));
    console.log('Has setMovementQuickFilter:', data.includes('setMovementQuickFilter'));
  });
}).on('error', err => {
  console.error('Error fetching live:', err.message);
});
