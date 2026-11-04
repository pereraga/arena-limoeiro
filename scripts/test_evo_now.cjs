const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function testNow() {
  console.time('fetch');
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.timeEnd('fetch');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data keys:', Object.keys(data));
    console.log('Has base64:', !!data.base64);
    if (data.base64) console.log('base64 start:', data.base64.slice(0, 50));
    console.log('Has code:', !!data.code);
    if (data.code) console.log('code start:', data.code.slice(0, 50));
    console.log('Instance state:', data?.instance?.state);
  } catch (e) {
    console.timeEnd('fetch');
    console.error('Fetch error:', e.message);
  }
}

testNow();
