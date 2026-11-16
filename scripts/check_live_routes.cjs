const https = require('https');

const paths = [
  '/admin',
  '/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth',
  '/gestao',
  '/'
];

paths.forEach(p => {
  https.get('https://arenalimoeiro.vercel.app' + p, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Path: ${p}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Location header: ${res.headers.location || 'none'}`);
      console.log(`  Has movementCourtPillsContainer? ${body.includes('movementCourtPillsContainer')}`);
      console.log(`  Cache-Control: ${res.headers['cache-control'] || 'none'}`);
    });
  }).on('error', e => console.error(p, e.message));
});
