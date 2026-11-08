const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(filePath, 'utf8');

console.log('Original admin.html length:', html.length);

// 1. Add early getSystemToday and formatDisplayDate in <head>
const earlyScript = `  <script>
    // Helper oficial de data e formatação disponível no boot antes do primeiro frame
    window.getSystemToday = function() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    };

    window.formatDisplayDate = function(dateStr) {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-');
        const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return days[dt.getDay()] + ', ' + parts[2] + ' de ' + months[dt.getMonth()] + ' de ' + parts[0];
      } catch(e) {
        return dateStr;
      }
    };
  </script>`;

if (!html.includes('Helper oficial de data e formatação disponível no boot')) {
  html = html.replace('<link rel="preconnect" href="https://fonts.googleapis.com">', `${earlyScript}\n  <link rel="preconnect" href="https://fonts.googleapis.com">`);
  console.log('✓ Added early getSystemToday & formatDisplayDate to <head>');
}

// 2. Fix KPIs to avoid flashing fake 0 / R$ 0,00
const oldKpiGames = '<span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-games" id="kpiValueGames">0 <span class="text-xs font-semibold text-slate-400">partidas</span></span>';
const newKpiGames = '<span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-games" id="kpiValueGames"><span class="animate-pulse text-slate-300">...</span></span>';
if (html.includes(oldKpiGames)) {
  html = html.replace(oldKpiGames, newKpiGames);
  console.log('✓ Updated kpiValueGames placeholder');
}

const oldKpiLive = '<span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-live" id="kpiValueLive">0 <span class="text-xs font-semibold text-slate-400">em quadra</span></span>';
const newKpiLive = '<span class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block kpi-value-live" id="kpiValueLive"><span class="animate-pulse text-slate-300">...</span></span>';
if (html.includes(oldKpiLive)) {
  html = html.replace(oldKpiLive, newKpiLive);
  console.log('✓ Updated kpiValueLive placeholder');
}

const oldKpiRev = '<span class="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block kpi-value-revenue" id="kpiValueRevenue">R$ 0,00</span>';
const newKpiRev = '<span class="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block kpi-value-revenue" id="kpiValueRevenue"><span class="animate-pulse text-emerald-300">...</span></span>';
if (html.includes(oldKpiRev)) {
  html = html.replace(oldKpiRev, newKpiRev);
  console.log('✓ Updated kpiValueRevenue placeholder');
}

// 3. Update Calendar Header Month title and date span
const oldMonthHeader = '<span>Partidas: <strong>Novembro de 2026</strong></span>';
const newMonthHeader = '<span>Partidas: <strong id="calendarHeaderMonthStrong">Novembro de 2026</strong></span>';
if (html.includes(oldMonthHeader)) {
  html = html.replace(oldMonthHeader, newMonthHeader);
  console.log('✓ Added id to calendarHeaderMonthStrong');
}

const oldDateSpan = `<span id="calendarHeaderDateDisplay" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 flex items-center gap-1">
            <span>03 / 11 / 2026</span>
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
          </span>`;
const newDateSpan = `<span id="calendarHeaderDateDisplay" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 flex items-center gap-1">
            <span id="calendarHeaderDateSpan">-- / -- / ----</span>
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
          </span>`;
if (html.includes(oldDateSpan)) {
  html = html.replace(oldDateSpan, newDateSpan);
  console.log('✓ Updated calendarHeaderDateDisplay');
}

