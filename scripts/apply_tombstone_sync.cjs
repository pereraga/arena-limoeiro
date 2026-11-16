const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. In pullDataFromCloudDatabases: parse tombstones and filter both bookings and monthly members
const targetPull = `        // Filtra registros normais de agendamentos para não poluir tabelas ou listas
        const cleanBookings = cloudBookings.filter(b => b && !String(b.id).startsWith('arena-note-') && !(b.observation && b.observation.startsWith('NOTE_SYNC:::')));`;

const replPull = `        // Processa marcadores de exclusão (Tombstones) sincronizados entre dispositivos na nuvem
        window.__arenaCloudTombstones = window.__arenaCloudTombstones || new Set();
        window.__arenaCloudMemberTombstones = window.__arenaCloudMemberTombstones || new Set();
        cloudBookings.forEach(b => {
          if (!b) return;
          const isTombstone = String(b.id).startsWith('tombstone-') || (b.observation && b.observation.startsWith('TOMBSTONE:::'));
          if (isTombstone && b.observation && b.observation.startsWith('TOMBSTONE:::')) {
            try {
              if (b.observation.startsWith('TOMBSTONE:::member:::')) {
                const payload = JSON.parse(b.observation.slice(21));
                if (payload && payload.deletedId) window.__arenaCloudMemberTombstones.add(String(payload.deletedId));
              } else {
                const payload = JSON.parse(b.observation.slice(12));
                if (payload && payload.deletedId) window.__arenaCloudTombstones.add(String(payload.deletedId));
              }
            } catch(e) {}
          }
        });

        // Filtra registros normais de agendamentos para não poluir tabelas ou listas (exclui notas, marcadores e itens deletados)
        const cleanBookings = cloudBookings.filter(b => {
          if (!b) return false;
          if (String(b.id).startsWith('arena-note-') || (b.observation && b.observation.startsWith('NOTE_SYNC:::'))) return false;
          if (String(b.id).startsWith('tombstone-') || (b.observation && b.observation.startsWith('TOMBSTONE:::'))) return false;
          if (window.__arenaCloudTombstones.has(String(b.id))) return false;
          return true;
        });`;

if (!content.includes(targetPull)) {
  console.error('Target pull not found!');
  process.exit(1);
}
content = content.replace(targetPull, replPull);

// Also filter cloudMembers by member tombstones
const targetMem = `      // 2. Atualiza mensalistas diretamente do banco de dados na nuvem
      if (Array.isArray(cloudMembers)) {`;

const replMem = `      // 2. Atualiza mensalistas diretamente do banco de dados na nuvem (removendo mensalistas excluídos via tombstone)
      if (Array.isArray(cloudMembers)) {
        if (window.__arenaCloudMemberTombstones && window.__arenaCloudMemberTombstones.size > 0) {
          cloudMembers = cloudMembers.filter(m => m && !window.__arenaCloudMemberTombstones.has(String(m.id)));
        }`;

if (!content.includes(targetMem)) {
  console.error('Target mem not found!');
  process.exit(1);
}
content = content.replace(targetMem, replMem);

// 2. In cancelGame: send tombstone to DB1 and DB2
const targetCancelCloud = `    // 4. Executa EXCLUSÃO REAL E DEFINITIVA nos bancos na nuvem (DB2 e DB1)
    if (window.ARENA_CLOUD_DBS) {
      const deleteDb = async (dbUrl, dbKey, table, qId) => {
        try {
          await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(qId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };

      // Exclui em bookings e em monthly_members
      const tasks = [
        deleteDb(cloudDbs.db2Url, cloudDbs.db2Key, 'bookings', targetId),
        deleteDb(cloudDbs.db1Url, cloudDbs.db1Key, 'bookings', targetId)
      ];
      if (isMonthly) {
        tasks.push(
          deleteDb(cloudDbs.db2Url, cloudDbs.db2Key, 'monthly_members', rawMonthlyId),
          deleteDb(cloudDbs.db1Url, cloudDbs.db1Key, 'monthly_members', rawMonthlyId),
          deleteDb(cloudDbs.db2Url, cloudDbs.db2Key, 'bookings', rawMonthlyId),
          deleteDb(cloudDbs.db1Url, cloudDbs.db1Key, 'bookings', rawMonthlyId)
        );
      }
      await Promise.allSettled(tasks);
    }`;

