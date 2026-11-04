async function testVercelQrcode() {
  console.time('vercel-qr');
  try {
    const res = await fetch('https://arenalimoeiro.vercel.app/api/whatsapp/qrcode');
    console.timeEnd('vercel-qr');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data keys:', Object.keys(data));
    console.log('Has base64:', !!data.base64);
    if (data.base64) console.log('base64 length:', data.base64.length);
  } catch (err) {
    console.timeEnd('vercel-qr');
    console.error('Error:', err.message);
  }
}

testVercelQrcode();
