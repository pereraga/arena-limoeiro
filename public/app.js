// Gerenciador Arena Limoeiro - Data Primeiro, Horários Disponíveis Ocultando Ocupados
let socket;
let state = {
  currentStep: 1,
  currentMode: 'client',
  adminTab: 'spaces',
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
  
  // DATA SELECIONADA PRIMEIRO
  selectedDate: getFormattedDate(new Date()),
  currentMonthDate: new Date(),
  
  // DURAÇÃO E HORÁRIOS SELECIONADOS NA ETAPA 3
  startTime: '19:00',
  endTime: '20:00',
  selectedDuration: 60,
  
  productCart: {}, // Produtos guardados para o agendamento (não somam no valor online)
  
  observation: '',
  couponCode: '',
  appliedCoupon: null,
  customerName: '',
  customerPhone: '',
  paymentMethod: 'pix',
  
  slots: [] // Horários do dia com status 'available', 'booked', 'blocked_admin'
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
  initSocket();
});

function loadInitialData() {
  if (window.ARENA_DEFAULT_DATA) {
    const d = window.ARENA_DEFAULT_DATA;
    state.arenaInfo = d.arenaInfo;
    state.categories = d.categories;
    state.courts = d.initialCourts;
    state.products = d.initialProducts;
    state.monthlyMembers = d.initialMonthlyMembers;
    state.adminUsers = d.initialAdmins;
    state.coupons = d.coupons;
    state.bookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    if (!state.selectedCourt && state.courts.length > 0) {
      state.selectedCourt = state.courts[0];
    }
  }
}


function initSocket() {
  if (typeof io !== 'undefined') {
    try {
      socket = io();
    } catch(e) {}
  }

  // Se tiver Supabase vinculado, sincroniza na hora
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    syncDataFromSupabase();
  }

  socket.on('init_data', (data) => {
    state.arenaInfo = data.arenaInfo;
    state.categories = data.categories;
    state.courts = data.courts;
    state.products = data.products || [];
    state.monthlyMembers = data.monthlyMembers || [];
    
    if (!state.selectedCourt && state.courts.length > 0) {
      state.selectedCourt = state.courts[0];
    }

    renderApp();
    requestSchedule();
  });

  socket.on('schedule_updated', ({ courtId, date }) => {
    if (state.selectedCourt && state.selectedCourt.id === courtId && state.selectedDate === date) {
      requestSchedule();
    }
  });

  socket.on('courts_reordered', (reorderedCourts) => {
    state.courts = reorderedCourts;
    renderStepContent();
  });

  socket.on('court_added', (court) => {
    state.courts.push(court);
    renderStepContent();
  });

  socket.on('court_updated', (court) => {
    const idx = state.courts.findIndex(c => c.id === court.id);
    if (idx !== -1) {
      state.courts[idx] = court;
      if (state.selectedCourt && state.selectedCourt.id === court.id) state.selectedCourt = court;
      renderStepContent();
    }
  });

  socket.on('court_deleted', ({ id }) => {
    state.courts = state.courts.filter(c => c.id !== id);
    if (state.selectedCourt && state.selectedCourt.id === id) state.selectedCourt = state.courts[0] || null;
    renderStepContent();
  });

  socket.on('product_added', (prod) => {
    state.products.push(prod);
    renderStepContent();
  });

  socket.on('product_deleted', ({ id }) => {
    state.products = state.products.filter(p => p.id !== id);
    delete state.productCart[id];
    renderStepContent();
  });

  socket.on('monthly_member_added', (member) => {
    state.monthlyMembers.push(member);
    requestSchedule();
    if (state.currentMode === 'admin') renderAdminView(document.getElementById('mainContent'));
  });

  socket.on('schedule_data', ({ courtId, date, schedule }) => {
    if (state.selectedCourt && state.selectedCourt.id === courtId && state.selectedDate === date) {
      state.slots = schedule;
      
      // Auto-seleciona primeiro horário livre se o atual estiver ocupado
      const currentSlot = schedule.find(s => s.time === state.startTime);
      if (!currentSlot || currentSlot.status !== 'available') {
        const firstAvailable = schedule.find(s => s.status === 'available');
        if (firstAvailable) {
          state.startTime = firstAvailable.time;
          const nextHourMin = timeToMinutes(firstAvailable.time) + 60;
          state.endTime = minutesToTime(nextHourMin);
        }
      }
      
      if (state.currentStep === 3) renderStep3Content();
      if (state.currentMode === 'admin' && state.adminTab === 'schedule') renderAdminMatrix();
    }
  });

  socket.on('booking_confirmed', ({ success, booking }) => {
    if (success) showConfirmationSuccessModal(booking);
  });
}


