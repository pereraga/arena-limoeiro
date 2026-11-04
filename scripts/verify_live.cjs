const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Contains strict date filter:', data.includes('FILTRO ESTRITO DE DATA E HIGIENIZAÇÃO'));
    console.log('Contains Davi sanitization:', data.includes('Davi só joga às segundas'));
    console.log('Contains arenaToast fix:', data.includes("document.getElementById('arenaToastMsg') || document.getElementById('arenaToastText')"));
  });
}).on('error', e => console.error(e));
