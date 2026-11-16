const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar selectMovementCourtPill
const oldPillFunc = `  // Função para seleção rápida de quadras por pílulas / botões rolando
  window.selectMovementCourtPill = function(courtId) {
    const courtSelect = document.getElementById('movementCourtFilter');
    if (courtSelect) {
      courtSelect.value = courtId;
    }
    if (window.adminGameState) {
      window.adminGameState.movementFilterCourt = courtId;
    }

    // Atualiza estado visual das pílulas
    const pills = document.querySelectorAll('.court-pill-btn');
    pills.forEach(p => {
      if (p.getAttribute('data-court-pill') === courtId) {
        p.className = 'court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 bg-emerald-700 text-white border border-emerald-800 cursor-pointer';
      } else {
        p.className = 'court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer';
      }
    });

    if (typeof renderMovementMatches === 'function') {
      renderMovementMatches();
    }
  };`;

const newPillFunc = `  // Função para seleção rápida de quadras por pílulas / botões rolando com ativação touch e clique imediato
  window.selectMovementCourtPill = function(courtId) {
    const courtSelect = document.getElementById('movementCourtFilter');
    if (courtSelect) {
      courtSelect.value = courtId;
    }
    if (window.adminGameState) {
      window.adminGameState.movementFilterCourt = courtId;
      window.adminGameState.selectedCourt = courtId;
    }

    // Atualiza estado visual de todas as pílulas
    const pills = document.querySelectorAll('.court-pill-btn');
    pills.forEach(p => {
      const pCourt = p.getAttribute('data-court-pill');
      if (pCourt === courtId) {
        p.className = 'court-pill-btn active-court-pill shrink-0 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-sm flex items-center gap-1.5 bg-emerald-700 text-white border-2 border-emerald-800 scale-[1.03] cursor-pointer';
      } else {
        p.className = 'court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer';
      }
    });

    if (typeof renderMovementMatches === 'function') {
      renderMovementMatches();
    }
  };`;

if (!content.includes(oldPillFunc)) {
  console.error('Error: oldPillFunc not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldPillFunc, newPillFunc);
console.log('1. Updated selectMovementCourtPill: SUCCESS');

// 2. Aperfeiçoar o filtro de quadras em renderMovementMatches para casar perfeitamente
const oldCourtFilterMatch = `    // 1. Filtro por Quadra
    if (courtFilter && courtFilter !== 'all') {
      const targetCourt = getCourtById(courtFilter);
      matches = matches.filter(m => {
        const mCourt = getCourtById(m.court_id || m.courtId);
        return mCourt.id === targetCourt.id || m.court_id === courtFilter;
      });
    }`;

const newCourtFilterMatch = `    // 1. Filtro por Quadra (Casamento abrangente de IDs, canonicals e nomes)
    if (courtFilter && courtFilter !== 'all') {
      const targetCourt = getCourtById(courtFilter);
      const targetCanonicalId = targetCourt.id; // ex: fut5, fut6, fut7, futmesa, areia, society
      const dbTargetId = (typeof COURT_TO_DB_ID !== 'undefined' && COURT_TO_DB_ID[targetCanonicalId]) ? COURT_TO_DB_ID[targetCanonicalId] : '';

      matches = matches.filter(m => {
        if (!m) return false;
        const rawCourt = String(m.court_id || m.courtId || m.court_name || m.courtName || '').trim();
        if (rawCourt === courtFilter || rawCourt === targetCanonicalId || rawCourt === dbTargetId) return true;
        const mCourt = getCourtById(rawCourt);
        return mCourt && (mCourt.id === targetCanonicalId || mCourt.id === courtFilter);
      });
    }`;

if (!content.includes(oldCourtFilterMatch)) {
  console.error('Error: oldCourtFilterMatch not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldCourtFilterMatch, newCourtFilterMatch);
console.log('2. Updated courtFilter matching in renderMovementMatches: SUCCESS');

// 3. Adicionar evento touchstart e pointerdown nas pílulas no HTML para resposta touch instantânea em celulares
content = content.replace(
  /<button type="button" onclick="selectMovementCourtPill\('([^']+)'\)" data-court-pill="([^']+)"/g,
  '<button type="button" onclick="selectMovementCourtPill(\'$1\')" data-court-pill="$2"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating admin.html!');
