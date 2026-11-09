const https = require('https');

https.request('https://arenalimoeiro.vercel.app/apks/ArenaLimoeiro-Controle.apk', { method: 'HEAD' }, (res) => {
  console.log('Status code for ArenaLimoeiro-Controle.apk:', res.statusCode);
  console.log('Content-Length:', res.headers['content-length']);
  console.log('Content-Type:', res.headers['content-type']);
}).on('error', (err) => {
  console.error('Error fetching APK:', err.message);
}).end();
