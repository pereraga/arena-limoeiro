const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Atualizar loadCourtState
const targetLoad = "function loadCourtState() {";
const idxLoad = html.indexOf(targetLoad);
if (idxLoad !== -1) {
  const endLoad = html.indexOf("let courtState = loadCourtState();", idxLoad);
  const replLoad = `function loadCourtState() {
  try {
    const raw = localStorage.getItem(COURT_STORAGE_KEY);
    if (!raw) return { courts: courtInitialData, blocks: [] };
    const parsed = JSON.parse(raw);
    let blList = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    blList = blList.filter(b => b && b.id !== 'block_1794921927373');
    return {
      courts: Array.isArray(parsed.courts) && parsed.courts.length ? parsed.courts : courtInitialData,
      blocks: blList
    };
  } catch(e) {
    return { courts: courtInitialData, blocks: [] };
  }
}

`;
  html = html.slice(0, idxLoad) + replLoad + html.slice(endLoad);
}

// 2. Atualizar getBalcaoOccupiedRanges
const targetBalcao = "// 0. Bloqueios de quadra (Treino / Manutenção cadastrados em Gestão de Espaços)";
const idxBalcao = html.indexOf(targetBalcao);
if (idxBalcao !== -1) {
  const endBalcao = html.indexOf("// 1. Partidas já registradas em bookings", idxBalcao);
  const replBalcao = `// 0. Bloqueios de quadra (Treino / Manutenção cadastrados em Gestão de Espaços)
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.blocks)) {
      courtState.blocks.forEach(bl => {
        if (!bl || bl.date !== dateStr) return;
        if (bl.id && (bl.id === 'block_1794921927373' || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(bl.id)))) return;
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

    `;
  html = html.slice(0, idxBalcao) + replBalcao + html.slice(endBalcao);
}

// 3. Atualizar checagem em bookings dentro de getBalcaoOccupiedRanges
const targetBookingsCheck = "if (b.id && excluidosBalcao[b.id + '_' + dateStr]) return;";
const idxBCheck = html.indexOf(targetBookingsCheck);
if (idxBCheck !== -1) {
  html = html.slice(0, idxBCheck) + 
    "if (b.id && (b.id === 'block_1794921927373' || excluidosBalcao[b.id + '_' + dateStr] || (window.__arenaCloudTombstones && window.__arenaCloudTombstones.has(String(b.id))))) return;\n      if (b.booking_type === 'bloqueio' && (st === 'cancelled' || b.id === 'block_1794921927373')) return;" + 
    html.slice(idxBCheck + targetBookingsCheck.length);
}

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Successfully applied all block removal logic!');