const replCancelCloud = `    // 4. Executa EXCLUSÃO REAL E DEFINITIVA nos bancos na nuvem (DB2 e DB1) com marcadores de exclusão distribuídos (Tombstones)
    if (window.ARENA_CLOUD_DBS) {
      window.__arenaCloudTombstones = window.__arenaCloudTombstones || new Set();
      window.__arenaCloudTombstones.add(targetId);
      if (isMonthly) window.__arenaCloudTombstones.add(rawMonthlyId);

      const deleteDb = async (dbUrl, dbKey, table, qId) => {
        try {
          await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(qId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };

      const sendTombstone = async (dbUrl, dbKey, deletedId, isMember) => {
        try {
          const tsItem = {
            id: 'tombstone-' + deletedId,
            court_id: 'court-beach-1',
            date: selDate,
            start_time: '00:00',
            end_time: '00:01',
            time: '00:00 às 00:01',
            duration: 1,
            customer_name: 'DELETED_SYNC',
            customer_phone: '0000000000',
            total_price: 0,
            status: 'cancelled',
            booking_type: 'avulso',
            payment_method: 'pix',
            observation: 'TOMBSTONE:::' + (isMember ? 'member:::' : '') + JSON.stringify({ deletedId: deletedId, at: Date.now() })
          };
          await fetch(dbUrl + '/rest/v1/bookings', {
            method: 'POST',
            headers: {
              apikey: dbKey,
              Authorization: 'Bearer ' + dbKey,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(tsItem)
          });
        } catch(e) {}
      };

      // Exclui em bookings e em monthly_members e propaga tombstone para todos os computadores e celulares
      const tasks = [
        deleteDb(cloudDbs.db2Url, cloudDbs.db2Key, 'bookings', targetId),
        deleteDb(cloudDbs.db1Url, cloudDbs.db1Key, 'bookings', targetId),
        sendTombstone(cloudDbs.db2Url, cloudDbs.db2Key, targetId, false),
        sendTombstone(cloudDbs.db1Url, cloudDbs.db1Key, targetId, false)
      ];
      if (isMonthly) {
        tasks.push(
          deleteDb(cloudDbs.db2Url, cloudDbs.db2Key, 'monthly_members', rawMonthlyId),
          deleteDb(cloudDbs.db1Url, cloudDbs.db1Key, 'monthly_members', rawMonthlyId),
          deleteDb(cloudDbs.db2Url, cloudDbs.db2Key, 'bookings', rawMonthlyId),
          deleteDb(cloudDbs.db1Url, cloudDbs.db1Key, 'bookings', rawMonthlyId),
          sendTombstone(cloudDbs.db2Url, cloudDbs.db2Key, rawMonthlyId, true),
          sendTombstone(cloudDbs.db1Url, cloudDbs.db1Key, rawMonthlyId, true)
        );
      }
      await Promise.allSettled(tasks);
    }`;

if (!content.includes(targetCancelCloud)) {
  console.error('Target cancelCloud not found!');
  process.exit(1);
}
content = content.replace(targetCancelCloud, replCancelCloud);

// 3. In syncWithCloud: if action === 'delete', also send tombstone
const targetSyncCloud = `          if (action === 'delete') {
            await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
            });
          }`;

const replSyncCloud = `          if (action === 'delete') {
            await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
            });
            // Propaga marcador de exclusão definitiva na nuvem para sincronizar instantaneamente entre Celular e PC
            const tsPayload = {
              id: 'tombstone-' + payload.id,
              court_id: 'court-beach-1',
              date: payload.date || '2026-11-16',
              start_time: '00:00',
              end_time: '00:01',
              time: '00:00 às 00:01',
              duration: 1,
              customer_name: 'DELETED_SYNC',
              customer_phone: '0000000000',
              total_price: 0,
              status: 'cancelled',
              booking_type: 'avulso',
              payment_method: 'pix',
              observation: 'TOMBSTONE:::' + JSON.stringify({ deletedId: payload.id, at: Date.now() })
            };
            await fetch(dbUrl + '/rest/v1/bookings', {
              method: 'POST',
              headers: {
                apikey: dbKey,
                Authorization: 'Bearer ' + dbKey,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify(tsPayload)
            });
          }`;

if (!content.includes(targetSyncCloud)) {
  console.error('Target syncCloud not found!');
  process.exit(1);
}
content = content.replace(targetSyncCloud, replSyncCloud);

// 4. In handleExcluirClienteModal: send tombstone for monthly and bookings
const targetDeleteBookings = `      // 3. Excluir ou limpar reservas vinculadas desse cliente em \`bookings\`
      const deleteBookings = async (dbUrl, dbKey) => {
        try {
          await fetch(dbUrl + '/rest/v1/bookings?customer_name=eq.' + encodeURIComponent(nome), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
          });
          if (id && !id.startsWith('cust-')) {
            await fetch(dbUrl + '/rest/v1/bookings?customer_id=eq.' + encodeURIComponent(id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
          }
        } catch(e) {
          console.warn('[ArenaCloud] Erro ao deletar de bookings:', e);
        }
      };`;

const replDeleteBookings = `      // 3. Excluir ou limpar reservas vinculadas desse cliente em \`bookings\`
      const deleteBookings = async (dbUrl, dbKey) => {
        try {
          await fetch(dbUrl + '/rest/v1/bookings?customer_name=eq.' + encodeURIComponent(nome), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
          });
          if (id && !id.startsWith('cust-')) {
            await fetch(dbUrl + '/rest/v1/bookings?customer_id=eq.' + encodeURIComponent(id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
          }
          if (monthlyId) {
            const tsItem = {
              id: 'tombstone-member-' + monthlyId,
              court_id: 'court-beach-1',
              date: '2026-11-16',
              start_time: '00:00',
              end_time: '00:01',
              time: '00:00 às 00:01',
              duration: 1,
              customer_name: 'DELETED_SYNC',
              customer_phone: '0000000000',
              total_price: 0,
              status: 'cancelled',
              booking_type: 'avulso',
              payment_method: 'pix',
              observation: 'TOMBSTONE:::member:::' + JSON.stringify({ deletedId: monthlyId, at: Date.now() })
            };
            await fetch(dbUrl + '/rest/v1/bookings', {
              method: 'POST',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
              body: JSON.stringify(tsItem)
            });
          }
        } catch(e) {
          console.warn('[ArenaCloud] Erro ao deletar de bookings:', e);
        }
      };`;

if (!content.includes(targetDeleteBookings)) {
  console.error('Target deleteBookings not found!');
  process.exit(1);
}
content = content.replace(targetDeleteBookings, replDeleteBookings);

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully updated public/admin.html with bidirectional tombstone sync!');
