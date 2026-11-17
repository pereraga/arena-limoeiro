const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Em getMatchesForDate, adicionar verificação de tombstones para mensalistas
const oldMonthlyLoop = `    // 1. Mensalistas fixos do dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;`;

const newMonthlyLoop = `    // 1. Mensalistas fixos do dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      if (window.__arenaCloudTombstones && (window.__arenaCloudTombstones.has(String(m.id)) || window.__arenaCloudTombstones.has('monthly-' + String(m.id)))) return;
      if (window.__arenaCloudMemberTombstones && window.__arenaCloudMemberTombstones.has(String(m.id))) return;`;

if (html.includes(oldMonthlyLoop)) {
  html = html.replace(oldMonthlyLoop, newMonthlyLoop);
  console.log('Successfully added tombstone check to monthlyMembers loop in getMatchesForDate');
} else {
  console.log('Target monthlyLoop not found or already modified');
}

// 2. Em pullDataFromCloudDatabases, filtrar bookings para ignorar registros com status 'cancelled'
const oldCleanBookings = `        // Filtra registros normais de agendamentos para não poluir tabelas ou listas (exclui notas, marcadores e itens deletados)
        const cleanBookings = cloudBookings.filter(b => {
          if (!b) return false;
          if (String(b.id).startsWith('arena-note-') || (b.observation && b.observation.startsWith('NOTE_SYNC:::'))) return false;
          if (String(b.id).startsWith('tombstone-') || (b.observation && b.observation.startsWith('TOMBSTONE:::'))) return false;
          if (window.__arenaCloudTombstones.has(String(b.id))) return false;
          return true;
        });`;

const newCleanBookings = `        // Filtra registros normais de agendamentos para não poluir tabelas ou listas (exclui notas, marcadores, cancelados e itens deletados)
        const cleanBookings = cloudBookings.filter(b => {
          if (!b) return false;
          if (String(b.id).startsWith('arena-note-') || (b.observation && b.observation.startsWith('NOTE_SYNC:::'))) return false;
          if (String(b.id).startsWith('tombstone-') || (b.observation && b.observation.startsWith('TOMBSTONE:::'))) return false;
          if (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(String(b.id))) return false;
          if (b.status === 'cancelled' && (b.observation?.includes('TOMBSTONE') || String(b.customer_name).includes('DELETED_SYNC'))) return false;
          return true;
        });`;

if (html.includes(oldCleanBookings)) {
  html = html.replace(oldCleanBookings, newCleanBookings);
  console.log('Successfully updated cleanBookings filter in pullDataFromCloudDatabases');
} else {
  console.log('Target oldCleanBookings not found');
}

// 3. Em getMatchesForDate, ignorar bookings com status === 'cancelled' quando forem tombstones
const oldBookingTombCheck = `if (b.id && (b.id === 'block_1794921927373' || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(String(b.id))))) return;`;
const newBookingTombCheck = `if (b.id && (b.id === 'block_1794921927373' || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(String(b.id))) || b.status === 'cancelled')) return;`;

if (html.includes(oldBookingTombCheck)) {
  html = html.replace(oldBookingTombCheck, newBookingTombCheck);
  console.log('Successfully updated booking tombstone check in getMatchesForDate');
}

fs.writeFileSync(adminPath, html, 'utf8');
console.log('Updated public/admin.html successfully');
