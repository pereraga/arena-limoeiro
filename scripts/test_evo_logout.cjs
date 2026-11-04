const EVOLUTION_API_URL = 'https://evolution-api-latest-4n78.onrender.com';
const EVOLUTION_API_KEY = 'ArenaLimoeiro2026Sec';
const EVOLUTION_INSTANCE = 'arena-limoeiro';

async function testLogoutOptions() {
  console.log('Checking logout endpoints...');
  // Evolution API v2 logout endpoint is DELETE /instance/logout/{instance}
  const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${EVOLUTION_INSTANCE}`, {
    method: 'DELETE',
    headers: { 'apikey': EVOLUTION_API_KEY }
  });
  console.log('Logout status:', res.status);
  const data = await res.json().catch(e => res.statusText);
  console.log('Logout response:', data);

  // Now check connect again to see if QR Code is returned!
  setTimeout(async () => {
    const resConn = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('Connect status after logout:', resConn.status);
    const dataConn = await resConn.json().catch(e => resConn.statusText);
    console.log('Connect keys after logout:', Object.keys(dataConn));
    if (dataConn.base64) console.log('Has base64 QR code! Length:', dataConn.base64.length);
    if (dataConn.code) console.log('Has raw code QR code:', dataConn.code.slice(0, 30));
  }, 2000);
}

testLogoutOptions();
