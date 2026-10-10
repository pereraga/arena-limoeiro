const url = 'https://brmclyukjfijommbxhks.supabase.co/rest/v1';
const key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';

const updates = [
  {
    id: 'court-society-1',
    name: 'FUT 5 - SOCCER 5',
    base_price_per_hour: 90.00,
    promo_price: 50.00
  },
  {
    id: 'court-society-2',
    name: 'FUT 6 - SOCCER 6',
    base_price_per_hour: 100.00,
    promo_price: 60.00
  },
  {
    id: 'court-beach-1',
    name: 'FUT 7 - SOCCER 7',
    base_price_per_hour: 110.00,
    promo_price: 70.00
  },
  {
    id: 'court-futsal-1788963178368',
    name: 'QUADRA SOCIETY',
    base_price_per_hour: 60.00,
    promo_price: 40.00
  },
  {
    id: 'court-beach-2',
    name: 'QUADRA DE AREIA  -  SAND COURT',
    base_price_per_hour: 50.00,
    promo_price: 30.00
  },
  {
    id: 'court-esportes-de-quadra-1788962671043',
    name: 'FOOT TABLE - FUTMESA',
    base_price_per_hour: 35.00,
    promo_price: 25.00
  }
];

async function run() {
  console.log('🔄 Buscando quadras atuais no Supabase...');
  const res = await fetch(url + '/courts?select=*', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  const courts = await res.json();

  for (const item of updates) {
    const existing = courts.find(c => c.id === item.id);
    if (!existing) {
      console.warn(`⚠️ Quadra não encontrada por id ${item.id}`);
      continue;
    }

    const currentSpecs = typeof existing.specs === 'string' ? JSON.parse(existing.specs || '{}') : (existing.specs || {});
    
    // Atualiza especificações com novos horários e preços de promoção
    const newSpecs = {
      ...currentSpecs,
      opening_time: '06:00',
      closing_time: '22:00',
      discount_start_time: '09:00',
      discount_end_time: '16:00',
      discount_price_per_hour: item.promo_price
    };

    const payload = {
      base_price_per_hour: item.base_price_per_hour,
      specs: newSpecs
    };

    console.log(`💾 Atualizando ${item.name} (${item.id}): Normal R$ ${item.base_price_per_hour}/h | Promoção R$ ${item.promo_price}/h | 06:00 às 22:00...`);
    const updateRes = await fetch(`${url}/courts?id=eq.${item.id}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (updateRes.ok) {
      const data = await updateRes.json();
      console.log(`✅ Sucesso para ${item.name}!`);
    } else {
      const errText = await updateRes.text();
      console.error(`❌ Erro ao atualizar ${item.name}:`, errText);
    }
  }

  console.log('\n🎉 Todas as quadras foram atualizadas com sucesso no Supabase!');
}

run().catch(console.error);
