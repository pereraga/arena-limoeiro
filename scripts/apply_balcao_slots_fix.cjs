const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf-8');

// 1. Definição da nova getBalcaoOccupiedRanges com match robusto
const oldGetOccupied = `  // Helper global para coletar ocupados da quadra/data do modal
  window.getBalcaoOccupiedRanges = function(optCourtId, optDateStr) {
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = optCourtId || (courtSelect ? courtSelect.value : 'fut7');
    const dateStr = optDateStr || (dateInput ? dateInput.value : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')));

    let dbCourtId = courtId;
    if (courtId === 'fut5') dbCourtId = 'court-esportes-de-quadra-1788962671043';
    if (courtId === 'fut6') dbCourtId = 'court-society-2';
    if (courtId === 'fut7') dbCourtId = 'court-futsal-1788963178368';
    if (courtId === 'society') dbCourtId = 'court-society-1';
    if (courtId === 'areia') dbCourtId = 'court-beach-1';
    if (courtId === 'futmesa') dbCourtId = 'court-futmesa-1';

    const dateObj = new Date(dateStr + 'T12:00:00');
    const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = daysMap[dateObj.getDay()];

    const occupiedRanges = [];

    // 1. Partidas já registradas
    let excluidosBalcao = {};
    try {
      const s = localStorage.getItem('arena_jogos_excluidos_v1');
      if (s) excluidosBalcao = JSON.parse(s);
    } catch(e) {}

    (window.adminGameState.bookings || []).forEach(b => {
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (b.id && excluidosBalcao[b.id + '_' + dateStr]) return;
      if (bDate === dateStr && st !== 'cancelled' && (bCourt === dbCourtId || bCourt === courtId)) {
        const sm = parseTimeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : ''));
        const em = parseTimeToMinutes(b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : ''));
        if (em > sm) {
          occupiedRanges.push({
            start: sm,
            end: em,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(em),
            name: b.customer_name || 'Cliente',
            type: b.booking_type === 'mensalista' ? 'Mensalista' : 'Reserva',
            status: b.status
          });
        }
      }
    });

    // 2. Mensalistas fixos deste dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase();
      const mCourt = m.court_id || m.courtId;
      const mStatus = (m.status || '').toLowerCase();
      if (mDay === dayOfWeek && mStatus !== 'inactive' && (mCourt === dbCourtId || mCourt === courtId)) {
        const sm = parseTimeToMinutes(m.start_time || m.time || '');
        const em = parseTimeToMinutes(m.end_time || '');
        const effectiveEnd = em > sm ? em : (sm + 60);
        const exists = occupiedRanges.some(r => Math.abs(r.start - sm) < 15);
        if (!exists) {
          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: m.team_name || m.responsible_name || 'Mensalista Fixo',
            type: 'Mensalista Fixo',
            status: 'confirmed'
          });
        }
      }
    });

    occupiedRanges.sort((a, b) => a.start - b.start);
    return occupiedRanges;
  };`;

