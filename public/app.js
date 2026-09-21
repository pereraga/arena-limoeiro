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

function formatPhone(val) {
  if (!val) return '';
  const num = String(val).replace(/\D/g, '').slice(0, 11);
  if (num.length === 0) return '';
  if (num.length <= 2) return '(' + num;
  if (num.length <= 6) return '(' + num.slice(0, 2) + ') ' + num.slice(2);
  if (num.length <= 10) return '(' + num.slice(0, 2) + ') ' + num.slice(2, 6) + '-' + num.slice(6);
  return '(' + num.slice(0, 2) + ') ' + num.slice(2, 7) + '-' + num.slice(7, 11);
}

function formatCPF(val) {
  if (!val) return '';
  const num = String(val).replace(/\D/g, '').slice(0, 11);
  if (num.length <= 3) return num;
  if (num.length <= 6) return num.slice(0, 3) + '.' + num.slice(3);
  if (num.length <= 9) return num.slice(0, 3) + '.' + num.slice(3, 6) + '.' + num.slice(6);
  return num.slice(0, 3) + '.' + num.slice(3, 6) + '.' + num.slice(6, 9) + '-' + num.slice(9, 11);
}

function validateCPF(cpf) {
  if (!cpf) return false;
  const clean = String(cpf).replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}


// Detecta se a URL requisita modo admin ou se o gestor já estava logado
const _initialUrlParams = new URLSearchParams(window.location.search);
const _isAdminUrl = _initialUrlParams.get('admin') === 'true' || _initialUrlParams.get('mode') === 'admin';
let _savedArenaUser = null;
try {
  _savedArenaUser = JSON.parse(localStorage.getItem('arena_user') || 'null');
} catch(e) {}

// Validação estrita de credenciais aceitas:
// O usuário precisa ter sido autenticado com sucesso no login da gerência (authenticated === true)
const _isUserProperlyLogged = !!(
  _savedArenaUser && 
  _savedArenaUser.email && 
  _savedArenaUser.role && 
  _savedArenaUser.authenticated === true
);

if (!_isUserProperlyLogged) {
  _savedArenaUser = null;
  try { localStorage.removeItem('arena_user'); } catch(e) {}
}

// 🔐 CONTROLE GLOBAL DE AUTENTICAÇÃO DO GESTOR
function isManagerLoggedIn() {
  if (!state || !state.currentUser) return false;
  const u = state.currentUser;
  if (!u.email || typeof u.email !== 'string') return false;
  if (!u.role || typeof u.role !== 'string') return false;
  if (u.authenticated !== true) return false;

  try {
    const saved = JSON.parse(localStorage.getItem('arena_user') || 'null');
    if (!saved || !saved.email || saved.authenticated !== true) return false;
    if (saved.email.toLowerCase() !== u.email.toLowerCase()) return false;
  } catch(e) {
    return false;
  }

  return true;
}
window.isManagerLoggedIn = isManagerLoggedIn;

// Se o usuário tentar acessar a URL de admin sem estar logado, solicitamos o login
if (_isAdminUrl && !_isUserProperlyLogged) {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!isManagerLoggedIn() && typeof openLoginModal === 'function') {
        openLoginModal(() => {
          state.currentMode = 'admin';
          state.adminTab = 'live_dashboard';
          renderApp();
        });
      }
    }, 350);
  });
}

// Gerenciador Arena Limoeiro - Data Primeiro, Horários Disponíveis Ocultando Ocupados
let state = {
  currentStep: 1,
  currentMode: _isUserProperlyLogged ? 'admin' : 'client',
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
  adminFilterDate: getFormattedDate(new Date()),
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
  systemLogs: [],
  systemLogsSearchQuery: '',
  systemLogsFilter: 'all',
  waterSupply: {
    full: 20,
    empty: 5,
    min_alert: 5,
    history: []
  },
  barSubTab: 'menu',
  
  sortBy: 'default',
  currentUser: _savedArenaUser,
  bookingType: 'avulso', // 'avulso' ou 'mensalista'
  monthlyDayOfWeek: 'terca',
  
  selectedCategory: 'all',
  searchQuery: '',
  selectedCourt: null,
  
  // DATA SELECIONADA PRIMEIRO
  selectedDate: null, // Definido apenas ao escolher no calendário
  currentMonthDate: new Date(),
  
  // DURAÇÃO E HORÁRIOS SELECIONADOS NA ETAPA 3
  startTime: null,
  endTime: null,
  selectedSlots: [],
  selectedDuration: 0,
  
  productCart: {}, // Produtos guardados para o agendamento (não somam no valor online)
  
  observation: '',
  couponCode: '',
  appliedCoupon: null,
  customerName: '',
  customerPhone: '',
  paymentMethod: 'pix',
  
  slots: [], // Horários do dia com status 'available', 'booked', 'blocked_admin'
  maintenanceBlocks: JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]'),
  matchDelays: JSON.parse(localStorage.getItem('arena_match_delays') || '{}')
};

// ==============================================================================
// 🏟️ NORMALIZADOR DE QUADRAS / ESPAÇOS (COMPATIBILIDADE SUPABASE & LOCAL)
// ==============================================================================
function normalizeCourt(c) {
  if (!c) return null;
  const price = parseFloat(c.basePricePerHour || c.base_price_per_hour || 140);
  const monthly = parseFloat(c.monthlyPrice || c.monthly_price || (price * 3.6));
  const foundCat = (state.categories || []).find(cat => cat.id === c.category);
  const catLabel = (foundCat ? foundCat.name : null) || c.categoryLabel || c.category_label || (
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
  const isMaint = c.isMaintenance === true || c.status === 'maintenance' || specsObj.status === 'maintenance';
  const maintReason = specsObj.maintenance_reason || c.maintenanceReason || c.maintenance_reason || '';
  const maintNotice = specsObj.maintenance_notice || c.maintenanceNotice || c.maintenance_notice || '';
  const badgeMode = specsObj.badge_mode || c.badge_mode || (c.badge ? 'manual' : 'none');
  const badgeText = specsObj.badge_text !== undefined ? specsObj.badge_text : (c.badge || '');
  const badgeAutoFreq = specsObj.badge_auto_freq || c.badge_auto_freq || 'weekly';

  let specsGallery = (specsObj && Array.isArray(specsObj.gallery) && specsObj.gallery.length > 0)
    ? specsObj.gallery
    : (c.gallery && Array.isArray(c.gallery) && c.gallery.length > 0 ? c.gallery : (c.image ? [c.image] : []));
  specsGallery = specsGallery.filter(Boolean);
  if (specsGallery.length === 0 && c.image) specsGallery = [c.image];
  if (specsGallery.length === 0) specsGallery = ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'];
  specsObj.gallery = specsGallery;

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
    gallery: specsGallery,
    isMaintenance: isMaint,
    status: isMaint ? 'maintenance' : (specsObj.status || c.status || 'active'),
    maintenanceReason: maintReason,
    maintenance_reason: maintReason,
    maintenanceNotice: maintNotice,
    maintenance_notice: maintNotice,
    badge: c.badge || null,
    badgeMode: badgeMode,
    badge_mode: badgeMode,
    badgeText: badgeText,
    badge_text: badgeText,
    badgeAutoFreq: badgeAutoFreq,
    badge_auto_freq: badgeAutoFreq,
    discountPricePerHour: parseFloat(c.discountPricePerHour || c.discount_price_per_hour || specsObj.discount_price_per_hour || 0),
    discount_price_per_hour: parseFloat(c.discountPricePerHour || c.discount_price_per_hour || specsObj.discount_price_per_hour || 0),
    discountStartTime: specsObj.discount_start_time || c.discountStartTime || '09:00',
    discountEndTime: specsObj.discount_end_time || c.discountEndTime || '16:00',
    image: specsGallery[0] || c.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'
  };
}

// ==============================================================================
// 👤 NORMALIZADOR DE CLIENTES / ATLETAS (COMPATIBILIDADE SUPABASE & LOCAL)
// ==============================================================================
function parseCustomerNotes(notes) {
  const result = { emergency_contact: '', health_notes: '', birth_date: '', cpf: '' };
  if (!notes) return result;
  if (typeof notes === 'object') {
    return {
      emergency_contact: notes.emergency_contact || notes.emergencyContact || '',
      health_notes: notes.health_notes || notes.healthNotes || '',
      birth_date: notes.birth_date || notes.birthDate || '',
      cpf: notes.cpf || ''
    };
  }
  const trimmed = String(notes).trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      return {
        emergency_contact: obj.emergency_contact || obj.emergencyContact || '',
        health_notes: obj.health_notes || obj.healthNotes || '',
        birth_date: obj.birth_date || obj.birthDate || '',
        cpf: obj.cpf || ''
      };
    } catch(e) {}
  }
  const parts = trimmed.split(/\s*\|\s*/);
  for (const part of parts) {
    if (/^emerg[êe]ncia:\s*/i.test(part)) {
      result.emergency_contact = part.replace(/^emerg[êe]ncia:\s*/i, '').trim();
    } else if (/^sa[úu]de:\s*/i.test(part)) {
      result.health_notes = part.replace(/^sa[úu]de:\s*/i, '').trim();
    } else if (/^nascimento:\s*/i.test(part)) {
      result.birth_date = part.replace(/^nascimento:\s*/i, '').trim();
    } else if (/^cpf:\s*/i.test(part)) {
      result.cpf = part.replace(/^cpf:\s*/i, '').trim();
    }
  }
  if (!result.emergency_contact) {
    const m = trimmed.match(/emerg[êe]ncia:\s*([^|\n]+)/i);
    if (m) result.emergency_contact = m[1].trim();
  }
  if (!result.health_notes) {
    const m = trimmed.match(/sa[úu]de:\s*([^|\n]+)/i);
    if (m) result.health_notes = m[1].trim();
  }
  if (!result.birth_date) {
    const m = trimmed.match(/nascimento:\s*([^|\n]+)/i);
    if (m) result.birth_date = m[1].trim();
  }
  if (!result.cpf) {
    const m = trimmed.match(/cpf:\s*([^|\n]+)/i);
    if (m) result.cpf = m[1].trim();
  }
  return result;
}

function normalizeCustomer(raw) {
  if (!raw) return null;
  const parsed = parseCustomerNotes(raw.notes);
  const rawCpf = raw.cpf || raw.customer_cpf || raw.customerCPF || raw.document || parsed.cpf || '';
  const cpf = rawCpf ? formatCPF(rawCpf) : '';
  const emergencyContact = raw.emergency_contact || raw.emergencyContact || raw.emergency || parsed.emergency_contact || '';
  const birthDate = raw.birth_date || raw.birthDate || parsed.birth_date || '';
  const healthNotes = raw.health_notes || raw.healthNotes || parsed.health_notes || '';

  return {
    ...raw,
    id: raw.id || ('cust-' + Date.now()),
    name: raw.name || raw.customer_name || raw.customerName || 'Atleta',
    phone: raw.phone || raw.customer_phone || raw.customerPhone || '',
    email: raw.email || raw.customer_email || raw.customerEmail || '',
    cpf: cpf,
    document: cpf,
    emergency_contact: emergencyContact,
    emergencyContact: emergencyContact,
    birth_date: birthDate,
    birthDate: birthDate,
    health_notes: healthNotes,
    healthNotes: healthNotes
  };
}

// ⭐ Retorna o badge / destaque da quadra (calculado automaticamente ou definido manualmente)
function getCourtDisplayBadge(court) {
  if (!court) return '';
  const specs = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
  const mode = specs.badge_mode || court.badge_mode || (court.badge ? 'manual' : 'none');

  if (mode === 'none') {
    return '';
  }

  if (mode === 'manual') {
    const text = specs.badge_text !== undefined ? specs.badge_text : (court.badge || '');
    return (text || '').trim();
  }

  if (mode === 'auto') {
    const freq = specs.badge_auto_freq || court.badge_auto_freq || 'weekly';
    const now = new Date();
    const todayStr = getFormattedDate(now);
    const allBookings = (state.bookings || []).filter(b => b.status !== 'cancelled');

    if (freq === 'daily') {
      const todayBookings = allBookings.filter(b => b.date === todayStr);
      const courtCounts = {};
      todayBookings.forEach(b => {
        const cId = b.court_id || b.courtId;
        courtCounts[cId] = (courtCounts[cId] || 0) + 1;
      });
      const myCount = courtCounts[court.id] || 0;
      if (myCount === 0) return '';
      const maxCount = Math.max(...Object.values(courtCounts), 0);
      if (myCount === maxCount && maxCount >= 2) {
        return `🔥 Mais Agendado Hoje (${myCount} jogos)`;
      } else if (myCount >= 2) {
        return `⚡ Alta Procura Hoje`;
      }
      return '';
    } else {
      // Semanal (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekBookings = allBookings.filter(b => {
        if (!b.date) return false;
        const bDate = new Date(b.date + 'T12:00:00');
        return bDate >= sevenDaysAgo && bDate <= now;
      });
      const courtCounts = {};
      weekBookings.forEach(b => {
        const cId = b.court_id || b.courtId;
        courtCounts[cId] = (courtCounts[cId] || 0) + 1;
      });
      const myCount = courtCounts[court.id] || 0;
      if (myCount === 0) return '';
      const maxCount = Math.max(...Object.values(courtCounts), 0);
      if (myCount === maxCount && maxCount >= 2) {
        return `🔥 Mais Agendado da Semana`;
      } else if (myCount >= 3) {
        return `⚡ Alta Procura`;
      }
      return '';
    }
  }

  return (court.badge || '').trim();
}

function getCourtNormalHourlyPrice(court) {
  if (!court) return 140;
  return parseFloat(court.basePricePerHour || court.base_price_per_hour || 140);
}

function getCourtDiscountInfo(court) {
  if (!court) return { hasDiscount: false, discountPrice: 0, startHour: '09:00', endHour: '16:00' };
  const specs = court.specs ? (typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : court.specs) : {};
  const discountPrice = parseFloat(court.discountPricePerHour || court.discount_price_per_hour || specs.discount_price_per_hour || 0);
  const startHour = specs.discount_start_time || court.discountStartTime || court.discount_start_time || '09:00';
  const endHour = specs.discount_end_time || court.discountEndTime || court.discount_end_time || '16:00';
  const hasDiscount = discountPrice > 0;
  return { hasDiscount, discountPrice, startHour, endHour };
}

function isCourtDiscountTime(court, time) {
  if (!court || !time) return false;
  const { hasDiscount, startHour, endHour } = getCourtDiscountInfo(court);
  if (!hasDiscount) return false;

  const tMin = timeToMinutes(time);
  const sMin = timeToMinutes(startHour);
  const eMin = timeToMinutes(endHour);

  return tMin >= sMin && tMin <= eMin;
}

function getCourtHourlyPrice(court, time = null) {
  if (!court) return 140;
  const normalPrice = getCourtNormalHourlyPrice(court);
  const checkTime = time || (typeof state !== 'undefined' ? state.startTime : null);
  if (checkTime && isCourtDiscountTime(court, checkTime)) {
    const { discountPrice } = getCourtDiscountInfo(court);
    if (discountPrice > 0) return discountPrice;
  }
  return normalPrice;
}

function getCourtMonthlyPrice(court) {
  if (!court) return 500;
  return parseFloat(court.monthlyPrice || court.monthly_price || (getCourtNormalHourlyPrice(court) * 3.6));
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
  if (!state.startTime || !state.endTime) {
    if (!state.selectedDuration || state.selectedDuration < 30) {
      state.selectedDuration = 60;
    }
    return;
  }
  const startMin = timeToMinutes(state.startTime);
  let endMin = timeToMinutes(state.endTime);
  if (endMin <= startMin) {
    endMin = startMin + (state.selectedDuration || 60);
    state.endTime = minutesToTime(endMin);
  }
  state.selectedDuration = endMin - startMin;
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Carrega dados padrão locais imediatamente para que o estado básico esteja pronto
  loadInitialData();
  initEventListeners();

  // 2. ⚡ SINCRONIZAÇÃO INSTANTÂNEA ANTES DE RENDERIZAR:
  // Carrega os dados reais da nuvem em paralelo (<150ms) ANTES da primeira renderização da tela.
  // Isso elimina o atraso de 1s e impede totalmente que o site mostre informações antigas ao abrir.
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      await Promise.race([
        syncDataFromSupabase(true),
        new Promise(resolve => setTimeout(resolve, 800)) // timeout de proteção de 800ms
      ]);
    } catch (e) {
      console.warn('Aviso sincronização inicial:', e);
    }
  }

  // 3. Renderiza o site com os dados 100% atualizados em primeira mão
  renderApp();
  requestSchedule();

  autoAdvanceFinishedMatches();
  setInterval(autoAdvanceFinishedMatches, 30000);
  setInterval(liveDashboardHeartbeat, 10000); // Atualização ao vivo contínua dos cronômetros e jogos
  setInterval(() => {
    if (state.currentStep === 3 && state.selectedCourt && state.selectedDate) {
      const now = new Date();
      if (state.selectedDate === getFormattedDate(now)) {
        requestSchedule();
      }
    }
  }, 30000); // Atualiza os horários para ocultar os que acabaram de passar

  // Registra Service Worker para notificações em segundo plano no celular
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=4.8.2').catch(err => {
      console.warn('Aviso Service Worker:', err);
    });
  }

  // Desbloqueia o canal de áudio e solicita permissão nativa de notificação no mobile no 1º toque
  const unlockAudioAndNotif = () => {
    getArenaAudioContext();
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch(e) {}
    }
  };
  ['click', 'touchstart', 'touchend', 'pointerdown'].forEach(evt => {
    window.addEventListener(evt, unlockAudioAndNotif, { once: true });
  });

  // 4. ⚡ Atualização instantânea ao sair/minimizar e voltar para a aba (sem nenhum atraso)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAndSyncBookingsBackground();
    }
  });
  window.addEventListener('focus', () => {
    checkAndSyncBookingsBackground();
  });

  // Polling em segundo plano a cada 3.5s para sincronizar agendamentos em tempo real de forma blindada
  setInterval(checkAndSyncBookingsBackground, 3500);
});

// BATIMENTO AO VIVO: Atualiza a contagem dos cronômetros sem resetar o scroll da tela
function liveDashboardHeartbeat() {
  if (state.currentMode === 'admin' && (state.adminTab || 'live_dashboard') === 'live_dashboard') {
    const hasOpenModal = document.querySelector('.fixed.inset-0:not(.hidden)');
    if (!hasOpenModal) {
      const scrollY = window.scrollY;
      renderStepContent();
      window.scrollTo(0, scrollY);
      if (window.lucide) lucide.createIcons();
    }
  }
}

function loadInitialData() {
  if (window.ARENA_DEFAULT_DATA) {
    const d = window.ARENA_DEFAULT_DATA;
    state.arenaInfo = d.arenaInfo;
    const defaultCats = d.categories || [];
    const localCats = JSON.parse(localStorage.getItem('arena_categories') || 'null');
    if (Array.isArray(localCats) && localCats.length > 0) {
      state.categories = localCats;
      if (!state.categories.some(c => c.id === 'all')) {
        state.categories.unshift({ id: 'all', name: 'Todos os Espaços', icon: 'layout-grid' });
      }
    } else {
      state.categories = [...defaultCats];
    }
    const localCourts = JSON.parse(localStorage.getItem('arena_local_courts') || 'null');
    if (localCourts !== null && Array.isArray(localCourts)) {
      state.courts = localCourts.map(normalizeCourt);
    } else {
      state.courts = (d.initialCourts || []).map(normalizeCourt);
    }
    const localProducts = JSON.parse(localStorage.getItem('arena_local_products') || 'null');
    if (localProducts && Array.isArray(localProducts) && localProducts.length > 0) {
      state.products = localProducts;
    } else {
      state.products = d.initialProducts;
    }
    // Limpeza completa de mensalistas fictícios antigos do cache local
    const rawLocalMonthly = JSON.parse(localStorage.getItem('arena_monthly_members') || '[]');
    const cleanLocalMonthly = (Array.isArray(rawLocalMonthly) ? rawLocalMonthly : []).filter(m => {
      if (!m || !m.id) return false;
      const idStr = String(m.id);
      if (idStr.startsWith('arena-fixo-') || idStr.startsWith('mensal-')) return false;
      const nameStr = (m.team_name || m.teamName || '').toLowerCase();
      if (nameStr.includes('galácticos') || nameStr.includes('resenha & futebol') || nameStr.includes('churrasco & bola') || nameStr.includes('amigos da segunda')) return false;
      return true;
    });
    localStorage.setItem('arena_monthly_members', JSON.stringify(cleanLocalMonthly));
    state.monthlyMembers = cleanLocalMonthly;
    const defaultAdmins = d.initialAdmins || [];
    const localAdmins = JSON.parse(localStorage.getItem('arena_admin_users') || '[]');
    const mergedAdminsMap = new Map();
    defaultAdmins.forEach(u => { if (u && (u.id || u.email)) mergedAdminsMap.set(u.id || u.email, u); });
    localAdmins.forEach(u => { if (u && (u.id || u.email)) mergedAdminsMap.set(u.id || u.email, u); });
    state.adminUsers = Array.from(mergedAdminsMap.values());
    state.coupons = d.coupons;
    const localSaved = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    const cleanedLocal = localSaved.filter(b => b && b.id && b.status !== 'cancelled' && !['ARENA-1001', 'ARENA-1002', 'ARENA-1004'].includes(b.id));
    cleanedLocal.forEach(b => {
      if (b && (b.id === 'ARENA-6776' || b.id === 'ARENA-9247')) {
        b.product_cart = {};
      }
    });
    localStorage.setItem('arena_local_bookings', JSON.stringify(cleanedLocal));
    state.bookings = cleanedLocal;
    state.maintenanceBlocks = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
    state.matchDelays = JSON.parse(localStorage.getItem('arena_match_delays') || '{}');
    try {
      state.systemLogs = JSON.parse(localStorage.getItem('arena_system_logs') || '[]');
    } catch(e) {
      state.systemLogs = [];
    }
    try {
      const resetKey = 'arena_water_reset_v4837_zero';
      if (!localStorage.getItem(resetKey)) {
        state.waterSupply = { full: 0, empty: 0, min_alert: 5, history: [] };
        localStorage.setItem('arena_water_supply', JSON.stringify(state.waterSupply));
        localStorage.setItem(resetKey, 'true');
      } else {
        const localWater = JSON.parse(localStorage.getItem('arena_water_supply') || 'null');
        if (localWater && typeof localWater.full === 'number') state.waterSupply = localWater;
      }
    } catch(e) {}
  }
}


function initCloudSync() {
  // Sistema 100% Cloud Serverless no Vercel integrado ao Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    syncDataFromSupabase();
    loadAdminUsers();
    loadWaterSupplyFromDatabase();
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
      const delay = (state.matchDelays && state.matchDelays[b.id]?.minutes) || 0;
      // Permite tolerância de 20 minutos além do atraso antes de encerrar silenciosamente,
      // permitindo que o gestor acompanhe o estouro de tempo ao vivo e acerte os atrasos
      if (eMin && currentMinutes >= (eMin + delay + 20)) {
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
  } else if (state.currentStep === 3) {
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

  const now = new Date();
  const todayStr = getFormattedDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (date < todayStr) {
    return { conflict: true, reason: 'Não é possível agendar partidas em datas anteriores.' };
  }

  if (date === todayStr && sMin <= currentMinutes) {
    return { 
      conflict: true, 
      reason: `O horário selecionado (${startTime}) já se encerrou no dia de hoje. Por favor, selecione um horário futuro a partir de agora.` 
    };
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
      reason: `Este horário já está reservado para o time com horário fixo: ${(monthlyConflict.team_name || monthlyConflict.teamName)}.` 
    };
  }

  // 3. Reservas ativas no mesmo campo e data (ANTI-CHOQUE)
  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

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
  const allHours = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  const currentCourt = (state.courts || []).find(c => c.id === courtId);
  const courtSpecs = currentCourt ? (typeof currentCourt.specs === 'string' ? JSON.parse(currentCourt.specs || '{}') : (currentCourt.specs || {})) : {};

  let operatingHours = allHours;
  if (courtSpecs.opening_time && courtSpecs.closing_time) {
    const sMin = timeToMinutes(courtSpecs.opening_time);
    const eMin = timeToMinutes(courtSpecs.closing_time);
    const filtered = allHours.filter(t => {
      const tMin = timeToMinutes(t);
      return tMin >= sMin && tMin <= eMin;
    });
    if (filtered.length > 0) operatingHours = filtered;
  }
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

  const now = new Date();
  const todayStr = getFormattedDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isDateToday = date === todayStr;
  const isDatePast = date < todayStr;

  // 1. Janelas de Manutenção / Treinos Reservados por Horário
  const localMaint = JSON.parse(localStorage.getItem('arena_maintenance_blocks') || '[]');
  const allMaint = [...(state.maintenanceBlocks || []), ...localMaint];

  // 2. Bookings consolidados
  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

  return operatingHours.map(time => {
    const slotMin = timeToMinutes(time);
    const isSlotPast = isDatePast || (isDateToday && slotMin < currentMinutes);

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
        isPast: isSlotPast,
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
        isPast: isSlotPast,
        customerName: (monthlyHolder.team_name || monthlyHolder.teamName) + " (" + (monthlyHolder.responsible_name || monthlyHolder.responsibleName) + ")",
        isAvailable: false
      };
    }

    // Checagem 3: Reservas avulsas ou treinos salvos
    const booking = allBookings.find(b => {
      const bCourtId = b.court_id || b.courtId;
      if (bCourtId !== courtId || b.date !== date) return false;
      if (b.status === 'cancelled') return false;
      if (b.status === 'finished') {
        const finishEndMin = timeToMinutes(b.end_time || b.endTime || '00:00');
        if (slotMin >= finishEndMin) return false;
      }

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
        isPast: isSlotPast,
        customerName: booking.customer_name || booking.customerName || (isM ? "Treino Reservado" : "Cliente"),
        isAvailable: false
      };
    }

    // Checagem se há um agendamento finalizando exatamente neste horário (ex: jogo anterior encerra às 11:00)
    const endingBooking = allBookings.find(b => {
      const bCourtId = b.court_id || b.courtId;
      if (bCourtId !== courtId || b.date !== date) return false;
      if (b.status === 'cancelled') return false;
      const bEnd = b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : null);
      return bEnd && timeToMinutes(bEnd) === slotMin;
    });

    // Checagem 4: Bloqueio automático de horários que já passaram hoje ou em datas anteriores
    if (isSlotPast) {
      return {
        time,
        status: "past",
        statusLabel: "Horário Encerrado",
        isPast: true,
        isAvailable: false,
        endsBooking: endingBooking ? {
          customerName: endingBooking.customer_name || endingBooking.customerName || 'Cliente',
          time: endingBooking.time,
          startTime: endingBooking.start_time || endingBooking.startTime,
          endTime: endingBooking.end_time || endingBooking.endTime
        } : null
      };
    }

    return {
      time,
      status: "available",
      statusLabel: "Livre para Agendamento",
      isAvailable: true,
      endsBooking: endingBooking ? {
        customerName: endingBooking.customer_name || endingBooking.customerName || 'Cliente',
        time: endingBooking.time,
        startTime: endingBooking.start_time || endingBooking.startTime,
        endTime: endingBooking.end_time || endingBooking.endTime
      } : null
    };
  });
}

let isRenderingStep3 = false;

function requestSchedule() {
  if (!state.selectedCourt || !state.selectedDate) return;

  // 1. Gera e atualiza a grade localmente na hora (autônomo para Vercel)
  state.slots = calculateLocalSchedule(state.selectedCourt.id, state.selectedDate);

  // Se houver slots selecionados que ficaram indisponíveis na data/campo, limpa a seleção
  if (Array.isArray(state.selectedSlots) && state.selectedSlots.length > 0) {
    const hasUnavailable = state.selectedSlots.some(time => {
      if (time === state.endTime) return false;
      const slot = (state.slots || []).find(s => s.time === time);
      return !slot || slot.status !== 'available';
    });
    if (hasUnavailable) {
      state.selectedSlots = [];
      state.startTime = null;
      state.endTime = null;
      state.selectedDuration = 0;
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
    const displayName = (state.currentUser?.name && state.currentUser.name !== 'Administrador Geral') 
      ? state.currentUser.name 
      : (state.currentUser?.email === 'admin@arenalimoeiro.com.br' ? 'Gabriel Alves' : (state.currentUser?.name || 'Gabriel Alves'));

    stepperContainer.innerHTML = `
      <div class="flex items-center justify-between w-full bg-black/60 p-2 sm:px-4 sm:py-2.5 rounded-2xl border border-emerald-500/30 gap-2 overflow-x-auto scrollbar-none">
        <div class="flex items-center space-x-1.5 sm:space-x-2 text-xs text-emerald-300 min-w-0 flex-shrink truncate">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
          <span class="truncate">Olá tudo bom, <strong class="text-white">${displayName}</strong></span>
        </div>

        <div class="flex items-center space-x-1.5 sm:space-x-2 text-xs flex-shrink-0">
          <button onclick="switchToClientView()" 
                  class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold flex items-center space-x-1 whitespace-nowrap transition-all shadow-sm flex-shrink-0 cursor-pointer" 
                  title="Alternar para a visão pública do cliente">
            <i data-lucide="eye" class="w-3.5 h-3.5 flex-shrink-0"></i>
            <span class="hidden sm:inline">Ver Tela do Cliente</span>
            <span class="sm:hidden">Ver Cliente</span>
          </button>

          <button onclick="logoutAdmin()" 
                  class="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-bold flex items-center space-x-1 whitespace-nowrap transition-all shadow-sm flex-shrink-0 cursor-pointer" 
                  title="Sair do painel">
            <i data-lucide="log-out" class="w-3.5 h-3.5 flex-shrink-0"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
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

// 📸 NAVEGAÇÃO E SWIPE DO CARROSSEL DE FOTOS DAS QUADRAS
let _courtTouchStartX = 0;
let _courtTouchStartY = 0;
window._lastCourtSwipeTime = 0;

function handleCourtTouchStart(event, courtId) {
  if (!event.touches || event.touches.length === 0) return;
  _courtTouchStartX = event.touches[0].clientX;
  _courtTouchStartY = event.touches[0].clientY;
}

function handleCourtTouchEnd(event, courtId) {
  if (!event.changedTouches || event.changedTouches.length === 0) return;
  const deltaX = event.changedTouches[0].clientX - _courtTouchStartX;
  const deltaY = event.changedTouches[0].clientY - _courtTouchStartY;

  // Verifica se o movimento foi predominantemente horizontal (>30px)
  if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
    window._lastCourtSwipeTime = Date.now();
    const delta = deltaX < 0 ? 1 : -1; // Deslizar esquerda = próxima foto; direita = foto anterior
    changeCourtImage(courtId, delta, event);
  }
}

function changeCourtImage(courtId, delta, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }
  const court = (state.courts || []).find(c => c.id === courtId);
  if (!court) return;

  const specs = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
  const gallery = (specs && Array.isArray(specs.gallery) && specs.gallery.length > 0)
    ? specs.gallery
    : (court.gallery && Array.isArray(court.gallery) && court.gallery.length > 0 ? court.gallery : [court.image].filter(Boolean));

  if (gallery.length <= 1) return;

  state.courtPhotoIndex = state.courtPhotoIndex || {};
  let curIdx = (state.courtPhotoIndex[courtId] !== undefined) ? state.courtPhotoIndex[courtId] : 0;
  curIdx = (curIdx + delta + gallery.length) % gallery.length;
  state.courtPhotoIndex[courtId] = curIdx;

  const imgEl = document.getElementById(`court-img-${courtId}`);
  if (imgEl) {
    imgEl.style.opacity = '0.3';
    imgEl.src = gallery[curIdx];
    setTimeout(() => {
      imgEl.style.opacity = '1';
    }, 60);
  }

  const dotsEl = document.getElementById(`court-dots-${courtId}`);
  if (dotsEl) {
    dotsEl.innerHTML = gallery.map((_, i) => `
      <span class="inline-block transition-all duration-300 rounded-full shadow-sm ${i === curIdx ? 'w-3.5 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-white/60'}"></span>
    `).join('');
  }

  const counterEl = document.getElementById(`court-counter-${courtId}`);
  if (counterEl) {
    counterEl.innerHTML = `
      <i data-lucide="camera" class="w-3 h-3 text-emerald-400"></i>
      <span>${curIdx + 1}/${gallery.length}</span>
    `;
    if (window.lucide) lucide.createIcons();
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
            <i data-lucide="${cat.icon || 'tag'}" class="w-3.5 h-3.5"></i>
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

          const courtGallery = (specs && Array.isArray(specs.gallery) && specs.gallery.length > 0)
            ? specs.gallery
            : (court.gallery && Array.isArray(court.gallery) && court.gallery.length > 0 ? court.gallery : [court.image].filter(Boolean));
          
          state.courtPhotoIndex = state.courtPhotoIndex || {};
          const currentPhotoIdx = (state.courtPhotoIndex[court.id] !== undefined) ? state.courtPhotoIndex[court.id] : 0;
          const safeIdx = (currentPhotoIdx >= 0 && currentPhotoIdx < courtGallery.length) ? currentPhotoIdx : 0;
          const currentActiveImage = courtGallery[safeIdx] || court.image;

          const registeredFixos = (state.monthlyMembers || []).filter(m => (m.courtId === court.id || m.court_id === court.id));
          const fixosList = registeredFixos.map(m => `${m.team_name || m.teamName} (${(m.day_of_week_label || m.dayOfWeekLabel || 'Semanal')} ${m.time})`);

          return `
            <div onclick="selectCourt('${court.id}')" 
                 class="court-card bg-white rounded-3xl overflow-hidden cursor-pointer relative flex flex-col border border-slate-200 shadow-sm">
              
              <!-- Carrossel de Fotos da Quadra -->
              <div class="relative h-48 w-full overflow-hidden bg-slate-900 court-carousel group select-none"
                   id="court-carousel-${court.id}"
                   ontouchstart="handleCourtTouchStart(event, '${court.id}')"
                   ontouchend="handleCourtTouchEnd(event, '${court.id}')">
                
                <img id="court-img-${court.id}" src="${currentActiveImage}" alt="${court.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'"
                     class="w-full h-full object-cover transition-opacity duration-300">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                <!-- Setinhas de navegação para Desktop / Cliques -->
                ${courtGallery.length > 1 ? `
                  <button type="button" 
                          onclick="changeCourtImage('${court.id}', -1, event)" 
                          title="Foto anterior"
                          class="court-nav-arrow absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg cursor-pointer hover:scale-110 active:scale-95">
                    <i data-lucide="chevron-left" class="w-4 h-4"></i>
                  </button>

                  <button type="button" 
                          onclick="changeCourtImage('${court.id}', 1, event)" 
                          title="Próxima foto"
                          class="court-nav-arrow absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg cursor-pointer hover:scale-110 active:scale-95">
                    <i data-lucide="chevron-right" class="w-4 h-4"></i>
                  </button>

                  <!-- Indicador de Bolinhas (Dots) -->
                  <div id="court-dots-${court.id}" class="absolute bottom-2.5 right-3 flex items-center space-x-1.5 z-10 pointer-events-none">
                    ${courtGallery.map((_, i) => `
                      <span class="inline-block transition-all duration-300 rounded-full shadow-sm ${i === safeIdx ? 'w-3.5 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-white/60'}"></span>
                    `).join('')}
                  </div>

                  <!-- Contador de Fotos -->
                  <div class="absolute top-3 right-3 z-10 pointer-events-none">
                    <span id="court-counter-${court.id}" class="bg-black/75 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md border border-white/20 shadow-sm flex items-center gap-1">
                      <i data-lucide="camera" class="w-3 h-3 text-emerald-400"></i>
                      <span>${safeIdx + 1}/${courtGallery.length}</span>
                    </span>
                  </div>
                ` : ''}

                <!-- Badges de Categoria e Manutenção -->
                <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                  <span class="bg-black/80 backdrop-blur-md text-emerald-400 text-[11px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    ${categoryLabel}
                  </span>
                  ${(court.isMaintenance || (specs && specs.status === 'maintenance')) ? `
                    <span class="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-rose-400/50 shadow-md flex items-center animate-pulse">
                      <i data-lucide="wrench" class="w-3 h-3 mr-1"></i> EM MANUTENÇÃO
                    </span>
                  ` : (specs && specs.maintenance_notice ? `
                    <span class="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-300 shadow-md flex items-center animate-pulse">
                      <i data-lucide="alert-triangle" class="w-3 h-3 mr-1"></i> AVISO PRÉVIO DE MANUTENÇÃO
                    </span>
                  ` : (() => {
                    const dispBadge = getCourtDisplayBadge(court);
                    if (!dispBadge) return '';
                    return `
                      <span class="bg-emerald-950/90 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-400/40 shadow-md flex items-center">
                        ${dispBadge}
                      </span>
                    `;
                  })())}
                </div>

                <div class="absolute bottom-2.5 left-3 text-white z-10 pointer-events-none">
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
                  <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2.5 line-clamp-1">
                    ${courtType}
                  </p>

                  <!-- Detalhes solicitados: Piso, Capacidade, Valor Normal, Desconto e Horários -->
                  <div class="text-xs text-slate-600 space-y-1.5 pt-1 pb-1">
                    <p class="flex items-center">
                      <i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0"></i> 
                      <span>Piso: ${specs.surface || specs.type || courtType || 'Grama Sintética 60mm'}</span>
                    </p>
                    <p class="flex items-center">
                      <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0"></i> 
                      <span>${specs.capacity || capacity || '10 a 14 Jogadores'}</span>
                    </p>
                    <p class="flex items-center font-bold text-slate-900">
                      <i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0"></i> 
                      <span>R$ ${pricePerHour.toFixed(2).replace('.', ',')}/hora (Normal)</span>
                    </p>
                    ${(() => {
                      const dInfo = getCourtDiscountInfo(court);
                      if (dInfo.hasDiscount) {
                        return `
                          <p class="flex items-center font-black text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shadow-xs">
                            <span class="mr-1">🔥</span> 
                            <span>${dInfo.startHour} às ${dInfo.endHour}: R$ ${dInfo.discountPrice.toFixed(2).replace('.', ',')}/h (Desconto)</span>
                          </p>
                        `;
                      }
                      return '';
                    })()}
                    <p class="flex items-center text-slate-500 font-medium">
                      <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0"></i> 
                      <span>Horários: ${specs.opening_time || court.openingTime || '06:00'} às ${specs.closing_time || court.closingTime || '23:00'}</span>
                    </p>
                  </div>

                  <!-- AVISO PRÉVIO DE MANUTENÇÃO (QUANDO ATIVADO PELA GERÊNCIA) -->
                  ${(specs && specs.maintenance_notice) ? `
                    <div class="mt-2.5 p-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-start space-x-2">
                      <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                      <div>
                        <strong class="font-black text-amber-950 uppercase text-[10px] tracking-wide block">Aviso Prévio de Manutenção</strong>
                        <span class="text-[11px] font-semibold leading-tight text-amber-900">${specs.maintenance_notice}</span>
                      </div>
                    </div>
                  ` : ''}
                </div>

                <div>
                  <div class="pt-3 border-t border-slate-100">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="text-[11px] text-slate-400 font-medium block">Valor Normal da Hora</span>
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
                      ` : (specs && specs.maintenance_notice ? `
                        <span class="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center space-x-1">
                          <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i>
                          <span>Aviso Prévio</span>
                        </span>
                      ` : '')}
                    </div>
                  </div>

                  <!-- RODAPÉ DE HORÁRIOS FIXOS: SÓ APARECE SE TIVER FIXO CADASTRADO NA GERÊNCIA -->
                  ${fixosList.length > 0 ? `
                    <div class="mt-3.5 pt-2.5 border-t border-dashed border-slate-200 bg-amber-50/50 -mx-5 -mb-5 px-4 py-2.5 rounded-b-3xl">
                      <div class="flex items-center space-x-1.5 text-[10px] font-black text-amber-900 uppercase mb-1">
                        <i data-lucide="crown" class="w-3 h-3 text-amber-600"></i>
                        <span>HORÁRIOS FIXOS DESTE CAMPO:</span>
                      </div>
                      <div class="space-y-0.5">
                        ${fixosList.slice(0, 3).map(time => `
                          <div class="text-[11px] font-semibold text-slate-700 flex items-center space-x-1 truncate">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            <span class="truncate">${time}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
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
              <h3 class="text-base sm:text-lg font-black text-slate-900">Configuração do Dia do Horário Fixo</h3>
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
            <p class="text-xs text-emerald-300 font-bold mt-1 flex items-center flex-wrap gap-2">
              <span>R$ ${getCourtNormalHourlyPrice(court).toFixed(2).replace('.', ',')} / hora (Normal)</span>
              ${(() => {
                const dInfo = getCourtDiscountInfo(court);
                return dInfo.hasDiscount ? `
                  <span class="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase flex items-center shadow-xs">
                    🔥 ${dInfo.startHour} às ${dInfo.endHour}: R$ ${dInfo.discountPrice.toFixed(2).replace('.', ',')}/h
                  </span>
                ` : '';
              })()}
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

// ==============================================================================
// 📅 CALENDÁRIO VISUAL DINÂMICO VINCULADO AO BANCO DE DADOS (SUPABASE & DIÁRIO)
// ==============================================================================
function renderCalendarHTML() {
  if (!state.currentMonthDate) {
    state.currentMonthDate = new Date();
  }
  const year = state.currentMonthDate.getFullYear();
  const month = state.currentMonthDate.getMonth(); // 0 a 11

  const monthsFull = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonthYearName = monthsFull[month] + ' de ' + year;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const todayStr = getFormattedDate(now);

  // Consulta reservas no banco de dados e local (sincronizadas em tempo real)
  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

  const selectedCourtId = state.selectedCourt ? state.selectedCourt.id : null;
  const isDbConnected = window.ArenaSupabase && window.ArenaSupabase.isReady();

  let html = `
    <!-- Cabeçalho do Mês -->
    <div class="calendar-header flex items-center justify-between mb-4 pb-3.5 border-b border-slate-100">
      <div class="flex items-center space-x-2.5">
        <span class="p-2 sm:p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm flex items-center justify-center">
          <i data-lucide="calendar" class="w-5 h-5"></i>
        </span>
        <div>
          <h4 class="text-base sm:text-lg font-black text-slate-900">
            ${currentMonthYearName}
          </h4>
          <p class="text-xs text-slate-500">Escolha o dia da sua partida</p>
        </div>
      </div>
      <div class="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-right hidden sm:block">
        <span class="text-[10px] font-bold text-emerald-700 block uppercase">Calendário</span>
        <span class="text-xs font-black text-emerald-900">${currentMonthYearName}</span>
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

    <!-- Grade dos Dias do Mês -->
    <div class="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
  `;

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="h-11 sm:h-12"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = state.selectedDate === currentDayStr;
    const isToday = currentDayStr === todayStr;
    const isPastDay = currentDayStr < todayStr;
    const dayOfWeek = new Date(year, month, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isPastDay) {
      html += `
        <button disabled 
                class="h-11 sm:h-12 w-full rounded-2xl text-xs sm:text-sm font-bold text-slate-300 bg-slate-50/60 border border-slate-100 flex flex-col items-center justify-center cursor-not-allowed opacity-40 select-none">
          <span>${day}</span>
        </button>
      `;
      continue;
    }

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

    <!-- Atalhos Rápidos de Dias no Mês -->
    <div class="mt-4 pt-3 border-t border-slate-100">
      <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
        <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500 mr-1.5"></i>
        <span>Atalhos Rápidos de Dias em ${monthsFull[month]}:</span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${[1, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, daysInMonth].filter((v, i, a) => a.indexOf(v) === i && v <= daysInMonth).map(d => {
          const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (dStr < todayStr) return '';
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

function changeCalendarMonth(delta) {
  if (!state.currentMonthDate) state.currentMonthDate = new Date();
  const d = new Date(state.currentMonthDate.getFullYear(), state.currentMonthDate.getMonth() + delta, 1);
  state.currentMonthDate = d;
  renderStepContent();
  lucide.createIcons();
}

function handleMonthInputChange(val) {
  if (!val) return;
  const [y, m] = val.split('-').map(Number);
  state.currentMonthDate = new Date(y, m - 1, 1);
  renderStepContent();
  lucide.createIcons();
}

function goToTodayCalendar() {
  const now = new Date();
  state.currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  selectDate(getFormattedDate(now));
}

function selectDate(dateStr) {
  const now = new Date();
  const todayStr = getFormattedDate(now);
  if (dateStr && dateStr < todayStr) {
    alert('Não é possível selecionar uma data que já passou.');
    return;
  }
  state.selectedDate = dateStr;
  if (dateStr) {
    const [y, m] = dateStr.split('-').map(Number);
    state.currentMonthDate = new Date(y, m - 1, 1);
  }
  state.startTime = null;
  state.endTime = null;
  state.selectedSlots = [];
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

    if (state.startTime) {
      const startMin = timeToMinutes(state.startTime);
      let endMin = state.endTime ? timeToMinutes(state.endTime) : startMin + 30;
      if (endMin <= startMin) endMin = startMin + 30;
      // Garante que a seleção não atravesse nenhum horário ocupado
      let safeEndMin = startMin + 30;
      for (let m = startMin + 30; m <= endMin; m += 30) {
        const slotStartStr = minutesToTime(m - 30);
        const slotBusy = (state.slots || []).find(s => s.time === slotStartStr && s.status !== 'available');
        if (slotBusy && m - 30 > startMin) break;
        safeEndMin = m;
      }
      state.endTime = minutesToTime(safeEndMin);
    }

    calculateDuration();
  const basePrice = getCourtHourlyPrice(court);
  const hoursFraction = (state.selectedDuration || 60) / 60;
  const courtFinalPrice = state.bookingType === 'mensalista' ? 
    getCourtMonthlyPrice(court) : 
    (basePrice * hoursFraction);

  const durationHours = Math.floor(state.selectedDuration / 60);
  const durationMins = state.selectedDuration % 60;
  const formattedDuration = state.selectedDuration === 30 ? 
    '30 min' : 
    (durationHours > 0 ? 
      (durationMins > 0 ? `${durationHours}h ${durationMins}min` : `${durationHours} ${durationHours === 1 ? 'Hora' : 'Horas'}`) : 
      `${state.selectedDuration} min`);

  // FILTRA HORÁRIOS: OCULTA COMPLETAMENTE OS OCUPADOS PARA NÃO PODER SELECIONAR 2X
  const availableSlots = (state.slots || []).filter(s => s.status === 'available');
  const availableHourStrings = availableSlots.map(s => s.time);

  // Se não houver horários carregados ainda, gera lista padrão filtrando ocupados
  const fallbackHours = [
        "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  const nowStep3 = new Date();
  const todayStrStep3 = getFormattedDate(nowStep3);
  const nowMinStep3 = nowStep3.getHours() * 60 + nowStep3.getMinutes();
  const isSelectedDateToday = state.selectedDate === todayStrStep3;

  const validStartHours = availableHourStrings.length > 0 ? 
    availableHourStrings : 
    fallbackHours.filter(h => {
      if (isSelectedDateToday && timeToMinutes(h) <= nowMinStep3) return false;
      const slot = (state.slots || []).find(s => s.time === h);
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
          <p class="text-xs text-emerald-300 font-bold mt-1 flex items-center flex-wrap gap-2">
            <span>${court.name} • R$ ${getCourtNormalHourlyPrice(court).toFixed(2).replace('.', ',')}/h (Normal)</span>
            ${(() => {
              const dInfo = getCourtDiscountInfo(court);
              return dInfo.hasDiscount ? `
                <span class="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase flex items-center shadow-xs">
                  🔥 ${dInfo.startHour} às ${dInfo.endHour}: R$ ${dInfo.discountPrice.toFixed(2).replace('.', ',')}/h
                </span>
              ` : '';
            })()}
          </p>
        </div>
        <button onclick="goToStep(2)" class="text-xs text-emerald-300 hover:text-white underline font-bold flex items-center">
          <i data-lucide="calendar" class="w-3.5 h-3.5 mr-1"></i> Alterar Data
        </button>
      </div>

      <!-- GRADE DE HORÁRIOS: MOSTRA TODOS (LIVRES + OCUPADOS/EM JOGO) -->
      <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900">Horários do Campo — ${court.name}</h3>
            <p class="text-xs text-slate-500">Toque nos horários da grade para selecionar o início e término da sua partida.</p>
          </div>
        </div>

        ${(() => {
          const dInfo = getCourtDiscountInfo(court);
          if (dInfo.hasDiscount) {
            return `
              <div class="my-4 p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3">
                <div class="flex items-center space-x-2.5 min-w-0">
                  <span class="p-2 bg-white/20 rounded-xl text-lg shrink-0">🔥</span>
                  <div>
                    <p class="text-xs font-black uppercase tracking-wider">Horário com Desconto Especial!</p>
                    <p class="text-[11px] opacity-95">Das <strong>${dInfo.startHour}</strong> às <strong>${dInfo.endHour}</strong> o valor cai de <span class="line-through opacity-80">R$ ${getCourtNormalHourlyPrice(court).toFixed(2).replace('.', ',')}</span> para apenas <strong class="text-white text-xs bg-black/30 px-1.5 py-0.5 rounded">R$ ${dInfo.discountPrice.toFixed(2).replace('.', ',')}/hora</strong>!</p>
                  </div>
                </div>
                <span class="hidden sm:inline-block px-3 py-1 bg-white text-orange-600 font-black text-xs rounded-xl shadow-xs shrink-0">
                  Desconto Ativo
                </span>
              </div>
            `;
          }
          return '';
        })()}

        <!-- Legenda -->
        <div class="flex flex-wrap gap-2 mb-5 mt-3">
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Livre
          </span>
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-600/10 border border-emerald-500 px-2.5 py-1 rounded-full">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Selecionado
          </span>
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span> Em Jogo Agora
          </span>
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Reservado
          </span>
          <span class="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Manutenção
          </span>
        </div>

        <!-- Grade de horários -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          ${(() => {
            const now = new Date();
            const todayStr = getFormattedDate(now);
            const nowMin = now.getHours() * 60 + now.getMinutes();
            const isToday = state.selectedDate === todayStr;

            // Filtra os horários: para o dia atual, oculta os horários que já passaram
            const visibleSlots = (state.slots || []).filter(slot => {
              if (!isToday) return true;
              const slotMin = timeToMinutes(slot.time);
              const isPast = slot.status === 'past' || slot.isPast || (slotMin < nowMin);
              return !isPast;
            });

            if (visibleSlots.length === 0) {
              return `
                <div class="col-span-2 sm:col-span-3 p-6 sm:p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center my-2">
                  <span class="text-3xl mb-1 block">⏰</span>
                  <h4 class="text-base font-black text-slate-800">Horários de hoje encerrados</h4>
                  <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Todos os horários de hoje para esta quadra já passaram. Escolha uma data futura no calendário para agendar.</p>
                  <button type="button" onclick="goToStep(2)" class="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5">
                    <i data-lucide="calendar" class="w-4 h-4"></i>
                    <span>Escolher Próxima Data</span>
                  </button>
                </div>
              `;
            }

            return visibleSlots.map(slot => {
              const slotMin = timeToMinutes(slot.time);
              const slotEndMin = slotMin + 30;
              const isSelected = Array.isArray(state.selectedSlots) && state.selectedSlots.includes(slot.time);
              const isAvail = slot.status === 'available';
              const isMaint = slot.status === 'maintenance';
              const isBooked = slot.status === 'booked';
              const isPast = slot.status === 'past' || slot.isPast;

              // Verifica se está rolando agora
              const isLiveNow = isToday && isBooked && slotMin <= nowMin && slotEndMin > nowMin;

              let cardClass = '';
              let badge = '';
              let icon = '';
              let nameLabel = '';
              let clickable = '';

              const dInfo = getCourtDiscountInfo(court);
              const isDiscountSlot = dInfo.hasDiscount && isCourtDiscountTime(court, slot.time);

              if (isAvail) {
                if (isSelected) {
                  const isStart = state.startTime === slot.time;
                  const isEnd = state.endTime === slot.time;
                  let slotBadge = '';
                  const durLabel = state.selectedDuration === 30 ? '30 min' : (state.selectedDuration === 60 ? '1h Fechada' : (state.selectedDuration === 90 ? '1h30 Fechada' : (state.selectedDuration === 120 ? '2h Fechadas' : `${state.selectedDuration} min`)));

                  if (isStart && isEnd) {
                    slotBadge = `<span class="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">✓ ${durLabel}</span>`;
                  } else if (isStart) {
                    slotBadge = `<span class="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">✓ Início (${slot.time})${isDiscountSlot ? ' 🔥' : ''}</span>`;
                  } else if (isEnd) {
                    slotBadge = `<span class="text-[10px] font-black bg-white/30 text-white px-2 py-0.5 rounded-full ring-2 ring-white/50 shadow-xs">✓ Término (${slot.time}) • ${durLabel}</span>`;
                  } else {
                    slotBadge = '<span class="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded-full">✓ No Jogo</span>';
                  }
                  cardClass = 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-lg ring-2 ring-emerald-400 cursor-pointer transform scale-[1.02] transition-all';
                  badge = slotBadge;
                  icon = isEnd ? '🏁' : (isDiscountSlot ? '🔥' : '🟢');
                } else if (slot.endsBooking) {
                  const prevDur = slot.endsBooking.duration || (timeToMinutes(slot.endsBooking.endTime || slot.endsBooking.end_time) - timeToMinutes(slot.endsBooking.startTime || slot.endsBooking.start_time)) || 60;
                  const prevDurLabel = prevDur === 30 ? '30 min' : (prevDur === 60 ? '1h Fechada' : (prevDur === 90 ? '1h30' : `${prevDur} min`));
                  cardClass = 'bg-emerald-50/90 border-2 border-dashed border-emerald-400 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-500 cursor-pointer transition-all shadow-xs';
                  badge = `<span class="text-[10px] font-black text-emerald-900 bg-emerald-200/90 px-1.5 py-0.5 rounded-md block truncate">🏁 Fim de Jogo às ${slot.time} • ${prevDurLabel} (${slot.endsBooking.customerName})</span>`;
                  icon = '🏁';
                  nameLabel = `<span class="text-[10px] text-emerald-700 font-bold block mt-0.5">🟢 Livre a partir das ${slot.time}</span>`;
                } else {
                  if (isDiscountSlot) {
                    cardClass = 'bg-amber-50/90 border-2 border-amber-400 text-amber-950 hover:bg-amber-100 hover:border-amber-500 cursor-pointer transition-all shadow-xs';
                    badge = '<span class="text-[10px] font-black text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-md">🔥 R$ ' + dInfo.discountPrice.toFixed(0) + '/h (Desconto)</span>';
                    icon = '🔥';
                  } else {
                    cardClass = 'bg-emerald-50 border-2 border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-500 cursor-pointer transition-all';
                    badge = '<span class="text-[10px] font-bold text-emerald-700">Livre ✓</span>';
                    icon = '🟢';
                  }
                }
                clickable = `onclick="handleSlotClick('${slot.time}')"`;
              } else if (isLiveNow) {
                cardClass = 'bg-rose-600 border-2 border-rose-700 text-white cursor-not-allowed shadow-md';
                badge = '<span class="text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full animate-pulse">🔴 EM JOGO AGORA</span>';
                icon = '⚽';
                nameLabel = slot.customerName ? `<span class="text-[10px] opacity-80 truncate block mt-0.5">${slot.customerName}</span>` : '';
              } else if (isBooked) {
                cardClass = 'bg-slate-100 border-2 border-slate-300 text-slate-500 cursor-not-allowed';
                badge = '<span class="text-[10px] font-bold text-slate-500">Reservado</span>';
                icon = slot.isMensalista ? '👑' : '🔒';
                nameLabel = slot.customerName ? `<span class="text-[10px] text-slate-400 truncate block mt-0.5">${slot.isMensalista ? 'Fixo: ' : ''}${slot.customerName}</span>` : '';
              } else if (isMaint) {
                cardClass = 'bg-amber-50 border-2 border-amber-300 text-amber-800 cursor-not-allowed';
                badge = '<span class="text-[10px] font-bold text-amber-700">Manutenção</span>';
                icon = '🔧';
                nameLabel = slot.statusLabel ? `<span class="text-[10px] text-amber-600 truncate block mt-0.5">${slot.statusLabel}</span>` : '';
              } else if (isPast) {
                cardClass = 'bg-slate-100/70 border-2 border-slate-200 text-slate-400 cursor-not-allowed opacity-60';
                badge = '<span class="text-[10px] font-bold text-slate-400">Encerrado ⏰</span>';
                icon = '⏳';
                nameLabel = '<span class="text-[10px] text-slate-400 truncate block mt-0.5">Horário já passou</span>';
              }

              return `
                <div class="p-3 rounded-2xl ${cardClass} select-none" ${clickable}>
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="text-base font-black">${slot.time}</span>
                    <span class="text-base">${icon}</span>
                  </div>
                  <span class="text-[10px] font-semibold opacity-75 block mb-1">(${slot.time} às ${minutesToTime(slotMin + 30)})</span>
                  ${badge}
                  ${nameLabel}
                </div>
              `;
            }).join('');
          })()}
        </div>

        ${(() => {
          const now = new Date();
          const todayStr = getFormattedDate(now);
          const nowMin = now.getHours() * 60 + now.getMinutes();
          const isToday = state.selectedDate === todayStr;

          const remainingSlots = (state.slots || []).filter(s => {
            if (!isToday) return true;
            return timeToMinutes(s.time) >= nowMin;
          });

          // Se já não sobrou nenhum slot, a mensagem central no grid já informa
          if (remainingSlots.length === 0) return '';

          const remainingAvail = remainingSlots.filter(s => s.status === 'available');
          if (remainingAvail.length === 0) return `
            <div class="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center mb-6">
              <i data-lucide="alert-circle" class="w-6 h-6 text-rose-600 mx-auto mb-1"></i>
              <h4 class="text-sm font-black text-rose-900">Todos os horários restantes estão reservados</h4>
              <p class="text-xs text-rose-700 mt-1">Não há mais vagas livres hoje para esta quadra. Escolha outra data no calendário.</p>
              <button onclick="goToStep(2)" class="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow hover:bg-rose-700 cursor-pointer">Escolher Outra Data</button>
            </div>`;
          return '';
        })()}

          <!-- Resumo do horário selecionado -->
          ${state.startTime && state.endTime ? (() => {
            const isDiscApplied = isCourtDiscountTime(court, state.startTime);
            const effectivePrice = getCourtHourlyPrice(court, state.startTime);
            const normalPrice = getCourtNormalHourlyPrice(court);

            return `
              <div class="bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 border border-emerald-500/50">
                <div>
                  <div class="flex items-center space-x-2 flex-wrap gap-1">
                    <span class="px-2.5 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">Horário Confirmado</span>
                    <span class="text-xs text-white font-black">${state.startTime} às ${state.endTime}</span>
                    <span class="px-2 py-0.5 rounded-md bg-white/20 text-emerald-100 text-[10px] font-bold">
                      ${formattedDuration}
                    </span>
                    ${isDiscApplied ? `
                      <span class="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase flex items-center shadow-xs">
                        🔥 Desconto Especial Aplicado
                      </span>
                    ` : ''}
                  </div>
                  <p class="text-base sm:text-xl font-black text-white mt-1.5">
                    ⏱️ Jogo das <span class="underline decoration-emerald-300 decoration-2 underline-offset-2">${state.startTime}</span> até às <span class="underline decoration-emerald-300 decoration-2 underline-offset-2">${state.endTime}</span> (${formattedDuration})
                  </p>
                  <p class="text-xs text-emerald-100 mt-0.5">
                    ${isDiscApplied ? `
                      Cálculo: ${hoursFraction}h x R$ ${effectivePrice.toFixed(2)}/h <span class="line-through text-emerald-200 text-[11px]">R$ ${normalPrice.toFixed(2)}</span> (Desconto Especial de Horário)
                    ` : `
                      Cálculo: ${hoursFraction}h x R$ ${effectivePrice.toFixed(2)}/h
                    `}
                  </p>

                </div>
                <div class="text-right bg-white text-slate-900 px-5 py-3 rounded-2xl border border-emerald-300 shadow-md w-full sm:w-auto">
                  <span class="text-[10px] font-bold text-slate-400 block uppercase">Valor das Horas</span>
                  <p class="text-xl sm:text-2xl font-black text-emerald-700">
                    R$ ${courtFinalPrice.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            `;
          })() : `
          <div class="p-4 bg-emerald-50/70 border-2 border-dashed border-emerald-300 rounded-2xl text-center text-emerald-900 text-xs font-bold mt-4 flex items-center justify-center space-x-2">
            <span class="text-base">👉</span>
            <span>Toque em um horário verde acima para iniciar a sua reserva</span>
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
            const isWater = isWaterProduct(prod);
            return `
              <div class="bg-slate-50/80 hover:bg-white p-3.5 rounded-2xl border ${qty > 0 ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500' : 'border-slate-200'} shadow-sm flex items-center justify-between transition-all">
                <div class="flex items-center space-x-3 overflow-hidden">
                  <div class="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                    <img src="${prod.image}" 
                         onerror="this.src='https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80'"
                         class="w-full h-full object-contain">
                  </div>
                  <div class="overflow-hidden">
                    <h4 class="text-xs sm:text-sm font-extrabold text-slate-800 truncate">${prod.name}</h4>
                    <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span class="text-xs font-bold text-slate-500">
                        R$ ${prod.price.toFixed(2).replace('.', ',')} /${prod.unit || 'unid'} 
                      </span>
                      ${isWater ? `
                        <button onclick="addWaterCombo(4, '${prod.id}')" type="button" class="text-[10px] font-black bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-cyan-300 px-2 py-0.5 rounded-md transition-all shadow-xs cursor-pointer" title="Adicionar pacote padrão de 4 águas para a partida">
                          + Lote 4 Águas
                        </button>
                      ` : ''}
                      ${qty > 0 ? `<span class="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Guardar ${qty}x</span>` : ''}
                    </div>
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

function selectBookingDuration(mins) {
  state.selectedDuration = mins;
  if (state.startTime) {
    const sMin = timeToMinutes(state.startTime);
    const targetEndMin = sMin + mins;

    let canFit = true;
    const newSlots = [];
    for (let m = sMin; m < targetEndMin; m += 30) {
      const tStr = minutesToTime(m);
      const sObj = (state.slots || []).find(s => s.time === tStr);
      if (!sObj || (sObj.status !== 'available' && !sObj.endsBooking)) {
        canFit = false;
        break;
      }
      newSlots.push(tStr);
    }

    if (canFit) {
      state.endTime = minutesToTime(targetEndMin);
      newSlots.push(state.endTime);
      state.selectedSlots = newSlots;
    } else {
      const durText = mins === 30 ? '30 minutos' : (mins === 60 ? '1 hora' : (mins === 90 ? '1h30' : '2 horas'));
      alert(`Atenção: Não há ${durText} contínua livre a partir das ${state.startTime}.\nPor favor, escolha outro horário livre ou diminua a duração.`);
      if (mins > 60) {
        selectBookingDuration(60);
        return;
      } else if (mins === 60) {
        selectBookingDuration(30);
        return;
      }
    }
  }
  calculateDuration();
  renderStep3Content();
  renderBottomBar();
  if (window.lucide) lucide.createIcons();
}
window.selectBookingDuration = selectBookingDuration;

function syncSelectedSlotsState() {
  if (!state.startTime || !state.endTime) {
    state.selectedSlots = [];
    return;
  }
  const sMin = timeToMinutes(state.startTime);
  const eMin = timeToMinutes(state.endTime);
  const slots = [];
  for (let m = sMin; m <= eMin; m += 30) {
    slots.push(minutesToTime(m));
  }
  state.selectedSlots = slots;
  calculateDuration();
}



function handleSlotClick(time) {
  const slot = (state.slots || []).find(s => s.time === time);
  if (!slot || (slot.status !== 'available' && !slot.endsBooking)) return;

  const clickedMin = timeToMinutes(time);

  // Helper para verificar se um bloco de 30min está disponível para jogo
  const isSlotPlayable = (tMin) => {
    const tStr = minutesToTime(tMin);
    const sObj = (state.slots || []).find(s => s.time === tStr);
    return !!(sObj && (sObj.status === 'available' || sObj.endsBooking));
  };

  // 1. Se clicou no próprio horário de início já selecionado
  if (state.startTime === time) {
    if (state.selectedDuration > 30) {
      // Alterna para 30 minutos (Início às XX:XX, Término às XX:XX + 30m)
      const endT = minutesToTime(clickedMin + 30);
      state.endTime = endT;
      state.selectedDuration = 30;
      state.selectedSlots = [time, endT];
    } else {
      // Se já estava em 30 min, limpa a seleção para permitir recomeçar
      state.startTime = null;
      state.endTime = null;
      state.selectedSlots = [];
      state.selectedDuration = 0;
    }
    calculateDuration();
    renderStep3Content();
    renderBottomBar();
    if (window.lucide) lucide.createIcons();
    return;
  }

  // 2. Se já há um horário de início e o usuário clicou num horário POSTERIOR ao início
  if (state.startTime) {
    const startMin = timeToMinutes(state.startTime);

    if (clickedMin > startMin) {
      // Caso 2a: Se clicou no slot imediatamente seguinte (+30min)
      if (clickedMin === startMin + 30) {
        if (state.endTime === time && state.selectedDuration === 30) {
          // Já está em 30 min: expande para 1 hora (60 min) se o próximo intervalo estiver livre
          if (isSlotPlayable(startMin + 30)) {
            const endT = minutesToTime(startMin + 60);
            state.endTime = endT;
            state.selectedDuration = 60;
            state.selectedSlots = [state.startTime, time, endT];
          }
        } else {
          // Estava com 1h ou mais: ajusta diretamente para 30 min (ex: 14:00 até 14:30)
          state.endTime = time;
          state.selectedDuration = 30;
          state.selectedSlots = [state.startTime, time];
        }
        calculateDuration();
        renderStep3Content();
        renderBottomBar();
        if (window.lucide) lucide.createIcons();
        return;
      }

      // Caso 2b: Clicou em um horário mais à frente (ex: 15:00, 15:30, 16:00...)
      // O usuário quer definir esse horário como o Término da partida!
      let canExtend = true;
      const rangeSlots = [];
      for (let m = startMin; m < clickedMin; m += 30) {
        if (!isSlotPlayable(m)) {
          canExtend = false;
          break;
        }
        rangeSlots.push(minutesToTime(m));
      }

      if (canExtend) {
        state.endTime = time;
        rangeSlots.push(time);
        state.selectedSlots = rangeSlots;
        state.selectedDuration = clickedMin - startMin;
        calculateDuration();
        renderStep3Content();
        renderBottomBar();
        if (window.lucide) lucide.createIcons();
        return;
      }
      // Se não pôde estender por haver horário ocupado no meio, cai para nova seleção a partir de `time`
    }
  }

  // 3. Novo horário de início (ou clicou antes do início atual)
  // Seleciona inicialmente 30 minutos (início no horário clicado até +30min).
  // O usuário pode estender clicando no horário de término na grade ou no seletor manual.
  state.startTime = time;
  const endT = minutesToTime(clickedMin + 30);
  state.endTime = endT;
  state.selectedDuration = 30;
  state.selectedSlots = [time, endT];

  calculateDuration();
  renderStep3Content();
  renderBottomBar();
  if (window.lucide) lucide.createIcons();
}

function handleTimeChange(val, type) {
  if (type === 'start') {
    handleSlotClick(val);
    return;
  }
  state.endTime = val;
  calculateDuration();
  renderStep3Content();
  renderBottomBar();
  lucide.createIcons();
}

function isWaterProduct(product) {
  if (!product) return false;
  const n = (product.name || '').toLowerCase();
  const c = (product.category || '').toLowerCase();
  return n.includes('água') || n.includes('agua') || n.includes('garrafa') || n.includes('galão') || n.includes('galao');
}
window.isWaterProduct = isWaterProduct;

function updateCartQuantity(productId, delta) {
  const prod = (state.products || []).find(p => p.id === productId);
  if (delta > 0 && isWaterProduct(prod) && typeof getWaterSupplyAnalytics === 'function') {
    const analytics = getWaterSupplyAnalytics();
    let currentWaterInCart = 0;
    Object.entries(state.productCart || {}).forEach(([pId, qty]) => {
      const p = (state.products || []).find(x => x.id === pId);
      if (isWaterProduct(p)) currentWaterInCart += qty;
    });

    if (currentWaterInCart + delta > analytics.freeForSale) {
      alert(`⚠️ Limite de Água Disponível no Estoque:\n\nA Arena possui atualmente ${analytics.freeForSale} água(s) cheia(s) livres para reserva.\n(Estoque total: ${analytics.full} cheias, sendo ${analytics.totalReservedAll} já guardadas para outros jogos).\n\nPara solicitar uma quantidade maior, procure a administração/bar da Arena para providenciar o reabastecimento.`);
      return;
    }
  }

  const current = state.productCart[productId] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete state.productCart[productId];
  else state.productCart[productId] = next;

  renderStep3Content();
  renderBottomBar();
  lucide.createIcons();
}

function addWaterCombo(qty, productId) {
  const prod = (state.products || []).find(p => p.id === productId);
  if (isWaterProduct(prod) && typeof getWaterSupplyAnalytics === 'function') {
    const analytics = getWaterSupplyAnalytics();
    let currentWaterInCart = 0;
    Object.entries(state.productCart || {}).forEach(([pId, q]) => {
      const p = (state.products || []).find(x => x.id === pId);
      if (isWaterProduct(p)) currentWaterInCart += q;
    });

    if (currentWaterInCart + qty > analytics.freeForSale) {
      alert(`⚠️ Limite de Água Disponível no Estoque:\n\nA Arena possui atualmente ${analytics.freeForSale} água(s) livres para reserva.\nPara solicitar uma quantidade maior, procure a administração/bar da Arena.`);
      return;
    }
  }

  if (!state.productCart) state.productCart = {};
  state.productCart[productId] = (state.productCart[productId] || 0) + qty;
  renderStep3Content();
  renderBottomBar();
  lucide.createIcons();
}
window.addWaterCombo = addWaterCombo;

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
            <span class="text-[11px] font-bold text-slate-400 block uppercase">${isMensal ? 'Horário Fixo Mensal' : 'Data e Horário'}</span>
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
              ${isMensal ? '👑 Contrato de Horário Fixo (Horário semanal com 4 jogos no mês)' : 
                (isCourtDiscountTime(court, state.startTime) ? 
                  `Partida de ${state.selectedDuration} minutos (${hoursFraction}h x R$ ${basePrice.toFixed(2)}/h) <span class="text-amber-900 font-black bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 mt-1 sm:mt-0">🔥 Desconto de Horário (${getCourtDiscountInfo(court).startHour} às ${getCourtDiscountInfo(court).endHour})</span>` : 
                  `Partida de ${state.selectedDuration} minutos (${hoursFraction}h x R$ ${basePrice.toFixed(2)}/h)`
                )
              }
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
                  <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                    <img src="${item.image}" class="w-full h-full object-contain">
                  </div>
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
    if (isManagerLoggedIn()) {
      state.currentMode = 'admin';
      state.adminTab = 'live_dashboard';
      renderApp();
    } else {
      openLoginModal(() => {
        state.currentMode = 'admin';
        state.adminTab = 'live_dashboard';
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

        <form onsubmit="handleLoginSubmit(event)" class="p-6 space-y-4" autocomplete="off">
          <div id="loginErrorMessage" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold"></div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail do Administrador *</label>
            <input type="email" id="loginEmail" required placeholder="EMAIL" 
                   value="" autocomplete="off"
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Senha de Acesso *</label>
            <input type="password" id="loginPassword" required placeholder="SENHA" 
                   value="" autocomplete="new-password"
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Cancelar</button>
            <button type="submit" id="btnLoginSubmit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer">Entrar na Administração</button>
          </div>
        </form>
      </div>
    </div>
  `;

  window._onLoginSuccess = onSuccessCallback;
  lucide.createIcons();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const email = (emailInput ? emailInput.value : '').trim();
  const password = (passwordInput ? passwordInput.value : '').trim();
  const errorMsg = document.getElementById('loginErrorMessage');
  const submitBtn = document.getElementById('btnLoginSubmit');

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    if (errorMsg) {
      errorMsg.innerText = "Por favor, preencha o e-mail e a senha de acesso.";
      errorMsg.classList.remove('hidden');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Verificando credenciais...";
  }

  let authenticatedUser = null;

  // 1. Tenta verificar no Supabase com busca flexível e tratamento seguro
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      const { data, error } = await client
        .from('admin_users')
        .select('*')
        .ilike('email', cleanEmail);

      if (data && data.length > 0) {
        const matched = data.find(u => {
          const uEmail = (u.email || '').trim().toLowerCase();
          const uPass = String(u.password || '').trim();
          if (uEmail !== cleanEmail) return false;
          if (uPass === cleanPassword) return true;
          // Credenciais mestras aceitas para Gabriel Alves
          if (cleanEmail === 'admin@arenalimoeiro.com.br' && (cleanPassword === 'Alves@157620' || cleanPassword === 'admin123')) return true;
          // Credenciais aceitas para Recepção
          if ((cleanEmail === 'recepcao@arenalimoeiro.com.br' || cleanEmail.includes('recep')) && (cleanPassword === 'arena123' || cleanPassword === 'Recepcao@2026!')) return true;
          // Credenciais aceitas para Gerente
          if ((cleanEmail === 'gerente@arenalimoeiro.com.br' || cleanEmail.includes('gerente')) && (cleanPassword === 'gerente123' || cleanPassword === 'Vinicius@2026!')) return true;
          return false;
        });

        if (matched) {
          authenticatedUser = { ...matched };
          if (matched.role && matched.role.includes('::perms:')) {
            const [baseRole, pStr] = matched.role.split('::perms:');
            authenticatedUser.role = baseRole;
            authenticatedUser.permissions = pStr.split(',').filter(Boolean);
          }
        }
      }
    } catch(e) {
      console.warn('Erro ao consultar Supabase no login:', e);
    }
  }

  // 2. Verifica no state e localStorage (gestores criados ou modificados localmente)
  if (!authenticatedUser) {
    const localAdmins = JSON.parse(localStorage.getItem('arena_admin_users') || '[]');
    const allKnownAdmins = [...(state.adminUsers || []), ...localAdmins];
    const found = allKnownAdmins.find(u => {
      if (!u || !u.email) return false;
      const uEmail = u.email.trim().toLowerCase();
      const uPass = String(u.password || '').trim();
      if (uEmail !== cleanEmail) return false;
      if (uPass === cleanPassword) return true;
      if (cleanEmail === 'admin@arenalimoeiro.com.br' && (cleanPassword === 'Alves@157620' || cleanPassword === 'admin123')) return true;
      if ((cleanEmail === 'recepcao@arenalimoeiro.com.br' || cleanEmail.includes('recep')) && (cleanPassword === 'arena123' || cleanPassword === 'Recepcao@2026!')) return true;
      if ((cleanEmail === 'gerente@arenalimoeiro.com.br' || cleanEmail.includes('gerente')) && (cleanPassword === 'gerente123' || cleanPassword === 'Vinicius@2026!')) return true;
      return false;
    });
    if (found) authenticatedUser = { ...found };
  }

  // 3. Fallback de administradores pré-configurados garantidos
  if (!authenticatedUser) {
    if (cleanEmail === 'admin@arenalimoeiro.com.br' && (cleanPassword === 'Alves@157620' || cleanPassword === 'admin123')) {
      authenticatedUser = {
        id: "admin-1",
        name: "Gabriel Alves",
        email: "admin@arenalimoeiro.com.br",
        password: cleanPassword,
        role: "Administrador Geral"
      };
    } else if ((cleanEmail === 'recepcao@arenalimoeiro.com.br' || cleanEmail === 'recepcao.atendimento@arenalimoeiro.com.br') && (cleanPassword === 'arena123' || cleanPassword === 'Recepcao@2026!')) {
      authenticatedUser = {
        id: "admin-2",
        name: "Recepção & Atendimento",
        email: "recepcao@arenalimoeiro.com.br",
        password: cleanPassword,
        role: "Recepção & Atendimento"
      };
    } else if ((cleanEmail === 'gerente@arenalimoeiro.com.br' || cleanEmail === 'vinicius.melo@arenalimoeiro.com.br') && (cleanPassword === 'gerente123' || cleanPassword === 'Vinicius@2026!')) {
      authenticatedUser = {
        id: "admin-3",
        name: "Vinicius Melo",
        email: "gerente@arenalimoeiro.com.br",
        password: cleanPassword,
        role: "Gerente do Sistema"
      };
    }
  }

  if (authenticatedUser) {
    if (authenticatedUser.email.toLowerCase() === 'admin@arenalimoeiro.com.br' || authenticatedUser.name === 'Administrador Geral' || authenticatedUser.role === 'Administrador Geral') {
      authenticatedUser.name = 'Gabriel Alves';
      authenticatedUser.role = 'Administrador Geral';
      authenticatedUser.permissions = SYSTEM_PERMISSIONS.map(p => p.id); // Todas as 12 permissões
    } else if (!authenticatedUser.permissions || authenticatedUser.permissions.length === 0) {
      if (authenticatedUser.role === 'Gerente do Sistema') {
        authenticatedUser.permissions = SYSTEM_PERMISSIONS.filter(p => p.id !== 'can_manage_settings').map(p => p.id);
      } else if (authenticatedUser.role === 'Recepção & Atendimento' || isReceptionUser()) {
        authenticatedUser.permissions = ['can_start_matches', 'can_finish_matches', 'can_manage_bar', 'can_direct_booking'];
      }
    }
    authenticatedUser.authenticated = true;
    authenticatedUser.loginTimestamp = Date.now();
    state.currentUser = authenticatedUser;
    localStorage.setItem('arena_user', JSON.stringify(authenticatedUser));
    closeModal();
    state.currentMode = 'admin';
    state.adminTab = 'live_dashboard';
    renderApp();

    setTimeout(() => {
      if (typeof checkAndShowWaterSupplyLoginNotice === 'function') {
        checkAndShowWaterSupplyLoginNotice();
      }
    }, 450);

    if (window._onLoginSuccess) {
      window._onLoginSuccess();
      window._onLoginSuccess = null;
    }

    // Solicita permissão de notificação no navegador para este aparelho agora que o gestor se autenticou
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch(e) {}
  } else {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Entrar na Administração";
    }
    if (errorMsg) {
      errorMsg.innerText = "E-mail ou senha incorretos. Acesso restrito a administradores.";
      errorMsg.classList.remove('hidden');
    }
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
  }
}

function logoutAdmin() {
  state.currentUser = null;
  localStorage.removeItem('arena_user');
  state.currentMode = 'client';
  renderApp();
}

function isReceptionUser() {
  const role = (state.currentUser?.role || '').toLowerCase();
  const name = (state.currentUser?.name || '').toLowerCase();
  const email = (state.currentUser?.email || '').toLowerCase();
  return role.includes('recep') || name.includes('recep') || email.includes('recep');
}

// ==============================================================================
// 🛡️ MATRIZ DE PERMISSÕES GRANULARES DO SISTEMA (GRADE 4x3 = 12 PERMISSÕES)
// ==============================================================================
const SYSTEM_PERMISSIONS = [
  // Coluna 1: Operação de Jogos
  { id: 'can_delete_bookings', col: 1, colTitle: '🎮 Operação de Jogos', label: 'Apagar / Cancelar Jogos', desc: 'Permite apagar jogos do sistema e liberar horário imediatamente', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },
  { id: 'can_start_matches', col: 1, colTitle: '🎮 Operação de Jogos', label: 'Liberar e Iniciar Partidas', desc: 'Botão de liberar entrada/iniciar jogo e cronômetro ao vivo', defaultRoles: ['Administrador Geral', 'Gerente do Sistema', 'Recepção & Atendimento'] },
  { id: 'can_finish_matches', col: 1, colTitle: '🎮 Operação de Jogos', label: 'Finalizar Jogos ao Vivo', desc: 'Permite encerrar partidas e finalizar o tempo de jogo', defaultRoles: ['Administrador Geral', 'Gerente do Sistema', 'Recepção & Atendimento'] },

  // Coluna 2: Balcão e Consumo
  { id: 'can_direct_booking', col: 2, colTitle: '🛒 Balcão & Consumo', label: 'Reserva Direta no Balcão', desc: 'Criar novas reservas avulsas diretamente na recepção', defaultRoles: ['Administrador Geral', 'Gerente do Sistema', 'Recepção & Atendimento'] },
  { id: 'can_manage_bar', col: 2, colTitle: '🛒 Balcão & Consumo', label: 'Comanda do Bar & Lanches', desc: 'Aba de Bar, comanda individual e entrega de pedidos', defaultRoles: ['Administrador Geral', 'Gerente do Sistema', 'Recepção & Atendimento'] },
  { id: 'can_manage_products', col: 2, colTitle: '🛒 Balcão & Consumo', label: 'Cardápio e Estoque do Bar', desc: 'Cadastrar novos produtos, fotos e alterar valores de venda', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },

  // Coluna 3: Quadras e Espaços
  { id: 'can_edit_courts', col: 3, colTitle: '🏟️ Quadras & Espaços', label: 'Editar Quadras e Preços', desc: 'Cadastrar quadras, alterar fotos e ajustar tarifas por hora', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },
  { id: 'can_manage_maintenance', col: 3, colTitle: '🏟️ Quadras & Espaços', label: 'Treinos e Manutenções', desc: 'Bloquear horários na grade para escolinhas e reformas', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },
  { id: 'can_manage_categories', col: 3, colTitle: '🏟️ Quadras & Espaços', label: 'Categorias e Esportes', desc: 'Criar e editar modalidades esportivas (Beach, Society...)', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },

  // Coluna 4: Cadastros e Gestão
  { id: 'can_manage_customers', col: 4, colTitle: '⚙️ Cadastros & Gestão', label: 'Base de Clientes / Atletas', desc: 'Visualizar lista de clientes, fichas médicas e telefones', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },
  { id: 'can_manage_monthly', col: 4, colTitle: '⚙️ Cadastros & Gestão', label: 'Horários Fixos (Mensalistas)', desc: 'Gerenciar mensalistas e contratos semanais fixos', defaultRoles: ['Administrador Geral', 'Gerente do Sistema'] },
  { id: 'can_manage_settings', col: 4, colTitle: '⚙️ Cadastros & Gestão', label: 'Gestores e Ajustes Gerais', desc: 'Cadastrar novos gestores, níveis de acesso e banco de dados', defaultRoles: ['Administrador Geral'] },
];

function userHasPermission(user, permKey) {
  if (!user) return false;
  const role = user.role || '';
  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();
  const isMaster = role === 'Administrador Geral' || email === 'admin@arenalimoeiro.com.br' || name === 'gabriel alves';
  if (isMaster) return true;

  // Se o usuário possui um array explícito de permissões definido
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permKey);
  }

  // Fallbacks para contas sem array de permissões
  const isRecep = role.toLowerCase().includes('recep') || name.includes('recep') || email.includes('recep');
  if (isRecep) {
    const receptionAllowed = ['can_start_matches', 'can_finish_matches', 'can_manage_bar', 'can_direct_booking'];
    return receptionAllowed.includes(permKey);
  }

  if (role === 'Gerente do Sistema') {
    // Gerente do Sistema pode operar tudo, inclusive apagar jogos
    // Só não acessa gestão master de Supabase e criar outros gestores
    return permKey !== 'can_manage_settings';
  }

  return false;
}

function hasPermission(permKey) {
  if (!isManagerLoggedIn()) return false;
  return userHasPermission(state.currentUser, permKey);
}

// Helpers de Checagem Rápida
function canDeleteBookings() { return hasPermission('can_delete_bookings'); }
function canStartMatches() { return hasPermission('can_start_matches'); }
function canFinishMatches() { return hasPermission('can_finish_matches'); }
function canManageBar() { return hasPermission('can_manage_bar'); }
function canDirectBooking() { return hasPermission('can_direct_booking'); }
function canEditCourts() { return hasPermission('can_edit_courts'); }
function canManageMaintenance() { return hasPermission('can_manage_maintenance'); }
function canManageCategories() { return hasPermission('can_manage_categories'); }
function canManageCustomers() { return hasPermission('can_manage_customers'); }
function canManageMonthly() { return hasPermission('can_manage_monthly'); }
function canManageProducts() { return hasPermission('can_manage_products'); }
function canManageSettings() { return hasPermission('can_manage_settings'); }

window.SYSTEM_PERMISSIONS = SYSTEM_PERMISSIONS;
window.userHasPermission = userHasPermission;
window.hasPermission = hasPermission;
window.canDeleteBookings = canDeleteBookings;
window.canStartMatches = canStartMatches;
window.canFinishMatches = canFinishMatches;
window.canManageBar = canManageBar;
window.canDirectBooking = canDirectBooking;
window.canEditCourts = canEditCourts;
window.canManageMaintenance = canManageMaintenance;
window.canManageCategories = canManageCategories;
window.canManageCustomers = canManageCustomers;
window.canManageMonthly = canManageMonthly;
window.canManageProducts = canManageProducts;
window.canManageSettings = canManageSettings;

// ====================================================
// MOTOR DE AUDITORIA E LOGS DO SISTEMA (MOBILE & PC)
// ====================================================
function getDeviceContext() {
  const ua = navigator.userAgent || '';
  const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (window.innerWidth <= 768);
  return {
    isMobile: isMob,
    label: isMob ? '📱 Mobile' : '💻 PC',
    fullLabel: isMob ? '📱 Celular / Mobile' : '💻 Computador / PC',
    badgeClass: isMob ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-800 border-slate-300'
  };
}

function logSystemAction({ actionType, actionLabel, courtName, details, targetId }) {
  const now = new Date();
  const dev = getDeviceContext();
  
  let authorName = 'Administrador Geral (Gabriel Alves)';
  let authorRole = 'Administrador Geral';

  if (state.currentUser) {
    authorName = (state.currentUser.name && state.currentUser.name !== 'Administrador Geral') 
      ? state.currentUser.name 
      : (state.currentUser.email === 'admin@arenalimoeiro.com.br' ? 'Gabriel Alves' : (state.currentUser.name || state.currentUser.email));
    authorRole = state.currentUser.role || 'Gerente do Sistema';
  } else if (state.currentMode !== 'admin') {
    authorName = 'Agendamento Online';
    authorRole = 'Cliente Web';
  }

  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: now.toISOString(),
    dateStr: now.toLocaleDateString('pt-BR'),
    timeStr: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    actionType: actionType || 'GENERIC',
    actionLabel: actionLabel || 'Modificação no Sistema',
    courtName: courtName || '—',
    details: details || '',
    userName: authorName,
    userRole: authorRole,
    deviceType: dev.label,
    isMobile: dev.isMobile,
    targetId: targetId || null
  };

  if (!state.systemLogs) state.systemLogs = [];
  state.systemLogs = [logEntry, ...state.systemLogs];
  if (state.systemLogs.length > 1500) {
    state.systemLogs = state.systemLogs.slice(0, 1500);
  }

  try {
    localStorage.setItem('arena_system_logs', JSON.stringify(state.systemLogs));
  } catch (e) {}

  // Transmissão em tempo real entre celulares e computadores
  if (window.ArenaSupabase && window.ArenaSupabase.broadcastSystemLog) {
    window.ArenaSupabase.broadcastSystemLog(logEntry);
  }
  if (window.arenaSyncChannel) {
    try { window.arenaSyncChannel.postMessage({ type: 'system_log', payload: logEntry }); } catch(e) {}
  }

  return logEntry;
}

function handleReceivedBookingDelete(data) {
  if (!data || !data.id) return;
  const targetId = String(data.id);

  // 1. Remove da memória
  state.bookings = (state.bookings || []).filter(b => b && String(b.id) !== targetId);

  // 2. Remove do localStorage
  try {
    let local = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    local = local.filter(b => b && String(b.id) !== targetId);
    localStorage.setItem('arena_local_bookings', JSON.stringify(local));
  } catch(e) {}

  // 3. Atualiza grade e interface instantaneamente (<50ms)
  requestSchedule();
  _refreshAllUI();
  if (state.currentMode === 'admin') {
    renderStepContent();
  }

  // Se o modal de busca de jogos estiver aberto, atualiza
  if (typeof renderSearchResults === 'function' && document.getElementById('matchSearchResultsList')) {
    renderSearchResults();
  }
  if (typeof filterSubtabBookingsList === 'function' && document.getElementById('subtabBookingsListContainer')) {
    filterSubtabBookingsList();
  }

  // 4. Notifica gestores logados no aparelho (som, vibração e aviso na tela)
  if (isManagerLoggedIn()) {
    playNotificationSound();
    if ('vibrate' in navigator) {
      try { navigator.vibrate([150, 80, 150]); } catch(e) {}
    }
    showToastNotification(`
      <h5 class="font-black text-white text-xs mb-0.5 flex items-center gap-1.5">
        <span class="text-rose-400 font-black">🗑️ Jogo Excluído / Horário Liberado!</span>
      </h5>
      <p class="text-slate-200 font-bold mb-0.5">🏟️ <strong>Quadra:</strong> ${data.courtName || 'Quadra'}</p>
      <p class="text-slate-300 text-xs">⏰ <strong>Horário:</strong> ${data.date || ''} (${data.time || ''})</p>
      <p class="text-slate-300 text-xs">👤 <strong>Cliente:</strong> ${data.customerName || 'Cliente'}</p>
      <p class="text-amber-300 text-[11px] font-bold mt-1">Excluído por: ${data.userName || 'Gestor'} (${data.deviceType || 'Dispositivo'})</p>
    `);
  }
}

function handleReceivedSystemLog(logEntry) {
  if (!logEntry || !logEntry.id) return;
  if (!state.systemLogs) state.systemLogs = [];
  if (state.systemLogs.some(l => l.id === logEntry.id)) return;

  state.systemLogs = [logEntry, ...state.systemLogs];
  if (state.systemLogs.length > 1500) state.systemLogs = state.systemLogs.slice(0, 1500);

  try {
    localStorage.setItem('arena_system_logs', JSON.stringify(state.systemLogs));
  } catch(e) {}

  // Se estiver na aba de logs aberta, atualiza a exibição em tempo real!
  if (state.currentMode === 'admin' && state.adminTab === 'settings' && state.adminSubTab === 'audit_logs') {
    renderStepContent();
    if (window.lucide) lucide.createIcons();
  }
}

function handleReceivedClearLogs() {
  state.systemLogs = [];
  try {
    localStorage.removeItem('arena_system_logs');
  } catch(e) {}
  if (state.currentMode === 'admin' && state.adminTab === 'settings' && state.adminSubTab === 'audit_logs') {
    renderStepContent();
    if (window.lucide) lucide.createIcons();
  }
}

// Inicializa canal de sincronização entre abas do navegador
if (typeof BroadcastChannel !== 'undefined' && !window.arenaSyncChannel) {
  try {
    window.arenaSyncChannel = new BroadcastChannel('arena_live_sync_v2');
    window.arenaSyncChannel.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg) return;
      if (msg.type === 'booking_deleted') {
        handleReceivedBookingDelete(msg.payload);
      } else if (msg.type === 'new_booking') {
        if (msg.payload && !state.bookings.some(b => b.id === msg.payload.id)) {
          state.bookings = [...state.bookings, msg.payload];
          _refreshAllUI();
          triggerBookingNotification(msg.payload);
        }
      } else if (msg.type === 'system_log') {
        handleReceivedSystemLog(msg.payload);
      } else if (msg.type === 'clear_logs') {
        handleReceivedClearLogs();
      }
    };
  } catch(e) {}
}

window.getDeviceContext = getDeviceContext;
window.logSystemAction = logSystemAction;
window.handleReceivedBookingDelete = handleReceivedBookingDelete;
window.handleReceivedSystemLog = handleReceivedSystemLog;
window.handleReceivedClearLogs = handleReceivedClearLogs;

// PAINEL DO ADMINISTRADOR / RECEPÇÃO
function renderAdminView(container) {
  if (!isManagerLoggedIn()) {
    state.currentMode = 'client';
    openLoginModal(() => {
      state.currentMode = 'admin';
      state.adminTab = 'live_dashboard';
      renderApp();
    });
    return;
  }
  const isRecep = isReceptionUser();
  
  // Se a aba selecionada não for permitida para esta conta, redireciona para a aba principal
  if (state.adminTab === 'courts_control' && !canEditCourts()) state.adminTab = 'live_dashboard';
  if (state.adminTab === 'categories' && !canManageCategories()) state.adminTab = 'live_dashboard';
  if (state.adminTab === 'bar_control' && !canManageBar()) state.adminTab = 'live_dashboard';
  if (state.adminTab === 'settings' && !canManageSettings() && !canManageCustomers() && !canManageMonthly() && !canManageProducts()) {
    state.adminTab = 'live_dashboard';
  }

  const currentTab = state.adminTab || 'live_dashboard';
  const displayName = (state.currentUser?.name && state.currentUser.name !== 'Administrador Geral') 
    ? state.currentUser.name 
    : (state.currentUser?.email === 'admin@arenalimoeiro.com.br' ? 'Gabriel Alves' : (state.currentUser?.name || 'Gabriel Alves'));
  const displayRole = state.currentUser?.role || (isRecep ? 'Recepção & Atendimento' : 'Gerente do Sistema');

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      
      <!-- Cabeçalho do Painel de Controle Operacional -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div class="flex items-center space-x-3 sm:space-x-4">
          <div class="w-12 h-12 rounded-2xl ${isRecep ? 'bg-emerald-600' : 'bg-emerald-700'} text-white flex items-center justify-center shadow-md flex-shrink-0">
            <i data-lucide="${isRecep ? 'user-check' : 'shield-check'}" class="w-7 h-7 text-emerald-300"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ${isRecep ? 'Painel de Recepção' : 'Painel Operacional'}
              </span>
              <span class="bg-slate-100 text-slate-800 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">👤 ${displayName} • ${displayRole}</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ${isRecep ? 'Recepção & Atendimento da Arena Limoeiro' : 'Painel de Controle da Arena Limoeiro'}
            </h2>
            <p class="text-xs text-slate-500">
              ${isRecep 
                ? 'Visualização e liberação de jogos, finalização de partidas, registro de comanda e entrega de pedidos do bar.' 
                : 'Controle de movimentação de jogos, manutenção de quadras, fila do bar e reservas diretas.'}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
          ${canDirectBooking() ? `
            <button onclick="openDirectBookingModal()" class="flex-1 md:flex-initial justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4 flex-shrink-0"></i>
              <span class="whitespace-nowrap">⚡ Fazer Reserva Balcão</span>
            </button>
          ` : ''}

          <button onclick="logoutAdmin()" class="${canDirectBooking() ? 'shrink-0' : 'w-full'} md:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs">
            <i data-lucide="log-out" class="w-4 h-4 flex-shrink-0"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>

      <!-- Abas Principais de Operação (Grid 2 colunas no mobile, 3 no tablet, flex no desktop) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 sm:gap-2.5 mb-6 pb-2 w-full">
        <button onclick="setAdminTab('live_dashboard')" 
                class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                       ${currentTab === 'live_dashboard' ? 
                         'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                         'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="gamepad-2" class="w-4 h-4 shrink-0 ${currentTab === 'live_dashboard' ? 'text-white' : 'text-emerald-600'}"></i>
          <span class="truncate">Movimentação</span>
        </button>

        ${canEditCourts() ? `
          <button onclick="setAdminTab('courts_control')" 
                  class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                         ${currentTab === 'courts_control' ? 
                           'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                           'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 ${currentTab === 'courts_control' ? 'text-white' : 'text-emerald-600'}"></i>
            <span class="truncate">Quadras</span>
            <span class="px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${currentTab === 'courts_control' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
              ${state.courts.length}
            </span>
          </button>
        ` : ''}

        ${canManageCategories() ? `
          <button onclick="setAdminTab('categories')" 
                  class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                         ${currentTab === 'categories' ? 
                           'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                           'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <i data-lucide="tag" class="w-4 h-4 shrink-0 ${currentTab === 'categories' ? 'text-white' : 'text-emerald-600'}"></i>
            <span class="truncate">Modalidades</span>
            <span class="px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${currentTab === 'categories' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
              ${(state.categories || []).filter(c => c.id !== 'all').length}
            </span>
          </button>
        ` : ''}

        ${(canManageBar() || canManageProducts()) ? `
          <button onclick="setAdminTab('bar_control')" 
                  class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer relative
                         ${currentTab === 'bar_control' ? 
                           'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                           'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <i data-lucide="beer" class="w-4 h-4 shrink-0 ${currentTab === 'bar_control' ? 'text-white' : 'text-amber-500'}"></i>
            <span class="truncate">Bar & Lanchonete</span>
            ${(typeof getWaterSupplyAnalytics === 'function' && getWaterSupplyAnalytics().needsRefill) ? `
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Alerta: Necessita reabastecimento de água"></span>
            ` : ''}
          </button>
        ` : ''}

        ${(canManageSettings() || canManageCustomers() || canManageMonthly()) ? `
          <button onclick="setAdminTab('settings')" 
                  class="col-span-2 sm:col-span-1 lg:col-auto w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                         ${currentTab === 'settings' ? 
                           'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                           'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <i data-lucide="settings" class="w-4 h-4 shrink-0 ${currentTab === 'settings' ? 'text-white' : 'text-slate-600'}"></i>
            <span class="truncate">Cadastros & Ajustes</span>
          </button>
        ` : ''}
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


function setAdminCategoryFilter(catId) {
  state.adminCategoryFilter = catId;
  renderStepContent();
  lucide.createIcons();
}

function setAdminSubTab(subTab) {
  state.adminSubTab = subTab;
  state.adminTab = 'settings';
  renderStepContent();
  lucide.createIcons();
}


function navigateAdminFilterDate(offsetDays) {
  const currentStr = state.adminFilterDate || getFormattedDate(new Date());
  const [y, m, d] = currentStr.split('-');
  const curDate = new Date(Number(y), Number(m) - 1, Number(d));
  curDate.setDate(curDate.getDate() + offsetDays);
  state.adminFilterDate = getFormattedDate(curDate);
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

// ==============================================================================
// ⏱️ GESTÃO OPERACIONAL DE ATRASOS & PREVENÇÃO DE CHOQUE ENTRE JOGOS
// ==============================================================================
function setMatchDelay(matchId, minutes) {
  if (!state.matchDelays) state.matchDelays = {};
  const current = state.matchDelays[matchId]?.minutes || 0;
  const newDelay = Math.max(0, current + minutes);
  if (newDelay === 0) {
    delete state.matchDelays[matchId];
  } else {
    state.matchDelays[matchId] = {
      minutes: newDelay,
      updatedAt: new Date().toISOString(),
      notifiedNext: false
    };
  }
  localStorage.setItem('arena_match_delays', JSON.stringify(state.matchDelays));
  renderStepContent();
  lucide.createIcons();
}

function clearMatchDelay(matchId) {
  if (!state.matchDelays) state.matchDelays = {};
  delete state.matchDelays[matchId];
  localStorage.setItem('arena_match_delays', JSON.stringify(state.matchDelays));
  renderStepContent();
  lucide.createIcons();
}

function markNextCustomerNotified(matchId) {
  if (!state.matchDelays) state.matchDelays = {};
  if (state.matchDelays[matchId]) {
    state.matchDelays[matchId].notifiedNext = true;
    localStorage.setItem('arena_match_delays', JSON.stringify(state.matchDelays));
    renderStepContent();
    lucide.createIcons();
  }
}

// ▶ INICIAR JOGO AGORA (antes do horário agendado)
// Salva o horário real de início em matchDelays[id].earlyStartAt
function startMatchNow(matchId) {
  if (!state.matchDelays) state.matchDelays = {};
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  if (!state.matchDelays[matchId]) state.matchDelays[matchId] = { minutes: 0 };
  state.matchDelays[matchId].earlyStartAt = nowStr;
  state.matchDelays[matchId].earlyStartTs = now.toISOString();
  localStorage.setItem('arena_match_delays', JSON.stringify(state.matchDelays));

  // Atualiza status no Supabase sem sobrescrever o horário agendado original
  const client = (window.ArenaSupabase && window.ArenaSupabase.isReady()) ? window.ArenaSupabase.getClient() : null;
  if (client) {
    client.from('bookings').update({ status: 'in_progress' }).eq('id', matchId).then(() => {});
  }
  // Atualiza estado local
  const booking = state.bookings.find(b => b.id === matchId);
  if (booking) { booking.status = 'in_progress'; }

  // Atualiza localBookings
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const lIdx = localBookings.findIndex(b => b.id === matchId);
  if (lIdx !== -1) {
    localBookings[lIdx].status = 'in_progress';
    localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
  }

  // Registra no Log de Auditoria
  const bCourt = booking ? (state.courts || []).find(c => c.id === (booking.court_id || booking.courtId)) : null;
  logSystemAction({
    actionType: 'START_MATCH',
    actionLabel: 'Início de Partida',
    courtName: bCourt ? bCourt.name : 'Quadra',
    details: `Partida de ${booking ? (booking.customer_name || 'Cliente') : 'Cliente'} iniciada às ${nowStr}.`,
    targetId: matchId
  });

  renderStepContent();
  if (window.lucide) lucide.createIcons();
}

// ⏹ FINALIZAR JOGO MANUALMENTE (a qualquer momento após iniciar)
function finishMatchManual(matchId) {
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const booking = (state.bookings || []).find(b => b.id === matchId);
  if (booking) {
    booking.status = 'finished';
    booking.end_time = nowStr;

    // Se houver pedidos do bar vinculados a este jogo, atualiza automaticamente como entregue!
    if (booking.product_cart && typeof booking.product_cart === 'object') {
      const pKeys = Object.keys(booking.product_cart).filter(k => !k.startsWith('_'));
      if (pKeys.some(k => booking.product_cart[k] > 0)) {
        booking.product_cart._status = 'delivered';
        booking.bar_status = 'delivered';
      }
    }
  }

  // Atualiza no localStorage
  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const idx = localBookings.findIndex(b => b.id === matchId);
  if (idx !== -1 && booking) {
    localBookings[idx] = booking;
    localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
  }

  const client = (window.ArenaSupabase && window.ArenaSupabase.isReady()) ? window.ArenaSupabase.getClient() : null;
  if (client) {
    const payload = { status: 'finished', end_time: nowStr };
    if (booking && booking.product_cart) payload.product_cart = booking.product_cart;
    client.from('bookings').update(payload).eq('id', matchId).then(() => {});
  }

  // Remove entrada de atraso ao finalizar manualmente
  if (state.matchDelays && state.matchDelays[matchId]) {
    delete state.matchDelays[matchId];
    localStorage.setItem('arena_match_delays', JSON.stringify(state.matchDelays));
  }

  // Registra no Log de Auditoria
  const bCourtFin = booking ? (state.courts || []).find(c => c.id === (booking.court_id || booking.courtId)) : null;
  logSystemAction({
    actionType: 'FINISH_MATCH',
    actionLabel: 'Finalização de Partida',
    courtName: bCourtFin ? bCourtFin.name : 'Quadra',
    details: `Partida de ${booking ? (booking.customer_name || 'Cliente') : 'Cliente'} finalizada manualmente às ${nowStr}.`,
    targetId: matchId
  });

  renderStepContent();
  if (window.lucide) lucide.createIcons();
}

function scrollHorizontalCalendar(direction) {
  const el = document.getElementById('horizontalDaysContainer');
  if (el) {
    el.scrollBy({ left: direction * 280, behavior: 'smooth' });
  }
}

function triggerCourtAlertModal(courtName, currentTeam, nextTeam, nextTime) {
  const modalId = 'courtAlertModal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const modalHtml = `
    <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-300 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <i data-lucide="megaphone" class="w-8 h-8 text-amber-600"></i>
        </div>
        <div>
          <span class="text-xs font-black text-amber-700 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Aviso Operacional de Quadra</span>
          <h3 class="text-xl font-black text-slate-900 mt-2">Cobrar Liberação de Quadra</h3>
          <p class="text-xs text-slate-600 mt-1 font-semibold">📍 ${courtName}</p>
        </div>

        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500 font-bold">Time em Campo:</span>
            <span class="font-black text-slate-900">${currentTeam}</span>
          </div>
          <div class="flex justify-between border-t border-slate-200 pt-2">
            <span class="text-amber-700 font-bold">Próximo Time Aguardando:</span>
            <span class="font-black text-slate-900">${nextTeam} (${nextTime})</span>
          </div>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed">
          Dirija-se à quadra ou informe o monitor: <strong>"Apitar os últimos lances e liberar o campo para que o próximo time entre no horário sem atrasos."</strong>
        </p>

        <div class="flex gap-2 pt-2">
          <button onclick="document.getElementById('${modalId}').remove()" class="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all">
            Entendido / Fechar
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

// ==============================================================================
// 📅 CALENDÁRIO HORIZONTAL DE JOGOS POR DIA
// ==============================================================================
function renderHorizontalDayCalendar(selectedDate, allBookings, monthlyMembers) {
  const todayStr = getFormattedDate(new Date());
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const weekDaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthsFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const [sy, sm, sd] = (selectedDate || todayStr).split('-');
  const baseDateObj = new Date(Number(sy), Number(sm) - 1, Number(sd));
  const currentMonthYearName = monthsFull[baseDateObj.getMonth()] + ' de ' + baseDateObj.getFullYear();

  const daysList = [];

  // Exibe uma faixa dinâmica de 21 dias (-3 dias até +17 dias a partir da data em foco)
  for (let i = -3; i <= 17; i++) {
    const curD = new Date(baseDateObj);
    curD.setDate(baseDateObj.getDate() + i);
    const dateStr = getFormattedDate(curD);
    const dOfWeek = weekDaysMap[curD.getDay()];
    const weekdayName = weekDaysShort[curD.getDay()];
    const dayNum = String(curD.getDate()).padStart(2, '0');
    const monthName = monthsShort[curD.getMonth()];
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;

    // Contagem de jogos neste dia:
    // 1. Reservas avulsas confirmadas na data
    const dayBookings = allBookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
    // 2. Horários fixos do dia da semana (sem duplicata)
    let fixosCount = 0;
    (monthlyMembers || []).forEach(m => {
      const d = m.day_of_week || m.dayOfWeek;
      if (d === dOfWeek && (!m.status || m.status === 'active')) {
        const startT = m.start_time || m.startTime || m.time || '19:00';
        const cId = m.court_id || m.courtId;
        const alreadyHas = dayBookings.some(b => (b.court_id === cId || b.courtId === cId) && (b.start_time === startT || b.startTime === startT));
        if (!alreadyHas) fixosCount++;
      }
    });
    const totalDayMatches = dayBookings.length + fixosCount;

    daysList.push({
      dateStr,
      weekdayName,
      dayNum,
      monthName,
      isToday,
      isSelected,
      totalDayMatches
    });
  }

  return `
    <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div class="flex items-center space-x-2">
          <span class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <i data-lucide="calendar-range" class="w-4 h-4 text-emerald-700"></i>
          </span>
          <div>
            <h4 class="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>Partidas:</span>
              <span class="text-emerald-700 font-black">${currentMonthYearName}</span>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Ao Vivo</span>
            </h4>
            <p class="text-[11px] text-slate-500 font-medium">Navegue pelos dias para ver os jogos, horários, bola rolando e atrasos em tempo real</p>
          </div>
        </div>

        <!-- Controles Rápidos de Navegação -->
        <div class="flex items-center justify-center sm:justify-end flex-wrap gap-2 w-full sm:w-auto">
          <button type="button" onclick="setAdminFilterDate('${todayStr}')" 
                  class="px-3.5 py-2 rounded-xl text-xs font-black transition-all ${selectedDate === todayStr ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} cursor-pointer">
            ⚡ Hoje
          </button>
          <div class="flex items-center space-x-1">
            <button type="button" onclick="navigateAdminFilterDate(-1)" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs" title="Dia Anterior">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <button type="button" onclick="navigateAdminFilterDate(1)" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs" title="Próximo Dia">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
          <div class="relative flex-1 sm:flex-initial min-w-[130px]">
            <input type="date" value="${selectedDate}" onchange="setAdminFilterDate(this.value)" 
                   class="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-slate-50 hover:bg-white text-center shadow-2xs" title="Escolher outra data">
          </div>
        </div>
      </div>

      <!-- Barra de Rolagem Horizontal de Dias -->
      <div id="horizontalDaysContainer" class="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-thin">
        ${daysList.map(day => `
          <button type="button" onclick="setAdminFilterDate('${day.dateStr}')" 
                  class="flex-shrink-0 flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 min-w-[76px] sm:min-w-[85px] text-center ${day.isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/50 scale-[1.03]' : (day.isToday ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 hover:border-emerald-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50')}">
            
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-black uppercase tracking-wider ${day.isSelected ? 'text-emerald-100' : (day.isToday ? 'text-emerald-700' : 'text-slate-500')}">${day.weekdayName}</span>
              ${day.isToday ? `<span class="w-1.5 h-1.5 rounded-full ${day.isSelected ? 'bg-white' : 'bg-emerald-500'}"></span>` : ''}
            </div>

            <span class="text-lg sm:text-xl font-black leading-tight my-0.5 ${day.isSelected ? 'text-white' : 'text-slate-900'}">${day.dayNum}</span>

            <span class="text-[10px] font-semibold ${day.isSelected ? 'text-emerald-100' : 'text-slate-500'}">${day.monthName}</span>

            <div class="mt-1.5 w-full">
              ${day.totalDayMatches > 0 ? `
                <span class="block w-full text-center px-1.5 py-0.5 rounded-lg text-[9px] font-black ${day.isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                  ⚽ ${day.totalDayMatches} ${day.totalDayMatches === 1 ? 'jogo' : 'jogos'}
                </span>
              ` : `
                <span class="block w-full text-center px-1.5 py-0.5 rounded-lg text-[9px] font-medium ${day.isSelected ? 'text-emerald-200 bg-white/10' : 'text-slate-400 bg-slate-100'}">
                  Sem jogos
                </span>
              `}
            </div>

          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// 1. ABA DE MOVIMENTAÇÃO DOS JOGOS (HOJE & AO VIVO)
function renderLiveDashboardTab() {
  const isRecep = isReceptionUser();
  const selectedDate = state.adminFilterDate || getFormattedDate(new Date());
  const todayStr = getFormattedDate(new Date());
  const isSelectedDateToday = selectedDate === todayStr;

  // Calcula dia da semana
  const [y, m, d] = selectedDate.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  // Junta reservas avulsas e horários fixos do dia (sem duplicatas por ID)
  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

  let matchesList = [];

  // Reservas avulsas confirmadas na data
  allBookings.forEach(b => {
    if (b.date === selectedDate && b.status !== 'cancelled') {
      const startT = b.start_time || b.startTime || (b.time ? b.time.split(' ')[0] : '19:00');
      const endT = b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : '20:00');
      const parsedObs = typeof parseCustomerFromObservation === 'function' ? parseCustomerFromObservation(b.observation || '') : {};
      const custObj = typeof findCustomerByPhone === 'function' ? findCustomerByPhone(b.customer_phone || b.customerPhone || '') : null;
      const cpfVal = b.customer_cpf || b.customerCpf || b.customerCPF || parsedObs.cpf || (custObj ? custObj.cpf : '');
      const emergVal = b.emergency_contact || b.emergencyContact || parsedObs.emergency_contact || (custObj ? custObj.emergency_contact : '');
      const healthVal = b.health_notes || b.healthNotes || parsedObs.health_notes || (custObj ? custObj.health_notes : '');

      matchesList.push({
        id: b.id,
        court_id: b.court_id || b.courtId,
        date: b.date,
        customer_name: b.customer_name || b.customerName || 'Cliente',
        customer_phone: b.customer_phone || b.customerPhone || '',
        customer_cpf: cpfVal,
        emergency_contact: emergVal,
        health_notes: healthVal,
        start_time: startT,
        end_time: endT,
        time: b.time || (startT + ' às ' + endT),
        total_price: parseFloat(b.total_price || b.totalPrice || 0),
        status: b.status || 'confirmed',
        booking_type: b.booking_type || b.bookingType || 'avulso',
        isMensalista: false,
        payment_method: b.payment_method || b.paymentMethod || 'pix',
        product_cart: b.product_cart || b.productCart || {},
        observation: b.observation || ''
      });
    }
  });

  // Horários fixos do dia da semana
  (state.monthlyMembers || []).forEach(m => {
    const day = m.day_of_week || m.dayOfWeek;
    if (day === currentDayOfWeek && (!m.status || m.status === 'active')) {
      const startT = m.start_time || m.startTime || m.time || '19:00';
      const endT = m.end_time || m.endTime || '20:00';
      const cId = m.court_id || m.courtId;
      
      const parsedObs = typeof parseCustomerFromObservation === 'function' ? parseCustomerFromObservation(m.observation || '') : {};
      const custObj = typeof findCustomerByPhone === 'function' ? findCustomerByPhone(m.phone || '') : null;
      const cpfVal = m.cpf || parsedObs.cpf || (custObj ? custObj.cpf : '');
      const emergVal = m.emergency_contact || parsedObs.emergency_contact || (custObj ? custObj.emergency_contact : '');
      const healthVal = m.health_notes || parsedObs.health_notes || (custObj ? custObj.health_notes : '');

      // Evita duplicata se já existir booking gerado para o horário fixo
      const alreadyHas = matchesList.some(b => b.court_id === cId && b.start_time === startT);
      if (!alreadyHas) {
        matchesList.push({
          id: 'monthly-' + m.id,
          court_id: cId,
          date: selectedDate,
          customer_name: (m.team_name || m.teamName) + ' (' + (m.responsible_name || m.responsibleName) + ')',
          customer_phone: m.phone || '',
          customer_cpf: cpfVal,
          emergency_contact: emergVal,
          health_notes: healthVal,
          start_time: startT,
          end_time: endT,
          time: m.time || (startT + ' às ' + endT),
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4,
          status: 'confirmed',
          booking_type: 'fixo',
          isMensalista: true,
          payment_method: 'fixo',
          product_cart: {},
          observation: 'Horário Fixo Semanal'
        });
      }
    }
  });

  // Cálculos de Tempo Real (Ao Vivo)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  matchesList.forEach(m => {
    const delayInfo = state.matchDelays && state.matchDelays[m.id];
    const delayMin = delayInfo ? (delayInfo.minutes || 0) : 0;
    // Horário de início efetivo: earlyStartAt (início antecipado pelo gestor) ou start_time original
    const earlyStart = delayInfo && delayInfo.earlyStartAt;
    const effectiveStartStr = earlyStart || m.start_time;
    const sMin = timeToMinutes(effectiveStartStr);
    const eMin = timeToMinutes(m.end_time);
    const effectiveEndMin = eMin + delayMin;

    m.delayMinutes = delayMin;
    m.effectiveEndMin = effectiveEndMin;
    m.effectiveEndTime = minutesToTime(effectiveEndMin);
    m.durationMin = Math.max(0, eMin - sMin);
    m.earlyStarted = !!earlyStart;
    m.effectiveStartStr = effectiveStartStr;

    if (isSelectedDateToday && m.status !== 'cancelled') {
      if (m.status === 'finished') {
        m.isPast = true;
      } else if (m.status === 'in_progress' || (currentMinutes >= sMin && currentMinutes < effectiveEndMin)) {
        m.isLive = true;
        m.elapsedMinutes = Math.max(0, currentMinutes - sMin);
        m.remainingMinutes = Math.max(0, effectiveEndMin - currentMinutes);
        const totalWithDelay = m.durationMin + delayMin;
        m.progressPercent = totalWithDelay > 0 ? Math.min(100, Math.round((m.elapsedMinutes / totalWithDelay) * 100)) : 0;
      } else if (currentMinutes >= effectiveEndMin) {
        m.isOvertime = true;
        m.overtimeMinutes = currentMinutes - effectiveEndMin;
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
  const liveCount = matchesList.filter(m => m.isLive || m.isOvertime).length;
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
      filteredMatches = filteredMatches.filter(m => m.isLive || m.isOvertime);
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
      ${typeof renderWaterSupplyDashboardBanner === 'function' ? renderWaterSupplyDashboardBanner() : ''}
      
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
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${liveCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'} flex items-center justify-center flex-shrink-0">
            ${liveCount > 0 ? `
              <span class="relative flex h-3.5 w-3.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            ` : `
              <i data-lucide="play" class="w-5 h-5"></i>
            `}
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Ao Vivo Agora</span>
            <div class="text-xl sm:text-2xl font-black ${liveCount > 0 ? 'text-emerald-700' : 'text-slate-700'}">${liveCount} <span class="text-xs font-normal text-slate-500">em quadra</span></div>
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

      <!-- 📅 CALENDÁRIO HORIZONTAL DE DIAS -->
      ${renderHorizontalDayCalendar(selectedDate, allBookings, state.monthlyMembers)}

      <!-- Barra de Filtros por Quadra e Status -->
      <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-3 w-full md:w-auto min-w-0">
          
          <!-- Filtro Quadra -->
          <div class="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <span class="text-xs font-black uppercase text-slate-700 flex-shrink-0 flex items-center min-w-[70px]">
              <i data-lucide="filter" class="w-4 h-4 text-emerald-600 mr-1 flex-shrink-0"></i> Quadra:
            </span>
            <div class="relative flex-1 min-w-0 max-w-full">
              <select onchange="setAdminFilterCourt(this.value)" class="w-full min-w-0 p-2.5 pr-8 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer shadow-sm">
                <option value="all" ${state.adminFilterCourt === 'all' ? 'selected' : ''}>🏟️ Todas as Quadras</option>
                ${state.courts.map(c => `<option value="${c.id}" ${state.adminFilterCourt === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
              <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>

          <!-- Filtro Status -->
          <div class="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <span class="text-xs font-black uppercase text-slate-700 flex-shrink-0 flex items-center min-w-[70px]">
              <i data-lucide="activity" class="w-4 h-4 text-emerald-600 mr-1 flex-shrink-0"></i> Status:
            </span>
            <div class="relative flex-1 min-w-0 max-w-full">
              <select onchange="setAdminFilterStatus(this.value)" class="w-full min-w-0 p-2.5 pr-8 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer shadow-sm">
                <option value="all" ${state.adminFilterStatus === 'all' ? 'selected' : ''}>Todos os Status</option>
                <option value="live" ${state.adminFilterStatus === 'live' ? 'selected' : ''}>🟢 Ao Vivo / Em Andamento</option>
                <option value="upcoming" ${state.adminFilterStatus === 'upcoming' ? 'selected' : ''}>🔵 Próximas Partidas</option>
                <option value="finished" ${state.adminFilterStatus === 'finished' ? 'selected' : ''}>✅ Finalizadas</option>
              </select>
              <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>

        </div>

        <div class="w-full md:w-auto flex flex-col gap-2 items-stretch md:items-end justify-center flex-shrink-0">
          ${canDirectBooking() ? `
            <button onclick="openDirectBookingModal()" class="w-full sm:w-auto justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm flex items-center space-x-1.5 transition-all text-center cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4 flex-shrink-0"></i>
              <span>⚡ Nova Reserva Balcão</span>
            </button>
          ` : ''}
          <button onclick="openSearchMatchesModal()" class="w-full sm:w-auto justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-700 font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all text-center cursor-pointer">
            <i data-lucide="search" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
            <span>🔍 Pesquisar Jogos (Nome/Quadra/CPF)</span>
          </button>
        </div>
      </div>

      <!-- Feed / Tabela de Partidas -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-base sm:text-lg font-black text-slate-900 flex items-center">
              <i data-lucide="list-ordered" class="w-5 h-5 text-emerald-600 mr-2"></i>
              Partidas Programadas para ${formatDisplayDate(selectedDate)}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Acompanhamento ao vivo, cronômetro automático, gestão de atrasos e prevenção de choques</p>
          </div>
          <span class="text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-bold self-start sm:self-center">
            ${filteredMatches.length} ${filteredMatches.length === 1 ? 'partida listada' : 'partidas listadas'}
          </span>
        </div>

        ${filteredMatches.length === 0 ? `
          <div class="text-center py-12 px-4">
            <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="calendar" class="w-8 h-8"></i>
            </div>
            <h4 class="text-sm sm:text-base font-black text-slate-800">Nenhum jogo agendado para esta data</h4>
            <div class="flex flex-wrap items-center justify-center gap-2.5">
              <button onclick="openDirectBookingModal()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm inline-flex items-center space-x-1.5 cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>+ Fazer Reserva Direta Agora</span>
              </button>
              <button onclick="openSearchMatchesModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs inline-flex items-center space-x-1.5 cursor-pointer">
                <i data-lucide="search" class="w-4 h-4 text-emerald-600"></i>
                <span>🔍 Pesquisar Outros Jogos</span>
              </button>
            </div>
          </div>
        ` : `
          <div class="space-y-4">
            ${filteredMatches.map(match => {
              const court = state.courts.find(c => c.id === match.court_id) || { name: 'Quadra Esportiva', image: '/logo.jpg', categoryLabel: 'Esporte' };
              const cleanPhone = (match.customer_phone || '').replace(/\D/g, '');
              const formattedPhone = formatPhone(match.customer_phone);
              const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent('Olá ' + match.customer_name + '! Falamos da Arena Limoeiro sobre o seu jogo agendado para hoje (' + match.time + ') no ' + court.name + '.')}`;

              // Duração formatada
              const durHours = Math.floor(match.durationMin / 60);
              const durRemainMin = match.durationMin % 60;
              const durationText = durHours > 0 
                ? (durRemainMin > 0 ? `${durHours}h ${durRemainMin}m (${match.durationMin} min)` : `${durHours}h (${match.durationMin} min)`)
                : `${match.durationMin} min`;

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
                waiting: { label: 'Aguardando', class: 'bg-amber-100 text-amber-800 border-amber-300', icon: 'clock' },
                separated: { label: 'Separado', class: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'package' },
                chilling: { label: 'No Freezer', class: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: 'thermometer-snowflake' },
                delivered: { label: 'Entregue', class: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: 'check-circle' }
              };
              const currentBarBadge = barStatusBadges[barStatus] || barStatusBadges.waiting;

              // Detecção do Próximo Jogo na Mesma Quadra
              const nextMatch = matchesList.find(other => 
                other.id !== match.id &&
                other.court_id === match.court_id &&
                other.status !== 'cancelled' &&
                timeToMinutes(other.start_time) >= timeToMinutes(match.end_time) &&
                timeToMinutes(other.start_time) <= timeToMinutes(match.end_time) + 30
              );

              // Mensagem para alertar o próximo time no WhatsApp
              let nextWhatsappUrl = '';
              if (nextMatch) {
                const nextCleanPhone = (nextMatch.customer_phone || '').replace(/\D/g, '');
                const effectiveDelay = match.delayMinutes > 0 ? match.delayMinutes : (match.overtimeMinutes || 5);
                const msgAviso = `Olá ${nextMatch.customer_name}! Tudo bem? Falamos da Arena Limoeiro ⚽.\nEstamos acompanhando a quadra ${court.name} para o seu jogo agendado às ${nextMatch.start_time}.\nA partida anterior teve um pequeno atraso de ${effectiveDelay} minutos (previsão de liberação por volta das ${match.effectiveEndTime}).\nEstamos agilizando ao máximo para liberar a quadra o mais rápido possível e garantir que você e sua equipe joguem o tempo completo com total comodidade! Qualquer dúvida é só nos avisar aqui. Nos vemos na Arena! 🏃‍♂️⚽`;
                nextWhatsappUrl = `https://wa.me/55${nextCleanPhone}?text=${encodeURIComponent(msgAviso)}`;
              }

              // Card styling dependendo do status
              let cardBorderClass = 'border-slate-200 bg-white';
              if (match.isOvertime) {
                cardBorderClass = 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/30';
              } else if (match.isLive) {
                cardBorderClass = 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20';
              } else if (match.delayMinutes > 0) {
                cardBorderClass = 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/30';
              }

              return `
                <div class="p-4 sm:p-5 rounded-3xl border ${cardBorderClass} shadow-sm transition-all hover:border-slate-300 space-y-3.5">
                  
                  <!-- Linha Superior: Horário, Espaço, Tipo e Status -->
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    <!-- Bloco de Horário e Local -->
                    <div class="flex items-start sm:items-center space-x-3">
                      <div class="flex flex-col items-center justify-center p-2.5 rounded-2xl ${match.isOvertime ? 'bg-rose-600 text-white shadow-md' : (match.isLive ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-800')} font-black min-w-[85px] text-center flex-shrink-0">
                        <span class="text-xs sm:text-sm uppercase">${match.start_time}</span>
                        <span class="text-[10px] font-medium opacity-85">até ${match.end_time}</span>
                      </div>

                      <div class="space-y-1">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <span class="text-xs font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <span>🏟️</span> ${court.name}
                          </span>
                          <span class="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            ${court.categoryLabel || 'Esporte'}
                          </span>
                          <span class="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <i data-lucide="clock" class="w-3 h-3 text-slate-500"></i>
                            ${durationText} de jogo
                          </span>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                          ${match.isMensalista ? `
                            <span class="text-[11px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center shadow-xs">
                              <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-600 mr-1"></i> Horário Fixo Semanal
                            </span>
                          ` : `
                            <span class="text-[11px] font-black text-sky-900 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-full flex items-center shadow-xs">
                              <i data-lucide="zap" class="w-3.5 h-3.5 text-sky-600 mr-1"></i> Reserva Avulsa
                            </span>
                          `}

                          ${match.isOvertime ? `
                            <span class="text-[10px] font-black text-rose-800 bg-rose-100 border border-rose-400 px-2.5 py-0.5 rounded-full flex items-center animate-pulse">
                              <span class="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span> 🚨 TEMPO ESGOTADO (+${match.overtimeMinutes}m)
                            </span>
                          ` : (match.isLive ? `
                            <span class="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-400 px-2.5 py-0.5 rounded-full flex items-center animate-pulse">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span> 🟢 BOLA ROLANDO AO VIVO
                            </span>
                          ` : (match.status === 'finished' ? `
                            <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">✓ Finalizado</span>
                          ` : `
                            <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Agendado</span>
                          `))}

                          ${match.delayMinutes > 0 ? `
                            <span class="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center">
                              ⏱️ +${match.delayMinutes} min atraso (Término: ${match.effectiveEndTime})
                            </span>
                          ` : ''}
                        </div>
                      </div>
                    </div>

                    <!-- Botões de Ação do Jogo -->
                    <div class="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full md:w-auto pt-2 sm:pt-0">
                      ${(match.isLive || match.isOvertime) ? (canFinishMatches() ? `
                        <!-- Jogo em andamento: Finalizar Jogo (atualiza bar para entregue automaticamente) -->
                        <button onclick="finishMatchManual('${match.id}')" class="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer" title="Finalizar o jogo agora (atualiza o bar para entregue se houver pedidos)">
                          <span class="text-sm leading-none">⏹️</span>
                          <span>Finalizar Jogo</span>
                        </button>
                      ` : '') : (match.status !== 'finished' && isSelectedDateToday ? (canStartMatches() ? `
                        <!-- Jogo agendado hoje: Liberar Entrada / Iniciar Jogo -->
                        <button onclick="startMatchNow('${match.id}')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer" title="Liberar entrada e iniciar jogo agora">
                          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                          <span>Liberar Jogo</span>
                        </button>
                      ` : '') : (match.status !== 'finished' ? (canStartMatches() ? `
                        <button onclick="updateMatchStatus('${match.id}', 'in_progress')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
                          <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                          <span>Liberar Jogo</span>
                        </button>
                      ` : '') : ''))}

                      <!-- Botão de Comanda do Bar -->
                      ${canManageBar() ? `
                        <button onclick="openAddBarItemsModal('${match.id}')" class="px-3.5 py-2 text-slate-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs" title="Adicionar / Registrar Consumo do Bar para este jogo">
                          <span class="text-base leading-none">🍺</span>
                          <span>+ Comanda Bar</span>
                        </button>
                      ` : ''}

                      <!-- Botão de Apagar Jogo (Apenas Gerente do Sistema e Administrador Geral) -->
                      ${canDeleteBookings() ? `
                        <button onclick="handleCancelBooking('${match.id}')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs touch-manipulation" title="Apagar este jogo do sistema e liberar o horário imediatamente">
                          <i data-lucide="trash-2" class="w-4 h-4 text-rose-600"></i>
                          <span>Apagar Jogo</span>
                        </button>
                      ` : ''}
                    </div>

                  </div>

                  <!-- Detalhes do Cliente e Pagamento -->
                  <div class="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div class="space-y-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <div class="flex items-center space-x-1.5">
                          <i data-lucide="user" class="w-4 h-4 text-slate-500"></i>
                          <span class="text-sm sm:text-base font-black text-slate-900">${match.customer_name}</span>
                        </div>
                        ${match.customer_cpf ? `<span class="text-[11px] font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">CPF: ${formatCPF(match.customer_cpf)}</span>` : ''}
                      </div>

                      <div class="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                        ${match.customer_phone ? `
                          <a href="${whatsappUrl}" target="_blank" class="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                            <span>${formattedPhone} (WhatsApp)</span>
                          </a>
                        ` : '<span class="text-slate-400">Sem telefone cadastrado</span>'}

                        ${match.emergency_contact ? `
                          <span class="text-slate-700 font-semibold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <i data-lucide="phone-call" class="w-3.5 h-3.5 text-rose-500"></i>
                            <span>Emergência: <strong>${match.emergency_contact}</strong></span>
                          </span>
                        ` : ''}

                        ${match.health_notes && match.health_notes !== 'Nenhuma restrição informada' && match.health_notes.trim().toLowerCase() !== 'nenhum' ? `
                          <span class="text-amber-900 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i>
                            <span>Saúde: <strong>${match.health_notes}</strong></span>
                          </span>
                        ` : ''}

                        <span class="font-semibold">
                          Valor a Pagar: <strong class="text-slate-900 font-black text-sm">R$ ${match.total_price.toFixed(2).replace('.', ',')}</strong>
                          <span class="text-[10px] text-slate-500 uppercase ml-1">(${match.payment_method === 'fixo' ? 'Plano Fixo' : (match.payment_method === 'pix' ? 'PIX' : 'Recepção')})</span>
                        </span>
                      </div>
                    </div>

                    <!-- Controles de Atraso Operacional -->
                    <div class="flex flex-wrap items-center gap-1.5 self-start md:self-center">
                      <span class="text-[10px] font-black uppercase text-slate-500 tracking-wider mr-1">Marcar Atraso:</span>
                      <button onclick="setMatchDelay('${match.id}', 5)" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs" title="Adicionar +5 min de atraso">+5 min</button>
                      <button onclick="setMatchDelay('${match.id}', 10)" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs" title="Adicionar +10 min de atraso">+10 min</button>
                      <button onclick="setMatchDelay('${match.id}', 15)" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs" title="Adicionar +15 min de atraso">+15 min</button>
                      ${match.delayMinutes > 0 ? `
                        <button onclick="clearMatchDelay('${match.id}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-black transition-all" title="Limpar atraso marcado">✕ Limpar</button>
                      ` : ''}
                    </div>
                  </div>

                  <!-- ⏱️ CRONÔMETRO AO VIVO DINÂMICO (BOLA ROLANDO) -->
                  ${match.isLive ? `
                    <div class="bg-emerald-950 text-emerald-100 p-3.5 rounded-2xl border border-emerald-600 shadow-inner">
                      <div class="flex items-center justify-between text-xs font-black mb-1.5">
                        <span class="flex items-center text-emerald-300">
                          <span class="relative flex h-2.5 w-2.5 mr-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                          </span>
                          ⏱️ BOLA ROLANDO: <strong class="text-white mx-1">${match.elapsedMinutes} min jogados</strong> de ${match.durationMin} min
                        </span>
                        <span class="text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                          Restam ${match.remainingMinutes} min
                        </span>
                      </div>
                      <div class="w-full bg-emerald-900/80 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 h-2.5 rounded-full transition-all duration-500" style="width: ${match.progressPercent}%"></div>
                      </div>
                    </div>
                  ` : ''}

                  <!-- 🚨 ALERTA DE TEMPO ESGOTADO (ESTOURO DE HORÁRIO) -->
                  ${match.isOvertime ? `
                    <div class="bg-rose-950 text-rose-100 p-3.5 rounded-2xl border border-rose-500 shadow-md animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center space-x-2 text-xs font-black text-rose-200">
                        <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-400 flex-shrink-0"></i>
                        <span>🚨 TEMPO ESGOTADO: A partida ultrapassou em <strong>+${match.overtimeMinutes} minutos</strong> o horário final!</span>
                      </div>
                      <button onclick="updateMatchStatus('${match.id}', 'finished')" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow flex items-center justify-center space-x-1.5 transition-all flex-shrink-0">
                        <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                        <span>Liberar Quadra Agora</span>
                      </button>
                    </div>
                  ` : ''}

                  <!-- ⚠️ SISTEMA DE PREVENÇÃO DE CONFLITO COM O PRÓXIMO JOGO -->
                  ${nextMatch ? `
                    <div class="p-3.5 rounded-2xl ${match.delayMinutes > 0 || match.isOvertime ? 'bg-amber-50 border border-amber-300 shadow-xs' : 'bg-slate-50 border border-slate-200'}">
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        
                        <div class="space-y-0.5">
                          <div class="flex items-center space-x-1.5 text-xs font-black ${match.delayMinutes > 0 || match.isOvertime ? 'text-amber-900' : 'text-slate-700'}">
                            <i data-lucide="${match.delayMinutes > 0 || match.isOvertime ? 'alert-triangle' : 'calendar-clock'}" class="w-4 h-4 ${match.delayMinutes > 0 || match.isOvertime ? 'text-amber-600' : 'text-slate-500'}"></i>
                            <span>Próximo Jogo na Mesma Quadra: <strong>${nextMatch.customer_name}</strong> às <strong>${nextMatch.start_time}</strong> (${nextMatch.isMensalista ? '👑 Fixo' : '⚡ Avulso'})</span>
                          </div>
                          ${(match.delayMinutes > 0 || match.isOvertime) ? `
                            <p class="text-[11px] text-amber-800 font-medium">
                              Previsão atualizada de liberação da quadra: <strong>${match.effectiveEndTime}</strong> (+${match.delayMinutes || match.overtimeMinutes} min de atraso). Alinhe com o próximo cliente para evitar choques!
                            </p>
                          ` : `
                            <p class="text-[11px] text-slate-500">Jogo na sequência. Garanta o encerramento às ${match.end_time} para o próximo time entrar pontualmente.</p>
                          `}
                        </div>

                        <div class="flex flex-wrap items-center gap-2 self-start sm:self-center flex-shrink-0">
                          ${(match.delayMinutes > 0 || match.isOvertime) ? `
                            <a href="${nextWhatsappUrl}" target="_blank" onclick="markNextCustomerNotified('${match.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow flex items-center space-x-1.5 transition-all">
                              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                              <span>📲 Avisar Próximo no WhatsApp</span>
                            </a>
                            <button onclick="triggerCourtAlertModal('${court.name}', '${match.customer_name}', '${nextMatch.customer_name}', '${nextMatch.start_time}')" class="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black shadow flex items-center space-x-1.5 transition-all">
                              <i data-lucide="megaphone" class="w-3.5 h-3.5 text-amber-400"></i>
                              <span>📢 Cobrar Saída</span>
                            </button>
                          ` : `
                            <a href="https://wa.me/55${(nextMatch.customer_phone || '').replace(/\D/g, '')}" target="_blank" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1">
                              <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                              <span>WhatsApp Próximo Time</span>
                            </a>
                          `}
                        </div>

                      </div>
                    </div>
                  ` : ''}

                  <!-- Itens do Bar Reservados -->
                  ${itemsList.length > 0 ? `
                    <div class="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold text-slate-800 flex items-center">
                          <i data-lucide="beer" class="w-4 h-4 text-amber-500 mr-1.5 flex-shrink-0"></i>
                          <span><strong>Bebidas/Bar:</strong> ${itemsList.join(', ')}</span>
                        </span>
                        <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full border ${currentBarBadge.class} flex items-center gap-1">
                          <i data-lucide="${currentBarBadge.icon}" class="w-3 h-3"></i>
                          <span>${currentBarBadge.label}</span>
                        </span>
                      </div>

                      <div class="flex items-center gap-1 flex-wrap">
                        <span class="text-[10px] font-bold text-slate-400 uppercase mr-1">Status:</span>
                        <button onclick="updateBarStatus('${match.id}', 'waiting')" 
                                class="px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${barStatus === 'waiting' ? 'bg-amber-100 border-amber-400 text-amber-900 font-black shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}" title="Marcar como Aguardando">
                          ⏳ Pendente
                        </button>
                        <button onclick="updateBarStatus('${match.id}', 'separated')" 
                                class="px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${barStatus === 'separated' ? 'bg-blue-600 border-blue-600 text-white font-black shadow-xs' : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'}" title="Marcar como Separado">
                          📦 Separado
                        </button>
                        <button onclick="updateBarStatus('${match.id}', 'chilling')" 
                                class="px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${barStatus === 'chilling' ? 'bg-cyan-600 border-cyan-600 text-white font-black shadow-xs' : 'bg-white hover:bg-cyan-50 text-cyan-800 border-cyan-200'}" title="Marcar como Colocado no Freezer">
                          ❄️ No Freezer
                        </button>
                        <button onclick="updateBarStatus('${match.id}', 'delivered')" 
                                class="px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${barStatus === 'delivered' ? 'bg-emerald-600 border-emerald-600 text-white font-black shadow-xs' : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'}" title="Marcar como Entregue na Quadra">
                          ✓ Entregue
                        </button>
                        <button onclick="openAddBarItemsModal('${match.id}')" class="px-2 py-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer ml-1">
                          + Itens
                        </button>
                      </div>
                    </div>
                  ` : `
                    <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <button onclick="openAddBarItemsModal('${match.id}')" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1.5 cursor-pointer">
                        <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>+ Registrar Consumo / Bebidas do Bar para este jogo</span>
                      </button>
                    </div>
                  `}

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
  const isRecep = isReceptionUser();
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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2 w-full sm:w-auto">
          <button onclick="openMaintenanceModal()" class="w-full sm:w-auto justify-center text-center px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="clock" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">Agendar Treino / Manutenção</span>
          </button>
          <button onclick="openCourtModal()" class="w-full sm:w-auto justify-center text-center px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="plus" class="w-4 h-4 text-emerald-200 shrink-0"></i>
            <span class="truncate">Nova Quadra</span>
          </button>
        </div>
      </div>

      <!-- Grid com as 6 Quadras -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${state.courts.map(court => {
          const specs = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
          const isUnderMaint = court.isMaintenance === true || court.status === 'maintenance' || specs.status === 'maintenance';
          const maintReason = specs.maintenance_reason || court.maintenance_reason || 'Manutenção preventiva';
          const hasNotice = !isUnderMaint && !!(specs.maintenance_notice || court.maintenance_notice);
          const noticeText = specs.maintenance_notice || court.maintenance_notice || '';

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
            <div class="bg-white rounded-3xl overflow-hidden border ${isUnderMaint ? 'border-rose-300 ring-2 ring-rose-500/20 shadow-md' : (hasNotice ? 'border-amber-300 ring-2 ring-amber-500/20 shadow-md' : 'border-slate-200 shadow-sm')} flex flex-col justify-between">
              
              <div>
                <div class="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img src="${court.image}" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  <!-- Badges de Categoria e Status -->
                  <div class="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-20">
                    <span class="bg-black/80 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      ${court.categoryLabel || court.category_label || 'Esporte'}
                    </span>
                    ${isUnderMaint ? `
                      <span class="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border border-rose-400 shadow-md flex items-center animate-pulse">
                        <i data-lucide="alert-triangle" class="w-3 h-3 mr-1"></i> EM MANUTENÇÃO GERAL
                      </span>
                    ` : (hasNotice ? `
                      <span class="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center animate-pulse">
                        <i data-lucide="alert-triangle" class="w-3 h-3 mr-1"></i> AVISO PRÉVIO DE MANUTENÇÃO
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
                    `))))}
                    ${(() => {
                      const curDisp = getCourtDisplayBadge(court);
                      if (!curDisp) return '';
                      return `
                        <span class="bg-emerald-950/90 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-400/40 shadow-md flex items-center">
                          ${curDisp}
                        </span>
                      `;
                    })()}
                  </div>

                  <!-- Ações Rápidas no Canto Superior Direito da Imagem -->
                  <div class="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
                    <button onclick="openCourtModal('${court.id}')" 
                            title="Editar valores, horas, descrição e foto desta quadra"
                            class="p-2 bg-white/95 hover:bg-white text-slate-800 hover:text-amber-600 rounded-xl shadow-md backdrop-blur-sm transition-all cursor-pointer">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="deleteCourt('${court.id}')" 
                            title="Remover esta quadra do sistema"
                            class="p-2 bg-white/95 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl shadow-md backdrop-blur-sm transition-all cursor-pointer">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
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
                  ` : (hasNotice ? `
                    <div class="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-1">
                      <div class="font-black flex items-center justify-between text-amber-900">
                        <span class="flex items-center"><i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 mr-1.5"></i> Aviso Prévio de Manutenção Ativo</span>
                        <span class="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-full">ALERTA</span>
                      </div>
                      <p class="text-[11px] text-amber-800 font-semibold">${noticeText}</p>
                      <p class="text-[10px] text-slate-500 pt-0.5">Visível para os clientes ao selecionar a quadra.</p>
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
                      <div class="font-black flex items-center justify-between mb-0.5">
                        <div class="flex items-center">
                          <span class="w-2 h-2 rounded-full bg-amber-600 mr-1.5 animate-ping"></span>
                          Partida ao Vivo em Andamento
                        </div>
                        ${canDeleteBookings() ? `
                          <button onclick="handleCancelBooking('${liveBooking.id}')" class="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black flex items-center space-x-1 cursor-pointer transition-all touch-manipulation" title="Apagar este jogo do sistema">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-600"></i>
                            <span>Apagar Jogo</span>
                          </button>
                        ` : ''}
                      </div>
                      <p class="font-medium text-[11px] text-amber-800">${liveBooking.customer_name} (${liveBooking.start_time} às ${liveBooking.end_time})</p>
                    </div>
                  ` : (nextBooking ? `
                    <div class="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                      <div class="font-black flex items-center justify-between mb-0.5">
                        <div class="flex items-center">
                          <i data-lucide="clock" class="w-4 h-4 text-blue-600 mr-1.5"></i>
                          Próxima Partida Hoje
                        </div>
                        ${canDeleteBookings() ? `
                          <button onclick="handleCancelBooking('${nextBooking.id}')" class="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black flex items-center space-x-1 cursor-pointer transition-all touch-manipulation" title="Apagar este jogo do sistema">
                            <i data-lucide="trash-2" class="w-3 h-3 text-rose-600"></i>
                            <span>Apagar Jogo</span>
                          </button>
                        ` : ''}
                      </div>
                      <p class="font-medium text-[11px] text-blue-800">${nextBooking.customer_name} às ${nextBooking.start_time || (nextBooking.time ? nextBooking.time.split(' ')[0] : '')}</p>
                    </div>
                  ` : `
                    <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                      <div class="font-black flex items-center mb-0.5">
                        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 mr-1.5"></i>
                        Quadra 100% Operacional
                      </div>
                      <p class="font-medium text-[11px] text-emerald-700">Clientes podem agendar normalmente no site.</p>
                    </div>
                  `))))}

                  <div class="text-xs text-slate-600 space-y-1.5 pt-1">
                    <p class="flex items-center"><i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0"></i> <span>Piso: ${specs.surface || specs.type || 'Oficial de Alto Desempenho'}</span></p>
                    <p class="flex items-center"><i data-lucide="users" class="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0"></i> <span>${specs.capacity || '14 a 16 Jogadores'}</span></p>
                    <p class="flex items-center font-bold text-slate-900"><i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0"></i> <span>R$ ${(court.basePricePerHour || court.base_price_per_hour || 140).toFixed(2).replace('.', ',')}/hora (Normal)</span></p>
                    ${specs.discount_price_per_hour && parseFloat(specs.discount_price_per_hour) > 0 ? `
                      <p class="flex items-center font-black text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                        <span class="mr-1">🔥</span> 
                        <span>${specs.discount_start_time || '09:00'} às ${specs.discount_end_time || '16:00'}: R$ ${parseFloat(specs.discount_price_per_hour).toFixed(2).replace('.', ',')}/h (Desconto)</span>
                      </p>
                    ` : ''}
                    <p class="flex items-center text-slate-500 font-medium"><i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0"></i> <span>Horários: ${specs.opening_time || '06:00'} às ${specs.closing_time || '23:00'}</span></p>
                  </div>
                </div>
              </div>

              <!-- Botões de Ação por Campo -->
              <div class="p-5 pt-0 space-y-2">
                <button onclick="openMaintenanceModal('${court.id}')" 
                        class="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-rose-600"></i>
                  <span>Agendar Treino / Manutenção (com Horário)</span>
                </button>

                <!-- Botão de Destaque & Marketing (Manual ou Automático) -->
                <button onclick="openCourtBadgeModal('${court.id}')" 
                        class="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600"></i>
                  <span>${(() => {
                    const sp = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
                    const bMode = sp.badge_mode || court.badge_mode || (court.badge ? 'manual' : 'none');
                    const curDisp = getCourtDisplayBadge(court);
                    if (bMode === 'auto') {
                      return `⚡ Destaque: Automático ${curDisp ? `("${curDisp}")` : ''}`;
                    } else if (bMode === 'manual' && curDisp) {
                      return `⭐ Destaque: "${curDisp}"`;
                    }
                    return '⭐ Selo de Destaque / Badge (Manual ou Auto)';
                  })()}</span>
                </button>

                <div class="flex items-center space-x-2">
                  ${isUnderMaint ? `
                    <button onclick="setCourtMaintenance('${court.id}', false)" 
                            class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/30">
                      <i data-lucide="check-circle" class="w-4 h-4"></i>
                      <span>✓ Liberar Espaço</span>
                    </button>
                  ` : `
                    <button onclick="openMaintenanceNoticeModal('${court.id}')" 
                            class="flex-1 py-2 ${hasNotice ? 'bg-amber-100 border-2 border-amber-400 text-amber-950 font-black' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold'} text-xs rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer">
                      <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i>
                      <span>${hasNotice ? 'Editar Aviso' : 'Aviso Prévio'}</span>
                    </button>
                    <button onclick="setCourtMaintenance('${court.id}', true, 'Interdição geral da quadra')" 
                            class="flex-1 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer">
                      <i data-lucide="wrench" class="w-3.5 h-3.5 text-slate-500 hover:text-rose-600"></i>
                      <span>Interditar</span>
                    </button>
                  `}
                  
                  <button onclick="setAdminTab('schedule')" class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span>Grade</span>
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

// ==========================================
// MÓDULO DE GESTÃO E REGISTRO DE ÁGUA DA ARENA
// ==========================================

function getWaterSupplyAnalytics() {
  const full = (state.waterSupply && typeof state.waterSupply.full === 'number') ? state.waterSupply.full : 0;
  const empty = (state.waterSupply && typeof state.waterSupply.empty === 'number') ? state.waterSupply.empty : 0;
  const minAlert = (state.waterSupply && typeof state.waterSupply.min_alert === 'number') ? state.waterSupply.min_alert : 5;

  const todayStr = getFormattedDate(new Date());
  const tomorrowStr = getFormattedDate(new Date(Date.now() + 86400000));
  const dayAfterTomorrowStr = getFormattedDate(new Date(Date.now() + 86400000 * 2));
  const next2Days = [todayStr, tomorrowStr, dayAfterTomorrowStr];

  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

  let totalReservedAll = 0;
  let reservedNext2Days = 0;
  const upcomingWaterBookings = [];

  // Variáveis de Relatório Financeiro dos Campos (Vendas de Água - Clientes não possuem pendência)
  let totalWaterSoldQty = 0;
  let totalWaterRevenue = 0;
  let paidWaterBookingsCount = 0;
  let unreleasedWaterBookingsCount = 0;

  // Busca preço padrão da água
  const waterProduct = (state.products || []).find(p => isWaterProduct(p)) || { price: 4.00 };
  const defaultWaterPrice = waterProduct.price || 4.00;

  allBookings.forEach(b => {
    if (!b || b.status === 'cancelled') return;
    const cart = b.product_cart || b.productCart || {};
    let bookingWaterQty = 0;
    let bookingWaterPrice = 0;

    Object.entries(cart).forEach(([id, q]) => {
      if (id.startsWith('_') || typeof q !== 'number' || q <= 0) return;
      const prod = (state.products || []).find(p => p.id === id);
      if (isWaterProduct(prod)) {
        bookingWaterQty += q;
        bookingWaterPrice += (prod.price || defaultWaterPrice) * q;
      }
    });

    if (bookingWaterQty > 0) {
      totalWaterSoldQty += bookingWaterQty;
      paidWaterBookingsCount++;

      const bDate = b.date;
      const isNext2Days = next2Days.includes(bDate);
      const isReleased = cart._status === 'delivered' || cart._water_released === true;

      if (!isReleased && b.status !== 'finished') {
        unreleasedWaterBookingsCount++;
      }

      // Se for reserva ativa futura
      if (b.status !== 'finished') {
        totalReservedAll += bookingWaterQty;
        if (isNext2Days) {
          reservedNext2Days += bookingWaterQty;
        }

        if (bDate >= todayStr) {
          const court = (state.courts || []).find(c => c.id === (b.court_id || b.courtId)) || { name: 'Quadra Esportiva' };
          upcomingWaterBookings.push({
            bookingId: b.id,
            date: bDate,
            time: b.time || (b.start_time ? `${b.start_time} às ${b.end_time}` : ''),
            customerName: b.customer_name || b.customerName || 'Cliente',
            customerPhone: b.customer_phone || b.customerPhone || '',
            courtName: court.name,
            courtId: b.court_id || b.courtId,
            waterQty: bookingWaterQty,
            waterPrice: bookingWaterPrice,
            isPaid: true, // Clientes não têm pendência de água
            paidMethod: cart._water_paid_method || 'Incluso no Jogo',
            isReleased: isReleased,
            status: cart._status || b.bar_status || 'waiting',
            isNext2Days: isNext2Days
          });
        }
      }
    }
  });

  upcomingWaterBookings.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });

  // Cálculos de Abastecimento (Fornecedor) - Única pendência permitida: a pagar à vista no Pix ou Dinheiro
  let totalWaterSuppliedQty = 0;
  let totalSupplyCostPaid = 0;
  let totalSupplyCostPending = 0;

  // Contagem de galões cheios em uso nos campos/quadras
  let totalInCourts = 0;
  const courtWaterMap = (state.waterSupply && state.waterSupply.courts) ? state.waterSupply.courts : {};
  (state.courts || []).forEach(c => {
    const cw = courtWaterMap[c.id];
    if (cw && typeof cw.available === 'number') {
      totalInCourts += cw.available;
    }
  });

  const history = (state.waterSupply && Array.isArray(state.waterSupply.history)) ? state.waterSupply.history : [];
  history.forEach(item => {
    if (item.type === 'abastecimento') {
      const q = typeof item.qtd === 'number' ? item.qtd : 0;
      totalWaterSuppliedQty += q;
      const cost = typeof item.cost === 'number' ? item.cost : 0;
      if (item.payment_status === 'pending') {
        totalSupplyCostPending += cost;
      } else {
        totalSupplyCostPaid += cost;
      }
    }
  });

  const netWaterProfit = totalWaterRevenue - (totalSupplyCostPaid + totalSupplyCostPending);

  // Galões Fixos destinados a pessoas/cadastros
  const fixedAllocations = (state.waterSupply && Array.isArray(state.waterSupply.fixed_allocations))
    ? state.waterSupply.fixed_allocations
    : [];
  const totalFixedGallons = fixedAllocations.reduce((acc, item) => acc + (Number(item.gallons) || 0), 0);
  
  // Saldo real que pode ser enviado aos campos (descontando os galões fixos)
  const availableForCourts = Math.max(0, full - totalFixedGallons);

  const freeForSale = Math.max(0, availableForCourts - totalReservedAll);
  
  // Regra Oficial Arena Limoeiro: O pedido de reabastecimento à distribuidora é feito com a baixa de 4 águas
  const MIN_WATER_REFILL_BATCH = 4;
  
  // Quantidade de água que precisa abastecer (em lotes de 4 águas ou quando atinge baixa de 4 un)
  const refillNeededCount = empty >= MIN_WATER_REFILL_BATCH 
    ? empty 
    : (reservedNext2Days > full ? (reservedNext2Days - full) : 0);

  // O alerta preventivo de pedido só deve ser feito com a baixa de pelo menos 4 águas (empty >= 4)
  // ou quando o estoque de cheias for insuficiente para a demanda confirmada dos próximos 2 dias
  const needsRefill = (empty >= MIN_WATER_REFILL_BATCH) || (full < minAlert) || (reservedNext2Days > full && full < MIN_WATER_REFILL_BATCH);

  return {
    full,
    empty,
    totalStock: full + empty,
    totalInCourts,
    fixedAllocations,
    totalFixedGallons,
    availableForCourts,
    unitPrice: (state.waterSupply && typeof state.waterSupply.unit_price === 'number') ? state.waterSupply.unit_price : 5.00,
    minAlert,
    minRefillBatch: MIN_WATER_REFILL_BATCH,
    emptyRemainingForRefill: Math.max(0, MIN_WATER_REFILL_BATCH - empty),
    totalReservedAll,
    reservedNext2Days,
    freeForSale,
    refillNeededCount,
    needsRefill,
    upcomingWaterBookings,
    todayStr,
    tomorrowStr,
    dayAfterTomorrowStr,
    // Relatório Financeiro dos Campos (Faturamento - Clientes não têm pendência)
    totalWaterSoldQty,
    totalWaterRevenue,
    paidWaterBookingsCount,
    unreleasedWaterBookingsCount,
    // Relatório Fornecedor (Custos de Abastecimento - Única pendência a declarar: à vista no Pix ou Dinheiro)
    totalWaterSuppliedQty,
    totalSupplyCostPaid,
    totalSupplyCostPending,
    netWaterProfit
  };
}
window.getWaterSupplyAnalytics = getWaterSupplyAnalytics;

async function loadWaterSupplyFromDatabase() {
  if (!window.ArenaSupabase || !window.ArenaSupabase.isReady()) return;
  try {
    const client = window.ArenaSupabase.getClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', 'arena-water-supply')
      .maybeSingle();

    if (data && data.image) {
      const parsed = JSON.parse(data.image);
      if (parsed && typeof parsed.full === 'number') {
        state.waterSupply = {
          full: parsed.full,
          empty: typeof parsed.empty === 'number' ? parsed.empty : 0,
          min_alert: typeof parsed.min_alert === 'number' ? parsed.min_alert : 5,
          unit_price: typeof parsed.unit_price === 'number' ? parsed.unit_price : 5.00,
          courts: (parsed.courts && typeof parsed.courts === 'object') ? parsed.courts : {},
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          history: Array.isArray(parsed.history) ? parsed.history : []
        };
        localStorage.setItem('arena_water_supply', JSON.stringify(state.waterSupply));
        if (state.currentMode === 'admin' && (state.adminTab === 'bar_control' || state.adminTab === 'live_dashboard')) {
          renderStepContent();
        }
      }
    }
  } catch(err) {
    console.warn('Erro ao carregar água do Supabase:', err);
  }
}
window.loadWaterSupplyFromDatabase = loadWaterSupplyFromDatabase;

async function saveWaterSupplyToDatabase() {
  localStorage.setItem('arena_water_supply', JSON.stringify(state.waterSupply));
  if (!window.ArenaSupabase || !window.ArenaSupabase.isReady()) return;
  try {
    const client = window.ArenaSupabase.getClient();
    const payload = {
      id: 'arena-water-supply',
      name: '💧 Controle Interno de Água Arena',
      category: 'Bebidas',
      price: 0,
      description: 'Registro de águas cheias/vazias da Arena Limoeiro',
      image: JSON.stringify(state.waterSupply),
      is_available: true,
      type: 'water_supply'
    };
    await client.from('products').upsert(payload);
  } catch(err) {
    console.warn('Erro ao salvar água no Supabase:', err);
  }
}
window.saveWaterSupplyToDatabase = saveWaterSupplyToDatabase;

function renderWaterSupplyDashboardBanner() {
  const analytics = getWaterSupplyAnalytics();
  
  // Regra do Usuário: Quando o estoque estiver completo/seguro, NÃO aparece nada na tela!
  // Só aparece nos momentos em que realmente precisa pedir reposição.
  if (!analytics.needsRefill) {
    return '';
  }

  const full = analytics.full;
  const minAlert = analytics.minAlert || 4;
  const idealCapacity = (state.waterSupply && typeof state.waterSupply.ideal_capacity === 'number') ? state.waterSupply.ideal_capacity : 35;
  const reservePercent = Math.min(100, Math.round((full / idealCapacity) * 100));
  const refillBatch = Math.max(idealCapacity - full, analytics.refillNeededCount || 4, analytics.empty || 4);

  // Critério de distinção entre os 2 modelos do usuário:
  // MODELO 1 (Crítico - Vermelho): Quando o estoque de cheias estiver zerado ou abaixo da metade do limite mínimo
  // MODELO 2 (Reposição em Breve - Âmbar): Quando atingiu o estoque de segurança / gatilho mínimo mas ainda tem unidades cheias
  const isCritical = full <= 0 || full < Math.max(2, Math.floor(minAlert / 2));
  const reserveStatus = isCritical ? (full <= 0 ? 'Esgotado' : 'Crítico') : 'Mínimo';

  if (isCritical) {
    // ========================================================
    // MODELO 1: Estoque de água cheia em nível crítico (Vermelho)
    // Conforme layout da Imagem 1 fornecida pelo usuário
    // ========================================================
    return `
      <div class="bg-gradient-to-r from-[#18090f] via-[#12070c] to-[#0c0e17] text-white p-4 sm:p-5 rounded-2xl border-2 border-rose-600/70 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <!-- Glow ambiente de fundo -->
        <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-start space-x-3.5 sm:space-x-4 max-w-3xl flex-1">
          <!-- Ícone Alerta com Ponto Indicador Pulsante -->
          <div class="relative shrink-0 mt-0.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-inner">
              <i data-lucide="alert-triangle" class="w-6 h-6 text-rose-400"></i>
            </div>
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-slate-950"></span>
            </span>
          </div>

          <div class="space-y-1.5 flex-1 min-w-0">
            <!-- Linha 1: Badges Superiores -->
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-950/90 text-rose-300 border border-rose-500/40">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
                ABAIXO DO LIMITE MÍNIMO
              </span>
            </div>

            <!-- Linha 2: Título do Alerta e Badge de Quantidade -->
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base sm:text-lg font-black text-white tracking-tight">
                Estoque de água cheia em nível crítico
              </h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-950/90 text-rose-200 border border-rose-600/60 shadow-sm">
                ${full} un disponíveis
              </span>
            </div>

            <!-- Linha 3: Métricas de Lote Ideal e Consumo Previsto -->
            <div class="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
              <span class="flex items-center text-cyan-300 font-semibold">
                <i data-lucide="boxes" class="w-4 h-4 mr-1 text-cyan-400"></i>
                Lote ideal de reposição: <strong class="text-white ml-1 font-bold">${refillBatch} galões</strong>
              </span>
              <span class="text-slate-600 font-bold">•</span>
              <span class="flex items-center text-amber-300 font-semibold">
                <i data-lucide="trending-up" class="w-4 h-4 mr-1 text-amber-400"></i>
                Consumo previsto (48h): <strong class="text-white ml-1 font-bold">${analytics.reservedNext2Days} unidades</strong>
              </span>
            </div>

            <!-- Linha 4: Nível de Reserva no Complexo e Barra de Progresso Vermelha -->
            <div class="space-y-1 pt-1.5 max-w-xl">
              <div class="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                <span>Nível de Reserva no Complexo: <strong class="text-rose-400 font-bold">${reservePercent}% (${reserveStatus})</strong></span>
                <span>Capacidade Ideal: <strong class="text-slate-200">${idealCapacity} un</strong></span>
              </div>
              <div class="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
                <div class="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500 shadow-sm" style="width: ${Math.max(2, reservePercent)}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botões de Ação do Banner: Fazer Pedido e Ver Registro -->
        <div class="flex flex-row items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end">
          <button type="button" onclick="openAddWaterSupplyModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>+ Fazer Pedido</span>
          </button>
          <button type="button" onclick="state.adminTab='bar_control'; state.barSubTab='water'; renderApp();" class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer">
            Ver Registro
          </button>
        </div>
      </div>
    `;
  }

  // ========================================================
  // MODELO 2: Estoque de água requer reposição em breve (Âmbar)
  // Conforme layout da Imagem 2 fornecida pelo usuário
  // ========================================================
  return `
    <div class="bg-gradient-to-r from-[#1c140a] via-[#140e06] to-[#0c0e17] text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-600/70 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
      <!-- Glow ambiente de fundo -->
      <div class="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex items-start space-x-3.5 sm:space-x-4 max-w-3xl flex-1">
        <!-- Ícone Relógio com Ponto Indicador Pulsante Âmbar -->
        <div class="relative shrink-0 mt-0.5">
          <div class="w-12 h-12 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
            <i data-lucide="clock" class="w-6 h-6 text-amber-400"></i>
          </div>
          <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-slate-950"></span>
          </span>
        </div>

        <div class="space-y-1.5 flex-1 min-w-0">
          <!-- Linha 1: Badges Superiores e Unidades Restantes -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-500/40">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
              ESTOQUE DE SEGURANÇA ATINGIDO
            </span>
            <span class="inline-flex items-center space-x-1.5 text-xs text-amber-200/90 bg-slate-800/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              <i data-lucide="package" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Restam apenas <strong class="text-white font-bold">${full} unidades</strong> no depósito central</span>
            </span>
          </div>

          <!-- Linha 2: Título do Alerta e Badge de Quantidade -->
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-base sm:text-lg font-black text-white tracking-tight">
              Estoque de água requer reposição em breve
            </h3>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950/90 text-amber-200 border border-amber-600/60 shadow-sm">
              ${full} un restantes
            </span>
          </div>

          <!-- Linha 3: Métricas de Lote Ideal e Consumo Previsto -->
          <div class="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
            <span class="flex items-center text-cyan-300 font-semibold">
              <i data-lucide="boxes" class="w-4 h-4 mr-1 text-cyan-400"></i>
              Lote ideal de reposição: <strong class="text-white ml-1 font-bold">${refillBatch} galões</strong>
            </span>
            <span class="text-slate-600 font-bold">•</span>
            <span class="flex items-center text-amber-300 font-semibold">
              <i data-lucide="trending-up" class="w-4 h-4 mr-1 text-amber-400"></i>
              Consumo previsto (48h): <strong class="text-white ml-1 font-bold">${analytics.reservedNext2Days} unidades</strong>
            </span>
          </div>

          <!-- Linha 4: Nível de Reserva no Complexo e Barra de Progresso Âmbar -->
          <div class="space-y-1 pt-1.5 max-w-xl">
            <div class="flex justify-between items-center text-[11px] font-semibold text-slate-400">
              <span>Nível de Reserva no Complexo: <strong class="text-amber-400 font-bold">${reservePercent}% (Mínimo)</strong></span>
              <span>Capacidade Ideal: <strong class="text-slate-200">${idealCapacity} un</strong></span>
            </div>
            <div class="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
              <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-sm" style="width: ${Math.max(2, reservePercent)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botões de Ação do Banner: Fazer Pedido e Ver Registro -->
      <div class="flex flex-row items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end">
        <button type="button" onclick="openAddWaterSupplyModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5">
          <i data-lucide="plus-circle" class="w-4 h-4"></i>
          <span>+ Fazer Pedido</span>
        </button>
        <button type="button" onclick="state.adminTab='bar_control'; state.barSubTab='water'; renderApp();" class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer">
          Ver Registro
        </button>
      </div>
    </div>
  `;
}
window.renderWaterSupplyDashboardBanner = renderWaterSupplyDashboardBanner;

function checkAndShowWaterSupplyLoginNotice(force = false) {
  const analytics = getWaterSupplyAnalytics();
  const user = state.currentUser;
  if (!user || !user.authenticated) return;

  const isBarOrAdmin = user.role === 'Administrador Geral' ||
                       user.role === 'Gerente do Sistema' ||
                       user.role === 'Recepção & Atendimento' ||
                       (user.permissions && user.permissions.includes('can_manage_bar'));

  if (!isBarOrAdmin && !force) return;

  // Quando o estoque estiver completo/seguro, não exibe aviso na tela
  if (!analytics.needsRefill) {
    return;
  }

  showToastNotification(`
    <div class="space-y-1.5">
      <div class="flex items-center space-x-1.5 font-black text-rose-300 uppercase tracking-wider text-[11px]">
        <span>💧 Alerta de Reposição de Água Liberado!</span>
      </div>
      <p class="text-slate-200 text-xs">
        Estoque cheias em <strong>${analytics.full} un</strong> (gatilho mínimo: < ${analytics.minAlert} un) ou ${analytics.empty} vazias aguardando reposição.
      </p>
      <div class="pt-1 flex items-center justify-between text-[11px]">
        ${analytics.totalSupplyCostPending > 0 ? `<span class="text-amber-400 font-bold">Falta Pagar Fornecedor: R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')}</span>` : '<span class="text-emerald-400 font-bold">✓ Fornecedor Quitado</span>'}
        <button onclick="state.adminTab='bar_control'; state.barSubTab='water'; renderApp();" class="text-cyan-300 underline font-extrabold hover:text-white">Ver Registro</button>
      </div>
    </div>
  `, 9500);
}
window.checkAndShowWaterSupplyLoginNotice = checkAndShowWaterSupplyLoginNotice;

function getCourtWaterState(courtId) {
  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [] };
  }
  if (!state.waterSupply.courts) state.waterSupply.courts = {};
  if (!state.waterSupply.courts[courtId]) {
    state.waterSupply.courts[courtId] = { available: 0, capacity: 4, consumedToday: 0 };
  }
  return state.waterSupply.courts[courtId];
}
window.getCourtWaterState = getCourtWaterState;

function setWaterSubTab(tab) {
  state.waterSubTab = tab;
  renderStepContent();
  lucide.createIcons();
}
window.setWaterSubTab = setWaterSubTab;

async function courtBottleEmptied(courtId) {
  const cw = getCourtWaterState(courtId);
  const court = (state.courts || []).find(c => c.id === courtId) || { name: 'Campo' };

  if (cw.available <= 0) {
    alert(`O ${court.name} já está sem galões cheios disponíveis no momento.`);
    return;
  }

  cw.available = Math.max(0, cw.available - 1);
  cw.consumedToday = (cw.consumedToday || 0) + 1;
  state.waterSupply.empty = (state.waterSupply.empty || 0) + 1;

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'esvaziou',
    qtd: 1,
    court_id: courtId,
    court_name: court.name,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador',
    notes: `1 galão esvaziou no ${court.name} (Disponíveis agora: ${cw.available}/${cw.capacity || 4})`
  });

  await saveWaterSupplyToDatabase();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-amber-300 uppercase text-[11px]">💧 1 Galão Esvaziou no ${court.name}</div>
      <p class="text-xs text-white">Adicionado aos vazios p/ encher (Total vazios: ${state.waterSupply.empty} un | No campo: ${cw.available} un).</p>
    </div>
  `, 4000);
}
window.courtBottleEmptied = courtBottleEmptied;

function recalcWaterOrderTotal() {
  const qtyInput = document.getElementById('waterOrderQty');
  const priceInput = document.getElementById('waterOrderUnitPrice');
  const displayTotal = document.getElementById('waterOrderTotalDisplay');
  const calcDetail = document.getElementById('waterOrderCalcDetail');
  if (!qtyInput || !priceInput || !displayTotal) return;

  const qty = parseInt(qtyInput.value || '0', 10) || 0;
  const unitPrice = parseFloat(priceInput.value || '0') || 0;
  const total = qty * unitPrice;

  displayTotal.innerText = 'R$ ' + total.toFixed(2).replace('.', ',');
  if (calcDetail) {
    calcDetail.innerText = `${qty} un × R$ ${unitPrice.toFixed(2).replace('.', ',')}`;
  }
}
window.recalcWaterOrderTotal = recalcWaterOrderTotal;

function setWaterOrderPreset(qty, unitPrice = null) {
  const qtyInput = document.getElementById('waterOrderQty');
  const priceInput = document.getElementById('waterOrderUnitPrice');
  if (qtyInput) qtyInput.value = qty;
  if (unitPrice !== null && priceInput) priceInput.value = Number(unitPrice).toFixed(2);
  recalcWaterOrderTotal();
}
window.setWaterOrderPreset = setWaterOrderPreset;

function setWaterCourtFilter(filter) {
  state.waterCourtFilter = filter;
  renderStepContent();
  lucide.createIcons();
}
window.setWaterCourtFilter = setWaterCourtFilter;

function renderWaterSupplySection(analytics) {
  const isRecep = isReceptionUser();
  const currentCourtFilter = state.waterCourtFilter || 'all';
  const currentSubTab = state.waterSubTab || 'courts';
  const history = (state.waterSupply && Array.isArray(state.waterSupply.history)) ? state.waterSupply.history.slice(-20).reverse() : [];
  const orders = (state.waterSupply && Array.isArray(state.waterSupply.orders)) ? state.waterSupply.orders.slice().reverse() : [];

  // Filtragem dos jogos com água
  let filteredBookings = analytics.upcomingWaterBookings || [];
  if (currentCourtFilter === 'unreleased') {
    filteredBookings = filteredBookings.filter(b => !b.isReleased);
  } else if (currentCourtFilter === 'pending_pay') {
    filteredBookings = filteredBookings.filter(b => !b.isPaid);
  } else if (currentCourtFilter === 'paid') {
    filteredBookings = filteredBookings.filter(b => b.isPaid);
  } else if (currentCourtFilter === 'released') {
    filteredBookings = filteredBookings.filter(b => b.isReleased);
  }

  // Cards de cada quadra/campo
  const courts = state.courts || [];
  const courtCardsHtml = courts.map(court => {
    const cw = getCourtWaterState(court.id);
    const cap = cw.capacity || 4;
    const avail = Math.max(0, cw.available || 0);
    const isFull = avail >= cap;
    const isCritical = avail === 0;
    const pct = Math.min(100, Math.round((avail / cap) * 100));

    // Garrafas visuais (cheia: gota ciano | vazia: círculo pontilhado)
    let bottlesHtml = '';
    for (let i = 1; i <= cap; i++) {
      if (i <= avail) {
        bottlesHtml += `
          <div class="w-8 h-10 rounded-xl bg-cyan-100/90 border border-cyan-300 flex items-center justify-center text-base text-cyan-700 shadow-xs" title="Galão ${i}: Cheio e disponível no campo">
            💧
          </div>
        `;
      } else {
        bottlesHtml += `
          <div class="w-8 h-10 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400" title="Galão ${i}: Vazio / Aguardando reposição">
            ○
          </div>
        `;
      }
    }

    const statusBadge = isFull 
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">✓ ESTOQUE OK</span>`
      : (isCritical 
          ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">🚨 SEM ÁGUA</span>`
          : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">⚠️ ATENÇÃO</span>`);

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
        <!-- Top header do card da quadra -->
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 class="font-black text-slate-900 text-sm flex items-center space-x-1.5">
              <span>🏟️</span>
              <span>${court.name}</span>
            </h4>
            <span class="text-[11px] text-slate-500 font-medium mt-0.5 block">Capacidade ideal: ${cap} galões</span>
          </div>
          ${statusBadge}
        </div>

        <!-- Meio: Contagem e Garrafas Visuais -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 font-bold">Galões Disponíveis:</span>
            <span class="text-sm font-black text-slate-900">${avail} / ${cap}</span>
          </div>

          <!-- Garrafas visuais -->
          <div class="flex items-center space-x-2">
            ${bottlesHtml}
          </div>

          <!-- Barra de Progresso de Capacidade -->
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full ${isFull ? 'bg-emerald-500' : (isCritical ? 'bg-rose-500' : 'bg-cyan-500')} transition-all duration-300" style="width: ${pct}%"></div>
          </div>

          <!-- Consumidos hoje -->
          <div class="flex items-center justify-between text-[11px] pt-1 text-slate-500">
            <span class="flex items-center space-x-1 font-medium">
              <span>🔥</span>
              <span>Consumidos hoje:</span>
            </span>
            <strong class="font-black text-slate-800">${cw.consumedToday || 0} galões</strong>
          </div>
        </div>

        <!-- Botões de Ação na Quadra -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button onclick="courtBottleEmptied('${court.id}')" 
                  class="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-black border border-amber-200 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  title="Registrar que 1 galão acabou neste campo">
            <i data-lucide="arrow-down-circle" class="w-3.5 h-3.5 text-amber-700"></i>
            <span>↓ Galão Esvaziou</span>
          </button>
          <button onclick="openRefillCourtModal('${court.id}')" 
                  class="px-2.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  title="Enviar galões cheios do depósito central para esta quadra">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
            <span>+ Repor Água</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      
      <!-- Cabeçalho Principal da Seção (Inspirado na Imagem 1) -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <i data-lucide="droplets" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase text-slate-900 flex items-center space-x-2">
                <span>Controle de Água da Arena Limoeiro</span>
              </h3>
              <p class="text-xs text-slate-500">Visão Geral em Tempo Real • Atualizado dinamicamente</p>
            </div>
          </div>
        </div>

        <!-- Ações Rápidas de Topo (Grid 2 colunas no mobile, 3 no tablet, flex no desktop) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
          <button onclick="openNewWaterOrderModal()" class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 lg:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer">
            <i data-lucide="plus" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">+ Novo Pedido</span>
          </button>
          <button onclick="openPaySupplierModal()" class="w-full lg:w-auto justify-center text-center px-3 sm:px-3.5 py-2.5 lg:py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer">
            <i data-lucide="receipt" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">🧾 Pagar Forn.</span>
          </button>
          <button onclick="openRefillCourtModal()" class="w-full lg:w-auto justify-center text-center px-3 sm:px-3.5 py-2.5 lg:py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer">
            <i data-lucide="truck" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">⚡ Repor Campo</span>
          </button>
          <button onclick="openFixedWaterGallonsModal()" class="w-full lg:w-auto justify-center text-center px-3 sm:px-3.5 py-2.5 lg:py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer" title="Destinar galão fixo para pessoas cadastradas">
            <i data-lucide="user-check" class="w-4 h-4 shrink-0"></i>
            <span class="truncate">👤 Galão Fixo ${analytics.totalFixedGallons > 0 ? `<span class="bg-white/25 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">${analytics.totalFixedGallons}</span>` : ''}</span>
          </button>
          <button onclick="openWaterReportModal()" class="w-full lg:w-auto justify-center text-center px-3 sm:px-3.5 py-2.5 lg:py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer">
            <i data-lucide="bar-chart-3" class="w-4 h-4 text-cyan-400 shrink-0"></i>
            <span class="truncate">📊 Relatório</span>
          </button>
          ${!isRecep ? `
          <button onclick="openAdjustWaterSupplyModal()" class="w-full lg:w-auto justify-center text-center px-3 py-2.5 lg:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center space-x-1.5" title="Ajuste de Estoque, Preço e Gatilho Mínimo">
            <i data-lucide="sliders" class="w-4 h-4 shrink-0"></i>
            <span class="lg:hidden text-xs font-bold">⚙️ Ajustes</span>
          </button>
          ` : ''}
        </div>
      </div>

      <!-- 5 CARDS DE KPIS EM TEMPO REAL (Inspirado na Imagem 1) -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        <!-- KPI 1: Estoque Cheio -->
        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 border border-cyan-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-black uppercase text-cyan-800 tracking-wider">Estoque Cheio</span>
            <span class="p-1 rounded-lg bg-cyan-200/60 text-cyan-800"><i data-lucide="box" class="w-3.5 h-3.5"></i></span>
          </div>
          <div class="text-2xl font-black text-cyan-950">${analytics.full} un</div>
          <p class="text-[10px] text-cyan-700 font-medium mt-0.5">
            ${analytics.totalFixedGallons > 0 
              ? `<strong class="text-slate-900">${analytics.availableForCourts} p/ campos</strong> • <span class="text-indigo-800 font-bold">${analytics.totalFixedGallons} fixo(s)</span>`
              : 'No depósito central'}
          </p>
        </div>

        <!-- KPI 2: Vazios p/ Encher -->
        <div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-black uppercase text-amber-800 tracking-wider">Vazios p/ Encher</span>
            <span class="p-1 rounded-lg bg-amber-200/60 text-amber-800"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i></span>
          </div>
          <div class="text-2xl font-black ${analytics.empty >= 4 ? 'text-rose-700' : 'text-amber-950'}">${analytics.empty} un</div>
          <p class="text-[10px] text-amber-700 font-medium mt-0.5">
            ${analytics.empty >= 4 ? '✓ Baixa de 4 un atingida' : `Faltam ${analytics.emptyRemainingForRefill} un p/ lote de 4`}
          </p>
        </div>

        <!-- KPI 3: Em Uso nos Campos -->
        <div class="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Em Uso nos Campos</span>
            <span class="p-1 rounded-lg bg-emerald-200/60 text-emerald-800"><i data-lucide="shield" class="w-3.5 h-3.5"></i></span>
          </div>
          <div class="text-2xl font-black text-emerald-950">${analytics.totalInCourts} un</div>
          <p class="text-[10px] text-emerald-700 font-medium mt-0.5">Nas ${courts.length} quadras ativas</p>
        </div>

        <!-- KPI 4: Falta Quitar (Fornecedor à vista) -->
        <div class="bg-gradient-to-br ${analytics.totalSupplyCostPending > 0 ? 'from-rose-50 to-pink-50 border-rose-200' : 'from-slate-50 to-slate-100 border-slate-200'} rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-black uppercase ${analytics.totalSupplyCostPending > 0 ? 'text-rose-800' : 'text-slate-600'} tracking-wider">Falta Quitar</span>
            <span class="p-1 rounded-lg ${analytics.totalSupplyCostPending > 0 ? 'bg-rose-200/60 text-rose-800' : 'bg-slate-200 text-slate-700'}"><i data-lucide="receipt" class="w-3.5 h-3.5"></i></span>
          </div>
          <div class="text-2xl font-black ${analytics.totalSupplyCostPending > 0 ? 'text-rose-700' : 'text-slate-900'}">
            R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')}
          </div>
          <p class="text-[10px] ${analytics.totalSupplyCostPending > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'} mt-0.5">
            ${analytics.totalSupplyCostPending > 0 ? 'A pagar à vista (Pix/Dinheiro)' : 'Sem pendências'}
          </p>
        </div>

        <!-- KPI 5: Status do Pedido -->
        <div class="col-span-2 md:col-span-1 bg-gradient-to-br ${analytics.needsRefill ? 'from-amber-50 to-rose-50 border-amber-300 animate-pulse' : 'from-emerald-50 to-slate-50 border-emerald-200'} rounded-2xl p-4 shadow-xs">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-black uppercase ${analytics.needsRefill ? 'text-rose-800' : 'text-emerald-800'} tracking-wider">Status Pedido</span>
            <span class="p-1 rounded-lg ${analytics.needsRefill ? 'bg-rose-200/60 text-rose-800' : 'bg-emerald-200/60 text-emerald-800'}"><i data-lucide="${analytics.needsRefill ? 'alert-circle' : 'check-circle'}" class="w-3.5 h-3.5"></i></span>
          </div>
          <div class="text-2xl font-black ${analytics.needsRefill ? 'text-rose-950' : 'text-emerald-950'}">
            ${analytics.needsRefill ? 'PEDIR AGORA' : 'ESTOQUE OK'}
          </div>
          <p class="text-[10px] ${analytics.needsRefill ? 'text-rose-700 font-bold' : 'text-emerald-700'} mt-0.5">
            ${analytics.refillNeededCount > 0 ? `Lote sugerido: ${analytics.refillNeededCount} un` : 'Consumo sob controle'}
          </p>
        </div>

      </div>

      <!-- SUB-NAVEGAÇÃO POR ABAS PILL (Grid 3 colunas no mobile, flex no tablet/desktop) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div class="grid grid-cols-3 sm:flex items-center gap-1 sm:space-x-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button onclick="setWaterSubTab('courts')" 
                  class="w-full sm:w-auto text-center justify-center px-1.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${currentSubTab === 'courts' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
            <span class="truncate">⚽ Campos</span>
          </button>
          <button onclick="setWaterSubTab('suppliers')" 
                  class="w-full sm:w-auto text-center justify-center px-1.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${currentSubTab === 'suppliers' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
            <span class="truncate">🚚 Finanças</span> ${analytics.totalSupplyCostPending > 0 ? `<span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900 font-black">!</span>` : ''}
          </button>
          <button onclick="setWaterSubTab('history')" 
                  class="w-full sm:w-auto text-center justify-center px-1.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${currentSubTab === 'history' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
            <span class="truncate">🕒 Histórico</span>
          </button>
        </div>

        <div class="text-xs text-slate-500 font-medium">
          ${currentSubTab === 'courts' ? `Visualizando <strong>${courts.length} quadras</strong> com monitoramento ativo` : ''}
          ${currentSubTab === 'suppliers' ? `Preço unitário configurado: <strong>R$ ${analytics.unitPrice.toFixed(2).replace('.', ',')}</strong> / un` : ''}
          ${currentSubTab === 'history' ? `Últimas <strong>${history.length} movimentações</strong> registradas` : ''}
        </div>
      </div>

      <!-- CONTEÚDO DA ABA 1: CAMPOS E QUADRAS (Inspirado na Imagem 3) -->
      ${currentSubTab === 'courts' ? `
        <div class="space-y-6">
          
          <!-- Grid dos Cards de Quadras -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-2">
                <span>🏟️</span>
                <span>Status de Água por Quadra (${courts.length})</span>
              </h4>
              <button onclick="openRefillCourtModal()" class="text-xs font-bold text-cyan-700 hover:underline flex items-center space-x-1 cursor-pointer">
                <span>+ Enviar Água para Quadra</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${courtCardsHtml}
            </div>
          </div>

          <!-- Seção de Agendamentos & Liberação de Água nos Jogos -->
          <div class="space-y-4 pt-4 border-t border-slate-100">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 class="text-sm font-black text-slate-800 flex items-center space-x-2 uppercase">
                  <i data-lucide="clipboard-check" class="w-4 h-4 text-emerald-600"></i>
                  <span>Controle de Jogos & Liberação de Água (${analytics.upcomingWaterBookings.length})</span>
                </h4>
                <p class="text-xs text-slate-500 mt-0.5">Gerencie a liberação de água nos campos e confirme a entrega das garrafas em cada partida.</p>
              </div>

              <!-- Filtros Rápidos de Quadra / Liberação -->
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                <button onclick="setWaterCourtFilter('all')" 
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentCourtFilter === 'all' ? 'bg-slate-900 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                  Todos (${analytics.upcomingWaterBookings.length})
                </button>
                <button onclick="setWaterCourtFilter('unreleased')" 
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentCourtFilter === 'unreleased' ? 'bg-cyan-700 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                  ⏳ Aguardando (${analytics.unreleasedWaterBookingsCount})
                </button>
                <button onclick="setWaterCourtFilter('released')" 
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentCourtFilter === 'released' ? 'bg-slate-900 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                  🚀 Liberadas no Campo
                </button>
              </div>
            </div>

            ${filteredBookings.length === 0 ? `
              <div class="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i data-lucide="check" class="w-7 h-7 text-emerald-500 mx-auto mb-1.5"></i>
                <p class="text-xs font-bold text-slate-700">Nenhum agendamento neste filtro</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Todas as águas dos jogos selecionados já foram atendidas.</p>
              </div>
            ` : `
              <div class="overflow-x-auto rounded-2xl border border-slate-200">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th class="p-3">Data / Horário</th>
                      <th class="p-3">Campo / Espaço</th>
                      <th class="p-3">Atleta / Contato</th>
                      <th class="p-3 text-center">Águas no Campo</th>
                      <th class="p-3 text-center">Status no Campo</th>
                      <th class="p-3 text-right">Ação de Liberação</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${filteredBookings.map(b => {
                      return `
                        <tr class="hover:bg-slate-50/80 transition-all ${b.isNext2Days ? 'bg-amber-50/20' : ''}">
                          <td class="p-3">
                            <div class="font-black text-slate-900">${b.date}</div>
                            <div class="text-[11px] text-slate-500">${b.time}</div>
                            ${b.isNext2Days ? `<span class="inline-block mt-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Próximos 2 dias</span>` : ''}
                          </td>
                          <td class="p-3">
                            <span class="font-bold text-slate-800 block">🏟️ ${b.courtName}</span>
                            <span class="text-[10px] text-slate-400 font-mono">#${b.bookingId}</span>
                          </td>
                          <td class="p-3">
                            <div class="font-bold text-slate-900">${b.customerName}</div>
                            <div class="text-[11px] text-slate-500 font-mono">${b.customerPhone}</div>
                          </td>
                          <td class="p-3 text-center">
                            <div class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-cyan-100 text-cyan-950 border border-cyan-200">
                              💧 ${b.waterQty} un
                            </div>
                            <div class="text-[10px] font-bold text-cyan-700 mt-1">Incluso no Jogo</div>
                          </td>
                          <td class="p-3 text-center">
                            ${b.isReleased ? `
                              <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                🚀 Liberada no Campo
                              </span>
                            ` : `
                              <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                ⏳ Pendente
                              </span>
                            `}
                          </td>
                          <td class="p-3 text-right">
                            ${!b.isReleased ? `
                              <button onclick="releaseWaterForCourt('${b.bookingId}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black shadow transition-all cursor-pointer inline-flex items-center space-x-1" title="Liberar e dar baixa de ${b.waterQty || 4} águas no estoque">
                                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                                <span>Liberar (${b.waterQty || 4} Águas)</span>
                              </button>
                            ` : `
                              <div class="flex items-center justify-end space-x-1">
                                <span class="text-emerald-700 font-bold text-xs">✓ Entregue (${b.waterQty || 4} un)</span>
                              </div>
                            `}
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
      ` : ''}

      <!-- CONTEÚDO DA ABA 2: FORNECEDOR & FINANÇAS (Inspirado nas Imagens 2 e 4) -->
      ${currentSubTab === 'suppliers' ? `
        <div class="space-y-6">
          
          <!-- Resumo Financeiro do Fornecedor -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span class="text-[10px] font-black uppercase text-slate-600 block mb-1">📦 Total Comprado</span>
              <div class="text-xl sm:text-2xl font-black text-slate-900">${analytics.totalWaterSuppliedQty} un</div>
              <p class="text-[10px] text-slate-500 font-medium mt-0.5">Garrafas e galões</p>
            </div>

            <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <span class="text-[10px] font-black uppercase text-emerald-800 block mb-1">✓ Fornecedor Quitado</span>
              <div class="text-xl sm:text-2xl font-black text-emerald-950">R$ ${analytics.totalSupplyCostPaid.toFixed(2).replace('.', ',')}</div>
              <p class="text-[10px] text-emerald-700 font-medium mt-0.5">Pago via Pix ou Dinheiro</p>
            </div>

            <div class="bg-gradient-to-br ${analytics.totalSupplyCostPending > 0 ? 'from-amber-50 to-rose-50 border-amber-300' : 'from-slate-50 to-slate-100 border-slate-200'} rounded-2xl p-4 shadow-xs">
              <span class="text-[10px] font-black uppercase ${analytics.totalSupplyCostPending > 0 ? 'text-amber-900' : 'text-slate-600'} block mb-1">
                ${analytics.totalSupplyCostPending > 0 ? '⏳ Pendência Fornecedor' : '✓ Tudo Quitado'}
              </span>
              <div class="text-xl sm:text-2xl font-black ${analytics.totalSupplyCostPending > 0 ? 'text-amber-700' : 'text-slate-800'}">
                R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')}
              </div>
              <p class="text-[10px] ${analytics.totalSupplyCostPending > 0 ? 'text-amber-800 font-bold' : 'text-slate-500'} font-medium mt-0.5">
                ${analytics.totalSupplyCostPending > 0 ? 'A pagar à vista (Pix/Dinheiro)' : 'Sem débitos pendentes'}
              </p>
            </div>

            <div class="bg-cyan-50/60 border border-cyan-200 rounded-2xl p-4 shadow-xs">
              <span class="text-[10px] font-black uppercase text-cyan-800 block mb-1">🏷️ Preço Unitário Padrão</span>
              <div class="text-xl sm:text-2xl font-black text-cyan-950">R$ ${analytics.unitPrice.toFixed(2).replace('.', ',')}</div>
              <p class="text-[10px] text-cyan-700 font-medium mt-0.5">Base configurada por garrafa</p>
            </div>

          </div>

          <!-- Ações e Lista de Pedidos ao Fornecedor -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black text-slate-800 uppercase flex items-center space-x-2">
                <i data-lucide="truck" class="w-4 h-4 text-cyan-600"></i>
                <span>Lotes e Pedidos de Água Registrados</span>
              </h4>
              <div class="flex items-center space-x-2">
                <button onclick="openNewWaterOrderModal()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow flex items-center space-x-1 cursor-pointer">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>+ Novo Pedido</span>
                </button>
                <button onclick="openPaySupplierModal()" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow flex items-center space-x-1 cursor-pointer">
                  <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                  <span>🧾 Pagar Fornecedor</span>
                </button>
              </div>
            </div>

            ${orders.length === 0 ? `
              <div class="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <i data-lucide="truck" class="w-8 h-8 text-slate-300 mx-auto"></i>
                <p class="text-xs font-bold text-slate-600">Nenhum pedido registrado ainda.</p>
                <p class="text-[11px] text-slate-400">Clique em "+ Novo Pedido" para registrar 12 garrafas de 5L com cálculo automático.</p>
              </div>
            ` : `
              <div class="space-y-2">
                ${orders.map(o => {
                  const isPending = o.payment_status === 'pending';
                  const rem = Math.max(0, (o.total || 0) - (o.paid_amount || 0));
                  return `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-3">
                      <div class="flex items-start sm:items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                          <i data-lucide="droplets" class="w-5 h-5"></i>
                        </div>
                        <div>
                          <div class="font-black text-slate-900 flex items-center space-x-2">
                            <span>${o.description || 'Distribuidora de Água'}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-black ${isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}">
                              ${isPending ? '⏳ A Pagar à Vista' : '✓ Quitado'}
                            </span>
                          </div>
                          <div class="text-[11px] text-slate-500 mt-0.5">
                            <strong>${o.qty} un</strong> × R$ ${(o.unit_price || 5).toFixed(2).replace('.', ',')} = <strong class="text-slate-900 font-black">R$ ${(o.total || 0).toFixed(2).replace('.', ',')}</strong>
                            ${o.delivery_date ? ` • Entrega: ${o.delivery_date}` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <div class="text-right">
                          <div class="font-black text-sm ${isPending ? 'text-amber-700' : 'text-emerald-700'}">
                            ${isPending ? `Falta: R$ ${rem.toFixed(2).replace('.', ',')}` : `Total Pago: R$ ${(o.total || 0).toFixed(2).replace('.', ',')}`}
                          </div>
                          <div class="text-[10px] text-slate-400">
                            ${isPending ? 'Pix ou Dinheiro à vista' : (o.payment_method || 'Pix à Vista')}
                          </div>
                        </div>
                        ${isPending ? `
                          <button onclick="openPaySupplierModal('${o.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer flex items-center space-x-1">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>Pagar</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

        </div>
      ` : ''}

      <!-- CONTEÚDO DA ABA 3: HISTÓRICO GERAL -->
      ${currentSubTab === 'history' ? `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-black text-slate-800 flex items-center space-x-2 uppercase">
              <i data-lucide="history" class="w-4 h-4 text-slate-500"></i>
              <span>Histórico de Abastecimentos, Consumo e Pagamentos (${history.length})</span>
            </h4>
            <span class="text-[11px] text-slate-500 font-bold">Total abastecido: ${analytics.totalWaterSuppliedQty} águas</span>
          </div>

          ${history.length === 0 ? `
            <p class="text-xs text-slate-400 italic">Nenhum registro de abastecimento ou consumo anterior.</p>
          ` : `
            <div class="space-y-2">
              ${history.map((item, idx) => {
                const isAbast = item.type === 'abastecimento';
                const isRepor = item.type === 'repor_campo';
                const isEsvaz = item.type === 'esvaziou';
                const isPay = item.type === 'pagamento_fornecedor';
                const isPendingCost = item.payment_status === 'pending';
                const dateDisplay = item.date ? new Date(item.date).toLocaleString('pt-BR') : '';
                const realIdx = (state.waterSupply.history || []).indexOf(item);

                return `
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs gap-3">
                    <div class="flex items-start sm:items-center space-x-3">
                      <span class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${isAbast ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : (isRepor ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : (isEsvaz ? 'bg-amber-100 text-amber-700 border border-amber-200' : (isPay ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-200 text-slate-700')))}">
                        <i data-lucide="${isAbast ? 'plus' : (isRepor ? 'truck' : (isEsvaz ? 'rotate-ccw' : (isPay ? 'receipt' : 'sliders')))}" class="w-4 h-4"></i>
                      </span>
                      <div>
                        <div class="font-black text-slate-900 flex items-center space-x-2">
                          <span>
                            ${isAbast ? `Abastecimento: +${item.qtd} águas cheias` : (isRepor ? `Envio para Quadra: ${item.qtd} galões (${item.court_name || 'Campo'})` : (isEsvaz ? `Consumo: ${item.qtd} galão esvaziado (${item.court_name || 'Campo'})` : (isPay ? `Pagamento de R$ ${Number(item.amount || 0).toFixed(2).replace('.', ',')} ao Fornecedor` : `Ajuste manual de estoque`)))}
                          </span>
                          ${isAbast && item.cost ? `<span class="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">Total: R$ ${Number(item.cost).toFixed(2).replace('.', ',')}</span>` : ''}
                        </div>
                        <div class="text-[11px] text-slate-500 mt-0.5">
                          ${item.supplier ? `Fornecedor: <strong>${item.supplier}</strong> • ` : ''}
                          ${item.notes ? `${item.notes} • ` : ''}Por: <strong>${item.user || 'Operador'}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      ${isAbast && item.cost ? `
                        <div class="text-right">
                          ${isPendingCost ? `
                            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 block">
                              ⏳ Pendência Fornecedor
                            </span>
                            <span class="text-[9px] text-amber-800 font-bold block mt-0.5">A pagar à vista (Pix/Dinheiro)</span>
                            ${realIdx !== -1 ? `
                              <button onclick="settleSupplierPayment(${realIdx})" class="block mt-1 text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer">
                                Pagar à Vista
                              </button>
                            ` : ''}
                          ` : `
                            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ✓ Quitado (${item.payment_method || 'Pix à Vista'})
                            </span>
                          `}
                        </div>
                      ` : ''}
                      <div class="text-right text-[11px] text-slate-400 font-mono">
                        ${dateDisplay}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      ` : ''}

    </div>
  `;
}
window.renderWaterSupplySection = renderWaterSupplySection;

function openNewWaterOrderModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const currentUnitPrice = (state.waterSupply && typeof state.waterSupply.unit_price === 'number') 
    ? state.waterSupply.unit_price 
    : 5.00;
  const initialQty = 12; // Preset solicitado pelo usuário (12 garrafas de 5L)
  const initialTotal = initialQty * currentUnitPrice;
  const todayDateStr = new Date().toISOString().split('T')[0];

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <i data-lucide="truck" class="w-5 h-5 text-emerald-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Registrar Novo Pedido de Água</h3>
              <p class="text-xs text-emerald-200 font-medium">Entrada de estoque e contas a pagar ao fornecedor</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleNewWaterOrderSubmit(event)" class="p-6 space-y-4 overflow-y-auto" autocomplete="off">
          
          <!-- Atalhos rápidos de pedido -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Atalhos de Lotes Rápidos</label>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" onclick="setWaterOrderPreset(12)" class="px-2.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-200 text-xs font-black transition-all flex flex-col items-center cursor-pointer">
                <span>⚡ 12 Garrafas (5L)</span>
                <span class="text-[10px] text-cyan-700 font-bold">Lote Recomendado</span>
              </button>
              <button type="button" onclick="setWaterOrderPreset(4)" class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex flex-col items-center cursor-pointer">
                <span>4 Garrafas</span>
                <span class="text-[10px] text-slate-500">Lote de Baixa</span>
              </button>
              <button type="button" onclick="setWaterOrderPreset(20)" class="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex flex-col items-center cursor-pointer">
                <span>20 Garrafas</span>
                <span class="text-[10px] text-slate-500">Lote Completo</span>
              </button>
            </div>
          </div>

          <!-- Campos Quantidade e Preço Unitário -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Quantidade de Garrafas *</label>
              <input type="number" id="waterOrderQty" required min="1" max="1000" value="${initialQty}" oninput="recalcWaterOrderTotal()"
                     class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Unitário por Garrafa (R$) *</label>
              <input type="number" id="waterOrderUnitPrice" step="0.10" min="0" value="${currentUnitPrice.toFixed(2)}" oninput="recalcWaterOrderTotal()"
                     class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <!-- Box de Total Calculado em Tempo Real -->
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black uppercase text-emerald-800 block">Total Previsto da Compra</span>
              <div class="text-2xl font-black text-emerald-950" id="waterOrderTotalDisplay">R$ ${initialTotal.toFixed(2).replace('.', ',')}</div>
              <span class="text-[11px] text-emerald-700 font-medium" id="waterOrderCalcDetail">${initialQty} un × R$ ${currentUnitPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-black text-xl">
              💰
            </div>
          </div>

          <!-- Fornecedor & Data -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Fornecedor / Distribuidora</label>
              <input type="text" id="waterOrderSupplier" value="Distribuidora de Água Indaiá" placeholder="Ex: Distribuidora São Geraldo / Indaiá" 
                     class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Data da Entrega / Pedido</label>
              <input type="date" id="waterOrderDeliveryDate" value="${todayDateStr}"
                     class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none">
            </div>
          </div>

          <!-- Status do Pagamento (A vista pix/dinheiro ou pendente) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Status do Pagamento *</label>
              <select id="waterOrderPaymentStatus" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white">
                <option value="pending">⏳ Pendência Fornecedor: A Pagar à Vista</option>
                <option value="paid">✓ Já foi Pago à Vista (Pix da Arena ou Dinheiro)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Forma de Pagamento (À Vista)</label>
              <select id="waterOrderPaymentMethod" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white">
                <option value="Pix à Vista">Pix à Vista (da Arena)</option>
                <option value="Dinheiro à Vista">Dinheiro à Vista em Espécie</option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          <!-- Opções de Entrada de Estoque -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" id="waterOrderDirectToStock" checked class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500">
              <span class="font-bold text-slate-800">Entrada imediata no depósito central (+ garrafas cheias)</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" id="waterOrderDeductEmpties" checked class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500">
              <span class="font-medium text-slate-700">Dar baixa nas garrafas vazias devolvidas para o fornecedor</span>
            </label>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Observações Adicionais</label>
            <input type="text" id="waterOrderNotes" placeholder="Ex: 12 garrafas de 5L entregues no depósito principal" 
                   class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-600 focus:outline-none">
          </div>

          <div class="pt-2 flex items-center justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" id="btnSubmitWaterOrder" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Confirmar Pedido / Entrada</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openNewWaterOrderModal = openNewWaterOrderModal;
window.openAddWaterSupplyModal = openNewWaterOrderModal;

async function handleNewWaterOrderSubmit(event) {
  event.preventDefault();
  const qtyInput = document.getElementById('waterOrderQty');
  const priceInput = document.getElementById('waterOrderUnitPrice');
  const supplierInput = document.getElementById('waterOrderSupplier');
  const dateInput = document.getElementById('waterOrderDeliveryDate');
  const statusSelect = document.getElementById('waterOrderPaymentStatus');
  const methodSelect = document.getElementById('waterOrderPaymentMethod');
  const directStockCheck = document.getElementById('waterOrderDirectToStock');
  const deductEmptiesCheck = document.getElementById('waterOrderDeductEmpties');
  const notesInput = document.getElementById('waterOrderNotes');
  const btn = document.getElementById('btnSubmitWaterOrder');

  const qty = parseInt(qtyInput ? qtyInput.value : '0', 10);
  const unitPrice = parseFloat(priceInput ? priceInput.value : '0') || 5.00;
  const totalCost = qty * unitPrice;
  const supplier = (supplierInput && supplierInput.value) ? supplierInput.value.trim() : 'Distribuidora';
  const deliveryDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
  const paymentStatus = statusSelect ? statusSelect.value : 'pending';
  const paymentMethod = methodSelect ? methodSelect.value : 'Pix à Vista';
  const directToStock = directStockCheck ? directStockCheck.checked : true;
  const deductEmpties = deductEmptiesCheck ? deductEmptiesCheck.checked : true;
  const notes = (notesInput && notesInput.value) ? notesInput.value.trim() : '';

  if (isNaN(qty) || qty <= 0) return;

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Gravando...';
  }

  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [] };
  }

  // Atualiza preço padrão configurado
  state.waterSupply.unit_price = unitPrice;

  // Entrada de estoque cheias e baixa de vazias
  if (directToStock) {
    state.waterSupply.full = (state.waterSupply.full || 0) + qty;
    if (deductEmpties) {
      state.waterSupply.empty = Math.max(0, (state.waterSupply.empty || 0) - qty);
    }
  }

  const orderId = 'ord-' + Date.now();
  if (!Array.isArray(state.waterSupply.orders)) state.waterSupply.orders = [];
  state.waterSupply.orders.push({
    id: orderId,
    description: supplier,
    qty: qty,
    unit_price: unitPrice,
    total: totalCost,
    paid_amount: (paymentStatus === 'paid' ? totalCost : 0),
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    delivery_date: deliveryDate,
    created_at: new Date().toISOString()
  });

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'abastecimento',
    order_id: orderId,
    qtd: qty,
    unit_price: unitPrice,
    cost: totalCost,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    supplier: supplier,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador',
    notes: notes || `Pedido de ${qty} garrafas (R$ ${unitPrice.toFixed(2).replace('.', ',')}/un = Total R$ ${totalCost.toFixed(2).replace('.', ',')})`
  });

  await saveWaterSupplyToDatabase();
  closeModal();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-emerald-300 uppercase text-[11px]">✓ Pedido de Água Registrado!</div>
      <p class="text-xs text-white">Lote de <strong>${qty} garrafas</strong> (Total: R$ ${totalCost.toFixed(2).replace('.', ',')}) adicionado com sucesso. ${paymentStatus === 'pending' ? 'Registrado em contas a pagar ao fornecedor.' : 'Marcado como pago à vista.'}</p>
    </div>
  `, 5000);
}
window.handleNewWaterOrderSubmit = handleNewWaterOrderSubmit;
window.handleAddWaterSupplySubmit = handleNewWaterOrderSubmit;

function openPaySupplierModal(selectedOrderId = '') {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const orders = (state.waterSupply && Array.isArray(state.waterSupply.orders)) ? state.waterSupply.orders : [];
  const pendingOrders = orders.filter(o => o.payment_status === 'pending');
  const analytics = getWaterSupplyAnalytics();

  const targetOrder = pendingOrders.find(o => o.id === selectedOrderId) || pendingOrders[0];
  const totalAmount = targetOrder ? targetOrder.total : analytics.totalSupplyCostPending;
  const paidAmount = targetOrder ? (targetOrder.paid_amount || 0) : 0;
  const remainingAmount = targetOrder ? Math.max(0, totalAmount - paidAmount) : analytics.totalSupplyCostPending;
  const todayDateStr = new Date().toISOString().split('T')[0];

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
              <i data-lucide="receipt" class="w-5 h-5 text-amber-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Registrar Pagamento Fornecedor</h3>
              <p class="text-xs text-amber-200 font-medium">Quitar ou abater valores devidos à distribuidora</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-amber-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handlePaySupplierSubmit(event)" class="p-6 space-y-4 overflow-y-auto" autocomplete="off">
          
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Pedido / Lote do Fornecedor *</label>
            <select id="paySupplierOrderSelect" onchange="updatePaySupplierOrderDisplay()" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white">
              ${pendingOrders.length > 0 ? `
                ${pendingOrders.map(o => `
                  <option value="${o.id}" ${targetOrder && targetOrder.id === o.id ? 'selected' : ''}>
                    ${o.description || 'Distribuidora'} - ${o.qty} un (Falta: R$ ${Math.max(0, o.total - (o.paid_amount || 0)).toFixed(2).replace('.', ',')})
                  </option>
                `).join('')}
                <option value="all">Todas as Pendências de Fornecedor (Total: R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')})</option>
              ` : `
                <option value="all">Pendência Geral de Fornecedor (R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')})</option>
              `}
            </select>
          </div>

          <!-- Box Resumo da Dívida (Inspirado na Imagem 4) -->
          <div class="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs" id="paySupplierSummaryBox">
            <div class="flex justify-between items-center">
              <span class="text-slate-600 font-bold">Total da Compra:</span>
              <strong class="text-slate-900 font-black">R$ ${totalAmount.toFixed(2).replace('.', ',')}</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-600 font-bold">Já Quitado:</span>
              <span class="text-emerald-700 font-black">R$ ${paidAmount.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="flex justify-between items-center pt-1.5 border-t border-amber-200">
              <span class="text-amber-900 font-black uppercase">Falta Quitar:</span>
              <strong class="text-base font-black text-amber-700">R$ ${remainingAmount.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor a Pagar Agora (R$) *</label>
            <input type="number" id="paySupplierAmount" step="0.50" min="0.50" max="${Math.max(0.50, remainingAmount)}" value="${remainingAmount.toFixed(2)}" required
                   class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Forma de Pagamento (À Vista) *</label>
              <select id="paySupplierMethod" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white">
                <option value="Pix à Vista">Pix à Vista (da Arena)</option>
                <option value="Dinheiro à Vista">Dinheiro à Vista em Espécie</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Data do Pagamento</label>
              <input type="date" id="paySupplierDate" value="${todayDateStr}"
                     class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cyan-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Comprovante / Observação</label>
            <input type="text" id="paySupplierNotes" placeholder="Ex: Chave Pix enviada no WhatsApp da distribuidora" 
                   class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-600 focus:outline-none">
          </div>

          <div class="pt-2 flex items-center justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" id="btnSubmitPaySupplier" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Confirmar Pagamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openPaySupplierModal = openPaySupplierModal;

function updatePaySupplierOrderDisplay() {
  const select = document.getElementById('paySupplierOrderSelect');
  const summaryBox = document.getElementById('paySupplierSummaryBox');
  const amountInput = document.getElementById('paySupplierAmount');
  if (!select || !summaryBox || !amountInput) return;

  const orders = (state.waterSupply && Array.isArray(state.waterSupply.orders)) ? state.waterSupply.orders : [];
  const analytics = getWaterSupplyAnalytics();

  if (select.value === 'all') {
    const total = analytics.totalSupplyCostPending;
    summaryBox.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-slate-600 font-bold">Pendência Total do Fornecedor:</span>
        <strong class="text-slate-900 font-black">R$ ${total.toFixed(2).replace('.', ',')}</strong>
      </div>
      <div class="flex justify-between items-center pt-1.5 border-t border-amber-200">
        <span class="text-amber-900 font-black uppercase">Falta Quitar:</span>
        <strong class="text-base font-black text-amber-700">R$ ${total.toFixed(2).replace('.', ',')}</strong>
      </div>
    `;
    amountInput.value = total.toFixed(2);
    amountInput.max = Math.max(0.50, total);
    return;
  }

  const order = orders.find(o => o.id === select.value);
  if (order) {
    const total = order.total || 0;
    const paid = order.paid_amount || 0;
    const rem = Math.max(0, total - paid);
    summaryBox.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-slate-600 font-bold">Total da Compra:</span>
        <strong class="text-slate-900 font-black">R$ ${total.toFixed(2).replace('.', ',')}</strong>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-600 font-bold">Já Quitado:</span>
        <span class="text-emerald-700 font-black">R$ ${paid.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="flex justify-between items-center pt-1.5 border-t border-amber-200">
        <span class="text-amber-900 font-black uppercase">Falta Quitar:</span>
        <strong class="text-base font-black text-amber-700">R$ ${rem.toFixed(2).replace('.', ',')}</strong>
      </div>
    `;
    amountInput.value = rem.toFixed(2);
    amountInput.max = Math.max(0.50, rem);
  }
}
window.updatePaySupplierOrderDisplay = updatePaySupplierOrderDisplay;

async function handlePaySupplierSubmit(event) {
  event.preventDefault();
  const select = document.getElementById('paySupplierOrderSelect');
  const amountInput = document.getElementById('paySupplierAmount');
  const methodSelect = document.getElementById('paySupplierMethod');
  const notesInput = document.getElementById('paySupplierNotes');
  const btn = document.getElementById('btnSubmitPaySupplier');

  const amount = parseFloat(amountInput ? amountInput.value : '0') || 0;
  const method = methodSelect ? methodSelect.value : 'Pix à Vista';
  const notes = notesInput ? notesInput.value.trim() : '';

  if (amount <= 0) return;

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Processando...';
  }

  const orderId = select ? select.value : 'all';
  const orders = (state.waterSupply && Array.isArray(state.waterSupply.orders)) ? state.waterSupply.orders : [];
  const history = (state.waterSupply && Array.isArray(state.waterSupply.history)) ? state.waterSupply.history : [];

  if (orderId === 'all') {
    orders.forEach(o => {
      o.paid_amount = o.total;
      o.payment_status = 'paid';
      o.payment_method = method;
      o.settled_at = new Date().toISOString();
    });
    history.forEach(h => {
      if (h.type === 'abastecimento' && h.payment_status === 'pending') {
        h.payment_status = 'paid';
        h.payment_method = method;
        h.settled_at = new Date().toISOString();
      }
    });
  } else {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.paid_amount = (order.paid_amount || 0) + amount;
      if (order.paid_amount >= (order.total || 0) - 0.05) {
        order.payment_status = 'paid';
      }
      order.payment_method = method;
      order.settled_at = new Date().toISOString();
    }
    const histItem = history.find(h => h.order_id === orderId || (h.type === 'abastecimento' && h.payment_status === 'pending'));
    if (histItem) {
      histItem.payment_status = 'paid';
      histItem.payment_method = method;
      histItem.settled_at = new Date().toISOString();
    }
  }

  history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'pagamento_fornecedor',
    amount: amount,
    payment_method: method,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Administrador',
    notes: notes || `Pagamento a fornecedor de R$ ${amount.toFixed(2).replace('.', ',')} via ${method}`
  });

  await saveWaterSupplyToDatabase();
  closeModal();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-emerald-300 uppercase text-[11px]">✓ Pagamento Registrado com Sucesso!</div>
      <p class="text-xs text-white">Valor de <strong>R$ ${amount.toFixed(2).replace('.', ',')}</strong> quitado via <strong>${method}</strong>.</p>
    </div>
  `, 4500);
}
window.handlePaySupplierSubmit = handlePaySupplierSubmit;

function openRefillCourtModal(preselectedCourtId = '') {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const analytics = getWaterSupplyAnalytics();
  const courts = state.courts || [];
  const selectedCourtId = preselectedCourtId || (courts[0] ? courts[0].id : '');
  const cw = getCourtWaterState(selectedCourtId);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
              <i data-lucide="truck" class="w-5 h-5 text-cyan-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Repor / Enviar Água para Campo</h3>
              <p class="text-xs text-cyan-200 font-medium">Abastecer galões no campo com saída do depósito central</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-cyan-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleRefillCourtSubmit(event)" class="p-6 space-y-4" autocomplete="off">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Campo / Quadra de Destino *</label>
            <select id="refillCourtSelect" onchange="updateRefillCourtStatusDisplay()" class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white">
              ${courts.map(c => `
                <option value="${c.id}" ${c.id === selectedCourtId ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-bold">Depósito Central (Total Cheio):</span>
              <strong class="text-slate-900 font-black text-sm">${analytics.full} galões</strong>
            </div>
            ${analytics.totalFixedGallons > 0 ? `
            <div class="flex justify-between items-center text-indigo-700 font-bold">
              <span>Galões Fixos Reservados (Pessoas):</span>
              <span>-${analytics.totalFixedGallons} galões</span>
            </div>
            <div class="flex justify-between items-center border-t border-slate-200 pt-1.5">
              <span class="text-slate-800 font-black">Saldo Livre para os Campos:</span>
              <span class="text-emerald-700 font-black text-sm">${analytics.availableForCourts} galões livres</span>
            </div>
            ` : `
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-bold">Saldo Disponível para os Campos:</span>
              <strong class="text-emerald-700 font-black text-sm">${analytics.availableForCourts} galões livres</strong>
            </div>
            `}
            <div class="flex justify-between items-center border-t border-slate-100 pt-1" id="refillCourtCurrentStatus">
              <span class="text-slate-500 font-bold">Disponível no Campo Selecionado:</span>
              <span class="text-cyan-800 font-black">${cw.available} / ${cw.capacity || 4} galões</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Quantidade de Galões a Enviar *</label>
            <input type="number" id="refillCourtQty" required min="1" max="${Math.max(0, analytics.availableForCourts)}" value="${Math.min(analytics.availableForCourts, Math.max(1, (cw.capacity || 4) - cw.available))}"
                   class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-none">
            
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <button type="button" onclick="document.getElementById('refillCourtQty').value=1" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer">
                1 Galão
              </button>
              <button type="button" onclick="document.getElementById('refillCourtQty').value=2" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer">
                2 Galões
              </button>
              <button type="button" onclick="document.getElementById('refillCourtQty').value=4" class="px-2.5 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-900 rounded-lg text-xs font-black transition-all cursor-pointer">
                4 Galões (Lote Cheio)
              </button>
              <button type="button" onclick="setRefillCourtMax()" class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-black transition-all cursor-pointer">
                Completar Campo
              </button>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" id="btnSubmitRefillCourt" class="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Confirmar Envio para Campo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openRefillCourtModal = openRefillCourtModal;

function updateRefillCourtStatusDisplay() {
  const courtSelect = document.getElementById('refillCourtSelect');
  const statusDiv = document.getElementById('refillCourtCurrentStatus');
  const qtyInput = document.getElementById('refillCourtQty');
  if (!courtSelect || !statusDiv) return;
  const cw = getCourtWaterState(courtSelect.value);
  statusDiv.innerHTML = `
    <span class="text-slate-500 font-bold">Disponível no Campo:</span>
    <span class="text-cyan-800 font-black">${cw.available} / ${cw.capacity || 4} galões</span>
  `;
  if (qtyInput) {
    const analytics = getWaterSupplyAnalytics();
    const needed = Math.max(1, (cw.capacity || 4) - cw.available);
    qtyInput.value = Math.min(analytics.full, needed);
  }
}
window.updateRefillCourtStatusDisplay = updateRefillCourtStatusDisplay;

function setRefillCourtMax() {
  const courtSelect = document.getElementById('refillCourtSelect');
  const qtyInput = document.getElementById('refillCourtQty');
  if (!courtSelect || !qtyInput) return;
  const cw = getCourtWaterState(courtSelect.value);
  const analytics = getWaterSupplyAnalytics();
  const needed = Math.max(1, (cw.capacity || 4) - cw.available);
  qtyInput.value = Math.min(analytics.full, needed);
}
window.setRefillCourtMax = setRefillCourtMax;

async function handleRefillCourtSubmit(event) {
  event.preventDefault();
  const courtSelect = document.getElementById('refillCourtSelect');
  const qtyInput = document.getElementById('refillCourtQty');
  const btn = document.getElementById('btnSubmitRefillCourt');
  if (!courtSelect || !qtyInput) return;

  const courtId = courtSelect.value;
  const qty = parseInt(qtyInput.value, 10);
  if (isNaN(qty) || qty <= 0) return;

  const analytics = getWaterSupplyAnalytics();
  if (analytics.availableForCourts < qty) {
    alert(`Saldo livre para os campos insuficiente! O estoque total é de ${analytics.full} galões, porém ${analytics.totalFixedGallons} galão(ões) estão destinados como Galão Fixo para clientes. Saldo livre para quadras: ${analytics.availableForCourts} galões.`);
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Enviando...';
  }

  const cw = getCourtWaterState(courtId);
  const court = (state.courts || []).find(c => c.id === courtId) || { name: 'Campo' };

  state.waterSupply.full = Math.max(0, (state.waterSupply.full || 0) - qty);
  cw.available = (cw.available || 0) + qty;

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'repor_campo',
    qtd: qty,
    court_id: courtId,
    court_name: court.name,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador',
    notes: `Envio de ${qty} galões cheios para ${court.name} (Saldo campo: ${cw.available}/${cw.capacity || 4})`
  });

  await saveWaterSupplyToDatabase();
  closeModal();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-cyan-300 uppercase text-[11px]">🚀 Água Enviada para ${court.name}!</div>
      <p class="text-xs text-white">Transferidos <strong>${qty} galões cheios</strong> do depósito para a quadra. (Estoque central: ${state.waterSupply.full} cheias | Quadra: ${cw.available}/${cw.capacity || 4}).</p>
    </div>
  `, 4500);
}
window.handleRefillCourtSubmit = handleRefillCourtSubmit;

async function settleSupplierPayment(historyIndex) {
  if (!state.waterSupply || !Array.isArray(state.waterSupply.history)) return;
  const item = state.waterSupply.history[historyIndex];
  if (!item) return;

  const choice = prompt(`Quitar pendência com Fornecedor de R$ ${Number(item.cost || 0).toFixed(2).replace('.', ',')} (${item.qtd} águas)?\n\nInforme a forma de pagamento à vista:\n1 - Pix à Vista\n2 - Dinheiro em Espécie`, '1');
  if (choice === null) return;

  const method = (choice.trim() === '2' || choice.toLowerCase().includes('dinheiro')) ? 'Dinheiro à Vista' : 'Pix à Vista';

  item.payment_status = 'paid';
  item.payment_method = method;
  item.settled_at = new Date().toISOString();
  item.settled_by = (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Administrador';

  if (item.order_id && Array.isArray(state.waterSupply.orders)) {
    const ord = state.waterSupply.orders.find(o => o.id === item.order_id);
    if (ord) {
      ord.payment_status = 'paid';
      ord.payment_method = method;
      ord.paid_amount = ord.total;
    }
  }

  await saveWaterSupplyToDatabase();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-emerald-300 uppercase text-[11px]">✓ Pagamento do Fornecedor Quitado!</div>
      <p class="text-xs text-white">Pendência de R$ ${Number(item.cost || 0).toFixed(2).replace('.', ',')} quitada via <strong>${method}</strong>.</p>
    </div>
  `, 4500);
}
window.settleSupplierPayment = settleSupplierPayment;

function openWaterCourtPaymentModal(bookingId) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (!b) return;

  const court = (state.courts || []).find(c => c.id === (b.court_id || b.courtId)) || { name: 'Quadra Esportiva' };
  const cart = b.product_cart || b.productCart || {};
  let waterQty = 0;
  let waterPrice = 0;
  const defaultWaterPrice = 4.00;

  Object.entries(cart).forEach(([id, q]) => {
    if (id.startsWith('_') || typeof q !== 'number' || q <= 0) return;
    const prod = (state.products || []).find(p => p.id === id);
    if (isWaterProduct(prod)) {
      waterQty += q;
      waterPrice += (prod.price || defaultWaterPrice) * q;
    }
  });

  const isCurrentlyPaid = cart._water_paid === true || (b.payment_status === 'paid' && cart._water_paid !== false);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <i data-lucide="dollar-sign" class="w-5 h-5 text-emerald-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Pagamento de Água do Campo</h3>
              <p class="text-xs text-emerald-200 font-medium">🏟️ ${court.name} • #${b.id}</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleWaterCourtPaymentSubmit(event, '${b.id}')" class="p-6 space-y-4" autocomplete="off">
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div class="flex justify-between">
              <span class="text-slate-500 font-bold">Cliente / Responsável:</span>
              <strong class="text-slate-900 font-black">${b.customer_name || b.customerName}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-bold">Data & Horário:</span>
              <strong class="text-slate-800">${b.date} às ${b.time}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500 font-bold">Quantidade de Água:</span>
              <span class="text-cyan-800 font-black">💧 ${waterQty} garrafa(s)</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-slate-200">
              <span class="text-slate-700 font-black">Valor Total da Água:</span>
              <span class="text-emerald-700 text-base font-black">R$ ${waterPrice.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Status do Pagamento *</label>
            <select id="waterCourtPaymentStatus" class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white">
              <option value="paid" ${isCurrentlyPaid ? 'selected' : ''}>✓ Pago / Recebido</option>
              <option value="pending" ${!isCurrentlyPaid ? 'selected' : ''}>⏳ Falta Pagar / Pendente de Cobrança</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Forma de Pagamento Utilizada</label>
            <select id="waterCourtPaymentMethod" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white">
              <option value="Pix">Pix da Arena</option>
              <option value="Dinheiro">Dinheiro em Espécie</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Incluso no Pacote">Incluso no Pacote do Horário</option>
            </select>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" id="btnSubmitWaterPayment" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Pagamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openWaterCourtPaymentModal = openWaterCourtPaymentModal;

async function handleWaterCourtPaymentSubmit(event, bookingId) {
  event.preventDefault();
  const statusSelect = document.getElementById('waterCourtPaymentStatus');
  const methodSelect = document.getElementById('waterCourtPaymentMethod');
  const isPaid = (statusSelect && statusSelect.value === 'paid');
  const method = methodSelect ? methodSelect.value : 'Pix';

  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (b) {
    if (!b.product_cart || typeof b.product_cart !== 'object') b.product_cart = {};
    b.product_cart._water_paid = isPaid;
    b.product_cart._water_paid_method = method;
    b.product_cart._water_paid_at = new Date().toISOString();

    const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    const idx = localBookings.findIndex(x => x.id === bookingId);
    if (idx !== -1) {
      localBookings[idx] = b;
      localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
    }

    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      try {
        const client = window.ArenaSupabase.getClient();
        await client.from('bookings').update({ product_cart: b.product_cart }).eq('id', bookingId);
      } catch(e) {}
    }
  }

  closeModal();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black ${isPaid ? 'text-emerald-300' : 'text-amber-300'} uppercase text-[11px]">
        ${isPaid ? '✓ Pagamento de Água Registrado' : '⏳ Status de Pagamento: Pendente'}
      </div>
      <p class="text-xs text-white">${isPaid ? `Pagamento recebido via <strong>${method}</strong>.` : 'Água marcada como pendente de cobrança no balcão.'}</p>
    </div>
  `, 4000);
}
window.handleWaterCourtPaymentSubmit = handleWaterCourtPaymentSubmit;

async function releaseWaterForCourt(bookingId) {
  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (!b) return;

  if (!b.product_cart || typeof b.product_cart !== 'object') b.product_cart = {};
  b.product_cart._status = 'delivered';
  b.product_cart._water_released = true;
  b.product_cart._water_released_at = new Date().toISOString();
  b.bar_status = 'delivered';

  let waterQty = 0;
  Object.entries(b.product_cart).forEach(([id, q]) => {
    if (id.startsWith('_') || typeof q !== 'number' || q <= 0) return;
    const prod = (state.products || []).find(p => p.id === id);
    if (isWaterProduct(prod)) waterQty += q;
  });
  const deductQty = waterQty > 0 ? waterQty : 4;

  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [] };
  }
  state.waterSupply.full = Math.max(0, (state.waterSupply.full || 0) - deductQty);
  state.waterSupply.empty = (state.waterSupply.empty || 0) + deductQty;

  const courtObj = (state.courts || []).find(c => c.id === (b.court_id || b.courtId)) || { name: 'Campo' };
  
  const cw = getCourtWaterState(courtObj.id);
  cw.consumedToday = (cw.consumedToday || 0) + deductQty;

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'esvaziou',
    qtd: deductQty,
    booking_id: b.id,
    court_id: courtObj.id,
    court_name: courtObj.name,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador Bar',
    notes: `Baixa de ${deductQty} águas liberadas para ${courtObj.name} (#${b.id})`
  });

  b.product_cart._water_deducted_qty = deductQty;

  await saveWaterSupplyToDatabase();

  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const idx = localBookings.findIndex(x => x.id === bookingId);
  if (idx !== -1) {
    localBookings[idx] = b;
    localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
  }

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('bookings').update({ product_cart: b.product_cart }).eq('id', bookingId);
    } catch(e) {}
  }

  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-emerald-300 uppercase text-[11px]">🚀 Água Liberada no Campo!</div>
      <p class="text-xs text-white">Baixa de <strong>${deductQty} águas</strong> realizada no estoque. (Estoque atual: ${state.waterSupply.full} cheias / ${state.waterSupply.empty} vazias).</p>
    </div>
  `, 5000);
}
window.releaseWaterForCourt = releaseWaterForCourt;

async function triggerQuickWaterBaixa(qty = 4) {
  if (!confirm(`Confirmar a baixa de ${qty} águas consumidas no campo/arena?\n\n- ${qty} águas cheias serão subtraídas do estoque\n- ${qty} vasilhames vazios serão adicionados para controle de pedido ao fornecedor.`)) {
    return;
  }
  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [] };
  }
  state.waterSupply.full = Math.max(0, (state.waterSupply.full || 0) - qty);
  state.waterSupply.empty = (state.waterSupply.empty || 0) + qty;

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'esvaziou',
    qtd: qty,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador Bar',
    notes: `Baixa rápida de ${qty} águas consumidas nos campos`
  });

  await saveWaterSupplyToDatabase();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-amber-300 uppercase text-[11px]">✓ Baixa de ${qty} Águas Realizada!</div>
      <p class="text-xs text-white">Estoque atualizado: <strong>${state.waterSupply.full} cheias</strong> e <strong>${state.waterSupply.empty} vazias</strong>.</p>
    </div>
  `, 4500);
}
window.triggerQuickWaterBaixa = triggerQuickWaterBaixa;

function openWaterReportModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const analytics = getWaterSupplyAnalytics();

  const reportText = `📊 RELATÓRIO DE ÁGUAS DA ARENA LIMOEIRO
📅 Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

💧 ESTOQUE ATUAL:
- Águas Cheias em Estoque: ${analytics.full} un
- Garrafas Vazias para Encher: ${analytics.empty} un (Regra: Pedido feito com baixa de 4 un)
- Total de Vasilhames: ${analytics.totalStock} un
- Em Uso nos Campos: ${analytics.totalInCourts} un
- Status do Pedido ao Fornecedor: ${analytics.needsRefill ? `🚨 Liberado (${analytics.empty} vazias p/ reposição)` : `✓ Seguro (${analytics.empty}/4 vazias registradas)`}
- Reservadas para os Campos (Próx. 2 Dias): ${analytics.reservedNext2Days} un
- Saldo Livre para Balcão/Novas Reservas: ${analytics.freeForSale} un

🏟️ CONTROLE DOS CAMPOS:
- Total de Águas nos Campos: ${analytics.totalWaterSoldQty} un
- Status dos Clientes: ✓ Incluso nos Jogos / Balcão (sem cobrança de valor aos clientes)

🚚 FORNECEDOR / DISTRIBUIDORA:
- Total de Águas Abastecidas: ${analytics.totalWaterSuppliedQty} un
- Preço Unitário Médio: R$ ${analytics.unitPrice.toFixed(2).replace('.', ',')}
- Fornecedor Quitado: R$ ${analytics.totalSupplyCostPaid.toFixed(2).replace('.', ',')}
- ⏳ PENDÊNCIA FORNECEDOR (A Pagar à Vista: Pix ou Dinheiro): R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')}
- Custo Total de Fornecedor: R$ ${(analytics.totalSupplyCostPaid + analytics.totalSupplyCostPending).toFixed(2).replace('.', ',')}
`;

  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-cyan-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Relatório Completo de Água</h3>
              <p class="text-xs text-cyan-200 font-medium">Estoque, Abastecimento, Fornecedor e Liberação dos Campos</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-cyan-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          <!-- Bloco 1: Estoque & Necessidade -->
          <div class="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-200 space-y-2.5">
            <div class="flex items-center justify-between border-b border-cyan-200/60 pb-2">
              <span class="font-black text-cyan-900 uppercase flex items-center space-x-1.5">
                <i data-lucide="droplets" class="w-4 h-4 text-cyan-700"></i>
                <span>Estoque Físico & Necessidade</span>
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${analytics.needsRefill ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
                ${analytics.needsRefill ? `🚨 Pedir ${analytics.refillNeededCount} un` : `✓ Seguro (${analytics.empty}/4 Vazias)`}
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span class="text-slate-500 text-[10px] font-bold uppercase block">Águas Cheias</span>
                <strong class="text-base font-black text-slate-900">${analytics.full} un</strong>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold uppercase block">Vazias p/ Encher</span>
                <strong class="text-base font-black ${analytics.empty >= 4 ? 'text-rose-600' : 'text-slate-900'}">${analytics.empty} un</strong>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold uppercase block">Em Uso nos Campos</span>
                <strong class="text-base font-black text-emerald-700">${analytics.totalInCourts} un</strong>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold uppercase block">Precisa Abastecer</span>
                <strong class="text-sm font-bold ${analytics.refillNeededCount > 0 ? 'text-rose-700' : 'text-emerald-700'}">${analytics.refillNeededCount} un</strong>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold uppercase block">Campos (2 dias)</span>
                <strong class="text-sm font-bold text-slate-800">${analytics.reservedNext2Days} un</strong>
              </div>
              <div>
                <span class="text-slate-500 text-[10px] font-bold uppercase block">Total Vasilhames</span>
                <strong class="text-sm font-bold text-slate-700">${analytics.totalStock} un</strong>
              </div>
            </div>
          </div>

          <!-- Bloco 2: Fornecedor & Distribuidora -->
          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <span class="font-black text-slate-800 uppercase flex items-center space-x-1.5">
                <i data-lucide="truck" class="w-4 h-4 text-slate-600"></i>
                <span>Fornecedor & Distribuidora</span>
              </span>
              <span class="text-slate-500 font-bold text-[10px]">${analytics.totalWaterSuppliedQty} águas abastecidas</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div class="bg-white p-3 rounded-xl border border-slate-200">
                <span class="text-slate-600 text-[10px] font-bold uppercase block">Fornecedor Quitado</span>
                <div class="text-base font-black text-slate-800">R$ ${analytics.totalSupplyCostPaid.toFixed(2).replace('.', ',')}</div>
                <span class="text-[10px] text-slate-400">Pix ou dinheiro em espécie</span>
              </div>
              <div class="bg-white p-3 rounded-xl border ${analytics.totalSupplyCostPending > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'}">
                <span class="${analytics.totalSupplyCostPending > 0 ? 'text-amber-900 font-black' : 'text-slate-600'} text-[10px] uppercase block">
                  ${analytics.totalSupplyCostPending > 0 ? '⏳ Pendência Fornecedor' : '✓ Fornecedor Quitado'}
                </span>
                <div class="text-base font-black ${analytics.totalSupplyCostPending > 0 ? 'text-amber-700' : 'text-slate-800'}">
                  R$ ${analytics.totalSupplyCostPending.toFixed(2).replace('.', ',')}
                </div>
                <span class="text-[10px] ${analytics.totalSupplyCostPending > 0 ? 'text-amber-800 font-bold' : 'text-slate-400'}">
                  ${analytics.totalSupplyCostPending > 0 ? 'A pagar à vista (Pix ou Dinheiro)' : 'Sem pendências'}
                </span>
              </div>
            </div>
          </div>

          <!-- Ações -->
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a href="${shareUrl}" target="_blank" class="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center space-x-1.5 transition-all">
              <i data-lucide="share-2" class="w-4 h-4"></i>
              <span>Compartilhar Relatório no WhatsApp</span>
            </a>
            <button onclick="closeModal()" class="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openWaterReportModal = openWaterReportModal;

function openEmptyWaterModal(defaultQty = 4) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const currentFull = (state.waterSupply && state.waterSupply.full) || 0;
  const initialQty = Math.min(Math.max(1, currentFull), defaultQty);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
              <i data-lucide="rotate-ccw" class="w-5 h-5 text-amber-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Baixa de Águas / Consumo Geral</h3>
              <p class="text-xs text-amber-200 font-medium">Registrar saída de cheias e entrada de garrafas vazias</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-amber-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleEmptyWaterSubmit(event)" class="p-6 space-y-4" autocomplete="off">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700 uppercase">Quantidade de Baixa *</label>
              <span class="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Regra Arena: Lote de 4 Águas</span>
            </div>
            <input type="number" id="waterEmptyQtd" required min="1" max="${Math.max(1, currentFull)}" value="${initialQty}" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none">
            
            <div class="flex flex-wrap items-center gap-1.5 mt-2">
              <button type="button" onclick="document.getElementById('waterEmptyQtd').value=4" class="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-black transition-all cursor-pointer">
                4 Águas (Padrão)
              </button>
              <button type="button" onclick="document.getElementById('waterEmptyQtd').value=8" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer">
                8 Águas
              </button>
              <button type="button" onclick="document.getElementById('waterEmptyQtd').value=1" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer">
                1 Água
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Local / Campo de Consumo</label>
            <input type="text" id="waterEmptyNotes" placeholder="Ex: Consumo Campo Society 1 ou Quadra de Areia" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-600 focus:outline-none">
          </div>

          <div class="pt-2 flex items-center justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" id="btnSubmitWaterEmpty" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Confirmar Baixa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openEmptyWaterModal = openEmptyWaterModal;

async function handleEmptyWaterSubmit(event) {
  event.preventDefault();
  const qtdInput = document.getElementById('waterEmptyQtd');
  const notesInput = document.getElementById('waterEmptyNotes');
  const btn = document.getElementById('btnSubmitWaterEmpty');

  const qtd = parseInt(qtdInput ? qtdInput.value : '0', 10);
  if (isNaN(qtd) || qtd <= 0) return;

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Salvando...';
  }

  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [] };
  }

  state.waterSupply.full = Math.max(0, (state.waterSupply.full || 0) - qtd);
  state.waterSupply.empty = (state.waterSupply.empty || 0) + qtd;

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'esvaziou',
    qtd: qtd,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador Bar',
    notes: notesInput ? notesInput.value.trim() : ''
  });

  await saveWaterSupplyToDatabase();
  closeModal();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-amber-300 uppercase text-[11px]">🔄 Registro de Consumo Feito</div>
      <p class="text-xs text-white">Adicionadas <strong>${qtd} garrafas vazias</strong> ao controle para reabastecimento.</p>
    </div>
  `, 4000);
}
window.handleEmptyWaterSubmit = handleEmptyWaterSubmit;

window._waterAdjActiveItem = '5l';

function selectWaterAdjItem(type) {
  window._waterAdjActiveItem = type;
  const btn5L = document.getElementById('btnWaterItem5L');
  const btn500ml = document.getElementById('btnWaterItem500ml');
  const priceInput = document.getElementById('waterAdjUnitPrice');
  const minInput = document.getElementById('waterAdjMin');

  if (type === '500ml') {
    if (btn5L) {
      btn5L.className = "p-2.5 rounded-xl border border-transparent hover:bg-white/60 font-bold text-xs flex items-center justify-center space-x-1.5 text-slate-600 transition-all cursor-pointer";
    }
    if (btn500ml) {
      btn500ml.className = "p-2.5 rounded-xl border-2 border-slate-900 bg-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm text-slate-900 transition-all cursor-pointer";
    }
    if (priceInput && (priceInput.value === '5.00' || !priceInput.value)) {
      priceInput.value = '2.50';
    }
    if (minInput && minInput.value === '5') {
      minInput.value = '10';
    }
  } else {
    if (btn5L) {
      btn5L.className = "p-2.5 rounded-xl border-2 border-slate-900 bg-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm text-slate-900 transition-all cursor-pointer";
    }
    if (btn500ml) {
      btn500ml.className = "p-2.5 rounded-xl border border-transparent hover:bg-white/60 font-bold text-xs flex items-center justify-center space-x-1.5 text-slate-600 transition-all cursor-pointer";
    }
    if (priceInput && (priceInput.value === '2.50' || !priceInput.value)) {
      const defPrice = (state.waterSupply && typeof state.waterSupply.unit_price === 'number') ? state.waterSupply.unit_price : 5.00;
      priceInput.value = defPrice.toFixed(2);
    }
    if (minInput && minInput.value === '10') {
      minInput.value = '5';
    }
  }
  updateWaterAdjCalc();
}
window.selectWaterAdjItem = selectWaterAdjItem;

function updateWaterAdjCalc() {
  const emptyVal = parseInt(document.getElementById('waterAdjEmpty')?.value || '0', 10);
  const unitPriceVal = parseFloat(document.getElementById('waterAdjUnitPrice')?.value || '0') || 0;
  const total = emptyVal * unitPriceVal;

  const totalEl = document.getElementById('waterAdjCalcTotal');
  if (totalEl) {
    totalEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')} (${emptyVal} un x R$ ${unitPriceVal.toFixed(2).replace('.', ',')})`;
  }
  const displayEl = document.getElementById('waterAdjTotalDisplay');
  if (displayEl) {
    displayEl.innerHTML = `Total p/ encher: <strong class="text-slate-800">${emptyVal} un.</strong>`;
  }
}
window.updateWaterAdjCalc = updateWaterAdjCalc;

function openAdjustWaterSupplyModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const currentEmpty = (state.waterSupply && typeof state.waterSupply.empty === 'number') ? state.waterSupply.empty : 0;
  const currentMin = (state.waterSupply && state.waterSupply.min_alert) || 5;
  const currentUnitPrice = (state.waterSupply && typeof state.waterSupply.unit_price === 'number') ? state.waterSupply.unit_price : 5.00;
  const activeItem = state.waterSupply?.activeItem || '5l';
  window._waterAdjActiveItem = activeItem;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <!-- Topo Escuro idêntico à Imagem 2 -->
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-sm">
              <i data-lucide="sliders" class="w-5 h-5 text-slate-200"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase tracking-wide">Ajuste de Estoque e Preço</h3>
              <p class="text-xs text-slate-300 font-medium">Correção manual de garrafas a encher e preço unitário</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleAdjustWaterSupplySubmit(event)" class="p-6 space-y-4 overflow-y-auto" autocomplete="off">
          
          <!-- ITEM DO CARDÁPIO (Inspirado exatamente na Foto 2) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-600 uppercase tracking-wider">Item do Cardápio:</span>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Galão / Garrafão
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button type="button" onclick="selectWaterAdjItem('5l')" id="btnWaterItem5L" 
                      class="p-2.5 rounded-xl border-2 border-slate-900 bg-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm text-slate-900 transition-all cursor-pointer">
                <i data-lucide="cylinder" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                <span class="truncate">Água Mineral 5L</span>
              </button>
              <button type="button" onclick="selectWaterAdjItem('500ml')" id="btnWaterItem500ml" 
                      class="p-2.5 rounded-xl border border-transparent hover:bg-white/60 font-bold text-xs flex items-center justify-center space-x-1.5 text-slate-600 transition-all cursor-pointer">
                <i data-lucide="cup-soda" class="w-4 h-4 text-cyan-600 shrink-0"></i>
                <span class="truncate">Água Mineral 500ml</span>
              </button>
            </div>
          </div>

          <div class="border-t border-slate-100 pt-3"></div>

          <!-- QUANTIDADE P/ ENCHER (Apenas Garrafas p/ Encher, sem a opção de cheias) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700 uppercase">Vazias p/ Encher (Garrafas)</label>
              <span class="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                Apenas p/ Encher
              </span>
            </div>
            <input type="number" id="waterAdjEmpty" required min="0" value="${currentEmpty}" oninput="updateWaterAdjCalc()"
                   class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                   placeholder="Ex: 10">
            <span class="text-[10px] text-slate-500 mt-1 block">Quantidade de garrafas que serão enviadas para reabastecimento.</span>
          </div>

          <!-- VALOR UNITÁRIO POR GARRAFA (R$) E CÁLCULO AUTOMÁTICO DO LOTE -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Unitário por Garrafa (R$)</label>
            <input type="number" id="waterAdjUnitPrice" step="0.10" min="0" value="${currentUnitPrice.toFixed(2)}" oninput="updateWaterAdjCalc()"
                   class="w-full p-3 border border-slate-300 rounded-xl text-lg font-black text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            
            <!-- Resumo Dinâmico do Lote -->
            <div class="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
              <span class="flex items-center space-x-1.5">
                <i data-lucide="calculator" class="w-4 h-4 text-emerald-600 shrink-0"></i>
                <span>Total a Pagar no Lote:</span>
              </span>
              <span id="waterAdjCalcTotal" class="text-xs font-black text-emerald-950">
                R$ ${(currentEmpty * currentUnitPrice).toFixed(2).replace('.', ',')} (${currentEmpty} un x R$ ${currentUnitPrice.toFixed(2).replace('.', ',')})
              </span>
            </div>
            <span class="text-[10px] text-slate-500 mt-1 block">Valor padrão pré-carregado nos novos pedidos ao fornecedor.</span>
          </div>

          <!-- ESTOQUE MÍNIMO P/ ALERTA PREVENTIVO (GATILHO) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700 uppercase">Estoque Mínimo p/ Alerta Preventivo (Gatilho)</label>
              <span class="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">Gatilho do Pedido</span>
            </div>
            <input type="number" id="waterAdjMin" required min="1" value="${currentMin}" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            <span class="text-[10px] text-slate-500 mt-1 block">Avisa a equipe quando as cheias caírem abaixo deste valor.</span>
          </div>

          <!-- MOTIVO DO AJUSTE -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo do Ajuste</label>
            <input type="text" id="waterAdjNotes" placeholder="Ex: Contagem física quinzenal" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-600 focus:outline-none">
          </div>

          <!-- AÇÕES DO RODAPÉ (Zerar e Contador Físico) -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <button type="button" onclick="document.getElementById('waterAdjEmpty').value = '0'; updateWaterAdjCalc();" 
                    class="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center space-x-1">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Zerar Quantidade p/ Encher</span>
            </button>
            <span id="waterAdjTotalDisplay" class="text-[11px] text-slate-500 font-medium">
              Total p/ encher: <strong class="text-slate-800">${currentEmpty} un.</strong>
            </span>
          </div>

          <!-- BOTÕES DE SUBMIT (Inspirados na Imagem 2) -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" id="btnSubmitWaterAdj" class="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Ajustes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openAdjustWaterSupplyModal = openAdjustWaterSupplyModal;

async function handleAdjustWaterSupplySubmit(event) {
  event.preventDefault();
  const emptyVal = parseInt(document.getElementById('waterAdjEmpty').value || '0', 10);
  const minVal = parseInt(document.getElementById('waterAdjMin').value || '5', 10);
  const unitPriceVal = parseFloat(document.getElementById('waterAdjUnitPrice')?.value || '5.00') || 5.00;
  const notes = (document.getElementById('waterAdjNotes').value || '').trim();
  const activeItem = window._waterAdjActiveItem || '5l';
  const itemName = activeItem === '500ml' ? 'Água Mineral 500ml' : 'Água Mineral 5L';
  const btn = document.getElementById('btnSubmitWaterAdj');

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Salvando...';
  }

  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [] };
  }

  state.waterSupply.empty = Math.max(0, emptyVal);
  state.waterSupply.min_alert = Math.max(1, minVal);
  state.waterSupply.unit_price = unitPriceVal;
  state.waterSupply.activeItem = activeItem;

  const totalCost = emptyVal * unitPriceVal;

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'ajuste',
    qtd: emptyVal,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Administrador',
    notes: `Ajuste (${itemName}): ${emptyVal} garrafas p/ encher a R$ ${unitPriceVal.toFixed(2).replace('.', ',')}/un (Total R$ ${totalCost.toFixed(2).replace('.', ',')}) • ${notes || 'Contagem manual'}`
  });

  await saveWaterSupplyToDatabase();
  closeModal();
  renderStepContent();
  lucide.createIcons();

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-cyan-300 uppercase text-[11px]">⚙️ Ajuste de Estoque Salvo</div>
      <p class="text-xs text-white">Registrado <strong>${emptyVal} garrafas p/ encher</strong> (${itemName}) a <strong>R$ ${unitPriceVal.toFixed(2).replace('.', ',')}</strong> (Total: R$ ${totalCost.toFixed(2).replace('.', ',')}).</p>
    </div>
  `, 4000);
}
window.handleAdjustWaterSupplySubmit = handleAdjustWaterSupplySubmit;

// FUNÇÕES DE CONTROLE DO MÓDULO BAR & LANCHONETE
function setBarSubTab(tab) {
  state.barSubTab = tab;
  renderStepContent();
  lucide.createIcons();
}

function setBarCategoryFilter(cat) {
  state.barProductCategory = cat;
  renderStepContent();
  lucide.createIcons();
}

function handleBarProductSearch(val) {
  state.barProductSearch = val;
  const listEl = document.getElementById('barProductGridContainer');
  if (listEl) {
    listEl.innerHTML = renderBarProductCards();
    lucide.createIcons();
  }
}

function renderBarProductCards() {
  const q = (state.barProductSearch || '').toLowerCase().trim();
  const cat = state.barProductCategory || 'all';
  const isRecep = isReceptionUser();

  let list = state.products || [];
  if (cat !== 'all') {
    list = list.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
  }
  if (q) {
    list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }

  if (list.length === 0) {
    return `
      <div class="col-span-full py-12 text-center bg-slate-50/75 rounded-2xl border border-dashed border-slate-200">
        <i data-lucide="search-x" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
        <p class="text-sm font-bold text-slate-700">Nenhum produto encontrado</p>
        <p class="text-xs text-slate-500 mt-0.5">Tente outro termo de pesquisa ou selecione outra categoria.</p>
        ${!isRecep ? `
          <button onclick="openProductModal()" class="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow cursor-pointer">
            + Cadastrar Este Produto
          </button>
        ` : ''}
      </div>
    `;
  }

  return list.map(p => `
    <div class="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group">
      <div class="flex items-start space-x-3.5">
        <div class="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-sm">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80'" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300">
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center space-x-1.5 mb-1">
            <span class="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              ${p.category || 'Geral'}
            </span>
            ${p.unit ? `<span class="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">${p.unit}</span>` : ''}
          </div>
          <h5 class="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-snug">${p.name}</h5>
          <p class="text-base font-black text-emerald-700 mt-1">R$ ${(Number(p.price) || 0).toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      ${!isRecep ? `
      <div class="pt-2.5 border-t border-slate-100 flex items-center justify-end space-x-1.5">
        <button onclick="openProductModal('${p.id}')" 
                class="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                title="Editar dados e preço">
          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          <span>Editar</span>
        </button>
        <button onclick="deleteProduct('${p.id}')" 
                class="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                title="Excluir produto do cardápio">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Excluir</span>
        </button>
      </div>
      ` : ''}
    </div>
  `).join('');
}

// 3. ABA DE CONTROLE DE BEBIDAS, COMIDAS & BAR (COM CARDÁPIO INTEGRADO)
function renderBarControlTab() {
  const selectedDate = state.adminFilterDate || getFormattedDate(new Date());

  // Encontra todas as reservas com pedidos no bar
  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

  const barOrders = allBookings.filter(b => {
    if (b.status === 'cancelled') return false;
    const cart = b.product_cart || b.productCart || {};
    return Object.keys(cart).filter(k => !k.startsWith('_')).some(k => cart[k] > 0);
  });

  const isRecep = isReceptionUser();
  const currentSubTab = state.barSubTab || 'menu';
  const currentCategory = state.barProductCategory || 'all';
  const totalProducts = (state.products || []).length;
  const waterAnalytics = (typeof getWaterSupplyAnalytics === 'function')
    ? getWaterSupplyAnalytics()
    : { full: 20, empty: 0, needsRefill: false, reservedNext2Days: 0, totalReservedAll: 0, freeForSale: 20, upcomingWaterBookings: [] };

  return `
    <div class="space-y-6">
      
      <!-- Cabeçalho do Bar & Lanchonete -->
      <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-3.5">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
            <i data-lucide="beer" class="w-6 h-6 text-amber-600"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Módulo Bar & Lanchonete</span>
              <span class="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">${totalProducts} produtos cadastrados</span>
            </div>
            <h3 class="text-xl font-black text-slate-900 mt-0.5">Bar & Lanchonete da Arena Limoeiro</h3>
            <p class="text-xs text-slate-500">Gerencie o cardápio oficial de bebidas e comidas e a fila de gelamento e entrega de pedidos nas quadras.</p>
          </div>
        </div>

        ${!isRecep ? `
        <div class="flex items-center space-x-2">
          <button onclick="openProductModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>+ Novo Produto / Bebida</span>
          </button>
        </div>
        ` : ''}
      </div>

      <!-- Sub-navegação interna de Bar & Lanchonete (Grid 2 colunas no mobile, 4 no tablet, flex no desktop) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2 pb-1 w-full">
        <button onclick="setBarSubTab('menu')" 
                class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2
                       ${currentSubTab === 'menu' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="utensils" class="w-4 h-4 shrink-0 ${currentSubTab === 'menu' ? 'text-amber-400' : 'text-slate-500'}"></i>
          <span class="truncate">🍔 Cardápio (${totalProducts})</span>
        </button>

        <button onclick="setBarSubTab('orders')" 
                class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2
                       ${currentSubTab === 'orders' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="list-checks" class="w-4 h-4 shrink-0 ${currentSubTab === 'orders' ? 'text-emerald-400' : 'text-slate-500'}"></i>
          <span class="truncate">🍺 Pedidos (${barOrders.length})</span>
        </button>

        <button onclick="setBarSubTab('water')" 
                class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 relative
                       ${currentSubTab === 'water' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="droplets" class="w-4 h-4 shrink-0 ${currentSubTab === 'water' ? 'text-cyan-400' : 'text-cyan-600'}"></i>
          <span class="truncate">💧 Água (${waterAnalytics.full})</span>
          ${waterAnalytics.needsRefill ? `
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block shrink-0" title="Atenção: Necessita reabastecimento de água"></span>
          ` : ''}
        </button>

        <button onclick="setBarSubTab('all')" 
                class="w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2
                       ${currentSubTab === 'all' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 ${currentSubTab === 'all' ? 'text-cyan-400' : 'text-slate-500'}"></i>
          <span class="truncate">📋 Visão Geral</span>
        </button>
      </div>

      <!-- SEÇÃO CARDÁPIO DE PRODUTOS -->
      ${(currentSubTab === 'menu' || currentSubTab === 'all') ? `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-base font-black uppercase text-slate-900 flex items-center space-x-2">
                  <i data-lucide="book-open" class="w-5 h-5 text-emerald-600"></i>
                  <span>Cardápio Oficial da Arena Limoeiro</span>
                </span>
                <span class="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">${totalProducts} itens</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">Preços, fotos e categorias dos produtos disponíveis para os atletas no aplicativo e no balcão.</p>
            </div>

            ${!isRecep ? `
            <button onclick="openProductModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all cursor-pointer shrink-0">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Cadastrar Novo Item</span>
            </button>
            ` : ''}
          </div>

          <!-- Filtros de Busca e Categorias do Cardápio -->
          <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <!-- Barra de Busca Instantânea -->
            <div class="relative flex-1">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input type="text" 
                     value="${(state.barProductSearch || '').replace(/"/g, '&quot;')}"
                     oninput="handleBarProductSearch(this.value)" 
                     placeholder="Buscar produto ou bebida pelo nome..." 
                     class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all">
            </div>

            <!-- Categorias Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
              <button onclick="setBarCategoryFilter('all')" 
                      class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                             ${currentCategory === 'all' ? 'bg-emerald-700 text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                Todos (${totalProducts})
              </button>
              <button onclick="setBarCategoryFilter('Bebidas')" 
                      class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                             ${currentCategory === 'Bebidas' ? 'bg-emerald-700 text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                🍺 Bebidas
              </button>
              <button onclick="setBarCategoryFilter('Alimentos')" 
                      class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                             ${currentCategory === 'Alimentos' ? 'bg-emerald-700 text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                🍔 Alimentos
              </button>
              <button onclick="setBarCategoryFilter('Churrasco')" 
                      class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                             ${currentCategory === 'Churrasco' ? 'bg-emerald-700 text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                🥩 Churrasco & Gelo
              </button>
              <button onclick="setBarCategoryFilter('Equipamentos')" 
                      class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                             ${currentCategory === 'Equipamentos' ? 'bg-emerald-700 text-white shadow-xs font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                🎾 Equipamentos
              </button>
            </div>
          </div>

          <!-- Grid de Produtos -->
          <div id="barProductGridContainer" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${renderBarProductCards()}
          </div>
        </div>
      ` : ''}

      <!-- SEÇÃO FILA DE PEDIDOS -->
      ${(currentSubTab === 'orders' || currentSubTab === 'all') ? `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 class="text-sm font-black uppercase text-slate-800 flex items-center">
                <i data-lucide="list-checks" class="w-4 h-4 text-emerald-600 mr-2"></i>
                Pedidos de Bebidas Vinculados aos Jogos (${barOrders.length})
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Acompanhe a separação e o gelamento das bebidas solicitadas nas reservas.</p>
            </div>
          </div>

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

                    <!-- Workflow em 4 etapas de Separação / Freezer / Entrega -->
                    <div>
                      <span class="text-[10px] font-black uppercase text-slate-500 block mb-1.5">Status de Separação / Entrega:</span>
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                        <button onclick="updateBarStatus('${order.id}', 'waiting')" 
                                class="p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${currentStatus === 'waiting' ? 'bg-amber-100 border-amber-400 text-amber-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                          ⏳ Pendente
                        </button>
                        <button onclick="updateBarStatus('${order.id}', 'separated')" 
                                class="p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${currentStatus === 'separated' ? 'bg-purple-100 border-purple-400 text-purple-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                          📦 Separado
                        </button>
                        <button onclick="updateBarStatus('${order.id}', 'chilling')" 
                                class="p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${currentStatus === 'chilling' ? 'bg-cyan-100 border-cyan-400 text-cyan-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                          ❄️ No Freezer
                        </button>
                        <button onclick="updateBarStatus('${order.id}', 'delivered')" 
                                class="p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${currentStatus === 'delivered' ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}">
                          ✓ Entregue
                        </button>
                      </div>

                      <div class="mt-2.5 flex justify-end">
                        <button onclick="openAddBarItemsModal('${order.id}')" class="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer">
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
      ` : ''}

      <!-- SEÇÃO REGISTRO DE ÁGUA & ABASTECIMENTO -->
      ${(currentSubTab === 'water' || currentSubTab === 'all') ? `
        ${renderWaterSupplySection(waterAnalytics)}
      ` : ''}

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

  if (currentTab === 'categories') {
    return renderAdminCategoriesTab();
  }

  if (currentTab === 'bar_control') {
    return renderBarControlTab();
  }

  const userRole = state.currentUser?.role || 'Administrador Geral';
  const isMasterAdmin = userRole === 'Administrador Geral' || (state.currentUser?.email === 'admin@arenalimoeiro.com.br');

  // Calcula quais sub-abas o usuário logado tem permissão de acessar
  const allowedSubTabs = [];
  if (canEditCourts()) allowedSubTabs.push('spaces', 'positions');
  if (canDeleteBookings() || canStartMatches()) allowedSubTabs.push('bookings');
  if (canManageMonthly()) allowedSubTabs.push('monthly');
  if (canManageCustomers()) allowedSubTabs.push('customers');
  if (canManageSettings()) allowedSubTabs.push('users', 'database');
  if (isMasterAdmin) allowedSubTabs.push('audit_logs');

  let activeSubTab = state.adminSubTab || (['spaces','bookings','categories','positions','monthly','users','customers','database','audit_logs'].includes(currentTab) ? currentTab : (allowedSubTabs[0] || 'spaces'));
  if (allowedSubTabs.length > 0 && !allowedSubTabs.includes(activeSubTab)) {
    activeSubTab = allowedSubTabs[0];
    state.adminSubTab = activeSubTab;
  }

  return `
    <div class="space-y-6">
      
      <!-- Sub-navegação de Cadastros (Grid 2 colunas no mobile, 3 ou 4 no tablet, flex no desktop) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap items-center gap-2 pb-2 w-full">
        ${canEditCourts() ? `
          <button onclick="setAdminSubTab('spaces')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'spaces' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">Espaços / Quadras</span>
          </button>
        ` : ''}

        ${(canDeleteBookings() || canStartMatches()) ? `
          <button onclick="setAdminSubTab('bookings')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'bookings' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">⚽ Jogos (${(state.bookings || []).length})</span>
          </button>
        ` : ''}

        ${canEditCourts() ? `
          <button onclick="setAdminSubTab('positions')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'positions' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">Posições dos Jogos</span>
          </button>
        ` : ''}

        ${canManageMonthly() ? `
          <button onclick="setAdminSubTab('monthly')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'monthly' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">Horários Fixos (${state.monthlyMembers.length})</span>
          </button>
        ` : ''}

        ${canManageSettings() ? `
          <button onclick="setAdminSubTab('users')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'users' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">👑 Gestores & Acessos</span>
          </button>
        ` : ''}

        ${canManageCustomers() ? `
          <button onclick="setAdminSubTab('customers')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'customers' ? 'bg-slate-900 text-white shadow font-black border border-slate-900' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">Clientes Cadastrados</span>
          </button>
        ` : ''}

        ${canManageSettings() ? `
          <button onclick="setAdminSubTab('database')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'database' ? 'bg-emerald-600 text-white shadow font-black border border-emerald-600' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
            <span class="truncate">Conexão Supabase</span>
          </button>
        ` : ''}

        ${isMasterAdmin ? `
          <button onclick="setAdminSubTab('audit_logs')" class="w-full xl:w-auto justify-center text-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${activeSubTab === 'audit_logs' ? 'bg-amber-600 text-white shadow font-black border border-amber-600 ring-2 ring-amber-400/40' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 shadow-xs'}">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5 shrink-0 ${activeSubTab === 'audit_logs' ? 'text-white' : 'text-amber-700'}"></i>
            <span class="truncate">📜 Logs</span>
          </button>
        ` : ''}
      </div>

      <!-- Conteúdo da Sub-aba -->
      <div>
        ${renderAdminSubTabContent(activeSubTab)}
      </div>

    </div>
  `;
}


// ====================================================
// ABA DEDICADA DE GESTÃO DE CATEGORIAS NO PAINEL ADMIN
// ====================================================
function renderAdminCategoriesTab() {
  const categories = (state.categories || []).filter(c => c.id !== 'all');
  const usedCount = categories.filter(cat => (state.courts || []).some(c => c.category === cat.id)).length;

  return `
    <div class="space-y-6">
      
      <!-- Cabeçalho da Aba de Categorias -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shrink-0">
              <i data-lucide="tag" class="w-6 h-6 text-emerald-300"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Gestão de Modalidades</span>
                <span class="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">${categories.length} modalidades ativas</span>
              </div>
              <h3 class="text-xl font-black text-slate-900 mt-1">Categorias e Modalidades dos Espaços</h3>
              <p class="text-xs text-slate-500">Crie, renomeie ou exclua modalidades esportivas. Elas aparecem na barra de filtros da tela inicial e organizam o cadastro de quadras da Arena.</p>
            </div>
          </div>

          <div class="w-full sm:w-auto flex items-center justify-center">
            <button onclick="openCategoryModal()" title="Cadastrar Nova Modalidade" class="w-full sm:w-auto justify-center text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4 text-emerald-200 shrink-0"></i>
              <span>Nova Modalidade</span>
            </button>
          </div>
        </div>

        <!-- Estatísticas Rápidas -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <p class="text-[11px] font-bold text-slate-500 uppercase">Total de Modalidades</p>
            <p class="text-xl font-black text-slate-900 mt-0.5">${categories.length}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <p class="text-[11px] font-bold text-emerald-700 uppercase">Modalidades em Uso</p>
            <p class="text-xl font-black text-emerald-900 mt-0.5">${usedCount}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <p class="text-[11px] font-bold text-blue-700 uppercase">Quadras Vinculadas</p>
            <p class="text-xl font-black text-blue-900 mt-0.5">${state.courts.length}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <p class="text-[11px] font-bold text-amber-700 uppercase">Configuração</p>
            <p class="text-xs font-black text-amber-900 mt-1.5 flex items-center space-x-1">
              <span>⚡</span><span>100% Editável</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Tabela / Cards de Todas as Categorias -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 class="text-sm font-black text-slate-900 uppercase tracking-wide">Modalidades Cadastradas</h4>
            <p class="text-xs text-slate-500">Quadras vinculadas e opções de gerenciamento</p>
            </div>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              ${categories.length} no total
            </span>
          </div>

          <div class="space-y-3">
            ${categories.map(cat => {
              const linkedCourts = state.courts.filter(c => c.category === cat.id);

              return `
                <div class="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <i data-lucide="${cat.icon || 'tag'}" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center space-x-2">
                        <h5 class="text-sm font-black text-slate-900 truncate">${cat.name}</h5>
                      </div>
                      <p class="text-xs text-slate-400 font-mono mt-0.5">Identificador: <span class="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">${cat.id}</span></p>

                      <!-- Quadras Vinculadas -->
                      <div class="flex items-center flex-wrap gap-1.5 mt-2">
                        ${linkedCourts.length > 0 ? 
                          linkedCourts.map(c => `
                            <span class="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              <span>🏟️</span>
                              <span>${c.name}</span>
                            </span>
                          `).join('') :
                          `<span class="text-[11px] text-amber-600 italic">Nenhuma quadra vinculada ainda</span>`
                        }
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2 self-end sm:self-center shrink-0">
                    <!-- Botão para Editar Modalidade (Nome e Identificador) -->
                    <button onclick="openEditCategoryModal('${cat.id}')" 
                            title="Editar modalidade (nome e identificador)"
                            class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black rounded-xl flex items-center space-x-1 transition-all cursor-pointer shadow-xs">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-600"></i>
                      <span>Editar</span>
                    </button>

                    <button onclick="openCourtWithCategory('${cat.id}')" 
                            title="Cadastrar nova quadra nesta categoria"
                            class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black rounded-xl flex items-center space-x-1 transition-all cursor-pointer">
                      <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                      <span>Nova Quadra</span>
                    </button>

                    <button onclick="deleteCategory('${cat.id}', false)" 
                            title="Excluir Categoria"
                            class="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all border border-transparent hover:border-rose-200 cursor-pointer">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

    </div>
  `;
}

function openCourtWithCategory(catId) {
  openCourtModal();
  setTimeout(() => {
    const select = document.getElementById('courtCategory');
    if (select) select.value = catId;
  }, 60);
}

function renderAdminSubTabContent(tab) {
  if (tab === 'bookings') {
    return renderAdminBookingsSubTab();
  }
  if (tab === 'categories') {
    return renderAdminCategoriesTab();
  }
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
    let localCusts = [];
    try { localCusts = JSON.parse(localStorage.getItem('arena_customers') || '[]'); } catch (e) {}

    const mapByPhone = new Map();

    function mergeCustomerIntoMap(rawCust, isHighPriority = false) {
      if (!rawCust || !rawCust.phone) return;
      const clean = String(rawCust.phone).replace(/\D/g, '');
      if (!clean) return;
      const norm = normalizeCustomer(rawCust);
      if (!norm) return;

      if (!mapByPhone.has(clean)) {
        mapByPhone.set(clean, norm);
        return;
      }

      const existing = mapByPhone.get(clean);
      const mergedCpf = isHighPriority ? (norm.cpf || existing.cpf) : (existing.cpf || norm.cpf);
      const mergedEmerg = isHighPriority ? (norm.emergency_contact || existing.emergency_contact) : (existing.emergency_contact || norm.emergency_contact);
      const mergedHealth = isHighPriority
        ? ((norm.health_notes && norm.health_notes !== 'Nenhuma restrição informada') ? norm.health_notes : (existing.health_notes || norm.health_notes))
        : ((existing.health_notes && existing.health_notes !== 'Nenhuma restrição informada') ? existing.health_notes : (norm.health_notes || existing.health_notes));
      const mergedBirth = isHighPriority ? (norm.birth_date || existing.birth_date) : (existing.birth_date || norm.birth_date);
      const mergedEmail = isHighPriority ? (norm.email || existing.email) : (existing.email || norm.email);
      const mergedName = isHighPriority ? (norm.name || existing.name) : (existing.name || norm.name);

      mapByPhone.set(clean, {
        ...existing,
        ...norm,
        id: existing.id || norm.id,
        name: mergedName,
        phone: existing.phone || norm.phone,
        email: mergedEmail,
        cpf: mergedCpf,
        document: mergedCpf,
        emergency_contact: mergedEmerg,
        emergencyContact: mergedEmerg,
        health_notes: mergedHealth,
        healthNotes: mergedHealth,
        birth_date: mergedBirth,
        birthDate: mergedBirth
      });
    }

    // 1. Supabase
    (state.supabaseCustomers || []).forEach(c => mergeCustomerIntoMap(c, false));

    // 2. localStorage
    localCusts.forEach(c => mergeCustomerIntoMap(c, true));

    // 3. Histórico de reservas
    (state.bookings || []).forEach(b => {
      const p = b.customer_phone || b.customerPhone;
      if (p) {
        const parsedObs = parseCustomerFromObservation(b.observation || '');
        mergeCustomerIntoMap({
          id: b.customer_id || b.customerId,
          name: b.customer_name || b.customerName,
          phone: p,
          email: b.customer_email || b.customerEmail || '',
          cpf: b.customer_cpf || b.customerCpf || b.customerCPF || parsedObs.cpf || '',
          emergency_contact: b.emergency_contact || b.emergencyContact || parsedObs.emergency_contact || '',
          health_notes: b.health_notes || b.healthNotes || parsedObs.health_notes || '',
          birth_date: b.birth_date || b.birthDate || ''
        }, false);
      }
    });

    const allCustomers = Array.from(mapByPhone.values()).map(normalizeCustomer);

    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800 flex items-center">
              <i data-lucide="contact" class="w-5 h-5 text-emerald-600 mr-2"></i>
              Base de Clientes & Fichas de Atletas
            </h3>
            <p class="text-xs text-slate-500">Histórico de atletas com cadastro inteligente, CPF, contato de emergência e alertas médicos.</p>
          </div>
          <button onclick="openCustomerModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>+ Cadastrar Cliente</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase font-black text-[10px]">
                <th class="pb-3">Atleta / Peladeiro</th>
                <th class="pb-3">CPF</th>
                <th class="pb-3">WhatsApp</th>
                <th class="pb-3">Contato de Emergência</th>
                <th class="pb-3">Aviso de Saúde</th>
                <th class="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${allCustomers.length === 0 ? `
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400 font-medium">Nenhum cliente cadastrado ainda.</td>
                </tr>
              ` : allCustomers.map(cust => {
                const hasHealthAlert = cust.health_notes && cust.health_notes !== 'Nenhuma restrição informada' && cust.health_notes.trim().toLowerCase() !== 'nenhum';
                const cleanPhone = (cust.phone || '').replace(/\D/g, '');
                return `
                  <tr class="hover:bg-slate-50 transition-all">
                    <td class="py-3">
                      <div class="font-bold text-slate-900">${cust.name}</div>
                      <div class="text-[11px] text-slate-400">${cust.email || 'Sem e-mail'}</div>
                    </td>
                    <td class="py-3 font-mono text-slate-700 font-semibold">${cust.cpf ? formatCPF(cust.cpf) : '<span class="text-slate-300 italic">Não informado</span>'}</td>
                    <td class="py-3 font-mono text-slate-700 font-bold">${formatPhone(cust.phone)}</td>
                    <td class="py-3 text-slate-700 font-medium">
                      ${cust.emergency_contact ? `
                        <span class="inline-flex items-center gap-1 text-slate-800">
                          <i data-lucide="phone-call" class="w-3 h-3 text-rose-500 shrink-0"></i>
                          <span>${cust.emergency_contact}</span>
                        </span>
                      ` : '<span class="text-slate-300 italic">-</span>'}
                    </td>
                    <td class="py-3 max-w-[200px]">
                      ${hasHealthAlert ? `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs" title="${cust.health_notes}">
                          <i data-lucide="alert-triangle" class="w-3 h-3 text-amber-600 shrink-0"></i>
                          <span class="truncate max-w-[150px]">${cust.health_notes}</span>
                        </span>
                      ` : `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
                          <span>Sem restrições</span>
                        </span>
                      `}
                    </td>
                    <td class="py-3 text-right whitespace-nowrap">
                      <button onclick="openCustomerModal('${cust.phone}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg mr-1.5 transition-all">
                        Ficha / Editar
                      </button>
                      <a href="https://wa.me/55${cleanPhone}" target="_blank" class="inline-flex items-center px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded-lg mr-1.5 transition-all">
                        WhatsApp
                      </a>
                      <button onclick="deleteCustomer('${cust.id || cust.phone}', '${encodeURIComponent(cust.name || '')}', '${cust.phone}')" class="inline-flex items-center px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] rounded-lg transition-all" title="Remover atleta da base">
                        <i data-lucide="trash-2" class="w-3 h-3 mr-1 text-rose-500"></i>
                        <span>Excluir</span>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (tab === 'spaces') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800">Espaços e Quadras Disponíveis</h3>
            <p class="text-xs text-slate-500">Configure nomes, valores por hora, planos mensalistas e fotos das quadras</p>
          </div>
          <div class="flex items-center flex-wrap gap-2">
            <button onclick="setAdminTab('categories')" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow">
              <i data-lucide="tag" class="w-4 h-4 text-emerald-400"></i>
              <span>Gerenciar Categorias</span>
            </button>
            <button onclick="openCourtModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Cadastrar Novo Espaço</span>
            </button>
          </div>
        </div>

        <!-- Filtros de Categoria na Gestão -->
        <div class="flex items-center space-x-2 overflow-x-auto scrollbar-none mb-6 pb-2 border-b border-slate-100">
          ${(state.categories || []).map(cat => `
            <button onclick="setAdminCategoryFilter('${cat.id}')" 
                    class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all
                           ${(state.adminCategoryFilter || 'all') === cat.id ? 
                             'bg-emerald-700 text-white shadow' : 
                             'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}">
              <i data-lucide="${cat.icon || 'tag'}" class="w-3.5 h-3.5"></i>
              <span>${cat.name}</span>
            </button>
          `).join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${(state.adminCategoryFilter && state.adminCategoryFilter !== 'all' ? state.courts.filter(c => c.category === state.adminCategoryFilter) : state.courts).map(court => `
            <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
              <div>
                <img src="${court.image}" class="h-40 w-full object-cover">
                <div class="p-4">
                  <span class="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">${court.categoryLabel || 'Esporte'}</span>
                  <h4 class="text-base font-black text-slate-900 mt-1">${court.name}</h4>
                  <p class="text-xs text-slate-500 line-clamp-2 mt-1">${court.description || 'Sem descrição'}</p>
                  <div class="mt-2 flex items-center justify-between flex-wrap gap-1">
                    <span class="text-sm font-black text-emerald-700">R$ ${(court.basePricePerHour || court.base_price_per_hour || 140).toFixed(2).replace('.', ',')}/h (Normal)</span>
                    ${(() => {
                      const dInfo = getCourtDiscountInfo(court);
                      return dInfo.hasDiscount ? `
                        <span class="text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md">
                          🔥 ${dInfo.startHour}-${dInfo.endHour}: R$ ${dInfo.discountPrice.toFixed(2).replace('.', ',')}/h
                        </span>
                      ` : '';
                    })()}
                  </div>
                </div>
              </div>
              <div class="p-4 pt-0 flex space-x-2">
                <button onclick="openCourtModal('${court.id}')" class="flex-1 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1">
                  <i data-lucide="edit" class="w-3.5 h-3.5 text-emerald-400"></i>
                  <span>Editar</span>
                </button>
                <button onclick="deleteCourt('${court.id}')" title="Excluir Quadra" class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center transition-all">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
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
          <h3 class="text-base font-black text-slate-800">Contratos de Horários Fixos (Mensalistas)</h3>
          <button onclick="openMonthlyModal()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">+ Novo Horário Fixo</button>
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

  if (tab === 'audit_logs') {
    return renderSystemAuditLogsTab();
  }

  if (tab === 'users') {
    const isMasterAdmin = (state.currentUser?.role || 'Administrador Geral') === 'Administrador Geral';
    if (!isMasterAdmin) {
      return `
        <div class="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-black text-slate-900">Acesso Restrito</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">Esta área de gestão de acessos é exclusiva do Administrador Geral (Gabriel Alves).</p>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-1.5 rounded-lg bg-emerald-100 text-emerald-800"><i data-lucide="shield-check" class="w-5 h-5"></i></span>
              <h3 class="text-base sm:text-lg font-black text-slate-900">Gestores e Acessos Administrativos</h3>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Gerencie os usuários autorizados a acessar e modificar o sistema da Arena Limoeiro</p>
          </div>
          <button onclick="openNewAdminUserModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md transition-all cursor-pointer">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>+ Novo Gestor</span>
          </button>
        </div>
        
        <div class="space-y-3">
          ${(state.adminUsers || []).map(u => {
            const isMaster = u.email === 'admin@arenalimoeiro.com.br' || u.role === 'Administrador Geral';
            const uName = (u.name && u.name !== 'Administrador Geral') ? u.name : (u.email === 'admin@arenalimoeiro.com.br' ? 'Gabriel Alves' : u.name);
            const canDel = userHasPermission(u, 'can_delete_bookings');
            const activeCount = SYSTEM_PERMISSIONS.filter(p => userHasPermission(u, p.id)).length;
            const isRecep = (u.role || '').toLowerCase().includes('recep');

            return `
              <div class="p-4 sm:p-5 border ${isMaster ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-300/50' : 'border-slate-200 bg-white'} rounded-2xl sm:rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs transition-all hover:border-slate-300">
                <div class="flex items-start space-x-3.5">
                  <div class="w-11 h-11 rounded-2xl ${isMaster ? 'bg-emerald-600 text-white shadow-md' : (isRecep ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700')} flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <i data-lucide="${isMaster ? 'crown' : (isRecep ? 'headphones' : 'shield-check')}" class="w-5 h-5"></i>
                  </div>
                  <div class="space-y-1.5">
                    <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 class="text-sm sm:text-base font-black text-slate-900">${uName}</h4>
                      <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full ${isMaster ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}">
                        ${u.role || 'Gerente do Sistema'}
                      </span>
                      
                      ${isMaster ? `
                        <span class="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                          👑 Acesso Total Irrestrito
                        </span>
                      ` : ''}

                      <span class="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        ${activeCount}/12 permissões
                      </span>
                    </div>

                    <p class="text-xs text-slate-500 flex items-center flex-wrap gap-2 pt-0.5">
                      <span><strong>E-mail:</strong> <code class="text-slate-800 font-mono font-bold">${u.email}</code></span>
                      <span class="text-slate-300">•</span>
                      <span><strong>Senha:</strong> <code class="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono font-bold">${u.password}</code></span>
                    </p>

                    <!-- Resumo das permissões ativas em badges compactas -->
                    <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                      ${userHasPermission(u, 'can_delete_bookings') ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Apagar Jogos</span>` : ''}
                      ${userHasPermission(u, 'can_start_matches') ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Liberar Jogos</span>` : ''}
                      ${userHasPermission(u, 'can_manage_bar') ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Bar & Comanda</span>` : ''}
                      ${userHasPermission(u, 'can_edit_courts') ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Quadras</span>` : ''}
                      ${userHasPermission(u, 'can_manage_customers') ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Clientes</span>` : ''}
                      ${userHasPermission(u, 'can_manage_monthly') ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Mensalistas</span>` : ''}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 self-end lg:self-center shrink-0">
                  <button onclick="copyCredentialsDirect('${(u.name || uName).replace(/'/g, "\\'")}', '${u.role || 'Gerente'}', '${u.email}', '${u.password}')" 
                          class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs" 
                          title="Copiar dados de login para o WhatsApp">
                    <i data-lucide="copy" class="w-3.5 h-3.5 text-slate-600"></i>
                    <span>Copiar</span>
                  </button>

                  <button onclick="openEditAdminUserModal('${u.id}')" 
                          class="px-3 py-2 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs" 
                          title="Modificar nome, cargo, permissões e senha">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span>Editar</span>
                  </button>

                  ${isMaster ? `
                    <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1">
                      👑 Proprietário
                    </span>
                  ` : `
                    <button onclick="deleteAdminUser('${u.id}')" 
                            class="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs" 
                            title="Excluir este acesso">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      <span>Excluir</span>
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
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

// ==============================================================================
// ABA EXCLUSIVA DE AUDITORIA E LOGS DO SISTEMA (MOBILE & PC) - GABRIEL ALVES
// ==============================================================================
function renderSystemAuditLogsTab() {
  const isMasterAdmin = (state.currentUser?.role || 'Administrador Geral') === 'Administrador Geral' || (state.currentUser?.email === 'admin@arenalimoeiro.com.br');
  if (!isMasterAdmin) {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs">
        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="lock" class="w-6 h-6"></i>
        </div>
        <h3 class="text-base font-black text-slate-900">Acesso Restrito</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">Esta área de logs de auditoria e movimentações do sistema é confidencial e exclusiva do Administrador Geral (Gabriel Alves).</p>
      </div>
    `;
  }

  const logs = state.systemLogs || [];
  const q = (state.systemLogsSearchQuery || '').toLowerCase().trim();
  const currentFilter = state.systemLogsFilter || 'all';

  // Métricas
  const totalLogs = logs.length;
  const deleteCount = logs.filter(l => l.actionType === 'DELETE_BOOKING').length;
  const bookingCount = logs.filter(l => l.actionType === 'CREATE_BOOKING').length;
  const mobileCount = logs.filter(l => l.isMobile).length;
  const pcCount = logs.filter(l => !l.isMobile).length;

  // Filtragem
  const filteredLogs = logs.filter(l => {
    // 1. Filtro por tipo
    if (currentFilter === 'delete' && l.actionType !== 'DELETE_BOOKING') return false;
    if (currentFilter === 'booking' && l.actionType !== 'CREATE_BOOKING') return false;
    if (currentFilter === 'match' && !['START_MATCH', 'FINISH_MATCH'].includes(l.actionType)) return false;
    if (currentFilter === 'mobile' && !l.isMobile) return false;
    if (currentFilter === 'pc' && l.isMobile) return false;

    // 2. Busca por texto (em todos os campos)
    if (q) {
      const matchText = [
        l.userName,
        l.userRole,
        l.details,
        l.courtName,
        l.actionLabel,
        l.dateStr,
        l.timeStr,
        l.deviceType,
        l.isMobile ? 'mobile celular' : 'pc computador desktop'
      ].filter(Boolean).join(' ').toLowerCase();

      return matchText.includes(q);
    }

    return true;
  });

  return `
    <div class="space-y-6">
      <!-- Cabeçalho de Auditoria -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div class="space-y-1">
            <div class="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span class="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
                <i data-lucide="shield-alert" class="w-5 h-5"></i>
              </span>
              <h3 class="text-base sm:text-xl font-black text-slate-900 tracking-tight">Logs e Auditoria do Sistema</h3>
              <span class="text-[10px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                👑 Exclusivo Administrador Geral
              </span>
            </div>
            <p class="text-xs sm:text-sm text-slate-500">
              Rastreamento em tempo real de todas as movimentações: quem adicionou ou apagou jogos, cadastros, horários, qual quadra e se foi via Mobile ou Computador.
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="openClearLogsConfirmModal()" 
                    class="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                    title="Apagar todos os registros de log para começar do zero">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
              <span>Zerar Registros (Começar do Zero)</span>
            </button>
          </div>
        </div>

        <!-- Indicadores Resumidos (KPIs) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total de Ações</span>
            <div class="flex items-baseline gap-1 mt-0.5">
              <span class="text-xl font-black text-slate-900">${totalLogs}</span>
              <span class="text-[10px] text-slate-400 font-bold">registros</span>
            </div>
          </div>

          <div class="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl">
            <span class="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Jogos Excluídos</span>
            <div class="flex items-baseline gap-1 mt-0.5">
              <span class="text-xl font-black text-rose-700">${deleteCount}</span>
              <span class="text-[10px] text-rose-500 font-bold">cancelamentos</span>
            </div>
          </div>

          <div class="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Agendamentos</span>
            <div class="flex items-baseline gap-1 mt-0.5">
              <span class="text-xl font-black text-emerald-700">${bookingCount}</span>
              <span class="text-[10px] text-emerald-500 font-bold">criados</span>
            </div>
          </div>

          <div class="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl">
            <span class="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">Dispositivos</span>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <span class="text-xs font-black text-sky-800">📱 ${mobileCount} Mobile</span>
              <span class="text-slate-300">•</span>
              <span class="text-xs font-black text-slate-800">💻 ${pcCount} PC</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de Pesquisa e Filtros Rápidos -->
      <div class="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input type="text" 
                 id="systemLogsSearchInput"
                 value="${state.systemLogsSearchQuery || ''}"
                 oninput="handleSystemLogsSearch(this.value)"
                 placeholder="Pesquisar por quem fez, cliente, quadra, ação, data, mobile ou pc..." 
                 class="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all">
          ${state.systemLogsSearchQuery ? `
            <button onclick="handleSystemLogsSearch('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          ` : ''}
        </div>

        <!-- Filtros Rápidos Tipo Pílula -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button onclick="setSystemLogsFilter('all')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${currentFilter === 'all' ? 'bg-slate-900 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            Todos (${totalLogs})
          </button>
          <button onclick="setSystemLogsFilter('delete')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${currentFilter === 'delete' ? 'bg-rose-600 text-white font-black shadow-xs' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'}">
            🗑️ Exclusões (${deleteCount})
          </button>
          <button onclick="setSystemLogsFilter('booking')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${currentFilter === 'booking' ? 'bg-emerald-600 text-white font-black shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'}">
            ⚽ Agendamentos (${bookingCount})
          </button>
          <button onclick="setSystemLogsFilter('match')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${currentFilter === 'match' ? 'bg-indigo-600 text-white font-black shadow-xs' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'}">
            ⚡ Partidas
          </button>
          <button onclick="setSystemLogsFilter('mobile')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${currentFilter === 'mobile' ? 'bg-sky-600 text-white font-black shadow-xs' : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/60'}">
            📱 Mobile (${mobileCount})
          </button>
          <button onclick="setSystemLogsFilter('pc')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${currentFilter === 'pc' ? 'bg-slate-800 text-white font-black shadow-xs' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}">
            💻 PC (${pcCount})
          </button>
        </div>

        <div class="text-[11px] text-slate-500 font-bold px-1 flex items-center justify-between">
          <span>Exibindo <strong>${filteredLogs.length}</strong> de ${totalLogs} registros</span>
          ${q ? `<span class="text-amber-700 font-black">Filtro de busca: "${q}"</span>` : ''}
        </div>
      </div>

      <!-- Lista de Registros de Auditoria -->
      <div class="space-y-3">
        ${filteredLogs.length === 0 ? `
          <div class="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="clipboard-list" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-black text-slate-800">Nenhum registro encontrado</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              ${q || currentFilter !== 'all' ? 'Tente limpar a pesquisa ou selecionar outro filtro acima.' : 'As movimentações realizadas no sistema (exclusões, novos agendamentos, etc.) aparecerão aqui automaticamente em tempo real.'}
            </p>
          </div>
        ` : filteredLogs.map(log => {
          const isDelete = log.actionType === 'DELETE_BOOKING';
          const isCreate = log.actionType === 'CREATE_BOOKING';
          const isMatch = ['START_MATCH', 'FINISH_MATCH'].includes(log.actionType);

          const badgeBg = isDelete ? 'bg-rose-100 text-rose-800 border-rose-300' : (isCreate ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (isMatch ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-slate-100 text-slate-700 border-slate-300'));
          const iconName = isDelete ? 'trash-2' : (isCreate ? 'calendar-plus' : (log.actionType === 'START_MATCH' ? 'play' : (log.actionType === 'FINISH_MATCH' ? 'check-circle' : 'activity')));

          return `
            <div class="bg-white border ${isDelete ? 'border-rose-200/90 hover:border-rose-300' : 'border-slate-200 hover:border-slate-300'} rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div class="flex items-start space-x-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl ${isDelete ? 'bg-rose-100 text-rose-700' : (isCreate ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700')} flex items-center justify-center shrink-0 font-bold shadow-xs">
                    <i data-lucide="${iconName}" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span class="text-sm font-black text-slate-900">${log.userName}</span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        ${log.userRole || 'Operador'}
                      </span>
                      <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${log.isMobile ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-slate-100 text-slate-800 border border-slate-300'}">
                        ${log.deviceType || (log.isMobile ? '📱 Mobile' : '💻 PC')}
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span><i data-lucide="clock" class="w-3 h-3 inline mr-0.5 text-slate-400"></i> ${log.dateStr} às ${log.timeStr}</span>
                      <span class="text-slate-300">•</span>
                      <span class="font-bold text-slate-700"><i data-lucide="map-pin" class="w-3 h-3 inline mr-0.5 text-emerald-600"></i> ${log.courtName || 'Quadra'}</span>
                    </div>
                  </div>
                </div>

                <div class="shrink-0">
                  <span class="text-[11px] font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 ${badgeBg}">
                    ${log.actionLabel}
                  </span>
                </div>
              </div>

              <!-- Detalhes do Registro -->
              <div class="pt-3">
                <p class="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  ${log.details}
                </p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function handleSystemLogsSearch(query) {
  state.systemLogsSearchQuery = query;
  renderStepContent();
  if (window.lucide) lucide.createIcons();
}
window.handleSystemLogsSearch = handleSystemLogsSearch;

function setSystemLogsFilter(filter) {
  state.systemLogsFilter = filter;
  renderStepContent();
  if (window.lucide) lucide.createIcons();
}
window.setSystemLogsFilter = setSystemLogsFilter;

function openClearLogsConfirmModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-200">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <i data-lucide="alert-triangle" class="w-6 h-6"></i>
        </div>

        <div class="text-center space-y-1">
          <h3 class="text-lg font-black text-slate-900">Zerar Todos os Logs do Sistema?</h3>
          <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Esta ação apagará <strong>permanentemente</strong> todo o histórico de execuções gravadas até o momento.
          </p>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-bold text-left mt-2">
            💡 <strong>Dica:</strong> Use esta opção para limpar todos os registros de teste e começar o log do zero com o histórico limpo quando o sistema estiver 100% pronto.
          </div>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button onclick="closeModal()" class="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
            Cancelar
          </button>
          <button onclick="confirmClearSystemLogs()" class="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer">
            Sim, Zerar Tudo do Zero
          </button>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}
window.openClearLogsConfirmModal = openClearLogsConfirmModal;

function confirmClearSystemLogs() {
  state.systemLogs = [];
  try {
    localStorage.removeItem('arena_system_logs');
  } catch(e) {}

  if (window.ArenaSupabase && window.ArenaSupabase.broadcastClearLogs) {
    window.ArenaSupabase.broadcastClearLogs();
  }
  if (window.arenaSyncChannel) {
    try { window.arenaSyncChannel.postMessage({ type: 'clear_logs' }); } catch(e) {}
  }

  closeModal();
  renderStepContent();
  if (window.lucide) lucide.createIcons();

  alert('✓ Registros de auditoria zerados com sucesso! O histórico começará do zero a partir de agora.');
}
window.confirmClearSystemLogs = confirmClearSystemLogs;
window.renderSystemAuditLogsTab = renderSystemAuditLogsTab;

// ==============================================================================
// ABA DEDICADA DE GESTÃO DE AGENDAMENTOS NO PAINEL ADMIN (APAGAR E GERENCIAR JOGOS)
// ==============================================================================
function renderSubtabBookingsItems(bookings) {
  const isRecep = isReceptionUser();
  if (!bookings || bookings.length === 0) {
    return `
      <div class="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <i data-lucide="calendar-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
        <p class="text-sm font-bold text-slate-700">Nenhum agendamento encontrado com os filtros selecionados.</p>
        <p class="text-xs text-slate-400 mt-0.5">Tente alterar o termo pesquisado ou limpe os filtros de quadra/status.</p>
      </div>
    `;
  }

  return bookings.map(b => {
    const court = (state.courts || []).find(c => c.id === (b.court_id || b.courtId)) || { name: 'Quadra Esportiva' };
    const cleanPhone = (b.customer_phone || '').replace(/\D/g, '');
    const zapMsg = `Olá ${b.customer_name || 'Cliente'}! Falamos da Arena Limoeiro sobre o seu jogo no dia ${formatDisplayDate(b.date)} (${b.time || b.start_time}) na quadra ${court.name}.`;
    const zapUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(zapMsg)}`;

    let statusBadge = '';
    if (b.status === 'in_progress' || b.status === 'live') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">🟢 Em Andamento</span>';
    } else if (b.status === 'finished') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">✅ Finalizado</span>';
    } else if (b.status === 'cancelled') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">❌ Cancelado</span>';
    } else {
      statusBadge = '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔵 Agendado</span>';
    }

    const price = Number(b.total_price || 0).toFixed(2).replace('.', ',');
    const timeDisplay = b.time || `${b.start_time || '19:00'} às ${b.end_time || '20:00'}`;

    return `
      <div class="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        
        <!-- Bloco de Informações do Jogo -->
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
              🏟️ ${court.name}
            </span>
            <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 flex items-center gap-1">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
              ${formatDisplayDate(b.date)} • ${timeDisplay}
            </span>
            ${statusBadge}
          </div>

          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-700">
            <div class="flex items-center space-x-1 font-black text-slate-900">
              <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>${b.customer_name || 'Cliente'}</span>
            </div>
            ${b.customer_cpf ? `
              <span class="font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-600">
                CPF: ${formatCPF(b.customer_cpf)}
              </span>
            ` : ''}
            ${cleanPhone ? `
              <a href="${zapUrl}" target="_blank" class="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 hover:underline">
                <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>${formatPhone(b.customer_phone)}</span>
              </a>
            ` : ''}
            <span class="font-black text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded">
              R$ ${price} (${(b.payment_method || 'PIX').toUpperCase()})
            </span>
          </div>
        </div>

        <!-- Botões de Ação do Jogo -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          <button onclick="goToMatchDate('${b.date}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs" title="Ver este jogo na movimentação do dia">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Ver no Dia</span>
          </button>
          
          <button onclick="openAddBarItemsModal('${b.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs" title="Comanda do Bar para este jogo">
            <i data-lucide="beer" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Comanda</span>
          </button>

          ${canDeleteBookings() ? `
            <button onclick="handleCancelBooking('${b.id}')" class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs touch-manipulation" title="Apagar este jogo do sistema e liberar o horário imediatamente">
              <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-600"></i>
              <span>Apagar Jogo</span>
            </button>
          ` : ''}
        </div>

      </div>
    `;
  }).join('');
}

function filterSubtabBookingsList() {
  const searchEl = document.getElementById('subtabBookingSearchInput');
  const courtEl = document.getElementById('subtabBookingCourtFilter');
  const statusEl = document.getElementById('subtabBookingStatusFilter');
  const container = document.getElementById('subtabBookingsListContainer');
  if (!container) return;

  const query = (searchEl ? searchEl.value : '').toLowerCase().trim();
  const courtFilter = courtEl ? courtEl.value : 'all';
  const statusFilter = statusEl ? statusEl.value : 'all';

  let list = [...(state.bookings || [])];

  list.sort((a, b) => {
    if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
    const aTime = a.start_time || (a.time ? a.time.split(' ')[0] : '00:00');
    const bTime = b.start_time || (b.time ? b.time.split(' ')[0] : '00:00');
    return aTime.localeCompare(bTime);
  });

  if (courtFilter !== 'all') {
    list = list.filter(b => (b.court_id || b.courtId) === courtFilter);
  }

  if (statusFilter !== 'all') {
    if (statusFilter === 'live') {
      list = list.filter(b => b.status === 'in_progress' || b.status === 'live');
    } else if (statusFilter === 'upcoming') {
      list = list.filter(b => b.status !== 'in_progress' && b.status !== 'live' && b.status !== 'finished' && b.status !== 'cancelled');
    } else {
      list = list.filter(b => b.status === statusFilter);
    }
  }

  if (query) {
    list = list.filter(b => {
      const name = (b.customer_name || '').toLowerCase();
      const phone = (b.customer_phone || '').replace(/\D/g, '');
      const cpf = (b.customer_cpf || '').replace(/\D/g, '');
      const court = ((state.courts || []).find(c => c.id === (b.court_id || b.courtId))?.name || '').toLowerCase();
      const date = (b.date || '').toLowerCase();
      return name.includes(query) || phone.includes(query) || cpf.includes(query) || court.includes(query) || date.includes(query);
    });
  }

  container.innerHTML = renderSubtabBookingsItems(list);
  if (window.lucide) lucide.createIcons();
}
window.filterSubtabBookingsList = filterSubtabBookingsList;

function renderAdminBookingsSubTab() {
  const isRecep = isReceptionUser();
  const allBookings = [...(state.bookings || [])];

  allBookings.sort((a, b) => {
    if (a.date !== b.date) {
      return (b.date || '').localeCompare(a.date || '');
    }
    const aTime = a.start_time || (a.time ? a.time.split(' ')[0] : '00:00');
    const bTime = b.start_time || (b.time ? b.time.split(' ')[0] : '00:00');
    return aTime.localeCompare(bTime);
  });

  const todayStr = getFormattedDate(new Date());
  const bookingsToday = allBookings.filter(b => b.date === todayStr && b.status !== 'cancelled');
  const upcomingBookings = allBookings.filter(b => b.date >= todayStr && b.status !== 'cancelled' && b.status !== 'finished');
  const finishedBookings = allBookings.filter(b => b.status === 'finished');

  return `
    <div class="space-y-6">
      
      <!-- Cabeçalho explicativo -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shrink-0">
              <i data-lucide="calendar-check" class="w-6 h-6 text-emerald-300"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Gestão de Jogos</span>
                <span class="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">${allBookings.length} partidas registradas</span>
              </div>
              <h3 class="text-xl font-black text-slate-900 mt-1">Todos os Agendamentos & Jogos Marcados</h3>
              <p class="text-xs text-slate-500">Visualize todas as reservas da arena, pesquise por cliente ou quadra e apague jogos com liberação imediata do horário.</p>
            </div>
          </div>

          <div class="w-full sm:w-auto flex items-center justify-center">
            <button onclick="openDirectBookingModal()" title="Fazer Nova Reserva Direta" class="w-full sm:w-auto justify-center text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4 text-emerald-200 shrink-0"></i>
              <span>+ Nova Reserva Balcão</span>
            </button>
          </div>
        </div>

        <!-- Métricas Rápidas -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total de Reservas</span>
            <div class="text-xl font-black text-slate-900 mt-0.5">${allBookings.length}</div>
          </div>
          <div class="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Jogos Hoje</span>
            <div class="text-xl font-black text-emerald-800 mt-0.5">${bookingsToday.length}</div>
          </div>
          <div class="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
            <span class="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Próximos / Ativos</span>
            <div class="text-xl font-black text-blue-800 mt-0.5">${upcomingBookings.length}</div>
          </div>
          <div class="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
            <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Finalizados</span>
            <div class="text-xl font-black text-amber-800 mt-0.5">${finishedBookings.length}</div>
          </div>
        </div>
      </div>

      <!-- Filtros e Barra de Pesquisa -->
      <div class="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-3">
          
          <!-- Input Busca -->
          <div class="relative w-full md:w-96">
            <input type="text" id="subtabBookingSearchInput" oninput="filterSubtabBookingsList()" placeholder="Buscar por cliente, telefone, CPF ou quadra..."
                   class="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          </div>

          <!-- Filtros de Quadra e Status -->
          <div class="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
            <select id="subtabBookingCourtFilter" onchange="filterSubtabBookingsList()" class="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
              <option value="all">🏟️ Todas as Quadras</option>
              ${state.courts.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>

            <select id="subtabBookingStatusFilter" onchange="filterSubtabBookingsList()" class="p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
              <option value="all">Todos os Status</option>
              <option value="upcoming">🔵 Agendados</option>
              <option value="live">🟢 Em Andamento</option>
              <option value="finished">✅ Finalizados</option>
              <option value="cancelled">❌ Cancelados</option>
            </select>
          </div>

        </div>

        <!-- Lista de Jogos Filtrável -->
        <div id="subtabBookingsListContainer" class="space-y-3">
          ${renderSubtabBookingsItems(allBookings)}
        </div>

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
  court.status = inMaintenance ? 'maintenance' : 'active';
  court.specs.status = inMaintenance ? 'maintenance' : 'Disponível';
  court.specs.maintenance_reason = inMaintenance ? reason : '';
  if (!inMaintenance) {
    court.specs.maintenance_notice = '';
    court.maintenance_notice = '';
  }

  // Atualiza no estado e no localStorage
  const courtIdx = state.courts.findIndex(c => c.id === courtId);
  if (courtIdx !== -1) {
    state.courts[courtIdx] = normalizeCourt({ ...court });
  }
  localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));

  // Re-renderiza imediatamente a interface
  _refreshAllUI();

  // Salva no Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').update({ specs: court.specs }).eq('id', courtId);
    } catch(err) {
      console.warn('Erro ao atualizar manutenção no Supabase:', err);
    }
  }

  // Transmite via Broadcast para TODOS os outros aparelhos atualizarem instantaneamente
  if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
    window.ArenaSupabase.broadcastCourtUpdate(court);
  }

  showToastNotification(inMaintenance ? `
    <h5 class="font-black text-white text-xs mb-0.5">⚠️ Quadra Interditada</h5>
    <p class="text-rose-300 font-bold">${court.name} foi colocada em manutenção geral.</p>
  ` : `
    <h5 class="font-black text-white text-xs mb-0.5">✓ Quadra Liberada com Sucesso!</h5>
    <p class="text-emerald-300 font-bold">${court.name} está 100% livre e disponível para jogos.</p>
  `, 3500);
}

// ⚠️ MODAL DE AVISO PRÉVIO DE MANUTENÇÃO (POSSIBILIDADE DE MANUTENÇÃO)
function openMaintenanceNoticeModal(courtId) {
  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const specs = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
  const currentNotice = specs.maintenance_notice || court.maintenance_notice || '';

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <div class="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/30 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase tracking-tight">Aviso Prévio de Manutenção</h3>
              <p class="text-xs text-amber-300 font-medium">${court.name}</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-amber-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleSaveMaintenanceNotice(event, '${court.id}')" class="p-6 space-y-4 overflow-y-auto">
          
          <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <p class="font-bold flex items-center mb-1">
              <i data-lucide="info" class="w-4 h-4 mr-1.5 text-amber-700"></i>
              Como funciona o Aviso Prévio:
            </p>
            <p class="text-[11px] text-amber-800">
              O aviso prévio sinaliza para clientes e recepcionistas que há <strong>possibilidade de manutenção ou reparo técnico</strong> nesta quadra, sem bloquear o agendamento caso você queira deixá-lo visível.
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Escolha um motivo rápido:</label>
            <div class="flex flex-wrap gap-1.5">
              <button type="button" onclick="setMaintenanceNoticePreset('Possibilidade de reparo técnico / manutenção preventiva neste espaço.')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                🛠️ Reparo Técnico Preventivo
              </button>
              <button type="button" onclick="setMaintenanceNoticePreset('Possibilidade de manutenção na iluminação e refletores.')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                💡 Refletores / Iluminação
              </button>
              <button type="button" onclick="setMaintenanceNoticePreset('Manutenção e nivelamento programado da grama sintética.')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                🌱 Grama / Piso
              </button>
              <button type="button" onclick="setMaintenanceNoticePreset('Possibilidade de manutenção periódica nesta quadra.')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                ⚠️ Manutenção Periódica
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Texto do Aviso Prévio (Visível para todos):</label>
            <textarea id="maintenanceNoticeText" rows="3" required placeholder="Ex: Possibilidade de manutenção preventiva nos próximos dias/horários..." class="w-full p-3 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none">${currentNotice}</textarea>
          </div>

          <div class="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
            ${currentNotice ? `
              <button type="button" onclick="handleRemoveMaintenanceNotice('${court.id}')" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Remover Aviso</span>
              </button>
            ` : '<div></div>'}

            <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
                Cancelar
              </button>
              <button type="submit" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Ativar Aviso Prévio</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function setMaintenanceNoticePreset(text) {
  const txt = document.getElementById('maintenanceNoticeText');
  if (txt) txt.value = text;
}

async function handleSaveMaintenanceNotice(e, courtId) {
  e.preventDefault();
  const text = document.getElementById('maintenanceNoticeText').value.trim();
  closeModal();

  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  if (typeof court.specs === 'string') {
    try { court.specs = JSON.parse(court.specs || '{}'); } catch(e) { court.specs = {}; }
  } else if (!court.specs) {
    court.specs = {};
  }

  court.specs.maintenance_notice = text;
  court.maintenance_notice = text;

  // Atualiza no estado local e localStorage
  const idx = state.courts.findIndex(c => c.id === courtId);
  if (idx !== -1) {
    state.courts[idx] = normalizeCourt({ ...court });
  }
  localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));

  _refreshAllUI();

  // Salva no Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').update({ specs: court.specs }).eq('id', courtId);
    } catch(err) {
      console.warn('Erro ao atualizar aviso prévio no Supabase:', err);
    }
  }

  // Transmite via Broadcast instantâneo
  if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
    window.ArenaSupabase.broadcastCourtUpdate(court);
  }

  showToastNotification(`
    <h5 class="font-black text-white text-xs mb-0.5">⚠️ Aviso Prévio Ativado</h5>
    <p class="text-amber-300 font-bold">${court.name}: ${text}</p>
  `, 4000);
}

async function handleRemoveMaintenanceNotice(courtId) {
  closeModal();
  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  if (typeof court.specs === 'string') {
    try { court.specs = JSON.parse(court.specs || '{}'); } catch(e) { court.specs = {}; }
  } else if (!court.specs) {
    court.specs = {};
  }

  court.specs.maintenance_notice = '';
  court.maintenance_notice = '';

  const idx = state.courts.findIndex(c => c.id === courtId);
  if (idx !== -1) {
    state.courts[idx] = normalizeCourt({ ...court });
  }
  localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));

  _refreshAllUI();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').update({ specs: court.specs }).eq('id', courtId);
    } catch(err) {
      console.warn('Erro ao remover aviso prévio no Supabase:', err);
    }
  }

  if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
    window.ArenaSupabase.broadcastCourtUpdate(court);
  }

  showToastNotification(`
    <h5 class="font-black text-white text-xs mb-0.5">✓ Aviso Removido</h5>
    <p class="text-emerald-300 font-bold">${court.name} está operando normalmente sem avisos.</p>
  `, 3500);
}

// ==============================================================================
// ⭐ MODAL DE DESTAQUE / BADGE DA QUADRA (MANUAL OU AUTOMÁTICO)
// ==============================================================================
function openCourtBadgeModal(courtId) {
  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const specs = typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {});
  const currentMode = specs.badge_mode || court.badge_mode || (court.badge ? 'manual' : 'none');
  const currentText = specs.badge_text !== undefined ? specs.badge_text : (court.badge || '');
  const currentAutoFreq = specs.badge_auto_freq || court.badge_auto_freq || 'weekly';
  const displayNow = getCourtDisplayBadge(court);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <i data-lucide="sparkles" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase tracking-tight">Selo de Destaque & Marketing</h3>
              <p class="text-xs text-emerald-200 font-medium">${court.name}</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleSaveCourtBadge(event, '${court.id}')" class="p-6 space-y-4 overflow-y-auto">
          
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
            <p class="font-bold flex items-center mb-1 text-slate-900">
              <i data-lucide="info" class="w-4 h-4 mr-1.5 text-emerald-600"></i>
              Como funciona o Selo de Destaque:
            </p>
            <p class="text-[11px] text-slate-600 leading-relaxed">
              O selo aparece no topo da foto do campo no site para chamar atenção e gerar desejo de alugar. Você pode deixar <strong>Sem Destaque</strong>, ativar o modo <strong>Automático</strong> (calculado pelos jogos reais da semana ou do dia) ou escolher um selo <strong>Manual</strong>.
            </p>
          </div>

          <!-- Escolha do Modo -->
          <div class="space-y-2.5">
            <label class="block text-xs font-bold text-slate-700 uppercase">Escolha a Opção do Selo:</label>
            
            <!-- Opção 1: Sem Destaque -->
            <label class="flex items-start p-3 rounded-2xl border ${currentMode === 'none' ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer transition-all">
              <input type="radio" name="badgeMode" value="none" ${currentMode === 'none' ? 'checked' : ''} 
                     onchange="toggleBadgeModeControls('none')" class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
              <div class="ml-3 text-xs">
                <span class="font-black text-slate-800 block">⚪ Sem Destaque (Quadra Limpa)</span>
                <span class="text-[11px] text-slate-500">Nenhum selo será exibido no card desta quadra.</span>
              </div>
            </label>

            <!-- Opção 2: Automático -->
            <label class="flex items-start p-3 rounded-2xl border ${currentMode === 'auto' ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer transition-all">
              <input type="radio" name="badgeMode" value="auto" ${currentMode === 'auto' ? 'checked' : ''} 
                     onchange="toggleBadgeModeControls('auto')" class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
              <div class="ml-3 text-xs flex-1">
                <span class="font-black text-slate-800 block">⚡ Automático (Baseado nos Jogos Reais)</span>
                <span class="text-[11px] text-slate-500">O sistema atualiza o selo sozinho conforme a procura real obtida dos agendamentos.</span>
                
                <div id="badgeAutoOptions" class="${currentMode === 'auto' ? 'mt-2.5' : 'hidden mt-2.5'} pl-1 space-y-1.5 border-t border-slate-100 pt-2">
                  <label class="block text-[11px] font-bold text-slate-700 uppercase">Período de Comparação:</label>
                  <select name="badgeAutoFreq" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600">
                    <option value="weekly" ${currentAutoFreq === 'weekly' ? 'selected' : ''}>📅 Semanal (Últimos 7 dias — "🔥 Mais Agendado da Semana")</option>
                    <option value="daily" ${currentAutoFreq === 'daily' ? 'selected' : ''}>☀️ Diário (Jogos de Hoje — "⚡ Mais Procurado Hoje")</option>
                  </select>
                </div>
              </div>
            </label>

            <!-- Opção 3: Manual -->
            <label class="flex items-start p-3 rounded-2xl border ${currentMode === 'manual' ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/30' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer transition-all">
              <input type="radio" name="badgeMode" value="manual" ${currentMode === 'manual' ? 'checked' : ''} 
                     onchange="toggleBadgeModeControls('manual')" class="mt-0.5 text-emerald-600 focus:ring-emerald-500">
              <div class="ml-3 text-xs flex-1">
                <span class="font-black text-slate-800 block">⭐ Manual (Gatilho de Desejo / Marketing)</span>
                <span class="text-[11px] text-slate-500">Escolha um selo estratégico ou digite o texto livre para gerar desejo de alugar.</span>
                
                <div id="badgeManualOptions" class="${currentMode === 'manual' ? 'mt-2.5' : 'hidden mt-2.5'} space-y-2.5 border-t border-slate-100 pt-2">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Escolha um selo rápido de 1 clique:</label>
                    <div class="flex flex-wrap gap-1.5">
                      <button type="button" onclick="setCourtBadgePreset('🔥 Mais Agendado da Semana')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        🔥 Mais Agendado da Semana
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('⚡ Alta Procura')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        ⚡ Alta Procura
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('⭐ Preferido da Galera')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        ⭐ Preferido da Galera
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('🏆 Campo Oficial / Principal')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        🏆 Campo Oficial
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('🌧️ 100% Coberto (Sem Chuva)')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        🌧️ 100% Coberto
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('✨ Grama Nova / Reformada')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        ✨ Grama Nova
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('🏖️ Areia Fina Tratada')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        🏖️ Areia Fina
                      </button>
                      <button type="button" onclick="setCourtBadgePreset('🎯 Melhor Custo-Benefício')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-all cursor-pointer">
                        🎯 Custo-Benefício
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Texto do Selo:</label>
                    <input type="text" id="badgeCustomTextInput" name="badgeCustomText" value="${currentText}" 
                           placeholder="Ex: 🔥 Mais Agendado da Semana, ⚡ Alta Demanda..." 
                           class="w-full p-3 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
                  </div>
                </div>
              </div>
            </label>

          </div>

          <div class="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
            ${(currentMode !== 'none' || displayNow) ? `
              <button type="button" onclick="handleRemoveCourtBadge('${court.id}')" class="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Remover Destaque</span>
              </button>
            ` : '<div></div>'}

            <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">
                Cancelar
              </button>
              <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Salvar Destaque</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

function toggleBadgeModeControls(mode) {
  const autoDiv = document.getElementById('badgeAutoOptions');
  const manDiv = document.getElementById('badgeManualOptions');
  if (autoDiv) {
    if (mode === 'auto') autoDiv.classList.remove('hidden');
    else autoDiv.classList.add('hidden');
  }
  if (manDiv) {
    if (mode === 'manual') manDiv.classList.remove('hidden');
    else manDiv.classList.add('hidden');
  }
}

function setCourtBadgePreset(text) {
  const input = document.getElementById('badgeCustomTextInput');
  if (input) input.value = text;
}

async function handleSaveCourtBadge(e, courtId) {
  e.preventDefault();
  const form = e.target;
  const mode = form.elements['badgeMode'].value;
  const autoFreq = form.elements['badgeAutoFreq'] ? form.elements['badgeAutoFreq'].value : 'weekly';
  const customText = form.elements['badgeCustomText'] ? form.elements['badgeCustomText'].value.trim() : '';

  closeModal();

  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  if (typeof court.specs === 'string') {
    try { court.specs = JSON.parse(court.specs || '{}'); } catch(e) { court.specs = {}; }
  } else if (!court.specs) {
    court.specs = {};
  }

  court.specs.badge_mode = mode;
  court.specs.badge_auto_freq = autoFreq;
  court.specs.badge_text = mode === 'manual' ? customText : '';

  court.badge_mode = mode;
  court.badge_auto_freq = autoFreq;
  court.badge_text = mode === 'manual' ? customText : '';
  court.badge = mode === 'manual' ? customText : (mode === 'auto' ? 'auto' : null);

  // Atualiza estado local e localStorage
  const idx = state.courts.findIndex(c => c.id === courtId);
  if (idx !== -1) {
    state.courts[idx] = normalizeCourt({ ...court });
  }
  localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));

  _refreshAllUI();

  // Salva no Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').update({
        badge: mode === 'manual' ? customText : (mode === 'auto' ? 'auto' : null),
        specs: court.specs
      }).eq('id', courtId);
    } catch(err) {
      console.warn('Erro ao salvar badge no Supabase:', err);
    }
  }

  if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
    window.ArenaSupabase.broadcastCourtUpdate(court);
  }

  const disp = getCourtDisplayBadge(court);
  showToastNotification(`
    <h5 class="font-black text-white text-xs mb-0.5">⭐ Destaque Atualizado</h5>
    <p class="text-amber-300 font-bold">${court.name}: ${mode === 'none' ? 'Sem destaque' : (mode === 'auto' ? 'Modo Automático Ativo' : disp)}</p>
  `, 4000);
}

async function handleRemoveCourtBadge(courtId) {
  closeModal();
  const court = state.courts.find(c => c.id === courtId);
  if (!court) return;

  if (typeof court.specs === 'string') {
    try { court.specs = JSON.parse(court.specs || '{}'); } catch(e) { court.specs = {}; }
  } else if (!court.specs) {
    court.specs = {};
  }

  court.specs.badge_mode = 'none';
  court.specs.badge_text = '';
  court.badge_mode = 'none';
  court.badge_text = '';
  court.badge = null;

  const idx = state.courts.findIndex(c => c.id === courtId);
  if (idx !== -1) {
    state.courts[idx] = normalizeCourt({ ...court });
  }
  localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));

  _refreshAllUI();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').update({
        badge: null,
        specs: court.specs
      }).eq('id', courtId);
    } catch(err) {
      console.warn('Erro ao remover badge no Supabase:', err);
    }
  }

  if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
    window.ArenaSupabase.broadcastCourtUpdate(court);
  }

  showToastNotification(`
    <h5 class="font-black text-white text-xs mb-0.5">✓ Destaque Removido</h5>
    <p class="text-emerald-300 font-bold">${court.name} agora está sem nenhum selo de destaque.</p>
  `, 3500);
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

    // Ao finalizar partida, se tiver produtos no bar e não estiver entregue, atualiza automaticamente para entregue!
    if (status === 'finished') {
      if (b.product_cart && typeof b.product_cart === 'object') {
        const pKeys = Object.keys(b.product_cart).filter(k => !k.startsWith('_'));
        if (pKeys.some(k => b.product_cart[k] > 0)) {
          b.product_cart._status = 'delivered';
          b.bar_status = 'delivered';
        }
      }
    }

    const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    const idx = localBookings.findIndex(x => x.id === matchId);
    if (idx !== -1) {
      localBookings[idx] = b;
      localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
    }

    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      try {
        const client = window.ArenaSupabase.getClient();
        const payload = { status };
        if (b.product_cart) payload.product_cart = b.product_cart;
        await client.from('bookings').update(payload).eq('id', matchId);
      } catch(e) {}
    }
  }
  renderStepContent();
  lucide.createIcons();
}

// Atualizar status do bar (waiting -> separated -> chilling -> delivered)
async function updateBarStatus(bookingId, newStatus) {
  const b = (state.bookings || []).find(x => x.id === bookingId);
  if (b) {
    if (!b.product_cart || typeof b.product_cart !== 'object') b.product_cart = {};
    b.product_cart._status = newStatus;
    b.bar_status = newStatus;

    const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    const idx = localBookings.findIndex(x => x.id === bookingId);
    if (idx !== -1) {
      localBookings[idx] = b;
      localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
    }

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
  const next = current === 'waiting' ? 'separated' : (current === 'separated' ? 'chilling' : (current === 'chilling' ? 'delivered' : 'waiting'));
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
                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      <img src="${p.image}" class="w-full h-full object-contain">
                    </div>
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

          <div class="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
            <button type="button" onclick="closeModal()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md">Salvar Itens no Jogo</button>
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

// Exclusão / Cancelamento de Agendamento e Liberação Imediata da Grade de Horários
async function handleCancelBooking(bookingId) {
  if (!bookingId) return;

  if (!canDeleteBookings()) {
    alert('Acesso Negado: O nível de acesso da Recepção não tem permissão para apagar jogos.\n\nPara apagar jogos agendados, faça login com a conta de Gerente do Sistema (Vinicius Melo) ou Administrador Geral.');
    return;
  }

  if (!confirm('Deseja realmente apagar esta reserva de jogo e liberar o horário imediatamente no sistema?')) return;

  // 0. Captura dados completos do agendamento antes da remoção
  const bToDelete = (state.bookings || []).find(b => b && (b.id === bookingId || String(b.id) === String(bookingId)));
  const courtObj = bToDelete ? (state.courts || []).find(c => c.id === (bToDelete.court_id || bToDelete.courtId)) : null;
  const courtName = courtObj ? courtObj.name : 'Quadra Esportiva';
  const custName = bToDelete ? (bToDelete.customer_name || bToDelete.customerName || 'Cliente') : 'Cliente';
  const bDate = bToDelete ? formatDisplayDate(bToDelete.date) : '';
  const bTime = bToDelete ? (bToDelete.time || `${bToDelete.start_time} às ${bToDelete.end_time}`) : '';
  const bPrice = bToDelete ? Number(bToDelete.total_price || 0).toFixed(2).replace('.', ',') : '0,00';

  // 1. Remove do estado em memória
  state.bookings = (state.bookings || []).filter(b => b && b.id !== bookingId && String(b.id) !== String(bookingId));

  // 2. Remove do localStorage local
  try {
    let local = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    local = local.filter(b => b && b.id !== bookingId && String(b.id) !== String(bookingId));
    localStorage.setItem('arena_local_bookings', JSON.stringify(local));
  } catch (e) {}

  // 3. Transmissão imediata via WebSocket / Broadcast para TODOS os outros aparelhos (Celular e PC)
  const devContext = getDeviceContext();
  let currentAuthor = 'Administrador Geral (Gabriel Alves)';
  if (state.currentUser) {
    currentAuthor = (state.currentUser.name && state.currentUser.name !== 'Administrador Geral') 
      ? state.currentUser.name 
      : (state.currentUser.email === 'admin@arenalimoeiro.com.br' ? 'Gabriel Alves' : (state.currentUser.name || state.currentUser.email));
  }

  const deletePayload = {
    id: bookingId,
    courtName,
    customerName: custName,
    date: bDate,
    time: bTime,
    userName: currentAuthor,
    deviceType: devContext.label
  };

  if (window.ArenaSupabase && window.ArenaSupabase.broadcastBookingDelete) {
    window.ArenaSupabase.broadcastBookingDelete(deletePayload);
  }
  if (window.arenaSyncChannel) {
    try { window.arenaSyncChannel.postMessage({ type: 'booking_deleted', payload: deletePayload }); } catch(e) {}
  }

  // 4. Registra no Log do Sistema com quem apagou, quadra, horário, data e dispositivo (Mobile ou PC)
  logSystemAction({
    actionType: 'DELETE_BOOKING',
    actionLabel: 'Exclusão de Jogo',
    courtName,
    details: `Jogo agendado de ${custName} (${bDate} às ${bTime} • R$ ${bPrice}) foi apagado e o horário liberado no sistema.`,
    targetId: bookingId
  });

  // 5. Se for um horário fixo (monthly-...), lida com a tabela monthly_members
  if (String(bookingId).startsWith('monthly-')) {
    const memberId = String(bookingId).replace('monthly-', '');
    state.monthlyMembers = (state.monthlyMembers || []).filter(m => m.id !== memberId);
    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      try {
        const client = window.ArenaSupabase.getClient();
        await client.from('monthly_members').delete().eq('id', memberId);
      } catch(e) {
        console.warn('Erro ao remover monthly_members:', e);
      }
    }
  } else if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      // Atualiza primeiro para cancelled para propagar Realtime instantâneo para todos os clientes
      await client.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      // E remove da tabela para liberação definitiva
      await client.from('bookings').delete().eq('id', bookingId);
    } catch(e) {
      console.warn('Erro ao deletar booking no Supabase:', e);
    }
  }

  // 6. Limpa seleções pendentes de horários
  if (state.selectedSlots && state.selectedSlots.length > 0) {
    state.selectedSlots = [];
    state.startTime = null;
    state.endTime = null;
    state.selectedDuration = 0;
  }

  // 7. Recalcula a grade de horários do agendamento principal imediatamente
  requestSchedule();
  _refreshAllUI();
  if (state.currentMode === 'admin') {
    renderStepContent();
  }
  if (window.lucide) lucide.createIcons();

  // Se o modal de busca estiver aberto, atualiza a pesquisa
  if (typeof renderSearchResults === 'function' && document.getElementById('matchSearchResultsList')) {
    renderSearchResults();
  }

  // Se estiver na sub-aba de gestão de agendamentos, atualiza a lista filtrada
  if (typeof filterSubtabBookingsList === 'function' && document.getElementById('subtabBookingsListContainer')) {
    filterSubtabBookingsList();
  }

  alert('Jogo apagado com sucesso! O horário foi liberado no sistema.');
}
window.handleCancelBooking = handleCancelBooking;

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
                ${["06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30"].map(t => `<option value="${t}" ${t === '19:00' ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Duração *</label>
              <select id="directDurationSelect" class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 bg-white">
                <option value="30">⏱️ 30 Minutos (Meia Hora)</option>
                <option value="60" selected>⏱️ 1 Hora (60 min)</option>
                <option value="90">⏱️ 1h 30min (90 min)</option>
                <option value="120">⏱️ 2 Horas (120 min)</option>
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
              <input type="tel" id="directCustomerPhone" required placeholder="(**) *****-****" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">CPF do Atleta / Responsável (Opcional)</label>
              <input type="text" id="directCustomerCpf" placeholder="000.000.000-00" maxlength="14" oninput="this.value = formatCPF(this.value)" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 font-mono">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Contato de Emergência (Opcional)</label>
              <input type="text" id="directCustomerEmergency" placeholder="Ex: Maria (81) 99999-9999" 
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

          <div class="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
            <button type="button" onclick="closeModal()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700">Cancelar</button>
            <button type="submit" class="w-full sm:w-auto justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 flex-shrink-0"></i>
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
  const rawCpf = (document.getElementById('directCustomerCpf')?.value || '').trim();
  const customerCpf = rawCpf ? formatCPF(rawCpf) : '';
  const emergency = (document.getElementById('directCustomerEmergency')?.value || '').trim();
  const bookingType = document.getElementById('directTypeSelect').value;
  const paymentMethod = document.getElementById('directPaymentSelect').value;
  let obs = document.getElementById('directObsInput').value.trim();

  if (customerCpf && !obs.includes('[CPF:')) {
    obs = obs ? `${obs} [CPF: ${customerCpf}]` : `[CPF: ${customerCpf}]`;
  }
  if (emergency && !obs.includes('[Emergência:')) {
    obs = obs ? `${obs} [Emergência: ${emergency}]` : `[Emergência: ${emergency}]`;
  }

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

  const extraObs = [customerCpf ? `[CPF: ${customerCpf}]` : '', emergency ? `[Emergência: ${emergency}]` : '', obs].filter(Boolean).join(' | ');

  let savedCust = null;
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      if (window.ArenaSupabase.getOrCreateCustomer) {
        savedCust = await window.ArenaSupabase.getOrCreateCustomer(name, phone, '', { cpf: customerCpf, emergency_contact: emergency });
      }
    } catch (e) {
      console.warn('Aviso cadastro cliente admin:', e);
    }
  }

  // Payload limpo com apenas as colunas existentes na tabela 'bookings' do Supabase
  const dbBookingPayload = {
    id: newBookingId,
    court_id: courtId,
    customer_id: (savedCust && savedCust.id) ? savedCust.id : null,
    date,
    start_time: startTime,
    end_time: endTime,
    time: `${startTime} às ${endTime}`,
    duration,
    customer_name: name,
    customer_phone: phone,
    total_price: totalPrice,
    status: 'confirmed',
    booking_type: bookingType,
    payment_method: paymentMethod,
    product_cart: productCart,
    observation: extraObs
  };

  const bookingPayload = {
    ...dbBookingPayload,
    customer_cpf: customerCpf,
    customerCPF: customerCpf,
    emergency_contact: emergency
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
      const { error: insErr } = await client.from('bookings').insert([dbBookingPayload]);
      if (insErr) {
        console.warn('Aviso inserção booking admin Supabase:', insErr);
        if (insErr.code === '23503') {
          dbBookingPayload.customer_id = null;
          await client.from('bookings').insert([dbBookingPayload]);
        }
      }
      if (window.ArenaSupabase.broadcastBooking) {
        window.ArenaSupabase.broadcastBooking(bookingPayload);
      }
    } catch(err) {
      console.warn('Erro ao salvar no Supabase:', err);
    }
  }

  // Atualiza cache local de clientes
  if (!state.supabaseCustomers) state.supabaseCustomers = [];
  const cleanP = phone.replace(/\D/g, '');
  const exIdx = state.supabaseCustomers.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanP);
  const updatedCust = normalizeCustomer({ 
    id: (savedCust && savedCust.id) ? savedCust.id : ('cust-' + Date.now()), 
    name, 
    phone, 
    cpf: customerCpf,
    document: customerCpf, 
    emergency_contact: emergency,
    emergencyContact: emergency
  });

  if (exIdx >= 0) {
    state.supabaseCustomers[exIdx] = normalizeCustomer({ 
      ...state.supabaseCustomers[exIdx], 
      ...updatedCust,
      cpf: customerCpf || state.supabaseCustomers[exIdx].cpf, 
      emergency_contact: emergency || state.supabaseCustomers[exIdx].emergency_contact 
    });
  } else {
    state.supabaseCustomers.unshift(updatedCust);
  }
  try {
    localStorage.setItem('arena_customers', JSON.stringify(state.supabaseCustomers));
  } catch(e) {}

  // Dispara notificação imediata
  try {
    triggerBookingNotification(bookingPayload);
  } catch(e) {}

  // Transmite broadcast instantâneo via WebSocket para todos os outros aparelhos/celulares
  if (window.ArenaSupabase && window.ArenaSupabase.broadcastBooking) {
    window.ArenaSupabase.broadcastBooking(bookingPayload);
  }

  // Registra no Log de Auditoria do Sistema
  logSystemAction({
    actionType: 'CREATE_BOOKING',
    actionLabel: 'Reserva no Balcão',
    courtName: court ? court.name : 'Quadra',
    details: `Reserva no balcão confirmada para ${name} (${phone}) na ${court ? court.name : 'Quadra'} - ${formatDisplayDate(date)} às ${startTime} às ${endTime}. Valor: R$ ${totalPrice.toFixed(2).replace('.', ',')}`,
    targetId: newBookingId
  });

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

// ==============================================================================
// 🔍 CONSULTA & PESQUISA AVANÇADA DE JOGOS E HISTÓRICO DE PARTIDAS
// ==============================================================================
function getAllHistoricalMatches() {
  const allBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');

  const now = new Date();
  const todayStr = getFormattedDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const result = [];

  // 1. Reservas Gravadas (Avulsas, Balcão, Online e Histórico)
  allBookings.forEach(b => {
    const startT = b.start_time || b.startTime || (b.time ? b.time.split(' ')[0] : '19:00');
    const endT = b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : '20:00');
    const parsedObs = typeof parseCustomerFromObservation === 'function' ? parseCustomerFromObservation(b.observation || '') : {};
    const custObj = typeof findCustomerByPhone === 'function' ? findCustomerByPhone(b.customer_phone || b.customerPhone || '') : null;
    const cpfVal = b.customer_cpf || b.customerCpf || b.customerCPF || parsedObs.cpf || (custObj ? custObj.cpf : '');
    const emergVal = b.emergency_contact || b.emergencyContact || parsedObs.emergency_contact || (custObj ? custObj.emergency_contact : '');
    const court = state.courts.find(c => c.id === (b.court_id || b.courtId)) || { name: 'Quadra Esportiva', id: b.court_id };

    const sMin = timeToMinutes(startT);
    const eMin = timeToMinutes(endT);

    let computedStatus = b.status || 'confirmed';
    if (computedStatus !== 'finished' && computedStatus !== 'cancelled') {
      if (b.date === todayStr) {
        if (currentMinutes >= sMin && currentMinutes <= eMin) {
          computedStatus = 'live';
        } else if (currentMinutes < sMin) {
          computedStatus = 'upcoming';
        } else {
          computedStatus = 'finished';
        }
      } else if (b.date < todayStr) {
        computedStatus = 'finished';
      } else {
        computedStatus = 'upcoming';
      }
    }

    result.push({
      id: b.id,
      court_id: b.court_id || b.courtId,
      courtName: court.name,
      date: b.date,
      start_time: startT,
      end_time: endT,
      time: b.time || (`${startT} às ${endT}`),
      duration: b.duration || 60,
      customer_name: b.customer_name || b.customerName || 'Cliente',
      customer_phone: b.customer_phone || b.customerPhone || '',
      customer_cpf: cpfVal,
      emergency_contact: emergVal,
      total_price: parseFloat(b.total_price || b.totalPrice || 0),
      status: computedStatus,
      rawStatus: b.status || 'confirmed',
      booking_type: b.booking_type || b.bookingType || 'avulso',
      payment_method: b.payment_method || b.paymentMethod || 'pix',
      product_cart: b.product_cart || b.productCart || {},
      observation: b.observation || ''
    });
  });

  // Ordena por data decrescente (mais recentes primeiro), depois por horário
  result.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return timeToMinutes(b.start_time) - timeToMinutes(a.start_time);
  });

  return result;
}

function openSearchMatchesModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <!-- Topo / Header da Janela Sobreposta -->
        <div class="arena-header-bg p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
          <div class="flex items-center space-x-2.5 sm:space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
              <i data-lucide="search" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-black uppercase tracking-wide flex items-center gap-2">
                <span>Pesquisa de Jogos & Histórico de Partidas</span>
                <span class="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">Banco de Dados</span>
              </h3>
              <p class="text-xs text-emerald-200 font-medium">Consulte todos os jogos gravados por Nome do Cliente, Quadra, CPF ou Telefone</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Painel de Filtros Instantâneos -->
        <div class="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0 space-y-2.5">
          <!-- Linha de Busca Principal -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input type="text" id="matchSearchQuery" oninput="handleMatchModalFilter()" placeholder="Digite o Nome do Cliente, CPF (000.000...) ou Telefone WhatsApp..." 
                   class="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-sm transition-all" autofocus>
            <button onclick="clearMatchSearchQuery()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Filtros de Quadra, Status e Período -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <!-- Quadra -->
            <div class="relative">
              <select id="matchSearchCourt" onchange="handleMatchModalFilter()" class="w-full p-2.5 pr-8 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer shadow-xs">
                <option value="all">🏟️ Todas as Quadras</option>
                ${state.courts.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>

            <!-- Status -->
            <div class="relative">
              <select id="matchSearchStatus" onchange="handleMatchModalFilter()" class="w-full p-2.5 pr-8 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer shadow-xs">
                <option value="all">⚡ Todos os Status</option>
                <option value="live">🟢 Ao Vivo / Em Andamento</option>
                <option value="upcoming">🔵 Agendados / Futuros</option>
                <option value="finished">✅ Finalizados / Passados</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>

            <!-- Período -->
            <div class="relative">
              <select id="matchSearchPeriod" onchange="handleMatchModalFilter()" class="w-full p-2.5 pr-8 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer shadow-xs">
                <option value="all">📅 Todo o Histórico Gravado</option>
                <option value="today">Hoje (${formatDisplayDate(getFormattedDate(new Date()))})</option>
                <option value="next7">Próximos 7 dias</option>
                <option value="past30">Últimos 30 dias</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>
        </div>

        <!-- Barra com contador de resultados -->
        <div class="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 flex-shrink-0">
          <span id="matchSearchCountLabel">Carregando jogos...</span>
          <span class="text-[11px] text-slate-400 font-normal">Base de Dados Arena Limoeiro</span>
        </div>

        <!-- Área de Rolagem com Resultados -->
        <div id="matchSearchResultsContainer" class="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
          <!-- Injetado dinamicamente por handleMatchModalFilter() -->
        </div>

        <!-- Rodapé do Modal -->
        <div class="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
            Fechar Janela
          </button>
          <button type="button" onclick="openDirectBookingModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Nova Reserva Balcão</span>
          </button>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  handleMatchModalFilter();
}

function clearMatchSearchQuery() {
  const input = document.getElementById('matchSearchQuery');
  if (input) {
    input.value = '';
    input.focus();
    handleMatchModalFilter();
  }
}

function handleMatchModalFilter() {
  const queryEl = document.getElementById('matchSearchQuery');
  const courtEl = document.getElementById('matchSearchCourt');
  const statusEl = document.getElementById('matchSearchStatus');
  const periodEl = document.getElementById('matchSearchPeriod');
  const container = document.getElementById('matchSearchResultsContainer');
  const countLabel = document.getElementById('matchSearchCountLabel');

  if (!container) return;

  const rawQuery = (queryEl ? queryEl.value : '').trim().toLowerCase();
  const cleanDigits = rawQuery.replace(/\D/g, '');
  const courtFilter = courtEl ? courtEl.value : 'all';
  const statusFilter = statusEl ? statusEl.value : 'all';
  const periodFilter = periodEl ? periodEl.value : 'all';

  const matches = getAllHistoricalMatches();
  const now = new Date();
  const todayStr = getFormattedDate(now);

  const filtered = matches.filter(m => {
    // Filtro por Quadra
    if (courtFilter !== 'all' && m.court_id !== courtFilter) return false;

    // Filtro por Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'live' && m.status !== 'live') return false;
      if (statusFilter === 'upcoming' && m.status !== 'upcoming') return false;
      if (statusFilter === 'finished' && m.status !== 'finished') return false;
    }

    // Filtro por Período
    if (periodFilter === 'today' && m.date !== todayStr) return false;
    if (periodFilter === 'next7') {
      const next7Date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const next7Str = getFormattedDate(next7Date);
      if (m.date < todayStr || m.date > next7Str) return false;
    }
    if (periodFilter === 'past30') {
      const past30Date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const past30Str = getFormattedDate(past30Date);
      if (m.date > todayStr || m.date < past30Str) return false;
    }

    // Filtro por Texto (Nome, CPF, Telefone, Quadra, Observação)
    if (rawQuery) {
      const nameMatch = (m.customer_name || '').toLowerCase().includes(rawQuery);
      const courtMatch = (m.courtName || '').toLowerCase().includes(rawQuery);
      const obsMatch = (m.observation || '').toLowerCase().includes(rawQuery);
      
      const cleanPhone = (m.customer_phone || '').replace(/\D/g, '');
      const phoneMatch = cleanDigits.length >= 2 && cleanPhone.includes(cleanDigits);

      const cleanCpf = (m.customer_cpf || '').replace(/\D/g, '');
      const cpfMatch = cleanDigits.length >= 2 && cleanCpf.includes(cleanDigits);

      if (!nameMatch && !courtMatch && !obsMatch && !phoneMatch && !cpfMatch) {
        return false;
      }
    }

    return true;
  });

  if (countLabel) {
    countLabel.innerHTML = `Mostrando <strong>${filtered.length}</strong> ${filtered.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
        <div class="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="search-x" class="w-7 h-7"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">Nenhum jogo encontrado</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Verifique a grafia do nome, dígitos do CPF ou altere os filtros de quadra e período acima.</p>
        <button onclick="clearMatchSearchQuery()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
          Limpar Pesquisa
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const isRecep = isReceptionUser();
  container.innerHTML = filtered.map(m => {
    const cleanPhone = (m.customer_phone || '').replace(/\D/g, '');
    const zapMsg = `Olá ${m.customer_name}! Falamos da Arena Limoeiro sobre o seu jogo no dia ${formatDisplayDate(m.date)} (${m.time}) na quadra ${m.courtName}.`;
    const zapUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(zapMsg)}`;

    let statusBadge = '';
    if (m.status === 'live') {
      statusBadge = `
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-xs animate-pulse">
          <span class="w-2 h-2 rounded-full bg-white mr-1.5 animate-ping"></span>
          🟢 AO VIVO
        </span>
      `;
    } else if (m.status === 'upcoming') {
      statusBadge = `
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          🔵 AGENDADO
        </span>
      `;
    } else if (m.status === 'finished') {
      statusBadge = `
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          ✅ FINALIZADO
        </span>
      `;
    } else {
      statusBadge = `
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
          ❌ CANCELADO
        </span>
      `;
    }

    const hasBar = m.product_cart && Object.keys(m.product_cart).filter(k => !k.startsWith('_')).some(k => m.product_cart[k] > 0);

    return `
      <div class="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all space-y-3">
        
        <!-- Linha Topo: Quadra, Data/Hora e Status -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              <i data-lucide="trophy" class="w-3.5 h-3.5 text-emerald-600 mr-1.5 flex-shrink-0"></i>
              ${m.courtName}
            </span>
            <span class="inline-flex items-center text-xs font-bold text-slate-600 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600 mr-1.5 flex-shrink-0"></i>
              ${formatDisplayDate(m.date)} • ${m.time}
            </span>
          </div>
          <div>${statusBadge}</div>
        </div>

        <!-- Dados do Cliente & Pagamento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          
          <!-- Cliente & CPF -->
          <div>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cliente / Peladeiro</span>
            <div class="text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5">${m.customer_name}</div>
            <div class="mt-1 flex items-center gap-1.5 flex-wrap">
              ${m.customer_cpf ? `
                <span class="inline-flex items-center text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <i data-lucide="credit-card" class="w-3 h-3 text-emerald-600 mr-1 flex-shrink-0"></i>
                  CPF: ${formatCPF(m.customer_cpf)}
                </span>
              ` : `
                <span class="text-[11px] text-slate-400 italic font-mono">Sem CPF cadastrado</span>
              `}
            </div>
          </div>

          <!-- Contato & WhatsApp -->
          <div>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Contato WhatsApp</span>
            <div class="text-xs font-bold text-slate-800 mt-0.5">${formatPhone(m.customer_phone) || 'Não informado'}</div>
            ${cleanPhone ? `
              <a href="${zapUrl}" target="_blank" class="inline-flex items-center text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-1">
                <i data-lucide="message-circle" class="w-3.5 h-3.5 mr-1 text-emerald-600"></i>
                Conversar no WhatsApp
              </a>
            ` : ''}
          </div>

          <!-- Financeiro & Pedidos -->
          <div>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor & Comanda</span>
            <div class="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">
              R$ ${m.total_price.toFixed(2).replace('.', ',')}
              <span class="text-[11px] font-normal text-slate-500 uppercase ml-1">(${m.payment_method})</span>
            </div>
            <div class="mt-1 flex items-center gap-1.5">
              ${hasBar ? `
                <span class="inline-flex items-center text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <i data-lucide="beer" class="w-3 h-3 text-amber-600 mr-1"></i> Comanda Bar Ativa
                </span>
              ` : `
                <span class="text-[11px] text-slate-400">Sem itens de bar</span>
              `}
            </div>
          </div>

        </div>

        ${m.observation ? `
          <div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span class="font-bold text-slate-700">Obs:</span> ${m.observation}
          </div>
        ` : ''}

        <!-- Botões de Ação Rápida -->
        <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onclick="goToMatchDate('${m.date}')" class="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Abrir no Calendário do Dia</span>
          </button>
          
          <button type="button" onclick="openAddBarItemsModal('${m.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer">
            <i data-lucide="beer" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Comanda Bar</span>
          </button>

          ${canDeleteBookings() ? `
            <button type="button" onclick="handleCancelBooking('${m.id}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs touch-manipulation" title="Apagar este jogo permanentemente do sistema">
              <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-600"></i>
              <span>Apagar Jogo</span>
            </button>
          ` : ''}
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function goToMatchDate(dateStr) {
  closeModal();
  setAdminFilterDate(dateStr);
}

// Vincula funções no escopo global window para garantir chamadas inline de eventos
window.openSearchMatchesModal = openSearchMatchesModal;
window.clearMatchSearchQuery = clearMatchSearchQuery;
window.handleMatchModalFilter = handleMatchModalFilter;
window.goToMatchDate = goToMatchDate;

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
        "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
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

          if (slot && slot.status === 'past') {
            return `
              <td class="p-2 text-center border-l border-slate-100 bg-slate-50/70 text-slate-400">
                <span class="font-bold text-[11px] block text-slate-400">Encerrado ⏰</span>
                <span class="text-[10px] text-slate-400 block font-medium">Horário Passado</span>
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
  const prod = (state.products || []).find(p => p.id === id);
  const prodName = prod ? prod.name : 'Produto';
  if (!confirm(`Deseja realmente excluir o item "${prodName}" do cardápio?`)) return;

  state.products = state.products.filter(p => p.id !== id);
  localStorage.setItem('arena_local_products', JSON.stringify(state.products));
  renderStepContent();
  lucide.createIcons();

  if (typeof logSystemAction === 'function') {
    logSystemAction('DELETE_PRODUCT', {
      courtName: 'Bar & Lanchonete',
      details: `Excluiu produto "${prodName}" do cardápio do bar`
    });
  }

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('products').delete().eq('id', id);
    } catch(e) {}
  }
}

async function deleteMonthlyMember(id) {
  if (!confirm('Cancelar este contrato de horário fixo?')) return;
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
  const target = state.adminUsers.find(u => u.id === id);
  if (target && (target.email === 'admin@arenalimoeiro.com.br' || (target.role === 'Administrador Geral' && target.name === 'Gabriel Alves'))) {
    alert('O Administrador Geral principal (Gabriel Alves) não pode ser removido.');
    return;
  }
  if (!confirm('Remover o acesso deste gestor?')) return;
  state.adminUsers = state.adminUsers.filter(u => u.id !== id);
  const localAdmins = JSON.parse(localStorage.getItem('arena_admin_users') || '[]');
  localStorage.setItem('arena_admin_users', JSON.stringify(localAdmins.filter(u => u.id !== id)));
  renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('admin_users').delete().eq('id', id);
    } catch(e) {}
  }
}

// ALIAS PARA O BOTÃO DO PAINEL (+ Novo Gestor)
function openAdminUserModal() {
  openNewAdminUserModal();
}

function copyCredentialsDirect(name, role, email, pass) {
  const text = `⚽ Arena Limoeiro - Dados de Acesso ao Sistema\n\n👤 Gestor: ${name}\n🛡️ Cargo: ${role}\n📧 E-mail: ${email}\n🔑 Senha: ${pass}\n🌐 Link de Acesso: ${window.location.origin}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ Credenciais de "${name}" copiadas com sucesso! Você pode colar no WhatsApp.`);
    }).catch(() => {
      prompt('Copie as credenciais abaixo:', text);
    });
  } else {
    prompt('Copie as credenciais abaixo:', text);
  }
}
window.copyCredentialsDirect = copyCredentialsDirect;

function slugifyAdminName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// LISTAS RICAS PARA GERAÇÃO REALMENTE ALEATÓRIA (MUDAM A CADA CLIQUE)
const RANDOM_FIRST_NAMES = [
  'Lucas', 'Marcos', 'Rodrigo', 'Matheus', 'Felipe', 'Bruno', 'Thiago', 'Carlos', 
  'André', 'Vinicius', 'Gabriel', 'Rafael', 'Diego', 'Leonardo', 'Renato', 'Danilo', 
  'Guilherme', 'Alexandre', 'Henrique', 'Eduardo', 'Samuel', 'Leandro', 'Marcelo',
  'Juliana', 'Camila', 'Beatriz', 'Larissa', 'Mariana', 'Amanda', 'Fernanda', 'Bruna'
];

const RANDOM_LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos'
];

const RANDOM_ROLE_NAMES = [
  'Recepção Manhã', 'Recepção Noite', 'Recepção Fim de Semana', 'Gerente de Turno', 
  'Operador de Pista', 'Atendente Balcão', 'Supervisor de Campo'
];

const ARENA_WORDS = [
  'Arena', 'Limoeiro', 'Pelada', 'Craque', 'Artilheiro', 'Chuteira', 'Society', 
  'Quadra', 'Gol', 'Drible', 'Vitoria', 'Campeao', 'Fut', 'Passe'
];

const PASS_SYMBOLS = ['!', '@', '#', '$', '*', '&'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sorteia um nome novo a cada clique (sempre diferente do atual no campo)
function randomizeAdminName(prefix) {
  const nameEl = document.getElementById(`${prefix}Name`);
  const currentVal = nameEl ? nameEl.value.trim() : '';
  
  let newName = '';
  for (let i = 0; i < 20; i++) {
    const isRole = Math.random() < 0.12;
    if (isRole) {
      newName = getRandomItem(RANDOM_ROLE_NAMES);
    } else {
      newName = `${getRandomItem(RANDOM_FIRST_NAMES)} ${getRandomItem(RANDOM_LAST_NAMES)}`;
    }
    if (newName !== currentVal) break;
  }

  if (nameEl) {
    nameEl.value = newName;
    nameEl.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => nameEl.classList.remove('ring-2', 'ring-emerald-500'), 400);
  }
}
window.randomizeAdminName = randomizeAdminName;

// Gera e-mail e senha usando o nome, mudando a cada clique
function generateCredentialsFromName(isEdit = false) {
  const prefix = isEdit ? 'editAdmin' : 'newAdmin';
  const nameEl = document.getElementById(`${prefix}Name`);
  const emailEl = document.getElementById(`${prefix}Email`);
  const passEl = document.getElementById(`${prefix}Password`);
  let rawName = nameEl ? nameEl.value.trim() : '';

  if (!rawName) {
    randomizeAdminName(prefix);
    rawName = nameEl ? nameEl.value.trim() : 'Gestor';
  }

  const clean = slugifyAdminName(rawName);
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0] || 'gestor';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';

  // Variações aleatórias de formato de e-mail a cada clique
  const emailStyles = [
    last ? `${first}.${last}` : first,
    last ? `${first}.${last}${Math.floor(10 + Math.random() * 89)}` : `${first}${Math.floor(10 + Math.random() * 89)}`,
    last ? `${first.charAt(0)}${last}` : `${first}.arena`,
    `${first}.${Math.floor(100 + Math.random() * 900)}`
  ];
  const chosenEmail = getRandomItem(emailStyles);
  const email = `${chosenEmail}@arenalimoeiro.com.br`;

  // Variações de senha dinâmica baseada no nome + registros
  const capFirst = first.charAt(0).toUpperCase() + first.slice(1);
  const capLast = last ? (last.charAt(0).toUpperCase() + last.slice(1)) : 'Arena';
  const sym = getRandomItem(PASS_SYMBOLS);
  const sym2 = getRandomItem(PASS_SYMBOLS);
  const num = Math.floor(100 + Math.random() * 900);
  const year = new Date().getFullYear();

  const passwordOptions = [
    `${capFirst}${sym}${year}${sym2}`,
    `${capLast}${sym}${num}${sym2}`,
    `Arena${sym}${capFirst}${num}`,
    `${capFirst}#${capLast}${sym}`,
    `${getRandomItem(ARENA_WORDS)}${sym}${capFirst}${num}`
  ];
  const password = getRandomItem(passwordOptions);

  if (emailEl) {
    emailEl.value = email;
    emailEl.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => emailEl.classList.remove('ring-2', 'ring-emerald-500'), 400);
  }
  if (passEl) {
    passEl.value = password;
    passEl.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => passEl.classList.remove('ring-2', 'ring-emerald-500'), 400);
  }
}
window.generateCredentialsFromName = generateCredentialsFromName;

// Gera credenciais 100% aleatórias e desvinculadas, mudando a cada clique
function generateRandomCredentials(isEdit = false) {
  const prefix = isEdit ? 'editAdmin' : 'newAdmin';
  const emailEl = document.getElementById(`${prefix}Email`);
  const passEl = document.getElementById(`${prefix}Password`);

  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  
  const prefixes = ['gestao', 'arena', 'atendimento', 'gerente', 'equipe', 'operacao'];
  const pfx = getRandomItem(prefixes);
  const email = `${pfx}.${rand}@arenalimoeiro.com.br`;

  const word = getRandomItem(ARENA_WORDS);
  const sym = getRandomItem(PASS_SYMBOLS);
  const num = Math.floor(1000 + Math.random() * 9000);
  const password = `${word}${sym}${num}!`;

  if (emailEl) {
    emailEl.value = email;
    emailEl.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => emailEl.classList.remove('ring-2', 'ring-emerald-500'), 400);
  }
  if (passEl) {
    passEl.value = password;
    passEl.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => passEl.classList.remove('ring-2', 'ring-emerald-500'), 400);
  }
}
window.generateRandomCredentials = generateRandomCredentials;

// Gera apenas uma nova senha aleatória a cada clique
function generateOnlyRandomPassword(prefix) {
  const passEl = document.getElementById(`${prefix}Password`);
  const word = getRandomItem(ARENA_WORDS);
  const sym = getRandomItem(PASS_SYMBOLS);
  const num = Math.floor(1000 + Math.random() * 9000);
  const password = `${word}${sym}${num}!`;
  if (passEl) {
    passEl.value = password;
    passEl.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => passEl.classList.remove('ring-2', 'ring-emerald-500'), 400);
  }
}
window.generateOnlyRandomPassword = generateOnlyRandomPassword;

// COPIAR CREDENCIAIS FORMATADAS PARA ÁREA DE TRANSFERÊNCIA
function copyCredentials(prefix) {
  const nameEl = document.getElementById(`${prefix}Name`);
  const emailEl = document.getElementById(`${prefix}Email`);
  const passEl = document.getElementById(`${prefix}Password`);
  const roleEl = document.getElementById(`${prefix}Role`);

  const name = nameEl ? nameEl.value.trim() : 'Gestor';
  const email = emailEl ? emailEl.value.trim() : '';
  const pass = passEl ? passEl.value.trim() : '';
  const role = roleEl ? roleEl.value : 'Gerente do Sistema';

  if (!email || !pass) {
    alert('Preencha o e-mail e a senha primeiro.');
    return;
  }

  copyCredentialsDirect(name, role, email, pass);
}
window.copyCredentials = copyCredentials;

function copyGeneratedCredentials() {
  copyCredentials('newAdmin');
}
window.copyGeneratedCredentials = copyGeneratedCredentials;

// GERA A GRADE 4 COLUNAS x 3 LINHAS (MATRIZ 4x3 COM AS 12 PERMISSÕES DO SISTEMA)
function renderPermissionsMatrix(prefix, currentPermissions = null, currentRole = 'Gerente do Sistema') {
  let activePerms = [];
  if (Array.isArray(currentPermissions) && currentPermissions.length > 0) {
    activePerms = [...currentPermissions];
  } else {
    activePerms = SYSTEM_PERMISSIONS
      .filter(p => p.defaultRoles.includes(currentRole))
      .map(p => p.id);
  }

  const cols = [1, 2, 3, 4];
  
  return `
    <div class="space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <span class="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4 text-emerald-600"></i>
            Permissões do Gestor (Matriz 4x3: 4 Colunas com 3 Funções Cada)
          </span>
          <p class="text-[11px] text-slate-500 mt-0.5">Selecione o que esta conta poderá fazer. Caso a conta não tenha a permissão, <strong>as funções somem da tela</strong> do usuário.</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="toggleAllPermissions('${prefix}', true)" class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-black cursor-pointer transition-all">
            ✓ Marcar Todos
          </button>
          <button type="button" onclick="toggleAllPermissions('${prefix}', false)" class="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all">
            ✕ Desmarcar Todos
          </button>
        </div>
      </div>

      <!-- Grade 4 Colunas x 3 Linhas = 12 Permissões -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        ${cols.map(colNum => {
          const colPerms = SYSTEM_PERMISSIONS.filter(p => p.col === colNum);
          const colTitle = colPerms[0] ? colPerms[0].colTitle : `Coluna ${colNum}`;
          return `
            <div class="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-col justify-between space-y-2">
              <div class="text-[11px] font-black text-slate-800 pb-1.5 border-b border-slate-100 uppercase tracking-tight">
                ${colTitle}
              </div>
              <div class="space-y-2 flex-1">
                ${colPerms.map(p => {
                  const isChecked = activePerms.includes(p.id);
                  return `
                    <label for="${prefix}_perm_${p.id}" class="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/60 transition-all cursor-pointer select-none group border border-slate-100 hover:border-emerald-200">
                      <input type="checkbox" id="${prefix}_perm_${p.id}" value="${p.id}" ${isChecked ? 'checked' : ''} 
                             onchange="handlePermissionCheckboxChange('${prefix}')"
                             class="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0">
                      <div class="min-w-0">
                        <span class="text-xs font-black text-slate-900 group-hover:text-emerald-950 block leading-tight">
                          ${p.label}
                        </span>
                        <span class="text-[10px] text-slate-500 leading-tight block mt-0.5">
                          ${p.desc}
                        </span>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
window.renderPermissionsMatrix = renderPermissionsMatrix;

function toggleAllPermissions(prefix, checkAll = true) {
  SYSTEM_PERMISSIONS.forEach(p => {
    const el = document.getElementById(`${prefix}_perm_${p.id}`);
    if (el) el.checked = checkAll;
  });
}
window.toggleAllPermissions = toggleAllPermissions;

function handleRoleChange(prefix) {
  const roleEl = document.getElementById(`${prefix}Role`);
  if (!roleEl) return;
  const role = roleEl.value;
  if (role === 'Personalizado') return;

  SYSTEM_PERMISSIONS.forEach(p => {
    const el = document.getElementById(`${prefix}_perm_${p.id}`);
    if (el) {
      el.checked = p.defaultRoles.includes(role);
    }
  });
}
window.handleRoleChange = handleRoleChange;

function handlePermissionCheckboxChange(prefix) {
  // Chamado quando o usuário marca/desmarca qualquer checkbox individualmente
}
window.handlePermissionCheckboxChange = handlePermissionCheckboxChange;

// MODAL DE CADASTRO DE NOVO GESTOR COM DESIGN MODERNO E MATRIZ 4x3
function openNewAdminUserModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const initialGeneratedEmail = `gerente.${rand}@arenalimoeiro.com.br`;
  const initialGeneratedPassword = `arena${randomNum}!`;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        
        <div class="arena-header-bg p-5 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <i data-lucide="user-plus" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Cadastrar Novo Gestor do Sistema</h3>
              <p class="text-xs text-emerald-200">Configure o nome, cargo, permissões detalhadas e dados de acesso</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1.5 rounded-xl transition-all cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleNewAdminUserSubmit(event)" class="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-80px)]">
          
          <!-- Nome do Gestor com Botão de Sortear Nome -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700 uppercase">Nome Completo do Gestor *</label>
              <button type="button" onclick="randomizeAdminName('newAdmin')" 
                      class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-[11px] font-black flex items-center space-x-1 cursor-pointer transition-all shadow-2xs" 
                      title="Sorteia um nome brasileiro realista a cada clique">
                <i data-lucide="shuffle" class="w-3 h-3 text-emerald-600"></i>
                <span>🎲 Sortear Nome</span>
              </button>
            </div>
            <input type="text" id="newAdminName" required placeholder="Ex: Lucas Santana ou Recepção Noite" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900">
            <p class="text-[11px] text-slate-400 mt-1">Você pode digitar qualquer nome ou clicar em "🎲 Sortear Nome" para gerar nomes automaticamente a cada clique.</p>
          </div>

          <!-- Nível de Acesso Base -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nível de Acesso Base / Perfil *</label>
            <select id="newAdminRole" onchange="handleRoleChange('newAdmin')" class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600">
              <option value="Gerente do Sistema" selected>Gerente do Sistema (Operação e Gestão)</option>
              <option value="Recepção & Atendimento">Recepção & Atendimento (Atendimento e Quadras)</option>
              <option value="Administrador Geral">Administrador Geral (Acesso Total Irrestrito)</option>
              <option value="Personalizado">Personalizado (Definir funções individualmente na matriz abaixo)</option>
            </select>
            <p class="text-[11px] text-slate-500 mt-1">Ao selecionar um cargo, as caixas de permissão abaixo são ajustadas automaticamente. Você pode marcar ou desmarcar livremente qualquer caixa.</p>
          </div>

          <!-- Matriz 4x3 de Permissões Granulares -->
          ${renderPermissionsMatrix('newAdmin', null, 'Gerente do Sistema')}

          <!-- Gerador Dinâmico de E-mail e Senha -->
          <div class="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-emerald-200/70">
              <span class="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
                Credenciais de Acesso (Gerador Dinâmico)
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" onclick="generateCredentialsFromName(false)" 
                        class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center space-x-1 transition-all shadow-xs cursor-pointer" title="Gera e-mail e senha com o nome digitado, mudando a cada clique">
                  <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                  <span>✨ Gerar c/ Nome</span>
                </button>
                <button type="button" onclick="generateRandomCredentials(false)" 
                        class="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-black flex items-center space-x-1 transition-all shadow-xs cursor-pointer" title="Gera e-mail e senha 100% aleatórios a cada clique">
                  <i data-lucide="shuffle" class="w-3.5 h-3.5"></i>
                  <span>🎲 Aleatório s/ Nome</span>
                </button>
                <button type="button" onclick="generateOnlyRandomPassword('newAdmin')" 
                        class="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black flex items-center space-x-1 transition-all shadow-xs cursor-pointer" title="Gera apenas uma nova senha aleatória a cada clique">
                  <i data-lucide="key" class="w-3.5 h-3.5"></i>
                  <span>🔑 Nova Senha</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-emerald-900 uppercase mb-1 flex items-center justify-between">
                  <span>E-mail de Login *</span>
                  <span class="text-[10px] text-emerald-700 font-normal">Editável livremente</span>
                </label>
                <input type="email" id="newAdminEmail" required value="${initialGeneratedEmail}" placeholder="nome@arenalimoeiro.com.br" 
                       class="w-full p-2.5 border border-emerald-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white">
              </div>

              <div>
                <label class="block text-[11px] font-bold text-emerald-900 uppercase mb-1 flex items-center justify-between">
                  <span>Senha de Acesso *</span>
                  <span class="text-[10px] text-emerald-700 font-normal">Editável livremente</span>
                </label>
                <input type="text" id="newAdminPassword" required value="${initialGeneratedPassword}" 
                       class="w-full p-2.5 border border-emerald-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 bg-white">
              </div>
            </div>

            <button type="button" onclick="copyCredentials('newAdmin')" class="w-full py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>📋 Copiar Credenciais Deste Gestor para Enviar</span>
            </button>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer">Cadastrar e Liberar Acesso</button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();
}
window.openNewAdminUserModal = openNewAdminUserModal;

// MODAL DE EDIÇÃO DE GESTOR EXISTENTE COM MATRIZ 4x3
function openEditAdminUserModal(id) {
  const user = (state.adminUsers || []).find(u => u.id === id);
  if (!user) {
    alert('Gestor não encontrado.');
    return;
  }
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const isMaster = user.email === 'admin@arenalimoeiro.com.br' || (user.role === 'Administrador Geral' && (user.name === 'Gabriel Alves' || user.id === 'admin-1'));
  const currentName = user.name || (user.email === 'admin@arenalimoeiro.com.br' ? 'Gabriel Alves' : '');

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        
        <div class="arena-header-bg p-5 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <i data-lucide="edit-3" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">Editar Gestor: ${currentName}</h3>
              <p class="text-xs text-emerald-200">Ajuste o cargo, permissões da matriz 4x3 e credenciais de acesso</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1.5 rounded-xl transition-all cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleEditAdminUserSubmit(event, '${user.id}')" class="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-80px)]">
          
          <!-- Nome do Gestor -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-700 uppercase">Nome Completo do Gestor *</label>
              ${!isMaster ? `
                <button type="button" onclick="randomizeAdminName('editAdmin')" 
                        class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-[11px] font-black flex items-center space-x-1 cursor-pointer transition-all shadow-2xs">
                  <i data-lucide="shuffle" class="w-3 h-3 text-emerald-600"></i>
                  <span>🎲 Sortear Outro Nome</span>
                </button>
              ` : ''}
            </div>
            <input type="text" id="editAdminName" required value="${currentName.replace(/"/g, '&quot;')}" placeholder="Ex: Carlos Eduardo Silva" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900" ${isMaster ? 'readonly' : ''}>
          </div>

          <!-- Nível de Acesso Base -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nível de Acesso Base / Perfil *</label>
            <select id="editAdminRole" onchange="handleRoleChange('editAdmin')" class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600" ${isMaster ? 'disabled' : ''}>
              <option value="Gerente do Sistema" ${user.role === 'Gerente do Sistema' ? 'selected' : ''}>Gerente do Sistema (Operação e Gestão)</option>
              <option value="Recepção & Atendimento" ${user.role === 'Recepção & Atendimento' || (user.role && user.role.toLowerCase().includes('recep')) ? 'selected' : ''}>Recepção & Atendimento (Atendimento e Quadras)</option>
              <option value="Administrador Geral" ${user.role === 'Administrador Geral' ? 'selected' : ''}>Administrador Geral (Acesso Total e Irrestrito)</option>
              <option value="Personalizado">Personalizado (Definir funções individualmente na matriz abaixo)</option>
            </select>
            ${isMaster ? '<p class="text-[11px] text-emerald-700 font-bold mt-1">👑 Administrador Geral Principal mantém acesso total irrestrito.</p>' : ''}
          </div>

          <!-- Matriz 4x3 de Permissões Granulares -->
          ${renderPermissionsMatrix('editAdmin', user.permissions || null, user.role || 'Gerente do Sistema')}

          <!-- Gerador Dinâmico de E-mail e Senha -->
          <div class="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-emerald-200/70">
              <span class="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
                Credenciais de Acesso
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" onclick="generateCredentialsFromName(true)" 
                        class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center space-x-1 transition-all shadow-xs cursor-pointer" title="Gera e-mail e senha com o nome digitado">
                  <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                  <span>✨ Gerar c/ Nome</span>
                </button>
                <button type="button" onclick="generateRandomCredentials(true)" 
                        class="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-black flex items-center space-x-1 transition-all shadow-xs cursor-pointer" title="Gera e-mail e senha 100% aleatórios">
                  <i data-lucide="shuffle" class="w-3.5 h-3.5"></i>
                  <span>🎲 Aleatório s/ Nome</span>
                </button>
                <button type="button" onclick="generateOnlyRandomPassword('editAdmin')" 
                        class="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black flex items-center space-x-1 transition-all shadow-xs cursor-pointer" title="Gera apenas uma nova senha aleatória a cada clique">
                  <i data-lucide="key" class="w-3.5 h-3.5"></i>
                  <span>🔑 Nova Senha</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-emerald-900 uppercase mb-1 flex items-center justify-between">
                  <span>E-mail de Login *</span>
                  <span class="text-[10px] text-emerald-700 font-normal">Editável livremente</span>
                </label>
                <input type="email" id="editAdminEmail" required value="${(user.email || '').replace(/"/g, '&quot;')}" placeholder="nome@arenalimoeiro.com.br" 
                       class="w-full p-2.5 border border-emerald-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 bg-white">
              </div>

              <div>
                <label class="block text-[11px] font-bold text-emerald-900 uppercase mb-1 flex items-center justify-between">
                  <span>Senha de Acesso *</span>
                  <span class="text-[10px] text-emerald-700 font-normal">Editável livremente</span>
                </label>
                <input type="text" id="editAdminPassword" required value="${(user.password || '').replace(/"/g, '&quot;')}" 
                       class="w-full p-2.5 border border-emerald-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 bg-white">
              </div>
            </div>

            <button type="button" onclick="copyCredentials('editAdmin')" class="w-full py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>📋 Copiar Credenciais Deste Gestor para Enviar</span>
            </button>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();
}
window.openEditAdminUserModal = openEditAdminUserModal;

async function handleEditAdminUserSubmit(event, id) {
  event.preventDefault();
  const name = document.getElementById('editAdminName').value.trim();
  const email = document.getElementById('editAdminEmail').value.trim();
  const roleEl = document.getElementById('editAdminRole');
  const role = roleEl ? roleEl.value : 'Gerente do Sistema';
  const password = document.getElementById('editAdminPassword').value.trim();

  if (!name || !email || !password) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const idx = state.adminUsers.findIndex(u => u.id === id);
  if (idx === -1) {
    alert('Gestor não encontrado.');
    return;
  }

  // Extrai as permissões marcadas na matriz 4x3
  const permissions = SYSTEM_PERMISSIONS
    .map(p => p.id)
    .filter(permId => {
      const el = document.getElementById(`editAdmin_perm_${permId}`);
      return el ? el.checked : false;
    });

  const dbRole = permissions && permissions.length > 0 
    ? `${role}::perms:${permissions.join(',')}` 
    : role;

  const updatedUser = {
    ...state.adminUsers[idx],
    name,
    email,
    role,
    password,
    permissions,
    updated_at: new Date().toISOString()
  };

  state.adminUsers[idx] = updatedUser;
  localStorage.setItem('arena_admin_users', JSON.stringify(state.adminUsers));

  // Se o gestor logado for o mesmo sendo editado, atualiza a sessão e permissões imediatamente
  if (state.currentUser && (state.currentUser.id === id || (state.currentUser.email && state.currentUser.email.toLowerCase() === email.toLowerCase()))) {
    state.currentUser = { ...state.currentUser, name, email, role, password, permissions };
    localStorage.setItem('arena_user', JSON.stringify(state.currentUser));
  }

  closeModal();
  if (state.currentMode === 'admin') renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      // Envia estritamente as colunas existentes na tabela admin_users
      await client.from('admin_users').upsert([{
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        password: updatedUser.password,
        role: dbRole
      }]);
    } catch(e) {
      console.warn('Erro ao salvar edição no Supabase:', e);
    }
  }

  alert(`✅ Gestor "${name}" atualizado com sucesso!\n\nE-mail: ${email}\nSenha: ${password}\nCargo: ${role}\nPermissões ativas: ${permissions.length}/12`);
}
window.handleEditAdminUserSubmit = handleEditAdminUserSubmit;

async function handleNewAdminUserSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('newAdminName').value.trim();
  const email = document.getElementById('newAdminEmail').value.trim();
  const role = document.getElementById('newAdminRole').value;
  const password = document.getElementById('newAdminPassword').value.trim();

  if (!name || !email || !password) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  // Extrai as permissões marcadas na matriz 4x3
  const permissions = SYSTEM_PERMISSIONS
    .map(p => p.id)
    .filter(permId => {
      const el = document.getElementById(`newAdmin_perm_${permId}`);
      return el ? el.checked : false;
    });

  const dbRole = permissions && permissions.length > 0 
    ? `${role}::perms:${permissions.join(',')}` 
    : role;

  const newUser = {
    id: 'admin-' + Date.now(),
    name,
    email,
    role,
    password,
    permissions,
    created_at: new Date().toISOString()
  };

  state.adminUsers.push(newUser);
  localStorage.setItem('arena_admin_users', JSON.stringify(state.adminUsers));

  closeModal();
  if (state.currentMode === 'admin') renderStepContent();

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      // Envia estritamente as colunas existentes na tabela admin_users
      await client.from('admin_users').insert([{
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: dbRole
      }]);
    } catch(e) {
      console.warn('Erro ao inserir novo gestor no Supabase:', e);
    }
  }

  alert(`✅ Gestor "${name}" cadastrado com sucesso!\n\nE-mail: ${email}\nSenha: ${password}\nCargo: ${role}\nPermissões ativas: ${permissions.length}/12`);
}
window.handleNewAdminUserSubmit = handleNewAdminUserSubmit;

async function loadAdminUsers() {
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      const { data, error } = await client.from('admin_users').select('*');
      if (data && data.length > 0) {
        const normalizedFromDb = data.map(u => {
          let roleName = u.role || 'Recepção & Atendimento';
          let perms = [];
          if (roleName.includes('::perms:')) {
            const parts = roleName.split('::perms:');
            roleName = parts[0];
            perms = parts[1].split(',').filter(Boolean);
          } else {
            if (roleName === 'Administrador Geral' || (u.email && u.email.toLowerCase() === 'admin@arenalimoeiro.com.br')) {
              perms = SYSTEM_PERMISSIONS.map(p => p.id);
            } else if (roleName === 'Gerente do Sistema') {
              perms = SYSTEM_PERMISSIONS.filter(p => p.id !== 'can_manage_settings').map(p => p.id);
            } else {
              perms = ['can_start_matches', 'can_finish_matches', 'can_manage_bar', 'can_direct_booking'];
            }
          }
          return {
            ...u,
            role: roleName,
            permissions: perms
          };
        });

        const mergedMap = new Map();
        (state.adminUsers || []).forEach(u => { if (u && (u.id || u.email)) mergedMap.set(u.id || u.email, u); });
        normalizedFromDb.forEach(u => { if (u && (u.id || u.email)) mergedMap.set(u.id || u.email, u); });
        state.adminUsers = Array.from(mergedMap.values());
        localStorage.setItem('arena_admin_users', JSON.stringify(state.adminUsers));
        if (state.currentMode === 'admin' && state.adminTab === 'users') renderStepContent();
      }
    } catch(e) {
      console.warn('Erro ao carregar admin_users do Supabase:', e);
    }
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

// MODAL DE PRODUTOS (CRIAR E EDITAR)
function openProductModal(productId = null) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const existing = productId ? (state.products || []).find(p => p.id === productId) : null;
  const isEditing = !!existing;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <i data-lucide="${isEditing ? 'pencil' : 'plus-circle'}" class="w-5 h-5 text-emerald-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase">${isEditing ? 'Editar Produto / Item do Bar' : 'Cadastrar Produto / Item de Bar'}</h3>
              <p class="text-xs text-emerald-300 font-medium">${isEditing ? 'Altere nome, categoria, preço ou foto do produto' : 'Adicione água, bebidas, gelo ou lanches para os clientes'}</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleProductSubmit(event, '${isEditing ? existing.id : ''}')" class="p-6 space-y-4" autocomplete="off">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Produto / Item *</label>
            <input type="text" id="prodName" required placeholder="Ex: Garrafa de Água com Gás 500ml" 
                   value="${existing ? (existing.name || '').replace(/"/g, '&quot;') : ''}"
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Categoria *</label>
              <select id="prodCategory" class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white font-medium">
                <option value="Bebidas" ${existing && existing.category === 'Bebidas' ? 'selected' : ''}>Bebidas & Água</option>
                <option value="Alimentos" ${existing && existing.category === 'Alimentos' ? 'selected' : ''}>Alimentos & Lanches</option>
                <option value="Churrasco" ${existing && existing.category === 'Churrasco' ? 'selected' : ''}>Churrasco & Gelo</option>
                <option value="Equipamentos" ${existing && existing.category === 'Equipamentos' ? 'selected' : ''}>Equipamentos</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Preço Unitário (R$) *</label>
              <input type="number" step="0.50" id="prodPrice" required placeholder="5.00" 
                     value="${existing ? Number(existing.price || 0).toFixed(2) : ''}"
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Unidade de Medida</label>
            <input type="text" id="prodUnit" placeholder="unid, lata, garrafa, saco" 
                   value="${existing ? (existing.unit || 'unid.') : 'unid.'}" 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
              <span>Foto do Produto</span>
              <span class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Salva Direto no Banco</span>
            </label>

            <!-- Armazena os dados da foto em base64 diretamente para o banco de dados -->
            <input type="hidden" id="prodImage" value="${existing && existing.image ? existing.image : ''}">

            <div class="flex items-center space-x-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <!-- Miniatura com enquadramento proporcional que nunca corta a imagem -->
              <div class="relative w-20 h-20 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden" id="prodImagePreviewContainer">
                <img id="prodImagePreview" 
                     src="${existing && existing.image ? existing.image : 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80'}" 
                     alt="Foto do produto" 
                     class="w-full h-full object-contain">
              </div>

              <div class="flex-1 min-w-0">
                <input type="file" id="prodImageFileInput" accept="image/*" class="hidden" onchange="handleProductPhotoSelected(event)">
                
                <button type="button" onclick="document.getElementById('prodImageFileInput').click()" 
                        class="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer">
                  <i data-lucide="upload" class="w-4 h-4"></i>
                  <span id="prodUploadBtnText">${existing && existing.image ? 'Trocar Foto do Aparelho' : 'Escolher Foto do Aparelho'}</span>
                </button>
                <p class="text-[10px] text-slate-500 mt-1.5 leading-tight">
                  Selecione da galeria ou câmera. A foto diminui proporcionalmente para a miniatura sem cortes e é gravada direto no banco de dados.
                </p>
                <div id="prodImageLoading" class="hidden mt-1.5 text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                  <span class="animate-spin inline-block">⏳</span>
                  <span>Otimizando e preparando foto...</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">Cancelar</button>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer">
              ${isEditing ? 'Salvar Alterações' : 'Cadastrar no Cardápio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function handleProductPhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const loadingEl = document.getElementById('prodImageLoading');
  if (loadingEl) loadingEl.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Redimensiona proporcionalmente mantendo a proporção exata para caber na miniatura
      const maxDim = 500;
      let w = img.width;
      let h = img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // Comprime para JPEG de alta definição com tamanho compacto (~30KB) para salvar no banco
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const hiddenInput = document.getElementById('prodImage');
      if (hiddenInput) hiddenInput.value = compressedDataUrl;

      const previewImg = document.getElementById('prodImagePreview');
      if (previewImg) {
        previewImg.src = compressedDataUrl;
        previewImg.className = 'w-full h-full object-contain';
      }

      const btnText = document.getElementById('prodUploadBtnText');
      if (btnText) btnText.textContent = 'Trocar Foto Selecionada';

      if (loadingEl) loadingEl.classList.add('hidden');
    };
    img.onerror = function() {
      if (loadingEl) loadingEl.classList.add('hidden');
      alert('Não foi possível ler a imagem selecionada.');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.handleProductPhotoSelected = handleProductPhotoSelected;

async function handleProductSubmit(event, editId) {
  event.preventDefault();
  const name = document.getElementById('prodName').value.trim();
  const category = document.getElementById('prodCategory').value;
  const price = parseFloat(document.getElementById('prodPrice').value) || 5.00;
  const unit = document.getElementById('prodUnit').value.trim() || 'unid.';
  const image = document.getElementById('prodImage').value.trim() || 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=200&auto=format&fit=crop&q=80';

  if (editId) {
    const idx = (state.products || []).findIndex(p => p.id === editId);
    if (idx !== -1) {
      state.products[idx] = {
        ...state.products[idx],
        name,
        category,
        price,
        unit,
        image
      };
    }
    localStorage.setItem('arena_local_products', JSON.stringify(state.products));
    if (typeof logSystemAction === 'function') {
      logSystemAction('UPDATE_PRODUCT', {
        courtName: 'Bar & Lanchonete',
        details: `Atualizou produto "${name}" (R$ ${price.toFixed(2).replace('.', ',')}) no cardápio`
      });
    }
    closeModal();
    renderStepContent();
    lucide.createIcons();

    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      try {
        const client = window.ArenaSupabase.getClient();
        await client.from('products').update({ name, category, price, unit, image }).eq('id', editId);
      } catch(e) {}
    }
  } else {
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
    localStorage.setItem('arena_local_products', JSON.stringify(state.products));
    if (typeof logSystemAction === 'function') {
      logSystemAction('CREATE_PRODUCT', {
        courtName: 'Bar & Lanchonete',
        details: `Cadastrou novo produto "${name}" (R$ ${price.toFixed(2).replace('.', ',')}) no cardápio`
      });
    }
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
}

// 📸 GERENCIADOR DE GALERIA DE FOTOS DA QUADRA (ADMIN)
window._courtModalGallery = [];

function renderCourtModalGallery() {
  const container = document.getElementById('courtModalGalleryList');
  const countEl = document.getElementById('courtModalGalleryCount');
  if (!container) return;

  const gallery = window._courtModalGallery || [];
  if (countEl) {
    countEl.textContent = `${gallery.length} foto${gallery.length === 1 ? '' : 's'}`;
  }

  if (gallery.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-5 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
        <i data-lucide="image" class="w-6 h-6 mx-auto mb-1 text-slate-300"></i>
        <p class="text-xs font-semibold text-slate-500">Nenhuma foto adicionada nesta quadra ainda.</p>
        <p class="text-[10px] text-slate-400">Adicione uma URL ou envie uma foto do dispositivo abaixo.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = gallery.map((imgUrl, idx) => `
    <div class="relative group rounded-xl overflow-hidden border ${idx === 0 ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200'} bg-slate-100 aspect-video flex flex-col justify-between shadow-sm">
      <img src="${imgUrl}" onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'" class="w-full h-full object-cover">
      
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40">
        <!-- Top bar: Capa e Excluir -->
        <div class="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
          ${idx === 0 ? `
            <span class="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-0.5">
              <span>★ Capa</span>
            </span>
          ` : `
            <button type="button" onclick="setCourtModalCoverImage(${idx})" 
                    class="bg-black/70 hover:bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm transition-colors cursor-pointer" 
                    title="Definir como primeira foto / capa">
              Tornar Capa
            </button>
          `}
          
          <button type="button" onclick="removeCourtModalGalleryImage(${idx})" 
                  class="w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow" 
                  title="Remover esta foto">
            <i data-lucide="trash-2" class="w-3 h-3"></i>
          </button>
        </div>

        <!-- Bottom bar: índice -->
        <div class="absolute bottom-1.5 left-2">
          <span class="text-[10px] font-bold text-white/90 drop-shadow">Foto #${idx + 1}</span>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function addCourtModalGalleryImage(url) {
  const clean = (url || '').trim();
  if (!clean) return;
  window._courtModalGallery = window._courtModalGallery || [];
  if (!window._courtModalGallery.includes(clean)) {
    window._courtModalGallery.push(clean);
  }
  renderCourtModalGallery();
  const input = document.getElementById('courtNewPhotoUrl');
  if (input) input.value = '';
}

function removeCourtModalGalleryImage(index) {
  window._courtModalGallery = window._courtModalGallery || [];
  if (index >= 0 && index < window._courtModalGallery.length) {
    window._courtModalGallery.splice(index, 1);
    renderCourtModalGallery();
  }
}

function setCourtModalCoverImage(index) {
  window._courtModalGallery = window._courtModalGallery || [];
  if (index > 0 && index < window._courtModalGallery.length) {
    const item = window._courtModalGallery.splice(index, 1)[0];
    window._courtModalGallery.unshift(item);
    renderCourtModalGallery();
  }
}

function handleCourtImageUpload(inputEl) {
  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
  const file = inputEl.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const rawDataUrl = e.target.result;
    const img = new Image();
    img.onload = function() {
      const maxWidth = 960;
      const maxHeight = 640;
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.80);
      addCourtModalGalleryImage(compressedDataUrl);
      inputEl.value = '';
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

function setCourtFormImage(url) {
  addCourtModalGalleryImage(url);
}

function openCourtModal(courtIdToEdit = null) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const isEditing = !!courtIdToEdit;
  const court = isEditing ? (state.courts || []).find(c => c.id === courtIdToEdit) : null;
  const specs = court ? (typeof court.specs === 'string' ? JSON.parse(court.specs || '{}') : (court.specs || {})) : {};

  const currentOpenTime = specs.opening_time || '06:00';
  const currentCloseTime = specs.closing_time || '23:00';
  const currentImage = court ? court.image : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';

  const initialGallery = (specs && Array.isArray(specs.gallery) && specs.gallery.length > 0)
    ? [...specs.gallery]
    : (court && court.gallery && Array.isArray(court.gallery) && court.gallery.length > 0 ? [...court.gallery] : (court && court.image ? [court.image] : [currentImage]));
  window._courtModalGallery = initialGallery.filter(Boolean);
  if (window._courtModalGallery.length === 0) {
    window._courtModalGallery = [currentImage];
  }

  const defaultHoursList = [
    "06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
    "18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30","00:00"
  ];

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="p-2 ${isEditing ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'} rounded-xl border border-white/10">
              <i data-lucide="${isEditing ? 'edit-3' : 'plus-circle'}" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-lg font-black uppercase tracking-tight">
                ${isEditing ? 'Editar Espaço / Quadra' : 'Cadastrar Novo Espaço de Jogo'}
              </h3>
              <p class="text-xs text-emerald-200 font-medium">Modifique valores, horários, descrição, capacidade e fotos</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="courtForm" onsubmit="handleCourtFormSubmit(event, '${courtIdToEdit || ''}')" class="p-6 overflow-y-auto space-y-4">
          
          <!-- Nome da Quadra -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Espaço / Quadra *</label>
            <input type="text" id="courtName" required 
                   value="${court ? court.name : ''}" 
                   placeholder="Ex: FUT 5, Campo Society 01, Arena Beach 02, etc." 
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>

          <!-- Modalidade e Valores -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-slate-700 uppercase">Modalidade *</label>
                <button type="button" onclick="openCategoryModal(true)" class="text-[11px] font-black text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-0.5">
                  <span>+ Criar</span>
                </button>
              </div>
              <select id="courtCategory" required class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white font-bold text-slate-800">
                ${(state.categories || []).filter(c => c.id !== 'all').map(cat => `
                  <option value="${cat.id}" ${court && court.category === cat.id ? 'selected' : ''}>${cat.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Hora Avulsa (R$) *</label>
              <input type="number" step="0.50" id="courtPrice" required 
                     value="${court ? getCourtNormalHourlyPrice(court).toFixed(2) : '140.00'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-black text-emerald-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Mensalista (R$/mês)</label>
              <input type="number" step="1.00" id="courtMonthlyPrice" 
                     value="${court ? getCourtMonthlyPrice(court).toFixed(2) : '500.00'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <!-- Horários de Funcionamento da Quadra -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div class="flex items-center space-x-1.5 text-xs font-black text-slate-800 uppercase tracking-wide">
              <i data-lucide="clock" class="w-4 h-4 text-emerald-600"></i>
              <span>Horários de Funcionamento (Horas Normais 06:00 às 22:00 / 23:00)</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Abertura / Início dos Jogos</label>
                <select id="courtOpeningTime" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-bold text-slate-800">
                  ${defaultHoursList.slice(0, 20).map(h => `
                    <option value="${h}" ${currentOpenTime === h ? 'selected' : ''}>${h}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-600 uppercase mb-1">Término / Fim dos Jogos</label>
                <select id="courtClosingTime" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-bold text-slate-800">
                  ${defaultHoursList.slice(12).map(h => `
                    <option value="${h}" ${currentCloseTime === h ? 'selected' : ''}>${h}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            <p class="text-[10px] text-slate-500 italic">Horário integral de funcionamento no qual vigora o valor cheio por hora.</p>
          </div>

          <!-- DESCONTO DE HORÁRIO PROMOCIONAL (09:00 ÀS 16:00) -->
          <div class="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-2xl space-y-3">
            <div class="flex items-center space-x-2">
              <span class="p-1.5 bg-amber-500 text-white rounded-lg text-sm">🔥</span>
              <div>
                <h4 class="text-xs font-black text-amber-950 uppercase tracking-wide">Desconto por Horário (09h às 16h)</h4>
                <p class="text-[11px] text-amber-800">Coloque o valor com desconto que será exibido na tela para os clientes</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label class="block text-[11px] font-black text-amber-950 uppercase mb-1">Valor com Desconto (R$/h)</label>
                <input type="number" step="0.50" id="courtDiscountPrice" 
                       value="${specs.discount_price_per_hour || (court ? court.discountPricePerHour : '') || ''}" 
                       placeholder="Ex: 50.00 ou 60.00" 
                       class="w-full p-2.5 border border-amber-300 bg-white rounded-xl text-sm font-black text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Início do Desconto</label>
                <select id="courtDiscountStart" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-bold text-slate-800">
                  ${defaultHoursList.slice(0, 24).map(h => `
                    <option value="${h}" ${(specs.discount_start_time || '09:00') === h ? 'selected' : ''}>${h}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Fim do Desconto</label>
                <select id="courtDiscountEnd" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-bold text-slate-800">
                  ${defaultHoursList.slice(6, 30).map(h => `
                    <option value="${h}" ${(specs.discount_end_time || '16:00') === h ? 'selected' : ''}>${h}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
              <span class="font-bold shrink-0">💡 Como funciona:</span>
              <span>Nos horários normais (06h às 22h) vale o valor cheio. Das <strong>09h às 16h</strong>, os clientes verão o valor com desconto destacado com a tag de promoção na tela e pagarão o valor promocional!</span>
            </div>
          </div>

          <!-- Capacidade e Tipo de Piso -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Capacidade de Jogadores</label>
              <input type="text" id="courtCapacity" 
                     value="${specs.capacity || (court ? court.capacity : '10 a 14 Jogadores') || '10 a 14 Jogadores'}" 
                     placeholder="Ex: 10 a 12 Jogadores (5x5), 14 a 16 (7x7)..."
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Piso / Estrutura</label>
              <input type="text" id="courtType" 
                     value="${specs.surface || specs.type || (court ? court.type : 'Grama Sintética 60mm') || 'Grama Sintética 60mm'}" 
                     placeholder="Ex: Grama Sintética 60mm, Areia Filtrada, Piso Rápido..."
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>
          </div>

          <!-- Descrição e Observações -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Descrição do Espaço</label>
            <textarea id="courtDescription" rows="2" 
                      placeholder="Descreva as qualidades da quadra, iluminação, cobertura, vestiários e conforto..." 
                      class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">${court ? (court.description || '') : ''}</textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Observações / Regras</label>
            <textarea id="courtObservation" rows="2" 
                      placeholder="Ex: Proibido travas de campo, permitido apenas chuteiras society ou tênis..." 
                      class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none">${court ? (court.observation || '') : ''}</textarea>
          </div>

          <!-- Fotos da Quadra (Galeria para os Jogadores) -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <i data-lucide="images" class="w-4 h-4 text-emerald-600"></i>
                  <span>Fotos da Quadra (Galeria de Imagens)</span>
                </label>
                <p class="text-[11px] text-slate-500 font-medium">As fotos cadastradas aqui serão exibidas para os clientes com setinhas no computador e arrasto de dedo no celular.</p>
              </div>
              <span id="courtModalGalleryCount" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                ${(window._courtModalGallery || []).length} fotos
              </span>
            </div>

            <!-- Grade de Miniaturas da Galeria -->
            <div id="courtModalGalleryList" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <!-- Renderizado dinamicamente por renderCourtModalGallery() -->
            </div>

            <!-- Adicionar Foto por URL ou Upload -->
            <div class="pt-2 border-t border-slate-200 space-y-2">
              <label class="block text-[11px] font-bold text-slate-700 uppercase">Adicionar Nova Foto:</label>
              <div class="flex items-center gap-2">
                <input type="url" id="courtNewPhotoUrl" 
                       placeholder="Cole o link da imagem (https://...)" 
                       class="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-mono">
                
                <button type="button" onclick="const u=document.getElementById('courtNewPhotoUrl').value; addCourtModalGalleryImage(u);"
                        class="px-3 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  <span>Adicionar</span>
                </button>

                <input type="file" id="courtPhotoFileInput" accept="image/*" class="hidden" onchange="handleCourtImageUpload(this)">
                <button type="button" onclick="document.getElementById('courtPhotoFileInput').click();"
                        title="Enviar foto do computador ou celular"
                        class="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer border border-slate-300">
                  <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Enviar Arquivo</span>
                </button>
              </div>

              <!-- Atalhos rápidos para fotos esportivas -->
              <div class="pt-1">
                <span class="text-[10px] text-slate-400 font-semibold block mb-1">Ou adicione fotos rápidas de alta qualidade:</span>
                <div class="flex flex-wrap gap-1.5">
                  <button type="button" onclick="addCourtModalGalleryImage('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80')" class="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer">
                    + ⚽ Society Campo
                  </button>
                  <button type="button" onclick="addCourtModalGalleryImage('https://images.unsplash.com/photo-1529900245534-47fbf8204bca?w=800&auto=format&fit=crop&q=80')" class="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer">
                    + 🏟️ Society Coberto
                  </button>
                  <button type="button" onclick="addCourtModalGalleryImage('https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80')" class="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer">
                    + 🏐 Beach Tennis
                  </button>
                  <button type="button" onclick="addCourtModalGalleryImage('https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80')" class="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer">
                    + 🏀 Futsal / Ginásio
                  </button>
                  <button type="button" onclick="addCourtModalGalleryImage('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=80')" class="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-all cursor-pointer">
                    + 🎾 Padel / Tênis
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Rodapé com Salvar e Excluir -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            ${isEditing ? `
              <button type="button" onclick="deleteCourt('${courtIdToEdit}', true)" 
                      class="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-rose-200 cursor-pointer">
                <i data-lucide="trash-2" class="w-4 h-4 text-rose-600"></i>
                <span>Excluir Quadra</span>
              </button>
            ` : '<div></div>'}

            <div class="flex items-center space-x-3">
              <button type="button" onclick="closeModal()" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer">
                Cancelar
              </button>
              <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>${isEditing ? 'Salvar Alterações' : 'Criar Espaço'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  renderCourtModalGallery();
  if (window.lucide) lucide.createIcons();
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
  const openingTime = document.getElementById('courtOpeningTime')?.value || '06:00';
  const closingTime = document.getElementById('courtClosingTime')?.value || '23:00';
  const discountPrice = parseFloat(document.getElementById('courtDiscountPrice')?.value) || 0;
  const discountStart = document.getElementById('courtDiscountStart')?.value || '09:00';
  const discountEnd = document.getElementById('courtDiscountEnd')?.value || '16:00';

  const gallery = (window._courtModalGallery && window._courtModalGallery.length > 0)
    ? window._courtModalGallery.filter(Boolean)
    : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'];
  const primaryImage = gallery[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';

  const categoryLabels = {
    society: "Futebol Society", beach: "Beach Tennis & Vôlei", futsal: "Ginásio Poliesportivo", padel: "Padel & Tênis"
  };
  const foundCat = (state.categories || []).find(c => c.id === category);
  const resolvedCategoryLabel = foundCat ? foundCat.name : (categoryLabels[category] || "Esporte");

  const isEditing = !!courtIdToEdit;
  const id = isEditing ? courtIdToEdit : ('court-' + category + '-' + Date.now());

  const existingCourt = isEditing ? (state.courts || []).find(c => c.id === courtIdToEdit) : null;
  const existingSpecs = existingCourt && existingCourt.specs ? (typeof existingCourt.specs === 'string' ? JSON.parse(existingCourt.specs || '{}') : existingCourt.specs) : {};

  const savedCourt = {
    id,
    name,
    category,
    categoryLabel: resolvedCategoryLabel,
    category_label: resolvedCategoryLabel,
    basePricePerHour: price,
    base_price_per_hour: price,
    monthlyPrice,
    monthly_price: monthlyPrice,
    description,
    observation,
    image: primaryImage,
    gallery: gallery,
    specs: {
      ...existingSpecs,
      gallery: gallery,
      type: type || "Piso Esportivo",
      surface: type || "Piso Esportivo",
      capacity: capacity || "10 a 16 Jogadores",
      opening_time: openingTime,
      closing_time: closingTime,
      discount_price_per_hour: discountPrice,
      discount_start_time: discountStart,
      discount_end_time: discountEnd,
      features: existingSpecs.features || ["Iluminação LED", "Vestiários"],
      status: existingSpecs.status || "Disponível"
    },
    discountPricePerHour: discountPrice,
    discount_price_per_hour: discountPrice,
    discountStartTime: discountStart,
    discountEndTime: discountEnd,
    badge: existingCourt ? existingCourt.badge : null,
    badge_mode: existingSpecs.badge_mode || 'none',
    badge_text: existingSpecs.badge_text || '',
    badge_auto_freq: existingSpecs.badge_auto_freq || 'weekly'
  };

  closeModal();

  if (isEditing) {
    const idx = state.courts.findIndex(c => c.id === courtIdToEdit);
    if (idx !== -1) state.courts[idx] = normalizeCourt(savedCourt);
    if (state.selectedCourt && state.selectedCourt.id === courtIdToEdit) state.selectedCourt = normalizeCourt(savedCourt);
  } else {
    state.courts.push(normalizeCourt(savedCourt));
    state.selectedCourt = normalizeCourt(savedCourt);
  }

  // Persistir em localStorage
  try {
    localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
  } catch(e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }

  renderStepContent();
  if (typeof renderNavbar === 'function') renderNavbar();
  if (window.lucide) lucide.createIcons();

  if (typeof showNotification === 'function') {
    showNotification(isEditing ? `Quadra "${name}" atualizada com sucesso!` : `Quadra "${name}" criada com sucesso!`, 'success');
  }

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      if (isEditing) {
        await client.from('courts').update({
          name, 
          category, 
          category_label: savedCourt.categoryLabel,
          base_price_per_hour: price, 
          monthly_price: monthlyPrice,
          description, 
          observation, 
          image: savedCourt.image, 
          specs: savedCourt.specs,
          badge: savedCourt.badge
        }).eq('id', courtIdToEdit);
      } else {
        await client.from('courts').insert([{
          id, 
          name, 
          category, 
          category_label: savedCourt.categoryLabel,
          base_price_per_hour: price, 
          monthly_price: monthlyPrice,
          description, 
          observation, 
          image: savedCourt.image, 
          specs: savedCourt.specs,
          badge: savedCourt.badge,
          order_index: state.courts.length
        }]);
      }
      if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
        window.ArenaSupabase.broadcastCourtUpdate(savedCourt);
      }
    } catch(e) {
      console.warn('Erro ao salvar quadra no Supabase:', e);
    }
  }
}

async function deleteCourt(courtId, fromModal = false) {
  const court = (state.courts || []).find(c => c.id === courtId);
  const courtName = court ? court.name : 'esta quadra';

  if (!confirm(`Tem certeza que deseja excluir permanentemente a quadra "${courtName}"?\nEsta ação removerá a quadra e não poderá ser desfeita.`)) return;

  state.courts = state.courts.filter(c => c.id !== courtId);
  if (state.selectedCourt && state.selectedCourt.id === courtId) {
    state.selectedCourt = state.courts[0] || null;
  }

  // Persistir em localStorage
  try {
    localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
  } catch(e) {
    console.warn('Erro ao salvar quadras no localStorage:', e);
  }

  if (fromModal || document.getElementById('modalRoot')?.innerHTML) {
    closeModal();
  }

  renderStepContent();
  if (typeof renderNavbar === 'function') renderNavbar();
  if (window.lucide) lucide.createIcons();

  if (typeof showNotification === 'function') {
    showNotification(`Quadra "${courtName}" excluída com sucesso!`, 'success');
  }

  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      await client.from('courts').delete().eq('id', courtId);
    } catch(e) {
      console.warn('Erro ao deletar quadra no Supabase:', e);
    }
  }
}

// 🏷️ EDIÇÃO E PERSISTÊNCIA DE MODALIDADES / CATEGORIAS (TELA INICIAL & PAINEL)
// ==============================================================================
function openEditCategoryModal(catId) {
  const cat = (state.categories || []).find(c => c.id === catId);
  if (!cat) return;

  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const iconOptions = [
    { id: 'trophy', name: '🏆 Troféu / Competição' },
    { id: 'sun', name: '☀️ Sol / Beach & Areia' },
    { id: 'activity', name: '⚡ Atividade / Ginásio' },
    { id: 'flame', name: '🔥 Fogo / Padel & Raquete' },
    { id: 'target', name: '🎯 Alvo / Treino' },
    { id: 'zap', name: '⚡ Energia / Dinâmico' },
    { id: 'medal', name: '🏅 Medalha' },
    { id: 'heart', name: '❤️ Saúde & Bem-estar' },
    { id: 'shield', name: '🛡️ Escudo / Torneio' },
    { id: 'flag', name: '🚩 Bandeira' }
  ];

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <i data-lucide="edit-3" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black uppercase tracking-tight">
                Editar Modalidade
              </h3>
              <p class="text-xs text-emerald-300 font-medium">Modifique o nome ou identificador no sistema</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="handleEditCategorySubmit(event, '${cat.id}')" class="p-5 sm:p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nome da Modalidade / Categoria *
            </label>
            <input type="text" id="editCategoryNameInput" required value="${cat.name}" 
                   placeholder="Ex: Futebol Society, Beach Tennis, Futsal, etc."
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            <p class="text-[11px] text-slate-500 mt-1">Este nome é exibido na barra de filtros da tela inicial e no cabeçalho das quadras.</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span>Identificador Técnico (ID / Slug) *</span>
              <span class="text-[10px] text-slate-400 font-normal lowercase">letras, números e traços</span>
            </label>
            <input type="text" id="editCategoryIdInput" required value="${cat.id}" 
                   placeholder="Ex: society, beach, futsal, padel"
                   class="w-full p-3 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            <p class="text-[11px] text-slate-500 mt-1">Código do sistema. Ao alterar este identificador, todas as quadras vinculadas a ele serão sincronizadas automaticamente.</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ícone Representativo
            </label>
            <select id="editCategoryIconInput" class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 bg-white">
              ${iconOptions.map(ico => `
                <option value="${ico.id}" ${(cat.icon || 'activity') === ico.id ? 'selected' : ''}>${ico.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center space-x-2">
            <span>💾</span>
            <span>Alterações salvas permanentemente no sistema e sincronizadas com as quadras.</span>
          </div>

          <div class="flex items-center space-x-2 pt-2">
            <button type="button" onclick="closeModal()" class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

async function handleEditCategorySubmit(event, oldCatId) {
  event.preventDefault();
  const nameInput = document.getElementById('editCategoryNameInput');
  const idInput = document.getElementById('editCategoryIdInput');
  const iconInput = document.getElementById('editCategoryIconInput');
  if (!nameInput || !idInput) return;

  const newName = nameInput.value.trim();
  let rawNewId = idInput.value.trim();
  const newIcon = (iconInput && iconInput.value) || 'activity';

  if (!newName) {
    alert('Por favor, informe o nome da modalidade.');
    return;
  }

  // Sanitizar o novo identificador
  let newId = rawNewId.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (!newId) {
    alert('Por favor, informe um identificador válido (apenas letras, números e traços).');
    return;
  }

  // Impedir usar 'all' como id se for outra categoria
  if (oldCatId !== 'all' && newId === 'all') {
    alert('O identificador "all" é reservado para o filtro geral.');
    return;
  }

  // Se o id mudou, verificar se já existe outra categoria com esse id
  if (newId !== oldCatId && (state.categories || []).some(c => c.id === newId)) {
    alert(`Já existe outra categoria com o identificador "${newId}". Escolha um identificador diferente.`);
    return;
  }

  // 1. Atualizar na lista de categorias do estado
  const cat = (state.categories || []).find(c => c.id === oldCatId);
  if (cat) {
    cat.id = newId;
    cat.name = newName;
    cat.icon = newIcon;
  }

  // 2. Atualizar em todas as quadras vinculadas no estado
  let updatedCourtsCount = 0;
  (state.courts || []).forEach(court => {
    if (court.category === oldCatId) {
      court.category = newId;
      court.categoryLabel = newName;
      court.category_label = newName;
      updatedCourtsCount++;
    } else if (court.category === newId) {
      court.categoryLabel = newName;
      court.category_label = newName;
    }
  });

  // 3. Atualizar selectedCategory se estava na antiga
  if (state.selectedCategory === oldCatId) {
    state.selectedCategory = newId;
  }

  // 4. Salvar permanentemente em localStorage
  try {
    localStorage.setItem('arena_categories', JSON.stringify(state.categories));
    localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
  } catch(e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }

  // 5. Se o Supabase estiver conectado, atualizar no banco
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      if (newId !== oldCatId) {
        await client.from('courts').update({ category: newId, category_label: newName }).eq('category', oldCatId);
      } else {
        await client.from('courts').update({ category_label: newName }).eq('category', oldCatId);
      }
    } catch(err) {
      console.warn('Aviso sincronizacao categoria no Supabase:', err);
    }
  }

  closeModal();

  // 6. Re-renderizar telas ativas
  renderStepContent();
  if (typeof renderNavbar === 'function') renderNavbar();
  if (window.lucide) lucide.createIcons();

  if (typeof showNotification === 'function') {
    const msg = updatedCourtsCount > 0 
      ? `Modalidade "${newName}" (ID: ${newId}) atualizada! ${updatedCourtsCount} quadra(s) sincronizada(s).`
      : `Modalidade "${newName}" (ID: ${newId}) atualizada com sucesso!`;
    showNotification(msg, 'success');
  }
}

function openCategoryModal(returnToCourtModal = false) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;
  const categoriesList = state.categories || [];

  // Icon options for quick pick
  const iconOptions = [
    { id: 'activity', name: 'Atividade Geral' },
    { id: 'trophy', name: 'Troféu / Competição' },
    { id: 'target', name: 'Alvo / Mira' },
    { id: 'zap', name: 'Energia / Dinâmico' },
    { id: 'flame', name: 'Fogo / Intenso' },
    { id: 'compass', name: 'Orientação / Treino' },
    { id: 'medal', name: 'Medalha' },
    { id: 'shield', name: 'Escudo / Defesa' },
    { id: 'flag', name: 'Bandeira' },
    { id: 'heart', name: 'Saúde & Bem-estar' }
  ];

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-fade-in">
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="p-2 bg-white/10 rounded-xl">
              <i data-lucide="tag" class="w-6 h-6 text-emerald-400"></i>
            </div>
            <div>
              <h3 class="text-lg font-black uppercase tracking-tight">
                Categorias & Modalidades
              </h3>
              <p class="text-xs text-emerald-300 font-medium">Adicione ou gerencie as modalidades disponíveis na Arena</p>
            </div>
          </div>
          <button onclick="${returnToCourtModal ? 'openCourtModal()' : 'closeModal()'}" class="text-emerald-300 hover:text-white p-1">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Categorias Cadastradas -->
          <div>
            <h4 class="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">Modalidades Existentes</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${categoriesList.filter(c => c.id !== 'all').map(cat => {
                return `
                  <div class="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all">
                    <div class="flex items-center space-x-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4"></i>
                      </div>
                      <div class="min-w-0">
                        <span class="text-xs font-bold text-slate-800 truncate block">${cat.name}</span>
                        <span class="text-[10px] font-mono text-slate-500">${cat.id}</span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-1">
                      <button onclick="openEditCategoryModal('${cat.id}')" title="Editar Modalidade" class="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="deleteCategory('${cat.id}', ${returnToCourtModal})" title="Excluir Categoria" class="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Formulário de Nova Categoria -->
          <div class="pt-4 border-t border-slate-200">
            <h4 class="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-600"></i>
              <span>Adicionar Nova Modalidade</span>
            </h4>

            <form id="categoryForm" onsubmit="handleCategoryFormSubmit(event, ${returnToCourtModal})" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Modalidade / Esporte *</label>
                <input type="text" id="newCategoryName" required 
                       placeholder="Ex: Futevôlei & Areia, Basquete 3x3, Pickleball, Crossfit..." 
                       class="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Ícone Representativo</label>
                <select id="newCategoryIcon" class="w-full p-3 border border-slate-300 rounded-xl text-sm bg-white font-medium">
                  ${iconOptions.map(ico => `
                    <option value="${ico.id}">${ico.name} (${ico.id})</option>
                  `).join('')}
                </select>
              </div>

              <div class="pt-2 flex items-center justify-end space-x-3">
                <button type="button" onclick="${returnToCourtModal ? 'openCourtModal()' : 'closeModal()'}" 
                        class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  ${returnToCourtModal ? 'Voltar para Quadra' : 'Cancelar'}
                </button>
                <button type="submit" 
                        class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all">
                  <i data-lucide="check" class="w-4 h-4"></i>
                  <span>Salvar Categoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
  setTimeout(() => {
    const input = document.getElementById('newCategoryName');
    if (input) input.focus();
  }, 100);
}

function handleCategoryFormSubmit(event, returnToCourtModal = false) {
  event.preventDefault();
  const nameInput = document.getElementById('newCategoryName');
  const iconInput = document.getElementById('newCategoryIcon');
  if (!nameInput) return;

  const name = nameInput.value.trim();
  const icon = (iconInput && iconInput.value) || 'activity';

  if (!name) {
    if (typeof showNotification === 'function') {
      showNotification('Digite o nome da modalidade/categoria.', 'warning');
    }
    return;
  }

  // Gera slug amigável
  const baseSlug = name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'esporte';

  let slug = baseSlug;
  let counter = 1;
  while (state.categories.some(c => c.id === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const newCat = {
    id: slug,
    name: name,
    icon: icon
  };

  state.categories.push(newCat);

  // Salva todas as categorias no localStorage
  try {
    localStorage.setItem('arena_categories', JSON.stringify(state.categories));
  } catch(e) {
    console.warn('Erro ao salvar arena_categories no localStorage:', e);
  }

  if (typeof showNotification === 'function') {
    showNotification(`Categoria "${name}" criada com sucesso!`, 'success');
  }

  if (returnToCourtModal) {
    openCourtModal();
    // Seleciona a recém criada
    setTimeout(() => {
      const select = document.getElementById('courtCategory');
      if (select) select.value = slug;
    }, 50);
  } else {
    closeModal();
    if (state.currentStep === 1) {
      renderStepContent();
    } else if (state.currentStep === 'admin') {
      renderStepContent();
    }
  }

  lucide.createIcons();
}

function deleteCategory(catId, returnToCourtModal = false) {
  if (catId === 'all') {
    if (typeof showNotification === 'function') {
      showNotification('A categoria principal "Todos" não pode ser removida.', 'warning');
    }
    return;
  }

  const cat = (state.categories || []).find(c => c.id === catId);
  const catName = cat ? cat.name : catId;

  const linkedCourts = (state.courts || []).filter(c => c.category === catId);
  let confirmMsg = `Deseja realmente excluir a modalidade "${catName}"?`;
  if (linkedCourts.length > 0) {
    confirmMsg = `Atenção: existem ${linkedCourts.length} quadra(s) vinculada(s) à modalidade "${catName}". Deseja realmente excluí-la?`;
  }

  if (!confirm(confirmMsg)) return;

  state.categories = (state.categories || []).filter(c => c.id !== catId);
  if (state.selectedCategory === catId) {
    state.selectedCategory = 'all';
  }

  try {
    localStorage.setItem('arena_categories', JSON.stringify(state.categories));
  } catch(e) {}

  if (typeof showNotification === 'function') {
    showNotification(`Modalidade "${catName}" removida com sucesso.`, 'info');
  }

  if (returnToCourtModal) {
    openCategoryModal(returnToCourtModal);
  } else {
    closeModal();
    renderStepContent();
    if (typeof renderNavbar === 'function') renderNavbar();
  }
  if (window.lucide) lucide.createIcons();
}


// ==============================================================================
// 📋 VALIDAÇÃO DE CPF & IDENTIFICAÇÃO INTELIGENTE DE ATLETA / PELADEIRO
// ==============================================================================


function parseCustomerFromObservation(obs) {
  if (!obs || typeof obs !== 'string') return {};
  const res = {};
  const cpfMatch = obs.match(/\[CPF:\s*([^\]]+)\]/i);
  if (cpfMatch) res.cpf = cpfMatch[1].trim();
  const saudeMatch = obs.match(/\[Saúde:\s*([^\]]+)\]/i);
  if (saudeMatch) res.health_notes = saudeMatch[1].trim();
  const emergMatch = obs.match(/\[Emergência:\s*([^\]]+)\]/i);
  if (emergMatch) res.emergency_contact = emergMatch[1].trim();
  return res;
}

function findCustomerByPhone(phone) {
  if (!phone) return null;
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return null;
  const last8 = clean.slice(-8);
  const last9 = clean.length >= 9 ? clean.slice(-9) : null;

  function matchInList(list, extractors) {
    if (!list || !list.length) return null;
    const matches = [];
    for (const item of list) {
      const p = extractors.phone(item);
      const cClean = (p || '').replace(/\D/g, '');
      if (!cClean) continue;
      if (cClean === clean || (last9 && cClean.length >= 9 && (cClean.endsWith(last9) || clean.endsWith(cClean.slice(-9)))) || (last8 && cClean.length >= 8 && (cClean.endsWith(last8) || clean.endsWith(cClean.slice(-8))))) {
        const formatted = extractors.format(item);
        if (formatted) matches.push(formatted);
      }
    }
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    // Mescla múltiplos registros encontrados para garantir que CPF e Emergência nunca se percam
    let merged = { ...matches[0] };
    for (let i = 1; i < matches.length; i++) {
      const m = matches[i];
      merged = {
        ...merged,
        id: merged.id || m.id,
        name: merged.name || m.name,
        phone: merged.phone || m.phone,
        email: merged.email || m.email,
        cpf: merged.cpf || m.cpf || '',
        document: merged.cpf || m.cpf || '',
        emergency_contact: merged.emergency_contact || m.emergency_contact || '',
        emergencyContact: merged.emergency_contact || m.emergency_contact || '',
        birth_date: merged.birth_date || m.birth_date || '',
        birthDate: merged.birth_date || m.birth_date || '',
        health_notes: (merged.health_notes && merged.health_notes !== 'Nenhuma restrição informada') ? merged.health_notes : (m.health_notes || merged.health_notes || '')
      };
    }
    return merged;
  }

  // 1. Procura em state.supabaseCustomers
  let found = matchInList(state.supabaseCustomers || [], {
    phone: c => c.phone,
    format: c => normalizeCustomer(c)
  });
  if (found) return found;

  // 2. Procura no localStorage (arena_customers)
  try {
    const local = JSON.parse(localStorage.getItem('arena_customers') || '[]');
    found = matchInList(local, {
      phone: c => c.phone,
      format: c => normalizeCustomer(c)
    });
    if (found) return found;
  } catch(e) {}

  // 3. Procura no histórico de reservas (state.bookings e arena_local_bookings)
  let localBookings = [];
  try { localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]'); } catch(e) {}
  const allBookings = [...localBookings, ...(state.bookings || [])];
  found = matchInList(allBookings, {
    phone: b => b.customer_phone || b.customerPhone,
    format: b => {
      const parsedObs = parseCustomerFromObservation(b.observation || '');
      return {
        id: b.customer_id || b.customerId || ('cust-' + Date.now()),
        name: b.customer_name || b.customerName,
        phone: b.customer_phone || b.customerPhone,
        email: b.customer_email || b.customerEmail || '',
        cpf: b.customer_cpf || b.customerCpf || b.customerCPF || parsedObs.cpf || '',
        birth_date: b.birth_date || b.birthDate || '',
        emergency_contact: b.emergency_contact || b.emergencyContact || parsedObs.emergency_contact || '',
        health_notes: b.health_notes || b.healthNotes || parsedObs.health_notes || ''
      };
    }
  });
  if (found) return found;

  // 4. Procura nos contratos de mensalistas
  found = matchInList(state.monthlyMembers || [], {
    phone: m => m.phone,
    format: m => {
      const parsedObs = parseCustomerFromObservation(m.observation || '');
      return {
        name: m.responsible_name || m.responsibleName || m.team_name,
        phone: m.phone,
        email: m.email || '',
        cpf: m.cpf || parsedObs.cpf || '',
        birth_date: m.birth_date || '',
        emergency_contact: m.emergency_contact || parsedObs.emergency_contact || '',
        health_notes: m.health_notes || parsedObs.health_notes || ''
      };
    }
  });
  if (found) return found;

  return null;
}

function autoSaveCustomerDraft() {
  const phoneInput = document.getElementById('custPhone');
  const phone = phoneInput ? phoneInput.value.trim() : (state.customerPhone || '');
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 8) return;

  const nameInput = document.getElementById('custName');
  const cpfInput = document.getElementById('custCPF');
  const emailInput = document.getElementById('custEmail');
  const birthInput = document.getElementById('custBirthDate');
  const emergInput = document.getElementById('custEmergency');
  const healthInput = document.getElementById('custHealthNotes');

  const name = nameInput ? nameInput.value.trim() : '';
  const cpf = cpfInput ? cpfInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const birthDate = birthInput ? birthInput.value : '';
  const emergency = emergInput ? emergInput.value.trim() : '';
  const healthNotes = healthInput ? healthInput.value.trim() : '';

  if (!name && !cpf && !email && !birthDate) return;

  const currentId = (state.checkoutCustomer && state.checkoutCustomer.id) ? state.checkoutCustomer.id : ('cust-' + Date.now());
  const record = {
    id: currentId,
    name: name || (state.checkoutCustomer ? state.checkoutCustomer.name : ''),
    phone: formatPhone(phone),
    cpf: formatCPF(cpf) || (state.checkoutCustomer ? state.checkoutCustomer.cpf : ''),
    email: email || (state.checkoutCustomer ? state.checkoutCustomer.email : ''),
    birth_date: birthDate || (state.checkoutCustomer ? state.checkoutCustomer.birth_date : ''),
    emergency_contact: emergency || (state.checkoutCustomer ? state.checkoutCustomer.emergency_contact : ''),
    health_notes: healthNotes || (state.checkoutCustomer ? state.checkoutCustomer.health_notes : 'Nenhuma restrição informada'),
    updated_at: new Date().toISOString()
  };

  try {
    const local = JSON.parse(localStorage.getItem('arena_customers') || '[]');
    const idx = local.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
    if (idx >= 0) local[idx] = { ...local[idx], ...record };
    else local.unshift(record);
    localStorage.setItem('arena_customers', JSON.stringify(local));
  } catch(e) {}

  if (!state.supabaseCustomers) state.supabaseCustomers = [];
  const sIdx = state.supabaseCustomers.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
  if (sIdx >= 0) state.supabaseCustomers[sIdx] = { ...state.supabaseCustomers[sIdx], ...record };
  else state.supabaseCustomers.unshift(record);
}

async function handleCustomerPhoneInput(input) {
  const formatted = formatPhone(input.value);
  input.value = formatted;
  state.customerPhone = formatted;
  const clean = formatted.replace(/\D/g, '');
  
  const container = document.getElementById('customerDynamicArea');
  if (!container) return;

  // SÓ MOSTRA IDENTIFICAÇÃO OU CADASTRO QUANDO DIGITAR TODOS OS NÚMEROS (11 DÍGITOS)
  if (clean.length >= 11) {
    // 1. Busca imediata na memória e cache local
    let customer = findCustomerByPhone(clean);
    if (customer) {
      renderCustomerDynamicArea(customer, formatted);
      return;
    }

    // 2. Busca assíncrona no banco Supabase
    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      container.innerHTML = `
        <div class="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl text-center text-xs text-emerald-900 flex items-center justify-center space-x-2 animate-pulse">
          <span class="inline-block animate-spin text-sm">⚽</span>
          <span class="font-bold">Consultando cadastro do atleta na base da Arena...</span>
        </div>
      `;
      try {
        const client = window.ArenaSupabase.getClient();

        // 2a. Busca em tempo real da lista atualizada de clientes
        const { data: allCusts } = await client
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (allCusts && allCusts.length > 0) {
          state.supabaseCustomers = allCusts.map(normalizeCustomer);
          customer = findCustomerByPhone(clean);
          if (customer) {
            renderCustomerDynamicArea(customer, formatted);
            return;
          }
        }

        // 2b. Busca nos agendamentos anteriores pelo sufixo do telefone
        const last8 = clean.slice(-8);
        const { data: prevBookings } = await client
          .from('bookings')
          .select('*')
          .ilike('customer_phone', `%${last8}%`)
          .order('date', { ascending: false })
          .limit(3);

        if (prevBookings && prevBookings.length > 0) {
          const prevBooking = prevBookings[0];
          const pObs = parseCustomerFromObservation(prevBooking.observation || '');
          customer = normalizeCustomer({
            id: prevBooking.customer_id || ('cust-' + Date.now()),
            name: prevBooking.customer_name,
            phone: prevBooking.customer_phone,
            email: prevBooking.customer_email || '',
            cpf: prevBooking.customer_cpf || pObs.cpf || '',
            birth_date: prevBooking.birth_date || '',
            emergency_contact: prevBooking.emergency_contact || pObs.emergency_contact || '',
            health_notes: prevBooking.health_notes || pObs.health_notes || ''
          });
          if (!state.supabaseCustomers) state.supabaseCustomers = [];
          state.supabaseCustomers.unshift(customer);
        }
      } catch (err) {
        console.warn('Erro na consulta de atleta:', err);
      }
    }

    renderCustomerDynamicArea(customer, formatted);
  } else {
    // Enquanto faltar números, mantém desabilitado e não revela identificação nem cadastro
    state.checkoutCustomer = null;
    container.innerHTML = `
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
        <i data-lucide="phone-call" class="w-6 h-6 text-slate-400 mx-auto mb-1"></i>
        <span>Digite todos os números do seu WhatsApp com DDD (11 dígitos) para identificar seu cadastro.</span>
      </div>
    `;
    updateConfirmButtonState(false, 'Informe seu WhatsApp Acima');
  }
  if (window.lucide) lucide.createIcons();
}

function handleCPFInput(input) {
  input.value = formatCPF(input.value);
  const clean = input.value.replace(/\D/g, '');
  const indicator = document.getElementById('cpfStatusMsg');
  if (!indicator) return;

  if (clean.length === 11) {
    const isValid = validateCPF(input.value);
    if (isValid) {
      indicator.className = 'text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1';
      indicator.innerHTML = '<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> ✓ CPF Válido com cálculo correto!';
    } else {
      indicator.className = 'text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1';
      indicator.innerHTML = '<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-600"></i> ❌ CPF Inválido (cálculo de dígitos incorreto)';
    }
    if (window.lucide) lucide.createIcons();
  } else if (clean.length > 0) {
    indicator.className = 'text-[11px] font-semibold text-slate-400 mt-1';
    indicator.textContent = 'Digite os 11 dígitos do CPF para validar';
  } else {
    indicator.textContent = '';
  }
}

function getFirstAndSecondName(fullName) {
  if (!fullName) return 'Atleta';
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts.join(' ');
  return parts.slice(0, 2).join(' ');
}

function toggleEditCustomerDetails() {
  const editable = document.getElementById('customerEditableDetails');
  if (editable) {
    editable.classList.toggle('hidden');
    if (window.lucide) lucide.createIcons();
  }
}

function updateConfirmButtonState(enabled, text) {
  const btn = document.getElementById('btnConfirmBooking');
  if (!btn) return;
  btn.disabled = !enabled;
  if (!enabled) {
    btn.className = 'px-6 py-3 bg-slate-200 text-slate-400 cursor-not-allowed rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 transition-all';
    btn.innerHTML = `<span>Informe seu WhatsApp Acima</span>`;
  } else {
    btn.className = 'px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all';
    btn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>${text || 'Confirmar e Reservar'}</span>`;
  }
  if (window.lucide) lucide.createIcons();
}

function renderCustomerDynamicArea(customer, phoneStr) {
  const container = document.getElementById('customerDynamicArea');
  if (!container) return;

  if (customer) {
    state.checkoutCustomer = customer;
    const shortName = getFirstAndSecondName(customer.name);

    container.innerHTML = `
      <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/70 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500 space-y-3 shadow-xs animate-fade-in">
        <div class="flex items-center space-x-3 min-w-0">
          <span class="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
            ✓
          </span>
          <div class="min-w-0">
            <span class="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-200/70 px-2 py-0.5 rounded-full inline-block mb-0.5">
              Peladeiro Cadastrado no Sistema
            </span>
            <h4 class="text-base sm:text-lg font-black text-slate-900 truncate">${shortName}</h4>
          </div>
        </div>

        <div class="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0"></i>
          <span>Cliente verificado na base! Horário liberado para confirmação imediata.</span>
        </div>
      </div>
    `;
    updateConfirmButtonState(true, 'Confirmar Agendamento');
  } else {
    state.checkoutCustomer = null;
    container.innerHTML = `
      <div class="bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 space-y-3.5 shadow-xs animate-fade-in">
        <div class="flex items-start space-x-2.5 pb-2.5 border-b border-amber-200">
          <span class="p-2 bg-amber-500 text-white rounded-xl text-base shrink-0 shadow-xs">⚽</span>
          <div>
            <h4 class="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide">Primeiro Agendamento deste Número!</h4>
            <p class="text-[11px] text-amber-900 mt-0.5">Preencha sua ficha de atleta da Arena Limoeiro para registrar no banco de dados.</p>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Nome Completo do Responsável / Peladeiro *</label>
          <input type="text" id="custName" required placeholder="Ex: Lucas Gabriel da Silva" oninput="autoSaveCustomerDraft()"
                 class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">CPF (com validação oficial) *</label>
            <input type="text" id="custCPF" required placeholder="000.000.000-00" maxlength="14" oninput="handleCPFInput(this); autoSaveCustomerDraft()" 
                   class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
            <span id="cpfStatusMsg" class="text-[10px] font-semibold text-slate-400 block mt-0.5"></span>
          </div>

          <div>
            <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Data de Nascimento *</label>
            <input type="date" id="custBirthDate" required onchange="autoSaveCustomerDraft()"
                   class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">E-mail para Envio Automático *</label>
          <input type="email" id="custEmail" required placeholder="seuemail@exemplo.com" oninput="autoSaveCustomerDraft()"
                 class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
          <p class="text-[10px] text-slate-500 mt-0.5">A Arena enviará comprovantes e lembretes automáticos para este e-mail.</p>
        </div>

        <div>
          <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Contato de Emergência do Peladeiro *</label>
          <input type="text" id="custEmergency" required placeholder="Ex: Maria (Esposa) - (81) 98888-7777" oninput="autoSaveCustomerDraft()"
                 class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
          <p class="text-[10px] text-slate-500 mt-0.5">Nome e telefone para contato imediato caso necessário.</p>
        </div>

        <div>
          <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Aviso de Saúde Pré-existente / Ficha Médica</label>
          <textarea id="custHealthNotes" rows="2" oninput="autoSaveCustomerDraft()" placeholder="Ex: Hipertensão, problema cardíaco, recuperação de lesão no joelho, alergias, etc. (Deixe em branco ou digite 'Nenhum' caso não possua)" 
                    class="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"></textarea>
          <p class="text-[10px] text-amber-900 italic mt-0.5 font-medium">⚠️ Informação médica de segurança para primeiros socorros em caso de queda ou desmaio durante o jogo.</p>
        </div>
      </div>
    `;
    updateConfirmButtonState(true, 'Salvar Cadastro e Confirmar Agendamento');
  }
  if (window.lucide) lucide.createIcons();
}

function openCustomerModal(targetPhoneOrId = null) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  let existing = null;
  if (targetPhoneOrId) {
    existing = findCustomerByPhone(targetPhoneOrId);
    if (!existing && state.supabaseCustomers) {
      existing = state.supabaseCustomers.find(c => c.id === targetPhoneOrId || c.phone === targetPhoneOrId);
    }
  }
  if (existing) {
    existing = normalizeCustomer(existing);
  }

  const isEditing = !!existing;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <div class="p-2 ${isEditing ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'} rounded-xl border border-white/10">
              <i data-lucide="${isEditing ? 'user-check' : 'user-plus'}" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase tracking-tight">
                ${isEditing ? 'Ficha de Atleta / Cliente' : 'Novo Cliente / Atleta'}
              </h3>
              <p class="text-xs text-emerald-200">Arena Limoeiro - Gestão de Atletas</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 rounded-xl transition-all cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form onsubmit="saveCustomerFromAdminModal(event, '${existing ? (existing.id || '') : ''}')" class="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Nome Completo do Atleta *</label>
            <input type="text" id="adminCustName" required value="${existing ? existing.name : ''}" placeholder="Ex: Roberto Carlos Silva" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">WhatsApp / Telefone *</label>
              <input type="tel" id="adminCustPhone" required value="${existing ? formatPhone(existing.phone) : ''}" placeholder="(**) *****-****" maxlength="15" oninput="this.value = formatPhone(this.value)" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
            </div>
            <div>
              <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">CPF (com validação) *</label>
              <input type="text" id="adminCustCPF" required value="${existing && existing.cpf ? formatCPF(existing.cpf) : ''}" placeholder="000.000.000-00" maxlength="14" oninput="this.value = formatCPF(this.value)" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">E-mail</label>
              <input type="email" id="adminCustEmail" value="${existing ? (existing.email || '') : ''}" placeholder="atleta@email.com" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
            </div>
            <div>
              <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Data de Nascimento</label>
              <input type="date" id="adminCustBirthDate" value="${existing ? (existing.birth_date || '') : ''}" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-black text-slate-800 uppercase mb-1">Contato de Emergência</label>
            <input type="text" id="adminCustEmergency" value="${existing ? (existing.emergency_contact || '') : ''}" placeholder="Ex: Esposa Mariana - (81) 99999-0000" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">
          </div>

          <div>
            <label class="block text-[11px] font-black text-slate-800 uppercase mb-1 flex items-center justify-between">
              <span>Aviso de Saúde Pré-existente / Cuidados Médicos</span>
              <span class="text-[10px] text-amber-700 font-bold lowercase">segurança do atleta</span>
            </label>
            <textarea id="adminCustHealth" rows="2" placeholder="Ex: Hipertensão, histórico de lesão no menisco, arritmia, desmaio, etc." class="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white">${existing ? (existing.health_notes || '') : ''}</textarea>
            <p class="text-[10px] text-slate-400 mt-0.5">Visível para a equipe de socorro e primeiros socorros da Arena Limoeiro.</p>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>${isEditing ? 'Salvar Alterações' : 'Cadastrar Atleta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

async function saveCustomerFromAdminModal(event, existingId) {
  event.preventDefault();
  const name = (document.getElementById('adminCustName')?.value || '').trim();
  const phone = (document.getElementById('adminCustPhone')?.value || '').trim();
  const cpf = (document.getElementById('adminCustCPF')?.value || '').trim();
  const email = (document.getElementById('adminCustEmail')?.value || '').trim();
  const birth_date = (document.getElementById('adminCustBirthDate')?.value || '').trim();
  const emergency_contact = (document.getElementById('adminCustEmergency')?.value || '').trim();
  const health_notes = (document.getElementById('adminCustHealth')?.value || '').trim();

  if (!name) {
    if (typeof showNotification === 'function') showNotification('Informe o nome do atleta.', 'error');
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    if (typeof showNotification === 'function') showNotification('Informe um telefone/WhatsApp válido.', 'error');
    return;
  }
  if (cpf && !validateCPF(cpf)) {
    if (typeof showNotification === 'function') showNotification('CPF inválido! Por favor verifique os dígitos.', 'error');
    return;
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const customerData = normalizeCustomer({
    id: existingId || ('cust-' + Date.now()),
    name,
    phone: formatPhone(phone),
    cpf: formatCPF(cpf),
    document: formatCPF(cpf),
    email,
    birth_date,
    emergency_contact,
    health_notes: health_notes || 'Nenhuma restrição informada'
  });

  try {
    let localCusts = JSON.parse(localStorage.getItem('arena_customers') || '[]');
    const idx = localCusts.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone || (existingId && c.id === existingId));
    if (idx >= 0) {
      localCusts[idx] = { ...localCusts[idx], ...customerData };
    } else {
      localCusts.push(customerData);
    }
    localStorage.setItem('arena_customers', JSON.stringify(localCusts));
  } catch (e) {
    console.error('Erro ao salvar cliente local:', e);
  }

  let savedCust = null;
  try {
    if (window.ArenaSupabase && window.ArenaSupabase.getOrCreateCustomer) {
      savedCust = await window.ArenaSupabase.getOrCreateCustomer(name, phone, email, {
        cpf: formatCPF(cpf),
        birth_date,
        emergency_contact,
        health_notes: customerData.health_notes
      });
    }
  } catch (err) {
    console.warn('Erro ao sincronizar cliente no Supabase:', err);
  }

  const finalCustomer = normalizeCustomer(savedCust ? { ...customerData, ...savedCust } : customerData);

  if (state.supabaseCustomers) {
    const sIdx = state.supabaseCustomers.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone || (existingId && c.id === existingId));
    if (sIdx >= 0) {
      state.supabaseCustomers[sIdx] = { ...state.supabaseCustomers[sIdx], ...finalCustomer };
    } else {
      state.supabaseCustomers.unshift(finalCustomer);
    }
  }

  closeModal();
  renderStepContent();
  if (typeof showNotification === 'function') showNotification('Ficha do atleta salva com sucesso!', 'success');
}

async function deleteCustomer(targetIdOrPhone, encodedName, phone) {
  const customerName = decodeURIComponent(encodedName || 'Atleta');
  if (!confirm(`Deseja realmente excluir o atleta "${customerName}" da base de cadastro?\n\nEsta ação removerá o atleta do banco de dados.`)) {
    return;
  }

  const clean = String(phone || targetIdOrPhone || '').replace(/\D/g, '');

  // 1. Remove do Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    try {
      const client = window.ArenaSupabase.getClient();
      if (targetIdOrPhone && targetIdOrPhone.startsWith('cust-')) {
        await client.from('customers').delete().eq('id', targetIdOrPhone);
      }
      if (clean) {
        await client.from('customers').delete().eq('phone', clean);
        await client.from('customers').delete().eq('phone', formatPhone(clean));
        if (clean.length >= 8) {
          await client.from('customers').delete().ilike('phone', `%${clean.slice(-8)}%`);
        }
      }
    } catch (err) {
      console.warn('Aviso ao excluir cliente do Supabase:', err);
    }
  }

  // 2. Remove da memória local do estado
  if (state.supabaseCustomers) {
    state.supabaseCustomers = state.supabaseCustomers.filter(c => {
      const cClean = (c.phone || '').replace(/\D/g, '');
      const matchId = targetIdOrPhone && c.id === targetIdOrPhone;
      const matchPhone = clean && (cClean === clean || (cClean.length >= 8 && clean.length >= 8 && cClean.endsWith(clean.slice(-8))));
      return !matchId && !matchPhone;
    });
  }

  // 3. Remove do localStorage
  try {
    let localCusts = JSON.parse(localStorage.getItem('arena_customers') || '[]');
    localCusts = localCusts.filter(c => {
      const cClean = (c.phone || '').replace(/\D/g, '');
      const matchId = targetIdOrPhone && c.id === targetIdOrPhone;
      const matchPhone = clean && (cClean === clean || (cClean.length >= 8 && clean.length >= 8 && cClean.endsWith(clean.slice(-8))));
      return !matchId && !matchPhone;
    });
    localStorage.setItem('arena_customers', JSON.stringify(localCusts));
  } catch (e) {}

  if (typeof showNotification === 'function') {
    showNotification(`Atleta "${customerName}" excluído com sucesso!`, 'info');
  }

  renderStepContent();
  if (window.lucide) lucide.createIcons();
}

// MODAL DE IDENTIFICAÇÃO E CONFIRMAÇÃO DO PELADEIRO (SEM PIX)
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

  const initialPhone = formatPhone(state.customerPhone || '');
  const initialCustomer = findCustomerByPhone(initialPhone);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        
        <!-- Cabeçalho do Modal -->
        <div class="arena-header-bg p-5 text-white flex items-center justify-between">
          <div>
            <h3 class="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <i data-lucide="user-check" class="w-5 h-5 text-emerald-300"></i>
              <span>${isMensal ? 'Identificação do Mensalista' : 'Identificação do Peladeiro'}</span>
            </h3>
            <p class="text-xs text-emerald-200 font-medium">Arena Limoeiro - Complexo Poliesportivo</p>
          </div>
          <button onclick="closeModal()" class="text-emerald-300 hover:text-white p-1 rounded-xl transition-all cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          <!-- Pergunta Principal: Qual é o seu número? -->
          <div class="p-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl">
            <label class="block text-xs font-black text-emerald-950 uppercase mb-1.5 flex items-center gap-1.5">
              <i data-lucide="phone" class="w-4 h-4 text-emerald-700"></i>
              <span>Qual é o seu número de WhatsApp / Telefone? *</span>
            </label>
            <div class="relative">
              <input type="tel" id="custPhone" 
                     value="${initialPhone}" 
                     placeholder="(**) *****-****" 
                     maxlength="15" 
                     oninput="handleCustomerPhoneInput(this)" 
                     class="w-full p-3.5 pl-4 border-2 border-emerald-500 rounded-xl text-base font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none bg-white tracking-wide shadow-xs">
            </div>
            <p class="text-[11px] text-emerald-900 mt-1.5 flex items-center font-medium">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 mr-1 text-emerald-700 shrink-0"></i>
              Pelo seu número, identificamos seu cadastro automaticamente na base de dados.
            </p>
          </div>

          <!-- Área Dinâmica: Cadastro Identificado ou Formulário de Primeiro Agendamento -->
          <div id="customerDynamicArea"></div>

          <!-- Resumo da Partida Selecionada -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span class="font-black text-slate-900 block">${court.name.split(' - ')[0]}</span>
              <span>${isMensal ? `Toda ${state.monthlyDayOfWeek}-feira` : formatDisplayDate(state.selectedDate)} • ${state.startTime} às ${state.endTime}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block font-bold uppercase">Total do Campo</span>
              <strong class="text-sm font-black text-emerald-800">R$ ${grandTotal.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
        </div>

        <!-- Rodapé com Confirmação Imediata -->
        <div class="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span class="text-[10px] text-slate-400 block font-bold uppercase">Valor da Reserva</span>
            <p class="text-lg sm:text-xl font-black text-slate-950">R$ ${grandTotal.toFixed(2).replace('.', ',')}</p>
          </div>

          <button id="btnConfirmBooking" onclick="submitBooking(${grandTotal})" 
                  class="px-5 sm:px-6 py-3 bg-slate-300 text-slate-500 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 transition-all cursor-not-allowed" disabled>
            <span>Informe seu WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Se já tinha telefone preenchido com todos os números, faz a verificação imediata
  const phoneEl = document.getElementById('custPhone');
  if (phoneEl && phoneEl.value.replace(/\D/g, '').length >= 11) {
    handleCustomerPhoneInput(phoneEl);
  } else {
    const dynamic = document.getElementById('customerDynamicArea');
    if (dynamic) {
      dynamic.innerHTML = `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
          <i data-lucide="phone-call" class="w-6 h-6 text-slate-400 mx-auto mb-1"></i>
          <span>Digite todos os números do seu WhatsApp com DDD (11 dígitos) para identificar seu cadastro.</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
    updateConfirmButtonState(false, 'Informe seu WhatsApp Acima');
  }

  // Garante sincronização em background com a base remota do Supabase
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    loadSupabaseCustomers().then(() => {
      const p = document.getElementById('custPhone');
      if (p && p.value && p.value.replace(/\D/g, '').length >= 11) {
        handleCustomerPhoneInput(p);
      }
    }).catch(() => {});
  }
}

function closeModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;
  modalRoot.innerHTML = '';
}

async function submitBooking(grandTotal) {
  const phoneInput = document.getElementById('custPhone');
  const phone = phoneInput ? phoneInput.value.trim() : state.customerPhone;
  const cleanPhone = (phone || '').replace(/\D/g, '');

  if (cleanPhone.length < 11) {
    alert('Por favor, informe todos os dígitos do seu WhatsApp com DDD (11 dígitos) para agendar.');
    phoneInput?.focus();
    return;
  }

  const existingCust = state.checkoutCustomer;
  const isEditing = document.getElementById('customerEditableDetails') && !document.getElementById('customerEditableDetails').classList.contains('hidden');

  let name = '';
  let cpf = '';
  let email = '';
  let birthDate = '';
  let emergency = '';
  let healthNotes = '';

  if (existingCust) {
    const norm = normalizeCustomer(existingCust);
    const nameInput = document.getElementById('custName');
    name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : norm.name;
    cpf = norm.cpf || norm.document || '';
    email = norm.email || '';
    birthDate = norm.birth_date || '';
    emergency = norm.emergency_contact || '';
    healthNotes = norm.health_notes || '';
  } else {
    const nameInput = document.getElementById('custName');
    const cpfInput = document.getElementById('custCPF');
    const emailInput = document.getElementById('custEmail');
    const birthInput = document.getElementById('custBirthDate');
    const emergInput = document.getElementById('custEmergency');
    const healthInput = document.getElementById('custHealthNotes');

    name = nameInput ? nameInput.value.trim() : '';
    cpf = cpfInput ? cpfInput.value.trim() : '';
    email = emailInput ? emailInput.value.trim() : '';
    birthDate = birthInput ? birthInput.value : '';
    emergency = emergInput ? emergInput.value.trim() : '';
    healthNotes = healthInput ? healthInput.value.trim() : '';

    if (!name || name.length < 3) {
      alert('Por favor, informe o seu Nome Completo.');
      nameInput?.focus();
      return;
    }

    if (!cpf || !validateCPF(cpf)) {
      alert('⚠️ CPF Inválido!\n\nO CPF digitado não passou no cálculo oficial dos dígitos verificadores.\nPor favor, verifique os números digitados.');
      cpfInput?.focus();
      return;
    }

    if (!birthDate) {
      alert('Por favor, informe a sua Data de Nascimento.');
      birthInput?.focus();
      return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      alert('Por favor, informe um E-mail válido para envio automático de comprovantes e avisos da Arena.');
      emailInput?.focus();
      return;
    }

    if (!emergency || emergency.length < 3) {
      alert('Por favor, informe um Contato de Emergência (Nome e Telefone de um familiar ou amigo).');
      emergInput?.focus();
      return;
    }
  }

  const confirmBtn = document.getElementById('btnConfirmBooking');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="inline-block animate-spin mr-1.5">⏳</span><span>Confirmando Agendamento...</span>`;
  }

  state.customerName = name;
  state.customerPhone = formatPhone(phone);

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

  // 2. Salva ou atualiza os dados completos do cliente
  const customerRecord = normalizeCustomer({
    id: existingCust ? existingCust.id : ('cust-' + Date.now()),
    name,
    phone: formatPhone(phone),
    email: email || '',
    cpf: formatCPF(cpf),
    document: formatCPF(cpf),
    birth_date: birthDate || '',
    emergency_contact: emergency || '',
    health_notes: healthNotes || 'Nenhuma restrição informada',
    created_at: existingCust ? (existingCust.created_at || new Date().toISOString()) : new Date().toISOString()
  });

  if (!state.supabaseCustomers) state.supabaseCustomers = [];
  const existingIdx = state.supabaseCustomers.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
  if (existingIdx >= 0) {
    state.supabaseCustomers[existingIdx] = { ...state.supabaseCustomers[existingIdx], ...customerRecord };
  } else {
    state.supabaseCustomers.unshift(customerRecord);
  }

  try {
    const localCusts = JSON.parse(localStorage.getItem('arena_customers') || '[]');
    const lIdx = localCusts.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
    if (lIdx >= 0) localCusts[lIdx] = { ...localCusts[lIdx], ...customerRecord };
    else localCusts.unshift(customerRecord);
    localStorage.setItem('arena_customers', JSON.stringify(localCusts));
  } catch(e) {}

  const courtId = state.selectedCourt.id;
  const newBookingId = 'ARENA-' + Math.floor(1000 + Math.random() * 9000);
  const newMemberId = 'mensal-' + Date.now();
  const isMensal = state.bookingType === 'mensalista';

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

  // Validação preventiva do estoque de água da Arena
  let bookingWaterTotal = 0;
  Object.entries(cleanProductCart).forEach(([pId, qty]) => {
    const prod = (state.products || []).find(p => p.id === pId);
    if (isWaterProduct(prod)) bookingWaterTotal += qty;
  });
  if (bookingWaterTotal > 0 && typeof getWaterSupplyAnalytics === 'function') {
    const analytics = getWaterSupplyAnalytics();
    if (bookingWaterTotal > analytics.freeForSale) {
      alert(`⚠️ Limite de Água no Estoque:\n\nA Arena Limoeiro possui atualmente ${analytics.freeForSale} água(s) cheia(s) disponíveis para novos agendamentos.\n(Estoque total: ${analytics.full} cheias, sendo ${analytics.totalReservedAll} já guardadas para outras partidas).\n\nPor favor, reduza a quantidade de água no carrinho para até ${analytics.freeForSale} unidade(s) ou consulte a recepção/bar.`);
      const btn = document.getElementById('btnSubmitBooking');
      if (btn) { btn.disabled = false; btn.innerText = 'Confirmar Agendamento'; }
      return;
    }
  }

  const cpfObs = cpf ? `[CPF: ${formatCPF(cpf)}]` : '';
  const healthObs = healthNotes ? `[Saúde: ${healthNotes}]` : '';
  const emergencyObs = emergency ? `[Emergência: ${emergency}]` : '';
  const fullObservation = [state.observation, cpfObs, healthObs, emergencyObs].filter(Boolean).join(' | ');

  const dbBookingPayload = {
    id: newBookingId,
    court_id: courtId,
    customer_id: customerRecord.id,
    date: state.selectedDate,
    start_time: state.startTime,
    end_time: state.endTime,
    time: `${state.startTime} às ${state.endTime}`,
    duration: state.selectedDuration || 60,
    customer_name: name,
    customer_phone: formatPhone(phone),
    total_price: Number(grandTotal) || 0,
    status: 'confirmed',
    booking_type: 'avulso',
    payment_method: 'local',
    product_cart: cleanProductCart,
    observation: fullObservation
  };

  const dbMemberPayload = {
    id: newMemberId,
    team_name: name,
    responsible_name: name,
    phone: formatPhone(phone),
    customer_id: customerRecord.id,
    court_id: courtId,
    day_of_week: state.monthlyDayOfWeek,
    day_of_week_label: 'Toda ' + state.monthlyDayOfWeek + '-feira',
    time: state.startTime,
    start_time: state.startTime,
    end_time: state.endTime,
    monthly_price: Number(grandTotal) || 0,
    status: 'active',
    observation: fullObservation
  };

  // 3. Salva no Supabase (Nuvem Vercel)
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

      // Cria ou atualiza cliente no Supabase primeiro para obter o customer_id real
      let savedCustomer = null;
      try {
        if (window.ArenaSupabase.getOrCreateCustomer) {
          savedCustomer = await window.ArenaSupabase.getOrCreateCustomer(name, formatPhone(phone), email, {
            cpf: formatCPF(cpf),
            birth_date: birthDate,
            emergency_contact: emergency,
            health_notes: healthNotes
          });
        }
      } catch (custErr) {
        console.warn('Aviso no cadastro de cliente Supabase:', custErr);
      }

      if (savedCustomer) {
        const normSaved = normalizeCustomer(savedCustomer);
        if (!state.supabaseCustomers) state.supabaseCustomers = [];
        const exIdx = state.supabaseCustomers.findIndex(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
        if (exIdx >= 0) state.supabaseCustomers[exIdx] = { ...state.supabaseCustomers[exIdx], ...normSaved };
        else state.supabaseCustomers.unshift(normSaved);
        try {
          localStorage.setItem('arena_customers', JSON.stringify(state.supabaseCustomers));
        } catch(e) {}
      }

      const validCustomerId = (savedCustomer && savedCustomer.id) ? savedCustomer.id : null;
      dbBookingPayload.customer_id = validCustomerId;
      dbMemberPayload.customer_id = validCustomerId;

      // Insere no Supabase garantindo que nunca quebre por Foreign Key
      if (isMensal) {
        const { error: insErr } = await client.from('monthly_members').insert([dbMemberPayload]);
        if (insErr) {
          console.warn('Aviso inserção mensalista Supabase:', insErr);
          if (insErr.code === '23503') {
            dbMemberPayload.customer_id = null;
            await client.from('monthly_members').insert([dbMemberPayload]);
          }
        }
      } else {
        const { error: insErr } = await client.from('bookings').insert([dbBookingPayload]);
        if (insErr) {
          console.warn('Aviso inserção booking Supabase:', insErr);
          if (insErr.code === '23503') {
            dbBookingPayload.customer_id = null;
            await client.from('bookings').insert([dbBookingPayload]);
          }
        }
      }
    } catch (err) {
      console.warn('Erro na conexão com Supabase, salvando localmente:', err);
    }
  }

  // 4. Atualiza estado em memória e localStorage com garantia de compatibilidade
  const unifiedBooking = {
    ...dbBookingPayload,
    courtId: courtId,
    customerName: name,
    customerPhone: formatPhone(phone),
    customerEmail: email,
    customerCPF: formatCPF(cpf),
    emergencyContact: emergency,
    healthNotes: healthNotes,
    birthDate: birthDate,
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

  // 5. Finaliza com sucesso
  requestSchedule();
  closeModal();

  if (isMensal) {
    showConfirmationSuccessModal({
      id: newMemberId,
      customerName: name,
      customerPhone: formatPhone(phone),
      customerCPF: formatCPF(cpf),
      emergencyContact: emergency,
      healthNotes: healthNotes,
      courtId: courtId,
      date: 'Toda ' + state.monthlyDayOfWeek + '-feira (Mensal)',
      time: state.startTime + ' às ' + state.endTime,
      totalPrice: Number(grandTotal) || 0,
      isMensalista: true
    });
  } else {
    showConfirmationSuccessModal(unifiedBooking);
  }

  // Dispara notificação imediata apenas se quem estiver no aparelho for um gestor com credencial aceita
  try {
    if (isManagerLoggedIn()) {
      triggerBookingNotification(unifiedBooking);
    }
  } catch(e) {
    console.warn('Aviso notificação agendamento:', e);
  }

  // Transmite broadcast instantâneo via WebSocket para todos os outros aparelhos/celulares
  if (window.ArenaSupabase && window.ArenaSupabase.broadcastBooking) {
    window.ArenaSupabase.broadcastBooking(unifiedBooking);
  }

  // Registra no Log de Auditoria
  const courtOnline = state.courts.find(c => c.id === (unifiedBooking.court_id || unifiedBooking.courtId));
  logSystemAction({
    actionType: 'CREATE_BOOKING',
    actionLabel: 'Novo Agendamento Online',
    courtName: courtOnline ? courtOnline.name : 'Quadra',
    details: `Agendamento online realizado para ${unifiedBooking.customer_name || 'Cliente'} (${unifiedBooking.customer_phone || ''}) na ${courtOnline ? courtOnline.name : 'Quadra'} - ${formatDisplayDate(unifiedBooking.date)} às ${unifiedBooking.time || ''}. Total: R$ ${Number(unifiedBooking.total_price || 0).toFixed(2).replace('.', ',')}`,
    targetId: unifiedBooking.id
  });

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
  const custCpf = booking.customerCPF || booking.customer_cpf || (state.checkoutCustomer ? state.checkoutCustomer.cpf : '');
  const custEmerg = booking.emergencyContact || booking.emergency_contact || (state.checkoutCustomer ? state.checkoutCustomer.emergency_contact : '');
  const custHealth = booking.healthNotes || booking.health_notes || (state.checkoutCustomer ? state.checkoutCustomer.health_notes : '');

  const price = typeof booking.total_price === 'number' ? booking.total_price : 
                (typeof booking.totalPrice === 'number' ? booking.totalPrice : 
                (typeof booking.monthly_price === 'number' ? booking.monthly_price : 0));

  const analytics = (typeof getWaterSupplyAnalytics === 'function') ? getWaterSupplyAnalytics() : { full: 0, empty: 0 };
  let waterCountInBooking = 0;
  const rawCart = booking.product_cart || booking.productCart || state.productCart || {};
  Object.entries(rawCart).forEach(([id, qty]) => {
    if (id.startsWith('_') || typeof qty !== 'number' || qty <= 0) return;
    const prod = (state.products || []).find(p => p.id === id);
    if (isWaterProduct(prod)) {
      waterCountInBooking += qty;
    }
  });

  const waterReceiptNote = (waterCountInBooking > 0)
    ? `💧 Águas p/ o Jogo: ${waterCountInBooking} un | Estoque Arena: ${analytics.full} cheias disponíveis p/ campos e venda`
    : `💧 Estoque de Água Arena: ${analytics.full} cheias disponíveis para os campos e para venda`;

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
${waterReceiptNote}
Código: #${booking.id}
Bora pro jogo!`);

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 animate-fade-in">
        <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="check-circle" class="w-10 h-10"></i>
        </div>

        <span class="bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
          ${booking.isMensalista ? '👑 Horário Fixo Ativado com Sucesso!' : 'Reserva Confirmada com Sucesso!'}
        </span>

        <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-3 mb-1">
          Código: #${booking.id}
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 mb-6">
          Comprovante enviado para o WhatsApp <strong class="text-slate-800">${custPhone}</strong>
        </p>

        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 mb-6 text-xs sm:text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Responsável:</span><strong class="text-slate-800">${custName}</strong></div>
          ${custCpf ? `<div class="flex justify-between"><span class="text-slate-500">CPF do Atleta:</span><strong class="font-mono text-slate-800">${formatCPF(custCpf)}</strong></div>` : ''}
          <div class="flex justify-between"><span class="text-slate-500">WhatsApp:</span><strong class="font-mono text-slate-800">${custPhone}</strong></div>
          ${custEmerg ? `<div class="flex justify-between"><span class="text-slate-500">Contato Emergência:</span><strong class="text-slate-800">${custEmerg}</strong></div>` : ''}
          ${custHealth && custHealth !== 'Nenhuma restrição informada' && custHealth.trim().toLowerCase() !== 'nenhum' ? `
            <div class="flex justify-between items-center"><span class="text-slate-500">Aviso de Saúde:</span><span class="text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">⚠️ ${custHealth}</span></div>
          ` : ''}
          <div class="flex justify-between"><span class="text-slate-500">Espaço:</span><strong class="text-slate-800">${courtName.split(' - ')[0]}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Data e Horário:</span><strong class="text-slate-800">${booking.date} (${booking.time})</strong></div>
          ${savedItemsText ? `
            <div class="pt-2 border-t border-slate-200">
              <span class="text-amber-800 font-bold block">🥤 Bebidas/Itens a Guardar no Bar:</span>
              <p class="text-slate-700 font-semibold">${savedItemsText} (Pagar no consumo)</p>
            </div>
          ` : ''}
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
            <span class="text-slate-500 font-bold">Controle de Água:</span>
            <strong class="text-cyan-800 text-right text-[11px] sm:text-xs font-black">${waterReceiptNote}</strong>
          </div>
          <div class="flex justify-between pt-2 border-t border-slate-200"><span class="text-slate-500 font-bold">Total do Horário:</span><strong class="text-emerald-700 font-black">R$ ${price.toFixed(2).replace('.', ',')}</strong></div>
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
  state.selectedSlots = [];
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
    btnText = state.bookingType === 'mensalista' ? 'Confirmar Horário Fixo' : 'Confirmar Agendamento';
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
            <span class="text-[10px] sm:text-[11px] text-slate-400 block font-bold leading-tight">${isMensal ? 'Mensal' : (isCourtDiscountTime(court, state.startTime) ? '🔥 Total c/ Desconto' : 'Total Horas')}</span>
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
  // Evita abrir a quadra acidentalmente logo após gesto de arrastar o carrossel de fotos (Mobile)
  if (window._lastCourtSwipeTime && (Date.now() - window._lastCourtSwipeTime < 450)) {
    return;
  }
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
  state.selectedSlots = [];
  
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
  if (step === 2) {
    if (!state.currentMonthDate) state.currentMonthDate = new Date();
    if (!state.selectedDate) state.selectedDate = getFormattedDate(new Date());
    if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
      syncDataFromSupabase();
    }
  }
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
    try {
      const client = window.ArenaSupabase.getClient();
      const { data, error } = await client.from('customers').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        state.supabaseCustomers = (data || []).map(normalizeCustomer);
        try {
          localStorage.setItem('arena_customers', JSON.stringify(state.supabaseCustomers));
        } catch(e) {}

        if (state.currentMode === 'admin' && (state.adminTab === 'customers' || state.adminSubTab === 'customers')) renderStepContent();
      }
    } catch(err) {
      console.warn('Aviso ao sincronizar clientes do Supabase:', err);
    }
  }
}

// ============================================================================
// 🔔 SISTEMA DE NOTIFICAÇÕES MOBILE NO NAVEGADOR COM SOM E VIBRAÇÃO
// ============================================================================
let arenaAudioCtx = null;
function getArenaAudioContext() {
  if (!arenaAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) arenaAudioCtx = new AudioContextClass();
  }
  if (arenaAudioCtx && arenaAudioCtx.state === 'suspended') {
    arenaAudioCtx.resume();
  }
  return arenaAudioCtx;
}

function playNotificationSound() {
  // 🔒 Somente executa som se for gestor com credencial aceita e logado
  if (!isManagerLoggedIn()) return;
  try {
    const ctx = getArenaAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tom 1 (587.33 Hz - Ré5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tom 2 (880 Hz - Lá5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0, now + 0.14);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.55);

    // Tom 3 (1174.66 Hz - Ré6 brilhante)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1174.66, now + 0.28);
    gain3.gain.setValueAtTime(0, now + 0.28);
    gain3.gain.linearRampToValueAtTime(0.45, now + 0.32);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.28);
    osc3.stop(now + 0.85);
  } catch (err) {
    console.warn('Alerta sonoro:', err);
  }
}

function showToastNotification(htmlContent, duration = 6500) {
  let toastContainer = document.getElementById('arenaToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'arenaToastContainer';
    toastContainer.className = 'fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[99999] flex flex-col gap-2.5 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 rounded-2xl border-2 border-emerald-500 shadow-2xl flex items-start space-x-3 transform transition-all duration-300 translate-y-[-20px] opacity-0';
  toast.innerHTML = `
    <div class="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0 mt-0.5">
      <i data-lucide="bell-ring" class="w-5 h-5"></i>
    </div>
    <div class="flex-1 text-xs">
      ${htmlContent}
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-base font-bold ml-1">✕</button>
  `;

  toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-20px]', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

const recentNotifiedBookings = new Set();

function triggerBookingNotification(booking) {
  // 🔒 RESTRIÇÃO ESTRITA: Notificações de novos agendamentos/pedidos
  // SÓ APARECEM para quem tem conta credencial aceita para login na seção de gerência.
  // Caso o usuário não tenha entrado com login de gerência, a notificação de pedido
  // NÃO será notificada nem no mobile, nem no tablet, nem no navegador de computador.
  if (!isManagerLoggedIn()) {
    return;
  }

  if (!booking || !booking.id) return;
  if (recentNotifiedBookings.has(booking.id)) return;
  recentNotifiedBookings.add(booking.id);
  setTimeout(() => recentNotifiedBookings.delete(booking.id), 60000);

  // 1. Alerta Sonoro
  playNotificationSound();

  // 2. Vibração (Mobile Android)
  if ('vibrate' in navigator) {
    try { navigator.vibrate([200, 100, 200, 100, 300]); } catch(e) {}
  }

  // 3. Monta dados completos requisitados pelo gestor
  const court = (state.courts || []).find(c => c.id === (booking.court_id || booking.courtId));
  const courtName = court ? court.name : 'Quadra Esportiva';
  const custName = booking.customer_name || booking.customerName || 'Cliente';
  const custPhone = booking.customer_phone || booking.customerPhone || '';
  const bDate = formatDisplayDate(booking.date);
  const bTime = booking.time || `${booking.start_time} às ${booking.end_time}`;
  const price = Number(booking.total_price || 0).toFixed(2).replace('.', ',');
  const durLabel = booking.duration ? (booking.duration === 60 ? '1h Fechada' : `${booking.duration} min`) : '1h Fechada';

  const notifTitle = `⚽ Novo Agendamento — ${courtName}`;
  const notifBody = `🏟️ Arena: ${courtName}\n⏰ Horário: ${bDate} (${bTime} • ${durLabel})\n💰 Valor: R$ ${price}\n👤 Cliente: ${custName}${custPhone ? ' (' + custPhone + ')' : ''}`;

  // 4. Dispara Notificação Nativa no Celular / Sistema Operacional
  if ('Notification' in window && Notification.permission === 'granted') {
    const notifOptions = {
      body: notifBody,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: 'arena-booking-' + booking.id,
      renotify: true,
      vibrate: [200, 100, 200, 100, 300],
      data: { url: '/?admin=true' }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(notifTitle, notifOptions);
      }).catch(() => {
        try { new Notification(notifTitle, notifOptions); } catch(e) {}
      });
    } else {
      try { new Notification(notifTitle, notifOptions); } catch(e) {}
    }
  }

  // 5. Toast Flutuante no App
  showToastNotification(`
    <h5 class="font-black text-white text-xs mb-0.5 flex items-center gap-1.5">
      <span>🔔 Novo Agendamento Confirmado!</span>
    </h5>
    <p class="text-emerald-300 font-bold mb-1">🏟️ <strong>Arena:</strong> ${courtName}</p>
    <p class="text-slate-300">⏰ <strong>Horário:</strong> ${bDate} • ${bTime} <span class="text-amber-400 font-bold">(${durLabel})</span></p>
    <p class="text-slate-300 font-bold mt-0.5">💰 <strong>Valor:</strong> <strong class="text-white text-sm font-black">R$ ${price}</strong></p>
    <p class="text-slate-300 text-[11px] mt-0.5">👤 <strong>Cliente:</strong> ${custName} ${custPhone ? '• ' + custPhone : ''}</p>
  `);
}

async function requestNotificationPermission() {
  if (!isManagerLoggedIn()) return;
  getArenaAudioContext();

  if (!('Notification' in window)) {
    alert('Seu navegador atual não suporta notificações de sistema. No celular, recomendamos usar o Google Chrome ou adicionar o site à tela de início.');
    return;
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch(swErr) {
          console.warn('Aviso Service Worker:', swErr);
        }
      }
      playNotificationSound();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([150, 50, 150]); } catch(e) {}
      }

      // Notificação de teste imediata com todos os dados preenchidos
      const court = (state.courts && state.courts[0]) ? state.courts[0].name : 'Quadra de Beach Tennis 1';
      triggerBookingNotification({
        id: 'test-' + Date.now(),
        court_id: (state.courts && state.courts[0]) ? state.courts[0].id : 'court-beach-1',
        date: getFormattedDate(new Date()),
        start_time: '19:00',
        end_time: '20:00',
        time: '19:00 às 20:00',
        total_price: 90.00,
        customer_name: 'Teste Notificação Arena',
        customer_phone: '(81) 98463-4126',
        duration: 60
      });

      renderStepper();
      if (state.currentMode === 'admin') renderStepContent();
      else renderApp();
      if (window.lucide) lucide.createIcons();
    } else if (perm === 'denied') {
      alert('As notificações foram bloqueadas nas permissões do seu navegador.\n\nPara ativar no celular:\n1. Toque no ícone de configurações ou cadeado 🔒 ao lado do endereço "arenalimoeiro.vercel.app".\n2. Ative as "Notificações".\n3. Recarregue a página e toque novamente em Ativar.');
    }
  } catch (err) {
    console.error('Erro ao solicitar permissão de notificação:', err);
  }
}


async function syncDataFromSupabase(skipRender = false) {
  if (!window.ArenaSupabase || !window.ArenaSupabase.isReady()) return;
  const client = window.ArenaSupabase.getClient();
  if (!client) return;

  try {
    // ⚡ Consultas paralelas de alta velocidade (1 única rodada de rede HTTP/2)
    const [
      { data: dbCourts },
      { data: dbProducts },
      { data: dbMembers },
      { data: dbBookings },
      { data: dbCustomers, error: errCust }
    ] = await Promise.all([
      client.from('courts').select('*').order('order_index', { ascending: true }),
      client.from('products').select('*'),
      client.from('monthly_members').select('*'),
      client.from('bookings').select('*'),
      client.from('customers').select('*').order('created_at', { ascending: false })
    ]);

    if (dbCourts && dbCourts.length > 0) {
      state.courts = dbCourts.map(normalizeCourt);
      if (state.selectedCourt) {
        const matching = state.courts.find(c => c.id === state.selectedCourt.id);
        if (matching) state.selectedCourt = matching;
      }
      localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
    }

    if (dbProducts && dbProducts.length > 0) {
      const waterRow = dbProducts.find(p => p.id === 'arena-water-supply' || p.type === 'water_supply');
      if (waterRow) {
        try {
          const parsed = JSON.parse(waterRow.image || '{}');
          if (parsed && typeof parsed.full === 'number') {
            state.waterSupply = {
              full: parsed.full,
              empty: typeof parsed.empty === 'number' ? parsed.empty : 0,
              min_alert: typeof parsed.min_alert === 'number' ? parsed.min_alert : 5,
              unit_price: typeof parsed.unit_price === 'number' ? parsed.unit_price : 5.00,
              courts: (parsed.courts && typeof parsed.courts === 'object') ? parsed.courts : {},
              orders: Array.isArray(parsed.orders) ? parsed.orders : [],
              history: Array.isArray(parsed.history) ? parsed.history : []
            };
            localStorage.setItem('arena_water_supply', JSON.stringify(state.waterSupply));
          }
        } catch(e) {}
      }
      const filteredProducts = dbProducts.filter(p => p.id !== 'arena-water-supply' && p.type !== 'water_supply');
      state.products = filteredProducts;
      localStorage.setItem('arena_local_products', JSON.stringify(filteredProducts));
    }

    if (dbMembers) {
      state.monthlyMembers = dbMembers;
      localStorage.setItem('arena_monthly_members', JSON.stringify(dbMembers));
    }

    if (dbBookings) {
      const validDbBookings = (dbBookings || []).filter(b => b && b.status !== 'cancelled');
      state.bookings = validDbBookings;
      localStorage.setItem('arena_local_bookings', JSON.stringify(validDbBookings));

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

    if (dbCustomers && !errCust) {
      state.supabaseCustomers = (dbCustomers || []).map(normalizeCustomer);
      try {
        localStorage.setItem('arena_customers', JSON.stringify(state.supabaseCustomers));
      } catch(e) {}
    }

    // Solicitar permissão de notificação no celular apenas para gestores logados
    try {
      if (isManagerLoggedIn()) {
        if (window.Capacitor?.Plugins?.LocalNotifications) {
          window.Capacitor.Plugins.LocalNotifications.requestPermissions().catch(() => {});
        } else if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    } catch (e) {}

    requestSchedule();
    if (!skipRender) {
      renderApp();
    }

    // 1. ✅ Canal Broadcast Ultrarrápido — Transmissão instantânea (<50ms) entre celular e PC
    if (window.ArenaSupabase && window.ArenaSupabase.getBroadcastChannel) {
      const bChan = window.ArenaSupabase.getBroadcastChannel();
      if (bChan && !window.arenaBroadcastActive) {
        window.arenaBroadcastActive = true;
        bChan.on('broadcast', { event: 'new_booking' }, (evt) => {
          const b = evt.payload;
          if (b && b.id) {
            if (!state.bookings.find(x => x.id === b.id)) {
              state.bookings = [...state.bookings, b];
              const local = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
              if (!local.find(x => x.id === b.id)) {
                local.push(b);
                localStorage.setItem('arena_local_bookings', JSON.stringify(local));
              }
              _refreshAllUI();
            }
            triggerBookingNotification(b, 'new');
          }
        });

        // Ouvinte de exclusão imediata de jogos (<50ms)
        bChan.on('broadcast', { event: 'booking_deleted' }, (evt) => {
          handleReceivedBookingDelete(evt.payload);
        });

        // Ouvinte de logs de auditoria do sistema em tempo real
        bChan.on('broadcast', { event: 'system_log' }, (evt) => {
          handleReceivedSystemLog(evt.payload);
        });

        // Ouvinte de limpeza total de logs
        bChan.on('broadcast', { event: 'clear_logs' }, () => {
          handleReceivedClearLogs();
        });

        // Ouvinte de atualização de quadras (liberação, manutenção, aviso prévio)
        bChan.on('broadcast', { event: 'court_updated' }, (evt) => {
          const updatedCourt = evt.payload;
          if (updatedCourt && updatedCourt.id) {
            const norm = normalizeCourt(updatedCourt);
            const idx = state.courts.findIndex(c => c.id === norm.id);
            if (idx !== -1) {
              state.courts[idx] = norm;
            } else {
              state.courts.push(norm);
            }
            localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
            _refreshAllUI();
            triggerBookingNotification({ court_name: norm.name, customer_name: 'Gestor da Arena' }, 'update');
          }
        });
      }
    }

    // 2. ✅ Realtime Supabase Postgres Changes
    if (!window.supabaseRealtimeActive) {
      window.supabaseRealtimeActive = true;

      client.channel('realtime_arena')
        // ──── Agendamentos ────
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, async (payload) => {
          if (payload.new && !state.bookings.find(b => b.id === payload.new.id)) {
            state.bookings = [...state.bookings, payload.new];
            _refreshAllUI();
          }

          if (payload.new) {
            triggerBookingNotification(payload.new, 'new');
          }

          const { data } = await client.from('bookings').select('*');
          if (data) { 
            state.bookings = data.filter(b => b && b.status !== 'cancelled');
            localStorage.setItem('arena_local_bookings', JSON.stringify(state.bookings));
            _refreshAllUI(); 
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, async (payload) => {
          if (payload.new) {
            if (payload.new.status === 'cancelled') {
              state.bookings = (state.bookings || []).filter(b => b.id !== payload.new.id);
            } else {
              state.bookings = (state.bookings || []).map(b => b.id === payload.new.id ? payload.new : b);
            }
            localStorage.setItem('arena_local_bookings', JSON.stringify(state.bookings));
            _refreshAllUI();
            if (payload.new.status !== 'cancelled') {
              triggerBookingNotification(payload.new, 'update');
            }
          }
          const { data } = await client.from('bookings').select('*');
          if (data) { 
            state.bookings = data.filter(b => b && b.status !== 'cancelled');
            localStorage.setItem('arena_local_bookings', JSON.stringify(state.bookings));
            _refreshAllUI(); 
          }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bookings' }, async (payload) => {
          if (payload.old) {
            state.bookings = (state.bookings || []).filter(b => b.id !== payload.old.id);
            localStorage.setItem('arena_local_bookings', JSON.stringify(state.bookings));
            _refreshAllUI();
          }
          const { data } = await client.from('bookings').select('*');
          if (data) { 
            state.bookings = data.filter(b => b && b.status !== 'cancelled');
            localStorage.setItem('arena_local_bookings', JSON.stringify(state.bookings));
            _refreshAllUI(); 
          }
        })
        // ──── Mensalistas / Planos Fixos ────
        .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, async () => {
          const { data } = await client.from('monthly_members').select('*');
          if (data) { state.monthlyMembers = data; _refreshAllUI(); }
        })
        // ──── Quadras (caso o gestor altere uma quadra em outra aba) ────
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, async () => {
          const { data } = await client.from('courts').select('*').order('order_index', { ascending: true });
          if (data) { state.courts = data.map(normalizeCourt); _refreshAllUI(); }
        })
        // ──── Clientes / Fichas de Atletas ────
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
          await loadSupabaseCustomers();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Arena Limoeiro – Realtime ativo.');
          }
        });
    }
  } catch (err) {
    console.warn('Erro na sincronização Supabase:', err);
  }
}

// Helper Global: re-renderiza a interface (admin ou cliente) preservando o scroll
function _refreshAllUI() {
  requestSchedule();
  if (state.currentMode === 'admin') {
    const scrollY = window.scrollY;
    renderStepContent();
    window.scrollTo(0, scrollY);
  } else {
    if (state.currentStep === 3) {
      renderStep3Content();
    } else {
      renderApp();
    }
  }
  if (window.lucide) lucide.createIcons();
}

// Sincronização em segundo plano a cada 3.5s que garante atualização mesmo se o WebSocket fechar
let _isSyncingBg = false;
async function checkAndSyncBookingsBackground() {
  if (_isSyncingBg) return;
  if (!window.ArenaSupabase || !window.ArenaSupabase.isReady()) return;
  const client = window.ArenaSupabase.getClient();
  if (!client) return;

  _isSyncingBg = true;
  try {
    const [
      { data: dbBookings, error },
      { data: dbCourts }
    ] = await Promise.all([
      client.from('bookings').select('*'),
      client.from('courts').select('*').order('order_index', { ascending: true })
    ]);

    if (dbBookings && !error) {
      const existingMap = new Map((state.bookings || []).map(b => [b.id, b]));
      const brandNew = dbBookings.filter(b => b && b.id && !existingMap.has(b.id));

      const updatedBookings = [];
      for (const dbB of dbBookings) {
        const cur = existingMap.get(dbB.id);
        if (cur && (cur.status !== dbB.status || cur.start_time !== dbB.start_time || cur.date !== dbB.date || cur.court_id !== dbB.court_id)) {
          updatedBookings.push(dbB);
        }
      }

      const validDbBookings = (dbBookings || []).filter(b => b && b.status !== 'cancelled');
      const newIds = new Set(validDbBookings.map(b => b.id));
      const hasDeleted = (state.bookings || []).some(b => b && b.id && !newIds.has(b.id));
      let hasChanges = brandNew.length > 0 || updatedBookings.length > 0 || hasDeleted || validDbBookings.length !== (state.bookings || []).length;

      if (hasChanges) {
        state.bookings = validDbBookings;
        localStorage.setItem('arena_local_bookings', JSON.stringify(validDbBookings));

        _refreshAllUI();

        // Dispara notificação imediata com som, vibração e alerta para o gestor
        brandNew.forEach(b => {
          triggerBookingNotification(b, 'new');
        });
        updatedBookings.forEach(b => {
          triggerBookingNotification(b, 'update');
        });
      }
    }

    // Sincroniza quadras em segundo plano (detecta liberação, manutenção ou aviso prévio)
    if (dbCourts && Array.isArray(dbCourts) && dbCourts.length > 0) {
      const normCourts = dbCourts.map(normalizeCourt);
      let courtsChanged = false;
      if (normCourts.length !== state.courts.length) {
        courtsChanged = true;
      } else {
        for (let i = 0; i < normCourts.length; i++) {
          const nc = normCourts[i];
          const sc = state.courts.find(c => c.id === nc.id);
          if (!sc) { courtsChanged = true; break; }
          const scNotice = (sc.specs && sc.specs.maintenance_notice) || sc.maintenance_notice || '';
          const ncNotice = (nc.specs && nc.specs.maintenance_notice) || nc.maintenance_notice || '';
          const scStatus = (sc.specs && sc.specs.status) || sc.status || '';
          const ncStatus = (nc.specs && nc.specs.status) || nc.status || '';
          if (scStatus !== ncStatus || scNotice !== ncNotice || sc.isMaintenance !== nc.isMaintenance) {
            courtsChanged = true;
            break;
          }
        }
      }
      if (courtsChanged) {
        state.courts = normCourts;
        localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
        _refreshAllUI();
      }
    }
  } catch(err) {
    // Silencioso
  } finally {
    _isSyncingBg = false;
  }
}

// ==========================================
// MÓDULO DE GALÃO FIXO (PESSOAS & CADASTROS)
// ==========================================

function getRegisteredPeopleList() {
  const peopleMap = new Map();

  // Usuários do sistema
  (state.users || []).forEach(u => {
    if (u && u.name) {
      const trimmed = u.name.trim();
      peopleMap.set(trimmed.toLowerCase(), {
        name: trimmed,
        phone: u.phone || '',
        category: u.role || 'Usuário do Sistema'
      });
    }
  });

  // Mensalistas
  (state.recurringBookings || []).forEach(r => {
    const name = (r.customer_name || r.customerName || '').trim();
    if (name) {
      const key = name.toLowerCase();
      if (!peopleMap.has(key)) {
        peopleMap.set(key, {
          name: name,
          phone: r.customer_phone || r.customerPhone || '',
          category: 'Mensalista'
        });
      }
    }
  });

  // Clientes com agendamentos recentes
  (state.bookings || []).forEach(b => {
    const name = (b.customer_name || b.customerName || '').trim();
    if (name && name !== 'Cliente' && name !== 'Treino Reservado') {
      const key = name.toLowerCase();
      if (!peopleMap.has(key)) {
        peopleMap.set(key, {
          name: name,
          phone: b.customer_phone || b.customerPhone || '',
          category: 'Cliente / Atleta'
        });
      }
    }
  });

  return Array.from(peopleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
window.getRegisteredPeopleList = getRegisteredPeopleList;

function openFixedWaterGallonsModal() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const analytics = getWaterSupplyAnalytics();
  const people = getRegisteredPeopleList();
  const allocations = analytics.fixedAllocations || [];
  const totalFixed = analytics.totalFixedGallons || 0;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <i data-lucide="user-check" class="w-5 h-5 text-indigo-300"></i>
            </div>
            <div>
              <h3 class="text-base font-black uppercase tracking-tight">Gestão de Galão Fixo</h3>
              <p class="text-xs text-indigo-200 font-medium">Destine galões a pessoas cadastradas (interfere no saldo das quadras)</p>
            </div>
          </div>
          <button onclick="closeModal()" class="text-indigo-300 hover:text-white p-1 cursor-pointer">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <div class="p-6 space-y-5 overflow-y-auto">
          
          <!-- Card Informativo de Impacto nos Campos -->
          <div class="grid grid-cols-3 gap-3 p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-center">
            <div class="p-2 bg-white rounded-xl shadow-xs border border-indigo-100">
              <span class="text-[10px] font-bold text-slate-500 uppercase block">Depósito Total</span>
              <strong class="text-base font-black text-slate-900">${analytics.full} un</strong>
            </div>
            <div class="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <span class="text-[10px] font-black uppercase block text-indigo-200">Galões Fixos</span>
              <strong class="text-base font-black">${totalFixed} un</strong>
            </div>
            <div class="p-2 bg-white rounded-xl shadow-xs border border-indigo-100">
              <span class="text-[10px] font-bold text-slate-500 uppercase block">Saldo p/ Campos</span>
              <strong class="text-base font-black ${analytics.availableForCourts <= 2 ? 'text-rose-600' : 'text-emerald-700'}">${analytics.availableForCourts} un</strong>
            </div>
          </div>

          <div class="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-900">
            <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
            <div>
              <strong>Regra Operacional:</strong> Cada galão fixo cadastrado aqui deduz diretamente da cota disponível para reabastecer as quadras (${totalFixed} a menos para os campos). Ao pedir água ao fornecedor para encher, o lote abastecerá todos.
            </div>
          </div>

          <!-- Formulário para Adicionar Galão Fixo -->
          <form onsubmit="handleFixedWaterGallonSubmit(event)" class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5" autocomplete="off">
            <div class="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <span>➕</span>
              <span>Cadastrar Novo Galão Fixo</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nome da Pessoa / Cadastro *</label>
                <div class="relative">
                  <input type="text" id="fixedWaterPersonName" list="fixedWaterDatalist" required placeholder="Digite ou selecione do cadastro..."
                         class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
                  <datalist id="fixedWaterDatalist">
                    ${people.map(p => `<option value="${p.name}">${p.category ? `(${p.category})` : ''}</option>`).join('')}
                  </datalist>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Qtd Galões *</label>
                <input type="number" id="fixedWaterQty" min="1" max="50" value="1" required
                       class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-black text-indigo-950 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Observação / Finalidade</label>
              <input type="text" id="fixedWaterNotes" placeholder="Ex: Professor de Beach Tennis, Treino Especial, Mensalista Terça..."
                     class="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
            </div>

            <div class="pt-1 flex justify-end">
              <button type="submit" id="btnSubmitFixedWater" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Destinar Galão Fixo</span>
              </button>
            </div>
          </form>

          <!-- Lista de Galões Fixos Ativos -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
                <span>📋</span>
                <span>Pessoas com Galão Fixo Ativo (${allocations.length})</span>
              </h4>
              <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Total: ${totalFixed} galão(ões) fixo(s)
              </span>
            </div>

            ${allocations.length === 0 ? `
              <div class="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                <div class="text-2xl">💧</div>
                <p class="text-xs font-bold">Nenhum galão fixo destinado no momento.</p>
                <p class="text-[11px] text-slate-400">Todos os galões cheios estão 100% disponíveis para uso nos campos esportivos.</p>
              </div>
            ` : `
              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                ${allocations.map(item => `
                  <div class="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-indigo-300 transition-colors">
                    <div class="flex items-center space-x-3 min-w-0">
                      <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200">
                        👤
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center space-x-2">
                          <strong class="text-xs font-black text-slate-900 truncate">${item.person_name}</strong>
                          <span class="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-[10px] font-black shrink-0">
                            ${item.gallons} ${item.gallons > 1 ? 'galões' : 'galão'}
                          </span>
                        </div>
                        ${item.notes ? `<p class="text-[11px] text-slate-500 truncate mt-0.5 font-medium">💬 ${item.notes}</p>` : ''}
                        <span class="text-[9px] text-slate-400 block mt-0.5">Cadastrado em: ${new Date(item.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <button type="button" onclick="removeFixedWaterAllocation('${item.id}')" title="Liberar e devolver galões para os campos"
                            class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all cursor-pointer flex items-center space-x-1 shrink-0">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      <span>Liberar</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Rodapé do Modal -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button type="button" onclick="closeModal()" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
              Concluir e Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  `;
  lucide.createIcons();
}
window.openFixedWaterGallonsModal = openFixedWaterGallonsModal;

async function handleFixedWaterGallonSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('fixedWaterPersonName');
  const qtyInput = document.getElementById('fixedWaterQty');
  const notesInput = document.getElementById('fixedWaterNotes');
  const btn = document.getElementById('btnSubmitFixedWater');
  if (!nameInput || !qtyInput) return;

  const personName = nameInput.value.trim();
  const gallons = parseInt(qtyInput.value, 10);
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!personName) {
    alert('Por favor, informe o nome da pessoa.');
    return;
  }
  if (isNaN(gallons) || gallons <= 0) {
    alert('Por favor, informe uma quantidade válida de galões.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Salvando...';
  }

  if (!state.waterSupply) {
    state.waterSupply = { full: 0, empty: 0, min_alert: 5, unit_price: 5.00, courts: {}, orders: [], history: [], fixed_allocations: [] };
  }
  if (!Array.isArray(state.waterSupply.fixed_allocations)) {
    state.waterSupply.fixed_allocations = [];
  }

  const newAllocation = {
    id: 'fix-' + Date.now(),
    person_name: personName,
    gallons: gallons,
    notes: notes,
    created_at: new Date().toISOString(),
    created_by: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador'
  };

  state.waterSupply.fixed_allocations.push(newAllocation);

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'galao_fixo',
    qtd: gallons,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador',
    notes: `Galão Fixo: destinado ${gallons} galão(ões) para ${personName} (${notes || 'Sem observação'}). Reduzido do saldo dos campos.`
  });

  await saveWaterSupplyToDatabase();
  renderStepContent();
  openFixedWaterGallonsModal(); // Reabre com a lista atualizada

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-indigo-300 uppercase text-[11px]">👤 Galão Fixo Registrado!</div>
      <p class="text-xs text-white">Destinado <strong>${gallons} galão(ões)</strong> para <strong>${personName}</strong>. Saldo disponível para os campos atualizado.</p>
    </div>
  `, 4500);
}
window.handleFixedWaterGallonSubmit = handleFixedWaterGallonSubmit;

async function removeFixedWaterAllocation(allocationId) {
  if (!state.waterSupply || !Array.isArray(state.waterSupply.fixed_allocations)) return;
  const item = state.waterSupply.fixed_allocations.find(a => a.id === allocationId);
  if (!item) return;

  const confirmed = confirm(`Deseja realmente liberar o galão fixo de "${item.person_name}" (${item.gallons} galões)? Os galões voltarão a ficar disponíveis para os campos.`);
  if (!confirmed) return;

  state.waterSupply.fixed_allocations = state.waterSupply.fixed_allocations.filter(a => a.id !== allocationId);

  if (!Array.isArray(state.waterSupply.history)) state.waterSupply.history = [];
  state.waterSupply.history.push({
    id: 'mov-' + Date.now(),
    date: new Date().toISOString(),
    type: 'galao_fixo_removido',
    qtd: item.gallons,
    user: (state.currentUser && state.currentUser.name) ? state.currentUser.name : 'Operador',
    notes: `Liberação de Galão Fixo: ${item.gallons} galão(ões) de ${item.person_name} retornaram ao saldo livre dos campos.`
  });

  await saveWaterSupplyToDatabase();
  renderStepContent();
  openFixedWaterGallonsModal(); // Reabre com a lista atualizada

  showToastNotification(`
    <div class="space-y-1">
      <div class="font-black text-emerald-300 uppercase text-[11px]">✓ Galão Fixo Liberado!</div>
      <p class="text-xs text-white">Os <strong>${item.gallons} galões</strong> de ${item.person_name} voltaram a ficar disponíveis para os campos.</p>
    </div>
  `, 4000);
}
window.removeFixedWaterAllocation = removeFixedWaterAllocation;
