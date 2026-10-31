const fs = require('fs');

// 1. Atualizar public/supabase-client.js para direcionar courts EXCLUSIVAMENTE para o Banco 2
let sc = fs.readFileSync('public/supabase-client.js', 'utf8');

// Modifica createTableProxy para que se tableName === 'courts', SEMPRE use client2 direto
const oldProxyExec = `          if (client1 && !primaryRestricted) {`;
const newProxyExec = `          // Para courts: exclusividade total no Banco 2 (sem tocar no Banco 1)
          if (tableName === 'courts' && client2) {
            try {
              let queryCourt = client2.from('courts');
              for (const call of sanitizedCalls) {
                if (typeof queryCourt[call.method] === 'function') {
                  queryCourt = queryCourt[call.method](...call.args);
                }
              }
              result = await queryCourt;
              if (resolve) resolve(result);
              return result;
            } catch(eCourt) {
              console.warn('[DB2 Courts] Erro na consulta:', eCourt);
            }
          }

          if (client1 && !primaryRestricted) {`;

sc = sc.replace(oldProxyExec, newProxyExec);

// Também impede que dispatchLightweightCopy envie courts para o banco 1 ou duplique
sc = sc.replace(
  `if (operations.isWrite && cfg.dualWrite && client2) {`,
  `if (operations.isWrite && cfg.dualWrite && client2 && tableName !== 'courts') {`
);

fs.writeFileSync('public/supabase-client.js', sc, 'utf8');

// 2. Atualizar public/app.js para congelar o salvamento e garantir que grava direto no DB2
let app = fs.readFileSync('public/app.js', 'utf8');

// Na submissão da quadra (handleCourtFormSubmit), salvar DIRETO no Banco 2
const oldCourtSave = `  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      if (isEditing) {
        await client.from('courts').update({
          name, 
          category, 
          category_label: savedCourt.categoryLabel,
          base_price_per_hour: price, 
          monthly_price: monthlyPrice,
          description, 
          observation, 
          image: savedCourt.image, 
          specs: savedCourt.specs,
          badge: savedCourt.badge
        }).eq('id', courtIdToEdit);
      } else {
        await client.from('courts').insert([{
          id, 
          name, 
          category, 
          category_label: savedCourt.categoryLabel,
          base_price_per_hour: price, 
          monthly_price: monthlyPrice,
          description, 
          observation, 
          image: savedCourt.image, 
          specs: savedCourt.specs,
          badge: savedCourt.badge,
          order_index: state.courts.length
        }]);
      }
      if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
        window.ArenaSupabase.broadcastCourtUpdate(savedCourt);
      }
    } catch(e) {
      console.warn('Erro ao salvar quadra no Supabase:', e);
    }
  }`;

const newCourtSave = `  // 🛡️ SALVAMENTO EXCLUSIVO E DEFINITIVO NO BANCO 2 (Sem tocar no Banco 1)
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const db2 = window.ArenaSupabase.getSecondaryClient ? window.ArenaSupabase.getSecondaryClient() : window.ArenaSupabase.getClient();
      const courtPayload = {
        name,
        category,
        category_label: savedCourt.categoryLabel,
        base_price_per_hour: price,
        monthly_price: monthlyPrice,
        description,
        observation,
        image: savedCourt.image,
        specs: savedCourt.specs,
        badge: savedCourt.badge
      };

      if (isEditing) {
        await db2.from('courts').update(courtPayload).eq('id', courtIdToEdit);
      } else {
        await db2.from('courts').upsert([{
          id,
          ...courtPayload,
          order_index: state.courts.length
        }], { onConflict: 'id' });
      }

      console.log('✅ Foto e quadra congeladas com sucesso exclusivamente no Banco 2!');
      if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
        window.ArenaSupabase.broadcastCourtUpdate(savedCourt);
      }
    } catch(e) {
      console.warn('Erro ao salvar quadra no Banco 2:', e);
    }
  }`;

// Substitui com suporte a quebras de linha Windows e Unix
const normalizeNL = str => str.replace(/\r\n/g, '\n');
const appNorm = normalizeNL(app);
const oldCourtSaveNorm = normalizeNL(oldCourtSave);

if (appNorm.includes(oldCourtSaveNorm)) {
  const isCRLF = app.includes('\r\n');
  const replacement = isCRLF ? newCourtSave.replace(/\n/g, '\r\n') : newCourtSave;
  app = app.replace(oldCourtSave.replace(/\n/g, isCRLF ? '\r\n' : '\n'), replacement);
  fs.writeFileSync('public/app.js', app, 'utf8');
  console.log('app.js atualizado com salvamento exclusivo no Banco 2!');
} else {
  console.log('Substituição manual de app.js necessária...');
}

console.log('supabase-client.js atualizado!');
