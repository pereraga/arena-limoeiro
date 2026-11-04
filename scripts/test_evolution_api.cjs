const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function checkEvolution() {
  try {
    console.log('Fetching instance info...');
    const r1 = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('connectionState:', r1.status, await r1.json());

    const r2 = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('fetchInstances:', r2.status, await r2.json());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkEvolution();
