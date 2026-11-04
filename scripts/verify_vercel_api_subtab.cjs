const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body length:', body.length);
    console.log('Contains btnSubtab-api:', body.includes('btnSubtab-api'));
    console.log('Contains subtab-content-api:', body.includes('subtab-content-api'));
    console.log('Contains executeApiPlaygroundRequest:', body.includes('executeApiPlaygroundRequest'));
    console.log('Contains API base URL display:', body.includes('apiBaseUrlDisplay'));
  });
}).on('error', err => {
  console.error('Error fetching Vercel:', err.message);
});
