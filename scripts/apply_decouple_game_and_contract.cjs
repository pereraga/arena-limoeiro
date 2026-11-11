const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Modificar getMatchesForDate para sobrescrever campos da partida específica deste dia quando editada
const findGetMatches = `        // Evita duplicatas se já existe registro com o MESMO ID ou se já existe um mensalista fixo cadastrado para o mesmo horário e quadra
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.isMensalista && m.court_id === court.id && m.start_time === startT));
        if (existing) {
          existing.status = (isPast ? 'finished' : (b.status || existing.status));
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          if (b.ballReturned !== undefined) existing.ballReturned = b.ballReturned;
          if (b.finishedAt) existing.finishedAt = b.finishedAt;
          if (b.customer_name) existing.customer_name = b.customer_name;
          if (b.customer_phone) existing.customer_phone = b.customer_phone;
          existing.date = dateStr;
        } else {`;

const replaceGetMatches = `        // Sobrescrita específica de jogo desta data: busca correspondência por ID, ID de mensalista ou vinculação de horário
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.isMensalista && (String(m.id) === 'monthly-' + b.id || (m.court_id === court.id && m.start_time === startT))));
        if (existing) {
          existing.status = (isPast ? 'finished' : (b.status || existing.status));
          if (b.court_id || b.courtId) {
            existing.court_id = court.id;
            existing.court_name = court.name;
          }
          if (b.start_time) existing.start_time = b.start_time;
          if (b.end_time) existing.end_time = b.end_time;
          if (b.time) existing.time = b.time;
          else if (b.start_time && b.end_time) existing.time = b.start_time + ' às ' + b.end_time;
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          if (b.late !== undefined) existing.late = b.late;
          if (b.lateReason !== undefined) existing.lateReason = b.lateReason;
          if (b.ballReturned !== undefined) existing.ballReturned = b.ballReturned;
          if (b.finishedAt) existing.finishedAt = b.finishedAt;
          if (b.customer_name) existing.customer_name = b.customer_name;
          if (b.customer_phone) existing.customer_phone = b.customer_phone;
          if (b.observation) existing.observation = b.observation;
          existing.date = dateStr;
        } else {`;

if (!content.includes(findGetMatches)) {
  console.error('ERRO: findGetMatches não encontrado no arquivo!');
  process.exit(1);
}

content = content.replace(findGetMatches, replaceGetMatches);
console.log('✓ getMatchesForDate atualizado com sucesso.');

// 2. Modificar saveEditGame para que edição de jogo afete EXCLUSIVAMENTE aquele jogo daquela data
const findSaveEditGame = `    // Se o jogo editado for um Mensalista Fixo, sincroniza também em monthly_members
    if (String(id).startsWith('monthly-') || g.isMensalista || g.booking_type === 'mensalista') {
      const rawMonthlyId = String(id).replace('monthly-', '');
      const exM = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === rawMonthlyId || (m.responsible_name && m.responsible_name.toLowerCase() === g.customer_name.toLowerCase()));
      
      const dbCourtMapping = {
        'fut5': 'court-society-1',
        'fut6': 'court-society-2',
        'fut7': 'court-beach-1',
        'futmesa': 'court-esportes-de-quadra-1788962671043',
        'areia': 'court-beach-2',
        'society': 'court-futsal-1788963178368'
      };
      const finalDbCourtId = dbCourtMapping[court.id] || court.id;

      if (exM) {
        exM.court_id = finalDbCourtId;
        exM.start_time = newStart;
        exM.time = newStart;
        exM.end_time = newEnd;
        if (g.customer_phone) exM.phone = g.customer_phone;
      }

      // Persiste sem travar nos 2 bancos Supabase (DB2 e DB1)
      if (typeof ARENA_CLOUD_DBS !== 'undefined') {
        const patchPayload = {
          court_id: finalDbCourtId,
          start_time: newStart,
          time: newStart,
          end_time: newEnd,
          phone: g.customer_phone || ''
        };
        [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
          if (!dbUrl) return;
          const key = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
          fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMonthlyId), {
            method: 'PATCH',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(patchPayload)
          }).catch(() => {});
        });
      }
    }`;

const replaceSaveEditGame = `    // REGRA DE OURO: "Editar jogo" altera ESTRITAMENTE e EXCLUSIVAMENTE a partida desta data.
    // O contrato fixo recorrente (monthly_members) permanece 100% inalterado.
    // Se for partida de mensalista, garante que o agendamento específico desta data está registrado em bookings.
    if (String(id).startsWith('monthly-') || g.isMensalista || g.booking_type === 'mensalista') {
      const existingInBookings = (window.adminGameState.bookings || []).find(b => String(b.id) === String(g.id) && b.date === newDate);
      if (!existingInBookings) {
        window.adminGameState.bookings.push(g);
      }
    }`;

