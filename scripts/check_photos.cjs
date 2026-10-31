// Verifica o tipo da coluna 'image' no DB2 courts
const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

async function main() {
  // Tenta enviar um base64 pequeno de teste para ver se o DB2 aceita
  const tinyBase64 = 'data:image/jpeg;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  console.log('Tamanho do base64 de teste:', tinyBase64.length, 'chars');
  
  // Atualiza um court de teste no DB2
  const testId = 'court-society-1';
  const res = await fetch(`${db2Url}/rest/v1/courts?id=eq.${testId}`, {
    method: 'PATCH',
    headers: {
      'apikey': db2Key,
      'Authorization': `Bearer ${db2Key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ image: tinyBase64 })
  });

  console.log('Status PATCH:', res.status, res.statusText);
  if (!res.ok) {
    const txt = await res.text();
    console.log('Erro:', txt);
  } else {
    console.log('✅ DB2 aceita base64 no campo image!');
    
    // Reverter para unsplash
    await fetch(`${db2Url}/rest/v1/courts?id=eq.${testId}`, {
      method: 'PATCH',
      headers: {
        'apikey': db2Key,
        'Authorization': `Bearer ${db2Key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80' })
    });
    console.log('✅ Revertido para imagem padrão.');
  }
  
  // Verifica a coluna com introspection
  const infoRes = await fetch(`${db2Url}/rest/v1/courts?id=eq.${testId}&select=id,name`, {
    headers: { 'apikey': db2Key, 'Authorization': `Bearer ${db2Key}` }
  });
  const info = await infoRes.json();
  console.log('Registro atual:', JSON.stringify(info));
}

main();
