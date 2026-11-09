const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. In renderBalcaoTimeSlots:
// Substituir a verificação de horário atual para bloquear horários retroativos ou já em andamento,
// permitindo apenas horários livres de meia em meia hora adiantados em relação ao momento atual (m > currentRealMinutes).
const targetPastCheck = `      // Checa se o horário já passou hoje
      const isPast = (isToday && slotEndMin <= currentRealMinutes);`;

const replPastCheck = `      // Regra Operacional Estrita: Se o horário atual já passou do início do slot (ex: às 14:00 em diante),
      // o slot de 14:00 é bloqueado/indisponível. Só libera horários adiantados de meia em meia hora (ex: 14:30 em diante).
      const isPast = (isToday && m <= currentRealMinutes);`;

if (html.includes(targetPastCheck)) {
  html = html.replace(targetPastCheck, replPastCheck);
  console.log('1. Verificação de horário passado (isPast) atualizada para (m <= currentRealMinutes).');
} else {
  console.log('1. targetPastCheck não encontrado diretamente.');
}

// 2. No filterKey da grade, incluir o bloco de 30min atual para garantir que quando virar o horário (ex: às 14:00) a grade reconstrua automaticamente
const targetFilterKey = `const filterKey = courtId + '_' + dateStr + '_' + (shouldHideOccupied ? '1' : '0');`;
const replFilterKey = `const currentSlot30Block = Math.floor(((new Date()).getHours() * 60 + (new Date()).getMinutes()) / 30);
    const filterKey = courtId + '_' + dateStr + '_' + (shouldHideOccupied ? '1' : '0') + '_' + currentSlot30Block;`;

if (html.includes(targetFilterKey)) {
  html = html.replace(targetFilterKey, replFilterKey);
  console.log('2. filterKey enriquecido com bloco de 30min para invalidação automática de cache.');
} else {
  console.log('2. targetFilterKey não encontrado.');
}

// 3. Em toggleBalcaoTimeSlot, impedir seleção de slot passado se for hoje
const targetToggleSlot = `const hasExistingSelection = (startSelect.value !== '' && endSelect.value !== '');
    const clickedMin = parseTimeToMinutes(slotTime);`;

const replToggleSlot = `const hasExistingSelection = (startSelect.value !== '' && endSelect.value !== '');
    const clickedMin = parseTimeToMinutes(slotTime);

    // Validação estrita: Não permite selecionar horário igual ou anterior ao horário atual hoje
    const nowCheck = new Date();
    const curNowMins = nowCheck.getHours() * 60 + nowCheck.getMinutes();
    const isTodaySelected = (dateStr === (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')));
    if (isTodaySelected && clickedMin <= curNowMins) {
      if (typeof arenaToast === 'function') {
        arenaToast('Horário ' + slotTime + ' indisponível! Selecione um horário adiantado a partir de agora.');
      }
      return;
    }`;

if (html.includes(targetToggleSlot)) {
  html = html.replace(targetToggleSlot, replToggleSlot);
  console.log('3. toggleBalcaoTimeSlot blindado contra horários retroativos.');
} else {
  console.log('3. targetToggleSlot não encontrado.');
}

// 4. Em getBalcaoOccupiedRanges, incluir também verificação contra arena_jogos_excluidos_v1 para que cancelados não bloqueiem os slots
const targetOccupiedBookings = `(window.adminGameState.bookings || []).forEach(b => {
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (bDate === dateStr && st !== 'cancelled' && (bCourt === dbCourtId || bCourt === courtId)) {`;

const replOccupiedBookings = `let excluidosBalcao = {};
    try {
      const s = localStorage.getItem('arena_jogos_excluidos_v1');
      if (s) excluidosBalcao = JSON.parse(s);
    } catch(e) {}

    (window.adminGameState.bookings || []).forEach(b => {
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (b.id && excluidosBalcao[b.id + '_' + dateStr]) return;
      if (bDate === dateStr && st !== 'cancelled' && (bCourt === dbCourtId || bCourt === courtId)) {`;

if (html.includes(targetOccupiedBookings)) {
  html = html.replace(targetOccupiedBookings, replOccupiedBookings);
  console.log('4. getBalcaoOccupiedRanges integrado com arena_jogos_excluidos_v1.');
} else {
  console.log('4. targetOccupiedBookings não encontrado.');
}

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('public/admin.html salvo com sucesso.');