const newGetOccupied = `  // Helper global para coletar ocupados da quadra/data do modal (Reservas + Mensalistas Fixos)
  window.getBalcaoOccupiedRanges = function(optCourtId, optDateStr) {
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = optCourtId || (courtSelect ? courtSelect.value : 'fut7');
    const dateStr = optDateStr || (dateInput ? dateInput.value : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-09'));

    const targetCourtObj = (typeof getCourtById === 'function') ? getCourtById(courtId) : { id: courtId, name: courtId };
    const targetCourtId = targetCourtObj.id; // ID canônico (ex: fut5, fut6, fut7, futmesa, areia, society)

    const dbCourtMapping = {
      'fut5': 'court-society-1',
      'fut6': 'court-society-2',
      'fut7': 'court-beach-1',
      'futmesa': 'court-esportes-de-quadra-1788962671043',
      'areia': 'court-beach-2',
      'society': 'court-futsal-1788963178368'
    };
    const dbCourtId = dbCourtMapping[targetCourtId] || targetCourtId;

    const isMatchingCourt = (cValue) => {
      if (!cValue) return false;
      if (cValue === targetCourtId || cValue === dbCourtId || cValue === courtId) return true;
      if (typeof getCourtById === 'function') {
        const resolved = getCourtById(cValue);
        if (resolved && (resolved.id === targetCourtId || resolved.id === courtId)) return true;
      }
      return false;
    };

    const dateObj = new Date(dateStr + 'T12:00:00');
    const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = daysMap[dateObj.getDay()];

    const occupiedRanges = [];

    // 1. Partidas já registradas em bookings
    let excluidosBalcao = {};
    try {
      const s = localStorage.getItem('arena_jogos_excluidos_v1');
      if (s) excluidosBalcao = JSON.parse(s);
    } catch(e) {}

    (window.adminGameState.bookings || []).forEach(b => {
      if (!b) return;
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (b.id && excluidosBalcao[b.id + '_' + dateStr]) return;
      if (bDate === dateStr && st !== 'cancelled' && isMatchingCourt(bCourt)) {
        const sm = parseTimeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : ''));
        const em = parseTimeToMinutes(b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : ''));
        if (em > sm) {
          occupiedRanges.push({
            start: sm,
            end: em,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(em),
            name: b.customer_name || 'Cliente',
            type: b.booking_type === 'mensalista' ? 'Mensalista' : 'Reserva',
            status: b.status
          });
        }
      }
    });

    // 2. Mensalistas fixos deste dia da semana (monthlyMembers)
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m) return;
      const rawDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase();
      const mDay = rawDay.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      const mCourt = m.court_id || m.courtId;
      const mStatus = (m.status || '').toLowerCase();
      if (mDay === dayOfWeek && mStatus !== 'inactive' && isMatchingCourt(mCourt)) {
        const sm = parseTimeToMinutes(m.start_time || m.time || '');
        const em = parseTimeToMinutes(m.end_time || '');
        const effectiveEnd = em > sm ? em : (sm + 60);
        const exists = occupiedRanges.some(r => Math.max(r.start, sm) < Math.min(r.end, effectiveEnd));
        if (!exists) {
          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: m.team_name || m.responsible_name || 'Mensalista Fixo',
            type: 'Mensalista Fixo',
            status: 'confirmed'
          });
        }
      }
    });

    // 3. Cruzamento com getMatchesForDate (garantia de espelhamento fiel com o feed de partidas do dia)
    if (typeof getMatchesForDate === 'function') {
      try {
        const dayMatches = getMatchesForDate(dateStr) || [];
        dayMatches.forEach(dm => {
          if (!dm) return;
          const dmCourt = dm.court_id || dm.courtId;
          const st = (dm.status || '').toLowerCase();
          if (st === 'cancelled') return;
          if (dm.id && excluidosBalcao[dm.id + '_' + dateStr]) return;
          if (isMatchingCourt(dmCourt)) {
            const sm = parseTimeToMinutes(dm.start_time || (dm.time ? dm.time.split(' ')[0] : ''));
            const em = parseTimeToMinutes(dm.end_time || (dm.time && dm.time.includes('às') ? dm.time.split('às')[1].trim() : ''));
            if (em > sm) {
              const already = occupiedRanges.some(r => Math.max(r.start, sm) < Math.min(r.end, em));
              if (!already) {
                occupiedRanges.push({
                  start: sm,
                  end: em,
                  startStr: formatMinutesToTime(sm),
                  endStr: formatMinutesToTime(em),
                  name: dm.customer_name || 'Partida Confirmada',
                  type: dm.isMensalista ? 'Mensalista Fixo' : 'Reserva',
                  status: dm.status || 'confirmed'
                });
              }
            }
          }
        });
      } catch(eMatches) {}
    }

    occupiedRanges.sort((a, b) => a.start - b.start);
    return occupiedRanges;
  };`;

