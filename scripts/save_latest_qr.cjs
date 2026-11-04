const fs = require('fs');
const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function fetchAndSaveQr() {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const data = await res.json();
    console.log('Got data! Has base64:', !!data.base64, 'Has code:', !!data.code);
    if (data.base64) {
      fs.writeFileSync('scripts/last_valid_qr.json', JSON.stringify({
        base64: data.base64,
        code: data.code,
        updatedAt: new Date().toISOString()
      }, null, 2));
      console.log('Saved to scripts/last_valid_qr.json');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchAndSaveQr();
