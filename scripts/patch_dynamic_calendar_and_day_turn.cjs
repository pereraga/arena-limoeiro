const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

console.log('Original content size:', content.length);

// -------------------------------------------------------------
// 1. UPDATE BUTTON [✨ Hoje] IN CALENDAR HEADER
// -------------------------------------------------------------
const oldHojeBtn = `onclick="window.selectMovementDay('2026-11-03')" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer transition">`;
const newHojeBtn = `onclick="window.selectMovementDay(window.getSystemToday())" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer transition">`;

if (content.includes(oldHojeBtn)) {
  content = content.replace(oldHojeBtn, newHojeBtn);
  console.log('✓ Updated [✨ Hoje] button to call window.getSystemToday() dynamically');
} else {
  console.warn('! Could not find oldHojeBtn');
}

// -------------------------------------------------------------
// 2. UPDATE INITIAL selectedDate IN adminGameState
// -------------------------------------------------------------
const oldStateDate = `selectedDate: '2026-11-03',`;
const newStateDate = `selectedDate: (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04',`;

if (content.includes(oldStateDate)) {
  content = content.replace(oldStateDate, newStateDate);
  console.log('✓ Updated initial adminGameState.selectedDate to dynamic getSystemToday()');
} else {
  console.warn('! Could not find oldStateDate');
}

// -------------------------------------------------------------
// 3. ENHANCE CALENDAR FUNCTIONS: renderMovementCalendarStrip,
//    selectMovementDay, and navigateMovementDay
// -------------------------------------------------------------
const idxStart = content.indexOf('// =========================================================================\n  // ATUALIZAÇÃO DINÂMICA DA RÉGUA DE CALENDÁRIO COM CONTAGEM REAL DE JOGOS');
const idxEnd = content.indexOf('window.setMovementQuickFilter = function');

