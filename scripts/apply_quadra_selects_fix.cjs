const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Atualizar as opções estáticas de "SOCIETY – ARENA CENTRAL" para "QUADRA – ARENA CENTRAL"
html = html.replace(
  '<option value="society">SOCIETY – ARENA CENTRAL</option>',
  '<option value="society">QUADRA – ARENA CENTRAL</option>'
); // courtsBookingCourtFilter

html = html.replace(
  '<option value="society">SOCIETY – ARENA CENTRAL</option>',
  '<option value="society">QUADRA – ARENA CENTRAL</option>'
); // subtabBookingCourtFilter

html = html.replace(
  '<option value="society">SOCIETY – ARENA CENTRAL</option>',
  '<option value="society">QUADRA – ARENA CENTRAL</option>'
); // modalGerenciarQuadra

html = html.replace(
  '<option value="society">SOCIETY – ARENA CENTRAL (R$ 120/h)</option>',
  '<option value="society">QUADRA – ARENA CENTRAL (R$ 120/h)</option>'
); // directBookingCourt

html = html.replace(
  '<option value="society">SOCIETY – ARENA CENTRAL</option>',
  '<option value="society">QUADRA – ARENA CENTRAL</option>'
); // editMatchCourt

// 2. Expandir a sincronização dinâmica para cobrir todos os selects do sistema quando as quadras forem renomeadas em Gestão de Espaços
const oldSyncFn = `window.syncMovementCourtPillsAndFilter = function() {`;
const newSyncFn = `window.syncAllCourtSelectsAndPills = function() {
    let courtsList = [];
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.courts) && courtState.courts.length > 0) {
      courtsList = courtState.courts;
    } else if (window.courtState && Array.isArray(window.courtState.courts) && window.courtState.courts.length > 0) {
      courtsList = window.courtState.courts;
    } else if (typeof ADMIN_COURTS !== 'undefined' && Array.isArray(ADMIN_COURTS)) {
      courtsList = ADMIN_COURTS;
    }

    if (!courtsList || courtsList.length === 0) return;

    // Lista de todos os selects de quadra da aplicação
    const selectIds = [
      'movementCourtFilter',
      'courtsBookingCourtFilter',
      'subtabBookingCourtFilter',
      'modalGerenciarQuadra',
      'editMatchCourt',
      'contractCourt'
    ];

    selectIds.forEach(selId => {
      const selectEl = document.getElementById(selId);
      if (selectEl && document.activeElement !== selectEl) {
        courtsList.forEach(c => {
          const opt = selectEl.querySelector(\`option[value="\${c.id}"]\`);
          if (opt && c.name) {
            if (selId === 'contractCourt') {
              opt.textContent = \`\${c.name} (Espaço \${c.id.toUpperCase()})\`;
            } else if (selId === 'movementCourtFilter') {
              const icon = opt.textContent.split(' ')[0] || '🏟️';
              opt.textContent = icon + ' ' + c.name;
            } else {
              opt.textContent = c.name;
            }
          }
        });
      }
    });

    // Atualiza o select de Reserva de Balcão (directBookingCourt) se existir
    if (typeof window.syncDirectBookingCourtOptions === 'function') {
      window.syncDirectBookingCourtOptions();
    }

    // Atualiza o texto dos botões de pílula em #movementCourtPillsContainer
    const pills = document.querySelectorAll('#movementCourtPillsContainer .court-pill-btn[data-court-pill]');
    pills.forEach(pill => {
      const pillCourtId = pill.getAttribute('data-court-pill');
      if (pillCourtId === 'all') return;
      const matchedCourt = courtsList.find(c => c.id === pillCourtId);
      if (matchedCourt && matchedCourt.name) {
        const spanEl = pill.querySelector('span');
        if (spanEl) {
          const currentText = spanEl.textContent.trim();
          const currentIcon = currentText.split(' ')[0] || '🏟️';
          let shortName = matchedCourt.name.split('–')[0].split('-')[0].trim();
          if (!shortName) shortName = matchedCourt.name;
          spanEl.textContent = currentIcon + ' ' + shortName;
        }
      }
    });
  };
  window.syncMovementCourtPillsAndFilter = window.syncAllCourtSelectsAndPills;`;

html = html.replace(
  /window\.syncMovementCourtPillsAndFilter\s*=\s*function\(\)\s*\{[\s\S]*?window\.selectMovementCourtPill\s*=\s*function/,
  newSyncFn + '\n  window.selectMovementCourtPill = function'
);

// 3. Garantir chamada de syncAllCourtSelectsAndPills no boot e nas atualizações
html = html.replace(
  /if \(typeof window\.syncMovementCourtPillsAndFilter === 'function'\) window\.syncMovementCourtPillsAndFilter\(\);/g,
  'if (typeof window.syncAllCourtSelectsAndPills === "function") window.syncAllCourtSelectsAndPills(); else if (typeof window.syncMovementCourtPillsAndFilter === "function") window.syncMovementCourtPillsAndFilter();'
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated public/admin.html with QUADRA and comprehensive sync across all selects!');
