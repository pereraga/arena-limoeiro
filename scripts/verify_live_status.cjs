const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Has kpiValueRevenue:', data.includes('id="kpiValueRevenue"'));
    console.log('Has checkIsMatchLive:', data.includes('checkIsMatchLive'));
    console.log('Has viewReceipt:', data.includes('viewReceipt'));
    console.log('Has reopenGame:', data.includes('reopenGame'));
    console.log('Has startGameNow:', data.includes('startGameNow'));
  });
}).on('error', err => {
  console.error('Error fetching live:', err.message);
});
