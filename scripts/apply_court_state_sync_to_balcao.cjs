const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Função helper para sincronizar as opções do dropdown directBookingCourt
const syncDirectBookingCourtOptionsFunc = `
  // Sincroniza dinamicamente as opções do select de Quadras na Reserva Balcão com os dados reais de Gestão de Espaços
  window.syncDirectBookingCourtOptions = function() {
    const courtSelect = document.getElementById('directBookingCourt');
    if (!courtSelect) return;

    // Busca a lista atualizada de quadras em courtState ou adminGameState ou ADMIN_COURTS
    let activeCourts = [];
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.courts) && courtState.courts.length > 0) {
      activeCourts = courtState.courts;
    } else if (window.courtState && Array.isArray(window.courtState.courts) && window.courtState.courts.length > 0) {
      activeCourts = window.courtState.courts;
    } else if (window.adminGameState && Array.isArray(window.adminGameState.courts) && window.adminGameState.courts.length > 0) {
      activeCourts = window.adminGameState.courts;
    } else if (typeof ADMIN_COURTS !== 'undefined' && Array.isArray(ADMIN_COURTS)) {
      activeCourts = ADMIN_COURTS;
    }

    if (!activeCourts || activeCourts.length === 0) return;

    const previousVal = courtSelect.value;
    let html = '';
    activeCourts.forEach((c) => {
      const priceVal = c.price ?? c.rate ?? c.normal ?? 100;
      const courtName = c.name || c.id;
      html += '<option value="' + c.id + '">' + courtName + ' (R$ ' + priceVal + '/h)</option>';
    });

    courtSelect.innerHTML = html;

    // Restaura a seleção anterior se ainda existir, ou mantém o primeiro
    if (previousVal && Array.from(courtSelect.options).some(o => o.value === previousVal)) {
      courtSelect.value = previousVal;
    }
  };
`;

// Injetar syncDirectBookingCourtOptions antes de openDirectBookingModal
const targetOpen = 'window.openDirectBookingModal = function() {';
if (!content.includes(targetOpen)) {
  console.error('Error: window.openDirectBookingModal not found!');
  process.exit(1);
}

if (!content.includes('window.syncDirectBookingCourtOptions = function()')) {
  content = content.replace(targetOpen, syncDirectBookingCourtOptionsFunc + '\n  ' + targetOpen);
  console.log('Injected window.syncDirectBookingCourtOptions: SUCCESS');
}

// 2. Chamar syncDirectBookingCourtOptions dentro de openDirectBookingModal
const openSnippetOld = `openDirectBookingModal = function() {
    window.__balcaoHasUserInteracted = false;
    window.__balcaoSelectionHistory = [];
    window.__balcaoClickState = null;
    const modal = document.getElementById('directBookingModal');
    if (!modal) return;
    const dateInput = document.getElementById('directBookingDate');
    const courtSelect = document.getElementById('directBookingCourt');`;

const openSnippetNew = `openDirectBookingModal = function() {
    window.__balcaoHasUserInteracted = false;
    window.__balcaoSelectionHistory = [];
    window.__balcaoClickState = null;
    const modal = document.getElementById('directBookingModal');
    if (!modal) return;
    
    // Atualiza opções do dropdown de quadras com os valores de Gestão de Espaços
    if (typeof window.syncDirectBookingCourtOptions === 'function') {
      window.syncDirectBookingCourtOptions();
    }

    const dateInput = document.getElementById('directBookingDate');
    const courtSelect = document.getElementById('directBookingCourt');`;

if (content.includes(openSnippetOld)) {
  content = content.replace(openSnippetOld, openSnippetNew);
  console.log('Added syncDirectBookingCourtOptions to openDirectBookingModal: SUCCESS');
} else {
  console.log('openSnippetOld not matched directly, checking alternative...');
}

// 3. Atualizar persistCourtState para também atualizar o dropdown e ADMIN_COURTS
const persistSnippetOld = `function persistCourtState() {
  try {
    localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
  } catch(e) {}
  renderCourtsMonitor();`;

const persistSnippetNew = `function persistCourtState() {
  try {
    localStorage.setItem(COURT_STORAGE_KEY, JSON.stringify(courtState));
  } catch(e) {}
  renderCourtsMonitor();

  // Sincroniza imediatamente com a área de Reserva de Balcão e com ADMIN_COURTS
  if (typeof window.syncDirectBookingCourtOptions === 'function') {
    window.syncDirectBookingCourtOptions();
  }
  if (typeof autoCalculateDirectBookingPrice === 'function') {
    autoCalculateDirectBookingPrice();
  }
  if (typeof renderBalcaoTimeSlots === 'function') {
    renderBalcaoTimeSlots();
  }`;

if (content.includes(persistSnippetOld)) {
  content = content.replace(persistSnippetOld, persistSnippetNew);
  console.log('Updated persistCourtState with instant balcão sync: SUCCESS');
}

// 4. Atualizar autoCalculateDirectBookingPrice para pegar a tarifa de courtState dinamicamente
const autoCalcOld = `    const cId = courtSelect.value;
    const court = ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];

    const sMin = parseTimeToMinutes(sStr);
    let eMin = parseTimeToMinutes(eStr);
    if (eMin <= sMin) eMin = sMin + 30;

    const durationHours = (eMin - sMin) / 60;
    const sH = Math.floor(sMin / 60);

    const hourlyRate = court.normal || court.price || (court.name && court.name.includes("7") ? 110 : 90);
    priceInput.value = Math.round(hourlyRate * durationHours);`;

const autoCalcNew = `    const cId = courtSelect.value;
    let liveCourt = null;
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.courts)) {
      liveCourt = courtState.courts.find(c => c.id === cId);
    } else if (window.courtState && Array.isArray(window.courtState.courts)) {
      liveCourt = window.courtState.courts.find(c => c.id === cId);
    }
    const fallbackCourt = (typeof ADMIN_COURTS !== 'undefined' && Array.isArray(ADMIN_COURTS)) ? (ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0]) : null;
    const court = liveCourt || fallbackCourt || {};

    const sMin = parseTimeToMinutes(sStr);
    let eMin = parseTimeToMinutes(eStr);
    if (eMin <= sMin) eMin = sMin + 30;

    const durationHours = (eMin - sMin) / 60;
    const sH = Math.floor(sMin / 60);

    const hourlyRate = (court.price !== undefined) ? court.price : (court.normal !== undefined ? court.normal : (court.rate || (court.name && court.name.includes("7") ? 110 : 90)));
    priceInput.value = Math.round(hourlyRate * durationHours);`;

if (content.includes(autoCalcOld)) {
  content = content.replace(autoCalcOld, autoCalcNew);
  console.log('Updated autoCalculateDirectBookingPrice with dynamic courtState rates: SUCCESS');
}

fs.writeFileSync(path, content, 'utf8');
console.log('All changes written to admin.html successfully!');
