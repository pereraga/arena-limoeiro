const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function testPairingEndpoints() {
  console.log('Testing Evolution API pairing endpoints...');
  // In Evolution API v2:
  // POST or GET /instance/connect/{instance} with { number: "5581984634126" } or query params
  try {
    const r1 = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}?number=5581984634126`, {
      method: 'GET',
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('GET with number:', r1.status, await r1.json());
  } catch(e) {
    console.log('GET err:', e.message);
  }

  try {
    const r2 = await fetch(`${EVOLUTION_API_URL}/instance/pairingCode/${EVOLUTION_INSTANCE}?number=5581984634126`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('pairingCode endpoint:', r2.status, await r2.json().catch(() => r2.statusText));
  } catch(e) {
    console.log('pairingCode err:', e.message);
  }
}

testPairingEndpoints();
