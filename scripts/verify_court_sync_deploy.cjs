const https = require('https');

https.get('https://arenalimoeiro.vercel.app/app.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Contains updated cloud court photos sync:', data.includes('ArenaCloudSync.push(\'update_court\''));
  });
}).on('error', err => console.error(err));
