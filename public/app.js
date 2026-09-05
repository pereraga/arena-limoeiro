// Gerenciador Arena Limoeiro - Data Primeiro, Horários Disponíveis Ocultando Ocupados
let state = {
  currentStep: 1,
  currentMode: 'client',
  adminTab: 'live_dashboard',
  platform: {
    device: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    os: 'other',
    orientation: 'portrait'
  },
  adminSubTab: 'spaces',
  adminFilterDate: '2026-08-08',
  adminFilterCourt: 'all',
  adminFilterStatus: 'all',
  arenaInfo: null,
  categories: [],
  courts: [],
  products: [],
  monthlyMembers: [],
  bookings: [],
  adminUsers: [],
  supabaseCustomers: [],
  supabaseConnected: false,
  
  sortBy: 'default',
  currentUser: JSON.parse(localStorage.getItem('arena_user') || 'null'),
  bookingType: 'avulso', // 'avulso' ou 'mensalista'
  monthlyDayOfWeek: 'terca',
  
  selectedCategory: 'all',
  searchQuery: '',
  selectedCourt: null,
  
  // DATA SELECIONADA PRIMEIRO - Otimizado para Mês 8 (Agosto) conforme solicitado
  selectedDate: null, // Definido apenas ao escolher no calendário
  currentMonthDate: new Date(2026, 7, 1), // Mês 8 (Agosto)
  
  // DURAÇÃO E HORÁRIOS SELECIONADOS NA ETAPA 3
  startTime: null,
  endTime: null,
  selectedDuration: 60,
  
  productCart: {}, // Produtos guardados para o agendamento (não somam no valor online)
  
  observation: '',
  couponCode: '',
  appliedCoupon: null,
  customerName: '',
  customerPhone: '',
  paymentMethod: 'pix',
  
  slots: [], // Horários do dia com status 'available', 'booked', 'blocked_admin'
  maintenanceBlocks: JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]')
};

function getFormattedDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ==============================================================================
// 🏟️ NORMALIZADOR DE QUADRAS / ESPAÇOS (COMPATIBILIDADE SUPABASE & LOCAL)
// ==============================================================================
function normalizeCourt(c) {
  if (!c) return null;
  const price = parseFloat(c.basePricePerHour || c.base_price_per_hour || 140);
  const monthly = parseFloat(c.monthlyPrice || c.monthly_price || (price * 3.6));
  const catLabel = c.categoryLabel || c.category_label || (
    c.category === 'society' ? 'Futebol Society' :
    c.category === 'beach' ? 'Beach Tennis & Vôlei' :
    c.category === 'futsal' ? 'Ginásio Poliesportivo' :
    c.category === 'padel' ? 'Padel & Tênis' : 'Esporte'
  );
  const bookings = parseInt(c.bookingsCount || c.bookings_count || 0, 10);
  const order = parseInt(c.orderIndex || c.order_index || 1, 10);
  let specsObj = c.specs || {};
  if (typeof specsObj === 'string') {
    try { specsObj = JSON.parse(specsObj); } catch(e) { specsObj = {}; }
  }
  return {
    ...c,
    id: c.id,
    name: c.name || 'Quadra Esportiva',
    category: c.category || 'society',
    categoryLabel: catLabel,
    category_label: catLabel,
    basePricePerHour: price,
    base_price_per_hour: price,
    monthlyPrice: monthly,
    monthly_price: monthly,
    bookingsCount: bookings,
    bookings_count: bookings,
    orderIndex: order,
    order_index: order,
    specs: specsObj,
    image: c.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'
  };
}

function getCourtHourlyPrice(court) {
  if (!court) return 140;
  return parseFloat(court.basePricePerHour || court.base_price_per_hour || 140);
}

function getCourtMonthlyPrice(court) {
  if (!court) return 500;
  return parseFloat(court.monthlyPrice || court.monthly_price || (getCourtHourlyPrice(court) * 3.6));
}

function canAdvanceFromStep(step) {
  if (step === 1) {
    return !!state.selectedCourt;
  }
  if (step === 2) {
    return state.bookingType === 'mensalista' ? !!state.monthlyDayOfWeek : !!state.selectedDate;
  }
  if (step === 3) {
    if (!state.selectedCourt || !state.selectedDate || !state.startTime || !state.endTime) return false;
    const conflict = checkScheduleConflict(state.selectedCourt.id, state.selectedDate, state.startTime, state.endTime);
    return !conflict.conflict;
  }
  return true;
}


function calculateDuration() {
  const startMin = timeToMinutes(state.startTime);
  let endMin = timeToMinutes(state.endTime);
  if (endMin <= startMin) {
    endMin = startMin + 60;
    state.endTime = minutesToTime(endMin);
  }
  state.selectedDuration = endMin - startMin;
}

document.addEventListener('DOMContentLoaded', () => {
  // Carrega dados padrão imediatamente para que o site nunca fique em branco
  loadInitialData();
  initEventListeners();
  renderApp();
  requestSchedule();
  initCloudSync();
  autoAdvanceFinishedMatches();
  setInterval(autoAdvanceFinishedMatches, 30000);
});

function loadInitialData() {
  if (window.ARENA_DEFAULT_DATA) {
    const d = window.ARENA_DEFAULT_DATA;
    state.arenaInfo = d.arenaInfo;
    state.categories = d.categories;
    state.courts = (d.initialCourts || []).map(normalizeCourt);
    state.products = d.initialProducts;
    state.monthlyMembers = d.initialMonthlyMembers;
    state.adminUsers = d.initialAdmins;
    state.coupons = d.coupons;
    const localSaved = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    const cleanedLocal = localSaved.filter(b => b && b.id && !['ARENA-1001', 'ARENA-1002', 'ARENA-1004'].includes(b.id));
    if (cleanedLocal.length !== localSaved.length) {
      localStorage.setItem('arena_local_bookings', JSON.stringify(cleanedLocal));
    }
    state.bookings = cleanedLocal;
    state.maintenanceBlocks = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
    // Quadra deve ser selecionada explicitamente pelo usuário
  }
}


function initCloudSync() {
  // Sistema 100% Cloud Serverless no Vercel integrado ao Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    syncDataFromSupabase();
  }
}


// ROTINA AUTOMÁTICA: Avanço de Partidas e Liberação de Quadra ao Encerrar o Horário
async function autoAdvanceFinishedMatches() {
  const now = new Date();
  const todayStr = getFormattedDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let hasUpdates = false;
  const client = (window.ArenaSupabase && window.ArenaSupabase.isReady()) ? window.ArenaSupabase.getClient() : null;

  for (const b of (state.bookings || [])) {
    if (b.status === 'cancelled' || b.status === 'finished') continue;

    // Se for de um dia anterior, finaliza automaticamente
    if (b.date < todayStr) {
      b.status = 'finished';
      hasUpdates = true;
      if (client) {
        try { await client.from('bookings').update({ status: 'finished' }).eq('id', b.id); } catch(e) {}
      }
      continue;
    }

    // Se for do dia de hoje e o horário de término já passou
    if (b.date === todayStr) {
      const eMin = timeToMinutes(b.end_time || (b.time ? b.time.split(' às ')[1] : ''));
      if (eMin && currentMinutes >= eMin) {
        b.status = 'finished';
        hasUpdates = true;
        if (client) {
          try { await client.from('bookings').update({ status: 'finished' }).eq('id', b.id); } catch(e) {}
        }
      }
    }
  }

  if (hasUpdates) {
    const local = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    local.forEach(lb => {
      const updated = state.bookings.find(x => x.id === lb.id);
      if (updated) lb.status = updated.status;
    });
    localStorage.setItem('arena_local_bookings', JSON.stringify(local));

    if (state.currentMode === 'admin') {
      renderStepContent();
    }
    requestSchedule();
  }
}

// MOTOR ANTI-CHOQUE: Validação estrita de sobreposição e conflito de horário
function checkScheduleConflict(courtId, date, startTime, endTime, excludeBookingId = null) {
  const sMin = timeToMinutes(startTime);
  const eMin = timeToMinutes(endTime);
  if (sMin >= eMin) {
    return { conflict: true, reason: 'O horário de término deve ser posterior ao horário de início.' };
  }

  const court = (state.courts || []).find(c => c.id === courtId);
  const specs = court ? (typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {})) : {};
  if (court && (court.isMaintenance === true || court.status === 'maintenance' || specs.status === 'maintenance')) {
    return { conflict: true, reason: `O campo selecionado (${court.name}) está em manutenção preventiva geral.` };
  }

  // 1. Janela de Manutenção por Horário / Treinos Reservados
  const localMaint = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
  const allMaint = [...(state.maintenanceBlocks || []), ...localMaint];
  const maintConflict = allMaint.find(mb => {
    const mbCourtId = mb.court_id || mb.courtId;
    if (mbCourtId !== courtId || mb.date !== date) return false;
    const mbS = timeToMinutes(mb.start_time || mb.startTime);
    const mbE = timeToMinutes(mb.end_time || mb.endTime);
    return Math.max(sMin, mbS) < Math.min(eMin, mbE);
  });
  if (maintConflict) {
    return { 
      conflict: true, 
      reason: `Este horário está reservado para treino / manutenção neste campo (${maintConflict.reason || 'Treino Fechado'}).` 
    };
  }

  // 2. Mensalistas fixos naquele dia da semana
  const [y, m, d] = date.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  const monthlyConflict = (state.monthlyMembers || []).find(mm => {
    const mmCourtId = mm.court_id || mm.courtId;
    if (mmCourtId && mmCourtId !== courtId) return false;
    if ((mm.day_of_week || mm.dayOfWeek) !== currentDayOfWeek) return false;
    if (mm.status && mm.status !== 'active') return false;

    const mmS = timeToMinutes(mm.start_time || mm.startTime || mm.time);
    const mmE = timeToMinutes(mm.end_time || mm.endTime || minutesToTime(mmS + 60));
    return Math.max(sMin, mmS) < Math.min(eMin, mmE);
  });
  if (monthlyConflict) {
    return { 
      conflict: true, 
      reason: `Este horário já está reservado para o time mensalista fixo: ${(monthlyConflict.team_name || monthlyConflict.teamName)}.` 
    };
  }

  // 3. Reservas ativas no mesmo campo e data (ANTI-CHOQUE)
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const bookingMap = new Map();
  [...(state.bookings || []), ...localBookings].forEach(b => {
    if (b && b.id) bookingMap.set(b.id, b);
  });
  const allBookings = Array.from(bookingMap.values());

  const bookingConflict = allBookings.find(b => {
    const bCourtId = b.court_id || b.courtId;
    if (bCourtId !== courtId || b.date !== date) return false;
    if (b.status === 'cancelled') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;

    const bS = timeToMinutes(b.start_time || b.startTime || (b.time ? b.time.split(' ')[0] : '00:00'));
    const bE = timeToMinutes(b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : minutesToTime(bS + 60)));
    return Math.max(sMin, bS) < Math.min(eMin, bE);
  });
  if (bookingConflict) {
    const isM = bookingConflict.booking_type === 'manutencao' || bookingConflict.bookingType === 'manutencao';
    return { 
      conflict: true, 
      reason: isM ? 
        `Horário bloqueado para treino reservado ou manutenção (${bookingConflict.customer_name || bookingConflict.observation || 'Reservado'}).` :
        `Choque de agendamento evitado: O horário das ${startTime} às ${endTime} já foi reservado neste campo por ${bookingConflict.customer_name || 'outro cliente'}.`
    };
  }

  return { conflict: false };
}

function calculateLocalSchedule(courtId, date) {
  const operatingHours = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  const currentCourt = (state.courts || []).find(c => c.id === courtId);
  const courtSpecs = currentCourt ? (typeof currentCourt.specs === 'string' ? JSON.parse(currentCourt.specs || '{}') : (currentCourt.specs || {})) : {};
  const isUnderMaintenance = currentCourt && (
    currentCourt.isMaintenance === true ||
    currentCourt.status === 'maintenance' ||
    courtSpecs.status === 'maintenance'
  );

  if (isUnderMaintenance) {
    const reason = courtSpecs.maintenance_reason || currentCourt.maintenance_reason || 'Manutenção preventiva / reparos na quadra';
    return operatingHours.map(time => ({
      time,
      status: "maintenance",
      statusLabel: "Quadra em Manutenção Geral",
      isMaintenance: true,
      customerName: reason,
      isAvailable: false
    }));
  }

  const [y, m, d] = date.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  // 1. Janelas de Manutenção / Treinos Reservados por Horário
  const localMaint = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
  const allMaint = [...(state.maintenanceBlocks || []), ...localMaint];

  // 2. Bookings consolidados
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const bookingMap = new Map();
  [...(state.bookings || []), ...localBookings].forEach(b => {
    if (b && b.id) bookingMap.set(b.id, b);
  });
  const allBookings = Array.from(bookingMap.values());

  return operatingHours.map(time => {
    const slotMin = timeToMinutes(time);

    // Checagem 1: Manutenção por janela de horário neste campo
    const maintBlock = allMaint.find(mb => {
      const mbCourtId = mb.court_id || mb.courtId;
      if (mbCourtId !== courtId || mb.date !== date) return false;
      const s = timeToMinutes(mb.start_time || mb.startTime);
      const e = timeToMinutes(mb.end_time || mb.endTime);
      return slotMin >= s && slotMin < e;
    });

    if (maintBlock) {
      return {
        time,
        status: "maintenance",
        statusLabel: maintBlock.reason || "Treino Reservado / Manutenção",
        isMaintenance: true,
        customerName: maintBlock.reason || "Treino Reservado",
        isAvailable: false
      };
    }

    // Checagem 2: Mensalista fixo naquele dia da semana
    const monthlyHolder = (state.monthlyMembers || []).find(m => {
      const mCourtId = m.court_id || m.courtId;
      if (mCourtId && mCourtId !== courtId) return false;
      const day = m.day_of_week || m.dayOfWeek;
      if (day !== currentDayOfWeek) return false;
      if (m.status && m.status !== 'active') return false;

      const startTime = m.start_time || m.startTime || m.time;
      const endTime = m.end_time || m.endTime;
      if (startTime && endTime) {
        const s = timeToMinutes(startTime);
        const e = timeToMinutes(endTime);
        return slotMin >= s && slotMin < e;
      }
      return startTime === time;
    });

    if (monthlyHolder) {
      return {
        time,
        status: "booked",
        statusLabel: "Mensalista Fixo",
        isMensalista: true,
        customerName: (monthlyHolder.team_name || monthlyHolder.teamName) + " (" + (monthlyHolder.responsible_name || monthlyHolder.responsibleName) + ")",
        isAvailable: false
      };
    }

    // Checagem 3: Reservas avulsas ou treinos salvos
    const booking = allBookings.find(b => {
      const bCourtId = b.court_id || b.courtId;
      if (bCourtId !== courtId || b.date !== date) return false;
      if (b.status === 'cancelled') return false;

      const bStart = b.start_time || b.startTime || (b.time ? b.time.split(' ')[0] : null);
      const bEnd = b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : null);

      if (bStart && bEnd) {
        const s = timeToMinutes(bStart);
        const e = timeToMinutes(bEnd);
        return slotMin >= s && slotMin < e;
      }
      return bStart === time;
    });

    if (booking) {
      const isM = booking.booking_type === 'manutencao' || booking.bookingType === 'manutencao';
      return {
        time,
        status: isM ? "maintenance" : "booked",
        statusLabel: isM ? (booking.observation || "Treino Reservado / Manutenção") : "Reservado",
        isMaintenance: isM,
        isMensalista: booking.bookingType === 'mensalista' || booking.booking_type === 'mensalista',
        customerName: booking.customer_name || booking.customerName || (isM ? "Treino Reservado" : "Cliente"),
        isAvailable: false
      };
    }

    return {
      time,
      status: "available",
      statusLabel: "Livre para Agendamento",
      isAvailable: true
    };
  });
}

let isRenderingStep3 = false;

function requestSchedule() {
  if (!state.selectedCourt || !state.selectedDate) return;

  // 1. Gera e atualiza a grade localmente na hora (autônomo para Vercel)
  state.slots = calculateLocalSchedule(state.selectedCourt.id, state.selectedDate);

  // Auto-seleciona primeiro horário livre se o atual estiver ocupado ou em manutenção
  const currentSlot = (state.slots || []).find(s => s.time === state.startTime);
  if (!currentSlot || currentSlot.status !== 'available') {
    const firstAvailable = (state.slots || []).find(s => s.status === 'available');
    if (firstAvailable) {
      state.startTime = firstAvailable.time;
      const nextHourMin = timeToMinutes(firstAvailable.time) + 60;
      state.endTime = minutesToTime(nextHourMin);
      calculateDuration();
    }
  }

  if (state.currentStep === 3 && !isRenderingStep3 && document.getElementById('step3Container')) {
    renderStep3Content();
  }
  if (state.currentMode === 'admin' && state.adminTab === 'schedule') renderAdminMatrix();
}



// ==============================================================================
// 📱 MOTOR DE DETECÇÃO DE PLATAFORMA & DISPOSITIVO (MOBILE, TABLET, DESKTOP)
// ==============================================================================
function detectPlatform() {
  const width = window.innerWidth;
  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  
  // Touch detection
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

  // OS Detection
  let os = 'other';
  if (/iphone|ipad|ipod/.test(ua)) os = 'ios';
  else if (/android/.test(ua)) os = 'android';
  else if (/windows phone|windows nt/.test(ua)) os = 'windows';
  else if (/macintosh|mac os x/.test(ua)) os = 'mac';
  else if (/linux/.test(ua)) os = 'linux';

  // Device Detection: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
  let device = 'desktop';
  const isMobileUA = /mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/.test(ua);
  const isTabletUA = /ipad|android(?!.*mobile)|tablet/.test(ua);

  if (width < 640 || (isMobileUA && width < 768)) {
    device = 'mobile';
  } else if ((width >= 640 && width <= 1024) || isTabletUA) {
    device = 'tablet';
  } else {
    device = 'desktop';
  }

  const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isTouch,
    os,
    orientation,
    width,
    height: window.innerHeight
  };
}

function applyPlatformAttributes() {
  const p = detectPlatform();
  state.platform = p;

  const html = document.documentElement;
  html.setAttribute('data-device', p.device);
  html.setAttribute('data-touch', p.isTouch ? 'true' : 'false');
  html.setAttribute('data-os', p.os);
  html.setAttribute('data-orientation', p.orientation);

  html.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
  html.classList.add('is-' + p.device);

  if (p.isTouch) html.classList.add('has-touch');
  else html.classList.remove('has-touch');
}

// Inicializa e escuta redimensionamento com debounce
window.addEventListener('DOMContentLoaded', applyPlatformAttributes);
applyPlatformAttributes();

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    applyPlatformAttributes();
  }, 150);
});

window.addEventListener('orientationchange', () => {
  setTimeout(applyPlatformAttributes, 200);
});

function renderApp() {
  renderHeader();
  renderStepper();
  renderStepContent();
  renderBottomBar();
  lucide.createIcons();
}

function renderHeader() {
  const titleElem = document.getElementById('arenaTitle');
  if (titleElem && state.arenaInfo) titleElem.innerText = state.arenaInfo.name;

  const modeBtnText = document.getElementById('modeBtnText');
  if (modeBtnText) {
    modeBtnText.innerText = "Gestão";
  }
}