// 4. Replace hardcoded movementDaysStrip cards with clean dynamic inline synchronous script
const stripRegex = /<!-- Barra de 21 Dias com badges de jogos -->\s*<div id="movementDaysStrip"[\s\S]*?<\/div>\s*<\/div>/;
const dynamicStrip = `<!-- Barra de 21 Dias com badges de jogos -->
      <div id="movementDaysStrip" class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar"></div>
      <script>
        (function() {
          try {
            const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : (function() {
              const now = new Date();
              return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            })();
            const [ty, tm, td] = todayStr.split('-').map(Number);
            const baseDate = new Date(ty, tm - 1, td, 12, 0, 0);

            // 1. Atualiza o mês no cabeçalho
            const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const monthStrong = document.getElementById('calendarHeaderMonthStrong');
            if (monthStrong) monthStrong.textContent = monthsFull[baseDate.getMonth()] + ' de ' + ty;

            // 2. Atualiza badge da data no cabeçalho (ex: 08 / 11 / 2026)
            const calSpan = document.getElementById('calendarHeaderDateSpan') || (document.getElementById('calendarHeaderDateDisplay') ? document.getElementById('calendarHeaderDateDisplay').querySelector('span') : null);
            if (calSpan) calSpan.textContent = String(td).padStart(2, '0') + ' / ' + String(tm).padStart(2, '0') + ' / ' + ty;

            // 3. Atualiza título do feed imediatamente
            const feedTitle = document.getElementById('movementFeedTitle');
            if (feedTitle && typeof window.formatDisplayDate === 'function') {
              feedTitle.textContent = 'Partidas Programadas para ' + window.formatDisplayDate(todayStr);
            }

            // 4. Renderiza régua de 21 dias dinamicamente no boot antes do primeiro frame
            const strip = document.getElementById('movementDaysStrip');
            if (strip) {
              const dowMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
              const monthMap = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              let html = '';
              const genDates = [];
              for (let offset = -3; offset <= 17; offset++) {
                const curD = new Date(baseDate);
                curD.setDate(baseDate.getDate() + offset);
                const cY = curD.getFullYear();
                const cM = String(curD.getMonth() + 1).padStart(2, '0');
                const cD = String(curD.getDate()).padStart(2, '0');
                const dateStr = cY + '-' + cM + '-' + cD;
                genDates.push(dateStr);
                const isToday = (dateStr === todayStr);
                const dow = dowMap[curD.getDay()];
                const monthLabel = monthMap[curD.getMonth()];
                const subLabel = isToday ? (dow + ' • HOJE') : dow;

                if (isToday) {
                  html += '<div class="min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer shrink-0" data-date="' + dateStr + '" onclick="window.selectMovementDay && window.selectMovementDay(\\'' + dateStr + '\\', this)">' +
                    '<span class="text-[10px] uppercase font-bold text-emerald-200 block">' + subLabel + '</span>' +
                    '<span class="text-lg font-black text-white block">' + cD + '</span>' +
                    '<span class="text-[9px] text-emerald-200 block">' + monthLabel + '</span>' +
                    '<span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block">...</span>' +
                  '</div>';
                } else {
                  html += '<div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer shrink-0" data-date="' + dateStr + '" onclick="window.selectMovementDay && window.selectMovementDay(\\'' + dateStr + '\\', this)">' +
                    '<span class="text-[10px] uppercase font-bold text-slate-400 block">' + subLabel + '</span>' +
                    '<span class="text-base font-black text-slate-800 block">' + cD + '</span>' +
                    '<span class="text-[9px] text-slate-400 block">' + monthLabel + '</span>' +
                    '<span class="mt-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black inline-block">...</span>' +
                  '</div>';
                }
              }
              strip.innerHTML = html;
              window.__arenaCalendarDatesList = genDates;
            }
          } catch(e) {}
        })();
      </script>
    </div>`;

if (stripRegex.test(html)) {
  html = html.replace(stripRegex, dynamicStrip);
  console.log('✓ Replaced hardcoded movementDaysStrip with dynamic synchronous strip');
} else {
  console.log('⚠️ Could not match stripRegex, checking why...');
}

// 5. Update feed title, count, and initial container state
const oldFeedTitle = '<span id="movementFeedTitle" class="break-words">Partidas Programadas para Terça-feira, 03 de Novembro de 2026</span>';
const newFeedTitle = `<span id="movementFeedTitle" class="break-words">Partidas Programadas para Hoje</span>
            <script>
              (function() {
                try {
                  const feedTitle = document.getElementById('movementFeedTitle');
                  if (feedTitle && typeof window.formatDisplayDate === 'function' && typeof window.getSystemToday === 'function') {
                    feedTitle.textContent = 'Partidas Programadas para ' + window.formatDisplayDate(window.getSystemToday());
                  }
                } catch(e) {}
              })();
            </script>`;