if (!content.includes(findSaveEditGame)) {
  console.error('ERRO: findSaveEditGame não encontrado no arquivo!');
  process.exit(1);
}

content = content.replace(findSaveEditGame, replaceSaveEditGame);
console.log('✓ saveEditGame desacoplado de monthly_members com sucesso.');

// 3. Atualizar mensagem de toast e saveContract
content = content.replace(
  "arenaToast('Partida atualizada com sucesso!');",
  "arenaToast('Partida deste dia atualizada com sucesso! (Contrato fixo mantido)');"
);

// 4. Aprimorar saveContract para salvar estritamente o contrato daquela pessoa específica
const findSaveContractSync = `      // Se for mensalista/fixo, atualiza no estado local e nos bancos Supabase
      if (String(id).startsWith('monthly-') || g.isMensalista) {
        const rawMonthlyId = String(id).replace('monthly-', '');
        const member = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === rawMonthlyId);
        if (member) {
          member.court_id = selectedCourt.id;
          member.courtId = selectedCourt.id;
          member.court_name = selectedCourt.name;
        }

        // Mapeamento para o ID do banco se aplicável
        const dbCourtMapping = {
          'fut5': 'court-society-1',
          'fut6': 'court-society-2',
          'fut7': 'court-beach-1',
          'futmesa': 'court-esportes-de-quadra-1788962671043',
          'areia': 'court-beach-2',
          'society': 'court-futsal-1788963178368'
        };
        const dbCourtId = dbCourtMapping[selectedCourt.id] || selectedCourt.id;

        // Persistência assíncrona imediata nos 2 bancos Supabase para monthly_members
        if (typeof ARENA_CLOUD_DBS !== 'undefined') {
          [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
            if (!dbUrl) return;
            const key = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
            fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMonthlyId), {
              method: 'PATCH',
              headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                court_id: dbCourtId
              })
            }).catch(err => console.warn('[ArenaCloud] Erro sync court mensalista:', err));
          });
        }
      }`;

const replaceSaveContractSync = `      // REGRA DE OURO: "Editar contrato" altera ESTRITAMENTE e EXCLUSIVAMENTE o contrato recorrente desta pessoa em monthly_members
      if (String(id).startsWith('monthly-') || g.isMensalista) {
        const rawMonthlyId = String(id).replace('monthly-', '');
        const member = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === rawMonthlyId);
        const newDayFixed = document.getElementById('contractDayFixed')?.value || g.contract.dayFixed;
        const newDueDay = parseInt(document.getElementById('contractDueDay')?.value || 10, 10);
        const newAmount = parseFloat(document.getElementById('contractAmount')?.value || 0);

        if (member) {
          member.court_id = selectedCourt.id;
          member.courtId = selectedCourt.id;
          member.court_name = selectedCourt.name;
          if (newDayFixed) member.day_of_week = newDayFixed.toLowerCase();
          if (newAmount > 0) member.monthly_price = newAmount;
        }

        // Mapeamento para o ID do banco se aplicável
        const dbCourtMapping = {
          'fut5': 'court-society-1',
          'fut6': 'court-society-2',
          'fut7': 'court-beach-1',
          'futmesa': 'court-esportes-de-quadra-1788962671043',
          'areia': 'court-beach-2',
          'society': 'court-futsal-1788963178368'
        };
        const dbCourtId = dbCourtMapping[selectedCourt.id] || selectedCourt.id;

        // Persistência assíncrona imediata nos 2 bancos Supabase para monthly_members dessa pessoa específica
        if (typeof ARENA_CLOUD_DBS !== 'undefined') {
          const contractPayload = {
            court_id: dbCourtId,
            day_of_week: newDayFixed ? newDayFixed.toLowerCase() : undefined,
            monthly_price: newAmount > 0 ? newAmount : undefined
          };
          // Remove campos indefinidos
          Object.keys(contractPayload).forEach(k => contractPayload[k] === undefined && delete contractPayload[k]);

          [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
            if (!dbUrl) return;
            const key = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
            fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMonthlyId), {
              method: 'PATCH',
              headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(contractPayload)
            }).catch(err => console.warn('[ArenaCloud] Erro sync contrato mensalista:', err));
          });
        }
      }`;

if (!content.includes(findSaveContractSync)) {
  console.error('ERRO: findSaveContractSync não encontrado no arquivo!');
  process.exit(1);
}

content = content.replace(findSaveContractSync, replaceSaveContractSync);
console.log('✓ saveContract atualizado com sucesso para pessoa específica.');

fs.writeFileSync(path, content, 'utf8');
console.log('✓ public/admin.html gravado com sucesso!');