function renderStepper() {
  const stepperContainer = document.getElementById('stepperContainer');
  if (!stepperContainer) return;

  if (state.currentMode === 'admin') {
    stepperContainer.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between w-full bg-black/60 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl border border-emerald-500/30 gap-2">
        <div class="flex items-center space-x-2 text-xs text-emerald-300 min-w-0">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
          <span class="truncate">Painel: <strong class="text-white">${state.currentUser?.name || 'Administrador'}</strong></span>
        </div>
        <div class="flex items-center space-x-2 text-xs self-stretch sm:self-auto justify-end flex-shrink-0">
          <button onclick="switchToClientView()" class="px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold flex items-center space-x-1 whitespace-nowrap transition-all shadow-sm">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Ver Tela do Cliente</span>
          </button>
          <button onclick="logoutAdmin()" class="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-bold flex items-center space-x-1 whitespace-nowrap transition-all shadow-sm">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>
    `;
    return;
  }

  // FLUXO REORGANIZADO: ETAPA 2 DATA DO JOGO -> ETAPA 3 HORÁRIO & BAR
  const steps = [
    { num: 1, title: "Espaço / Quadra", subtitle: "Escolha o campo" },
    { num: 2, title: "Data do Jogo", subtitle: state.bookingType === 'mensalista' ? "Dia fixo da semana" : "Escolha o dia" },
    { num: 3, title: "Horário & Bar", subtitle: "Horas livres e bebidas" },
    { num: 4, title: "Resumo", subtitle: "Revise e confirme" }
  ];

  stepperContainer.innerHTML = steps.map((s, idx) => {
    const isActive = state.currentStep === s.num;
    const isCompleted = state.currentStep > s.num;
    const isClickable = s.num < state.currentStep || (s.num === 2 && state.selectedCourt);

    return `
      <div class="flex items-center flex-1 ${idx > 0 ? 'ml-2 sm:ml-4' : ''} ${isClickable ? 'cursor-pointer' : ''}" 
           onclick="${isClickable ? `goToStep(${s.num})` : ''}">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${isActive ? 'bg-white text-emerald-900 ring-4 ring-emerald-400/40 shadow-lg' : 
                        isCompleted ? 'bg-emerald-500 text-white shadow' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'}">
            ${isCompleted ? '<i data-lucide="check" class="w-4 h-4"></i>' : s.num}
          </div>
          <div class="hidden md:block text-left">
            <p class="text-sm font-bold leading-tight ${isActive ? 'text-white' : isCompleted ? 'text-emerald-200' : 'text-emerald-400/70'}">
              ${s.title}
            </p>
            <p class="text-xs ${isActive ? 'text-emerald-300 font-semibold' : 'text-emerald-400/60'}">
              ${s.subtitle}
            </p>
          </div>
        </div>
        ${idx < steps.length - 1 ? `
          <div class="flex-1 hidden sm:block mx-3 sm:mx-4 h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-emerald-900/60'}"></div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderStepContent() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  if (state.currentMode === 'admin') {
    renderAdminView(mainContent);
    return;
  }

  switch (state.currentStep) {
    case 1: renderStep1(mainContent); break;
    case 2: renderStep2(mainContent); break;
    case 3: renderStep3(mainContent); break;
    case 4: renderStep4(mainContent); break;
  }
}

// ETAPA 1: VISÃO TOTALMENTE LIMPA PARA O CLIENTE
function renderStep1(container) {
  let displayCourts = [...state.courts].filter(court => {
    const matchesCat = state.selectedCategory === 'all' || court.category === state.selectedCategory;
    const matchesSearch = court.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                          court.categoryLabel.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (state.sortBy === 'most_booked') {
    displayCourts.sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0));
  } else if (state.sortBy === 'price_asc') {
    displayCourts.sort((a, b) => a.basePricePerHour - b.basePricePerHour);
  } else if (state.sortBy === 'price_desc') {
    displayCourts.sort((a, b) => b.basePricePerHour - a.basePricePerHour);
  } else {
    displayCourts.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      

      <!-- Barra de Pesquisa Limpa -->
      <div class="relative w-full mb-6">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <i data-lucide="search" class="w-5 h-5"></i>
        </div>
        <input type="text" id="courtSearchInput" value="${state.searchQuery}" 
               placeholder="Pesquisar quadra ou campo na Arena Limoeiro..." 
               class="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 
                      focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent shadow-sm transition-all text-sm sm:text-base"
               oninput="handleSearch(this.value)">
      </div>

      <!-- Filtros por Categoria -->
      <div class="flex items-center space-x-2 overflow-x-auto scrollbar-none mb-6 pb-2">
        ${state.categories.map(cat => `
          <button onclick="selectCategory('${cat.id}')" 
                  class="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all
                         ${state.selectedCategory === cat.id ? 
                           'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 
                           'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}">
            <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i>
            <span>${cat.name}</span>
          </button>
        `).join('')}
      </div>

      <!-- Grid de Quadras / Espaços -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${displayCourts.map(court => {
          const isSelected = state.selectedCourt && state.selectedCourt.id === court.id;
          const pricePerHour = parseFloat(court.basePricePerHour || court.base_price_per_hour || 140);
          const monthlyPrice = parseFloat(court.monthlyPrice || court.monthly_price || (pricePerHour * 3.6));
          const categoryLabel = court.categoryLabel || court.category_label || "Esporte";
          const bookingsCount = court.bookingsCount || court.bookings_count || 48;
          
          let specs = court.specs || {};
          if (typeof specs === 'string') {
            try { specs = JSON.parse(specs); } catch(e) {}
          }
          const capacity = specs.capacity || '14 a 16 Jogadores (7x7 / 8x8)';
          const courtType = specs.type || 'Grama Sintética 60mm Monofilamento (FIFA Quality)';

          const defaultMensalistasMap = {
            'court-society-1': ['Pelada dos Amigos da Terça (Toda Terça 19:00)'],
            'court-society-2': ['Pelada Noturna (Segunda 20h)', 'Amigos do Society (Quinta 19h)'],
            'court-beach-1': ['Beach Club Limoeiro (Segunda e Quarta 18h)', 'Galera do Futevôlei (Sábado 08h)'],
            'court-beach-2': ['Turma do Vôlei de Areia (Domingo 09h)'],
            'court-gym-1': ['Galera do Futsal Noturno (Quinta 20h)', 'Basquete Limoeiro Team (Sábado 16h)'],
            'court-padel-1': ['Circuito Padel Limoeiro (Terça e Quinta 20h)']
          };

          const registeredMensalistas = state.monthlyMembers.filter(m => (m.courtId === court.id || m.court_id === court.id));
          const sampleList = (registeredMensalistas.length > 0) ? 
            registeredMensalistas.map(m => `${m.team_name || m.teamName} (${(m.day_of_week_label || m.dayOfWeekLabel || 'Semanal')} ${m.time})`) : 
            (court.sampleMensalistas || court.sample_mensalistas || defaultMensalistasMap[court.id] || ["Pelada dos Amigos (Terça 19h)"]);

          return `
            <div onclick="selectCourt('${court.id}')" 
                 class="court-card bg-white rounded-3xl overflow-hidden cursor-pointer relative flex flex-col ${isSelected ? 'selected ring-2 ring-emerald-500 border-2 border-emerald-500' : 'border border-slate-200'} shadow-sm">
              
              <div class="relative h-48 w-full overflow-hidden bg-slate-900">
                <img src="${court.image}" alt="${court.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'"
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span class="bg-black/80 backdrop-blur-md text-emerald-400 text-[11px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    ${categoryLabel}
                  </span>
                  ${(court.isMaintenance || (specs && specs.status === 'maintenance')) ? `
                    <span class="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-rose-400/50 shadow-md flex items-center animate-pulse">
                      <i data-lucide="wrench" class="w-3 h-3 mr-1"></i> EM MANUTENÇÃO
                    </span>
                  ` : (court.badge ? `
                    <span class="bg-emerald-800/90 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-400/30 shadow-md flex items-center">
                      ${court.badge}
                    </span>
                  ` : '')}
                </div>

                <div class="absolute bottom-2.5 left-3 text-white">
                  <span class="text-[10px] font-bold text-emerald-300 flex items-center">
                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                    ${bookingsCount} agendamentos este mês
                  </span>
                </div>
              </div>
              
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="text-base sm:text-lg font-black text-slate-900 leading-snug mb-1.5">
                    ${court.name}
                  </h3>
                  ${court.description ? `
                    <p class="text-xs text-slate-500 mb-3 line-clamp-2">${court.description}</p>
                  ` : ''}
                  <p class="text-xs text-slate-600 font-semibold mb-2 flex items-center">
                    <i data-lucide="users" class="w-3.5 h-3.5 mr-1.5 text-emerald-600"></i>
                    ${capacity}
                  </p>
                  <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 line-clamp-1">
                    ${courtType}
                  </p>
                </div>

                <div>
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span class="text-[11px] text-slate-400 font-medium block">Valor da Hora</span>
                      <div class="flex items-baseline">
                        <strong class="text-xl font-black text-emerald-700 leading-tight">R$ ${pricePerHour.toFixed(2).replace('.', ',')}</strong>
                        <span class="text-xs font-semibold text-slate-400 ml-1">/ hora</span>
                      </div>
                    </div>
                    ${(court.isMaintenance || (specs && specs.status === 'maintenance')) ? `
                      <span class="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 cursor-not-allowed">
                        <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                        <span>Em Manutenção</span>
                      </span>
                    ` : ''}
                  </div>

                  <!-- RODAPÉ DE MENSALISTAS -->
                  <div class="mt-3.5 pt-2.5 border-t border-dashed border-slate-200 bg-amber-50/50 -mx-5 -mb-5 px-4 py-2.5 rounded-b-3xl">
                    <div class="flex items-center space-x-1.5 text-[10px] font-black text-amber-900 uppercase mb-1">
                      <i data-lucide="crown" class="w-3 h-3 text-amber-600"></i>
                      <span>MENSALISTAS DESTE CAMPO:</span>
                    </div>
                    <div class="space-y-0.5">
                      ${sampleList.slice(0, 2).map(time => `
                        <div class="text-[11px] font-semibold text-slate-700 flex items-center space-x-1 truncate">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                          <span class="truncate">${time}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

function toggleBookingType() {
  state.bookingType = state.bookingType === 'mensalista' ? 'avulso' : 'mensalista';
  renderStepContent();
  renderBottomBar();
  lucide.createIcons();
}

function changeSortBy(value) {
  state.sortBy = value;
  renderStepContent();
  lucide.createIcons();
}

// ETAPA 2: DATA DO JOGO (SELECIONADA PRIMEIRO - CALENDÁRIO VISUAL DO MÊS 8 / ATUAL)
function renderStep2(container) {
  const court = state.selectedCourt;
  if (!court) {
    goToStep(1);
    return;
  }

  if (state.bookingType === 'mensalista') {
    const weekDays = [
      { id: "segunda", name: "Segunda-feira" },
      { id: "terca", name: "Terça-feira" },
      { id: "quarta", name: "Quarta-feira" },
      { id: "quinta", name: "Quinta-feira" },
      { id: "sexta", name: "Sexta-feira" },
      { id: "sabado", name: "Sábado" },
      { id: "domingo", name: "Domingo" }
    ];

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div class="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
          <div class="flex items-center space-x-3 mb-5">
            <span class="p-2.5 rounded-2xl bg-amber-100 text-amber-800 shadow-sm"><i data-lucide="crown" class="w-6 h-6"></i></span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-slate-900">Configuração do Dia do Plano Mensalista</h3>
              <p class="text-xs text-slate-500">Selecione o dia fixo da semana para o seu time jogar toda semana no mês</p>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs font-bold text-slate-700 uppercase mb-3">Escolha o Dia da Semana:</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              ${weekDays.map(w => `
                <button onclick="setMonthlyDayOfWeek('${w.id}')" 
                        class="p-4 rounded-2xl border-2 font-extrabold text-sm text-center transition-all
                               ${state.monthlyDayOfWeek === w.id ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}">
                  ${w.name}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Jogo Avulso: Calendário Visual Completo do Mês
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      
      <!-- Card da Quadra Selecionada -->
      <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-4 sm:p-6 text-white mb-6 flex items-center justify-between shadow-xl border border-emerald-800/50">
        <div class="flex items-center space-x-3.5 sm:space-x-4">
          <img src="${court.image}" class="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400/40 shadow">
          <div>
            <span class="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Campo Selecionado
            </span>
            <h2 class="text-base sm:text-xl font-black mt-1 leading-tight">${court.name}</h2>
            <p class="text-xs text-emerald-300 font-bold mt-0.5">
              R$ ${getCourtHourlyPrice(court).toFixed(2).replace('.', ',')} / hora
            </p>
          </div>
        </div>
        <button onclick="goToStep(1)" class="text-xs text-emerald-300 hover:text-white underline font-bold flex items-center flex-shrink-0 ml-2">
          <i data-lucide="edit-3" class="w-3.5 h-3.5 mr-1"></i> Trocar
        </button>
      </div>

      <!-- Card do Calendário do Mês -->
      <div class="bg-white p-4 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-2 rounded-xl bg-emerald-100 text-emerald-800"><i data-lucide="calendar" class="w-5 h-5"></i></span>
              <h3 class="text-base sm:text-lg font-black text-slate-900">
                Selecione a Data da Partida
              </h3>
            </div>
            <p class="text-xs text-slate-500 mt-1">Escolha qual dia deste mês seu time irá jogar na Arena Limoeiro</p>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-2xl text-xs font-black self-start sm:self-auto flex items-center space-x-2 shadow-sm">
            <i data-lucide="calendar-check" class="w-4 h-4 text-emerald-600"></i>
            <span>Dia Escolhido: ${state.selectedDate ? formatDisplayDate(state.selectedDate) : 'Nenhum dia selecionado'}</span>
          </div>
        </div>

        <div id="calendarWidget" class="max-w-xl mx-auto">
          ${renderCalendarHTML()}
        </div>
      </div>
    </div>
  `;

  requestSchedule();
  lucide.createIcons();
}

function setMonthlyDayOfWeek(day) {
  state.monthlyDayOfWeek = day;
  renderStepContent();
  renderBottomBar();
  lucide.createIcons();
}

// Calendário Visual Interativo Exclusivo do Mês 8 (Agosto)
function renderCalendarHTML() {
  const year = 2026;
  const month = 7; // Index 7 = Agosto (Mês 8)
  state.currentMonthDate = new Date(year, month, 1);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = 31; // Agosto tem 31 dias
  const todayStr = getFormattedDate(new Date());

  let html = `
    <!-- Cabeçalho Exclusivo do Mês 8 (Agosto) -->
    <div class="calendar-header flex items-center justify-between mb-4 pb-3.5 border-b border-slate-100">
      <div class="flex items-center space-x-2.5">
        <span class="p-2 sm:p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
          <i data-lucide="calendar" class="w-5 h-5"></i>
        </span>
        <div>
          <h4 class="text-base sm:text-lg font-black text-slate-900">
            Agosto 2026
          </h4>
          <p class="text-xs text-slate-500">Escolha o dia da sua partida</p>
        </div>
      </div>
      <div class="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-right hidden sm:block">
        <span class="text-[10px] font-bold text-emerald-700 block uppercase">Calendário</span>
        <span class="text-xs font-black text-emerald-900">Agosto 2026</span>
      </div>
    </div>

    <!-- Cabeçalho dos Dias da Semana -->
    <div class="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs font-black text-slate-500 mb-2 uppercase py-1 border-y border-slate-100">
      <div class="text-rose-500">Dom</div>
      <div>Seg</div>
      <div>Ter</div>
      <div>Qua</div>
      <div>Qui</div>
      <div>Sex</div>
      <div class="text-emerald-700">Sáb</div>
    </div>

    <!-- Grade dos 31 Dias de Agosto (Mês 8) -->
    <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
  `;

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="h-11 sm:h-12"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayStr = `${year}-08-${String(day).padStart(2, '0')}`;
    const isSelected = state.selectedDate === currentDayStr;
    const isToday = currentDayStr === todayStr;
    const dayOfWeek = new Date(year, month, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    html += `
      <button onclick="selectDate('${currentDayStr}')" 
              class="h-11 sm:h-12 w-full rounded-2xl text-xs sm:text-sm font-black transition-all flex flex-col items-center justify-center relative touch-manipulation cursor-pointer
                     ${isSelected ? 
                       'bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-300 transform scale-105 z-10' : 
                       isToday ? 
                       'border-2 border-emerald-600 text-emerald-900 font-black bg-emerald-50/70 hover:bg-emerald-100 shadow-sm' : 
                       isWeekend ?
                       'bg-slate-50 text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 font-bold' :
                       'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-100 font-bold'}">
        <span>${day}</span>
        ${isSelected ? '<span class="text-[9px] font-black uppercase tracking-wider text-emerald-100 leading-none mt-0.5">✓</span>' : 
          isToday ? '<span class="text-[9px] font-extrabold text-emerald-700 leading-none mt-0.5">Hoje</span>' : 
          isWeekend ? '<span class="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>' : ''}
      </button>
    `;
  }

  html += `</div>`;

  // Banner Informativo de Confirmação da Data Selecionada
  html += `
    <div class="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 shadow-sm">
      <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow">
        <i data-lucide="calendar-check" class="w-5 h-5"></i>
      </div>
      <div>
        <span class="text-[10px] font-black text-emerald-800 uppercase tracking-wide block">Dia Escolhido:</span>
        <strong class="text-sm sm:text-base font-black ${state.selectedDate ? 'text-emerald-950' : 'text-slate-500'} block leading-tight">
          ${state.selectedDate ? formatFullDate(state.selectedDate) : 'Nenhum dia selecionado (clique em um dia)'}
        </strong>
      </div>
    </div>

    <!-- Atalhos Rápidos de Dias em Agosto -->
    <div class="mt-4 pt-3 border-t border-slate-100">
      <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
        <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500 mr-1.5"></i>
        <span>Atalhos Rápidos de Dias em Agosto:</span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${[1, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 31].map(d => {
          const dStr = `2026-08-${String(d).padStart(2, '0')}`;
          const isSel = state.selectedDate === dStr;
          return `
            <button onclick="selectDate('${dStr}')" 
                    class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all
                           ${isSel ? 'bg-emerald-600 text-white shadow-sm font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              Dia ${d}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  return html;
}

function selectDate(dateStr) {
  state.selectedDate = dateStr;
  state.startTime = null;
  state.endTime = null;
  requestSchedule();
  renderStepContent();
  renderBottomBar();
  renderStepper();
  if (window.lucide) lucide.createIcons();
}

// ETAPA 3: HORÁRIO (OCULTANDO HORÁRIOS OCUPADOS PARA NÃO SEREM SELECIONADOS 2X) & BAR
function renderStep3(container) {
  container.innerHTML = `<div id="step3Container"></div>`;
  renderStep3Content();
}

function renderStep3Content() {
  const container = document.getElementById('step3Container');
  if (!container) return;

  const court = state.selectedCourt;
  if (!court) {
    goToStep(1);
    return;
  }
  if (!state.selectedDate && state.bookingType !== 'mensalista') {
    goToStep(2);
    return;
  }

  isRenderingStep3 = true;
  try {
    // Garante horários calculados
    requestSchedule();

  calculateDuration();
  const basePrice = getCourtHourlyPrice(court);
  const hoursFraction = (state.selectedDuration || 60) / 60;
  const courtFinalPrice = state.bookingType === 'mensalista' ? 
    getCourtMonthlyPrice(court) : 
    (basePrice * hoursFraction);

  const durationHours = Math.floor(state.selectedDuration / 60);
  const durationMins = state.selectedDuration % 60;
  const formattedDuration = durationMins > 0 ? 
    `${durationHours}h ${durationMins}min (${state.selectedDuration} minutos)` : 
    `${durationHours} ${durationHours === 1 ? 'Hora' : 'Horas'} (${state.selectedDuration} minutos)`;

  // FILTRA HORÁRIOS: OCULTA COMPLETAMENTE OS OCUPADOS PARA NÃO PODER SELECIONAR 2X
  const availableSlots = (state.slots || []).filter(s => s.status === 'available');
  const availableHourStrings = availableSlots.map(s => s.time);

  // Se não houver horários carregados ainda, gera lista padrão filtrando ocupados
  const fallbackHours = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  const validStartHours = availableHourStrings.length > 0 ? 
    availableHourStrings : 
    fallbackHours.filter(h => {
      const slot = state.slots.find(s => s.time === h);
      return !slot || slot.status === 'available';
    });

  const consumptionProducts = state.products.filter(p => p.type === 'product');

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      <!-- Cabeçalho de Confirmação da Data -->
      <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white mb-8 flex items-center justify-between shadow-xl border border-emerald-800/50">
        <div>
          <span class="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
            Data Selecionada
          </span>
          <h2 class="text-base sm:text-xl font-black mt-1">
            ${state.bookingType === 'mensalista' ? `Toda ${state.monthlyDayOfWeek}-feira` : formatFullDate(state.selectedDate)}
          </h2>
          <p class="text-xs text-emerald-300 font-bold mt-0.5">
            ${court.name} • R$ ${basePrice.toFixed(2).replace('.', ',')} / hora
          </p>
        </div>
        <button onclick="goToStep(2)" class="text-xs text-emerald-300 hover:text-white underline font-bold flex items-center">
          <i data-lucide="calendar" class="w-3.5 h-3.5 mr-1"></i> Alterar Data
        </button>
      </div>

      <!-- SELEÇÃO DE HORÁRIOS LIVRES (OCULTA OCUPADOS PARA NÃO SER SELECIONADO 2X) -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900">Horários Disponíveis (Início e Término)</h3>
            <p class="text-xs text-slate-500">Horários já agendados foram ocultados automaticamente para evitar duplicidade</p>
          </div>
        </div>

        ${validStartHours.length === 0 ? `
          <div class="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-center my-4">
            <i data-lucide="alert-circle" class="w-8 h-8 text-rose-600 mx-auto mb-2"></i>
            <h4 class="text-sm font-black text-rose-900">Nenhum horário livre nesta data</h4>
            <p class="text-xs text-rose-700 mt-1">Todos os horários deste campo já foram agendados para este dia. Por favor, volte e escolha outra data.</p>
            <button onclick="goToStep(2)" class="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow">
              Escolher Outra Data
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <!-- Hora de Início (Apenas horários livres) -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center">
                <i data-lucide="play-circle" class="w-3.5 h-3.5 text-emerald-600 mr-1.5"></i>
                Hora de Início (Horários Livres):
              </label>
              <select id="startTimeSelect" onchange="handleTimeChange(this.value, 'start')" 
                      class="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600">
                ${validStartHours.map(h => `
                  <option value="${h}" ${state.startTime === h ? 'selected' : ''}>${h} (Livre ✓)</option>
                `).join('')}
              </select>
            </div>

            <!-- Hora de Término -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center">
                <i data-lucide="stop-circle" class="w-3.5 h-3.5 text-rose-600 mr-1.5"></i>
                Hora de Término (Fim do Jogo):
              </label>
              <select id="endTimeSelect" onchange="handleTimeChange(this.value, 'end')" 
                      class="w-full p-3.5 bg-slate-50 border-2 border-slate-300 rounded-2xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600">
                ${(() => {
                  const options = [];
                  for (const durHours of [1, 1.5, 2, 3]) {
                    const endMin = timeToMinutes(state.startTime) + (durHours * 60);
                    if (endMin > timeToMinutes("23:00")) continue;
                    const endStr = minutesToTime(endMin);
                    
                    // ANTI-CHOQUE: Só exibe opções de término sem conflito de horário
                    const conflictCheck = checkScheduleConflict(court.id, state.selectedDate, state.startTime, endStr);
                    if (conflictCheck.conflict) continue;

                    options.push(`
                      <option value="${endStr}" ${state.endTime === endStr ? 'selected' : ''}>
                        ${endStr} (${durHours === 1 ? '1 hora de jogo' : durHours === 1.5 ? '1h 30min' : durHours + ' horas'})
                      </option>
                    `);
                  }
                  if (options.length === 0) {
                    const endMin = timeToMinutes(state.startTime) + 60;
                    const endStr = minutesToTime(endMin);
                    options.push(`<option value="${endStr}">${endStr} (1 hora de jogo)</option>`);
                  }
                  return options.join('');
                })()}
              </select>
            </div>
          </div>

          <!-- Quadro de Cálculo de Tempo e Valor Final -->
          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">Tempo Reservado</span>
                <span class="text-xs text-emerald-950 font-black">${state.startTime} às ${state.endTime}</span>
              </div>
              <p class="text-base sm:text-lg font-black text-slate-900 mt-1">
                ⏱️ Tempo Total: <span class="text-emerald-800">${formattedDuration}</span>
              </p>
              <p class="text-xs text-slate-600 mt-0.5">
                Cálculo: ${hoursFraction}h x R$ ${basePrice.toFixed(2)}/h
              </p>
            </div>

            <div class="text-right bg-white px-5 py-3 rounded-xl border border-emerald-300 shadow-sm w-full sm:w-auto">
              <span class="text-[11px] font-bold text-slate-400 block uppercase">Valor das Horas</span>
              <p class="text-xl sm:text-2xl font-black text-emerald-800">
                R$ ${courtFinalPrice.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        `}
      </div>

      <!-- BEBIDAS & LANCHES (GUARDAR PARA O AGENDAMENTO SEM SOMAR NO VALOR ONLINE) -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div class="flex items-center space-x-3 mb-2">
          <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900">Bebidas, Água & Lanches (Guardar para o Agendamento)</h3>
            <p class="text-xs text-slate-500">Escolha os itens que a recepção/bar irá <strong class="text-slate-800">separar e guardar gelado</strong> para o seu jogo</p>
          </div>
        </div>

        <div class="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start space-x-3 mb-5">
          <i data-lucide="info" class="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5"></i>
          <p class="text-xs text-amber-950 font-medium">
            <strong>Aviso da Arena:</strong> As bebidas e comidas selecionadas abaixo <strong>não serão somadas no valor online agora</strong>. O responsável pelo bar da Arena irá separar e guardar para entregar ao seu time no campo (pagamento direto no consumo).
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          ${consumptionProducts.map(prod => {
            const qty = state.productCart[prod.id] || 0;
            return `
              <div class="bg-slate-50/80 hover:bg-white p-3.5 rounded-2xl border ${qty > 0 ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500' : 'border-slate-200'} shadow-sm flex items-center justify-between transition-all">
                <div class="flex items-center space-x-3 overflow-hidden">
                  <img src="${prod.image}" 
                       onerror="this.src='https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80'"
                       class="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0">
                  <div class="overflow-hidden">
                    <h4 class="text-xs sm:text-sm font-extrabold text-slate-800 truncate">${prod.name}</h4>
                    <p class="text-xs font-bold text-slate-500 mt-0.5">
                      R$ ${prod.price.toFixed(2).replace('.', ',')} /${prod.unit || 'unid'} 
                      ${qty > 0 ? `<span class="text-[10px] font-black text-emerald-700 ml-1.5 bg-emerald-100 px-1.5 py-0.5 rounded">Guardar ${qty}x</span>` : ''}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-2 pl-2">
                  <button onclick="updateCartQuantity('${prod.id}', -1)" 
                          class="w-8 h-8 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm transition-all">
                    -
                  </button>
                  <span class="w-5 text-center font-black text-sm ${qty > 0 ? 'text-emerald-800 font-extrabold' : 'text-slate-800'}">${qty}</span>
                  <button onclick="updateCartQuantity('${prod.id}', 1)" 
                          class="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm transition-all">
                    +
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  lucide.createIcons();
  } finally {
    isRenderingStep3 = false;
  }
}

function handleTimeChange(val, type) {
  if (type === 'start') {
    state.startTime = val;
    const startMin = timeToMinutes(val);
    const endMin = timeToMinutes(state.endTime);
    if (endMin <= startMin) {
      state.endTime = minutesToTime(startMin + 60);
    }
  } else {
    state.endTime = val;
  }
  calculateDuration();
  renderStep3Content();
  renderBottomBar();
  lucide.createIcons();
}

function updateCartQuantity(productId, delta) {
  const current = state.productCart[productId] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete state.productCart[productId];
  else state.productCart[productId] = next;

  renderStep3Content();
  renderBottomBar();
  lucide.createIcons();
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const dayName = weekDays[dateObj.getDay()];
  return `${dayName}, ${d}/${m}/${y}`;
}

// ETAPA 4: RESUMO (VALOR ONLINE APENAS DA QUADRA + LISTA DE BEBIDAS GUARDADAS)
function renderStep4(container) {
  const court = state.selectedCourt;
  if (!court) {
    goToStep(1);
    return;
  }

  calculateDuration();
  const isMensal = state.bookingType === 'mensalista';
  const hoursFraction = state.selectedDuration / 60;
  
  // VALOR TOTAL ONLINE: APENAS O VALOR DAS HORAS DE JOGO DA QUADRA!
  const basePrice = getCourtHourlyPrice(court);
  const courtPrice = isMensal ? getCourtMonthlyPrice(court) : (basePrice * hoursFraction);

  const savedBarItems = Object.entries(state.productCart || {}).map(([prodId, qty]) => {
    if (prodId.startsWith('_') || typeof qty !== 'number' || qty <= 0) return null;
    const prod = state.products.find(p => p.id === prodId);
    return prod ? { ...prod, quantity: qty, totalEstimate: prod.price * qty } : null;
  }).filter(Boolean);

  let discountAmount = 0;
  if (state.appliedCoupon) {
    if (state.appliedCoupon.discountPercent) discountAmount = (courtPrice * state.appliedCoupon.discountPercent) / 100;
    else if (state.appliedCoupon.discountValue) discountAmount = state.appliedCoupon.discountValue;
  }
  const grandTotal = Math.max(0, courtPrice - discountAmount);

  const weekLabels = {
    domingo: "Todo Domingo", segunda: "Toda Segunda-feira", terca: "Toda Terça-feira",
    quarta: "Toda Quarta-feira", quinta: "Toda Quinta-feira", sexta: "Toda Sexta-feira", sabado: "Todo Sábado"
  };

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <h2 class="text-xl sm:text-2xl font-black text-slate-900 mb-6">Resumo do Agendamento</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <img src="${court.image}" class="w-12 h-12 rounded-xl object-cover flex-shrink-0">
          <div class="overflow-hidden">
            <span class="text-[11px] font-bold text-slate-400 block uppercase">Espaço Esportivo</span>
            <p class="text-sm font-extrabold text-slate-800 truncate">${court.name.split(' - ')[0]}</p>
            <p class="text-xs text-emerald-600 font-bold">${court.categoryLabel}</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <i data-lucide="${isMensal ? 'crown' : 'clock'}" class="w-6 h-6"></i>
          </div>
          <div class="overflow-hidden">
            <span class="text-[11px] font-bold text-slate-400 block uppercase">${isMensal ? 'Plano Mensalista' : 'Data e Horário'}</span>
            <p class="text-xs font-extrabold text-slate-800 leading-tight">
              ${isMensal ? `${weekLabels[state.monthlyDayOfWeek]} às ${state.startTime}` : `${formatDisplayDate(state.selectedDate)}, ${state.startTime} às ${state.endTime}`}
            </p>
            <p class="text-xs text-emerald-700 font-black">${isMensal ? 'Recorrente no Mês' : `${state.selectedDuration} minutos de jogo`}</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <i data-lucide="building-2" class="w-6 h-6"></i>
          </div>
          <div class="overflow-hidden">
            <span class="text-[11px] font-bold text-slate-400 block uppercase">Arena / Local</span>
            <p class="text-sm font-extrabold text-slate-800 truncate">${state.arenaInfo.name}</p>
            <p class="text-xs text-slate-500 truncate">Limoeiro / PE</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow flex-shrink-0">
            <i data-lucide="dollar-sign" class="w-6 h-6"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-400 block uppercase">Total ${isMensal ? 'Mensal' : 'das Horas de Jogo'}</span>
            <p class="text-lg font-black text-emerald-900 leading-tight">
              R$ ${grandTotal.toFixed(2).replace('.', ',')}
            </p>
            ${discountAmount > 0 ? `<span class="text-[10px] text-emerald-700 font-extrabold">Desconto aplicado!</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Tabela do Agendamento do Campo -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-800">Locação do Espaço Esportivo</h3>
          <span class="text-xs font-bold text-emerald-700">${state.startTime} às ${state.endTime} (${state.selectedDuration} min)</span>
        </div>

        <div class="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 class="text-base font-black text-slate-900">${court.name}</h4>
            <p class="text-xs text-slate-500 mt-0.5">
              ${isMensal ? '👑 Contrato Mensalista (Horário semanal com 4 jogos no mês)' : `Partida de ${state.selectedDuration} minutos (${hoursFraction}h x R$ ${basePrice.toFixed(2)}/h)`}
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs text-slate-400 block font-medium">Valor do Campo:</span>
            <p class="text-xl font-black text-emerald-900">R$ ${courtPrice.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      </div>

      <!-- Seção de Bebidas/Lanches Guardados pela Recepção/Bar -->
      ${savedBarItems.length > 0 ? `
        <div class="bg-white rounded-3xl border-2 border-amber-300 shadow-sm overflow-hidden mb-6">
          <div class="p-4 sm:p-5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="p-1.5 rounded-lg bg-amber-400 text-slate-950"><i data-lucide="package-check" class="w-4 h-4"></i></span>
              <h3 class="text-sm sm:text-base font-black text-amber-950">Itens a serem Guardados no Bar para este Jogo (${savedBarItems.length})</h3>
            </div>
            <span class="text-[11px] font-extrabold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full">
              Pagar no Bar / Consumo
            </span>
          </div>

          <div class="p-4 sm:p-5 divide-y divide-slate-100">
            ${savedBarItems.map(item => `
              <div class="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <img src="${item.image}" class="w-10 h-10 rounded-xl object-cover border border-slate-200">
                  <div>
                    <h5 class="text-xs sm:text-sm font-extrabold text-slate-900">${item.name}</h5>
                    <p class="text-[11px] text-slate-500">R$ ${item.price.toFixed(2)} cada • <strong class="text-emerald-700">${item.quantity} ${item.unit || 'unid'}</strong></p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Guardar no Freezer</span>
                  <span class="block text-xs font-bold text-slate-700 mt-0.5">Est. R$ ${item.totalEstimate.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-6">
        <label for="bookingObservation" class="block text-sm font-bold text-slate-700 mb-2">
          Observação (Nome do Time / Instruções para o Bar e Recepção)
        </label>
        <textarea id="bookingObservation" rows="2" 
                  placeholder="Ex: Nome do time para o placar, avisar para gelar os energéticos..."
                  class="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  oninput="state.observation = this.value">${state.observation}</textarea>
      </div>

      <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm mb-8">
        <label for="couponInput" class="block text-sm font-bold text-slate-700 mb-2">Cupom de Desconto</label>
        <div class="flex items-center space-x-3 max-w-md">
          <input type="text" id="couponInput" 
                 placeholder="Insira o cupom (ex: LIMOEIRO10)..." 
                 value="${state.couponCode}"
                 class="flex-1 p-3 border border-slate-200 rounded-xl text-sm uppercase font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                 oninput="state.couponCode = this.value">
          <button onclick="applyCoupon()" class="px-5 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-sm font-extrabold transition-all">
            Aplicar
          </button>
        </div>
        ${state.appliedCoupon ? `
          <div class="mt-3 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg w-fit">
            ✓ Cupom ${state.appliedCoupon.code} aplicado: ${state.appliedCoupon.description}
          </div>
        ` : ''}
      </div>

      <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-emerald-800/60 shadow-xl flex items-center justify-between text-white">
        <div>
          <span class="text-xs text-emerald-400 font-black uppercase tracking-wider block">Total a Pagar no Agendamento</span>
          <p class="text-2xl sm:text-4xl font-black text-white mt-0.5">
            R$ ${grandTotal.toFixed(2).replace('.', ',')}
          </p>
          <span class="text-xs text-emerald-300/80 font-medium block mt-1">
            ${isMensal ? '👑 Valor mensal com 4 jogos inclusos' : '⏱️ Total correspondente às horas de jogo selecionadas'}
          </span>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// AUTENTICAÇÃO E GESTÃO
function handleGestaoButtonClick() {
  if (state.currentMode === 'admin') {
    state.currentMode = 'client';
    renderApp();
  } else {
    if (state.currentUser) {
      state.currentMode = 'admin';
    state.adminTab = 'live_dashboard';
      renderApp();
    } else {
      openLoginModal(() => {
        state.currentMode = 'admin';
        renderApp();
      });
    }
  }
}

function switchToClientView() {
  state.currentMode = 'client';
  renderApp();
}

function openLoginModal(onSuccessCallback = null) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <i data-lucide="shield-check" class="w-6 h-6 text-emerald-400"></i>
            <div>
              <h3 class="text-base font-black uppercase">Acesso Restrito do Administrador</h3>
              <p class="text-xs text-emerald-300 font-medium">Faça login para modificar o sistema</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleLoginSubmit(event)" class="p-6 space-y-4">
          <div id="loginErrorMessage" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"></div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail do Administrador *</label>
            <input type="email" id="loginEmail" required placeholder="admin@arenalimoeiro.com.br" 
                   value="admin@arenalimoeiro.com.br"
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Senha de Acesso *</label>
            <input type="password" id="loginPassword" required placeholder="Digite sua senha" 
                   value="admin123"
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
          </div>

          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span class="font-bold text-slate-700 block">Credenciais pré-configuradas no sistema:</span>
            <div class="flex items-center justify-between">
              <span>👑 <strong>admin@arenalimoeiro.com.br</strong> (admin123)</span>
              <button type="button" onclick="fillLogin('admin@arenalimoeiro.com.br', 'admin123')" class="text-emerald-700 hover:underline font-bold">Usar</button>
            </div>
            <div class="flex items-center justify-between">
              <span>🏢 <strong>recepcao@arenalimoeiro.com.br</strong> (arena123)</span>
              <button type="button" onclick="fillLogin('recepcao@arenalimoeiro.com.br', 'arena123')" class="text-emerald-700 hover:underline font-bold">Usar</button>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md">Entrar na Administração</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window._onLoginSuccess = onSuccessCallback;
  lucide.createIcons();
}

function fillLogin(email, pass) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = pass;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const errorMsg = document.getElementById('loginErrorMessage');

  let authenticatedUser = null;

  // 1. Tenta verificar no Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      const { data } = await client
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (data) authenticatedUser = data;
    } catch(e) {}
  }

  // 2. Fallback de administradores pré-configurados
  if (!authenticatedUser) {
    const defaultAdmins = [
      { id: "admin-1", name: "Administrador Geral", email: "admin@arenalimoeiro.com.br", password: "admin123", role: "Administrador Geral" },
      { id: "admin-2", name: "Recepção & Atendimento", email: "recepcao@arenalimoeiro.com.br", password: "arena123", role: "Atendente da Recepção" }
    ];
    authenticatedUser = defaultAdmins.find(u => u.email === email && u.password === password);
  }

  if (authenticatedUser) {
    state.currentUser = authenticatedUser;
    localStorage.setItem('arena_user', JSON.stringify(authenticatedUser));
    closeModal();
    state.currentMode = 'admin';
    renderApp();

    if (window._onLoginSuccess) {
      window._onLoginSuccess();
      window._onLoginSuccess = null;
    }
  } else {
    if (errorMsg) {
      errorMsg.innerText = "E-mail ou senha incorretos.";
      errorMsg.classList.remove('hidden');
    }
  }
}

function logoutAdmin() {
  state.currentUser = null;
  localStorage.removeItem('arena_user');
  state.currentMode = 'client';
  renderApp();
}

// PAINEL DO ADMINISTRADOR
function renderAdminView(container) {
  const currentTab = state.adminTab || 'live_dashboard';

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      
      <!-- Cabeçalho do Painel de Controle Operacional -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div class="flex items-center space-x-3 sm:space-x-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <i data-lucide="shield-check" class="w-7 h-7 text-emerald-300"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Painel Operacional</span>
              <span class="bg-slate-100 text-slate-800 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">👤 ${state.currentUser?.name || 'Administrador'} (${state.currentUser?.role || 'Gestão'})</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">Painel de Controle da Arena Limoeiro</h2>
            <p class="text-xs text-slate-500">Controle de movimentação de jogos, manutenção de quadras, fila do bar e reservas diretas.</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button onclick="openDirectBookingModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center space-x-1.5 transition-all">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>⚡ Fazer Reserva Balcão</span>
          </button>

          <button onclick="syncDataFromSupabase().then(() => renderStepContent())" class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all" title="Atualizar dados do banco">
            <i data-lucide="refresh-cw" class="w-4 h-4 text-emerald-600"></i>
            <span class="hidden sm:inline">Atualizar</span>
          </button>

          <button onclick="switchToClientView()" class="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="eye" class="w-4 h-4 text-emerald-400"></i>
            <span>Ver como Cliente</span>
          </button>

          <button onclick="logoutAdmin()" class="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>

      <!-- Abas Principais de Operação -->
      <div class="flex items-center space-x-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto scrollbar-none">
        <button onclick="setAdminTab('live_dashboard')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${currentTab === 'live_dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="gamepad-2" class="w-4 h-4"></i>
          <span>🎮 Movimentação dos Jogos</span>
        </button>

        <button onclick="setAdminTab('courts_control')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${currentTab === 'courts_control' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="layout-grid" class="w-4 h-4"></i>
          <span>🏟️ Controle de Quadras & Manutenção (${state.courts.length})</span>
        </button>

        <button onclick="setAdminTab('bar_control')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${currentTab === 'bar_control' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="beer" class="w-4 h-4 text-amber-300"></i>
          <span>🥤 Bar, Bebidas & Comidas</span>
        </button>

        <button onclick="openDirectBookingModal()" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all">
          <i data-lucide="calendar-plus" class="w-4 h-4 text-emerald-600"></i>
          <span>⚡ Fazer Reserva Direta</span>
        </button>

        <button onclick="setAdminTab('settings')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${currentTab === 'settings' || ['spaces','positions','schedule','monthly','products','users','customers','database'].includes(currentTab) ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="settings" class="w-4 h-4"></i>
          <span>⚙️ Cadastros & Ajustes</span>
        </button>
      </div>

      <div id="adminTabContent">
        ${renderAdminTabContent()}
      </div>
    </div>
  `;

  if (state.adminTab === 'users' && state.adminUsers.length === 0) {
    loadAdminUsers();
  }

  lucide.createIcons();
}

function setAdminTab(tab) {
  state.adminTab = tab;
  renderStepContent();
  lucide.createIcons();
}

function setAdminSubTab(subTab) {
  state.adminSubTab = subTab;
  state.adminTab = 'settings';
  renderStepContent();
  lucide.createIcons();
}

function setAdminFilterDate(dateStr) {
  state.adminFilterDate = dateStr;
  renderStepContent();
  lucide.createIcons();
}

function setAdminFilterCourt(courtId) {
  state.adminFilterCourt = courtId;
  renderStepContent();
  lucide.createIcons();
}

function setAdminFilterStatus(status) {
  state.adminFilterStatus = status;
  renderStepContent();
  lucide.createIcons();
}

// 1. ABA DE MOVIMENTAÇÃO DOS JOGOS (HOJE & AO VIVO)
function renderLiveDashboardTab() {
  const selectedDate = state.adminFilterDate || getFormattedDate(new Date());
  const todayStr = getFormattedDate(new Date());
  const isSelectedDateToday = selectedDate === todayStr;

  // Calcula dia da semana
  const [y, m, d] = selectedDate.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  // Junta reservas avulsas e mensalistas do dia (sem duplicatas por ID)
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const bookingMap = new Map();
  [...(state.bookings || []), ...localBookings].forEach(b => {
    if (b && b.id) bookingMap.set(b.id, b);
  });
  const allBookings = Array.from(bookingMap.values());

  let matchesList = [];

  // Reservas avulsas confirmadas na data
  allBookings.forEach(b => {
    if (b.date === selectedDate && b.status !== 'cancelled') {
      const startT = b.start_time || b.startTime || (b.time ? b.time.split(' ')[0] : '19:00');
      const endT = b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : '20:00');
      matchesList.push({
        id: b.id,
        court_id: b.court_id || b.courtId,
        date: b.date,
        customer_name: b.customer_name || b.customerName || 'Cliente',
        customer_phone: b.customer_phone || b.customerPhone || '',
        start_time: startT,
        end_time: endT,
        time: b.time || (startT + ' às ' + endT),
        total_price: parseFloat(b.total_price || b.totalPrice || 0),
        status: b.status || 'confirmed',
        booking_type: b.booking_type || b.bookingType || 'avulso',
        payment_method: b.payment_method || b.paymentMethod || 'pix',
        product_cart: b.product_cart || b.productCart || {},
        observation: b.observation || ''
      });
    }
  });

  // Mensalistas fixos do dia da semana
  (state.monthlyMembers || []).forEach(m => {
    const day = m.day_of_week || m.dayOfWeek;
    if (day === currentDayOfWeek && (!m.status || m.status === 'active')) {
      const startT = m.start_time || m.startTime || m.time || '19:00';
      const endT = m.end_time || m.endTime || '20:00';
      
      // Evita duplicata se já existir booking gerado para o mensalista
      const alreadyHas = matchesList.some(b => b.court_id === (m.court_id || m.courtId) && b.start_time === startT);
      if (!alreadyHas) {
        matchesList.push({
          id: 'monthly-' + m.id,
          court_id: m.court_id || m.courtId,
          date: selectedDate,
          customer_name: (m.team_name || m.teamName) + ' (' + (m.responsible_name || m.responsibleName) + ')',
          customer_phone: m.phone || '',
          start_time: startT,
          end_time: endT,
          time: m.time || (startT + ' às ' + endT),
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4,
          status: 'confirmed',
          booking_type: 'mensalista',
          isMensalista: true,
          payment_method: 'mensalidade',
          product_cart: {},
          observation: 'Mensalista semanal fixo'
        });
      }
    }
  });

  // Cálculos de Tempo Real (Ao Vivo)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  matchesList.forEach(m => {
    const sMin = timeToMinutes(m.start_time);
    const eMin = timeToMinutes(m.end_time);

    if (isSelectedDateToday && m.status !== 'cancelled') {
      if (m.status === 'in_progress' || (currentMinutes >= sMin && currentMinutes < eMin && m.status !== 'finished')) {
        m.isLive = true;
      } else if (currentMinutes >= eMin || m.status === 'finished') {
        m.isPast = true;
      } else {
        m.isUpcoming = true;
      }
    } else if (selectedDate < todayStr) {
      m.isPast = true;
    } else {
      m.isUpcoming = true;
    }
  });

  // Métricas do Topo
  const totalMatchesToday = matchesList.length;
  const liveCount = matchesList.filter(m => m.isLive).length;
  const totalRevenue = matchesList.reduce((acc, m) => acc + (m.total_price || 0), 0);
  
  // Pedidos de Bar Pendentes
  let pendingBarCount = 0;
  matchesList.forEach(m => {
    const cart = m.product_cart || {};
    const hasItems = Object.keys(cart).filter(k => !k.startsWith('_')).some(k => cart[k] > 0);
    const barStatus = cart._status || m.bar_status || 'waiting';
    if (hasItems && barStatus !== 'delivered') pendingBarCount++;
  });

  // Filtros aplicados
  let filteredMatches = [...matchesList];
  if (state.adminFilterCourt && state.adminFilterCourt !== 'all') {
    filteredMatches = filteredMatches.filter(m => m.court_id === state.adminFilterCourt);
  }
  if (state.adminFilterStatus && state.adminFilterStatus !== 'all') {
    if (state.adminFilterStatus === 'live') {
      filteredMatches = filteredMatches.filter(m => m.isLive);
    } else if (state.adminFilterStatus === 'upcoming') {
      filteredMatches = filteredMatches.filter(m => m.isUpcoming);
    } else if (state.adminFilterStatus === 'finished') {
      filteredMatches = filteredMatches.filter(m => m.isPast || m.status === 'finished');
    }
  }

  // Ordena por horário de início
  filteredMatches.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  return `
    <div class="space-y-6">
      
      <!-- Cards de Métricas (KPIs Operacionais) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <i data-lucide="calendar-check" class="w-6 h-6 text-emerald-700"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Jogos Agendados</span>
            <div class="text-xl sm:text-2xl font-black text-slate-900">${totalMatchesToday} <span class="text-xs font-normal text-slate-500">partidas</span></div>
          </div>
        </div>

        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <span class="relative flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Ao Vivo Agora</span>
            <div class="text-xl sm:text-2xl font-black text-emerald-700">${liveCount} <span class="text-xs font-normal text-slate-500">em jogo</span></div>
          </div>
        </div>

        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <i data-lucide="dollar-sign" class="w-6 h-6 text-emerald-700"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Faturamento Previsto</span>
            <div class="text-lg sm:text-xl font-black text-slate-900">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>

        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center flex-shrink-0">
            <i data-lucide="beer" class="w-6 h-6 text-cyan-700"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Bar & Bebidas</span>
            <div class="text-xl sm:text-2xl font-black text-cyan-800">${pendingBarCount} <span class="text-xs font-normal text-slate-500">a entregar</span></div>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros e Controle de Data -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-black uppercase text-slate-700 mr-1 flex items-center">
            <i data-lucide="calendar" class="w-4 h-4 text-emerald-600 mr-1"></i> Data:
          </span>
          <button onclick="setAdminFilterDate(getFormattedDate(new Date()))" 
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedDate === todayStr ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            Hoje
          </button>
          <button onclick="setAdminFilterDate(getFormattedDate(new Date(Date.now() + 86400000)))" 
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedDate === getFormattedDate(new Date(Date.now() + 86400000)) ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            Amanhã
          </button>
          <button onclick="setAdminFilterDate(getFormattedDate(new Date(Date.now() - 86400000)))" 
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedDate === getFormattedDate(new Date(Date.now() - 86400000)) ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            Ontem
          </button>
          <input type="date" value="${selectedDate}" onchange="setAdminFilterDate(this.value)" 
                 class="p-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Filtro por Quadra -->
          <select onchange="setAdminFilterCourt(this.value)" class="p-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600">
            <option value="all" ${state.adminFilterCourt === 'all' ? 'selected' : ''}>🏟️ Todas as Quadras</option>
            ${state.courts.map(c => `<option value="${c.id}" ${state.adminFilterCourt === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>

          <!-- Filtro por Status -->
          <select onchange="setAdminFilterStatus(this.value)" class="p-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600">
            <option value="all" ${state.adminFilterStatus === 'all' ? 'selected' : ''}>Todos os Status</option>
            <option value="live" ${state.adminFilterStatus === 'live' ? 'selected' : ''}>🟢 Ao Vivo Agora</option>
            <option value="upcoming" ${state.adminFilterStatus === 'upcoming' ? 'selected' : ''}>🔵 Próximos Jogos</option>
            <option value="finished" ${state.adminFilterStatus === 'finished' ? 'selected' : ''}>✅ Finalizados</option>
          </select>

          <button onclick="openDirectBookingModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>+ Nova Reserva</span>
          </button>
        </div>
      </div>

      <!-- Feed / Tabela de Partidas -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 class="text-base font-black text-slate-800 flex items-center">
            <i data-lucide="list-ordered" class="w-5 h-5 text-emerald-600 mr-2"></i>
            Partidas Programadas para ${formatDisplayDate(selectedDate)}
          </h3>
          <span class="text-xs text-slate-500 font-semibold">${filteredMatches.length} jogos listados</span>
        </div>

        ${filteredMatches.length === 0 ? `
          <div class="text-center py-12 px-4">
            <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="calendar" class="w-8 h-8"></i>
            </div>
            <h4 class="text-sm sm:text-base font-black text-slate-800">Nenhum jogo agendado para esta data</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Aproveite para cadastrar uma nova reserva de balcão ou chamada do WhatsApp.</p>
            <button onclick="openDirectBookingModal()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center space-x-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Fazer Reserva Direta Agora</span>
            </button>
          </div>
        ` : `
          <div class="space-y-3.5">
            ${filteredMatches.map(match => {
              const court = state.courts.find(c => c.id === match.court_id) || { name: 'Quadra Esportiva', image: '/logo.jpg', categoryLabel: 'Esporte' };
              const cleanPhone = (match.customer_phone || '').replace(/\D/g, '');
              const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent('Olá ' + match.customer_name + '! Falamos da Arena Limoeiro sobre o seu jogo agendado para hoje (' + match.time + ') na ' + court.name + '.')}`;

              // Análise de Bebidas do Bar
              const cart = match.product_cart || {};
              const productKeys = Object.keys(cart).filter(k => !k.startsWith('_'));
              const itemsList = productKeys.map(k => {
                const prod = state.products.find(p => p.id === k);
                const q = cart[k];
                return q > 0 ? `${q}x ${prod ? prod.name : k}` : null;
              }).filter(Boolean);

              const barStatus = cart._status || match.bar_status || 'waiting';
              const barStatusBadges = {
                waiting: { label: 'Aguardando Separação', class: 'bg-amber-100 text-amber-800 border-amber-300', icon: 'clock' },
                chilling: { label: 'Gelando no Freezer', class: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: 'thermometer-snowflake' },
                delivered: { label: 'Entregue na Quadra', class: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: 'check-circle' }
              };
              const currentBarBadge = barStatusBadges[barStatus] || barStatusBadges.waiting;

              return `
                <div class="p-4 sm:p-5 rounded-2xl border ${match.isLive ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white'} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300">
                  
                  <div class="flex items-start space-x-3.5 flex-1">
                    <div class="flex flex-col items-center justify-center p-2.5 rounded-xl ${match.isLive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'} font-black min-w-[75px] text-center flex-shrink-0">
                      <span class="text-xs uppercase">${match.start_time}</span>
                      <span class="text-[10px] font-medium opacity-80">até ${match.end_time}</span>
                    </div>

                    <div class="space-y-1 flex-1">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          🏟️ ${court.name}
                        </span>
                        ${match.isMensalista ? `
                          <span class="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md flex items-center">
                            <i data-lucide="crown" class="w-3 h-3 text-amber-600 mr-1"></i> Mensalista
                          </span>
                        ` : `
                          <span class="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Avulso
                          </span>
                        `}
                        ${match.isLive ? `
                          <span class="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400 flex items-center animate-pulse">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span> AO VIVO AGORA
                          </span>
                        ` : (match.status === 'finished' ? `
                          <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">✓ Finalizado</span>
                        ` : `
                          <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Agendado</span>
                        `)}
                      </div>

                      <h4 class="text-sm sm:text-base font-black text-slate-900 leading-snug">
                        ${match.customer_name}
                      </h4>

                      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        ${match.customer_phone ? `
                          <a href="${whatsappUrl}" target="_blank" class="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                            <span>${match.customer_phone} (Chamar no Zap)</span>
                          </a>
                        ` : ''}
                        <span>Valor: <strong class="text-slate-900">R$ ${match.total_price.toFixed(2).replace('.', ',')}</strong></span>
                      </div>

                      <!-- Itens do Bar Reservados -->
                      ${itemsList.length > 0 ? `
                        <div class="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                          <span class="text-[11px] font-bold text-slate-700 flex items-center">
                            <i data-lucide="beer" class="w-3.5 h-3.5 text-amber-500 mr-1"></i>
                            ${itemsList.join(', ')}
                          </span>
                          <button onclick="cycleBarStatus('${match.id}')" 
                                  class="text-[10px] font-black px-2 py-0.5 rounded-full border ${currentBarBadge.class} flex items-center space-x-1 hover:opacity-80 transition-all" title="Clique para avançar o status">
                            <span>${currentBarBadge.label}</span>
                            <i data-lucide="chevron-right" class="w-2.5 h-2.5"></i>
                          </button>
                        </div>
                      ` : `
                        <div class="mt-1">
                          <button onclick="openAddBarItemsModal('${match.id}')" class="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-1">
                            <i data-lucide="plus" class="w-3 h-3"></i>
                            <span>+ Reservar Bebidas Geladas / Bar</span>
                          </button>
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Botões de Ação do Jogo -->
                  <div class="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                    ${match.isLive ? `
                      <button onclick="updateMatchStatus('${match.id}', 'finished')" class="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black shadow flex items-center space-x-1 transition-all">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        <span>Finalizar</span>
                      </button>
                    ` : (match.status !== 'finished' ? `
                      <button onclick="updateMatchStatus('${match.id}', 'in_progress')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow flex items-center space-x-1 transition-all">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i>
                        <span>Iniciar Jogo</span>
                      </button>
                    ` : '')}

                    <button onclick="openAddBarItemsModal('${match.id}')" class="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-all" title="Adicionar Bebidas/Produtos">
                      <i data-lucide="beer" class="w-4 h-4"></i>
                    </button>

                    <button onclick="handleCancelBooking('${match.id}')" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Cancelar Agendamento">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

    </div>
  `;
}

// 2. ABA DE CONTROLE DE QUADRAS & MANUTENÇÃO
function renderCourtsControlTab() {
  const localMaint = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
  const allMaint = [...(state.maintenanceBlocks || []), ...localMaint];
  const uniqueMaint = [];
  const mIds = new Set();
  allMaint.forEach(m => {
    if (m && m.id && !mIds.has(m.id)) {
      mIds.add(m.id);
      uniqueMaint.push(m);
    }
  });

  return `
    <div class="space-y-6">
      
      <!-- Cabeçalho explicativo com botões de ação rápida -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="p-1.5 rounded-lg bg-emerald-100 text-emerald-800"><i data-lucide="wrench" class="w-5 h-5"></i></span>
            <h3 class="text-lg font-black text-slate-900">Monitor de Quadras, Treinos Reservados & Manutenção</h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">Defina horários de início e término para treinos reservados ou manutenção pontual sem comprometer os demais horários nem as outras quadras.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2">
          <button onclick="openMaintenanceModal()" class="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="clock" class="w-4 h-4"></i>
            <span>+ Agendar Treino / Manutenção (com Horário)</span>
          </button>
          <button onclick="openCourtModal()" class="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Nova Quadra</span>
          </button>
        </div>
      </div>

      <!-- Grid com as 6 Quadras -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${state.courts.map(court => {
          const specs = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
          const isUnderMaint = court.isMaintenance === true || court.status === 'maintenance' || specs.status === 'maintenance';
          const maintReason = specs.maintenance_reason || court.maintenance_reason || 'Manutenção preventiva';

          // Checa se há treinos reservados hoje nesta quadra
          const todayStr = state.adminFilterDate || state.selectedDate || getFormattedDate(new Date());
          const courtMaintToday = uniqueMaint.filter(mb => (mb.court_id || mb.courtId) === court.id && mb.date === todayStr);

          // Checa se há jogo rolando agora nesta quadra
          const now = new Date();
          const currentMin = now.getHours() * 60 + now.getMinutes();

          const liveBooking = (state.bookings || []).find(b => {
            if ((b.court_id || b.courtId) !== court.id || b.date !== todayStr || b.status === 'cancelled') return false;
            const sMin = timeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : '19:00'));
            const eMin = timeToMinutes(b.end_time || (b.time ? b.time.split(' às ')[1] : '20:00'));
            return (b.status === 'in_progress' || (currentMin >= sMin && currentMin < eMin && b.status !== 'finished'));
          });

          // Busca a próxima partida agendada para este campo hoje
          const nextBooking = (state.bookings || [])
            .filter(b => (b.court_id || b.courtId) === court.id && b.date === todayStr && b.status !== 'cancelled' && b.status !== 'finished')
            .map(b => ({
              ...b,
              sMin: timeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : '19:00'))
            }))
            .filter(b => b.sMin >= currentMin)
            .sort((a, b) => a.sMin - b.sMin)[0];

          return `
            <div class="bg-white rounded-3xl overflow-hidden border ${isUnderMaint ? 'border-rose-300 ring-2 ring-rose-500/20 shadow-md' : 'border-slate-200 shadow-sm'} flex flex-col justify-between">
              
              <div>
                <div class="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img src="${court.image}" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span class="bg-black/80 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      ${court.categoryLabel || court.category_label || 'Esporte'}
                    </span>
                    ${isUnderMaint ? `
                      <span class="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-rose-400 shadow-md flex items-center animate-pulse">
                        <i data-lucide="alert-triangle" class="w-3 h-3 mr-1"></i> EM MANUTENÇÃO GERAL
                      </span>
                    ` : (courtMaintToday.length > 0 ? `
                      <span class="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center">
                        <i data-lucide="clock" class="w-3 h-3 mr-1"></i> ${courtMaintToday.length} TREINO(S) RESERVADO(S) HOJE
                      </span>
                    ` : (liveBooking ? `
                      <span class="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center animate-pulse">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-950 mr-1"></span> EM JOGO AGORA
                      </span>
                    ` : (nextBooking ? `
                      <span class="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center">
                        <i data-lucide="clock" class="w-3 h-3 mr-1"></i> PRÓXIMO: ${nextBooking.start_time || (nextBooking.time ? nextBooking.time.split(' ')[0] : '')}
                      </span>
                    ` : `
                      <span class="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center">
                        ✓ DISPONÍVEL
                      </span>
                    `)))}
                  </div>

                  <div class="absolute bottom-2.5 left-3 text-white">
                    <h3 class="text-base font-black leading-tight">${court.name}</h3>
                  </div>
                </div>

                <div class="p-5 space-y-3">
                  ${isUnderMaint ? `
                    <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      <div class="font-black flex items-center mb-0.5">
                        <i data-lucide="wrench" class="w-4 h-4 text-rose-600 mr-1.5"></i>
                        Quadra Interditada o Dia Inteiro
                      </div>
                      <p class="font-medium text-[11px] text-rose-700">Motivo: <strong>${maintReason}</strong></p>
                    </div>
                  ` : (courtMaintToday.length > 0 ? `
                    <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                      <div class="font-black flex items-center text-amber-900">
                        <i data-lucide="clock" class="w-4 h-4 text-amber-700 mr-1.5"></i>
                        Treinos Reservados / Bloqueios nesta data:
                      </div>
                      ${courtMaintToday.map(mb => `
                        <p class="text-[11px] text-amber-800 font-semibold">• ${mb.start_time} às ${mb.end_time}: ${mb.reason}</p>
                      `).join('')}
                      <p class="text-[10px] text-emerald-700 font-bold pt-1">Demais horários continuam livres para clientes.</p>
                    </div>
                  ` : (liveBooking ? `
                    <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <div class="font-black flex items-center mb-0.5">
                        <span class="w-2 h-2 rounded-full bg-amber-600 mr-1.5 animate-ping"></span>
                        Partida ao Vivo em Andamento
                      </div>
                      <p class="font-medium text-[11px] text-amber-800">${liveBooking.customer_name || liveBooking.customerName} (${liveBooking.time})</p>
                    </div>
                  ` : `
                    <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                      <div class="font-black flex items-center mb-0.5">
                        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 mr-1.5"></i>
                        Quadra 100% Operacional
                      </div>
                      <p class="font-medium text-[11px] text-emerald-700">Clientes podem agendar normalmente no site.</p>
                    </div>
                  `))}

                  <div class="text-xs text-slate-600 space-y-1.5 pt-1">
                    <p class="flex items-center"><i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400 mr-1.5"></i> Piso: ${specs.surface || specs.type || 'Oficial de Alto Desempenho'}</p>
                    <p class="flex items-center"><i data-lucide="users" class="w-3.5 h-3.5 text-slate-400 mr-1.5"></i> ${specs.capacity || '14 a 16 Jogadores'}</p>
                    <p class="flex items-center"><i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-slate-400 mr-1.5"></i> R$ ${(court.basePricePerHour || court.base_price_per_hour || 140).toFixed(2).replace('.', ',')}/hora</p>
                  </div>
                </div>
              </div>

              <!-- Botões de Ação por Campo -->
              <div class="p-5 pt-0 space-y-2">
                <button onclick="openMaintenanceModal('${court.id}')" 
                        class="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all">
                  <i data-lucide="clock" class="w-4 h-4 text-rose-600"></i>
                  <span>Agendar Treino / Manutenção (com Horário)</span>
                </button>

                <div class="flex items-center space-x-2">
                  ${isUnderMaint ? `
                    <button onclick="setCourtMaintenance('${court.id}', false)" 
                            class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all">
                      <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                      <span>Liberar Dia</span>
                    </button>
                  ` : `
                    <button onclick="setCourtMaintenance('${court.id}', true, 'Interdição geral da quadra')" 
                            class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all">
                      <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i>
                      <span>Fechar Dia</span>
                    </button>
                  `}
                  
                  <button onclick="setAdminTab('schedule')" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span>Ver Grade</span>
                  </button>
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <!-- SEÇÃO EXCLUSIVA: LISTA DE TREINOS RESERVADOS E BLOQUEIOS POR HORÁRIO -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-1.5 rounded-lg bg-rose-100 text-rose-800"><i data-lucide="calendar-clock" class="w-4 h-4"></i></span>
              <h4 class="text-base font-black text-slate-900">Treinos Reservados & Janelas de Manutenção Agendadas</h4>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Estes horários ficam 100% bloqueados no site para que nenhum cliente agende por engano. Os demais horários continuam disponíveis.</p>
          </div>

          <button onclick="openMaintenanceModal()" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-sm flex items-center space-x-1.5 self-start sm:self-auto">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>+ Novo Horário Bloqueado</span>
          </button>
        </div>

        ${uniqueMaint.length === 0 ? `
          <div class="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <i data-lucide="check-circle" class="w-8 h-8 text-emerald-600 mx-auto mb-2"></i>
            <h5 class="text-sm font-bold text-slate-800">Nenhum treino reservado ou manutenção pontual cadastrada</h5>
            <p class="text-xs text-slate-500 mt-0.5">Todas as quadras estão liberadas para os clientes agendarem nos horários sem partidas.</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th class="p-3">Campo / Quadra</th>
                  <th class="p-3">Data</th>
                  <th class="p-3">Horário Bloqueado</th>
                  <th class="p-3">Finalidade / Motivo</th>
                  <th class="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${uniqueMaint.map(mb => {
                  const c = state.courts.find(x => x.id === (mb.court_id || mb.courtId));
                  return `
                    <tr class="hover:bg-slate-50/70 transition-colors">
                      <td class="p-3 font-bold text-slate-900">
                        <span class="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200 mr-1.5">
                          ${c ? c.categoryLabel : 'Quadra'}
                        </span>
                        ${c ? c.name : mb.court_id}
                      </td>
                      <td class="p-3 font-bold text-slate-700">${formatDisplayDate(mb.date)}</td>
                      <td class="p-3 font-black text-rose-700">
                        <span class="inline-flex items-center px-2 py-1 rounded-lg bg-rose-50 border border-rose-200">
                          <i data-lucide="clock" class="w-3 h-3 mr-1 text-rose-600"></i>
                          ${mb.start_time} às ${mb.end_time}
                        </span>
                      </td>
                      <td class="p-3 text-slate-800 font-medium">${mb.reason || 'Treino Reservado'}</td>
                      <td class="p-3 text-right">
                        <button onclick="deleteMaintenanceBlock('${mb.id}')" 
                                class="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-bold border border-slate-200 hover:border-rose-300 transition-all inline-flex items-center space-x-1"
                                title="Liberar horário para clientes">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          <span>Liberar Horário</span>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

    </div>
  `;
}

// 3. ABA DE CONTROLE DE BEBIDAS, COMIDAS & BAR
function renderBarControlTab() {
  const selectedDate = state.adminFilterDate || getFormattedDate(new Date());

  // Encontra todas as reservas com pedidos no bar
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const bookingMap = new Map();
  [...(state.bookings || []), ...localBookings].forEach(b => {
    if (b && b.id) bookingMap.set(b.id, b);
  });
  const allBookings = Array.from(bookingMap.values());

  const barOrders = allBookings.filter(b => {
    if (b.status === 'cancelled') return false;
    const cart = b.product_cart || b.productCart || {};
    return Object.keys(cart).filter(k => !k.startsWith('_')).some(k => cart[k] > 0);
  });

  return `
    <div class="space-y-6">
      
      <!-- Cabeçalho do Bar -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="p-1.5 rounded-lg bg-cyan-100 text-cyan-800"><i data-lucide="beer" class="w-5 h-5"></i></span>
            <h3 class="text-lg font-black text-slate-900">Fila de Pedidos do Bar (Bebidas & Alimentos)</h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">Gerencie a separação de baldes de cerveja, gelo, água e petiscos para serem entregues gelados nas quadras.</p>
        </div>

        <div class="flex items-center space-x-2">
          <button onclick="openProductModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Novo Produto / Bebida</span>
          </button>
        </div>
      </div>

      <!-- Fila de Pedidos para os Jogos -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h4 class="text-sm font-black uppercase text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center">
          <i data-lucide="list-checks" class="w-4 h-4 text-emerald-600 mr-2"></i>
          Pedidos de Bebidas Vinculados aos Jogos (${barOrders.length})
        </h4>

        ${barOrders.length === 0 ? `
          <div class="text-center py-10 px-4">
            <div class="w-16 h-16 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="beer" class="w-8 h-8"></i>
            </div>
            <h4 class="text-sm sm:text-base font-black text-slate-800">Nenhum pedido de bar pendente</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Quando os clientes reservarem bebidas no agendamento ou no balcão, elas aparecerão aqui na fila de gelamento.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${barOrders.map(order => {
              const court = state.courts.find(c => c.id === (order.court_id || order.courtId)) || { name: 'Quadra' };
              const cart = order.product_cart || order.productCart || {};
              const currentStatus = cart._status || order.bar_status || 'waiting';

              const productKeys = Object.keys(cart).filter(k => !k.startsWith('_'));
              let subtotal = 0;

              return `
                <div class="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                      <span class="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        🏟️ ${court.name}
                      </span>
                      <span class="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        ${order.date} às ${order.time}
                      </span>
                    </div>

                    <h4 class="text-base font-black text-slate-900">${order.customer_name || order.customerName}</h4>
                    <p class="text-xs text-slate-500 mb-3">${order.customer_phone || order.customerPhone || ''}</p>

                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <span class="text-[10px] font-black uppercase text-slate-500 block mb-1">Itens Reservados para o Jogo:</span>
                      ${productKeys.map(k => {
                        const prod = state.products.find(p => p.id === k) || { name: k, price: 0 };
                        const q = cart[k];
                        const itemTotal = prod.price * q;
                        subtotal += itemTotal;
                        return q > 0 ? `
                          <div class="flex items-center justify-between text-xs font-medium text-slate-800">
                            <span class="flex items-center">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                              ${q}x ${prod.name}
                            </span>
                            <span class="font-bold">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
                          </div>
                        ` : '';
                      }).join('')}
                      <div class="pt-2 border-t border-slate-200 flex justify-between text-xs font-black text-slate-900">
                        <span>Total Consumação:</span>
                        <span class="text-emerald-700">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Workflow em 3 etapas de Entrega -->
                  <div>
                    <span class="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Status de Separação / Entrega:</span>
                    <div class="grid grid-cols-3 gap-1.5 text-center">
                      <button onclick="updateBarStatus('${order.id}', 'waiting')" 
                              class="p-2 rounded-xl text-[11px] font-bold border transition-all ${currentStatus === 'waiting' ? 'bg-amber-100 border-amber-400 text-amber-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                        ⏳ Separação
                      </button>
                      <button onclick="updateBarStatus('${order.id}', 'chilling')" 
                              class="p-2 rounded-xl text-[11px] font-bold border transition-all ${currentStatus === 'chilling' ? 'bg-cyan-100 border-cyan-400 text-cyan-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                        ❄️ No Freezer
                      </button>
                      <button onclick="updateBarStatus('${order.id}', 'delivered')" 
                              class="p-2 rounded-xl text-[11px] font-bold border transition-all ${currentStatus === 'delivered' ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                        ✓ Entregue
                      </button>
                    </div>

                    <div class="mt-2.5 flex justify-end">
                      <button onclick="openAddBarItemsModal('${order.id}')" class="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>+ Adicionar Mais Itens</span>
                      </button>
                    </div>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Cardápio e Estoque de Bebidas/Comidas -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-sm font-black uppercase text-slate-800">Cardápio de Bebidas & Produtos Cadastrados (${state.products.length})</h4>
            <p class="text-xs text-slate-500">Itens disponíveis para os clientes comprarem na hora do agendamento ou consumirem na quadra.</p>
          </div>
          <button onclick="openProductModal()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>+ Adicionar</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${state.products.map(p => `
            <div class="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover border border-slate-100">
                <div>
                  <h5 class="text-xs font-extrabold text-slate-900 line-clamp-1">${p.name}</h5>
                  <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">${p.category}</span>
                  <p class="text-sm font-black text-slate-900 mt-1">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              <button onclick="deleteProduct('${p.id}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// 4. ROTEADOR DE ABAS DA ADMINISTRAÇÃO
function renderAdminTabContent() {
  const currentTab = state.adminTab || 'live_dashboard';

  if (currentTab === 'live_dashboard') {
    return renderLiveDashboardTab();
  }

  if (currentTab === 'courts_control') {
    return renderCourtsControlTab();
  }

  if (currentTab === 'bar_control') {
    return renderBarControlTab();
  }

  // Se for 'settings' ou uma das abas técnicas legadas:
  const activeSubTab = state.adminSubTab || (['spaces','positions','schedule','monthly','products','users','customers','database'].includes(currentTab) ? currentTab : 'spaces');

  return `
    <div class="space-y-6">
      
      <!-- Sub-navegação de Cadastros -->
      <div class="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button onclick="setAdminSubTab('spaces')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'spaces' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Espaços / Quadras
        </button>
        <button onclick="setAdminSubTab('positions')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'positions' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Posições dos Jogos
        </button>
        <button onclick="setAdminSubTab('schedule')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'schedule' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Grade Geral & Bloqueios
        </button>
        <button onclick="setAdminSubTab('monthly')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'monthly' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Mensalistas (${state.monthlyMembers.length})
        </button>
        <button onclick="setAdminSubTab('products')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'products' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Cardápio de Produtos
        </button>
        <button onclick="setAdminSubTab('users')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'users' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Gestores & Acessos
        </button>
        <button onclick="setAdminSubTab('customers')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'customers' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          Clientes Cadastrados
        </button>
        <button onclick="setAdminSubTab('database')" class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeSubTab === 'database' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}">
          🔌 Conexão Supabase
        </button>
      </div>

      <!-- Conteúdo da Sub-aba -->
      <div>
        ${renderAdminSubTabContent(activeSubTab)}
      </div>

    </div>
  `;
}

function renderAdminSubTabContent(tab) {
  if (tab === 'database') {
    const cfg = window.ArenaSupabase ? window.ArenaSupabase.getConfig() : { url: 'https://brmclyukjfijommbxhks.supabase.co', anonKey: '', connected: false };
    const prefillUrl = cfg.url || 'https://brmclyukjfijommbxhks.supabase.co';
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-1.5 rounded-lg bg-emerald-100 text-emerald-800"><i data-lucide="database" class="w-5 h-5"></i></span>
              <h3 class="text-lg font-black text-slate-900">Vincular Banco de Dados Supabase (Nuvem / Vercel)</h3>
            </div>
            <p class="text-xs text-slate-500 mt-1">Conecte o sistema ao seu projeto no Supabase para salvar quadras, clientes e agendamentos na nuvem.</p>
          </div>

          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-xs font-black flex items-center space-x-1.5 ${cfg.connected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">
              <span class="w-2 h-2 rounded-full ${cfg.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
              <span>${cfg.connected ? '🟢 Conectado ao Supabase' : '🟡 Aguardando Chave Anon'}</span>
            </span>
          </div>
        </div>

        <form onsubmit="handleSaveSupabaseConfig(event)" class="max-w-2xl space-y-4 mb-8">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center">
              <i data-lucide="globe" class="w-3.5 h-3.5 text-emerald-600 mr-1.5"></i>
              URL do Projeto Supabase (Project URL) *
            </label>
            <input type="url" id="supabaseUrlInput" required 
                   value="${prefillUrl}" 
                   placeholder="https://brmclyukjfijommbxhks.supabase.co" 
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center">
              <i data-lucide="key" class="w-3.5 h-3.5 text-emerald-600 mr-1.5"></i>
              Chave Pública Anônima (Anon Key / Public API Key) *
            </label>
            <input type="password" id="supabaseKeyInput" required 
                   value="${cfg.anonKey || ''}" 
                   placeholder="Cole aqui sua chave anon" 
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50">
          </div>

          <div id="supabaseStatusMsg" class="hidden p-3.5 rounded-xl text-xs font-bold"></div>

          <div class="pt-2 flex flex-wrap items-center gap-3">
            <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center space-x-2 transition-all">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Salvar & Conectar ao Supabase</span>
            </button>

            <button type="button" onclick="handleTestSupabaseConnection()" class="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl flex items-center space-x-2 transition-all">
              <i data-lucide="activity" class="w-4 h-4 text-emerald-600"></i>
              <span>Testar Conexão</span>
            </button>
          </div>
        </form>
      </div>
    `;
  }

  if (tab === 'customers') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800 flex items-center">
              <i data-lucide="contact" class="w-5 h-5 text-emerald-600 mr-2"></i>
              Base de Clientes Cadastrados
            </h3>
            <p class="text-xs text-slate-500">Clientes que realizaram reservas avulsas ou são mensalistas na Arena Limoeiro.</p>
          </div>
          <button onclick="openCustomerModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Novo Cliente</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-black">
                <th class="pb-3">Nome</th>
                <th class="pb-3">Telefone / WhatsApp</th>
                <th class="pb-3">E-mail</th>
                <th class="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${(state.supabaseCustomers || []).map(cust => `
                <tr class="hover:bg-slate-50 transition-all">
                  <td class="py-3 font-bold text-slate-900">${cust.name}</td>
                  <td class="py-3 font-mono text-slate-700">${cust.phone}</td>
                  <td class="py-3 text-slate-500">${cust.email || '-'}</td>
                  <td class="py-3 text-right">
                    <a href="https://wa.me/55${(cust.phone || '').replace(/\D/g, '')}" target="_blank" class="text-emerald-600 hover:text-emerald-800 font-bold mr-3">WhatsApp</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (tab === 'spaces') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800">Espaços e Quadras Disponíveis</h3>
            <p class="text-xs text-slate-500">Configure nomes, valores por hora, planos mensalistas e fotos das quadras</p>
          </div>
          <button onclick="openCourtModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Cadastrar Novo Espaço</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${state.courts.map(court => `
            <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
              <div>
                <img src="${court.image}" class="h-40 w-full object-cover">
                <div class="p-4">
                  <span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">${court.categoryLabel || 'Esporte'}</span>
                  <h4 class="text-base font-black text-slate-900 mt-1">${court.name}</h4>
                  <p class="text-xs text-slate-500 line-clamp-2 mt-1">${court.description || 'Sem descrição'}</p>
                  <p class="text-sm font-black text-emerald-700 mt-2">R$ ${(court.basePricePerHour || court.base_price_per_hour || 140).toFixed(2).replace('.', ',')}/h</p>
                </div>
              </div>
              <div class="p-4 pt-0 flex space-x-2">
                <button onclick="openCourtModal('${court.id}')" class="flex-1 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1">
                  <i data-lucide="edit" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>Editar</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'positions') {
    const list = [...state.courts].sort((a, b) => (a.orderIndex || a.order_index || 0) - (b.orderIndex || b.order_index || 0));
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 class="text-base font-black text-slate-800 mb-4">Ajustar Posições de Exibição das Quadras</h3>
        <div class="space-y-2">
          ${list.map((court, idx) => `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">${idx + 1}</span>
                <span class="text-xs font-black text-slate-900">${court.name}</span>
              </div>
              <div class="flex items-center space-x-1">
                <button onclick="moveCourtOrder('${court.id}', -1)" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
                <button onclick="moveCourtOrder('${court.id}', 1)" class="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"><i data-lucide="arrow-down" class="w-4 h-4"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'monthly') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-black text-slate-800">Contratos Mensalistas Fixos</h3>
          <button onclick="openMonthlyModal()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">+ Novo Mensalista</button>
        </div>
        <div class="space-y-2">
          ${state.monthlyMembers.map(m => `
            <div class="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <h4 class="text-sm font-black text-slate-900">${m.team_name || m.teamName}</h4>
                <p class="text-xs text-slate-500">${m.responsible_name || m.responsibleName} - ${m.phone} | ${m.day_of_week_label || m.dayOfWeekLabel} às ${m.time}</p>
              </div>
              <button onclick="deleteMonthlyMember('${m.id}')" class="text-slate-400 hover:text-rose-600 p-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'users') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-black text-slate-800">Gestores e Acessos Administrativos</h3>
          <button onclick="openAdminUserModal()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">+ Novo Gestor</button>
        </div>
        <div class="space-y-2">
          ${state.adminUsers.map(u => `
            <div class="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <h4 class="text-sm font-black text-slate-900">${u.name}</h4>
                <p class="text-xs text-slate-500">${u.email} | ${u.role}</p>
              </div>
              <button onclick="deleteAdminUser('${u.id}')" class="text-slate-400 hover:text-rose-600 p-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (tab === 'products') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-black text-slate-800">Cardápio de Produtos e Bar</h3>
          <button onclick="openProductModal()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">+ Adicionar Produto</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${state.products.map(p => `
            <div class="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover">
                <div>
                  <h5 class="text-xs font-bold text-slate-900">${p.name}</h5>
                  <p class="text-xs font-black text-emerald-700">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
              <button onclick="deleteProduct('${p.id}')" class="text-slate-400 hover:text-rose-600 p-1.5"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center space-x-4 mb-4">
        <label class="text-xs font-bold text-slate-700 uppercase">Data da Grade:</label>
        <input type="date" value="${state.selectedDate}" onchange="selectDate(this.value)" 
               class="p-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
      </div>
      <div id="adminMatrixContainer" class="rounded-2xl border border-slate-200 shadow-sm overflow-x-auto p-4">
        Carregando matriz de horários...
      </div>
    </div>
  `;
}

// 5. FUNÇÕES DE SUPORTE OPERACIONAL (MANUTENÇÃO, BAR, JOGOS, RESERVAS DIRETAS)

// GESTÃO DE MANUTENÇÃO & TREINOS RESERVADOS POR CAMPO E HORÁRIO

// Alternar status de manutenção geral de uma quadra (dia inteiro)
async function setCourtMaintenance(courtId, inMaintenance, reason = '') {
  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  if (typeof court.specs === 'string') {
    try { court.specs = JSON.parse(court.specs || '{}'); } catch(e) { court.specs = {}; }
  } else if (!court.specs) {
    court.specs = {};
  }

  court.isMaintenance = inMaintenance;
  court.specs.status = inMaintenance ? 'maintenance' : 'active';
  court.specs.maintenance_reason = inMaintenance ? reason : '';

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').update({ specs: court.specs }).eq('id', courtId);
    } catch(err) {
      console.warn('Erro ao atualizar manutenção no Supabase:', err);
    }
  }

  requestSchedule();
  renderStepContent();
  lucide.createIcons();
}

// Modal unificado para cadastrar Manutenção ou Treino Reservado com horário de início e término
function openMaintenanceModal(courtId = null) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const targetCourtId = courtId || (state.courts[0] ? state.courts[0].id : '');
  const todayStr = state.adminFilterDate || state.selectedDate || getFormattedDate(new Date());

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        <div class="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <i data-lucide="clock" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Agendar Treino Reservado / Manutenção</h3>
              <p class="text-xs text-rose-300 font-medium">Bloqueio exclusivo por campo com horário de início e término</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-rose-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleSaveMaintenanceBlock(event)" class="p-6 space-y-4 overflow-y-auto flex-1">
          
          <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
            <p class="font-bold flex items-center">
              <i data-lucide="shield-check" class="w-4 h-4 mr-1 text-rose-700"></i>
              Garantia de Isolamento de Campo & Anti-Choque
            </p>
            <p class="text-[11px] text-rose-800">
              Ao cadastrar uma hora de início e término, <strong>apenas o campo selecionado</strong> e <strong>apenas o intervalo definido</strong> ficarão bloqueados para agendamentos. Todos os demais horários e todos os outros campos da Arena permanecem 100% livres para clientes.
            </p>
          </div>

          <!-- Seleção da Quadra -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Campo / Quadra *</label>
            <select id="maintCourtSelect" required class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500">
              ${state.courts.map(c => `
                <option value="${c.id}" ${c.id === targetCourtId ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Data -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Data do Bloqueio *</label>
            <input type="date" id="maintDateInput" required value="${todayStr}" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500">
          </div>

          <!-- Tipo de Bloqueio -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Bloqueio</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="p-3 border-2 border-rose-500 bg-rose-50/60 rounded-xl flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="maintTypeOption" value="hours" checked onchange="toggleMaintHoursView(true)" class="text-rose-600">
                <span class="text-xs font-bold text-slate-900">⏱️ Janela por Horário</span>
              </label>
              <label class="p-3 border-2 border-slate-200 rounded-xl flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="maintTypeOption" value="full_day" onchange="toggleMaintHoursView(false)" class="text-rose-600">
                <span class="text-xs font-bold text-slate-700">🔒 Dia Inteiro</span>
              </label>
            </div>
          </div>

          <!-- Horários (Início e Término) -->
          <div id="maintHoursContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Horário de Início *</label>
              <select id="maintStartSelect" class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500">
                ${["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].map(t => `
                  <option value="${t}" ${t === '14:00' ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Horário de Término *</label>
              <select id="maintEndSelect" class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500">
                ${["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"].map(t => `
                  <option value="${t}" ${t === '17:00' ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Motivo / Identificação -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo / Identificação do Treino *</label>
            <input type="text" id="maintReasonInput" required 
                   placeholder="Ex: Treino Reservado da Equipe Principal / Escolinha" 
                   value="Treino Reservado da Equipe"
                   class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500">
            
            <!-- Sugestões Rápidas -->
            <div class="flex flex-wrap gap-1.5 mt-2">
              <button type="button" onclick="setQuickReason('Treino Reservado da Equipe')" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">⚽ Treino Reservado</button>
              <button type="button" onclick="setQuickReason('Treino Fechado da Escolinha')" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">🏆 Escolinha</button>
              <button type="button" onclick="setQuickReason('Manutenção da Iluminação / Refletores')" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">💡 Refletores</button>
              <button type="button" onclick="setQuickReason('Manutenção Preventiva do Piso / Grama')" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">🌱 Piso / Gramado</button>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>Confirmar Bloqueio</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function toggleMaintHoursView(showHours) {
  const container = document.getElementById('maintHoursContainer');
  if (container) {
    container.style.display = showHours ? 'grid' : 'none';
  }
}

function setQuickReason(val) {
  const input = document.getElementById('maintReasonInput');
  if (input) input.value = val;
}

async function handleSaveMaintenanceBlock(e) {
  e.preventDefault();

  const courtId = document.getElementById('maintCourtSelect').value;
  const date = document.getElementById('maintDateInput').value;
  const typeOption = document.querySelector('input[name="maintTypeOption"]:checked').value;
  const reason = document.getElementById('maintReasonInput').value.trim() || 'Treino Reservado';

  if (typeOption === 'full_day') {
    closeModal();
    await setCourtMaintenance(courtId, true, reason);
    return;
  }

  const startTime = document.getElementById('maintStartSelect').value;
  const endTime = document.getElementById('maintEndSelect').value;

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    alert('O horário de término deve ser após o horário de início.');
    return;
  }

  const blockId = 'maint-' + Date.now();
  const block = {
    id: blockId,
    court_id: courtId,
    courtId: courtId,
    date,
    start_time: startTime,
    end_time: endTime,
    reason,
    type: 'manutencao'
  };

  // Salva no state
  if (!state.maintenanceBlocks) state.maintenanceBlocks = [];
  state.maintenanceBlocks.push(block);

  // Salva no localStorage
  localStorage.setItem('arena_maintenance_blocks', JSON.stringify(state.maintenanceBlocks));

  // Cria booking correspondente para espelhar no Supabase e no sistema de reservas
  const bookingPayload = {
    id: blockId,
    court_id: courtId,
    date,
    start_time: startTime,
    end_time: endTime,
    time: `${startTime} às ${endTime}`,
    duration: timeToMinutes(endTime) - timeToMinutes(startTime),
    customer_name: `[Treino Reservado] ${reason}`,
    customer_phone: '(81) 00000-0000',
    total_price: 0,
    status: 'confirmed',
    booking_type: 'manutencao',
    payment_method: 'interno',
    product_cart: {},
    observation: reason
  };

  state.bookings.push(bookingPayload);
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  localBookings.push(bookingPayload);
  localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));

  // Salva no Supabase se disponível
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('bookings').insert([bookingPayload]);
    } catch (err) {
      console.warn('Erro ao sincronizar manutenção no Supabase:', err);
    }
  }

  closeModal();
  requestSchedule();
  renderStepContent();
  lucide.createIcons();
  alert(`✓ Treino reservado / manutenção agendado com sucesso!\nCampo: ${state.courts.find(c => c.id === courtId)?.name}\nHorário: ${startTime} às ${endTime}\nData: ${formatDisplayDate(date)}`);
}

async function deleteMaintenanceBlock(blockId) {
  if (!confirm('Deseja liberar este horário para agendamento dos clientes?')) return;

  state.maintenanceBlocks = (state.maintenanceBlocks || []).filter(mb => mb.id !== blockId);
  localStorage.setItem('arena_maintenance_blocks', JSON.stringify(state.maintenanceBlocks));

  state.bookings = (state.bookings || []).filter(b => b.id !== blockId);
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const filtered = localBookings.filter(b => b.id !== blockId);
  localStorage.setItem('arena_local_bookings', JSON.stringify(filtered));

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('bookings').delete().eq('id', blockId);
    } catch(err) {}
  }

  requestSchedule();
  renderStepContent();
  lucide.createIcons();
  alert('✓ Horário liberado com sucesso para novos agendamentos!');
}

// Iniciar ou Finalizar Partida
async function updateMatchStatus(matchId, status) {
  const b = (state.bookings || []).find(x => x.id === matchId);
  if (b) {
    b.status = status;
    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      try {
        const client = window.ArenaSupabase.getClient();
        await client.from('bookings').update({ status }).eq('id', matchId);
      } catch(e) {}
    }
  }
  renderStepContent();
  lucide.createIcons();
}

// Atualizar status do bar (waiting -> chilling -> delivered)
async function updateBarStatus(bookingId, newStatus) {
  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (b) {
    if (!b.product_cart || typeof b.product_cart !== 'object') b.product_cart = {};
    b.product_cart._status = newStatus;
    b.bar_status = newStatus;

    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      try {
        const client = window.ArenaSupabase.getClient();
        await client.from('bookings').update({ product_cart: b.product_cart }).eq('id', bookingId);
      } catch(e) {}
    }
  }
  renderStepContent();
  lucide.createIcons();
}

function cycleBarStatus(bookingId) {
  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (!b) return;
  const current = (b.product_cart && b.product_cart._status) || b.bar_status || 'waiting';
  const next = current === 'waiting' ? 'chilling' : (current === 'chilling' ? 'delivered' : 'waiting');
  updateBarStatus(bookingId, next);
}

// Modal de Adição de Bebidas a um Jogo existente
function openAddBarItemsModal(bookingId) {
  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (!b) return;

  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const currentCart = b.product_cart || {};

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <i data-lucide="beer" class="w-6 h-6 text-amber-300"></i>
            <div>
              <h3 class="text-base font-black uppercase">Adicionar Bebidas ao Jogo</h3>
              <p class="text-xs text-emerald-300 font-medium">${b.customer_name || b.customerName} (${b.time})</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleSaveBarItems(event, '${bookingId}')" class="p-6 space-y-4 overflow-y-auto flex-1">
          <p class="text-xs text-slate-500">Selecione os itens e quantidades para adicionar à comanda deste jogo:</p>

          <div class="space-y-3">
            ${state.products.map(p => {
              const currentQty = currentCart[p.id] || 0;
              return `
                <div class="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50">
                  <div class="flex items-center space-x-3">
                    <img src="${p.image}" class="w-10 h-10 rounded-xl object-cover">
                    <div>
                      <h5 class="text-xs font-bold text-slate-900">${p.name}</h5>
                      <span class="text-[11px] font-black text-emerald-700">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button type="button" onclick="changeModalBarQty('${p.id}', -1)" class="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100">-</button>
                    <span id="qty_${p.id}" class="w-6 text-center text-xs font-black text-slate-900">${currentQty}</span>
                    <button type="button" onclick="changeModalBarQty('${p.id}', 1)" class="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black hover:bg-emerald-500">+</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md">Salvar Itens no Jogo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function changeModalBarQty(prodId, delta) {
  const el = document.getElementById('qty_' + prodId);
  if (!el) return;
  let val = parseInt(el.innerText || '0', 10) + delta;
  if (val < 0) val = 0;
  el.innerText = val;
}

async function handleSaveBarItems(e, bookingId) {
  e.preventDefault();
  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (!b) return;

  if (!b.product_cart) b.product_cart = {};

  let additionalTotal = 0;
  state.products.forEach(p => {
    const el = document.getElementById('qty_' + p.id);
    if (el) {
      const q = parseInt(el.innerText || '0', 10);
      if (q > 0) {
        b.product_cart[p.id] = q;
        additionalTotal += q * p.price;
      } else {
        delete b.product_cart[p.id];
      }
    }
  });

  const validKeys = Object.keys(b.product_cart).filter(k => !k.startsWith('_'));
  if (validKeys.length > 0) {
    b.product_cart._status = b.product_cart._status || 'waiting';
  } else {
    b.product_cart = {};
  }

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('bookings').update({ product_cart: b.product_cart }).eq('id', bookingId);
    } catch(err) {}
  }

  closeModal();
  renderStepContent();
  lucide.createIcons();
}

// Cancelamento de Agendamento
async function handleCancelBooking(bookingId) {
  if (!confirm('Deseja realmente cancelar esta reserva de jogo?')) return;

  const idx = (state.bookings || []).findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    state.bookings[idx].status = 'cancelled';
  }

  // Remove também do localStorage local
  let local = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  local = local.filter(b => b.id !== bookingId);
  localStorage.setItem('arena_local_bookings', JSON.stringify(local));

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('bookings').delete().eq('id', bookingId);
    } catch(e) {}
  }

  requestSchedule();
  renderStepContent();
  lucide.createIcons();
}

// 6. MODAL DE FAZER RESERVA DIRETA (BALCÃO / WHATSAPP)
function openDirectBookingModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const todayStr = state.adminFilterDate || getFormattedDate(new Date());

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <i data-lucide="calendar-plus" class="w-6 h-6 text-emerald-300"></i>
            <div>
              <h3 class="text-base font-black uppercase">Nova Reserva Direta (Balcão / WhatsApp)</h3>
              <p class="text-xs text-emerald-300 font-medium">Agende uma partida presencialmente ou via mensagem com confirmação automática</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleDirectBookingSubmit(event)" class="p-6 space-y-4 overflow-y-auto flex-1">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Quadra Desejada *</label>
              <select id="directCourtSelect" required class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 bg-white">
                ${state.courts.map(c => {
                  const specs = typeof c.specs === 'string' ? JSON.parse(c.specs || '{}') : (c.specs || {});
                  const isM = c.isMaintenance || specs.status === 'maintenance';
                  return `<option value="${c.id}">${c.name} ${isM ? '(⚠️ Em Manutenção)' : ''}</option>`;
                }).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Data do Jogo *</label>
              <input type="date" id="directDateInput" required value="${todayStr}" 
                     class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Horário de Início *</label>
              <select id="directTimeSelect" required class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 bg-white">
                ${["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"].map(t => `<option value="${t}" ${t === '19:00' ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Duração *</label>
              <select id="directDurationSelect" class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 bg-white">
                <option value="60">1 Hora (60 min)</option>
                <option value="120">2 Horas (120 min)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Cliente ou Time *</label>
              <input type="text" id="directCustomerName" required placeholder="Ex: Pelada dos Amigos / Carlos" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone WhatsApp *</label>
              <input type="tel" id="directCustomerPhone" required placeholder="(88) 99999-9999" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Agendamento</label>
              <select id="directTypeSelect" class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white">
                <option value="avulso">Jogo Avulso</option>
                <option value="mensalista">Mensalista Fixo</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Situação do Pagamento</label>
              <select id="directPaymentSelect" class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white">
                <option value="pago_balcao">🟢 Pago Integral no Balcão</option>
                <option value="sinal_50">🟡 Sinal de 50% Pago</option>
                <option value="pagar_local">⚪ Pagar na Chegada do Jogo</option>
              </select>
            </div>
          </div>

          <!-- Adição Opcional de Bebidas -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span class="text-xs font-black text-slate-800 uppercase flex items-center">
              <i data-lucide="beer" class="w-4 h-4 text-amber-500 mr-1.5"></i>
              Bebidas para Deixar Gelando (Opcional)
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${state.products.slice(0, 6).map(p => `
                <label class="flex items-center space-x-2 text-xs text-slate-700 font-semibold p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                  <input type="checkbox" name="directProd" value="${p.id}" class="rounded text-emerald-600 focus:ring-emerald-500">
                  <span class="truncate">${p.name}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Observações do Jogo</label>
            <textarea id="directObsInput" rows="2" placeholder="Ex: Solicitou coletes reservas, churrasqueira..." class="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600"></textarea>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5">
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>Confirmar e Salvar Reserva</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  `;
  lucide.createIcons();
}

async function handleDirectBookingSubmit(e) {
  e.preventDefault();

  const courtId = document.getElementById('directCourtSelect').value;
  const date = document.getElementById('directDateInput').value;
  const startTime = document.getElementById('directTimeSelect').value;
  const duration = parseInt(document.getElementById('directDurationSelect').value, 10);
  const name = document.getElementById('directCustomerName').value.trim();
  const phone = document.getElementById('directCustomerPhone').value.trim();
  const bookingType = document.getElementById('directTypeSelect').value;
  const paymentMethod = document.getElementById('directPaymentSelect').value;
  const obs = document.getElementById('directObsInput').value.trim();

  // Calcula end_time
  const sMin = timeToMinutes(startTime);
  const eMin = sMin + duration;
  const endHours = Math.floor(eMin / 60).toString().padStart(2, '0');
  const endMins = (eMin % 60).toString().padStart(2, '0');
  const endTime = `${endHours}:${endMins}`;

  // ANTI-CHOQUE NA RESERVA DIRETA: Verifica sobreposição antes de salvar
  const conflict = checkScheduleConflict(courtId, date, startTime, endTime);
  if (conflict.conflict) {
    alert('⚠️ Não é possível realizar esta reserva direta!\n\nMotivo: ' + conflict.reason + '\n\nPor favor, altere o horário ou selecione outro campo livre.');
    return;
  }

  const court = state.courts.find(c => c.id === courtId) || { name: 'Quadra', basePricePerHour: 140 };
  const courtPrice = (court.basePricePerHour || court.base_price_per_hour || 140) * (duration / 60);

  // Cart de bebidas selecionadas
  const selectedCheckboxes = document.querySelectorAll('input[name="directProd"]:checked');
  const productCart = { _status: 'waiting' };
  let barTotal = 0;
  selectedCheckboxes.forEach(cb => {
    productCart[cb.value] = 1;
    const prod = state.products.find(p => p.id === cb.value);
    if (prod) barTotal += prod.price;
  });

  const totalPrice = courtPrice + barTotal;
  const newBookingId = 'booking-' + Date.now();

  const bookingPayload = {
    id: newBookingId,
    court_id: courtId,
    date,
    time: `${startTime} às ${endTime}`,
    start_time: startTime,
    end_time: endTime,
    duration,
    customer_name: name,
    customer_phone: phone,
    total_price: totalPrice,
    status: 'confirmed',
    booking_type: bookingType,
    payment_method: paymentMethod,
    product_cart: productCart,
    observation: obs
  };

  // Salva no estado
  state.bookings.push(bookingPayload);

  // Salva no localStorage
  const local = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  local.push(bookingPayload);
  localStorage.setItem('arena_local_bookings', JSON.stringify(local));

  // Salva no Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      // Garante cliente na tabela customers
      if (window.ArenaSupabase.getOrCreateCustomer) {
        await window.ArenaSupabase.getOrCreateCustomer(name, phone);
      }
      await client.from('bookings').insert([bookingPayload]);
    } catch(err) {
      console.warn('Erro ao salvar no Supabase:', err);
    }
  }

  closeModal();
  requestSchedule();
  renderStepContent();
  lucide.createIcons();

  // Abre confirmação de envio WhatsApp
  const cleanPhone = phone.replace(/\D/g, '');
  const zapMsg = `🏟️ *ARENA LIMOEIRO - RESERVA CONFIRMADA*\n\nOlá ${name}! Sua partida foi confirmada com sucesso:\n📍 Quadra: ${court.name}\n📅 Data: ${formatDisplayDate(date)}\n⏰ Horário: ${startTime} às ${endTime}\n💳 Valor Total: R$ ${totalPrice.toFixed(2).replace('.', ',')}\n\nAguardamos sua equipe na Arena Limoeiro!`;
  const zapUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(zapMsg)}`;

  setTimeout(() => {
    if (confirm('Reserva confirmada e salva com sucesso no sistema!\n\nDeseja abrir o WhatsApp agora para enviar o comprovante ao cliente?')) {
      window.open(zapUrl, '_blank');
    }
  }, 300);
}

async function moveCourtOrder(courtId, direction) {
  const list = [...state.courts].sort((a, b) => (a.orderIndex || a.order_index || 0) - (b.orderIndex || b.order_index || 0));
  const index = list.findIndex(c => c.id === courtId);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  list.forEach((c, idx) => {
    c.orderIndex = idx + 1;
    c.order_index = idx + 1;
  });
  state.courts = list;
  renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      for (const c of list) {
        await client.from('courts').update({ order_index: c.order_index }).eq('id', c.id);
      }
    } catch(e) {}
  }
}

async function reorderFast(type) {
  let list = [...state.courts];
  if (type === 'most_booked') {
    list.sort((a, b) => (b.bookingsCount || b.bookings_count || 0) - (a.bookingsCount || a.bookings_count || 0));
  } else {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }

  list.forEach((c, idx) => {
    c.orderIndex = idx + 1;
    c.order_index = idx + 1;
  });
  state.courts = list;
  renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      for (const c of list) {
        await client.from('courts').update({ order_index: c.order_index }).eq('id', c.id);
      }
    } catch(e) {}
  }
}

function renderAdminMatrix() {
  const container = document.getElementById('adminMatrixContainer');
  if (!container) return;

  const operatingHours = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  let html = `
    <table class="w-full text-left border-collapse text-xs">
      <thead>
        <tr class="bg-emerald-950 text-white border-b border-emerald-900">
          <th class="p-3 font-bold w-20 text-center">Horário</th>
          ${state.courts.map(c => `
            <th class="p-3 font-bold text-center border-l border-emerald-900">
              ${c.name.split(' - ')[0]}
              <span class="block text-[10px] font-normal text-emerald-300">${c.categoryLabel}</span>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
  `;

  operatingHours.forEach(hour => {
    html += `
      <tr class="hover:bg-slate-50/60">
        <td class="p-2.5 font-bold text-slate-600 text-center bg-slate-50">${hour}</td>
        ${state.courts.map(c => {
          // ISOLAMENTO ESTRITO POR CAMPO: Calcula a grade especificamente para cada quadra
          const courtSlots = calculateLocalSchedule(c.id, state.adminFilterDate || state.selectedDate);
          const slot = (courtSlots || []).find(s => s.time === hour);

          if (slot && slot.status === 'maintenance') {
            return `
              <td class="p-2 text-center border-l border-slate-100 bg-amber-50 text-amber-900">
                <span class="font-black text-[11px] block truncate">⚠️ ${slot.customerName || 'Treino Reservado'}</span>
                <span class="text-[10px] text-amber-700 block font-semibold">Manutenção / Treino</span>
              </td>
            `;
          }

          if (slot && slot.status === 'booked') {
            return `
              <td class="p-2 text-center border-l border-slate-100 bg-rose-50 text-rose-800">
                <span class="font-bold block truncate">${slot.customerName || 'Reservado'}</span>
                <span class="text-[10px] text-rose-600 block">${slot.isMensalista ? 'Mensalista Fixo' : 'Agendado'}</span>
              </td>
            `;
          }

          if (slot && slot.status === 'blocked_admin') {
            return `
              <td class="p-2 text-center border-l border-slate-100 bg-slate-100 text-slate-600">
                <span class="font-bold block">Bloqueado</span>
                <button onclick="adminToggleSlot('${c.id}', '${state.selectedDate}', '${hour}')" class="text-[10px] text-emerald-700 underline">Desbloquear</button>
              </td>
            `;
          }

          return `
            <td class="p-2 text-center border-l border-slate-100">
              <button onclick="openMaintenanceModal('${c.id}')" 
                      class="w-full py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-all">
                Livre (Bloquear)
              </button>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
  lucide.createIcons();
}

function adminToggleSlot(courtId, date, time) {
  const key = `${courtId}_${date}_${time}`;
  let blockedMap = JSON.parse(localStorage.getItem('arena_blocked_slots') || '{}');
  if (blockedMap[key]) {
    delete blockedMap[key];
  } else {
    blockedMap[key] = { reason: "Manutenção Bloqueada pelo Administrador" };
  }
  localStorage.setItem('arena_blocked_slots', JSON.stringify(blockedMap));
  requestSchedule();
  renderStepContent();
  lucide.createIcons();
}
async function deleteProduct(id) {
  if (!confirm('Excluir este produto?')) return;
  state.products = state.products.filter(p => p.id !== id);
  renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('products').delete().eq('id', id);
    } catch(e) {}
  }
}

async function deleteMonthlyMember(id) {
  if (!confirm('Cancelar este plano mensalista?')) return;
  state.monthlyMembers = state.monthlyMembers.filter(m => m.id !== id);
  renderStepContent();
  requestSchedule();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('monthly_members').delete().eq('id', id);
    } catch(e) {}
  }
}

async function deleteAdminUser(id) {
  if (!confirm('Remover o acesso deste gestor?')) return;
  state.adminUsers = state.adminUsers.filter(u => u.id !== id);
  renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('admin_users').delete().eq('id', id);
    } catch(e) {}
  }
}

// NOVO RESPONSÁVEL
function openNewAdminUserModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const generatedPassword = `arena${Math.floor(100 + Math.random() * 900)}`;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <i data-lucide="user-plus" class="w-6 h-6 text-emerald-400"></i>
            <div>
              <h3 class="text-base font-black uppercase">Cadastrar Novo Responsável</h3>
              <p class="text-xs text-emerald-300 font-medium">Crie login e senha para gerentes e atendentes da arena</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleNewAdminUserSubmit(event)" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo do Responsável *</label>
            <input type="text" id="newAdminName" required placeholder="Ex: Roberto Silva" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail de Login *</label>
            <input type="email" id="newAdminEmail" required placeholder="Ex: roberto@arenalimoeiro.com.br" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Função / Cargo *</label>
              <select id="newAdminRole" class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white">
                <option value="Administrador Geral">Administrador Geral</option>
                <option value="Gerente de Quadras">Gerente de Quadras</option>
                <option value="Atendente da Recepção" selected>Atendente da Recepção</option>
                <option value="Operador do Bar">Operador do Bar</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Senha de Acesso *</label>
              <div class="flex items-center space-x-1">
                <input type="text" id="newAdminPassword" required value="${generatedPassword}" 
                       class="w-full p-3 border border-slate-300 rounded-xl text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
                <button type="button" onclick="document.getElementById('newAdminPassword').value = 'arena' + Math.floor(100 + Math.random() * 900)" title="Gerar outra senha" class="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700">
                  <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow">Cadastrar Usuário</button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();
}

async function handleNewAdminUserSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('newAdminName').value.trim();
  const email = document.getElementById('newAdminEmail').value.trim();
  const role = document.getElementById('newAdminRole').value;
  const password = document.getElementById('newAdminPassword').value.trim();

  const newUser = {
    id: 'admin-' + Date.now(),
    name,
    email,
    role,
    password,
    created_at: new Date().toISOString()
  };

  state.adminUsers.push(newUser);
  closeModal();
  if (state.currentMode === 'admin' && state.adminTab === 'users') renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('admin_users').insert([newUser]);
    } catch(e) {}
  }

  alert(`Usuário ${name} cadastrado com sucesso!\nE-mail: ${email}\nSenha: ${password}`);
}

async function loadAdminUsers() {
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      const { data } = await client.from('admin_users').select('*');
      if (data && data.length > 0) {
        state.adminUsers = data;
        if (state.currentMode === 'admin' && state.adminTab === 'users') renderStepContent();
      }
    } catch(e) {}
  }
}

// MODAL DE COMPARTILHAMENTO
function openShareModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const currentUrl = window.location.origin;
  const shareMessage = encodeURIComponent(`Olá! ⚽ Faça seu agendamento de quadras e campos na Arena Limoeiro pelo nosso link direto:
${currentUrl}
Escolha sua quadra e horário agora!`);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <i data-lucide="share-2" class="w-6 h-6 text-emerald-400"></i>
            <div>
              <h3 class="text-base font-black uppercase">Compartilhar Site com Clientes</h3>
              <p class="text-xs text-emerald-300">Envie o link de agendamento para os jogadores</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Link de Agendamento</label>
            <div class="flex items-center space-x-2">
              <input type="text" id="shareUrlInput" readonly value="${currentUrl}" 
                     class="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800">
              <button onclick="copyShareUrl()" class="px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all">
                <i data-lucide="copy" class="w-4 h-4"></i>
                <span id="copyBtnText">Copiar</span>
              </button>
            </div>
          </div>

          <a href="https://api.whatsapp.com/send?text=${shareMessage}" target="_blank" 
             class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md">
            <i data-lucide="message-circle" class="w-5 h-5"></i>
            <span>Enviar no WhatsApp dos Clientes</span>
          </a>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function copyShareUrl() {
  const input = document.getElementById('shareUrlInput');
  const btn = document.getElementById('copyBtnText');
  if (input) {
    input.select();
    navigator.clipboard.writeText(input.value);
    if (btn) btn.innerText = "Copiado!";
    setTimeout(() => { if (btn) btn.innerText = "Copiar"; }, 2000);
  }
}

// MODAL DE PRODUTOS
function openProductModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div>
            <h3 class="text-base font-black uppercase">Cadastrar Produto / Item de Bar</h3>
            <p class="text-xs text-emerald-300 font-medium">Adicione água, bebidas, gelo ou lanches para os clientes</p>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleProductSubmit(event)" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Produto / Item *</label>
            <input type="text" id="prodName" required placeholder="Ex: Garrafa de Água com Gás 500ml" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria *</label>
              <select id="prodCategory" class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white">
                <option value="Bebidas">Bebidas & Água</option>
                <option value="Alimentos">Alimentos & Lanches</option>
                <option value="Churrasco">Churrasco & Gelo</option>
                <option value="Equipamentos">Equipamentos</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Preço Unitário (R$) *</label>
              <input type="number" step="0.50" id="prodPrice" required placeholder="5.00" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Unidade de Medida</label>
            <input type="text" id="prodUnit" placeholder="unid, lata, garrafa, saco" value="unid." 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Foto do Produto (URL)</label>
            <input type="url" id="prodImage" placeholder="https://..." value="https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow">Cadastrar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('prodName').value.trim();
  const category = document.getElementById('prodCategory').value;
  const price = parseFloat(document.getElementById('prodPrice').value) || 5.00;
  const unit = document.getElementById('prodUnit').value.trim() || 'unid.';
  const image = document.getElementById('prodImage').value.trim() || 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=200&auto=format&fit=crop&q=80';

  const newProduct = {
    id: 'prod-' + Date.now(),
    name,
    category,
    price,
    unit,
    image,
    type: 'product'
  };

  state.products.push(newProduct);
  closeModal();
  renderStepContent();
  lucide.createIcons();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('products').insert([newProduct]);
    } catch(e) {}
  }
}

// MODAL DE ESPAÇO / QUADRA
function openCourtModal(courtIdToEdit = null) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const isEditing = !!courtIdToEdit;
  const court = isEditing ? state.courts.find(c => c.id === courtIdToEdit) : null;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-fade-in">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <i data-lucide="${isEditing ? 'edit' : 'plus-circle'}" class="w-6 h-6 text-emerald-400"></i>
            <div>
              <h3 class="text-lg font-black uppercase tracking-tight">
                ${isEditing ? 'Editar Espaço de Jogo' : 'Cadastrar Novo Espaço de Jogo'}
              </h3>
              <p class="text-xs text-emerald-300 font-medium">Defina os detalhes, hora por jogo e observações do espaço</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="courtForm" onsubmit="handleCourtFormSubmit(event, '${courtIdToEdit || ''}')" class="p-6 overflow-y-auto space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Espaço / Quadra *</label>
            <input type="text" id="courtName" required 
                   value="${court ? court.name : ''}" 
                   placeholder="Ex: Campo Society 03 - Gramado Sintético Master" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Modalidade *</label>
              <select id="courtCategory" required class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white">
                <option value="society" ${court && court.category === 'society' ? 'selected' : ''}>Futebol Society</option>
                <option value="beach" ${court && court.category === 'beach' ? 'selected' : ''}>Beach Tennis & Vôlei</option>
                <option value="futsal" ${court && court.category === 'futsal' ? 'selected' : ''}>Ginásio Poliesportivo</option>
                <option value="padel" ${court && court.category === 'padel' ? 'selected' : ''}>Padel & Tênis</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Hora Avulsa (R$) *</label>
              <input type="number" step="0.50" id="courtPrice" required 
                     value="${court ? getCourtHourlyPrice(court).toFixed(2) : '140.00'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Mensalista (R$/mês)</label>
              <input type="number" step="1.00" id="courtMonthlyPrice" 
                     value="${court ? getCourtMonthlyPrice(court).toFixed(2) : '500.00'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Capacidade de Jogadores</label>
              <input type="text" id="courtCapacity" 
                     value="${court && court.specs ? court.specs.capacity : '14 a 16 Jogadores (7x7)'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Piso / Estrutura</label>
              <input type="text" id="courtType" 
                     value="${court && court.specs ? court.specs.type : 'Grama Sintética 60mm Monofilamento'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição do Espaço</label>
            <textarea id="courtDescription" rows="2" 
                      placeholder="Descreva as qualidades da iluminação, cobertura e conforto..." 
                      class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">${court ? (court.description || '') : ''}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Observações / Regras</label>
            <textarea id="courtObservation" rows="2" 
                      placeholder="Ex: Obrigatório uso de chuteiras society..." 
                      class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">${court ? (court.observation || '') : ''}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Foto da Quadra (URL)</label>
            <input type="url" id="courtImage" 
                   value="${court ? court.image : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'}" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-md">
              ${isEditing ? 'Salvar Alterações' : 'Criar Espaço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();
}

async function handleCourtFormSubmit(event, courtIdToEdit) {
  event.preventDefault();
  const name = document.getElementById('courtName').value.trim();
  const category = document.getElementById('courtCategory').value;
  const price = parseFloat(document.getElementById('courtPrice').value) || 140.00;
  const monthlyPrice = parseFloat(document.getElementById('courtMonthlyPrice').value) || (price * 3.6);
  const capacity = document.getElementById('courtCapacity').value.trim();
  const type = document.getElementById('courtType').value.trim();
  const description = document.getElementById('courtDescription').value.trim();
  const observation = document.getElementById('courtObservation').value.trim();
  const image = document.getElementById('courtImage').value.trim();

  const categoryLabels = {
    society: "Futebol Society", beach: "Beach Tennis & Vôlei", futsal: "Ginásio Poliesportivo", padel: "Padel & Tênis"
  };

  const isEditing = !!courtIdToEdit;
  const id = isEditing ? courtIdToEdit : ('court-' + category + '-' + Date.now());

  const savedCourt = {
    id,
    name,
    category,
    categoryLabel: categoryLabels[category] || "Esporte",
    category_label: categoryLabels[category] || "Esporte",
    basePricePerHour: price,
    base_price_per_hour: price,
    monthlyPrice,
    monthly_price: monthlyPrice,
    description,
    observation,
    image,
    specs: {
      type: type || "Piso Esportivo",
      capacity: capacity || "10 a 16 Jogadores",
      features: ["Iluminação LED", "Vestiários"],
      status: "Disponível"
    }
  };

  closeModal();
  if (isEditing) {
    const idx = state.courts.findIndex(c => c.id === courtIdToEdit);
    if (idx !== -1) state.courts[idx] = savedCourt;
    if (state.selectedCourt && state.selectedCourt.id === courtIdToEdit) state.selectedCourt = savedCourt;
  } else {
    state.courts.push(savedCourt);
    state.selectedCourt = savedCourt;
  }
  renderStepContent();
  lucide.createIcons();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      if (isEditing) {
        await client.from('courts').update({
          name, category, category_label: savedCourt.categoryLabel,
          base_price_per_hour: price, monthly_price: monthlyPrice,
          description, observation, image, specs: savedCourt.specs
        }).eq('id', courtIdToEdit);
      } else {
        await client.from('courts').insert([{
          id, name, category, category_label: savedCourt.categoryLabel,
          base_price_per_hour: price, monthly_price: monthlyPrice,
          description, observation, image, specs: savedCourt.specs,
          order_index: state.courts.length
        }]);
      }
    } catch(e) {}
  }
}

async function deleteCourt(courtId) {
  if (!confirm('Tem certeza que deseja excluir esta quadra?')) return;
  state.courts = state.courts.filter(c => c.id !== courtId);
  if (state.selectedCourt && state.selectedCourt.id === courtId) state.selectedCourt = state.courts[0] || null;
  renderStepContent();
  lucide.createIcons();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').delete().eq('id', courtId);
    } catch(e) {}
  }
}

// CHECKOUT MODAL
function openCheckoutModal() {
  const court = state.selectedCourt;
  calculateDuration();
  const isMensal = state.bookingType === 'mensalista';
  const hoursFraction = state.selectedDuration / 60;
  
  const basePrice = getCourtHourlyPrice(court);
  const courtPrice = isMensal ? getCourtMonthlyPrice(court) : (basePrice * hoursFraction);

  let discountAmount = 0;
  if (state.appliedCoupon) {
    if (state.appliedCoupon.discountPercent) discountAmount = (courtPrice * state.appliedCoupon.discountPercent) / 100;
    else if (state.appliedCoupon.discountValue) discountAmount = state.appliedCoupon.discountValue;
  }
  const grandTotal = Math.max(0, courtPrice - discountAmount);

  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div>
            <h3 class="text-lg font-black uppercase tracking-tight">
              ${isMensal ? 'Confirmação do Plano Mensalista' : 'Identificação e Pagamento'}
            </h3>
            <p class="text-xs text-emerald-300 font-medium">Arena Limoeiro - Complexo Poliesportivo</p>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">${isMensal ? 'Nome do Time / Responsável *' : 'Nome Completo do Responsável *'}</label>
            <input type="text" id="custName" value="${state.customerName}" placeholder="Ex: Pelada dos Amigos (Lucas Gabriel)" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp para Notificações *</label>
            <input type="tel" id="custPhone" value="${state.customerPhone}" placeholder="Ex: (81) 98765-4321" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-2">Forma de Pagamento</label>
            <div class="grid grid-cols-2 gap-3">
              <label onclick="setPaymentMethod('pix')" class="p-3 border-2 rounded-xl flex items-center space-x-2.5 cursor-pointer ${state.paymentMethod === 'pix' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}">
                <input type="radio" name="paymethod" value="pix" ${state.paymentMethod === 'pix' ? 'checked' : ''} class="text-emerald-600">
                <span class="text-xs font-bold text-slate-800">⚡ PIX Instantâneo</span>
              </label>

              <label onclick="setPaymentMethod('local')" class="p-3 border-2 rounded-xl flex items-center space-x-2.5 cursor-pointer ${state.paymentMethod === 'local' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}">
                <input type="radio" name="paymethod" value="local" ${state.paymentMethod === 'local' ? 'checked' : ''} class="text-emerald-600">
                <span class="text-xs font-bold text-slate-800">🏢 Pagar na Recepção</span>
              </label>
            </div>
          </div>

          ${state.paymentMethod === 'pix' ? `
            <div class="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-center">
              <span class="text-xs font-extrabold text-emerald-950 block mb-2">Pague via PIX Copia e Cola / QR Code</span>
              <div class="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-emerald-300 shadow-sm flex items-center justify-center">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=00020126580014br.gov.bcb.pix0136arena-limoeiro-pix520400005303986540${grandTotal.toFixed(2)}5802BR" class="w-full h-full object-contain">
              </div>
              <p class="text-[11px] text-slate-600 mt-2">Chave PIX: <code class="font-mono bg-white px-2 py-0.5 rounded text-emerald-800 font-bold border border-emerald-200">contato@arenalimoeiro.com.br</code></p>
            </div>
          ` : ''}
        </div>

        <div class="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-[11px] text-slate-400 block font-bold">Total a Pagar Agora</span>
            <p class="text-xl font-black text-slate-950">R$ ${grandTotal.toFixed(2).replace('.', ',')}</p>
          </div>

          <button id="btnConfirmBooking" onclick="submitBooking(${grandTotal})" 
                  class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-extrabold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>Confirmar e Reservar</span>
          </button>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function setPaymentMethod(method) {
  state.paymentMethod = method;
  openCheckoutModal();
}

function closeModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;
  modalRoot.innerHTML = '';
}

async function submitBooking(grandTotal) {
  const nameInput = document.getElementById('custName');
  const phoneInput = document.getElementById('custPhone');
  const name = nameInput ? nameInput.value.trim() : state.customerName;
  const phone = phoneInput ? phoneInput.value.trim() : state.customerPhone;

  if (!name || !phone) {
    alert('Por favor, informe seu nome e telefone.');
    return;
  }

  // Feedback visual instantâneo no botão
  const confirmBtn = document.getElementById('btnConfirmBooking');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="inline-block animate-spin mr-1.5">⏳</span><span>Salvando Reserva...</span>`;
  }

  state.customerName = name;
  state.customerPhone = phone;
  const isMensal = state.bookingType === 'mensalista';

  // 1. ANTI-CHOQUE RIGOROSO: Verifica conflito antes de salvar
  const localCheck = checkScheduleConflict(state.selectedCourt.id, state.selectedDate, state.startTime, state.endTime);
  if (localCheck.conflict) {
    alert('⚠️ Choque de Agendamento Evitado!\n\n' + localCheck.reason + '\n\nPor favor, escolha outro horário livre ou outro campo da Arena Limoeiro.');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Confirmar e Reservar</span>`;
      if (window.lucide) lucide.createIcons();
    }
    requestSchedule();
    closeModal();
    goToStep(3);
    return;
  }

  const courtId = state.selectedCourt.id;
  const newBookingId = 'ARENA-' + Math.floor(1000 + Math.random() * 9000);
  const newMemberId = 'mensal-' + Date.now();

  // Payload LIMPO estritamente compatível com o schema do Supabase (sem camelCase courtId!)
  // Sanitiza o carrinho do bar para salvar estritamente itens selecionados (sem zeros ou unidades fantasmas)
  const cleanProductCart = {};
  if (state.productCart && typeof state.productCart === 'object') {
    Object.entries(state.productCart).forEach(([k, v]) => {
      if (!k.startsWith('_') && typeof v === 'number' && v > 0) {
        cleanProductCart[k] = v;
      }
    });
    if (Object.keys(cleanProductCart).length > 0) {
      cleanProductCart._status = 'waiting';
    }
  }

  const dbBookingPayload = {
    id: newBookingId,
    court_id: courtId,
    customer_id: null,
    date: state.selectedDate,
    start_time: state.startTime,
    end_time: state.endTime,
    time: `${state.startTime} às ${state.endTime}`,
    duration: state.selectedDuration || 60,
    customer_name: name,
    customer_phone: phone,
    total_price: Number(grandTotal) || 0,
    status: 'confirmed',
    booking_type: 'avulso',
    payment_method: state.paymentMethod || 'local',
    product_cart: cleanProductCart,
    observation: state.observation || ''
  };

  const dbMemberPayload = {
    id: newMemberId,
    team_name: name,
    responsible_name: name,
    phone: phone,
    customer_id: null,
    court_id: courtId,
    day_of_week: state.monthlyDayOfWeek,
    day_of_week_label: 'Toda ' + state.monthlyDayOfWeek + '-feira',
    time: state.startTime,
    start_time: state.startTime,
    end_time: state.endTime,
    monthly_price: Number(grandTotal) || 0,
    status: 'active',
    observation: state.observation || ''
  };

  // 2. Salva no Supabase (Nuvem Vercel)
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();

      // Checagem anti-choque em tempo real no Supabase
      const { data: dbConflicts } = await client
        .from('bookings')
        .select('id, start_time, end_time, customer_name, status')
        .eq('court_id', courtId)
        .eq('date', state.selectedDate)
        .neq('status', 'cancelled');

      if (dbConflicts && dbConflicts.length > 0) {
        const reqS = timeToMinutes(state.startTime);
        const reqE = timeToMinutes(state.endTime);
        const overlap = dbConflicts.find(b => {
          const bS = timeToMinutes(b.start_time);
          const bE = timeToMinutes(b.end_time);
          return Math.max(reqS, bS) < Math.min(reqE, bE);
        });
        if (overlap) {
          alert('⚠️ Choque de Agendamento Evitado!\n\nEste horário acabou de ser reservado por outro cliente (' + (overlap.customer_name || 'Reservado') + ').\n\nPor favor, selecione outro horário disponível.');
          syncDataFromSupabase();
          requestSchedule();
          closeModal();
          goToStep(3);
          return;
        }
      }

      // Cria ou busca cliente
      try {
        const customer = await window.ArenaSupabase.getOrCreateCustomer(name, phone);
        if (customer && customer.id) {
          dbBookingPayload.customer_id = customer.id;
          dbMemberPayload.customer_id = customer.id;
        }
      } catch (custErr) {
        console.warn('Aviso no cadastro de cliente:', custErr);
      }

      // Insere no Supabase
      if (isMensal) {
        const { error: insErr } = await client.from('monthly_members').insert([dbMemberPayload]);
        if (insErr) console.warn('Aviso inserção mensalista Supabase:', insErr);
      } else {
        const { error: insErr } = await client.from('bookings').insert([dbBookingPayload]);
        if (insErr) console.warn('Aviso inserção booking Supabase:', insErr);
      }
    } catch (err) {
      console.warn('Erro na conexão com Supabase, salvando localmente:', err);
    }
  }

  // 3. Atualiza estado em memória e localStorage com garantia de compatibilidade
  const unifiedBooking = {
    ...dbBookingPayload,
    courtId: courtId,
    customerName: name,
    customerPhone: phone,
    totalPrice: Number(grandTotal) || 0,
    startTime: state.startTime,
    endTime: state.endTime,
    isMensalista: isMensal
  };

  if (isMensal) {
    state.monthlyMembers.push(dbMemberPayload);
  } else {
    state.bookings.push(unifiedBooking);
    const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    localBookings.push(unifiedBooking);
    localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
  }

  // 4. Finaliza com sucesso
  requestSchedule();
  closeModal();

  if (isMensal) {
    showConfirmationSuccessModal({
      id: newMemberId,
      customerName: name,
      customerPhone: phone,
      courtId: courtId,
      date: 'Toda ' + state.monthlyDayOfWeek + '-feira (Mensal)',
      time: state.startTime + ' às ' + state.endTime,
      totalPrice: Number(grandTotal) || 0,
      isMensalista: true
    });
  } else {
    showConfirmationSuccessModal(unifiedBooking);
  }
  // Limpa o carrinho do agendamento para que a próxima reserva inicie 100% zerada
  state.productCart = {};
}

function showConfirmationSuccessModal(booking) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const courtId = booking.court_id || booking.courtId || (state.selectedCourt ? state.selectedCourt.id : '');
  const court = state.courts.find(c => c.id === courtId);
  const courtName = court ? court.name : (state.selectedCourt ? state.selectedCourt.name : 'Quadra Esportiva');

  const custName = booking.customer_name || booking.customerName || state.customerName || 'Cliente';
  const custPhone = booking.customer_phone || booking.customerPhone || state.customerPhone || '';
  const price = typeof booking.total_price === 'number' ? booking.total_price : 
                (typeof booking.totalPrice === 'number' ? booking.totalPrice : 
                (typeof booking.monthly_price === 'number' ? booking.monthly_price : 0));

  const savedItemsText = Object.entries(state.productCart || {}).map(([id, qty]) => {
    if (id.startsWith('_') || typeof qty !== 'number' || qty <= 0) return '';
    const prod = state.products.find(p => p.id === id);
    return prod ? `${qty}x ${prod.name}` : '';
  }).filter(Boolean).join(', ');

  const shareText = encodeURIComponent(`Fala galera! ⚽ Agendamento confirmado na Arena Limoeiro!
🏟️ Espaço: ${courtName}
📅 Data: ${booking.date}
⏰ Horário: ${booking.time} (${state.selectedDuration} min)${savedItemsText ? `
🥤 Itens Guardados no Bar: ${savedItemsText}` : ''}
Código: #${booking.id}
Bora pro jogo!`);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 animate-fade-in">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="check-circle" class="w-10 h-10"></i>
        </div>

        <span class="bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
          ${booking.isMensalista ? '👑 Plano Mensalista Ativado com Sucesso!' : 'Reserva Confirmada com Sucesso!'}
        </span>

        <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-3 mb-1">
          Código: #${booking.id}
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 mb-6">
          Comprovante enviado para o WhatsApp <strong class="text-slate-800">${custPhone}</strong>
        </p>

        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 mb-6 text-xs sm:text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Responsável:</span><strong class="text-slate-800">${custName}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Espaço:</span><strong class="text-slate-800">${courtName.split(' - ')[0]}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Data e Horário:</span><strong class="text-slate-800">${booking.date} (${booking.time})</strong></div>
          ${savedItemsText ? `
            <div class="pt-2 border-t border-slate-200">
              <span class="text-amber-800 font-bold block">🥤 Bebidas/Itens a Guardar no Bar:</span>
              <p class="text-slate-700 font-semibold">${savedItemsText} (Pagar no consumo)</p>
            </div>
          ` : ''}
          <div class="flex justify-between pt-2 border-t border-slate-200"><span class="text-slate-500 font-bold">Total Pago das Horas:</span><strong class="text-emerald-700 font-black">R$ ${price.toFixed(2).replace('.', ',')}</strong></div>
        </div>

        <div class="space-y-3">
          <a href="https://api.whatsapp.com/send?text=${shareText}" target="_blank" 
             class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md">
            <i data-lucide="share-2" class="w-4 h-4"></i>
            <span>Compartilhar no WhatsApp do Time</span>
          </a>

          <button onclick="resetFlow()" class="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all">
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function resetFlow() {
  closeModal();
  state.currentStep = 1;
  state.selectedCourt = null;
  state.selectedDate = null;
  state.startTime = null;
  state.endTime = null;
  state.productCart = {};
  state.appliedCoupon = null;
  state.couponCode = '';
  state.observation = '';
  renderApp();
}

// BARRA INFERIOR COM TRAVA DE ETAPA
function renderBottomBar() {
  const bar = document.getElementById('bottomBar');
  if (!bar) return;

  if (state.currentMode === 'admin' || state.currentStep === 1) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');

  const court = state.selectedCourt;
  const canProceed = canAdvanceFromStep(state.currentStep);

  let btnText = 'Próxima etapa';
  if (state.currentStep === 1) {
    btnText = court ? `Avançar: Data do Jogo (${court.name.split(' - ')[0]}) →` : 'Selecione um Espaço para Continuar';
  } else if (state.currentStep === 2) {
    btnText = state.selectedDate ? `Avançar: Horários (${formatDisplayDate(state.selectedDate)}) →` : 'Escolha um Dia no Calendário';
  } else if (state.currentStep === 3) {
    btnText = (state.startTime && state.endTime && canProceed) ? `Avançar: Resumo (${state.startTime} às ${state.endTime}) →` : 'Selecione um Horário Livre';
  } else if (state.currentStep === 4) {
    btnText = state.bookingType === 'mensalista' ? 'Confirmar Mensalidade' : 'Confirmar Agendamento';
  }

  calculateDuration();
  const isMensal = state.bookingType === 'mensalista';
  const hoursFraction = (state.selectedDuration || 60) / 60;
  const basePrice = getCourtHourlyPrice(court);
  const courtPrice = court ? (isMensal ? getCourtMonthlyPrice(court) : (basePrice * hoursFraction)) : 0;

  bar.innerHTML = `
    <div class="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
      ${state.currentStep > 1 ? `
        <button onclick="goToStep(${state.currentStep - 1})" 
                class="px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-1 sm:space-x-1.5 transition-all flex-shrink-0 touch-manipulation">
          <i data-lucide="chevron-left" class="w-4 h-4"></i>
          <span>Voltar</span>
        </button>
      ` : '<div></div>'}

      <div class="flex items-center space-x-2 sm:space-x-4">
        ${court && state.currentStep >= 3 ? `
          <div class="text-right">
            <span class="text-[10px] sm:text-[11px] text-slate-400 block font-bold leading-tight">${isMensal ? 'Mensal' : 'Total Horas'}</span>
            <span class="text-sm sm:text-base font-black text-emerald-900 leading-tight">
              R$ ${courtPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        ` : ''}

        <button onclick="nextStep()" ${!canProceed ? 'disabled' : ''} 
                class="btn-next-step px-5 sm:px-8 py-2.5 sm:py-3.5 text-white rounded-xl font-extrabold text-xs sm:text-base flex items-center space-x-1.5 sm:space-x-2 shadow-md touch-manipulation transition-all ${!canProceed ? 'opacity-50 cursor-not-allowed pointer-events-none bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'}">
          <span>${btnText}</span>
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

// Navegações e Ações
function selectCategory(catId) {
  state.selectedCategory = catId;
  renderStepContent();
  lucide.createIcons();
}

function handleSearch(query) {
  state.searchQuery = query;
  renderStepContent();
  lucide.createIcons();
}

function selectCourt(courtId) {
  state.productCart = {};
  const rawCourt = state.courts.find(c => c.id === courtId);
  if (!rawCourt) return;
  const court = normalizeCourt(rawCourt);
  const specs = court.specs || {};
  const isMaint = court.isMaintenance === true || court.status === 'maintenance' || specs.status === 'maintenance';
  if (isMaint) {
    const reason = specs.maintenance_reason || court.maintenance_reason || 'Manutenção preventiva';
    alert('A ' + court.name + ' está temporariamente em manutenção (' + reason + '). Por favor, selecione outra quadra disponível.');
    return;
  }
  state.selectedCourt = court;
  // Reseta seleção de data e horários anteriores para esta nova quadra
  state.selectedDate = null;
  state.startTime = null;
  state.endTime = null;
  
  // Avança imediatamente e direto para a Etapa 2 (Data do Jogo)
  goToStep(2);
}

function applyCoupon() {
  const code = state.couponCode.toUpperCase().trim();
  if (!code) return;

  const validCoupons = {
    'ARENA10': { code: 'ARENA10', discountPercent: 10, description: '10% de desconto na primeira reserva' },
    'FIMDESEMANA': { code: 'FIMDESEMANA', discountPercent: 15, description: '15% de desconto promocional' },
    'LIMOEIRO20': { code: 'LIMOEIRO20', discountPercent: 20, description: '20% de desconto para novos times' }
  };

  if (validCoupons[code]) {
    state.appliedCoupon = validCoupons[code];
    renderStepContent();
    lucide.createIcons();
    alert(`✓ Cupom ${code} aplicado com sucesso! Desconto de ${validCoupons[code].discountPercent}%`);
  } else {
    alert('Cupom inválido ou expirado.');
  }
}

function goToStep(step) {
  // Impede avançar para etapas futuras se as anteriores não estiverem concluídas
  if (step > 1 && !state.selectedCourt) {
    state.currentStep = 1;
    renderApp();
    return;
  }
  if (step > 2 && !state.selectedDate && state.bookingType !== 'mensalista') {
    state.currentStep = 2;
    renderApp();
    return;
  }
  if (step > 3 && (!state.startTime || !state.endTime || !canAdvanceFromStep(3))) {
    state.currentStep = 3;
    renderApp();
    return;
  }

  state.currentStep = step;
  if (step === 3 && state.selectedCourt && state.selectedDate) {
    requestSchedule();
  }
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  if (!canAdvanceFromStep(state.currentStep)) {
    if (state.currentStep === 1) alert('Por favor, selecione um espaço esportivo para continuar.');
    else if (state.currentStep === 2) alert('Por favor, selecione uma data no calendário para continuar.');
    else if (state.currentStep === 3) alert('Por favor, selecione um horário livre para sua partida.');
    return;
  }
  if (state.currentStep < 4) {
    goToStep(state.currentStep + 1);
  } else {
    openCheckoutModal();
  }
}

function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Handlers para Vinculação do Banco de Dados Supabase
async function handleSaveSupabaseConfig(event) {
  event.preventDefault();
  const url = document.getElementById('supabaseUrlInput').value.trim();
  const anonKey = document.getElementById('supabaseKeyInput').value.trim();
  const statusMsg = document.getElementById('supabaseStatusMsg');

  if (!window.ArenaSupabase) {
    alert('Cliente Supabase não carregado no navegador.');
    return;
  }

  statusMsg.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-800', 'bg-rose-50', 'text-rose-800');
  statusMsg.classList.add('bg-slate-100', 'text-slate-800');
  statusMsg.innerText = 'Testando conexão com o Supabase...';

  const res = await window.ArenaSupabase.saveConfig(url, anonKey);
  if (res.success) {
    statusMsg.className = 'p-3.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200';
    statusMsg.innerText = '✓ Conexão realizada com sucesso! O banco de dados Supabase está vinculado.';
    state.supabaseConnected = true;
    setTimeout(() => {
      renderStepContent();
      syncDataFromSupabase();
    }, 1200);
  } else {
    statusMsg.className = 'p-3.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200';
    statusMsg.innerText = 'Falha na conexão: ' + res.message;
  }
}

async function handleTestSupabaseConnection() {
  const statusMsg = document.getElementById('supabaseStatusMsg');
  if (!statusMsg) return;

  statusMsg.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-800', 'bg-rose-50', 'text-rose-800');
  statusMsg.classList.add('bg-slate-100', 'text-slate-800');
  statusMsg.innerText = 'Testando conexão...';

  if (!window.ArenaSupabase || !window.ArenaSupabase.getClient()) {
    statusMsg.className = 'p-3.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200';
    statusMsg.innerText = 'Preencha a URL e Chave do Supabase antes de testar.';
    return;
  }

  const res = await window.ArenaSupabase.testConnection();
  if (res.success) {
    statusMsg.className = 'p-3.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200';
    statusMsg.innerText = '✓ Conexão bem-sucedida com o Supabase!';
  } else {
    statusMsg.className = 'p-3.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200';
    statusMsg.innerText = 'Erro ao conectar: ' + res.message;
  }
}

function handleDisconnectSupabase() {
  if (confirm('Deseja desconectar o Supabase e voltar para o modo local?')) {
    if (window.ArenaSupabase) window.ArenaSupabase.disconnect();
    state.supabaseConnected = false;
    renderStepContent();
  }
}

async function loadSupabaseCustomers() {
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    const client = window.ArenaSupabase.getClient();
    const { data } = await client.from('customers').select('*').order('created_at', { ascending: false });
    if (data) {
      state.supabaseCustomers = data;
      if (state.currentMode === 'admin' && state.adminTab === 'customers') renderStepContent();
    }
  }
}

async function syncDataFromSupabase() {
  if (!window.ArenaSupabase || !window.ArenaSupabase.isReady()) return;
  const client = window.ArenaSupabase.getClient();

  try {
    const { data: dbCourts } = await client.from('courts').select('*').order('order_index', { ascending: true });
    if (dbCourts && dbCourts.length > 0) {
      state.courts = dbCourts.map(normalizeCourt);
      if (state.selectedCourt) {
        const matching = state.courts.find(c => c.id === state.selectedCourt.id);
        if (matching) state.selectedCourt = matching;
      }
    }

    const { data: dbProducts } = await client.from('products').select('*');
    if (dbProducts && dbProducts.length > 0) {
      state.products = dbProducts;
    }

    const { data: dbMembers } = await client.from('monthly_members').select('*');
    if (dbMembers) state.monthlyMembers = dbMembers;

    const { data: dbBookings } = await client.from('bookings').select('*');
    if (dbBookings) {
      state.bookings = dbBookings;
      const maintFromDb = dbBookings
        .filter(b => b.booking_type === 'manutencao' || b.bookingType === 'manutencao')
        .map(b => ({
          id: b.id,
          court_id: b.court_id,
          courtId: b.court_id,
          date: b.date,
          start_time: b.start_time,
          end_time: b.end_time,
          reason: b.observation || b.customer_name || 'Treino Reservado / Manutenção',
          type: 'manutencao'
        }));
      if (maintFromDb.length > 0) {
        const local = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
        const map = new Map();
        [...local, ...maintFromDb].forEach(item => map.set(item.id, item));
        state.maintenanceBlocks = Array.from(map.values());
        localStorage.setItem('arena_maintenance_blocks', JSON.stringify(state.maintenanceBlocks));
      }
    }

    renderApp();
    requestSchedule();

    // Ativa sincronização Realtime instantânea para reservas e mensalistas
    if (!window.supabaseRealtimeActive) {
      window.supabaseRealtimeActive = true;
      client.channel('realtime_arena')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async () => {
          const { data } = await client.from('bookings').select('*');
          if (data) {
            state.bookings = data;
            requestSchedule();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, async () => {
          const { data } = await client.from('monthly_members').select('*');
          if (data) {
            state.monthlyMembers = data;
            requestSchedule();
          }
        })
        .subscribe();
    }
  } catch (err) {
    console.warn('Erro na sincronização Supabase:', err);
  }
}
