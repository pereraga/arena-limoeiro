const https = require('https');

const endpoints = [
  'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth',
  'https://arenalimoeiro.vercel.app/admin.html',
  'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026',
  'https://arenalimoeiro.vercel.app/sistema1.html',
  'https://arenalimoeiro.vercel.app/index-sistema1.html'
];

endpoints.forEach(url => {
  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`URL: ${url}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Has movementCourtPillsContainer? ${body.includes('movementCourtPillsContainer')}`);
      console.log(`  Has selectMovementCourtPill? ${body.includes('selectMovementCourtPill')}`);
      console.log(`  Has movementCourtFilter? ${body.includes('movementCourtFilter')}`);
    });
  }).on('error', e => console.error(url, e.message));
});