function calculateLocalSchedule(courtId, date) {
  const operatingHours = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
  ];

  const [y, m, d] = date.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const allBookings = [...(state.bookings || []), ...localBookings];

  return operatingHours.map(time => {
    const slotMin = timeToMinutes(time);

    // 1. Mensalista fixo naquele dia da semana
    const monthlyHolder = state.monthlyMembers.find(m => {
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

    // 2. Reservas avulsas confirmadas
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
      return {
        time,
        status: "booked",
        statusLabel: "Reservado",
        isMensalista: booking.bookingType === 'mensalista',
        customerName: booking.customer_name || booking.customerName || "Cliente",
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

function requestSchedule() {
  if (!state.selectedCourt || !state.selectedDate) return;

  // 1. Gera e atualiza a grade localmente na hora (autônomo para Vercel)
  state.slots = calculateLocalSchedule(state.selectedCourt.id, state.selectedDate);

  // Auto-seleciona primeiro horário livre se o atual estiver ocupado
  const currentSlot = state.slots.find(s => s.time === state.startTime);
  if (!currentSlot || currentSlot.status !== 'available') {
    const firstAvailable = state.slots.find(s => s.status === 'available');
    if (firstAvailable) {
      state.startTime = firstAvailable.time;
      const nextHourMin = timeToMinutes(firstAvailable.time) + 60;
      state.endTime = minutesToTime(nextHourMin);
    }
  }

  if (state.currentStep === 3) renderStep3Content();
  if (state.currentMode === 'admin' && state.adminTab === 'schedule') renderAdminMatrix();

  // 2. Se houver socket conectado (ambiente local), emite pedido
  if (typeof socket !== 'undefined' && socket && socket.connected) {
    socket.emit('get_schedule', {
      courtId: state.selectedCourt.id,
      date: state.selectedDate
    });
  }
}


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
    modeBtnText.innerText = state.currentUser ? `Gestão (${state.currentUser.name.split(' ')[0]})` : "Gestão";
  }
}

function renderStepper() {
  const stepperContainer = document.getElementById('stepperContainer');
  if (!stepperContainer) return;

  if (state.currentMode === 'admin') {
    stepperContainer.innerHTML = `
      <div class="flex items-center justify-between w-full bg-black/40 px-4 py-2 rounded-xl border border-emerald-500/30">
        <div class="flex items-center space-x-2 text-xs text-emerald-300">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
          <span>Painel de Administração: <strong class="text-white">${state.currentUser?.name}</strong> (${state.currentUser?.role})</span>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="switchToClientView()" class="text-xs text-emerald-300 hover:text-white font-bold flex items-center space-x-1">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Ver Tela do Cliente</span>
          </button>
          <span class="text-emerald-700">|</span>
          <button onclick="logoutAdmin()" class="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1">
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
    const isClickable = s.num < state.currentStep;

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
          const displayPrice = state.bookingType === 'mensalista' ? 
            `R$ ${(court.monthlyPrice || court.basePricePerHour * 3.6).toFixed(2).replace('.', ',')} <span class="text-xs font-medium text-slate-500">/ mês (4 jogos)</span>` :
            `R$ ${court.basePricePerHour.toFixed(2).replace('.', ',')} <span class="text-xs font-medium text-slate-500">/ hora</span>`;

          const registeredMensalistas = state.monthlyMembers.filter(m => m.courtId === court.id);
          const sampleList = (registeredMensalistas.length > 0) ? 
            registeredMensalistas.map(m => `${m.teamName} (${m.dayOfWeekLabel.split('-')[0]} ${m.time})`) : 
            (court.sampleMensalistas || ["Pelada dos Amigos (Terça 19h)", "Galera da Resenha (Quinta 20h)"]);

          return `
            <div onclick="selectCourt('${court.id}')" 
                 class="court-card bg-white rounded-3xl overflow-hidden cursor-pointer relative flex flex-col ${isSelected ? 'selected' : ''} shadow-sm border border-slate-200">
              
              <div class="relative h-48 w-full overflow-hidden bg-slate-900">
                <img src="${court.image}" alt="${court.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'"
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span class="bg-black/80 backdrop-blur-md text-emerald-400 text-[11px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    ${court.categoryLabel}
                  </span>
                  ${court.badge ? `
                    <span class="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md">
                      ${court.badge}
                    </span>
                  ` : ''}
                </div>

                <div class="absolute bottom-2.5 left-3 text-white">
                  <span class="text-[10px] font-bold text-emerald-300 flex items-center">
                    <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                    ${court.bookingsCount || 12} agendamentos este mês
                  </span>
                </div>
              </div>
              
              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="text-base sm:text-lg font-extrabold text-slate-900 leading-snug mb-1.5">
                    ${court.name}
                  </h3>
                  ${court.description ? `
                    <p class="text-xs text-slate-500 mb-3 line-clamp-2">${court.description}</p>
                  ` : ''}
                  <p class="text-xs text-slate-500 font-semibold mb-2.5 flex items-center">
                    <i data-lucide="users" class="w-3.5 h-3.5 mr-1.5 text-emerald-600"></i>
                    ${court.specs.capacity}
                  </p>
                  <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 line-clamp-1">
                    ${court.specs.type}
                  </p>
                </div>

                <div>
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span class="text-[11px] text-slate-400 font-medium">${state.bookingType === 'mensalista' ? 'Plano Mensalista' : 'Valor da Hora'}</span>
                      <p class="text-lg font-black text-emerald-700 leading-tight">
                        ${displayPrice}
                      </p>
                    </div>
                    <button class="px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}">
                      ${isSelected ? 'Selecionado ✓' : 'Selecionar'}
                    </button>
                  </div>

                  <!-- RODAPÉ DE MENSALISTAS -->
                  <div class="mt-3.5 pt-2.5 border-t border-dashed border-slate-200 bg-amber-50/50 -mx-5 -mb-5 px-4 py-2.5 rounded-b-3xl">
                    <div class="flex items-center space-x-1.5 text-[10px] font-black text-amber-900 uppercase mb-1">
                      <i data-lucide="crown" class="w-3 h-3 text-amber-600"></i>
                      <span>Mensalistas deste Campo:</span>
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

// ETAPA 2: DATA DO JOGO (SELECIONADA PRIMEIRO)
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
      <div class="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
          <div class="flex items-center space-x-3 mb-5">
            <span class="p-2 rounded-2xl bg-amber-100 text-amber-800"><i data-lucide="crown" class="w-6 h-6"></i></span>
            <div>
              <h3 class="text-lg font-black text-slate-900">Configuração do Dia do Plano Mensalista</h3>
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
    return;
  }

  // Jogo Avulso: Calendário Limpo
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      
      <!-- Card da Quadra Selecionada -->
      <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white mb-6 flex items-center justify-between shadow-xl border border-emerald-800/50">
        <div class="flex items-center space-x-4">
          <img src="${court.image}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400/40 shadow">
          <div>
            <span class="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              Campo Selecionado
            </span>
            <h2 class="text-base sm:text-xl font-black mt-1">${court.name}</h2>
            <p class="text-xs text-emerald-300 font-bold mt-0.5">
              R$ ${court.basePricePerHour.toFixed(2).replace('.', ',')} / hora
            </p>
          </div>
        </div>
        <button onclick="goToStep(1)" class="text-xs text-emerald-300 hover:text-white underline font-bold flex items-center">
          <i data-lucide="edit-3" class="w-3.5 h-3.5 mr-1"></i> Trocar
        </button>
      </div>

      <div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-black text-slate-900 flex items-center">
              <i data-lucide="calendar" class="w-5 h-5 text-emerald-600 mr-2"></i>
              Selecione a Data da Partida
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">Escolha o dia em que o seu time irá jogar na Arena Limoeiro</p>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-1.5 rounded-xl text-xs font-black self-start sm:self-auto">
            Dia Selecionado: ${formatDisplayDate(state.selectedDate)}
          </div>
        </div>

        <div id="calendarWidget" class="max-w-md mx-auto">
          ${renderCalendarHTML()}
        </div>
      </div>
    </div>
  `;

  requestSchedule();
}

function setMonthlyDayOfWeek(day) {
  state.monthlyDayOfWeek = day;
  renderStepContent();
  renderBottomBar();
  lucide.createIcons();
}

// Calendário
function renderCalendarHTML() {
  const date = state.currentMonthDate;
  const year = date.getFullYear();
  const month = date.getMonth();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getFormattedDate(new Date());

  let html = `
    <div class="calendar-header flex items-center justify-between mb-4">
      <h4 class="text-base font-black text-slate-800">${monthNames[month]} ${year}</h4>
      <div class="flex space-x-1">
        <button onclick="changeMonth(-1)" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
        <button onclick="changeMonth(1)" class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 uppercase">
      <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
    </div>

    <div class="grid grid-cols-7 gap-1.5 text-center">
  `;

  for (let i = 0; i < firstDay; i++) html += `<div class="h-10"></div>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = state.selectedDate === currentDayStr;
    const isToday = currentDayStr === todayStr;
    const isPast = currentDayStr < todayStr;

    if (isPast) {
      html += `<div class="h-10 flex items-center justify-center text-xs text-slate-300 font-semibold cursor-not-allowed">${day}</div>`;
    } else {
      html += `
        <button onclick="selectDate('${currentDayStr}')" 
                class="h-10 w-10 mx-auto rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center
                       ${isSelected ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400' : isToday ? 'border-2 border-emerald-600 text-emerald-800 font-black bg-emerald-50/50' : 'text-slate-700 hover:bg-emerald-50'}">
          ${day}
        </button>
      `;
    }
  }

  html += `</div>`;
  return html;
}

function changeMonth(delta) {
  const current = state.currentMonthDate;
  state.currentMonthDate = new Date(current.getFullYear(), current.getMonth() + delta, 1);
  const calendarWidget = document.getElementById('calendarWidget');
  if (calendarWidget) {
    calendarWidget.innerHTML = renderCalendarHTML();
    lucide.createIcons();
  }
}

function selectDate(dateStr) {
  state.selectedDate = dateStr;
  renderStepContent();
  renderBottomBar();
  requestSchedule();
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

  calculateDuration();
  const hoursFraction = state.selectedDuration / 60;
  const courtFinalPrice = state.bookingType === 'mensalista' ? 
    (court.monthlyPrice || court.basePricePerHour * 3.6) : 
    (court.basePricePerHour * hoursFraction);

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
            ${court.name} • R$ ${court.basePricePerHour.toFixed(2).replace('.', ',')} / hora
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
                ${[1, 1.5, 2, 3].map(durHours => {
                  const endMin = timeToMinutes(state.startTime) + (durHours * 60);
                  const endStr = minutesToTime(endMin);
                  if (endMin > timeToMinutes("23:00")) return '';
                  return `
                    <option value="${endStr}" ${state.endTime === endStr ? 'selected' : ''}>
                      ${endStr} (${durHours === 1 ? '1 hora de jogo' : durHours === 1.5 ? '1h 30min' : durHours + ' horas'})
                    </option>
                  `;
                }).join('')}
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
                Cálculo: ${hoursFraction}h x R$ ${court.basePricePerHour.toFixed(2)}/h
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
  const courtPrice = isMensal ? (court.monthlyPrice || court.basePricePerHour * 3.6) : (court.basePricePerHour * hoursFraction);

  const savedBarItems = Object.entries(state.productCart).map(([prodId, qty]) => {
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
              ${isMensal ? '👑 Contrato Mensalista (Horário semanal com 4 jogos no mês)' : `Partida de ${state.selectedDuration} minutos (${hoursFraction}h x R$ ${court.basePricePerHour.toFixed(2)}/h)`}
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
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      
      <!-- Cabeçalho do Painel do Administrador -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div>
          <div class="flex items-center space-x-2">
            <span class="bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase">Área do Administrador</span>
            <span class="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">👤 ${state.currentUser?.name}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-2">Modificação e Gestão da Arena Limoeiro</h2>
          <p class="text-xs text-slate-500 mt-0.5">Aqui você adiciona espaços, ajusta posições das quadras, gerencia preços, produtos e horários.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button onclick="openCourtModal()" class="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center space-x-1.5 transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Novo Espaço</span>
          </button>

          <button onclick="openShareModal()" class="px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow flex items-center space-x-1.5">
            <i data-lucide="share-2" class="w-4 h-4 text-emerald-400"></i>
            <span>Link dos Clientes</span>
          </button>

          <button onclick="logoutAdmin()" class="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>

      <!-- Abas de Administração -->
      <div class="flex items-center space-x-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto scrollbar-none">
        <button onclick="setAdminTab('spaces')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'spaces' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="layout-grid" class="w-4 h-4"></i>
          <span>Gerenciar Espaços / Quadras (${state.courts.length})</span>
        </button>

        <button onclick="setAdminTab('positions')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'positions' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="arrow-up-down" class="w-4 h-4"></i>
          <span>Ajustar Posições dos Jogos</span>
        </button>

        <button onclick="setAdminTab('schedule')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'schedule' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>Grade de Horários & Bloqueio</span>
        </button>

        <button onclick="setAdminTab('monthly')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'monthly' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="crown" class="w-4 h-4 text-amber-300"></i>
          <span>Mensalistas (${state.monthlyMembers.length})</span>
        </button>

        <button onclick="setAdminTab('products')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'products' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="shopping-bag" class="w-4 h-4"></i>
          <span>Produtos & Bar (${state.products.length})</span>
        </button>

        <button onclick="setAdminTab('users')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="users" class="w-4 h-4"></i>
          <span>Gestores & Responsáveis</span>
        </button>

        <button onclick="setAdminTab('customers')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'customers' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="contact" class="w-4 h-4"></i>
          <span>Clientes Cadastrados</span>
        </button>

        <button onclick="setAdminTab('database')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center space-x-2 whitespace-nowrap ${state.adminTab === 'database' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="database" class="w-4 h-4 text-emerald-400"></i>
          <span>🔌 Vincular Banco (Supabase)</span>
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
}

function renderAdminTabContent() {
  if (state.adminTab === 'database') {
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
                   placeholder="Cole aqui sua chave anon (ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)" 
                   class="w-full p-3.5 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50">
            <p class="text-[11px] text-slate-500 mt-1">
              Encontrada no seu painel Supabase em: <strong>Project Settings -> API -> Project API Keys -> anon public</strong>.
            </p>
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

            ${cfg.connected ? `
              <button type="button" onclick="handleDisconnectSupabase()" class="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl">
                Desconectar
              </button>
            ` : ''}
          </div>
        </form>

        <!-- Tutorial Passo a Passo -->
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
          <h4 class="text-xs font-black uppercase text-slate-800 flex items-center">
            <i data-lucide="info" class="w-4 h-4 text-emerald-600 mr-1.5"></i>
            Como vincular seu projeto Supabase:
          </h4>
          <ol class="text-xs text-slate-600 space-y-2 list-decimal list-inside font-medium leading-relaxed">
            <li>No menu lateral esquerdo do Supabase, clique em <strong>SQL Editor</strong>, cole o código do arquivo <code>supabase/schema.sql</code> e clique em <strong>Run</strong>.</li>
            <li>Vá em <strong>Project Settings -> API</strong>, copie a <strong>anon public key</strong> e cole no campo acima.</li>
            <li>Clique em <strong>Salvar & Conectar</strong>. O site passará a salvar todos os agendamentos e clientes no banco de dados em tempo real!</li>
          </ol>
        </div>
      </div>
    `;
  }

  if (state.adminTab === 'customers') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800 flex items-center">
              <i data-lucide="contact" class="w-5 h-5 text-emerald-600 mr-2"></i>
              Cadastro Separado de Clientes da Arena Limoeiro
            </h3>
            <p class="text-xs text-slate-500">Lista de jogadores e responsáveis com cadastros vinculados aos agendamentos</p>
          </div>
          <button onclick="loadSupabaseCustomers()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Atualizar Lista</span>
          </button>
        </div>

        <div class="space-y-3">
          ${(state.supabaseCustomers.length > 0 ? state.supabaseCustomers : [
            { id: "cust-1", name: "Carlos Eduardo", phone: "(81) 99876-1122", email: "carlos@exemplo.com", created_at: "01/09/2026" },
            { id: "cust-2", name: "Matheus Silveira", phone: "(81) 98844-5566", email: "matheus@exemplo.com", created_at: "01/09/2026" }
          ]).map(c => `
            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-white flex items-center justify-between transition-all">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                  ${c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 class="text-sm font-extrabold text-slate-900">${c.name}</h4>
                  <p class="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span class="flex items-center"><i data-lucide="phone" class="w-3 h-3 text-emerald-600 mr-1"></i>${c.phone}</span>
                    ${c.email ? `<span>• ${c.email}</span>` : ''}
                  </p>
                </div>
              </div>

              <div class="text-right">
                <span class="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded-full">
                  Cliente Registrado
                </span>
                <span class="block text-[11px] text-slate-400 mt-1">ID: ${c.id}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (state.adminTab === 'spaces') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-900">Quadras e Espaços Cadastrados na Arena</h3>
            <p class="text-xs text-slate-500">Edite descrições, preços de locação, mensalidades ou remova quadras</p>
          </div>
          <button onclick="openCourtModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Cadastrar Novo Espaço</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${state.courts.map(court => `
            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-sm flex flex-col justify-between">
              <div class="relative h-40 w-full bg-slate-900">
                <img src="${court.image}" class="w-full h-full object-cover">
                <div class="absolute top-2.5 left-2.5">
                  <span class="bg-black/80 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    ${court.categoryLabel}
                  </span>
                </div>
              </div>

              <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 class="text-sm font-black text-slate-900">${court.name}</h4>
                  <p class="text-xs text-slate-500 mt-1 line-clamp-2">${court.description || 'Sem descrição informada.'}</p>
                  
                  <div class="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span class="text-slate-400 block text-[10px]">Hora Avulsa:</span>
                      <strong class="text-emerald-700 font-black">R$ ${court.basePricePerHour.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block text-[10px]">Mensalista:</span>
                      <strong class="text-amber-800 font-black">R$ ${(court.monthlyPrice || court.basePricePerHour * 3.6).toFixed(2)}/mês</strong>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-200 flex items-center space-x-2">
                  <button onclick="openCourtModal('${court.id}')" class="flex-1 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all">
                    <i data-lucide="edit" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>Editar Espaço</span>
                  </button>
                  <button onclick="deleteCourt('${court.id}')" class="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (state.adminTab === 'positions') {
    const sorted = [...state.courts].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-900">Ajuste de Posições dos Quadrados para os Clientes</h3>
            <p class="text-xs text-slate-500">Defina quais campos aparecem primeiro na tela principal para os clientes agendarem</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="reorderFast('most_booked')" class="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm">
              <i data-lucide="trending-up" class="w-4 h-4 text-emerald-700"></i>
              <span>Mais Agendados no Topo</span>
            </button>
            <button onclick="reorderFast('reset')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span>Ordem Padrão</span>
            </button>
          </div>
        </div>

        <div class="space-y-3">
          ${sorted.map((court, idx) => `
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-white hover:border-emerald-300 transition-all shadow-sm">
              <div class="flex items-center space-x-3.5 overflow-hidden">
                <span class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow">
                  ${idx + 1}
                </span>
                <img src="${court.image}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0">
                <div class="overflow-hidden">
                  <h4 class="text-sm font-extrabold text-slate-900 truncate">${court.name}</h4>
                  <p class="text-xs text-emerald-700 font-bold">${court.categoryLabel} • R$ ${court.basePricePerHour.toFixed(2)}/h • <span class="text-slate-600 font-semibold">${court.bookingsCount || 10} agendamentos no mês</span></p>
                </div>
              </div>

              <div class="flex items-center space-x-1.5">
                <button onclick="moveCourtOrder('${court.id}', -1)" ${idx === 0 ? 'disabled' : ''} 
                        class="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-30 shadow-sm">
                  <i data-lucide="arrow-up" class="w-4 h-4"></i>
                </button>
                <button onclick="moveCourtOrder('${court.id}', 1)" ${idx === sorted.length - 1 ? 'disabled' : ''} 
                        class="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-30 shadow-sm">
                  <i data-lucide="arrow-down" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (state.adminTab === 'users') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800">Pessoas Responsáveis e Gestores Autorizados</h3>
            <p class="text-xs text-slate-500">Controle de logins e senhas para acesso ao painel da arena</p>
          </div>
          <button onclick="openNewAdminUserModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow">
            <i data-lucide="user-plus" class="w-4 h-4"></i>
            <span>Adicionar Novo Responsável</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${(state.adminUsers.length > 0 ? state.adminUsers : [
            { id: "admin-1", name: "Administrador Geral", email: "admin@arenalimoeiro.com.br", password: "admin123", role: "Administrador Geral", createdAt: "01/09/2026" },
            { id: "admin-2", name: "Recepção & Atendimento", email: "recepcao@arenalimoeiro.com.br", password: "arena123", role: "Atendente da Recepção", createdAt: "01/09/2026" }
          ]).map(u => `
            <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-2">
                  <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">${u.role}</span>
                  <span class="text-[10px] text-slate-400 font-medium">Desde ${u.createdAt || '01/09/2026'}</span>
                </div>
                <h4 class="text-base font-extrabold text-slate-900 mt-1">${u.name}</h4>
                <p class="text-xs text-slate-600 font-medium mt-0.5 flex items-center space-x-1">
                  <i data-lucide="mail" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>${u.email}</span>
                </p>
                <p class="text-xs text-slate-600 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                  Senha: <strong class="text-emerald-800">${u.password || '******'}</strong>
                </p>
              </div>

              <div>
                <button onclick="deleteAdminUser('${u.id}')" class="text-xs text-rose-600 hover:text-rose-800 font-bold p-2 hover:bg-rose-50 rounded-lg transition-all">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (state.adminTab === 'monthly') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800">Contratos de Mensalistas Cadastrados</h3>
            <p class="text-xs text-slate-500">Estes times possuem horário semanal reservado automaticamente todo mês</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${state.monthlyMembers.map(m => {
            const court = state.courts.find(c => c.id === m.courtId);
            return `
              <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">${m.dayOfWeekLabel} às ${m.time}</span>
                  <h4 class="text-base font-extrabold text-slate-900 mt-1.5">${m.teamName}</h4>
                  <p class="text-xs text-slate-500">Resp: ${m.responsibleName} • ${m.phone}</p>
                  <p class="text-xs font-semibold text-emerald-700 mt-1">Quadra: ${court ? court.name.split(' - ')[0] : 'Quadra'}</p>
                </div>
                <div class="text-right">
                  <span class="text-xs text-slate-400 block font-bold">Mensalidade</span>
                  <p class="text-lg font-black text-slate-900">R$ ${m.monthlyPrice.toFixed(2).replace('.', ',')}</p>
                  <button onclick="deleteMonthlyMember('${m.id}')" class="text-xs text-rose-600 hover:text-rose-800 font-bold mt-2">Cancelar Contrato</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  if (state.adminTab === 'products') {
    return `
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-black text-slate-800">Produtos, Bebidas & Itens de Consumo</h3>
            <p class="text-xs text-slate-500">Itens disponíveis para os clientes comprarem na hora do agendamento</p>
          </div>
          <button onclick="openProductModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>+ Adicionar Produto</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${state.products.map(p => `
            <div class="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover border border-slate-100">
                <div>
                  <h4 class="text-xs font-extrabold text-slate-900 line-clamp-1">${p.name}</h4>
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
        Carregando matriz da arena...
      </div>
    </div>
  `;
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
          const slot = (state.slots || []).find(s => s.time === hour);

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
                <span class="font-bold block">Manutenção</span>
                <button onclick="adminToggleSlot('${c.id}', '${state.selectedDate}', '${hour}')" class="text-[10px] text-emerald-700 underline">Desbloquear</button>
              </td>
            `;
          }

          return `
            <td class="p-2 text-center border-l border-slate-100">
              <button onclick="adminToggleSlot('${c.id}', '${state.selectedDate}', '${hour}')" 
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
  if (socket) socket.emit('admin_toggle_slot', { courtId, date, time });
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
                     value="${court ? court.basePricePerHour : '140.00'}" 
                     class="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Mensalista (R$/mês)</label>
              <input type="number" step="1.00" id="courtMonthlyPrice" 
                     value="${court ? (court.monthlyPrice || court.basePricePerHour * 3.6) : '500.00'}" 
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
  
  const courtPrice = isMensal ? (court.monthlyPrice || court.basePricePerHour * 3.6) : (court.basePricePerHour * hoursFraction);

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

          <button onclick="submitBooking(${grandTotal})" 
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

function submitBooking(grandTotal) {
  const nameInput = document.getElementById('custName');
  const phoneInput = document.getElementById('custPhone');
  const name = nameInput ? nameInput.value.trim() : state.customerName;
  const phone = phoneInput ? phoneInput.value.trim() : state.customerPhone;

  if (!name || !phone) {
    alert('Por favor, informe seu nome e telefone.');
    return;
  }

  state.customerName = name;
  state.customerPhone = phone;
  const isMensal = state.bookingType === 'mensalista';

  // Se o Supabase estiver vinculado, salva na nuvem com cadastro de cliente
  if (window.ArenaSupabase && window.ArenaSupabase.isReady()) {
    (async () => {
      try {
        const customer = await window.ArenaSupabase.getOrCreateCustomer(name, phone);
        const client = window.ArenaSupabase.getClient();

        if (isMensal) {
          const newMemberId = 'mensal-' + Date.now();
          const memberPayload = {
            id: newMemberId,
            team_name: name,
            responsible_name: name,
            phone,
            customer_id: customer.id,
            court_id: state.selectedCourt.id,
            day_of_week: state.monthlyDayOfWeek,
            day_of_week_label: 'Toda ' + state.monthlyDayOfWeek + '-feira',
            time: state.startTime,
            start_time: state.startTime,
            end_time: state.endTime,
            monthly_price: grandTotal,
            status: 'active',
            observation: state.observation
          };

          await client.from('monthly_members').insert([memberPayload]);
          showConfirmationSuccessModal({
            id: newMemberId,
            customerName: name,
            customerPhone: phone,
            courtId: state.selectedCourt.id,
            date: 'Toda ' + state.monthlyDayOfWeek + '-feira (Mensal)',
            time: state.startTime + ' às ' + state.endTime,
            totalPrice: grandTotal,
            isMensalista: true
          });
        } else {
          const newBookingId = 'ARENA-' + Math.floor(1000 + Math.random() * 9000);
          const bookingPayload = {
            id: newBookingId,
            court_id: state.selectedCourt.id,
            customer_id: customer.id,
            date: state.selectedDate,
            start_time: state.startTime,
            end_time: state.endTime,
            time: state.startTime + ' às ' + state.endTime,
            duration: state.selectedDuration,
            customer_name: name,
            customer_phone: phone,
            total_price: grandTotal,
            status: 'confirmed',
            booking_type: 'avulso',
            payment_method: state.paymentMethod,
            product_cart: state.productCart,
            observation: state.observation
          };

          await client.from('bookings').insert([bookingPayload]);
          showConfirmationSuccessModal(bookingPayload);
        }
        return;
      } catch (err) {
        console.warn('Erro ao salvar no Supabase, prosseguindo com fallback local:', err);
      }
    })();
  }

  if (isMensal) {
    const newMemberId = 'mensal-' + Date.now();
    const newMember = {
      id: newMemberId,
      team_name: name,
      teamName: name,
      responsible_name: name,
      responsibleName: name,
      phone,
      court_id: state.selectedCourt.id,
      courtId: state.selectedCourt.id,
      day_of_week: state.monthlyDayOfWeek,
      dayOfWeek: state.monthlyDayOfWeek,
      time: state.startTime,
      start_time: state.startTime,
      startTime: state.startTime,
      end_time: state.endTime,
      endTime: state.endTime,
      monthly_price: grandTotal,
      monthlyPrice: grandTotal,
      status: 'active',
      observation: state.observation
    };
    state.monthlyMembers.push(newMember);
    showConfirmationSuccessModal({
      id: newMemberId,
      customerName: name,
      customerPhone: phone,
      courtId: state.selectedCourt.id,
      date: `Toda ${state.monthlyDayOfWeek}-feira (Mensal)`,
      time: `${state.startTime} às ${state.endTime}`,
      totalPrice: grandTotal,
      isMensalista: true
    });
    return;
  } else {
    const newBookingId = 'ARENA-' + Math.floor(1000 + Math.random() * 9000);
    const bookingPayload = {
      id: newBookingId,
      courtId: state.selectedCourt.id,
      court_id: state.selectedCourt.id,
      date: state.selectedDate,
      startTime: state.startTime,
      start_time: state.startTime,
      endTime: state.endTime,
      end_time: state.endTime,
      time: `${state.startTime} às ${state.endTime}`,
      duration: state.selectedDuration,
      customerName: name,
      customer_name: name,
      customerPhone: phone,
      customer_phone: phone,
      observation: state.observation,
      productCart: state.productCart,
      totalPrice: grandTotal,
      paymentMethod: state.paymentMethod,
      bookingType: 'avulso'
    };

    // Salva no localStorage (persistência na Vercel)
    const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
    localBookings.push(bookingPayload);
    localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));

    if (typeof socket !== 'undefined' && socket && socket.connected) {
      socket.emit('create_booking', bookingPayload);
    } else {
      showConfirmationSuccessModal(bookingPayload);
      requestSchedule();
    }
  }
}

function showConfirmationSuccessModal(booking) {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;

  const court = state.courts.find(c => c.id === booking.courtId);
  const courtName = court ? court.name : 'Quadra Esportiva';

  const savedItemsText = Object.entries(state.productCart).map(([id, qty]) => {
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
          Comprovante enviado para o WhatsApp <strong class="text-slate-800">${booking.customerPhone}</strong>
        </p>

        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 mb-6 text-xs sm:text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Responsável:</span><strong class="text-slate-800">${booking.customerName}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Espaço:</span><strong class="text-slate-800">${courtName.split(' - ')[0]}</strong></div>
          <div class="flex justify-between"><span class="text-slate-500">Data e Horário:</span><strong class="text-slate-800">${booking.date} (${booking.time})</strong></div>
          ${savedItemsText ? `
            <div class="pt-2 border-t border-slate-200">
              <span class="text-amber-800 font-bold block">🥤 Bebidas/Itens a Guardar no Bar:</span>
              <p class="text-slate-700 font-semibold">${savedItemsText} (Pagar no consumo)</p>
            </div>
          ` : ''}
          <div class="flex justify-between pt-2 border-t border-slate-200"><span class="text-slate-500 font-bold">Total Pago das Horas:</span><strong class="text-emerald-700 font-black">R$ ${booking.totalPrice.toFixed(2).replace('.', ',')}</strong></div>
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
  state.productCart = {};
  state.appliedCoupon = null;
  state.couponCode = '';
  state.observation = '';
  renderApp();
}

// BARRA INFERIOR
function renderBottomBar() {
  const bar = document.getElementById('bottomBar');
  if (!bar) return;

  if (state.currentMode === 'admin') {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');

  const court = state.selectedCourt;
  let canProceed = false;

  if (state.currentStep === 1 && state.selectedCourt) canProceed = true;
  if (state.currentStep === 2 && state.selectedDate) canProceed = true;
  if (state.currentStep === 3 && state.startTime && state.endTime) canProceed = true;
  if (state.currentStep === 4) canProceed = true;

  const btnText = state.currentStep === 4 ? (state.bookingType === 'mensalista' ? 'Confirmar Mensalidade' : 'Confirmar Agendamento') : 'Próxima etapa';

  calculateDuration();
  const isMensal = state.bookingType === 'mensalista';
  const hoursFraction = state.selectedDuration / 60;
  const courtPrice = court ? (isMensal ? (court.monthlyPrice || court.basePricePerHour * 3.6) : (court.basePricePerHour * hoursFraction)) : 0;

  bar.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      ${state.currentStep > 1 ? `
        <button onclick="goToStep(${state.currentStep - 1})" 
                class="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all">
          <i data-lucide="chevron-left" class="w-4 h-4"></i>
          <span>Voltar</span>
        </button>
      ` : '<div></div>'}

      <div class="flex items-center space-x-4">
        ${court && state.currentStep >= 3 ? `
          <div class="text-right hidden sm:block">
            <span class="text-[11px] text-slate-400 block font-bold">${isMensal ? 'Subtotal Mensal' : 'Valor das Horas de Jogo'}</span>
            <span class="text-base font-black text-emerald-900">
              R$ ${courtPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        ` : ''}

        <button onclick="nextStep()" ${!canProceed ? 'disabled' : ''} 
                class="btn-next-step px-6 sm:px-8 py-3 sm:py-3.5 text-white rounded-xl font-extrabold text-sm sm:text-base flex items-center space-x-2 shadow-md">
          <span>${btnText}</span>
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
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
  state.selectedCourt = state.courts.find(c => c.id === courtId);
  renderStepContent();
  renderBottomBar();
  lucide.createIcons();
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
  state.currentStep = step;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
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
      state.courts = dbCourts;
      if (!state.selectedCourt) state.selectedCourt = state.courts[0];
    }

    const { data: dbProducts } = await client.from('products').select('*');
    if (dbProducts && dbProducts.length > 0) {
      state.products = dbProducts;
    }

    const { data: dbMembers } = await client.from('monthly_members').select('*');
    if (dbMembers) state.monthlyMembers = dbMembers;

    const { data: dbBookings } = await client.from('bookings').select('*');
    if (dbBookings) state.bookings = dbBookings;

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
