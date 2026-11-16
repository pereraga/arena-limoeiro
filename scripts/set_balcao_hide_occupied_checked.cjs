const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar HTML para vir marcado com 'checked'
const oldCheckbox = 'id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">';
const newCheckbox = 'id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" checked class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">';

if (content.includes(oldCheckbox)) {
  content = content.replace(oldCheckbox, newCheckbox);
  console.log('1. Updated HTML checkbox to checked: SUCCESS');
} else {
  console.log('1. HTML checkbox already checked or pattern different');
}

// 2. Atualizar openDirectBookingModal para sempre setar hideToggleEl.checked = true
const oldOpenCode = `    // Garante que o checkbox de ocultar ocupados comece desmarcado para mostrar os fixos e ocupados em vermelho
    const hideToggleEl = document.getElementById('balcaoHideOccupiedToggle');
    if (hideToggleEl) hideToggleEl.checked = false;`;

const newOpenCode = `    // Garante que o checkbox de ocultar indisponíveis sempre abra selecionado (checked = true)
    const hideToggleEl = document.getElementById('balcaoHideOccupiedToggle');
    if (hideToggleEl) hideToggleEl.checked = true;`;

if (content.includes(oldOpenCode)) {
  content = content.replace(oldOpenCode, newOpenCode);
  console.log('2. Updated openDirectBookingModal to hideToggleEl.checked = true: SUCCESS');
} else {
  console.log('2. oldOpenCode not found, checking alternative pattern...');
  // Procura qualquer ocorrência de balcaoHideOccupiedToggle.*checked.*false
  content = content.replace(/(document\.getElementById\(['"]balcaoHideOccupiedToggle['"]\)[^;]*?\.checked\s*=\s*)false/g, '$1true');
  console.log('2b. Replaced any false assignment to true');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating admin.html');
