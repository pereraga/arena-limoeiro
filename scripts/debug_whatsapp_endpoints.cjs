const https = require('https');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function run() {
  console.log('Testing /api/whatsapp/status...');
  const statusRes = await testEndpoint('https://arenalimoeiro.vercel.app/api/whatsapp/status');
  console.log('Status result:', statusRes.status, statusRes.data);

  console.log('Testing /api/whatsapp/qrcode...');
  const qrRes = await testEndpoint('https://arenalimoeiro.vercel.app/api/whatsapp/qrcode');
  console.log('QR result:', qrRes.status, qrRes.data);
}

run();
