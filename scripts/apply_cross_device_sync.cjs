const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Update pullDataFromCloudDatabases
// Replace Promise.any with DB2 primary + DB1 fallback and remove the restrictive 3s debounce and 20-item slice in signature
const oldBookingsPromise = `      // 1. Concorrência competitiva paralela: DB2 e DB1 buscam ao mesmo tempo; o primeiro a responder é adotado
      const bookingsPromise = Promise.any([
        fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db2Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject()),
        fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db1Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject())
      ]).catch(() => null);

      // 2. Concorrência de mensalistas em paralelo
      const membersPromise = Promise.any([
        fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db2Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject()),
        fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db1Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject())
      ]).catch(() => null);

      // 3. Concorrência de clientes cadastrados em paralelo
      const customersPromise = Promise.any([
        fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/customers?select=*&order=name.asc', ARENA_CLOUD_DBS.db2Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject()),
        fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/customers?select=*&order=name.asc', ARENA_CLOUD_DBS.db1Key).then(r => (Array.isArray(r) && r.length > 0) ? r : Promise.reject())
      ]).catch(() => null);`;

const newBookingsPromise = `      // 1. Busca prioritária no DB2 (Banco Principal Completo) com fallback seguro no DB1
      const bookingsPromise = fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db2Key)
        .then(r => (Array.isArray(r) && r.length > 0) ? r : fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db1Key))
        .catch(() => null);

      // 2. Busca prioritária de mensalistas no DB2 com fallback no DB1
      const membersPromise = fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db2Key)
        .then(r => (Array.isArray(r) && r.length > 0) ? r : fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db1Key))
        .catch(() => null);

      // 3. Busca de clientes
      const customersPromise = fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/customers?select=*&order=name.asc', ARENA_CLOUD_DBS.db2Key)
        .then(r => (Array.isArray(r) && r.length > 0) ? r : fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/customers?select=*&order=name.asc', ARENA_CLOUD_DBS.db1Key))
        .catch(() => null);`;

if (!content.includes(oldBookingsPromise)) {
  console.error('oldBookingsPromise not found!');
  process.exit(1);
}
content = content.replace(oldBookingsPromise, newBookingsPromise);

// 2. Fix signature calculation in pullDataFromCloudDatabases to hash ALL items and also call updateMovementCalendarStrip
const oldSigBlock = `      if (Array.isArray(cloudBookings)) {
        const newSig = cloudBookings.length + '_' + cloudBookings.slice(0, 20).map(b => b.id + ':' + b.status + ':' + (b.payment_status || '') + ':' + (b.attendance || '')).join('|');
        if (newSig !== window.__lastBookingsSig) {
          window.__lastBookingsSig = newSig;
          stateChanged = true;
          window.adminGameState.bookings = cloudBookings;
        }
      }

      // 2. Atualiza mensalistas diretamente do banco de dados na nuvem
      if (Array.isArray(cloudMembers)) {
        const memSig = cloudMembers.length + '_' + cloudMembers.map(m => m.id).join(',');
        if (memSig !== window.__lastMembersSig) {
          window.__lastMembersSig = memSig;
          stateChanged = true;
          window.adminGameState.monthlyMembers = cloudMembers;
        }
      }`;

const newSigBlock = `      if (Array.isArray(cloudBookings)) {
        const newSig = cloudBookings.length + '_' + cloudBookings.map(b => b.id + ':' + b.status + ':' + (b.date || '') + ':' + (b.payment_status || '') + ':' + (b.attendance || '')).join('|');
        if (newSig !== window.__lastBookingsSig) {
          window.__lastBookingsSig = newSig;
          stateChanged = true;
          window.adminGameState.bookings = cloudBookings;
        }
      }

      // 2. Atualiza mensalistas diretamente do banco de dados na nuvem
      if (Array.isArray(cloudMembers)) {
        const memSig = cloudMembers.length + '_' + cloudMembers.map(m => m.id + ':' + m.status + ':' + (m.day_of_week || '')).join(',');
        if (memSig !== window.__lastMembersSig) {
          window.__lastMembersSig = memSig;
          stateChanged = true;
          window.adminGameState.monthlyMembers = cloudMembers;
        }
      }`;

if (!content.includes(oldSigBlock)) {
  console.error('oldSigBlock not found!');
  process.exit(1);
}
content = content.replace(oldSigBlock, newSigBlock);

// 3. In stateChanged block, ensure updateMovementCalendarStrip and renderMovementCalendarStrip are called so badges update across all devices!
const oldStateChangedAction = `      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }`;

const newStateChangedAction = `      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
        if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }`;

if (!content.includes(oldStateChangedAction)) {
  console.error('oldStateChangedAction not found!');
  process.exit(1);
}
content = content.replace(oldStateChangedAction, newStateChangedAction);

// 4. Reduce polling interval from 12000 to 4000 (4 seconds) so all other PCs/cellphones refresh almost instantly
content = content.replace('}, 12000);', '}, 4000);');

// 5. In deleteMatchPrompt, also await the delete requests so that if another device polls, the DB has already removed it
const oldDeleteWait = `    // ☁️ Deleta imediatamente de ambos os bancos na nuvem (Dual-Delete em paralelo)
    const dbDelete = async (dbUrl, dbKey, table, targetId) => {
      try {
        await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(targetId), {
          method: 'DELETE',
          headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
        });
      } catch(e) {}
    };

    const targetTable = isMonthlyId ? 'monthly_members' : 'bookings';
    Promise.allSettled([
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', id),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', id)
    ]);`;

const newDeleteWait = `    // ☁️ Deleta imediatamente de ambos os bancos na nuvem (Dual-Delete em paralelo)
    const dbDelete = async (dbUrl, dbKey, table, targetId) => {
      try {
        await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(targetId), {
          method: 'DELETE',
          headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
        });
      } catch(e) {}
    };

    const targetTable = isMonthlyId ? 'monthly_members' : 'bookings';
    await Promise.allSettled([
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', id),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', id)
    ]);

    // Força sincronização imediata na nuvem para propagar aos outros dispositivos
    window.__lastBookingsSig = null;
    window.__lastMembersSig = null;
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      await window.pullDataFromCloudDatabases();
    }`;

if (!content.includes(oldDeleteWait)) {
  console.error('oldDeleteWait not found!');
  process.exit(1);
}
content = content.replace(oldDeleteWait, newDeleteWait);

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully updated public/admin.html with multi-device cloud synchronization!');
