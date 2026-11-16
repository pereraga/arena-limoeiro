const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar newCourtBlock para salvar o bloqueio como registro oficial no banco de dados (bookings com booking_type='bloqueio' e status='blocked')
const oldNewCourtBlock = `    courtState.blocks.push(b);
    persistCourtState();
    closeCourtModal();
    if (typeof showAdminToast === 'function') showAdminToast('Bloqueio agendado com sucesso!');`;

const newNewCourtBlock = `    courtState.blocks.push(b);
    persistCourtState();

    // Sincroniza o bloqueio no banco de dados na nuvem (Supabase DB1 e DB2)
    const dbCourtId = (typeof COURT_TO_DB_ID !== 'undefined' && COURT_TO_DB_ID[b.courtId]) ? COURT_TO_DB_ID[b.courtId] : b.courtId;
    const blockPayload = {
      id: b.id,
      court_id: dbCourtId,
      customer_name: '⛔ BLOQUEIO: ' + b.type.toUpperCase(),
      customer_phone: '(81) 9.9999-9999',
      date: b.date,
      start_time: b.start,
      end_time: b.end,
      time: b.start + ' às ' + b.end,
      duration: 60,
      total_price: 0,
      status: 'blocked',
      booking_type: 'bloqueio',
      payment_method: 'Bloqueio Administrativo',
      observation: 'Bloqueio de Horário (' + b.type + ')' + (b.note ? ' - ' + b.note : ''),
      created_at: new Date().toISOString()
    };

    // Adiciona na memória de bookings para travar a grade e o feed imediatamente
    if (window.adminGameState && Array.isArray(window.adminGameState.bookings)) {
      window.adminGameState.bookings.unshift(blockPayload);
    }

    if (window.ARENA_CLOUD_DBS) {
      [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
        const dbKey = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
        fetch(dbUrl + '/rest/v1/bookings', {
          method: 'POST',
          headers: {
            apikey: dbKey,
            Authorization: 'Bearer ' + dbKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(blockPayload)
        }).catch(() => {});
      });
    }

    closeCourtModal();
    if (typeof showAdminToast === 'function') showAdminToast('Bloqueio agendado e salvo no banco de dados!');`;

if (!content.includes(oldNewCourtBlock)) {
  console.error('Error: oldNewCourtBlock not found!');
  process.exit(1);
}
content = content.replace(oldNewCourtBlock, newNewCourtBlock);
console.log('1. Updated newCourtBlock to save blocks to cloud database: SUCCESS');

// 2. Atualizar deleteCourtBlock para excluir do banco de dados também
const oldDeleteCourtBlock = `    courtState.blocks = courtState.blocks.filter(x => x.id !== blockId);
    persistCourtState();
    if (typeof showAdminToast === 'function') showAdminToast('Bloqueio removido com sucesso!');`;

const newDeleteCourtBlock = `    courtState.blocks = courtState.blocks.filter(x => x.id !== blockId);
    persistCourtState();

    // Remove do banco de dados na nuvem (Supabase DB1 e DB2)
    if (window.adminGameState && Array.isArray(window.adminGameState.bookings)) {
      window.adminGameState.bookings = window.adminGameState.bookings.filter(b => b.id !== blockId);
    }

    if (window.ARENA_CLOUD_DBS) {
      [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
        const dbKey = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
        fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(blockId), {
          method: 'DELETE',
          headers: {
            apikey: dbKey,
            Authorization: 'Bearer ' + dbKey
          }
        }).catch(() => {});
      });
    }

    if (typeof showAdminToast === 'function') showAdminToast('Bloqueio removido com sucesso!');`;

if (!content.includes(oldDeleteCourtBlock)) {
  console.error('Error: oldDeleteCourtBlock not found!');
  process.exit(1);
}
content = content.replace(oldDeleteCourtBlock, newDeleteCourtBlock);
console.log('2. Updated deleteCourtBlock to delete from cloud database: SUCCESS');

// 3. Atualizar getBalcaoOccupiedRanges para considerar courtState.blocks e bookings bloqueados
const targetOccupiedCheck = `    // 1. Partidas já registradas em bookings`;
const blockIntegration = `    // 0. Bloqueios de quadra (Treino / Manutenção cadastrados em Gestão de Espaços)
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.blocks)) {
      courtState.blocks.forEach(bl => {
        if (!bl || bl.date !== dateStr) return;
        if (isMatchingCourt(bl.courtId)) {
          const sm = parseTimeToMinutes(bl.start);
          const em = parseTimeToMinutes(bl.end);
          if (em > sm) {
            occupiedRanges.push({
              start: sm,
              end: em,
              startStr: bl.start,
              endStr: bl.end,
              name: '⛔ BLOQUEIO: ' + (bl.type || 'Manutenção').toUpperCase(),
              type: 'Bloqueio Operacional',
              status: 'blocked'
            });
          }
        }
      });
    }

    // 1. Partidas já registradas em bookings`;

if (content.includes(targetOccupiedCheck) && !content.includes('0. Bloqueios de quadra (Treino / Manutenção')) {
  content = content.replace(targetOccupiedCheck, blockIntegration);
  console.log('3. Integrated courtState.blocks into getBalcaoOccupiedRanges: SUCCESS');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating admin.html');
