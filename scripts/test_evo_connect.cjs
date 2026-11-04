const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function testEvolution() {
  console.log('Testing connect endpoint...');
  const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
    headers: { 'apikey': EVOLUTION_API_KEY }
  });
  console.log('Connect status:', res.status);
  const data = await res.json();
  console.log('Connect data:', JSON.stringify(data));
}

testEvolution();
