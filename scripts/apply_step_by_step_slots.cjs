const fs = require("fs");
const path = require("path");

const adminPath = path.join(__dirname, "../public/admin.html");
let html = fs.readFileSync(adminPath, "utf8");

// 1. Remove Atalhos de Duração Rápida and balcaoCalendarStepHelper
const quickStart = html.indexOf("<!-- Atalhos de Duração Rápida -->");
const gridStart = html.indexOf('<div id="directBookingSlotsGrid"');

if (quickStart !== -1 && gridStart !== -1 && quickStart < gridStart) {
  console.log("Removing Atalhos de Duração Rápida and balcaoCalendarStepHelper block...");
  html = html.slice(0, quickStart) + html.slice(gridStart);
} else {
  console.log("Quick duration block already removed or not found at expected position");
}

// 2. Hide balcaoNextGameAlert permanently
html = html.replace(
  /id="balcaoNextGameAlert"[^>]*>/,
  'id="balcaoNextGameAlert" style="display:none !important;" class="hidden">'
);

// 3. Update openDirectBookingModal to reset __balcaoHasUserInteracted
const openFnOld = "window.openDirectBookingModal = function() {";
const openFnNew = `window.openDirectBookingModal = function() {
    window.__balcaoHasUserInteracted = false;
    window.__balcaoSelectionHistory = [];`;

if (html.includes(openFnOld) && !html.includes("window.__balcaoHasUserInteracted = false;")) {
  html = html.replace(openFnOld, openFnNew);
  console.log("Updated openDirectBookingModal with __balcaoHasUserInteracted");
}

// 4. Update nextAlertEl logic inside renderBalcaoTimeSlots so it never displays
html = html.replace(
  /if \(nextAlertEl && nextAlertText\) \{[\s\S]*?updateBalcaoSelectionSummary\(\);/g,
  (match) => {
    // Replace with a simple hidden check
    return `if (nextAlertEl) nextAlertEl.style.display = 'none';\n        updateBalcaoSelectionSummary();`;
  }
);

// 5. Replace window.toggleBalcaoTimeSlot implementation
const toggleStart = html.indexOf("window.toggleBalcaoTimeSlot = function");
const undoStart = html.indexOf("window.undoLastBalcaoTimeSlot = function");

if (toggleStart !== -1 && undoStart !== -1) {
  const newToggleCode = `window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const clickedMin = parseTimeToMinutes(slotTime);
    let curStartMin = parseTimeToMinutes(startSelect.value);
    let curEndMin = parseTimeToMinutes(endSelect.value);
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || '2026-11-04');
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges(courtId, dateStr) : [];

    // Salva histórico para o botão Voltar Seleção
    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({
      start: startSelect.value,
      end: endSelect.value,
      hasInteracted: window.__balcaoHasUserInteracted
    });
    if (window.__balcaoSelectionHistory.length > 20) window.__balcaoSelectionHistory.shift();

    const hasConflict = (fromM, toM) => {
      const s = Math.min(fromM, toM);
      const e = Math.max(fromM, toM);
      return occupiedRanges.some(r => Math.max(s, r.start) < Math.min(e, r.end));
    };

    // 1. Primeiro clique do usuário após abrir o modal: define o Início diretamente no slot clicado
    if (!window.__balcaoHasUserInteracted) {
      startSelect.value = slotTime;
      const defEnd = !hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
      endSelect.value = formatMinutesToTime(defEnd);
      window.__balcaoHasUserInteracted = true;
    }
    // 2. Clique posterior ao início atual (clickedMin > curStartMin)
    else if (clickedMin > curStartMin) {
      if (hasConflict(curStartMin, clickedMin)) {
        // Conflito no caminho: inicia nova seleção no slot clicado
        startSelect.value = slotTime;
        endSelect.value = formatMinutesToTime(clickedMin + 30);
      } else if (clickedMin > curEndMin) {
        // Se for muito distante (> 180 min após o fim), inicia novo intervalo
        if (clickedMin - curEndMin > 180) {
          startSelect.value = slotTime;
          endSelect.value = formatMinutesToTime(clickedMin + 30);
        } else {
          // Estende o Fim diretamente para o slot clicado
          endSelect.value = slotTime;
        }
      } else if (clickedMin === curEndMin) {
        // Clicou exatamente no botão de Fim
        const duration = curEndMin - curStartMin;
        if (duration > 30) {
          // Reduz/remove 30 minutos (volta 1 slot)
          endSelect.value = formatMinutesToTime(curEndMin - 30);
        } else {
          // Já é meia hora (mínimo) -> mantém confirmado
          endSelect.value = slotTime;
        }
      } else {
        // Clicou em slot intermediário selecionado (curStartMin < clickedMin < curEndMin): ajusta Fim
        endSelect.value = slotTime;
      }
    }
    // 3. Clique exatamente no botão de Início
    else if (clickedMin === curStartMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        endSelect.value = formatMinutesToTime(curStartMin + 30);
      }
    }
    // 4. Clique anterior ao início atual (clickedMin < curStartMin)
    else {
      if (curStartMin - clickedMin <= 120 && !hasConflict(clickedMin, curEndMin)) {
        // Expansão para trás
        startSelect.value = slotTime;
      } else {
        // Inicia nova seleção no horário clicado
        startSelect.value = slotTime;
        endSelect.value = formatMinutesToTime(clickedMin + 30);
      }
    }

    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };\n\n  `;

  html = html.slice(0, toggleStart) + newToggleCode + html.slice(undoStart);
  console.log("Replaced window.toggleBalcaoTimeSlot");
}

// 6. Update undoLastBalcaoTimeSlot to restore hasInteracted
html = html.replace(
  /window\.__balcaoClickState = prev\.state \|\| 'complete';/,
  `window.__balcaoHasUserInteracted = prev.hasInteracted !== undefined ? prev.hasInteracted : true;`
);

// 7. Update resetDirectBookingTimeSlots to reset __balcaoHasUserInteracted
html = html.replace(
  /window\.__balcaoClickState = null;/,
  `window.__balcaoHasUserInteracted = false;\n      window.__balcaoSelectionHistory = [];`
);

fs.writeFileSync(adminPath, html, "utf8");
console.log("Updated public/admin.html successfully!");
