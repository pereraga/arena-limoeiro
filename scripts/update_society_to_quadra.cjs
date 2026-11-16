const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Replace option in movementCourtFilter:
html = html.replace(
  '<option value="society">🏟️ SOCIETY – ARENA CENTRAL</option>',
  '<option value="society">🏟️ QUADRA – ARENA CENTRAL</option>'
);

// 2. Replace pill span in movementCourtPillsContainer:
html = html.replace(
  '<span>🏟️ SOCIETY</span>',
  '<span>🏟️ QUADRA</span>'
);

// 3. Replace courtInitialData society name:
html = html.replace(
  "{id:'society',name:'SOCIETY – ARENA CENTRAL'",
  "{id:'society',name:'QUADRA – ARENA CENTRAL'"
);

// 4. Replace ADMIN_COURTS society name:
html = html.replace(
  "{ id: 'society', name: 'SOCIETY – ARENA CENTRAL'",
  "{ id: 'society', name: 'QUADRA – ARENA CENTRAL'"
);

// 5. Add window.syncMovementCourtPillsAndFilter function right before window.selectMovementCourtPill
const syncFunctionCode = `
  // Sincroniza dinamicamente as pílulas de quadra e o dropdown da aba Movimentação com os nomes atualizados de Gestão de Espaços
  window.syncMovementCourtPillsAndFilter = function() {
    let courtsList = [];
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.courts) && courtState.courts.length > 0) {
      courtsList = courtState.courts;
    } else if (window.courtState && Array.isArray(window.courtState.courts) && window.courtState.courts.length > 0) {
      courtsList = window.courtState.courts;
    } else if (typeof ADMIN_COURTS !== 'undefined' && Array.isArray(ADMIN_COURTS)) {
      courtsList = ADMIN_COURTS;
    }

    if (!courtsList || courtsList.length === 0) return;

    // Atualiza opções do select movementCourtFilter
    const courtFilterEl = document.getElementById('movementCourtFilter');
    if (courtFilterEl && document.activeElement !== courtFilterEl) {
      courtsList.forEach(c => {
        const opt = courtFilterEl.querySelector(\`option[value="\${c.id}"]\`);
        if (opt && c.name) {
          const icon = opt.textContent.split(' ')[0] || '🏟️';
          opt.textContent = icon + ' ' + c.name;
        }
      });
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
          // Se o nome tiver hífen ou travessão, pega o prefixo principal (ex: "QUADRA – ARENA CENTRAL" -> "QUADRA")
          let shortName = matchedCourt.name.split('–')[0].split('-')[0].trim();
          if (!shortName) shortName = matchedCourt.name;
          spanEl.textContent = currentIcon + ' ' + shortName;
        }
      }
    });
  };
`;

if (!html.includes('window.syncMovementCourtPillsAndFilter')) {
  html = html.replace(
    'window.selectMovementCourtPill = function(courtId) {',
    syncFunctionCode + '\n  window.selectMovementCourtPill = function(courtId) {'
  );
}

// 6. Hook syncMovementCourtPillsAndFilter inside persistCourtState and pullCourtsFromCloud
if (!html.includes('syncMovementCourtPillsAndFilter();')) {
  html = html.replace(
    'if (typeof renderCourtsMonitor === \'function\') renderCourtsMonitor();\n      if (typeof window.syncDirectBookingCourtOptions === \'function\') window.syncDirectBookingCourtOptions();',
    'if (typeof renderCourtsMonitor === \'function\') renderCourtsMonitor();\n      if (typeof window.syncDirectBookingCourtOptions === \'function\') window.syncDirectBookingCourtOptions();\n      if (typeof window.syncMovementCourtPillsAndFilter === \'function\') window.syncMovementCourtPillsAndFilter();'
  );

  html = html.replace(
    'if (typeof window.syncDirectBookingCourtOptions === \'function\') {\n    window.syncDirectBookingCourtOptions();\n  }',
    'if (typeof window.syncDirectBookingCourtOptions === \'function\') {\n    window.syncDirectBookingCourtOptions();\n  }\n  if (typeof window.syncMovementCourtPillsAndFilter === \'function\') {\n    window.syncMovementCourtPillsAndFilter();\n  }'
  );
}

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated public/admin.html with QUADRA and dynamic sync!');