if (!content.includes(oldGetOccupied)) {
  console.error('ERROR: oldGetOccupied not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldGetOccupied, newGetOccupied);
console.log('✓ Successfully replaced getBalcaoOccupiedRanges');

// 2. Atualizar renderBalcaoTimeSlots para checagem de data e slots passados
const oldRenderSlotsHeader = `    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));
    const currentStart = startSelect ? startSelect.value : '';
    const currentEnd = endSelect ? endSelect.value : '';
    const shouldHideOccupied = hideToggle ? hideToggle.checked : true;

    const hasActiveSelection = (currentStart !== '' && currentEnd !== '');
    const currentStartMin = hasActiveSelection ? parseTimeToMinutes(currentStart) : -1;
    const currentEndMin = hasActiveSelection ? parseTimeToMinutes(currentEnd) : -1;

    const currentSlot30Block = Math.floor(((new Date()).getHours() * 60 + (new Date()).getMinutes()) / 30);
    const filterKey = courtId + '_' + dateStr + '_' + (shouldHideOccupied ? '1' : '0') + '_' + currentSlot30Block;

    // 1. CAMINHO ULTRA-RÁPIDO: Atualização in-place dos botões existentes (0ms delay)
    if (!forceRebuild && grid.dataset.filterKey === filterKey && grid.children.length > 0) {`;

const newRenderSlotsHeader = `    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const realToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
    const dateStr = dateInput ? dateInput.value : (window.adminGameState?.selectedDate || realToday);
    const currentStart = startSelect ? startSelect.value : '';
    const currentEnd = endSelect ? endSelect.value : '';
    const shouldHideOccupied = hideToggle ? hideToggle.checked : true;

    const hasActiveSelection = (currentStart !== '' && currentEnd !== '');
    const currentStartMin = hasActiveSelection ? parseTimeToMinutes(currentStart) : -1;
    const currentEndMin = hasActiveSelection ? parseTimeToMinutes(currentEnd) : -1;

    const nowDt = new Date();
    const currentRealMinutes = (nowDt.getHours() * 60) + nowDt.getMinutes();
    const currentSlot30Block = Math.floor(currentRealMinutes / 30);
    const filterKey = courtId + '_' + dateStr + '_' + (shouldHideOccupied ? '1' : '0') + '_' + currentSlot30Block;

    // 1. CAMINHO ULTRA-RÁPIDO: Atualização in-place dos botões existentes (0ms delay)
    // Se a opção de ocultar indisponíveis estiver ativa, rebuild completo para garantir que nenhum slot passado/ocupado permaneça
    if (!forceRebuild && !shouldHideOccupied && grid.dataset.filterKey === filterKey && grid.children.length > 0) {`;

if (!content.includes(oldRenderSlotsHeader)) {
  console.error('ERROR: oldRenderSlotsHeader not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldRenderSlotsHeader, newRenderSlotsHeader);
console.log('✓ Successfully replaced renderBalcaoTimeSlots header and fast-path condition');

// 3. Atualizar a lógica do loop e isPast em renderBalcaoTimeSlots
const oldSlotCalc = `    // 2. CONSTRUÇÃO COMPLETA DA GRADE
    grid.dataset.filterKey = filterKey;

    const todayStr = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const isToday = (dateStr === todayStr);

    const now = new Date();
    const currentRealMinutes = (now.getHours() * 60) + now.getMinutes();

    // Coletar intervalos ocupados no dia para esta quadra
    const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);`;

const newSlotCalc = `    // 2. CONSTRUÇÃO COMPLETA DA GRADE
    grid.dataset.filterKey = filterKey;

    const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
    const isToday = (dateStr === sysTodayStr);
    const isPastDate = (dateStr < sysTodayStr);

    // Coletar intervalos ocupados no dia para esta quadra
    const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);`;

if (!content.includes(oldSlotCalc)) {
  console.error('ERROR: oldSlotCalc not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldSlotCalc, newSlotCalc);
console.log('✓ Successfully replaced slot calculation date setup');

const oldIsPast = `      // Regra Operacional Estrita: Se o horário atual já passou do início do slot (ex: às 14:00 em diante),
      // o slot de 14:00 é bloqueado/indisponível. Só libera horários adiantados de meia em meia hora (ex: 14:30 em diante).
      const isPast = (isToday && m <= currentRealMinutes);
      const isUnavailable = isOccupied || isPast;`;

const newIsPast = `      // Regra Operacional Estrita:
      // 1. Se a data for anterior a hoje, todos os horários já passaram.
      // 2. Se a data for hoje, qualquer horário cujo início seja menor ou igual aos minutos atuais já passou.
      // 3. Horários passados são estritamente bloqueados e NUNCA exibidos como "LIVRE".
      const isPast = isPastDate || (isToday && m <= currentRealMinutes);
      const isUnavailable = isOccupied || isPast;`;

if (!content.includes(oldIsPast)) {
  console.error('ERROR: oldIsPast not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldIsPast, newIsPast);
console.log('✓ Successfully replaced isPast calculation in renderBalcaoTimeSlots');

// 4. Corrigir findFirstAvailableSlot
const oldFindFirst = `    function findFirstAvailableSlot() {
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));

    let dbCourtId = courtId;
    if (courtId === 'fut5') dbCourtId = 'court-esportes-de-quadra-1788962671043';
    if (courtId === 'fut6') dbCourtId = 'court-society-2';
    if (courtId === 'fut7') dbCourtId = 'court-futsal-1788963178368';
    if (courtId === 'society') dbCourtId = 'court-society-1';
    if (courtId === 'areia') dbCourtId = 'court-beach-1';
    if (courtId === 'futmesa') dbCourtId = 'court-futmesa-1';

    const occupiedRanges = [];
    (window.adminGameState.bookings || []).forEach(b => {
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (bDate === dateStr && st !== 'cancelled' && (bCourt === dbCourtId || bCourt === courtId)) {
        const sm = parseTimeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : ''));
        const em = parseTimeToMinutes(b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : ''));
        if (em > sm) occupiedRanges.push({ start: sm, end: em });
      }
    });

    // Procura primeiro bloco de 1 hora livre a partir das 11:30
    for (let m = 11 * 60 + 30; m <= 22 * 60; m += 30) {
      const end = m + 60;
      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(end, r.end));
      if (!conflict) {
        return { start: formatMinutesToTime(m), end: formatMinutesToTime(end) };
      }
    }
    return { start: '19:00', end: '20:00' };
  }`;

const newFindFirst = `    function findFirstAvailableSlot() {
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const realToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
    const dateStr = dateInput ? dateInput.value : (window.adminGameState?.selectedDate || realToday);

    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges(courtId, dateStr) : [];
    const isToday = (dateStr === realToday);
    const now = new Date();
    const currentRealMinutes = (now.getHours() * 60) + now.getMinutes();

    let startSearchMin = 11 * 60 + 30;
    if (isToday) {
      // Começa da próxima meia hora futura
      startSearchMin = Math.max(startSearchMin, Math.ceil((currentRealMinutes + 1) / 30) * 30);
    }

    for (let m = startSearchMin; m <= 22 * 60; m += 30) {
      const end = m + 60;
      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(end, r.end));
      if (!conflict) {
        return { start: formatMinutesToTime(m), end: formatMinutesToTime(end) };
      }
    }
    return { start: '19:00', end: '20:00' };
  }`;

if (!content.includes(oldFindFirst)) {
  console.error('ERROR: oldFindFirst not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldFindFirst, newFindFirst);
console.log('✓ Successfully replaced findFirstAvailableSlot');

// 5. Corrigir saveDirectBooking dbCourtMapping
const oldSaveDirectCourtMapping = `    const court = getCourtById(courtId);

    // Mapeamento para o formato do banco de dados
    let dbCourtId = courtId;
    if (courtId === 'fut5') dbCourtId = 'court-esportes-de-quadra-1788962671043';
    if (courtId === 'fut6') dbCourtId = 'court-society-2';
    if (courtId === 'fut7') dbCourtId = 'court-futsal-1788963178368';
    if (courtId === 'society') dbCourtId = 'court-society-1';
    if (courtId === 'areia') dbCourtId = 'court-beach-1';
    if (courtId === 'futmesa') dbCourtId = 'court-futmesa-1';`;

const newSaveDirectCourtMapping = `    const court = getCourtById(courtId);

    // Mapeamento canônico e oficial para o formato do banco de dados Supabase
    const dbCourtMapping = {
      'fut5': 'court-society-1',
      'fut6': 'court-society-2',
      'fut7': 'court-beach-1',
      'futmesa': 'court-esportes-de-quadra-1788962671043',
      'areia': 'court-beach-2',
      'society': 'court-futsal-1788963178368'
    };
    const dbCourtId = dbCourtMapping[court.id] || court.id;`;

if (!content.includes(oldSaveDirectCourtMapping)) {
  console.error('ERROR: oldSaveDirectCourtMapping not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldSaveDirectCourtMapping, newSaveDirectCourtMapping);
console.log('✓ Successfully replaced saveDirectBooking court mapping');

// 6. Atualizar validação de clique em toggleBalcaoTimeSlot
const oldToggleValidation = `    // Validação estrita: Não permite selecionar horário igual ou anterior ao horário atual hoje
    const nowCheck = new Date();
    const curNowMins = nowCheck.getHours() * 60 + nowCheck.getMinutes();
    const sysToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : (window.adminGameState?.selectedDate || '2026-11-09');
    const isTodaySelected = (dateStr === sysToday);
    if (isTodaySelected && clickedMin <= curNowMins) {
      if (typeof arenaToast === 'function') {
        arenaToast('Horário ' + slotTime + ' indisponível! Selecione um horário adiantado a partir de agora.');
      }
      return;
    }`;

const newToggleValidation = `    // Validação estrita: Não permite selecionar horário igual ou anterior ao horário atual hoje, nem em datas passadas
    const nowCheck = new Date();
    const curNowMins = nowCheck.getHours() * 60 + nowCheck.getMinutes();
    const sysToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
    const isTodaySelected = (dateStr === sysToday);
    const isPastDateSelected = (dateStr < sysToday);
    if (isPastDateSelected || (isTodaySelected && clickedMin <= curNowMins)) {
      if (typeof arenaToast === 'function') {
        arenaToast('Horário ' + slotTime + ' indisponível porque já passou! Selecione um horário futuro.');
      }
      return;
    }`;

if (!content.includes(oldToggleValidation)) {
  console.error('ERROR: oldToggleValidation not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldToggleValidation, newToggleValidation);
console.log('✓ Successfully replaced toggleBalcaoTimeSlot validation');

// 7. Atualizar openDirectBookingModal para inicializar dateInput com realToday
const oldOpenDateInit = `    if (dateInput) {
      dateInput.value = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    }`;

const newOpenDateInit = `    if (dateInput) {
      const realTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
      dateInput.value = window.adminGameState?.selectedDate || realTodayStr;
    }`;

if (!content.includes(oldOpenDateInit)) {
  console.error('ERROR: oldOpenDateInit not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldOpenDateInit, newOpenDateInit);
console.log('✓ Successfully replaced openDirectBookingModal dateInput init');

fs.writeFileSync(path, content, 'utf-8');
console.log(' ALL UPDATES APPLIED TO public/admin.html');
