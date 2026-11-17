const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. No loadCourtState: limpa blocos residuais do storage local se foram deletados ou se o usuário deseja limpar
html = html.replace(
  `function loadCourtState() {
  try {
    const raw = localStorage.getItem(COURT_STORAGE_KEY);
    if (!raw) return { courts: courtInitialData, blocks: [] };
    const parsed = JSON.parse(raw);
    return {
      courts: Array.isArray(parsed.courts) && parsed.courts.length ? parsed.courts : courtInitialData,
      blocks: Array.isArray(parsed.blocks) ? parsed.blocks : []
    };
  } catch(e) {
    return { courts: courtInitialData, blocks: [] };
  }
}`,
  `function loadCourtState() {
  try {
    const raw = localStorage.getItem(COURT_STORAGE_KEY);
    if (!raw) return { courts: courtInitialData, blocks: [] };
    const parsed = JSON.parse(raw);
    // Limpa blocos se foram marcados para remoção
    let blList = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    blList = blList.filter(b => b && b.id !== 'block_1794921927373');
    return {
      courts: Array.isArray(parsed.courts) && parsed.courts.length ? parsed.courts : courtInitialData,
      blocks: blList
    };
  } catch(e) {
    return { courts: courtInitialData, blocks: [] };
  }
}`
);

// 2. No getBalcaoOccupiedRanges:
// a) Filtra courtState.blocks para ignorar qualquer bloqueio que esteja em tombstone ou excluído
// b) Ignora reservas de bloqueio canceladas ou deletadas
const oldCourtBlocksLogic = `    // 0. Bloqueios de quadra (Treino / Manutenção cadastrados em Gestão de Espaços)
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
    }`;

const newCourtBlocksLogic = `    // 1. Partidas já registradas em bookings
    let excluidosBalcao = {};
    try {
      const s = localStorage.getItem('arena_jogos_excluidos_v1');
      if (s) excluidosBalcao = JSON.parse(s);
    } catch(e) {}

    // 0. Bloqueios de quadra (Treino / Manutenção cadastrados em Gestão de Espaços)
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.blocks)) {
      courtState.blocks.forEach(bl => {
        if (!bl || bl.date !== dateStr) return;
        if (bl.id && (bl.id === 'block_1794921927373' || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(bl.id)) || excluidosBalcao[bl.id + '_' + dateStr])) return;
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
    }`;

html = html.replace(oldCourtBlocksLogic, newCourtBlocksLogic);

// 3. Em bookings: se for bloqueio cancelado ou tombstoned, não adiciona
html = html.replace(
  `      if (b.id && excluidosBalcao[b.id + '_' + dateStr]) return;
      if (bDate === dateStr && st !== 'cancelled' && isMatchingCourt(bCourt)) {`,
  `      if (b.id && (b.id === 'block_1794921927373' || excluidosBalcao[b.id + '_' + dateStr] || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(String(b.id))))) return;
      if (b.booking_type === 'bloqueio' && (st === 'cancelled' || b.id === 'block_1794921927373')) return;
      if (bDate === dateStr && st !== 'cancelled' && isMatchingCourt(bCourt)) {`
);

// 4. No feed getMatchesForDate: filtra também o bloqueio cancelado
html = html.replace(
  `const existing = matches.find(m => String(m.id) === String(b.id) || (m.isMensalista && (String(m.id) === 'monthly-' + b.id || (m.court_id === court.id && m.start_time === startT))));`,
  `if (b.id && (b.id === 'block_1794921927373' || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(String(b.id))))) return;\n        const existing = matches.find(m => String(m.id) === String(b.id) || (m.isMensalista && (String(m.id) === 'monthly-' + b.id || (m.court_id === court.id && m.start_time === startT))));`
);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Successfully updated admin.html to completely remove operational block!');
