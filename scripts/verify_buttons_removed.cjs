const https = require('https');

https.get('https://arenalimoeiro.vercel.app/app.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Contains openDownloadApkModal in header:', data.includes('openDownloadApkModal()'));
    console.log('Contains openSystemInfoModal in header:', data.includes('openSystemInfoModal()'));
  });
}).on('error', err => console.error(err));