if (idxStart !== -1 && idxEnd !== -1) {
  const replacementFunctions = `// =========================================================================
  // GERAÇÃO E ATUALIZAÇÃO DINÂMICA DO CALENDÁRIO COM ADAPTAÇÃO NA VIRADA DO DIA
  // =========================================================================
  window.renderMovementCalendarStrip = function() {
    const strip = document.getElementById('movementDaysStrip');
    if (!strip) return;

    const todayStr = window.getSystemToday();
    const selectedDate = window.adminGameState.selectedDate || todayStr;
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const baseDate = new Date(ty, tm - 1, td, 12, 0, 0);

    const dowMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const monthMap = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Janela de 21 dias: 3 dias no passado até 17 dias no futuro
    let html = '';
    const generatedDates = [];

    for (let offset = -3; offset <= 17; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = \`\${yyyy}-\${mm}-\${dd}\`;
      generatedDates.push(dateStr);

      const isToday = (dateStr === todayStr);
      const isSelected = (dateStr === selectedDate);
      const dow = dowMap[d.getDay()];
      const monthLabel = monthMap[d.getMonth()];

      const dayMatches = (typeof window.getMatchesForDate === 'function') ? window.getMatchesForDate(dateStr) : [];
      const count = dayMatches.length;
      const countLabel = count === 0 ? 'Sem jogos' : (count === 1 ? '1 jogo' : count + ' jogos');

      let subLabel = dow;
      if (isToday) {
        subLabel = dow + ' • HOJE';
      }

      if (isSelected) {
        html += \`
        <div class="min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer shrink-0" data-date="\${dateStr}" onclick="window.selectMovementDay('\${dateStr}', this)">
          <span class="text-[10px] uppercase font-bold text-emerald-200 block">\${subLabel}</span>
          <span class="text-lg font-black text-white block">\${dd}</span>
          <span class="text-[9px] text-emerald-200 block">\${monthLabel}</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block">\${countLabel}</span>
        </div>\`;
      } else {
        html += \`
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer shrink-0" data-date="\${dateStr}" onclick="window.selectMovementDay('\${dateStr}', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">\${subLabel}</span>
          <span class="text-base font-black text-slate-800 block">\${dd}</span>
          <span class="text-[9px] text-slate-400 block">\${monthLabel}</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md \${count > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'} text-[9px] font-black inline-block">\${countLabel}</span>
        </div>\`;
      }
    }

    strip.innerHTML = html;
    window.__arenaCalendarDatesList = generatedDates;

    // Faz scroll suave até o dia selecionado
    setTimeout(() => {
      const activeCard = strip.querySelector(\`[data-date="\${selectedDate}"]\`);
      if (activeCard && typeof activeCard.scrollIntoView === 'function') {
        activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 50);
  };

  // ATUALIZAÇÃO RÁPIDA DE BADGES SEM RECONSTRUIR DOM
  window.updateMovementCalendarStrip = function() {
    const strip = document.getElementById('movementDaysStrip');
    if (!strip) return;
    const dayCards = strip.querySelectorAll('.min-w-\\\\[70px\\\\], .min-w-\\\\[75px\\\\]');
    dayCards.forEach(card => {
      const dateStr = card.getAttribute('data-date');
      if (!dateStr) return;
      const dayMatches = (typeof window.getMatchesForDate === 'function') ? window.getMatchesForDate(dateStr) : [];
      const count = dayMatches.length;
      const badgeText = count === 0 ? 'Sem jogos' : (count === 1 ? '1 jogo' : count + ' jogos');
      
      const spans = card.querySelectorAll('span');
      if (spans.length >= 4) {
        const badgeSpan = spans[spans.length - 1];
        badgeSpan.textContent = badgeText;
        const isSelected = (dateStr === (window.adminGameState ? window.adminGameState.selectedDate : window.getSystemToday()));
        if (isSelected) {
          badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block';
        } else {
          if (count > 0) {
            badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block';
          } else {
            badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black inline-block';
          }
        }
      }
    });
  };

  // NAVEGAÇÃO FLUIDA DE DIAS NO CALENDÁRIO (< MÊS, <, >, MÊS >)
  window.navigateMovementDay = function(delta) {
    const datesList = window.__arenaCalendarDatesList || [
      '2026-10-29', '2026-10-30', '2026-10-31',
      '2026-11-01', '2026-11-02', '2026-11-03',
      '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
      '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
      '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
      '2026-11-16', '2026-11-17', '2026-11-18'
    ];
    const current = window.adminGameState.selectedDate || window.getSystemToday();
    let idx = datesList.indexOf(current);
    if (idx === -1) {
      if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
      idx = (window.__arenaCalendarDatesList || []).indexOf(current);
    }
    if (idx === -1) idx = 3;
    let newIdx = idx + delta;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= datesList.length) newIdx = datesList.length - 1;
    const targetDate = datesList[newIdx];
    window.selectMovementDay(targetDate);
  };

  // SELEÇÃO DO DIA E EXIBIÇÃO IMEDIATA DA PROGRAMAÇÃO DE PARTIDAS
  window.selectMovementDay = function(dateStr, btnEl) {
    if (!dateStr) dateStr = window.getSystemToday();
    window.adminGameState.selectedDate = dateStr;
    
    // Atualiza classes visuais nos botões da régua
    const strip = document.getElementById('movementDaysStrip');
    if (strip) {
      if (!btnEl) {
        btnEl = strip.querySelector('[data-date="' + dateStr + '"]');
      }
      strip.querySelectorAll('.min-w-\\\\[70px\\\\], .min-w-\\\\[75px\\\\]').forEach(el => {
        const cDate = el.getAttribute('data-date');
        const isSel = (cDate === dateStr);
        const spans = el.querySelectorAll('span');
        const badgeSpan = spans.length >= 4 ? spans[spans.length - 1] : null;

        if (isSel) {
          el.className = 'min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer shrink-0';
          if (spans[0]) spans[0].className = 'text-[10px] uppercase font-bold text-emerald-200 block';
          if (spans[1]) spans[1].className = 'text-lg font-black text-white block';
          if (spans[2]) spans[2].className = 'text-[9px] text-emerald-200 block';
          if (badgeSpan) badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block';
        } else {
          el.className = 'min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer shrink-0';
          if (spans[0]) spans[0].className = 'text-[10px] uppercase font-bold text-slate-400 block';
          if (spans[1]) spans[1].className = 'text-base font-black text-slate-800 block';
          if (spans[2]) spans[2].className = 'text-[9px] text-slate-400 block';
          if (badgeSpan) {
            const hasGames = badgeSpan.textContent && !badgeSpan.textContent.includes('Sem');
            badgeSpan.className = 'mt-1 px-1.5 py-0.2 rounded-md ' + (hasGames ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600') + ' text-[9px] font-black inline-block';
          }
        }
      });

      if (btnEl && typeof btnEl.scrollIntoView === 'function') {
        btnEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    // Atualiza mostrador de data no topo do calendário (ex: 04 / 11 / 2026)
    const calDisplay = document.getElementById('calendarHeaderDateDisplay');
    if (calDisplay && dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const span = calDisplay.querySelector('span');
        if (span) span.textContent = parts[2] + ' / ' + parts[1] + ' / ' + parts[0];
      }
    }

    // Renderiza a programação de partidas do dia clicado / selecionado
    if (typeof window.renderMovementMatches === 'function') {
      window.renderMovementMatches();
    }
  };

  `;

  content = content.substring(0, idxStart) + replacementFunctions + content.substring(idxEnd);
  console.log('✓ Successfully replaced calendar functions with dynamic renderMovementCalendarStrip & selectMovementDay');
} else {
  console.error('! Could not find function indices for replacement');
}