if (html.includes(oldFeedTitle)) {
  html = html.replace(oldFeedTitle, newFeedTitle);
  console.log('✓ Updated movementFeedTitle placeholder');
} else if (html.includes('<span id="movementFeedTitle" class="break-words">Partidas Programadas para Hoje</span>') && !html.includes('feedTitle.textContent = \'Partidas Programadas para \'')) {
  html = html.replace('<span id="movementFeedTitle" class="break-words">Partidas Programadas para Hoje</span>', newFeedTitle);
  console.log('✓ Added synchronous script to movementFeedTitle');
}

const oldFeedCount = `<span id="movementFeedCount" class="text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-bold self-start sm:self-center shrink-0">
            0 partidas listadas
          </span>`;
const newFeedCount = `<span id="movementFeedCount" class="text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-bold self-start sm:self-center shrink-0">
            <span class="animate-pulse">Sincronizando...</span>
          </span>`;
if (html.includes(oldFeedCount)) {
  html = html.replace(oldFeedCount, newFeedCount);
  console.log('✓ Updated movementFeedCount placeholder');
}

const oldListContainer = `<div id="movementMatchesListContainer" class="space-y-4">
          <!-- Renderizado dinamicamente via JS -->
        </div>`;
const newListContainer = `<div id="movementMatchesListContainer" class="space-y-4">
          <div class="flex flex-col items-center justify-center p-10 text-slate-400 gap-2.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div class="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
            <span class="text-xs font-semibold text-slate-500">Sincronizando partidas em tempo real...</span>
          </div>
        </div>`;
if (html.includes(oldListContainer)) {
  html = html.replace(oldListContainer, newListContainer);
  console.log('✓ Updated movementMatchesListContainer placeholder');
}

// 6. Direct booking date input: remove value="2026-11-03"
if (html.includes('id="directBookingDate" required value="2026-11-03"')) {
  html = html.replace('id="directBookingDate" required value="2026-11-03"', 'id="directBookingDate" required');
  console.log('✓ Removed hardcoded value="2026-11-03" from directBookingDate');
}

// 7. Fix isPastOrDay3
const oldPastRule = `const isPastOrDay3 = (dateStr <= '2026-11-03' && dateStr !== '2026-11-04');
    const defaultPastStatus = isPastOrDay3 ? 'finished' : 'confirmed';`;
const newPastRule = `const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
    const isPast = (dateStr < sysTodayStr);
    const defaultPastStatus = isPast ? 'finished' : 'confirmed';`;
if (html.includes(oldPastRule)) {
  html = html.replace(oldPastRule, newPastRule);
  console.log('✓ Updated isPastOrDay3 to dynamic sysTodayStr');
}

// 8. Replace other hardcoded fallback dates
html = html.replace(/dateStr \|\| '2026-11-03'/g, "dateStr || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')");
html = html.replace(/selectedDate \|\| '2026-11-03'/g, "selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')");
html = html.replace(/selectedDate \|\| '2026-11-04'/g, "selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')");
html = html.replace(/const todayStr = '2026-11-03';/g, "const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';");
html = html.replace(/: '2026-11-03';/g, ": ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');");
html = html.replace(/: '2026-11-04'/g, ": ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')");

// 8.1 Remove hardcoded array in navigateMovementDay
const oldNavRegex = /const datesList = window\.__arenaCalendarDatesList \|\| \[\s*'2026-10-29'[\s\S]*?'2026-11-18'\s*\];/;
const newNavReplacement = `if (!window.__arenaCalendarDatesList || window.__arenaCalendarDatesList.length === 0) {
      if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    }
    const datesList = window.__arenaCalendarDatesList || [];`;
if (oldNavRegex.test(html)) {
  html = html.replace(oldNavRegex, newNavReplacement);
  console.log('✓ Cleaned hardcoded static array from navigateMovementDay');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved admin.html, new length:', html.length);

// 9. Validate all script tags with vm.Script
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let errors = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  scriptIdx++;
  const scriptContent = match[1];
  // skip external scripts
  if (!scriptContent.trim()) continue;
  try {
    new vm.Script(scriptContent);
  } catch(e) {
    console.error(`Script #${scriptIdx} validation error:`, e.message);
    errors++;
  }
}
if (errors === 0) {
  console.log(`✓ All ${scriptIdx} <script> tags validated successfully with 0 errors!`);
} else {
  console.error(`❌ Found ${errors} script validation errors!`);
  process.exit(1);
}
