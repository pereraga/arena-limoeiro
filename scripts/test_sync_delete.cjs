const https = require('https');

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function testSyncDelete() {
  const payload = {
    action: 'delete_booking',
    payload: {
      id: 'test-noshow-1794941088778',
      date: '2026-11-17'
    }
  };

  const res = await post(
    'https://arenalimoeiro.vercel.app/api/sync',
    { 'Content-Type': 'application/json' },
    payload
  );
  console.log('Result sync delete:', res);
}
testSyncDelete();