// -------------------------------------------------------------
// 4. UPDATE initAdminGames TO USE renderMovementCalendarStrip
//    AND SELECT TODAY DYNAMICALLY
// -------------------------------------------------------------
const oldInitStart = `function initAdminGames() {
    // Configura botões de dias na barra de 21 dias com onclick
    const strip = document.getElementById('movementDaysStrip');
    if (strip) {
      const dayCards = strip.querySelectorAll('.min-w-\\[70px\\], .min-w-\\[75px\\]');
      const datesList = [
        '2026-10-29', '2026-10-30', '2026-10-31',
        '2026-11-01', '2026-11-02', '2026-11-03',
        '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
        '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
        '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
        '2026-11-16', '2026-11-17', '2026-11-18'
      ];

      dayCards.forEach((card, idx) => {
        const dStr = datesList[idx] || ('2026-11-' + String(idx + 1).padStart(2, '0'));
        card.setAttribute('data-date', dStr);
        card.onclick = function() {
          window.selectMovementDay(dStr, this);
        };
      });
    }

    // Destaca o dia atual '2026-11-03' na régua se existir
    if (strip && typeof strip.querySelector === 'function') {
      const todayCard = strip.querySelector('[data-date="2026-11-03"]');
      if (todayCard) {
        window.selectMovementDay('2026-11-03', todayCard);
      }
    }

    // Inicializa renderizações no DIA 3 (Hoje)
    renderMovementMatches();`;

const newInitStart = `function initAdminGames() {
    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';
    window.__lastKnownSystemDate = todayStr;

    // Renderiza a régua de dias dinamicamente centrada no dia de hoje
    if (typeof window.renderMovementCalendarStrip === 'function') {
      window.renderMovementCalendarStrip();
    }

    // Seleciona o dia atual de forma 100% dinâmica (adaptado à virada do dia)
    const targetDate = window.adminGameState.selectedDate || todayStr;
    window.selectMovementDay(targetDate);

    // Inicializa renderizações do feed e cadastros
    renderMovementMatches();`;

if (content.includes(oldInitStart)) {
  content = content.replace(oldInitStart, newInitStart);
  console.log('✓ Updated initAdminGames to dynamic calendar strip and active day selection');
} else {
  console.warn('! Could not find oldInitStart');
}

// -------------------------------------------------------------
// 5. UPDATE BACKGROUND LOOP FOR AUTOMATIC MIDNIGHT DAY-TURN DETECTION
// -------------------------------------------------------------
const oldPollingLoop = `  // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling)
  if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }
      if (typeof window.updateMovementCalendarStrip === 'function') {
        window.updateMovementCalendarStrip();
      }
    }, 7000);
  }`;

const newPollingLoop = `  // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling & virada de dia)
  if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {
      // 1. Detecção e adaptação automática na virada do dia
      if (typeof window.getSystemToday === 'function') {
        const currentToday = window.getSystemToday();
        if (window.__lastKnownSystemDate && window.__lastKnownSystemDate !== currentToday) {
          console.log('[ArenaCalendar] Virada do dia detectada!', window.__lastKnownSystemDate, '->', currentToday);
          window.__lastKnownSystemDate = currentToday;
          window.adminGameState.selectedDate = currentToday;
          if (typeof window.renderMovementCalendarStrip === 'function') {
            window.renderMovementCalendarStrip();
          }
          if (typeof window.selectMovementDay === 'function') {
            window.selectMovementDay(currentToday);
          }
        }
      }

      // 2. Sincronização contínua com os bancos de dados na nuvem
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }
      if (typeof window.updateMovementCalendarStrip === 'function') {
        window.updateMovementCalendarStrip();
      }
    }, 7000);
  }`;

if (content.includes(oldPollingLoop)) {
  content = content.replace(oldPollingLoop, newPollingLoop);
  console.log('✓ Injected midnight day-turn detection into 7s polling loop');
} else {
  console.warn('! Could not find oldPollingLoop');
}

fs.writeFileSync(path, content, 'utf8');
console.log('✓ Successfully written all changes to public/admin.html');
