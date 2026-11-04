const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function testPairingCode() {
  console.log('Testing pairingCode and live connect...');
  try {
    // 1. Check connect response
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const data = await res.json();
    console.log('Connect data:', {
      pairingCode: data.pairingCode,
      codePreview: data.code ? data.code.slice(0, 30) : null,
      hasBase64: !!data.base64,
      count: data.count
    });

    // 2. Check how pairing code is requested in Evolution API v2:
    // In Evolution API, calling connect with ?number=5581XXXXXXXX returns a pairingCode!
    const resPair = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}?number=5581999581034`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('Pair with number status:', resPair.status);
    const dataPair = await resPair.json();
    console.log('Pair response:', dataPair);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testPairingCode();
