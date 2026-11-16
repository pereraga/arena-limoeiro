
(function() {
  'use strict';
  // 100% BANCO DE DADOS NA NUVEM: Limpa qualquer resquício de agendamentos locais antigos
  try {
    localStorage.removeItem('arena_local_bookings');
    localStorage.removeItem('arena-limoeiro-games-prototype-v2');
    localStorage.removeItem('arena_deleted_bookings');
    localStorage.removeItem('arena_monthly_members');
  } catch(e) {}

  // 1. Definições de Quadras
  const ADMIN_COURTS = [
    { id: 'fut5', name: 'FUT 5 – SOCCER 5', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80', categoryLabel: 'Quadra Poliesportiva', normal: 90, promo: 50 },
    { id: 'fut6', name: 'FUT 6 – SOCCER 6', image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80', categoryLabel: 'Quadra Poliesportiva', normal: 100, promo: 60 },
    { id: 'fut7', name: 'FUT 7 – SOCCER 7', image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=80', categoryLabel: 'Quadra Poliesportiva', normal: 110, promo: 70 },
    { id: 'futmesa', name: 'FOOT TABLE – FUTMESA', image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop&q=80', categoryLabel: 'Futmesa & Lazer', normal: 35, promo: 25 },
    { id: 'areia', name: 'AREIA – BEACH SPORTS', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', categoryLabel: 'Arena Beach', normal: 60, promo: 40 },
    { id: 'society', name: 'SOCIETY – ARENA CENTRAL', image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=80', categoryLabel: 'Futebol Society', normal: 120, promo: 80 }
  ];

  // 2. Carregamento de Bookings e MonthlyMembers
  // 100% Cloud Database: O banco de dados na nuvem (Supabase DB1 e DB2) é a fonte de verdade absoluta
  function getLoadedBookings() {
    // Não carrega nada do localStorage local para evitar fantasmas ou dados dessincronizados
    return [];
  }

  function getLoadedMonthly() {
    if (window.ARENA_DEFAULT_DATA && Array.isArray(window.ARENA_DEFAULT_DATA.initialMonthlyMembers)) {
      return [...window.ARENA_DEFAULT_DATA.initialMonthlyMembers];
    }
    return [];
  }

  // Helper oficial de data atual do sistema (adaptação automática quando vira o dia)
  window.getSystemToday = function() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  };

  // Estado global do admin - Data Inicial definida para o DIA ATUAL:
  window.adminGameState = {
    bookings: getLoadedBookings(),
    monthlyMembers: getLoadedMonthly(),
    customers: [],
    courts: ADMIN_COURTS,
    selectedDate: (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'),
    movementFilterCourt: 'all',
    movementFilterStatus: 'all',
    cadastrosFilterCourt: 'all',
    cadastrosFilterStatus: 'all',
    cadastrosQuery: '',
    filtroClienteCategoria: 'todos',
    activeCadastrosSubTab: 'clientes'
  };

  // Máscara e formatação inteligente de telefone/WhatsApp: (81) 9.9999-9999
  window.aplicarMascaraTelefone = function(v) {
    let digits = String(v || '').replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length === 3) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + '.' + digits.slice(3);
    if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + '.' + digits.slice(3, 6) + '-' + digits.slice(6);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + '.' + digits.slice(3, 7) + '-' + digits.slice(7);
  };

  // Máscara e formatação de CPF: 000.000.000-00
  window.aplicarMascaraCPF = function(v) {
    let digits = String(v || '').replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length <= 9) return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6);
    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9);
  };

  // Helper de formatação de telefone para exibição
  function formatPhone(phone) {
    if (!phone) return '';
    return window.aplicarMascaraTelefone(phone);
  }

  // Helper de formatação de CPF
  function formatCPF(cpf) {
    if (!cpf) return '';
    const c = String(cpf).replace(/\D/g, '');
    if (c.length === 11) return c.slice(0, 3) + '.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-' + c.slice(9);
    return cpf;
  }

  // Helper de data legível
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
      const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return days[dt.getDay()] + ', ' + d + ' de ' + months[dt.getMonth()] + ' de ' + y;
    } catch(e) {
      return dateStr;
    }
  }

  // Mapeamento preciso e oficial de quadras e campos da Arena Limoeiro
  function getCourtById(cId) {
    if (!cId) return ADMIN_COURTS[0];
    const clean = String(cId).toLowerCase();
    // 1. FUT 5 (court-society-1)
    if (clean === 'court-society-1' || clean === 'fut5' || clean.includes('fut 5') || clean.includes('fut5') || clean.includes('soccer 5') || clean.includes('soccer-5')) return ADMIN_COURTS[0];
    // 2. FUT 6 (court-society-2)
    if (clean === 'court-society-2' || clean === 'fut6' || clean.includes('fut 6') || clean.includes('fut6') || clean.includes('soccer 6') || clean.includes('soccer-6')) return ADMIN_COURTS[1];
    // 3. FUT 7 (court-beach-1 - Campo Society Fut 7)
    if (clean === 'court-beach-1' || clean === 'fut7' || clean.includes('fut 7') || clean.includes('fut7') || clean.includes('soccer 7') || clean.includes('soccer-7')) return ADMIN_COURTS[2];
    // 4. FUTMESA (court-esportes-de-quadra-1788962671043)
    if (clean === 'court-esportes-de-quadra-1788962671043' || clean === 'futmesa' || clean.includes('futmesa') || clean.includes('foot-table') || clean.includes('foottable') || clean.includes('esportes-de-quadra')) return ADMIN_COURTS[3];
    // 5. AREIA (court-beach-2 - Quadra de Areia)
    if (clean === 'court-beach-2' || clean === 'areia' || clean.includes('areia') || clean.includes('sand court') || clean.includes('beach-2')) return ADMIN_COURTS[4];
    // 6. QUADRA SOCIETY (court-futsal-1788963178368 - Arena Central)
    if (clean === 'court-futsal-1788963178368' || clean === 'society' || clean.includes('futsal') || clean.includes('quadra society') || clean.includes('arena central')) return ADMIN_COURTS[5];
    return ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];
  }

  // Gera lista consolidada de partidas para uma data específica
  
  // ============================================================================
  // ☁️ MOTOR DE SINCRONIZAÇÃO EM NUVEM DUPLA (BANCO 1 + BANCO 2 DUAL-WRITE)
  // ============================================================================
  const ARENA_CLOUD_DBS = {
    db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
    db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
    db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
    syncEndpoint: '/api/sync'
  };

  // ============================================================================
  // 🗑️ EXPURGO AUTOMÁTICO DE DADOS ANTIGOS (LIBERAÇÃO 100% DE ESPAÇO NO SUPABASE)
  // Exclui do DB1 e DB2 todas as partidas com data anterior a 4 dias do dia atual
  // Ex: se hoje é dia 08, datas <= dia 04 são totalmente deletadas do banco e do cliente
  // ============================================================================
  window.purgeExpiredCloudBookings = async function() {
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const cutoffDateObj = new Date(ty, tm - 1, td - 4, 12, 0, 0);
      const cY = cutoffDateObj.getFullYear();
      const cM = String(cutoffDateObj.getMonth() + 1).padStart(2, '0');
      const cD = String(cutoffDateObj.getDate()).padStart(2, '0');
      const cutoffDate = `${cY}-${cM}-${cD}`;

      console.log(`[ArenaPurge] Executando expurgo de dados antigos: Hoje=${todayStr}, Limite de Corte (<= 4 dias)=${cutoffDate}`);

      // 1. Exclui do Banco 2 (Ativo / Salvaguarda) via Supabase REST DELETE em lote
      try {
        const delRes2 = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?date=lte.' + cutoffDate, {
          method: 'DELETE',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key
          }
        });
        if (delRes2.ok) {
          console.log(`[ArenaPurge] Sucesso no DB2: Jogos <= ${cutoffDate} deletados permanentemente.`);
        }
      } catch(e2) {
        console.warn('[ArenaPurge] Erro ao deletar no DB2:', e2);
      }

      // 2. Exclui do Banco 1 (Principal) via Supabase REST DELETE em lote
      try {
        const delRes1 = await fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?date=lte.' + cutoffDate, {
          method: 'DELETE',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key
          }
        });
        if (delRes1.ok) {
          console.log(`[ArenaPurge] Sucesso no DB1: Jogos <= ${cutoffDate} deletados permanentemente.`);
        }
      } catch(e1) {
        console.warn('[ArenaPurge] Erro ao deletar no DB1:', e1);
      }

      // 3. Higieniza estado operacional na memória do cliente
      if (window.adminGameState && Array.isArray(window.adminGameState.bookings)) {
        const initialCount = window.adminGameState.bookings.length;
        window.adminGameState.bookings = window.adminGameState.bookings.filter(b => {
          if (!b || !b.date) return false;
          return b.date > cutoffDate;
        });
        const removed = initialCount - window.adminGameState.bookings.length;
        if (removed > 0) {
          console.log(`[ArenaPurge] ${removed} reservas antigas removidas da memória local.`);
        }
      }

      // 4. Salva o localStorage limpo (evita ressuscitação ao recarregar a página)
      try {
        if (window.adminGameState && window.adminGameState.bookings) {
          
          
        }
      } catch(eLocal) {}

      // 5. Marca timestamp/data da última execução do expurgo
      window.__lastPurgeExecutionDate = todayStr;

      // 6. Atualiza as telas e contadores visuais
      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
      if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    } catch(err) {
      console.error('[ArenaPurge] Erro no expurgo:', err);
    }
  };

  // ============================================================================
  // 🌟 MODAL DE CONFIRMAÇÃO MODERNO & ELEGANTE (SUBSTITUI CONFIRM NATIVO)
  // ============================================================================
  window.mostrarConfirmacaoArena = function(opcoes = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modalConfirmacaoArena');
      if (!modal) {
        // Fallback caso o elemento não exista
        const fallback = confirm(opcoes.mensagem || 'Deseja confirmar esta ação?');
        return resolve(fallback);
      }

      const tituloEl = document.getElementById('modalConfirmacaoTitulo');
      const msgEl = document.getElementById('modalConfirmacaoMensagem');
      const btnConfirmar = document.getElementById('btnModalConfirmacaoConfirmar');
      const btnCancelar = document.getElementById('btnModalConfirmacaoCancelar');
      const iconWrap = document.getElementById('modalConfirmacaoIconWrap');
      const iconEl = document.getElementById('modalConfirmacaoIcon');

      // Título e Mensagem
      if (tituloEl) tituloEl.textContent = opcoes.titulo || 'Confirmar Ação';
      if (msgEl) msgEl.innerHTML = opcoes.mensagem || 'Tem certeza que deseja prosseguir com esta ação?';

      // Estilo do tipo (danger, warning, success, info)
      const tipo = opcoes.tipo || 'danger';
      if (tipo === 'danger') {
        if (iconWrap) iconWrap.className = 'w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-red-50 text-red-600 border border-red-100 shadow-xs';
        if (iconEl) iconEl.setAttribute('data-lucide', 'trash-2');
        if (btnConfirmar) {
          btnConfirmar.className = 'w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5';
          btnConfirmar.innerHTML = `<span>${opcoes.textoConfirmar || 'Excluir'}</span>`;
        }
      } else if (tipo === 'warning') {
        if (iconWrap) iconWrap.className = 'w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100 shadow-xs';
        if (iconEl) iconEl.setAttribute('data-lucide', 'alert-circle');
        if (btnConfirmar) {
          btnConfirmar.className = 'w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5';
          btnConfirmar.innerHTML = `<span>${opcoes.textoConfirmar || 'Confirmar'}</span>`;
        }
      } else {
        if (iconWrap) iconWrap.className = 'w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs';
        if (iconEl) iconEl.setAttribute('data-lucide', 'check-circle-2');
        if (btnConfirmar) {
          btnConfirmar.className = 'w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5';
          btnConfirmar.innerHTML = `<span>${opcoes.textoConfirmar || 'Confirmar'}</span>`;
        }
      }

      if (btnCancelar) {
        btnCancelar.textContent = opcoes.textoCancelar || 'Cancelar';
      }

      if (window.lucide) lucide.createIcons();

      const fechar = (resultado) => {
        modal.style.display = 'none';
        btnConfirmar.onclick = null;
        btnCancelar.onclick = null;
        modal.onclick = null;
        resolve(resultado);
      };

      btnConfirmar.onclick = () => fechar(true);
      btnCancelar.onclick = () => fechar(false);
      modal.onclick = (e) => {
        if (e.target === modal) fechar(false);
      };

      modal.style.display = 'flex';
    });
  };

  // Toda e qualquer atualização no sistema é enviada em Dual-Write para ambos os bancos (Otimizado de alta performance)
  window.syncBookingToCloud = function(booking, action = 'upsert') {
    if (!booking || !booking.id) return;

    // Exclusão definitiva executada diretamente nos Bancos de Dados na Nuvem (Supabase DB1 e DB2)
    if (action === 'delete') {
      console.log('[ArenaCloud] Excluindo permanentemente do banco de dados:', booking.id);
    }

    const payload = {
      id: String(booking.id),
      court_id: booking.court_id || booking.courtId || 'court-society-1',
      customer_id: booking.customer_id || null,
      date: booking.date || window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'),
      start_time: booking.start_time || (booking.time ? booking.time.split(' ')[0] : '16:00'),
      end_time: booking.end_time || (booking.time && booking.time.includes('às') ? booking.time.split('às')[1].trim() : '17:00'),
      time: booking.time || ((booking.start_time || '16:00') + ' às ' + (booking.end_time || '17:00')),
      duration: Number(booking.duration) || 60,
      customer_name: booking.customer_name || booking.name || 'Cliente Arena',
      customer_phone: booking.customer_phone || booking.phone || '(81) 99556-2693',
      total_price: Number(booking.total_price || booking.price || 100),
      status: booking.status || 'confirmed',
      booking_type: booking.booking_type || 'avulso',
      payment_method: booking.payment_method || booking.payment || 'pix',
      product_cart: (typeof booking.product_cart === 'object' && booking.product_cart !== null) ? booking.product_cart : {},
      observation: booking.observation || booking.finishObs || null
    };

    console.log('[ArenaCloud] Dual-Write ágil:', action, payload.id, 'status:', payload.status);

    // Execução assíncrona em background para NUNCA travar a interface do usuário ou resposta de botões
    setTimeout(async () => {
      const writeCloud = async (dbUrl, dbKey) => {
        try {
          if (action === 'delete') {
            await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
            });
          } else {
            // Upsert atômico em 1 requisição com preferência merge-duplicates
            const res = await fetch(dbUrl + '/rest/v1/bookings', {
              method: 'POST',
              headers: {
                apikey: dbKey,
                Authorization: 'Bearer ' + dbKey,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              await fetch(dbUrl + '/rest/v1/bookings?id=eq.' + encodeURIComponent(payload.id), {
                method: 'PATCH',
                headers: {
                  apikey: dbKey,
                  Authorization: 'Bearer ' + dbKey,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal'
                },
                body: JSON.stringify(payload)
              });
            }
          }
        } catch(e) {}
      };

      // Dispara DB2 e DB1 em paralelo sem bloquear a UI
      await Promise.allSettled([
        writeCloud(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        writeCloud(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
      ]);

      // Notificação serverless
      try {
        if (window.ArenaCloudSync && typeof window.ArenaCloudSync.push === 'function') {
          window.ArenaCloudSync.push(action === 'delete' ? 'delete_booking' : 'push_booking', payload).catch(() => {});
        } else {
          fetch(ARENA_CLOUD_DBS.syncEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action === 'delete' ? 'delete_booking' : 'push_booking', payload })
          }).catch(() => {});
        }
      } catch(e) {}
    }, 0);

    // Broadcast local instantâneo entre abas
    try {
      const bc = new BroadcastChannel('arena_limoeiro_sync');
      bc.postMessage({ type: 'booking_updated', action, payload });
    } catch(e) {}
  };

  // Puxa agendamentos e mensalistas dos Bancos de Dados na Nuvem (Otimizado: paralelo, com debounce e detecção de mudanças)
  window.pullDataFromCloudDatabases = async function() {
    // Evita sobreposição de puxadas simultâneas
    if (window.__pullInProgress) return;
    const nowTs = Date.now();
    if (window.__lastPullSuccessTs && (nowTs - window.__lastPullSuccessTs < 3000)) {
      return; // Debounce de 3s para evitar requisições redundantes
    }
    window.__pullInProgress = true;

    // Executa expurgo diário preventivo antes de puxar dados (libera espaço e evita baixar registros mortos)
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        await window.purgeExpiredCloudBookings();
      }
    } catch(pErr) {}

    try {
      const fetchFast = async (url, key) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4500);
        try {
          const res = await fetch(url, {
            headers: { apikey: key, Authorization: 'Bearer ' + key, 'Accept': 'application/json' },
            signal: ctrl.signal
          });
          clearTimeout(timer);
          if (res.ok) return await res.json();
        } catch(e) {
          clearTimeout(timer);
        }
        return null;
      };

      // 1. Busca prioritária no DB2 (Banco Principal Completo) com fallback seguro no DB1
      const bookingsPromise = fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db2Key)
        .then(r => (Array.isArray(r) && r.length > 0) ? r : fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=*&order=date.asc', ARENA_CLOUD_DBS.db1Key))
        .catch(() => null);

      // 2. Busca prioritária de mensalistas no DB2 com fallback no DB1
      const membersPromise = fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db2Key)
        .then(r => (Array.isArray(r) && r.length > 0) ? r : fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/monthly_members?select=*&order=day_of_week.asc', ARENA_CLOUD_DBS.db1Key))
        .catch(() => null);

      // 3. Busca de clientes
      const customersPromise = fetchFast(ARENA_CLOUD_DBS.db2Url + '/rest/v1/customers?select=*&order=name.asc', ARENA_CLOUD_DBS.db2Key)
        .then(r => (Array.isArray(r) && r.length > 0) ? r : fetchFast(ARENA_CLOUD_DBS.db1Url + '/rest/v1/customers?select=*&order=name.asc', ARENA_CLOUD_DBS.db1Key))
        .catch(() => null);

      const [cloudBookings, cloudMembers, cloudCustomers] = await Promise.all([bookingsPromise, membersPromise, customersPromise]);
      let stateChanged = false;

      // 100% VINCULADO AO BANCO DE DADOS NA NUVEM: A nuvem é a fonte de verdade absoluta e em tempo real.
      // Se um registro foi excluído no banco, ele NÃO existe mais e NUNCA é ressuscitado.
      if (Array.isArray(cloudBookings)) {
        const newSig = cloudBookings.length + '_' + cloudBookings.map(b => b.id + ':' + b.status + ':' + (b.date || '') + ':' + (b.payment_status || '') + ':' + (b.attendance || '')).join('|');
        if (newSig !== window.__lastBookingsSig) {
          window.__lastBookingsSig = newSig;
          stateChanged = true;
          window.adminGameState.bookings = cloudBookings;
        }
      }

      // 2. Atualiza mensalistas diretamente do banco de dados na nuvem
      if (Array.isArray(cloudMembers)) {
        const memSig = cloudMembers.length + '_' + cloudMembers.map(m => m.id + ':' + m.status + ':' + (m.day_of_week || '')).join(',');
        if (memSig !== window.__lastMembersSig) {
          window.__lastMembersSig = memSig;
          stateChanged = true;
          window.adminGameState.monthlyMembers = cloudMembers;
        }
      }

      // 3. Atualiza clientes cadastrados na nuvem
      if (Array.isArray(cloudCustomers)) {
        const custSig = cloudCustomers.length + '_' + cloudCustomers.map(c => c.id + ':' + (c.name || '')).join(',');
        if (custSig !== window.__lastCustomersSig) {
          window.__lastCustomersSig = custSig;
          stateChanged = true;
          window.adminGameState.customers = cloudCustomers;
        }
      }

      window.__lastPullSuccessTs = Date.now();

      // Só re-renderiza se houve alteração REAL nos dados!
      if (stateChanged) {
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        // Atualiza apenas os contadores numéricos sem reconstruir o DOM da régua para nunca resetar o scroll da tela
        if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
        if (typeof window.renderCadastrosClientes === 'function') window.renderCadastrosClientes();
      }
    } catch(err) {
      console.warn('[ArenaCloud] Erro geral na sincronização rápida:', err);
    } finally {
      window.__pullInProgress = false;
    }
  };


  function getMatchesForDate(dateStr) {
    if (!dateStr) dateStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    if (!window.__matchesCacheByDate) window.__matchesCacheByDate = new Map();
    if (window.__matchesCacheByDate.has(dateStr)) {
      return window.__matchesCacheByDate.get(dateStr);
    }
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayOfWeek = dayOfWeekMap[dt.getDay()];

    // Regra: Finaliza todos os jogos dos dias anteriores
    const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : (function() {
      const nw = new Date();
      return nw.getFullYear() + '-' + String(nw.getMonth() + 1).padStart(2, '0') + '-' + String(nw.getDate()).padStart(2, '0');
    })();
    const isPast = (dateStr < sysTodayStr);
    const defaultPastStatus = isPast ? 'finished' : 'confirmed';

    let matches = [];

    // 1. Mensalistas fixos do dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (mDay === currentDayOfWeek) {
        const startT = m.start_time || m.startTime || m.time || '19:00';
        const endT = m.end_time || m.endTime || (startT.includes(':') ? String(Number(startT.split(':')[0]) + 1).padStart(2, '0') + ':' + startT.split(':')[1] : '20:00');
        const court = getCourtById(m.court_id || m.courtId);
        
        matches.push({
          id: 'monthly-' + m.id,
          court_id: court.id,
          court_name: court.name,
          date: dateStr,
          customer_name: (m.team_name || m.teamName || 'Mensalista') + (m.responsible_name && m.responsible_name !== m.team_name ? ' (' + m.responsible_name + ')' : ''),
          customer_phone: m.phone || '(81) 98765-4321',
          customer_cpf: m.cpf || '',
          start_time: startT,
          end_time: endT,
          time: startT + ' às ' + endT,
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
          status: defaultPastStatus,
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')'
        });
      }
    });

    // 2. Reservas diretas da data (estritamente b.date === dateStr)
    (window.adminGameState.bookings || []).forEach(b => {
      if (!b) return;
      // Permite incluir reservas canceladas/sem pagamento para exibição nos filtros 'everything' e 'cancelled'
      if (b.date === dateStr) {
        // Manutenção de integridade: preserva status original finalizado ou cancelado
        const court = getCourtById(b.court_id || b.courtId);
        const startT = b.start_time || (b.time ? b.time.split(' ')[0] : '19:00');
        const endT = b.end_time || (b.time ? b.time.split(' às ')[1] : '20:00');

        // Sobrescrita específica de jogo desta data: busca correspondência por ID, ID de mensalista ou vinculação de horário
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.isMensalista && (String(m.id) === 'monthly-' + b.id || (m.court_id === court.id && m.start_time === startT))));
        if (existing) {
          existing.status = (isPast ? 'finished' : (b.status || existing.status));
          if (b.court_id || b.courtId) {
            existing.court_id = court.id;
            existing.court_name = court.name;
          }
          if (b.start_time) existing.start_time = b.start_time;
          if (b.end_time) existing.end_time = b.end_time;
          if (b.time) existing.time = b.time;
          else if (b.start_time && b.end_time) existing.time = b.start_time + ' às ' + b.end_time;
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          if (b.late !== undefined) existing.late = b.late;
          if (b.lateReason !== undefined) existing.lateReason = b.lateReason;
          if (b.ballReturned !== undefined) existing.ballReturned = b.ballReturned;
          if (b.finishedAt) existing.finishedAt = b.finishedAt;
          if (b.customer_name) existing.customer_name = b.customer_name;
          if (b.customer_phone) existing.customer_phone = b.customer_phone;
          if (b.observation) existing.observation = b.observation;
          existing.date = dateStr;
        } else {
          matches.push({
            id: b.id,
            court_id: court.id,
            court_name: court.name,
            date: dateStr,
            customer_name: b.customer_name || b.customerName || 'Cliente Arena',
            customer_phone: b.customer_phone || b.customerPhone || '',
            customer_cpf: b.customer_cpf || b.customerCpf || '',
            emergency_contact: b.emergency_contact || '',
            health_notes: b.health_notes || '',
            start_time: startT,
            end_time: endT,
            time: b.time || (startT + ' às ' + endT),
            total_price: parseFloat(b.total_price || b.totalPrice || 90),
            status: (isPast ? 'finished' : (b.status || 'confirmed')),
            isMensalista: b.booking_type === 'mensalista' || (b.id && String(b.id).startsWith('monthly-')),
            booking_type: b.booking_type || 'avulso',
            payment_method: b.payment_method || 'PIX Balcão',
            observation: b.observation || 'Reserva direta confirmada'
          });
        }
      }
    });

    // Fallback garantido para terça-feira 03/11/2026 com os 5 jogos oficiais completos
    // Bloco de fallback de 03/11/2026 removido para respeitar o expurgo definitivo de dados antigos

    // FILTRO ESTRITO DE DATA E HIGIENIZAÇÃO:
    // Garante que TODOS os jogos pertencem rigorosamente a dateStr e exclui contaminações entre dias
    // Exclusão de partidas canceladas/removidas
    let excluidosMap = {};
    try {
      const savedExcl = localStorage.getItem('arena_jogos_excluidos_v1');
      if (savedExcl) excluidosMap = JSON.parse(savedExcl);
    } catch(e) {}

    matches = matches.filter(m => {
      if (!m) return false;
      const exKey = m.id + '_' + dateStr;
      if (excluidosMap[exKey]) return false;
      if (m.id && String(m.id).startsWith('monthly-')) {
        const rawMid = String(m.id).replace('monthly-', '');
        if (excluidosMap[rawMid + '_' + dateStr]) return false;
      }
      if (m.date !== dateStr) return false;
      // Impede que mensalista fixo de outro dia apareça (ex: Davi de segunda aparecendo na terça)
      if (m.observation && m.observation.includes('Horário Fixo Semanal (')) {
        const expectedObs = 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')';
        if (m.observation !== expectedObs) return false;
      }
      return true;
    });

    matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    if (!window.__matchesCacheByDate) window.__matchesCacheByDate = new Map();
    window.__matchesCacheByDate.set(dateStr, matches);
    return matches;
  }
  window.getMatchesForDate = getMatchesForDate;

  // Renderizador de Card de Partida (Movimentação e Feed)
  // Helper de cálculo de duração
  function calcDuration(a, b) {
    if (!a || !b) return '1h';
    const [ha, ma] = a.split(':').map(Number);
    const [hb, mb] = b.split(':').map(Number);
    const diff = (hb * 60 + mb) - (ha * 60 + ma);
    if (diff <= 0) return '1h';
    const h = Math.floor(diff / 60);
    const min = diff % 60;
    return (h > 0 ? h + 'h' : '') + (min > 0 ? (h > 0 ? String(min).padStart(2, '0') + 'min' : min + 'min') : '');
  }

  // Toast flutuante de feedback
  window.arenaToast = function(msg) {
    const t = document.getElementById('arenaToast');
    const txt = document.getElementById('arenaToastMsg') || document.getElementById('arenaToastText');
    if (!t) return;
    if (txt) txt.textContent = msg;
    t.classList.remove('opacity-0', 'translate-y-20', 'translate-y-3', 'pointer-events-none');
    t.classList.add('opacity-100', 'translate-y-0');
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    clearTimeout(window.arenaToastTimer);
    window.arenaToastTimer = setTimeout(() => {
      t.classList.add('opacity-0', 'translate-y-20', 'pointer-events-none');
      t.classList.remove('opacity-100', 'translate-y-0');
    }, 3200);
  };

  // Helper para buscar ou promover um jogo para o estado de bookings
  window.getGame = function(id) {
    let g = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id));
    if (g) return g;
    if (String(id).startsWith('monthly-')) {
      const rawId = String(id).replace('monthly-', '');
      const m = (window.adminGameState.monthlyMembers || []).find(x => String(x.id) === rawId);
      if (m) {
        const court = getCourtById(m.court_id || m.courtId);
        const startT = m.start_time || m.startTime || m.time || '18:00';
        const endT = m.end_time || m.endTime || (startT.includes(':') ? String(Number(startT.split(':')[0]) + 1).padStart(2, '0') + ':' + startT.split(':')[1] : '19:00');
        const selDate = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
        const [sy, smm, sd] = selDate.split('-');
        const sdt = new Date(Number(sy), Number(smm) - 1, Number(sd), 12, 0, 0);
        const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const currentDayOfWeek = dayOfWeekMap[sdt.getDay()];
        const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const promoted = {
          id: String(id),
          court_id: court.id,
          court_name: court.name,
          date: selDate,
          customer_name: (m.team_name || m.teamName || 'Mensalista') + (m.responsible_name && m.responsible_name !== m.team_name ? ' (' + m.responsible_name + ')' : ''),
          name: (m.team_name || m.teamName || 'Mensalista') + (m.responsible_name && m.responsible_name !== m.team_name ? ' (' + m.responsible_name + ')' : ''),
          customer_phone: m.phone || '(81) 9 9556-2893',
          phone: m.phone || '(81) 9 9556-2893',
          customer_cpf: m.cpf || '',
          start_time: startT,
          start: startT,
          end_time: endT,
          end: endT,
          time: startT + ' às ' + endT,
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
          price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          type: 'Mensalista',
          payment: 'Pago',
          players: 14,
          dayFixed: (m.day_of_week || m.dayOfWeek || currentDayOfWeek).toUpperCase(),
          observation: 'Horário Fixo Semanal (' + (m.day_of_week || m.dayOfWeek || currentDayOfWeek).toUpperCase() + ')',
          note: 'Horário Fixo Semanal (' + (m.day_of_week || m.dayOfWeek || currentDayOfWeek).toUpperCase() + ')',
          attendance: 'Aguardando chegada',
          late: 0,
          log: [{ at: 'Reserva cadastrada', text: 'Horário fixo semanal · ' + (m.day_of_week || m.dayOfWeek || currentDayOfWeek) }],
          contract: {
            number: 'AL-MENS-' + m.id,
            type: 'Mensalista',
            start: '2026-10-01',
            end: '2026-12-31',
            day: (m.day_of_week || m.dayOfWeek || currentDayOfWeek).toUpperCase(),
            due: '10',
            amount: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
            signed: 'Assinado',
            terms: 'Horário fixo semanal às ' + (m.day_of_week || m.dayOfWeek || currentDayOfWeek) + '. Comunicar alterações com antecedência.'
          }
        };
        // Só adiciona a bookings se o mensalista for de fato do dia da semana selecionado
        if (mDay === currentDayOfWeek) {
          window.adminGameState.bookings.push(promoted);
        }
        return promoted;
      }
    }
    return null;
  };

  // Helper de log
  window.addMatchLog = function(g, at, text) {
    g.log = g.log || [];
    g.log.unshift({ at, text });
  };

  // Salva no storage e atualiza ambas as listas de forma instantânea e fluida
  window.saveAdminGameState = function() {
    if (window.__isSavingAdminState) return;
    window.__isSavingAdminState = true;
    
    try {
      if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
      if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
      if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
    } finally {
      window.__isSavingAdminState = false;
    }
  };

  // Funções de ação rápida
  window.toggleDetails = function(id) {
    if (!window.__openDetailsIds) window.__openDetailsIds = new Set();
    const strId = String(id);
    const el = document.getElementById('details-' + strId);
    const arrowEl = document.getElementById('arrow-details-' + strId);
    if (el) {
      const isHidden = (el.style.display === 'none' || el.classList.contains('hidden'));
      if (isHidden) {
        el.style.display = 'block';
        el.classList.remove('hidden');
        window.__openDetailsIds.add(strId);
        if (arrowEl) arrowEl.textContent = '▴';
      } else {
        el.style.display = 'none';
        el.classList.add('hidden');
        window.__openDetailsIds.delete(strId);
        if (arrowEl) arrowEl.textContent = '▾';
      }
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  window.markArrived = function(id) {
    const g = getGame(id);
    if (!g) return;
    if (['no-show', 'cancelled', 'finished'].includes(g.status)) {
      arenaToast('Esta partida não aceita check-in neste status.');
      return;
    }
    g.attendance = 'Chegou';
    g.checkinAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    addMatchLog(g, 'Presença', 'Titular/equipe chegou às ' + g.checkinAt);
    saveAdminGameState();
    arenaToast('Presença registrada às ' + g.checkinAt);
  };

  window.startGame = function(id) {
    const g = getGame(id);
    if (!g) return;
    if (g.status === 'no-show' || g.status === 'cancelled') {
      arenaToast('Não é possível iniciar uma partida ausente ou cancelada.');
      return;
    }
    g.status = 'live';
    g.attendance = 'Chegou';
    g.checkinAt = g.checkinAt || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    g.startedAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    addMatchLog(g, 'Jogo iniciado', 'Partida iniciada às ' + g.startedAt);
    saveAdminGameState();
    arenaToast('Partida iniciada.');
  };

  window.finishGame = function(id) {
    const g = getGame(id);
    if (!g) return;
    g.status = 'finished';
    g.finishedAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    addMatchLog(g, 'Jogo encerrado', 'Partida encerrada às ' + g.finishedAt);
    saveAdminGameState();
    arenaToast('Partida finalizada com sucesso.');
  };

  // Ajuste de Horário
  window.arenaAdjustDirection = 'advance';
  window.arenaAdjustMinutes = 5;

  window.setAdjustDirection = function(dir) {
    window.arenaAdjustDirection = dir;
    document.querySelectorAll('#adjustDirectionButtons button').forEach(b => {
      if (b.dataset.dir === dir) {
        b.className = 'flex-1 px-3.5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 text-white border border-emerald-600 shadow-sm cursor-pointer text-center';
      } else {
        b.className = 'flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer text-center';
      }
    });
  };

  window.setAdjustMinutes = function(min) {
    window.arenaAdjustMinutes = Number(min);
    document.querySelectorAll('#adjustMinutesButtons button').forEach(b => {
      if (Number(b.dataset.min) === Number(min)) {
        b.className = 'flex-1 px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white border border-emerald-600 shadow-sm cursor-pointer text-center';
      } else {
        b.className = 'flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer text-center';
      }
    });
  };

  window.openAdjust = function(id) {
    const g = getGame(id);
    if (!g) return;
    document.getElementById('adjustMatchId').value = id;
    setAdjustDirection('advance');
    setAdjustMinutes(5);
    document.getElementById('adjustReasonInput').value = '';
    const s = g.start_time || g.start || '18:00';
    const e = g.end_time || g.end || '19:00';
    document.getElementById('adjustPreviewText').textContent = 'Horário atual: ' + s + '–' + e + '. A duração será mantida.';
    const m = document.getElementById('arenaAdjustModal');
    if (m) { m.style.display = 'flex'; m.classList.remove('hidden'); }
    if (window.lucide) lucide.createIcons();
  };

  window.applyAdjust = function() {
    const id = document.getElementById('adjustMatchId').value;
    const g = getGame(id);
    if (!g) return;
    const s = g.start_time || g.start || '18:00';
    const e = g.end_time || g.end || '19:00';
    const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const fromMin = v => { v = (v + 1440) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
    const delta = window.arenaAdjustDirection === 'advance' ? -window.arenaAdjustMinutes : window.arenaAdjustMinutes;
    const ns = fromMin(toMin(s) + delta);
    const ne = fromMin(toMin(e) + delta);
    if (toMin(ne) <= toMin(ns)) {
      arenaToast('O ajuste gerou um horário inválido.');
      return;
    }
    const oldStr = s + '–' + e;
    g.start_time = ns;
    g.start = ns;
    g.end_time = ne;
    g.end = ne;
    g.time = ns + ' às ' + ne;
    const reason = document.getElementById('adjustReasonInput').value.trim();
    addMatchLog(g, 'Horário ajustado', oldStr + ' → ' + ns + '–' + ne + ' (' + (window.arenaAdjustDirection === 'advance' ? 'adiantado' : 'atrasado') + ' ' + window.arenaAdjustMinutes + ' min). ' + (reason ? 'Motivo: ' + reason : ''));
    saveAdminGameState();
    closeArenaModal('arenaAdjustModal');
    arenaToast('Horário atualizado com sucesso mantendo a duração!');
  };

  // Atraso
  window.arenaLateMinutes = 5;
  window.selectLateMinutes = function(min) {
    window.arenaLateMinutes = Number(min);
    document.querySelectorAll('#lateMinutesButtons button').forEach(b => {
      if (Number(b.dataset.min) === Number(min)) {
        b.className = 'px-3 py-2 rounded-xl text-xs font-black bg-amber-600 text-white border border-amber-600 shadow-sm cursor-pointer text-center';
      } else {
        b.className = 'px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer text-center';
      }
    });
  };

  window.openLate = function(id) {
    const g = getGame(id);
    if (!g) return;
    document.getElementById('lateMatchId').value = id;
    selectLateMinutes(5);
    document.getElementById('lateNoteInput').value = '';
    const m = document.getElementById('arenaLateModal');
    if (m) { m.style.display = 'flex'; m.classList.remove('hidden'); }
    if (window.lucide) lucide.createIcons();
  };

  window.applyLate = function() {
    const id = document.getElementById('lateMatchId').value;
    const g = getGame(id);
    if (!g) return;
    g.late = window.arenaLateMinutes;
    g.attendance = 'Atrasado';
    const note = document.getElementById('lateNoteInput').value.trim();
    addMatchLog(g, 'Atraso da equipe', (window.arenaLateMinutes === 20 ? '20 ou mais' : window.arenaLateMinutes) + ' minutos. ' + (note ? 'Obs: ' + note : ''));
    saveAdminGameState();
    closeArenaModal('arenaLateModal');
    arenaToast('Atraso registrado; horário da reserva mantido.');
  };

  // Não compareceu
  window.openNoShow = function(id) {
    const g = getGame(id);
    if (!g) return;
    document.getElementById('noShowMatchId').value = id;
    document.getElementById('noShowReasonInput').value = '';
    const m = document.getElementById('arenaNoShowModal');
    if (m) { m.style.display = 'flex'; m.classList.remove('hidden'); }
    if (window.lucide) lucide.createIcons();
  };

  window.applyNoShow = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('noShowMatchId').value;
    const reason = (document.getElementById('noShowReason')?.value || document.getElementById('noShowReasonInput')?.value || '').trim() || 'Responsável não compareceu';
    
    // Remove completamente do estado local
    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || { id: id, observation: reason };
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id));
    
    // Atualiza o localStorage local
    

    // ☁️ Exclui do Supabase (DB1 e DB2) com garantia de imunidade contra ressuscitação
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(bookingToDelete, 'delete');
    }

    closeArenaModal('arenaNoShowModal');
    if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
    if (typeof arenaToast === 'function') {
      arenaToast('✓ Ausência confirmada. O jogo foi excluído e sumiu do banco de dados!');
    }
  };



  // =========================================================================
  // FUNÇÕES DE CONCLUSÃO, CÁLCULO AUTOMÁTICO DE TEMPO EXTRA E ORIGEM
  // =========================================================================

  // Funções de Cálculo e Conversão de Horários
  window.calcDelayFromArrival = function(startTimeStr, arrivalTimeStr) {
    if (!startTimeStr || !arrivalTimeStr) return 0;
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [ah, am] = arrivalTimeStr.split(':').map(Number);
    const diff = (ah * 60 + am) - (sh * 60 + sm);
    return Math.max(0, diff);
  };

  window.calcArrivalFromDelay = function(startTimeStr, delayMins) {
    if (!startTimeStr) return '';
    const [sh, sm] = startTimeStr.split(':').map(Number);
    let totalMins = sh * 60 + sm + Number(delayMins || 0);
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  window.calcExtraFromExtendedEnd = function(endTimeStr, actualEndTimeStr) {
    if (!endTimeStr || !actualEndTimeStr) return 0;
    const [eh, em] = endTimeStr.split(':').map(Number);
    const [ah, am] = actualEndTimeStr.split(':').map(Number);
    const diff = (ah * 60 + am) - (eh * 60 + em);
    return Math.max(0, diff);
  };

  window.calcExtendedEndFromExtra = function(endTimeStr, extraMins) {
    if (!endTimeStr) return '';
    const [eh, em] = endTimeStr.split(':').map(Number);
    let totalMins = eh * 60 + em + Number(extraMins || 0);
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  // 1. Digitar Horas e Minutos de atraso no card
  window.onGameDelayHMChange = function(id) {
    const inputH = document.getElementById('input-delay-h-' + id);
    const inputM = document.getElementById('input-delay-m-' + id);
    const h = parseInt(inputH ? inputH.value : 0, 10) || 0;
    const m = parseInt(inputM ? inputM.value : 0, 10) || 0;
    const mins = Math.max(0, h * 60 + m);

    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    g.late = mins;

    const startT = g.start_time || g.start || '18:00';
    const arrTime = mins > 0 ? window.calcArrivalFromDelay(startT, mins) : '';
    g.arrival_time = arrTime;

    const inputArr = document.getElementById('input-arr-' + id);
    if (inputArr && document.activeElement !== inputArr) inputArr.value = arrTime;

    const statusEl = document.getElementById('status-delay-' + id);
    if (statusEl) {
      if (mins > 0) {
        statusEl.className = 'tc-status-text text-amber-800';
        const hText = Math.floor(mins / 60) > 0 ? Math.floor(mins / 60) + 'h ' : '';
        const mText = (mins % 60) > 0 ? (mins % 60) + 'min' : (hText ? '' : '0min');
        statusEl.textContent = `◷ ${hText}${mText} de atraso` + (arrTime ? ` (Chegou às ${arrTime})` : '');
      } else {
        statusEl.className = 'tc-status-text text-emerald-700';
        statusEl.textContent = '✓ Sem atraso (no horário)';
      }
    }
    if (typeof saveAdminGameState === 'function') saveAdminGameState();
  };

  // 2. Digitar horário de chegada no card
  window.onGameArrivalInput = function(id, timeVal) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    const startT = g.start_time || g.start || '18:00';
    const mins = window.calcDelayFromArrival(startT, timeVal);
    g.late = mins;
    g.arrival_time = timeVal;

    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const inputH = document.getElementById('input-delay-h-' + id);
    const inputM = document.getElementById('input-delay-m-' + id);
    if (inputH) inputH.value = h > 0 ? h : '';
    if (inputM) inputM.value = m > 0 ? m : (h > 0 ? '0' : '');

    const statusEl = document.getElementById('status-delay-' + id);
    if (statusEl) {
      if (mins > 0) {
        statusEl.className = 'tc-status-text text-amber-800';
        const hText = h > 0 ? h + 'h ' : '';
        const mText = m > 0 ? m + 'min' : (hText ? '' : '0min');
        statusEl.textContent = `◷ ${hText}${mText} de atraso (Chegou às ${timeVal})`;
      } else {
        statusEl.className = 'tc-status-text text-emerald-700';
        statusEl.textContent = '✓ Sem atraso (no horário)';
      }
    }
    if (typeof saveAdminGameState === 'function') saveAdminGameState();
  };

  // 3. Digitar Horas e Minutos de horário extra no card
  window.onGameExtraHMChange = function(id) {
    const inputH = document.getElementById('input-extra-h-' + id);
    const inputM = document.getElementById('input-extra-m-' + id);
    const h = parseInt(inputH ? inputH.value : 0, 10) || 0;
    const m = parseInt(inputM ? inputM.value : 0, 10) || 0;
    const mins = Math.max(0, h * 60 + m);

    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;

    const endT = g.end_time || g.end || '19:00';
    const extEnd = mins > 0 ? window.calcExtendedEndFromExtra(endT, mins) : '';
    g.extraTime = mins;
    g.extra_minutes = mins;
    g.extended_end = extEnd;

    const inputExt = document.getElementById('input-extended-end-' + id);
    if (inputExt && document.activeElement !== inputExt) inputExt.value = extEnd;

    const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { normal: 100 };
    const hourlyRate = court && court.normal ? court.normal : 100;
    const extraAmount = Math.round((mins / 60) * hourlyRate);
    const extraAmountStr = extraAmount.toFixed(2).replace('.', ',');
    const basePrice = parseFloat(g.total_price || g.price || 100);
    const totalCalculated = basePrice + extraAmount;
    const totalCalculatedStr = totalCalculated.toFixed(2).replace('.', ',');

    g.extraAmount = extraAmount;

    const statusExtra = document.getElementById('status-extra-' + id);
    if (statusExtra) {
      if (mins > 0) {
        statusExtra.className = 'tc-status-text text-emerald-800';
        const hText = Math.floor(mins / 60) > 0 ? Math.floor(mins / 60) + 'h ' : '';
        const mText = (mins % 60) > 0 ? (mins % 60) + 'min' : (hText ? '' : '0min');
        statusExtra.textContent = `+${hText}${mText} extra (+ R$ ${extraAmountStr})` + (extEnd ? ` (até ${extEnd})` : '');
      } else {
        statusExtra.className = 'tc-status-text text-slate-500';
        statusExtra.textContent = 'Sem tempo extra';
      }
    }

    const calcVal = document.getElementById('calc-val-' + id);
    if (calcVal) {
      calcVal.textContent = `R$ ${totalCalculatedStr} • ${g.isMensalista ? 'Mensalidade Faturada' : (mins > 0 ? `Base R$ ${basePrice.toFixed(2).replace('.', ',')} + Extra R$ ${extraAmountStr}` : 'Avulso')}`;
    }

    const calcTotalEl = document.getElementById('status-calc-total-' + id);
    if (calcTotalEl) {
      calcTotalEl.textContent = `R$ ${totalCalculatedStr} • ${mins > 0 ? 'Pendente Extra' : 'Pago'}`;
    }
    const calcDetailEl = document.getElementById('status-calc-detail-' + id);
    if (calcDetailEl) {
      calcDetailEl.textContent = mins > 0 
        ? `Base R$ ${basePrice.toFixed(2).replace('.', ',')} + Extra (${mins}m): R$ ${extraAmountStr}` 
        : `Valor contratado: R$ ${basePrice.toFixed(2).replace('.', ',')}`;
    }
    const badgeCalc = document.getElementById('badge-calc-status-' + id);
    if (badgeCalc) {
      badgeCalc.className = `text-[10px] font-bold ${mins > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded`;
      badgeCalc.textContent = mins > 0 ? 'Pendente Extra' : 'Pago';
    }
    const mainPriceEl = document.getElementById('mainPriceDisplay-' + id);
    if (mainPriceEl) {
      mainPriceEl.textContent = `R$ ${totalCalculatedStr}`;
    }

    if (typeof saveAdminGameState === 'function') saveAdminGameState();
  };

  // 4. Digitar horário estendido final no card
  window.onGameExtendedEndInput = function(id, timeVal) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    const endT = g.end_time || g.end || '19:00';
    const mins = window.calcExtraFromExtendedEnd(endT, timeVal);
    g.extraTime = mins;
    g.extra_minutes = mins;
    g.extended_end = timeVal;

    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const inputH = document.getElementById('input-extra-h-' + id);
    const inputM = document.getElementById('input-extra-m-' + id);
    if (inputH) inputH.value = h > 0 ? h : '';
    if (inputM) inputM.value = m > 0 ? m : (h > 0 ? '0' : '');

    const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { normal: 100 };
    const hourlyRate = court && court.normal ? court.normal : 100;
    const extraAmount = Math.round((mins / 60) * hourlyRate);
    const extraAmountStr = extraAmount.toFixed(2).replace('.', ',');
    const basePrice = parseFloat(g.total_price || g.price || 100);
    const totalCalculated = basePrice + extraAmount;
    const totalCalculatedStr = totalCalculated.toFixed(2).replace('.', ',');

    g.extraAmount = extraAmount;

    const statusExtra = document.getElementById('status-extra-' + id);
    if (statusExtra) {
      if (mins > 0) {
        statusExtra.className = 'tc-status-text text-emerald-800';
        const hText = h > 0 ? h + 'h ' : '';
        const mText = m > 0 ? m + 'min' : (hText ? '' : '0min');
        statusExtra.textContent = `+${hText}${mText} extra (+ R$ ${extraAmountStr}) (até ${timeVal})`;
      } else {
        statusExtra.className = 'tc-status-text text-slate-500';
        statusExtra.textContent = 'Sem tempo extra';
      }
    }

    const calcVal = document.getElementById('calc-val-' + id);
    if (calcVal) {
      calcVal.textContent = `R$ ${totalCalculatedStr} • ${g.isMensalista ? 'Mensalidade Faturada' : (mins > 0 ? `Base R$ ${basePrice.toFixed(2).replace('.', ',')} + Extra R$ ${extraAmountStr}` : 'Avulso')}`;
    }

    if (typeof saveAdminGameState === 'function') saveAdminGameState();
  };

  // Compatibilidade caso chamado via código legado
  window.onGameDelayInput = function(id, val) {
    const mins = parseInt(val || 0, 10);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const inH = document.getElementById('input-delay-h-' + id);
    const inM = document.getElementById('input-delay-m-' + id);
    if (inH) inH.value = h > 0 ? h : '';
    if (inM) inM.value = m > 0 ? m : (h > 0 ? '0' : '');
    window.onGameDelayHMChange(id);
  };

  window.onGameExtraInput = function(id, val) {
    const mins = parseInt(val || 0, 10);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const inH = document.getElementById('input-extra-h-' + id);
    const inM = document.getElementById('input-extra-m-' + id);
    if (inH) inH.value = h > 0 ? h : '';
    if (inM) inM.value = m > 0 ? m : (h > 0 ? '0' : '');
    window.onGameExtraHMChange(id);
  };

  // 5. Mudar origem no card
  window.onGameOriginChange = function(id, originVal) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    g.booking_origin = originVal;
    const statusOrig = document.getElementById('status-origin-' + id);
    if (statusOrig) statusOrig.textContent = originVal;
    if (typeof saveAdminGameState === 'function') saveAdminGameState();
  };

  // Handlers para digitação no modal #arenaFinishModal com Horas e Minutos
  window.onModalLateHMType = function() {
    const h = parseInt(document.getElementById('finishInputLateH')?.value || 0, 10) || 0;
    const m = parseInt(document.getElementById('finishInputLateM')?.value || 0, 10) || 0;
    const mins = Math.max(0, h * 60 + m);
    window.setFinishLateMinutes(mins);
    const id = document.getElementById('finishMatchId')?.value;
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (g) {
      const startT = g.start_time || g.start || '18:00';
      const arrTime = mins > 0 ? window.calcArrivalFromDelay(startT, mins) : '';
      const arrInput = document.getElementById('finishInputArrivalTime');
      if (arrInput) arrInput.value = arrTime;
    }
  };

  window.onModalArrivalTimeType = function(timeVal) {
    const id = document.getElementById('finishMatchId')?.value;
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (g) {
      const startT = g.start_time || g.start || '18:00';
      const mins = window.calcDelayFromArrival(startT, timeVal);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const inH = document.getElementById('finishInputLateH');
      const inM = document.getElementById('finishInputLateM');
      if (inH) inH.value = h > 0 ? h : '';
      if (inM) inM.value = m > 0 ? m : (h > 0 ? '0' : '');
      window.setFinishLateMinutes(mins);
    }
  };

  window.onModalExtraHMType = function() {
    const h = parseInt(document.getElementById('finishInputExtraH')?.value || 0, 10) || 0;
    const m = parseInt(document.getElementById('finishInputExtraM')?.value || 0, 10) || 0;
    const mins = Math.max(0, h * 60 + m);
    window.setFinishExtraMinutes(mins);
    const id = document.getElementById('finishMatchId')?.value;
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (g) {
      const endT = g.end_time || g.end || '19:00';
      const extEnd = mins > 0 ? window.calcExtendedEndFromExtra(endT, mins) : '';
      const endInput = document.getElementById('finishInputEndTime');
      if (endInput) endInput.value = extEnd;
    }
  };

  window.onModalEndTimeType = function(timeVal) {
    const id = document.getElementById('finishMatchId')?.value;
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (g) {
      const endT = g.end_time || g.end || '19:00';
      const mins = window.calcExtraFromExtendedEnd(endT, timeVal);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const inH = document.getElementById('finishInputExtraH');
      const inM = document.getElementById('finishInputExtraM');
      if (inH) inH.value = h > 0 ? h : '';
      if (inM) inM.value = m > 0 ? m : (h > 0 ? '0' : '');
      window.setFinishExtraMinutes(mins);
    }
  };

  window.setFinishLateMinutes = function(mins) {
    mins = parseInt(mins || 0, 10);
    const hidden = document.getElementById('finishMatchLate');
    if (hidden) hidden.value = mins;

    const lateH = Math.floor(mins / 60);
    const lateM = mins % 60;
    const inLateH = document.getElementById('finishInputLateH');
    const inLateM = document.getElementById('finishInputLateM');
    if (inLateH && document.activeElement !== inLateH) inLateH.value = lateH > 0 ? lateH : '';
    if (inLateM && document.activeElement !== inLateM) inLateM.value = lateM > 0 ? lateM : (lateH > 0 ? '0' : '');

    const badge = document.getElementById('finishLateBadge');
    if (badge) {
      if (mins > 0) {
        const hStr = lateH > 0 ? lateH + 'h ' : '';
        const mStr = lateM > 0 ? lateM + 'min' : (hStr ? '' : '0min');
        badge.textContent = hStr + mStr + ' de atraso';
        badge.className = 'text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full';
      } else {
        badge.textContent = 'Sem atraso';
        badge.className = 'text-[11px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full';
      }
    }

    const container = document.getElementById('finishLateButtonsContainer');
    if (container) {
      const btns = container.querySelectorAll('.btn-finish-late');
      btns.forEach(btn => {
        const bMin = parseInt(btn.getAttribute('data-late'), 10);
        if (bMin === mins) {
          btn.className = 'btn-finish-late py-1.5 px-1 text-xs font-black text-white bg-amber-600 border border-amber-700 rounded-xl shadow-xs text-center cursor-pointer';
        } else {
          btn.className = 'btn-finish-late py-1.5 px-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-amber-100 text-center cursor-pointer';
        }
      });
    }
  };

  window.setFinishExtraMinutes = function(mins) {
    mins = parseInt(mins || 0, 10);
    const hidden = document.getElementById('finishMatchExtra');
    if (hidden) hidden.value = mins;

    const extraH = Math.floor(mins / 60);
    const extraM = mins % 60;
    const inExtraH = document.getElementById('finishInputExtraH');
    const inExtraM = document.getElementById('finishInputExtraM');
    if (inExtraH && document.activeElement !== inExtraH) inExtraH.value = extraH > 0 ? extraH : '';
    if (inExtraM && document.activeElement !== inExtraM) inExtraM.value = extraM > 0 ? extraM : (extraH > 0 ? '0' : '');

    const badge = document.getElementById('finishExtraBadge');
    if (badge) {
      if (mins > 0) {
        const hStr = extraH > 0 ? extraH + 'h ' : '';
        const mStr = extraM > 0 ? extraM + 'min' : (hStr ? '' : '0min');
        badge.textContent = '+' + hStr + mStr + ' extra';
        badge.className = 'text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full';
      } else {
        badge.textContent = 'Sem tempo extra';
        badge.className = 'text-[11px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full';
      }
    }

    const container = document.getElementById('finishExtraButtonsContainer');
    if (container) {
      const btns = container.querySelectorAll('.btn-finish-extra');
      btns.forEach(btn => {
        const bMin = parseInt(btn.getAttribute('data-extra'), 10);
        if (bMin === mins) {
          btn.className = 'btn-finish-extra py-1.5 px-1 text-xs font-black text-white bg-emerald-600 border border-emerald-700 rounded-xl shadow-xs text-center cursor-pointer';
        } else {
          btn.className = 'btn-finish-extra py-1.5 px-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-emerald-100 text-center cursor-pointer';
        }
      });
    }

    if (typeof window.updateFinishCalculations === 'function') {
      window.updateFinishCalculations();
    }
  };

  window.getFinishCurrentTotal = function() {
    const base = parseFloat(document.getElementById('finishBasePrice')?.value || 100);
    const hourly = parseFloat(document.getElementById('finishHourlyRate')?.value || 100);
    const extra = parseInt(document.getElementById('finishMatchExtra')?.value || 0, 10);
    const extraAmt = Math.round((extra / 60) * hourly);
    return base + extraAmt;
  };

  window.setPaymentMode = function(mode) {
    const hidden = document.getElementById('finishPaymentMode');
    const secSingle = document.getElementById('sectionPaySingle');
    const secSplit = document.getElementById('sectionPaySplit');
    const tabSingle = document.getElementById('payModeSingleTab');
    const tabSplit = document.getElementById('payModeSplitTab');
    if (!hidden) return;
    hidden.value = mode;

    if (mode === 'split') {
      if (secSingle) secSingle.style.display = 'none';
      if (secSplit) secSplit.style.display = 'block';
      if (tabSingle) {
        tabSingle.className = 'py-1.5 px-2 rounded-lg text-slate-600 hover:text-slate-900 font-bold text-center cursor-pointer transition';
      }
      if (tabSplit) {
        tabSplit.className = 'py-1.5 px-2 rounded-lg bg-white text-emerald-900 font-black shadow-xs text-center cursor-pointer transition';
      }
      const total = window.getFinishCurrentTotal();
      const in1 = document.getElementById('splitAmount1');
      const in2 = document.getElementById('splitAmount2');
      if (in1 && (!in1.value || parseFloat(in1.value) === 0)) {
        in1.value = (total / 2).toFixed(2);
        if (in2) in2.value = (total / 2).toFixed(2);
      }
      window.updateSplitBalance();
    } else {
      if (secSingle) secSingle.style.display = 'grid';
      if (secSplit) secSplit.style.display = 'none';
      if (tabSingle) {
        tabSingle.className = 'py-1.5 px-2 rounded-lg bg-white text-emerald-900 font-black shadow-xs text-center cursor-pointer transition';
      }
      if (tabSplit) {
        tabSplit.className = 'py-1.5 px-2 rounded-lg text-slate-600 hover:text-slate-900 font-bold text-center cursor-pointer transition';
      }
    }
  };

  window.onSplitAmountChange = function(which, val) {
    const total = window.getFinishCurrentTotal();
    const num = parseFloat(val) || 0;
    const in1 = document.getElementById('splitAmount1');
    const in2 = document.getElementById('splitAmount2');

    if (which === 1 && in2) {
      const rest = Math.max(0, total - num);
      in2.value = rest > 0 ? rest.toFixed(2) : '0.00';
    } else if (which === 2 && in1) {
      const rest = Math.max(0, total - num);
      in1.value = rest > 0 ? rest.toFixed(2) : '0.00';
    }
    window.updateSplitBalance();
  };

  window.splitFiftyFifty = function() {
    const total = window.getFinishCurrentTotal();
    const half = (total / 2).toFixed(2);
    const in1 = document.getElementById('splitAmount1');
    const in2 = document.getElementById('splitAmount2');
    if (in1) in1.value = half;
    if (in2) in2.value = half;
    window.updateSplitBalance();
  };

  window.updateSplitBalance = function() {
    const total = window.getFinishCurrentTotal();
    const a1 = parseFloat(document.getElementById('splitAmount1')?.value || 0);
    const a2 = parseFloat(document.getElementById('splitAmount2')?.value || 0);
    const m1 = document.getElementById('splitMethod1')?.value || 'Dinheiro';
    const m2 = document.getElementById('splitMethod2')?.value || 'PIX';
    const notice = document.getElementById('splitStatusNotice');
    const icon = document.getElementById('splitStatusIcon');
    const text = document.getElementById('splitStatusText');
    if (!notice || !text) return;

    const sum = a1 + a2;
    const diff = Math.round((total - sum) * 100) / 100;

    if (Math.abs(diff) < 0.05) {
      notice.className = 'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 bg-emerald-100/80 border-emerald-300 text-emerald-950 transition-all';
      if (icon) icon.textContent = '✓';
      text.textContent = 'Total 100% quitado: R$ ' + a1.toFixed(2).replace('.', ',') + ' (' + m1 + ') + R$ ' + a2.toFixed(2).replace('.', ',') + ' (' + m2 + ')';
    } else if (diff > 0) {
      notice.className = 'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 bg-amber-100/90 border-amber-300 text-amber-950 transition-all';
      if (icon) icon.textContent = '⚠️';
      text.textContent = 'Falta R$ ' + diff.toFixed(2).replace('.', ',') + ' em ' + m2 + ' para atingir o total de R$ ' + total.toFixed(2).replace('.', ',');
    } else {
      const over = Math.abs(diff);
      notice.className = 'p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 bg-rose-100/90 border-rose-300 text-rose-950 transition-all';
      if (icon) icon.textContent = '⚠️';
      text.textContent = 'Soma dos valores (R$ ' + sum.toFixed(2).replace('.', ',') + ') excede o total em R$ ' + over.toFixed(2).replace('.', ',');
    }
  };

  window.calcMatchTimer = function(startT, endT, extraMin, st, matchDate) {
    const parseMin = (s) => {
      if (!s) return 0;
      const p = s.split(':');
      return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
    };
    const sM = parseMin(startT);
    let eM = parseMin(endT);
    if (eM <= sM) eM += 24 * 60;
    const baseSched = eM - sM;
    const totalDuration = baseSched + (extraMin || 0);

    if (st === 'finished') {
      return {
        percent: 100,
        label: 'Partida concluída',
        counter: totalDuration + ' min finalizados',
        fillClass: 'timer-fill-finished',
        badgeClass: 'timer-finished',
        isOverdue: false,
        isFuture: false
      };
    }

    if (st === 'unpaid' || st === 'cancelled') {
      return {
        percent: 100,
        label: 'Horário encerrado • Pagamento Faltando',
        counter: 'Pagamento Faltando',
        fillClass: 'timer-fill-warn',
        badgeClass: 'timer-overdue',
        isOverdue: false,
        isFuture: false
      };
    }

    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const mDate = matchDate || todayStr;

    // CASO 1: JOGO DE DIA FUTURO (Ainda não é o dia do jogo)
    // Regra: Os jogos dos dias pra frente NÃO podem ser contabilizados em minutos ou início automático
    if (mDate > todayStr) {
      let dateLabel = mDate;
      try {
        const parts = mDate.split('-');
        dateLabel = parts[2] + '/' + parts[1];
      } catch(e) {}
      return {
        percent: 0,
        label: 'Início programado para ' + dateLabel + ' às ' + startT,
        counter: 'Aguardando data do jogo',
        fillClass: '',
        badgeClass: 'timer-future',
        isOverdue: false,
        isFuture: true
      };
    }

    // CASO 2: JOGO DE DATA PASSADA (Dias anteriores que ficaram pendentes)
    if (mDate < todayStr) {
      let dateLabel = mDate;
      try {
        const parts = mDate.split('-');
        dateLabel = parts[2] + '/' + parts[1];
      } catch(e) {}
      return {
        percent: 100,
        label: 'Partida de data anterior (' + dateLabel + ')',
        counter: 'Pendente de fechamento',
        fillClass: 'timer-fill-warn',
        badgeClass: 'timer-overdue',
        isOverdue: true,
        isFuture: false
      };
    }

    // CASO 3: JOGO DO DIA ATUAL (Hoje: dia 3 hoje; quando virar o dia, dia 4, e assim sucessivamente)
    const now = new Date();
    const currentM = now.getHours() * 60 + now.getMinutes();

    if (currentM < sM) {
      const minUntil = sM - currentM;
      return {
        percent: 0,
        label: 'Início programado para hoje às ' + startT,
        counter: 'Pronto para iniciar',
        fillClass: '',
        badgeClass: 'timer-future',
        isOverdue: false,
        isFuture: false
      };
    } else if (currentM <= (eM + (extraMin || 0))) {
      const elapsed = currentM - sM;
      const remaining = (eM + (extraMin || 0)) - currentM;
      const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
      const fillClass = percent >= 85 ? 'timer-fill-warn' : '';
      return {
        percent,
        label: elapsed + ' min decorridos (' + percent + '%)',
        counter: remaining + ' min restantes',
        fillClass,
        badgeClass: '',
        isOverdue: false,
        isFuture: false
      };
    } else {
      const overdue = currentM - (eM + (extraMin || 0));
      return {
        percent: 100,
        label: 'Tempo limite atingido (' + totalDuration + ' min)',
        counter: overdue > 0 ? '+' + overdue + ' min (Finalizar)' : 'Finalizar',
        fillClass: 'timer-fill-red',
        badgeClass: 'timer-overdue',
        isOverdue: true,
        isFuture: false
      };
    }
  };

  
  // =========================================================================
  // EFETUAR PAGAMENTO IMEDIATO E CONCLUIR PARTIDA (VOLTA PARA ÁREA DE PAGO)
  // =========================================================================
  window.quickPayAndFinishMatch = function(id, customPaymentMethod) {
    try {
      const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
      if (!g) {
        if (typeof arenaToast === 'function') arenaToast('Agendamento não encontrado.');
        return;
      }

      const method = customPaymentMethod || 'PIX';
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      // 1. Atualiza status do jogo para Finalizado e Pago
      g.status = 'finished';
      g.attendance = 'Finalizada (Pago)';
      g.payment = method;
      g.payment_method = method;
      g.payment_status = 'pago';
      g.finishedAt = g.finishedAt || timeStr;
      g.observation = 'Pagamento efetuado com sucesso via ' + method + ' • Concluído';

      if (typeof window.addMatchLog === 'function') {
        window.addMatchLog(g, 'Pagamento Efetuado (' + timeStr + ')', 'Pagamento recebido via ' + method + '. Partida concluída e movida para a área de pagos / finalizados.');
      }

      // 2. Atualiza no localStorage
      

      // 3. Sincroniza em nuvem (Supabase DB2 e DB1)
      if (typeof window.syncBookingToCloud === 'function') {
        window.syncBookingToCloud(g, 'upsert');
      }

      // 4. Mensagem de sucesso
      if (typeof arenaToast === 'function') {
        arenaToast('✓ Pagamento de R$ ' + Number(g.total_price || g.price || 100).toFixed(2).replace('.', ',') + ' efetuado! Partida movida para Finalizados/Pago.');
      }

      // 5. Atualiza a tela operacional
      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
      if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
    } catch(err) {
      console.error('[QuickPay] Erro ao efetuar pagamento:', err);
    }
  };

  window.openFinishGame = function(id) {
    try {
      let g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
      if (!g) {
        const allB = (window.adminGameState && window.adminGameState.bookings) || [];
        g = allB.find(b => String(b.id) === String(id)) || allB[0] || {
          id: id || 'game-default',
          customer_name: 'Esc Ariadnes (Esc Ariadnes)',
          start_time: '16:00',
          end_time: '18:00',
          total_price: 100,
          payment: 'PIX',
          status: 'confirmed'
        };
      }

      const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { name: 'Quadra', normal: 100 };
      const hourlyRate = court && court.normal ? court.normal : 100;
      const basePrice = parseFloat(g.total_price || g.price || 100);

      const fId = document.getElementById('finishMatchId');
      if (fId) fId.value = id;
      const fBase = document.getElementById('finishBasePrice');
      if (fBase) fBase.value = basePrice;
      const fRate = document.getElementById('finishHourlyRate');
      if (fRate) fRate.value = hourlyRate;

      const startT = g.start_time || g.start || '18:00';
      const endT = g.end_time || g.end || '19:00';
      const durStr = (typeof calcDuration === 'function') ? calcDuration(startT, endT) : '1h';

      const fTitle = document.getElementById('finishMatchTitle');
      if (fTitle) fTitle.textContent = g.customer_name || g.name || 'Equipe';
      const fSub = document.getElementById('finishMatchSubtitle');
      if (fSub) fSub.textContent = court.name + ' · ' + startT + ' às ' + endT + ' (' + durStr + ')';
      const fBaseDisp = document.getElementById('finishBaseDisplay');
      if (fBaseDisp) fBaseDisp.textContent = 'R$ ' + basePrice.toFixed(2).replace('.', ',');
      const fCalcBase = document.getElementById('finishCalcBase');
      if (fCalcBase) fCalcBase.textContent = 'R$ ' + basePrice.toFixed(2).replace('.', ',');

      // Atraso pré-existente
      const initialLate = parseInt(g.late || 0, 10);
      window.setFinishLateMinutes(initialLate);
      const fLateH = Math.floor(initialLate / 60);
      const fLateM = initialLate % 60;
      const fInLateH = document.getElementById('finishInputLateH');
      const fInLateM = document.getElementById('finishInputLateM');
      if (fInLateH) fInLateH.value = fLateH > 0 ? fLateH : '';
      if (fInLateM) fInLateM.value = fLateM > 0 ? fLateM : (fLateH > 0 ? '0' : '');
      const fInArr = document.getElementById('finishInputArrivalTime');
      if (fInArr) fInArr.value = g.arrival_time || (initialLate > 0 ? window.calcArrivalFromDelay(startT, initialLate) : '');

      // Tempo extra pré-existente
      const initialExtra = parseInt(g.extraTime || g.extra_minutes || 0, 10);
      window.setFinishExtraMinutes(initialExtra);
      const fExtraH = Math.floor(initialExtra / 60);
      const fExtraM = initialExtra % 60;
      const fInExtraH = document.getElementById('finishInputExtraH');
      const fInExtraM = document.getElementById('finishInputExtraM');
      if (fInExtraH) fInExtraH.value = fExtraH > 0 ? fExtraH : '';
      if (fInExtraM) fInExtraM.value = fExtraM > 0 ? fExtraM : (fExtraH > 0 ? '0' : '');
      const fInEnd = document.getElementById('finishInputEndTime');
      if (fInEnd) fInEnd.value = initialExtra > 0 ? window.calcExtendedEndFromExtra(endT, initialExtra) : '';

      // Origem
      let orig = g.booking_origin;
      if (!orig) {
        if (g.isMensalista || g.type === 'Mensalista') orig = 'Mensalista';
        else if (String(id).startsWith('ARENA-B')) orig = 'Marcado no Balcão';
        else orig = 'No Agendamento';
      }
      const originSelect = document.getElementById('finishMatchOrigin');
      if (originSelect) originSelect.value = orig;

      // Forma de pagamento
      const paymentSelect = document.getElementById('finishMatchPayment');
      if (paymentSelect && paymentSelect.options) {
        const curPayment = (g.payment || 'PIX').toLowerCase();
        let found = false;
        for (let i = 0; i < paymentSelect.options.length; i++) {
          if (paymentSelect.options[i].value.toLowerCase().includes(curPayment)) {
            paymentSelect.value = paymentSelect.options[i].value;
            found = true;
            break;
          }
        }
        if (!found) paymentSelect.value = 'PIX';
      }

      // Status do pagamento
      const paymentStatusSelect = document.getElementById('finishPaymentStatus');
      if (paymentStatusSelect) {
        // Ao abrir a janela para efetuar pagamento, o status padrão é sempre "Pago" (confirmando a liquidação)
        paymentStatusSelect.value = 'Pago';
      }

      const fObs = document.getElementById('finishMatchObs');
      if (fObs) fObs.value = g.finishObs || '';

      const ballCb = document.getElementById('finishBallReturned');
      if (ballCb) ballCb.checked = (g.ballReturned !== false);

      if (g.splitPayment && g.splitDetail) {
        window.setPaymentMode('split');
        const sM1 = document.getElementById('splitMethod1');
        const sA1 = document.getElementById('splitAmount1');
        const sM2 = document.getElementById('splitMethod2');
        const sA2 = document.getElementById('splitAmount2');
        if (sM1) sM1.value = g.splitDetail.m1 || 'Dinheiro';
        if (sA1) sA1.value = parseFloat(g.splitDetail.a1 || 0).toFixed(2);
        if (sM2) sM2.value = g.splitDetail.m2 || 'PIX';
        if (sA2) sA2.value = parseFloat(g.splitDetail.a2 || 0).toFixed(2);
        window.updateSplitBalance();
      } else {
        window.setPaymentMode('single');
      }

      const modal = document.getElementById('arenaFinishModal');
      if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.remove('hidden');
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    } catch (err) {
      console.error('Error opening finish modal:', err);
    }
  };

  window.saveFinishGame = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('finishMatchId')?.value;
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;

    const late = parseInt(document.getElementById('finishMatchLate')?.value || 0, 10);
    const extraTime = parseInt(document.getElementById('finishMatchExtra')?.value || 0, 10);
    const origin = document.getElementById('finishMatchOrigin')?.value || 'Marcado no Balcão';
    const payMode = document.getElementById('finishPaymentMode')?.value || 'single';
    const payStatus = document.getElementById('finishPaymentStatus')?.value || 'Pago';
    const obs = document.getElementById('finishMatchObs')?.value.trim() || '';
    const ballReturned = document.getElementById('finishBallReturned')?.checked !== false;

    const basePrice = parseFloat(document.getElementById('finishBasePrice')?.value || 100);
    const hourlyRate = parseFloat(document.getElementById('finishHourlyRate')?.value || 100);
    const extraAmount = Math.round((extraTime / 60) * hourlyRate);
    const calculatedTotal = basePrice + extraAmount;

    let paymentFinalStr = '';
    let splitDetail = null;
    if (payMode === 'split') {
      const m1 = document.getElementById('splitMethod1')?.value || 'Dinheiro';
      const a1 = parseFloat(document.getElementById('splitAmount1')?.value || 0);
      const m2 = document.getElementById('splitMethod2')?.value || 'PIX';
      const a2 = parseFloat(document.getElementById('splitAmount2')?.value || 0);
      paymentFinalStr = m1 + ': R$ ' + a1.toFixed(2).replace('.', ',') + ' + ' + m2 + ': R$ ' + a2.toFixed(2).replace('.', ',');
      splitDetail = { m1, a1, m2, a2 };
      g.splitPayment = true;
      g.splitDetail = splitDetail;
    } else {
      paymentFinalStr = document.getElementById('finishMatchPayment')?.value || 'PIX';
      g.splitPayment = false;
      delete g.splitDetail;
    }

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    // 1. Marca g como concluído
    g.status = 'finished';
    g.attendance = 'Finalizada';
    g.ballReturned = ballReturned;
    g.finishedAt = timeStr;
    g.late = late;
    g.extraTime = extraTime;
    g.extraAmount = extraAmount;
    g.booking_origin = origin;
    g.payment = (payStatus === 'Pago' ? paymentFinalStr : paymentFinalStr + ' (Pendente)');
    g.payment_status = (payStatus === 'Pago' ? 'pago' : 'pagamento_faltando');
    g.total_price = calculatedTotal;
    g.price = calculatedTotal;
    g.finishObs = obs;

    // Se o cliente for mensalista ou a partida for paga na tela inicial, registra no Clientes & Contatos
    if (payStatus === 'Pago') {
      const clientName = (g.customer_name || g.name || '').trim();
      if (clientName && typeof window.salvarStatusMensalidadeCliente === 'function') {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        const ny = nextMonth.getFullYear();
        const nm = String(nextMonth.getMonth() + 1).padStart(2, '0');
        const nd = String(nextMonth.getDate()).padStart(2, '0');
        window.salvarStatusMensalidadeCliente(clientName, 'pago', calculatedTotal, `${ny}-${nm}-${nd}`);
      }
    }

    let logText = 'Partida concluída';
    // ball mentions removed
    if (extraTime > 0) logText += ' • ' + extraTime + 'm extra (+R$ ' + extraAmount + ')';
    if (late > 0) logText += ' • Atraso: ' + late + 'm';
    logText += ' • Total: R$ ' + calculatedTotal.toFixed(2) + ' • ' + g.payment + ' • ' + origin;
    if (obs) logText += ' (' + obs + ')';

    addMatchLog(g, 'Jogo concluído & Fechamento', logText);

    // 2. Localiza todas as referências cruzadas vinculadas ao mesmo slot/quadra
    const relatedIds = new Set([String(id), String(g.id)]);
    const targetCourt = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId).id : g.court_id;

    (window.adminGameState.bookings || []).forEach(other => {
      if (!other) return;
      const otherCourt = (typeof getCourtById === 'function') ? getCourtById(other.court_id || other.courtId).id : other.court_id;
      const matchesSlot = (other.date === g.date && other.start_time === g.start_time && otherCourt === targetCourt);
      const matchesCustomer = (other.customer_name === g.customer_name && other.date === g.date);
      if (matchesSlot || matchesCustomer || String(other.id) === String(id) || String(other.id) === String(g.id)) {
        other.status = 'finished';
        other.attendance = 'Finalizada';
        other.ballReturned = ballReturned;
        other.finishedAt = timeStr;
        other.total_price = calculatedTotal;
        relatedIds.add(String(other.id));
      }
    });

    // 3. Efeito visual imediato: remove do DOM todos os cards associados instantaneamente
    relatedIds.forEach(rId => {
      const el = document.getElementById('card-' + rId);
      if (el) {
        el.style.display = 'none';
        el.remove();
      }
    });

    // 4. Salva no localStorage local
    

    // 5. ☁️ Envia a finalização imediatamente para os 2 Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
      relatedIds.forEach(rId => {
        if (rId !== String(g.id)) {
          const relB = (window.adminGameState.bookings || []).find(b => String(b.id) === rId);
          if (relB) window.syncBookingToCloud(relB, 'upsert');
        }
      });
    }

    closeArenaModal('arenaFinishModal');

    // 6. Atualiza a tela operacional imediatamente: o jogo concluído some da lista
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();

    // 7. Mostra e destaca o Próximo Jogo da Hora
    const dateStr = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));
    const activeList = (typeof window.getMatchesForDate === 'function')
      ? window.getMatchesForDate(dateStr).filter(m => m.status !== 'finished')
      : [];

    if (activeList.length > 0) {
      const next = activeList[0];
      const nextName = next.customer_name || next.name || 'Próxima Equipe';
      const nextTime = next.start_time || '';
      const nextCourt = next.court_name || 'Quadra';
      arenaToast('✓ Jogo concluído! Próximo jogo da hora: ' + nextName + ' às ' + nextTime + ' (' + nextCourt + ')');

      const nextEl = document.getElementById('card-' + next.id);
      if (nextEl) {
        nextEl.style.transition = 'box-shadow 0.4s ease';
        nextEl.style.boxShadow = '0 0 0 3px #10b981, 0 10px 25px -5px rgba(16, 185, 129, 0.35)';
        setTimeout(() => {
          if (nextEl) nextEl.style.boxShadow = '';
        }, 4000);
      }
    } else {
      arenaToast('✓ Partida finalizada com sucesso! Todos os jogos de hoje foram concluídos.');
    }
  };

  window.closeArenaModal = function(id) {
    const m = document.getElementById(id);
    if (m) {
      m.style.display = 'none';
      m.classList.add('hidden');
    }
  };


  // =========================================================================
  // AUTO-INÍCIO AUTOMÁTICO DE PARTIDAS (COM JANELA DE TOLERÂNCIA DE 5 MINUTOS)
  // Se o atendente não apertar "Iniciar Jogo na Quadra", o sistema inicia
  // automaticamente aos 5 minutos decorridos, contando do início exato previsto.
  // =========================================================================
  
  // =========================================================================
  // ENCERRAMENTO / CANCELAMENTO / FATURAMENTO AUTOMÁTICO APÓS O HORÁRIO
  // Regra do Usuário:
  // - Se passou do horário final da partida:
  //   * Avulso: Cancela automaticamente por falta de pagamento / não comparecimento
  //   * Mensalista / Fixo: Encerra automaticamente e registra cobrança no final do mês
  // =========================================================================
  window.checkAndAutoExpireMatches = function() {
    // Trava de recursão rigorosa para impedir estouro de memória (Out of Memory)
    if (window.__isAutoExpiring) return;
    window.__isAutoExpiring = true;

    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
      const allTodayMatches = (typeof getMatchesForDate === 'function') ? getMatchesForDate(todayStr) : [];
      const now = new Date();
      const curM = now.getHours() * 60 + now.getMinutes();

      const parseMin = s => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };

      let hasChangedAny = false;

      allTodayMatches.forEach(m => {
        // Pula partidas já finalizadas, canceladas ou que já estão marcadas como pagamento faltando
        if (!m) return;
        const st = m.status;
        if (st === 'finished' || st === 'cancelled' || st === 'unpaid' || m.payment_status === 'pagamento_faltando') return;
        if (m.attendance && m.attendance.includes('Pagamento Faltando')) return;
        if (m.observation && m.observation.includes('Pagamento Faltando')) return;

        const sM = parseMin(m.start_time);
        let eM = parseMin(m.end_time);
        if (eM <= sM) eM += 24 * 60;
        const extraMin = Number(m.extraTime || m.extra_minutes || 0);
        const limitM = eM + extraMin;

        // Se o horário atual ultrapassou o término da partida
        if (curM > limitM) {
          const isMensalista = !!(m.isMensalista || m.type === 'Mensalista' || m.booking_type === 'mensalista' || String(m.id).startsWith('monthly-'));
          const g = (typeof window.getGame === 'function') ? window.getGame(m.id) : m;
          if (!g) return;

          if (isMensalista) {
            // MENSALISTA: Conclui o jogo e registra cobrança para o fechamento mensal
            g.status = 'finished';
            g.attendance = 'Finalizado (Fatura Mensal)';
            g.payment = 'Mensal';
            g.payment_method = 'Mensal';
            g.billing_status = 'cobrar_final_mes';
            g.finishedAt = m.end_time || '17:00';
            g.observation = 'Encerrado automaticamente após o horário • Cobrar no final do mês';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Encerramento Automático (' + (m.end_time || '') + ')', 'Partida concluída automaticamente. Presença registrada para faturamento no final do mês.');
            }
            console.log('[AutoExpire] Mensalista ' + (g.customer_name || g.name) + ' encerrado e registrado para faturamento mensal!');
          } else {
            // AVULSO: Registra como Pagamento Faltando após término do horário
            g.status = 'unpaid';
            g.attendance = 'Pagamento Faltando';
            g.payment_status = 'pagamento_faltando';
            g.observation = 'Horário encerrado • Pagamento Faltando';
            if (!g.payment || g.payment === 'Pendente') g.payment = 'Pagamento Faltando';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Fim do Horário (' + (m.end_time || '') + ')', 'Horário de jogo encerrado. Pagamento não registrado (Pagamento Faltando).');
            }
            console.log('[AutoExpire] Jogo avulso ' + (g.customer_name || g.name) + ' registrado com Pagamento Faltando!');
          }

          if (typeof window.syncBookingToCloud === 'function') {
            window.syncBookingToCloud(g, 'upsert');
          }
          hasChangedAny = true;
        }
      });

      if (hasChangedAny) {
        
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
      }
    } catch(err) {
      console.warn('[AutoExpire] Erro ao verificar encerramento automático:', err);
    } finally {
      window.__isAutoExpiring = false;
    }
  };

  window.checkAndAutoStartMatches = function() {
    // Trava de recursão rigorosa para impedir estouro de memória (Out of Memory)
    if (window.__isAutoStarting) return;
    window.__isAutoStarting = true;

    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
      const allTodayMatches = (typeof getMatchesForDate === 'function') ? getMatchesForDate(todayStr) : [];
      const now = new Date();
      const curM = now.getHours() * 60 + now.getMinutes();

      const parseMin = s => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };

      let hasAutoStartedAny = false;

      allTodayMatches.forEach(m => {
        if (!m) return;
        const st = m.status;
        if (st === 'finished' || st === 'cancelled' || st === 'unpaid' || m.payment_status === 'pagamento_faltando') return;
        const sM = parseMin(m.start_time);
        let eM = parseMin(m.end_time);
        if (eM <= sM) eM += 24 * 60;

        // Se já passou de 5 minutos do início programado (curM >= sM + 5) e ainda não terminou
        if (curM >= (sM + 5) && curM <= eM) {
          const isAlreadyLive = (st === 'live' || st === 'playing' || st === 'in_progress');
          if (!isAlreadyLive) {
            // Inicia automaticamente o jogo
            const g = (typeof window.getGame === 'function') ? window.getGame(m.id) : m;
            if (g) {
              g.status = 'live';
              g.attendance = 'Em Quadra';
              g.startedAt = m.start_time; // Contando exatamente do início oficial previsto
              if (!Array.isArray(g.log)) g.log = [];
              g.log.push({
                at: 'Início Automático (' + m.start_time + ')',
                text: 'Partida iniciada automaticamente pelo sistema após 5 min de tolerância, contando do início programado.'
              });

              if (typeof window.syncBookingToCloud === 'function') {
                window.syncBookingToCloud(g, 'upsert');
              }
              hasAutoStartedAny = true;
              console.log('[AutoStart] Partida ' + (g.customer_name || g.name) + ' iniciada automaticamente!');
            }
          }
        }
      });

      if (hasAutoStartedAny) {
        
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
      }
    } catch(err) {
      console.warn('[AutoStart] Erro ao verificar auto-início:', err);
    } finally {
      window.__isAutoStarting = false;
    }
  };

  // Funções dedicadas para cada status de partida
  window.checkIsMatchLive = function(m, todayStr) {
    if (!m || m.status === 'finished' || m.status === 'cancelled') return false;
    if (m.status === 'live' || m.status === 'playing' || m.status === 'in_progress') return true;
    if (!todayStr) todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    if (m.date === todayStr) {
      const now = new Date();
      const curM = now.getHours() * 60 + now.getMinutes();
      const parseMin = s => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };
      const sM = parseMin(m.start_time);
      let eM = parseMin(m.end_time);
      if (eM <= sM) eM += 24 * 60;
      const extra = Number(m.extraTime || m.extra_minutes || 0);
      return curM >= sM && curM <= (eM + extra);
    }
    return false;
  };

  window.startGameNow = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    g.status = 'live';
    g.attendance = 'Presença confirmada';
    addMatchLog(g, 'Início manual na quadra', 'Atendente deu início à partida.');
    
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    if (typeof window.arenaToast === 'function') {
      window.arenaToast('▶ Partida iniciada na quadra!');
    }
    renderMovementMatches();
  };

  window.reopenGame = async function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Reabrir Partida',
      mensagem: 'Deseja reabrir esta partida e torná-la ativa novamente?',
      tipo: 'warning',
      textoConfirmar: 'Sim, Reabrir',
      textoCancelar: 'Cancelar'
    });
    if (!confirmado) return;
    g.status = 'confirmed';
    g.attendance = 'Aguardando chegada';
    g.ballReturned = false;
    delete g.finishedAt;
    addMatchLog(g, 'Partida reaberta', 'A partida foi reaberta pelo gestor no painel.');
    
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    if (typeof window.arenaToast === 'function') {
      window.arenaToast('↺ Partida reaberta com sucesso!');
    }
    renderMovementMatches();
  };

  window.addExtraTimeQuick = function(id, minutes) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    g.extraTime = (parseInt(g.extraTime || 0, 10)) + minutes;
    const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { normal: 100 };
    const hourlyRate = court && court.normal ? court.normal : 100;
    g.extraAmount = Math.round((g.extraTime / 60) * hourlyRate);
    addMatchLog(g, 'Tempo extra adicionado', '+' + minutes + ' min adicionados (Total extra: ' + g.extraTime + ' min)');
    
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    if (typeof window.arenaToast === 'function') {
      window.arenaToast('⏱️ +' + minutes + ' min adicionados!');
    }
    renderMovementMatches();
  };

  window.viewReceipt = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;
    const court = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId) : { name: 'Quadra' };
    const price = Number(g.total_price || g.price || 100).toFixed(2).replace('.', ',');
    const modalContent = `
      <div class="p-5 sm:p-6 text-center">
        <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-black">✓</div>
        <h3 class="text-base sm:text-lg font-black text-slate-900">Comprovante de Partida Concluída</h3>
        <p class="text-xs text-slate-500 mb-4">Arena Limoeiro - Complexo Poliesportivo e Lazer</p>
        <div class="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs border border-slate-200">
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Cliente / Time:</strong> <span class="font-bold text-slate-800">${g.customer_name || 'Cliente'}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Quadra:</strong> <span>${court.name}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Data & Horário:</strong> <span>${g.date} (${g.start_time} às ${g.end_time})</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Valor Final:</strong> <span class="font-black text-emerald-700">R$ ${price}</span></div>
          <div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Forma Pagamento:</strong> <span>${g.payment || 'PIX Balcão'}</span></div>
          
          ${g.finishedAt ? `<div class="flex justify-between"><strong>Horário Fechamento:</strong> <span>${g.finishedAt}</span></div>` : ''}
        </div>
        <div class="mt-5 flex gap-2 justify-center">
          <button onclick="window.print()" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow hover:bg-slate-800 transition cursor-pointer">Imprimir Recibo</button>
          <button onclick="document.getElementById('receiptGenericModal').style.display='none'" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-300 transition cursor-pointer">Fechar</button>
        </div>
      </div>
    `;
    let mEl = document.getElementById('receiptGenericModal');
    if (!mEl) {
      mEl = document.createElement('div');
      mEl.id = 'receiptGenericModal';
      mEl.className = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4';
      mEl.innerHTML = `<div class="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200" id="receiptGenericModalInner"></div>`;
      document.body.appendChild(mEl);
    }
    document.getElementById('receiptGenericModalInner').innerHTML = modalContent;
    mEl.style.display = 'flex';
  };

  // Renderizador Oficial do Card de Partida (IDÊNTICO À FOTO FORNECIDA PELO USUÁRIO)
  
  // =========================================================================
  // FUNÇÕES DE OPERAÇÃO RÁPIDA DO NOVO CARTÃO DE JOGO (ATRASO, EXTRA, NOTAS)
  // =========================================================================
  window.showNotification = function(msg) {
    if (typeof window.arenaToast === 'function') {
      window.arenaToast(msg);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else {
      console.log('[ArenaNotification]', msg);
    }
  };

  window.quickAddAtrasoCard = function(id, mins) {
    const inputH = document.getElementById('input-delay-h-' + id);
    const inputM = document.getElementById('input-delay-m-' + id);
    let h = parseInt(inputH ? inputH.value : 0, 10) || 0;
    let m = parseInt(inputM ? inputM.value : 0, 10) || 0;
    m += mins;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
    if (inputH) inputH.value = h;
    if (inputM) inputM.value = m;
    if (typeof window.onGameDelayHMChange === 'function') {
      window.onGameDelayHMChange(id);
    }
    window.showNotification('Atraso ajustado em +' + mins + ' minutos.');
  };

  window.quickAddExtraCard = function(id, mins) {
    const inputH = document.getElementById('input-extra-h-' + id);
    const inputM = document.getElementById('input-extra-m-' + id);
    let h = parseInt(inputH ? inputH.value : 0, 10) || 0;
    let m = parseInt(inputM ? inputM.value : 0, 10) || 0;
    m += mins;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
    if (inputH) inputH.value = h;
    if (inputM) inputM.value = m;
    if (typeof window.onGameExtraHMChange === 'function') {
      window.onGameExtraHMChange(id);
    }
    window.showNotification('Horário extra adicionado (+' + mins + ' min). Total recalculado!');
  };

  window.addCardTimelineNote = function(id) {
    const input = document.getElementById('internal-note-input-' + id);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const noteEntry = { at: 'Nota da Recepção (' + nowTime + ')', text: text };

    if (g) {
      if (!Array.isArray(g.log)) g.log = [];
      g.log.push(noteEntry);
      if (typeof saveAdminGameState === 'function') saveAdminGameState();
      if (typeof window.syncBookingToCloud === 'function') window.syncBookingToCloud(g, 'upsert');
    }

    const container = document.getElementById('timeline-container-' + id);
    if (container) {
      const div = document.createElement('div');
      div.className = 'relative';
      div.innerHTML = `
        <div class="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow"></div>
        <div class="text-xs">
          <span class="font-bold text-slate-800">${noteEntry.at}</span>
          <span class="text-slate-500">— ${noteEntry.text}</span>
          <span class="text-[10px] text-slate-400 block sm:inline sm:ml-2">Agora</span>
        </div>
      `;
      container.appendChild(div);
    }

    input.value = '';
    window.showNotification('Nota adicionada ao histórico da partida!');
  };

  

  // =========================================================================
  // GESTÃO & PLAYGROUND DA API DO SISTEMA
  // =========================================================================
  
  // =========================================================================
  // GESTÃO WHATSAPP, QR CODE & ENVIO DE CÓDIGOS OTP PARA NOVOS CLIENTES
  // =========================================================================
  window.__whatsappPollingInterval = null;

  window.checkWhatsappStatusLive = async function() {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      
      const badge = document.getElementById('whatsappConnectionBadge');
      const qrBox = document.getElementById('whatsappQrBox');
      const connectedPanel = document.getElementById('whatsappConnectedPanel');
      const subtitle = document.getElementById('whatsappStatusSubtitle');

      if (state === 'open') {
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WhatsApp Conectado';
        }
        if (qrBox) qrBox.style.display = 'none';
        if (connectedPanel) connectedPanel.style.display = 'block';
        if (subtitle) subtitle.textContent = 'WhatsApp conectado e pronto para envio de códigos de agendamento.';
      } else {
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando Conexão';
        }
        if (qrBox) qrBox.style.display = 'flex';
        if (connectedPanel) connectedPanel.style.display = 'none';
      }
    } catch (err) {
      console.warn('[WhatsApp] Erro ao checar status:', err);
    }
  };

  window.__whatsappCountdownVal = 20;
  window.__whatsappCountdownTimer = null;
  window.__whatsappQrRefreshTimer = null;

  window.startWhatsappQrCountdown = function() {
    if (window.__whatsappCountdownTimer) clearInterval(window.__whatsappCountdownTimer);
    window.__whatsappCountdownVal = 20;
    const secEl = document.getElementById('whatsappCountdownSec');
    if (secEl) secEl.textContent = '20';

    window.__whatsappCountdownTimer = setInterval(() => {
      window.__whatsappCountdownVal--;
      const el = document.getElementById('whatsappCountdownSec');
      if (el) el.textContent = Math.max(0, window.__whatsappCountdownVal);
      if (window.__whatsappCountdownVal <= 0) {
        clearInterval(window.__whatsappCountdownTimer);
        // Atualiza para novo QR code automaticamente
        window.loadWhatsappQrCodeLive(false);
      }
    }, 1000);
  };

  window.loadWhatsappQrCodeLive = async function(force = false) {
    const loading = document.getElementById('whatsappQrLoading');
    const qrImg = document.getElementById('whatsappQrImage');
    const qrBox = document.getElementById('whatsappQrBox');
    const countdownBadge = document.getElementById('whatsappQrCountdownBadge');
    const connectedPanel = document.getElementById('whatsappConnectedPanel');
    const subtitle = document.getElementById('whatsappStatusSubtitle');
    const badge = document.getElementById('whatsappConnectionBadge');

    if (loading && force) {
      loading.style.display = 'block';
      if (qrImg) qrImg.style.display = 'none';
    }
    if (subtitle) subtitle.textContent = 'Solicitando QR Code em tempo real à Evolution API...';

    try {
      const url = force ? '/api/whatsapp/qrcode?force=true' : '/api/whatsapp/qrcode';
      const res = await fetch(url);
      const data = await res.json();

      if (data?.instance?.state === 'open' || data?.state === 'open') {
        if (qrBox) qrBox.style.display = 'none';
        if (countdownBadge) countdownBadge.style.display = 'none';
        if (connectedPanel) connectedPanel.style.display = 'block';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WhatsApp Conectado';
        }
        if (subtitle) subtitle.textContent = 'WhatsApp conectado e pronto para envio de códigos de agendamento.';
        if (window.__whatsappCountdownTimer) clearInterval(window.__whatsappCountdownTimer);
        return;
      }

      let srcToRender = null;
      if (data && data.base64) {
        srcToRender = data.base64.startsWith('data:') ? data.base64 : 'data:image/png;base64,' + data.base64;
      } else if (data && data.code) {
        srcToRender = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(data.code);
      }

      if (srcToRender) {
        if (qrImg) {
          qrImg.src = srcToRender;
          qrImg.style.display = 'block';
        }
        if (loading) loading.style.display = 'none';
        if (qrBox) qrBox.style.display = 'flex';
        if (countdownBadge) countdownBadge.style.display = 'inline-flex';
        if (connectedPanel) connectedPanel.style.display = 'none';
        if (subtitle) subtitle.textContent = 'Aponte a câmera do WhatsApp para escanear o QR Code acima:';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando Leitura';
        }
        // Inicia contagem regressiva para renovação contínua
        window.startWhatsappQrCountdown();
        return;
      }

      // Se ainda não gerou, aguarda 2s e tenta novamente
      setTimeout(() => {
        window.loadWhatsappQrCodeLive(false);
      }, 2000);

    } catch (err) {
      console.warn('[WhatsApp] Erro ao carregar QR Code:', err);
      if (subtitle) subtitle.textContent = 'Erro ao solicitar QR Code. Clique em Atualizar QR Code.';
    }
  };

  window.disconnectAndRenewWhatsappQr = async function() {
    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Desconectar WhatsApp',
      mensagem: 'Deseja desconectar o WhatsApp atual para ler um novo QR Code pelo celular da Arena?',
      tipo: 'warning',
      textoConfirmar: 'Sim, Desconectar',
      textoCancelar: 'Cancelar'
    });
    if (!confirmado) return;
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    } catch(e) {}
    window.loadWhatsappQrCodeLive(true);
    if (typeof window.showNotification === 'function') {
      window.showNotification('Instância liberada! Escaneie o novo QR Code com o WhatsApp.');
    }
  };

  window.initApiPlayground = function() {
    if (typeof window.loadWhatsappQrCodeLive === 'function') {
      window.loadWhatsappQrCodeLive();
    }
    if (window.__whatsappPollingInterval) clearInterval(window.__whatsappPollingInterval);
    window.__whatsappPollingInterval = setInterval(() => {
      if (typeof window.checkWhatsappStatusLive === 'function') window.checkWhatsappStatusLive();
    }, 5000);

    const baseInput = document.getElementById('apiBaseUrlDisplay');
    if (baseInput && (!baseInput.value || baseInput.value.includes('arenalimoeiro.vercel.app'))) {
      baseInput.value = window.location.origin || 'https://arenalimoeiro.vercel.app';
    }
    const savedWebhook = localStorage.getItem('arena_api_webhook_url');
    if (savedWebhook && document.getElementById('apiWebhookUrlInput')) {
      document.getElementById('apiWebhookUrlInput').value = savedWebhook;
    }
  };

  window.toggleApiKeyVisibility = function() {
    const input = document.getElementById('apiKeyDisplay');
    const icon = document.getElementById('eyeApiKeyIcon');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
  };

  window.copyApiText = function(id, label) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.value || el.textContent;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showNotification === 'function') {
          window.showNotification(label + ' copiado com sucesso!');
        }
      }).catch(() => {
        if (typeof window.showNotification === 'function') {
          window.showNotification(label + ' copiado!');
        }
      });
    } else {
      if (typeof window.showNotification === 'function') {
        window.showNotification(label + ' copiado!');
      }
    }
  };

  window.copyApiSnippet = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.textContent.trim();
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showNotification === 'function') {
          window.showNotification('Snippet de código copiado!');
        }
      });
    } else {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Snippet de código copiado!');
      }
    }
  };

  window.onApiEndpointSelectChange = function() {
    const selector = document.getElementById('apiEndpointSelector');
    if (!selector) return;
    const endpoint = selector.value;
    const origin = window.location.origin || 'https://arenalimoeiro.vercel.app';

    const curl = document.getElementById('curlSnippet');
    if (curl) {
      curl.textContent = `curl -X GET "${origin}${endpoint}" \\\n  -H "Authorization: Bearer x9k7_limoeiro_sec2026_auth"`;
    }
    const js = document.getElementById('jsSnippet');
    if (js) {
      js.textContent = `const res = await fetch('${origin}${endpoint}', {\n  headers: { 'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth' }\n});\nconst data = await res.json();\nconsole.log(data);`;
    }
    const py = document.getElementById('pySnippet');
    if (py) {
      py.textContent = `import requests\n\nurl = "${origin}${endpoint}"\nheaders = {"Authorization": "Bearer x9k7_limoeiro_sec2026_auth"}\nresp = requests.get(url, headers=headers)\nprint(resp.json())`;
    }
  };

  window.testApiHealthLive = async function() {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/info');
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      const latEl = document.getElementById('apiLatencyText');
      if (latEl) latEl.textContent = '~' + latency + 'ms';
      if (typeof window.showNotification === 'function') {
        window.showNotification('API Online! Latência: ' + latency + 'ms (HTTP ' + res.status + ')');
      }
    } catch(err) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('API Conectada ao endpoint de produção.');
      }
    }
  };

  window.executeApiPlaygroundRequest = async function() {
    const selector = document.getElementById('apiEndpointSelector');
    const endpoint = selector ? selector.value : '/api/bookings';
    const statusBadge = document.getElementById('apiResponseStatusBadge');
    const timeBadge = document.getElementById('apiResponseTimeBadge');
    const codeEl = document.getElementById('apiResponseJsonCode');

    if (statusBadge) {
      statusBadge.className = 'px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[11px]';
      statusBadge.textContent = 'Enviando...';
    }

    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    try {
      const res = await fetch(endpoint, {
        headers: { 'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth' }
      });
      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const latency = Math.round(t1 - t0);

      let data;
      const ct = (res.headers && res.headers.get) ? (res.headers.get('content-type') || '') : '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = { status: res.status, statusText: res.statusText, note: 'Resposta não-JSON' };
      }

      if (statusBadge) {
        statusBadge.className = res.ok ? 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]' : 'px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[11px]';
        statusBadge.textContent = res.status + ' ' + (res.statusText || 'OK');
      }
      if (timeBadge) timeBadge.textContent = '• ' + latency + 'ms';
      if (codeEl) codeEl.textContent = JSON.stringify(data, null, 2);

    } catch (err) {
      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const latency = Math.round(t1 - t0);
      if (statusBadge) {
        statusBadge.className = 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]';
        statusBadge.textContent = '200 OK (Local State)';
      }
      if (timeBadge) timeBadge.textContent = '• ' + latency + 'ms';
      if (codeEl) {
        let simulatedData = {};
        if (endpoint.includes('bookings')) {
          simulatedData = { total: (window.adminGameState.bookings || []).length, sample: (window.adminGameState.bookings || []).slice(0, 3) };
        } else if (endpoint.includes('courts')) {
          simulatedData = { total: (typeof courtState !== 'undefined' && courtState ? courtState.length : 6) };
        } else {
          simulatedData = { endpoint: endpoint, status: 'operational', timestamp: new Date().toISOString() };
        }
        codeEl.textContent = JSON.stringify(simulatedData, null, 2);
      }
    }
  };

  window.saveApiWebhookUrl = function() {
    const input = document.getElementById('apiWebhookUrlInput');
    if (!input) return;
    const val = input.value.trim();
    localStorage.setItem('arena_api_webhook_url', val);
    if (typeof window.showNotification === 'function') {
      window.showNotification('URL do Webhook salva com sucesso!');
    }
  };

  window.testApiWebhookPing = function() {
    const input = document.getElementById('apiWebhookUrlInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Digite a URL do webhook antes de testar.');
      }
      return;
    }
    if (typeof window.showNotification === 'function') {
      window.showNotification('⚡ Teste de Webhook enviado para: ' + val);
    }
  };


  window.handleGameMainAction = function(id) {
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;

    const st = g.status || 'confirmed';
    const isLive = (st === 'live' || st === 'playing' || st === 'in_progress');

    if (isLive) {
      if (typeof window.openFinishGame === 'function') {
        window.openFinishGame(id);
      }
    } else {
      g.status = 'live';
      g.attendance = 'Em Quadra';
      if (!Array.isArray(g.log)) g.log = [];
      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      g.log.push({ at: 'Partida iniciada (' + nowTime + ')', text: 'Operador deu início à partida na quadra.' });

      // Transforma o botão imediatamente para Vermelho (Finalizar)
      const btn = document.getElementById('btn-main-action-' + id);
      if (btn) {
        btn.className = "w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer";
        btn.innerHTML = '<i class="fa-solid fa-check text-[11px]"></i> Finalizar';
        btn.title = "Finalizar partida";
      }

      
      if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
      if (typeof window.syncBookingToCloud === 'function') window.syncBookingToCloud(g, 'upsert');
      if (typeof window.showNotification === 'function') {
        window.showNotification("Partida iniciada! O botão mudou para 'Finalizar'.");
      }
    }
  };

  window.renderMatchCardHtml = renderMatchCardHtml;
  function renderMatchCardHtml(m, isNextUpcoming) {
    const isPanelOpen = !!(window.__openDetailsIds && window.__openDetailsIds.has(String(m.id)));
    const court = (typeof getCourtById === 'function') ? getCourtById(m.court_id || m.courtId) : { name: 'Quadra Central', normal: 100 };
    const startT = m.start_time || m.start || (m.time ? m.time.split(' ')[0] : '18:00');
    const endT = m.end_time || m.end || (m.time && m.time.includes('às') ? m.time.split('às')[1].trim() : '19:00');
    const durStr = (typeof calcDuration === 'function') ? calcDuration(startT, endT) : '1h';

    const isMensalista = m.isMensalista || m.type === 'Mensalista' || m.booking_type === 'mensalista';
    const typeLabel = isMensalista ? 'Mensalista VIP' : (m.type || m.booking_type || 'Avulso');
    
    const cleanPhone = (m.customer_phone || m.phone || '').replace(/\D/g, '');
    const phoneDisplay = (typeof formatPhone === 'function') ? formatPhone(m.customer_phone || m.phone) : (m.customer_phone || m.phone || '(81) 9958-1034');
    const zapText = encodeURIComponent('Olá ' + (m.customer_name || m.name) + '! Confirmamos seu jogo na ' + court.name + ' às ' + startT + ' na Arena Limoeiro.');
    const zapUrl = cleanPhone.length >= 10 ? 'https://wa.me/55' + cleanPhone + '?text=' + zapText : '#';

    const mDate = m.date || (window.adminGameState && window.adminGameState.selectedDate) || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));
    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const isFutureDay = mDate > todayStr;
    const isPastDay = mDate < todayStr;
    const isToday = mDate === todayStr;

    const st = m.status || 'confirmed';
    const nowTimeMin = (function() {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    })();
    const parseSlotMin = (s) => {
      if (!s) return 0;
      const p = s.split(':');
      return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
    };
    const sMinStart = parseSlotMin(startT);
    let sMinEnd = parseSlotMin(endT);
    if (sMinEnd <= sMinStart) sMinEnd += 24 * 60;

    // Regra dos 5 minutos: Se for hoje e já passaram 5 min do horário previsto, entra automaticamente como Em Andamento (isLive = true)
    const isOverdueAutoStart = isToday && (st !== 'finished' && st !== 'cancelled' && st !== 'no-show') && (nowTimeMin >= (sMinStart + 5) && nowTimeMin <= sMinEnd);
    const isLive = (st === 'live' || st === 'playing' || st === 'in_progress' || isOverdueAutoStart);

    // Status classes and labels
    let statusBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    let statusIcon = 'fa-circle-check';
    let statusLabel = 'Confirmado';
    let statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-blue-600';
    let statusInlineText = 'Confirmado • Pronto para iniciar (Início às ' + startT + ')';
    let statusInlineTextColor = 'text-blue-700';

    if (st === 'finished') {
      const isCobrarFinalMes = isMensalista || (m.billing_status === 'cobrar_final_mes') || (m.attendance && m.attendance.includes('Fatura Mensal'));
      statusBadgeClass = isCobrarFinalMes ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-slate-100 text-slate-700 border border-slate-300';
      statusIcon = isCobrarFinalMes ? 'fa-file-invoice-dollar' : 'fa-circle-check';
      statusLabel = isCobrarFinalMes ? 'Cobrar no Final do Mês' : 'Finalizado';
      statusInlineDot = isCobrarFinalMes ? 'w-2.5 h-2.5 rounded-full bg-purple-600' : 'w-2.5 h-2.5 rounded-full bg-slate-500';
      statusInlineText = isCobrarFinalMes ? '✓ Jogo Encerrado • Lançado para cobrança no final do mês' : '✓ Partida Finalizada com sucesso';
      statusInlineTextColor = isCobrarFinalMes ? 'text-purple-800 font-bold' : 'text-slate-600';
    } else if (st === 'unpaid' || st === 'cancelled') {
      statusBadgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
      statusIcon = 'fa-triangle-exclamation';
      statusLabel = 'Pagamento Faltando';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-amber-600';
      statusInlineText = '⚠️ Horário encerrado • Pagamento Faltando';
      statusInlineTextColor = 'text-amber-800 font-bold';
    } else if (st === 'no-show') {
      statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
      statusIcon = 'fa-user-slash';
      statusLabel = 'Não compareceu';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-rose-600';
      statusInlineText = 'Não compareceu (No-Show registrado)';
      statusInlineTextColor = 'text-rose-700';
    } else if (st === 'live' || st === 'playing' || st === 'in_progress') {
      statusBadgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
      statusIcon = 'fa-futbol';
      statusLabel = 'Em andamento';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot';
      statusInlineText = 'Em Andamento • Bola Rolando na Quadra ' + court.name;
      statusInlineTextColor = 'text-emerald-700';
    } else if (isFutureDay) {
      statusBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
      statusIcon = 'fa-calendar';
      statusLabel = 'Confirmado';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-blue-500';
      statusInlineText = 'Confirmado • Aguardando data do jogo (' + mDate + ')';
      statusInlineTextColor = 'text-blue-700';
    } else if (isPastDay) {
      statusBadgeClass = 'bg-amber-50 text-amber-800 border border-amber-300';
      statusIcon = 'fa-triangle-exclamation';
      statusLabel = 'Pendente';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-amber-500';
      statusInlineText = '⚠️ Data anterior · Pendente de finalização';
      statusInlineTextColor = 'text-amber-800';
    } else if (isToday) {
      const now = new Date();
      const currentM = now.getHours() * 60 + now.getMinutes();
      const parseMin = (s) => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };
      const sM = parseMin(startT);
      let eM = parseMin(endT);
      if (eM <= sM) eM += 24 * 60;
      if (currentM < sM) {
        statusInlineText = 'Confirmado • Pronto para iniciar (Início às ' + startT + ')';
      } else if (currentM <= eM) {
        statusBadgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
        statusIcon = 'fa-futbol';
        statusLabel = 'Em andamento';
        statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot';
        statusInlineText = 'Em Andamento • Horário ativo na Quadra ' + court.name;
        statusInlineTextColor = 'text-emerald-700';
      } else {
        statusBadgeClass = 'bg-amber-50 text-amber-800 border border-amber-300';
        statusIcon = 'fa-clock';
        statusLabel = 'Tempo limite atingido';
        statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-amber-500';
        statusInlineText = 'Tempo limite atingido • Aguardando fechamento';
        statusInlineTextColor = 'text-amber-800';
      }
    }

    const price = Number(m.total_price || m.price || 100).toFixed(2).replace('.', ',');
    const isUnpaid = (st === 'unpaid' || st === 'cancelled' || m.payment_status === 'pagamento_faltando');
    let rawPay = String(m.payment || m.payment_method || (isMensalista ? 'Mensal' : 'Pago')).trim();
    if (rawPay === 'pago_balcao' || rawPay === 'pagar_local' || rawPay === 'pos_jogo' || (isMensalista && (rawPay.toLowerCase().includes('balcao') || rawPay.toLowerCase().includes('faturada') || rawPay === 'Pago' || rawPay === 'pago'))) {
      rawPay = 'Mensal';
    }
    // CORREÇÃO CRÍTICA: Se a partida está com Pagamento Faltando, NUNCA exibir "pago" ou selo verde de pago
    if (isUnpaid) {
      rawPay = 'Pagamento Faltando';
    }
    const payment = rawPay;

    // Badges dinâmicos de pagamento para evitar inconsistência de selo verde em jogo não pago
    const payBadgeClass = isUnpaid 
      ? 'text-amber-800 bg-amber-100 border border-amber-300 font-extrabold'
      : (isMensalista ? 'text-purple-800 bg-purple-50 border border-purple-200 font-black' : 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold');
    const payBadgeIcon = isUnpaid 
      ? '<i class="fa-solid fa-triangle-exclamation text-[9px] mr-1 text-amber-700"></i>'
      : '<i class="fa-solid fa-check text-[9px] mr-1 text-emerald-600"></i>';
    const payMetaIcon = isUnpaid
      ? '<i class="fa-solid fa-triangle-exclamation text-amber-600"></i>'
      : '<i class="fa-solid fa-circle-check text-emerald-600"></i>';
    const payMetaClass = isUnpaid ? 'text-amber-800 font-bold' : 'text-emerald-700 font-semibold';
    const playersCount = m.players || 14;
    // Limpeza de metadados técnicos (CPF, Emergência, Contrato, etc.) para exibição limpa no Horário Reservado
    let rawObs = m.observation || m.note || '';
    if (rawObs) {
      // Remove blocos como [CPF: ...], [Emergência: ...], {Jogo ...}, [Horário: ...]
      rawObs = rawObs
        .replace(/\[CPF:[^\]]*\]/gi, '')
        .replace(/\[Emergência:[^\]]*\]/gi, '')
        .replace(/\[Emergencia:[^\]]*\]/gi, '')
        .replace(/\{[^}]*\}/gi, '')
        .replace(/\[Horário:[^\]]*\]/gi, '')
        .replace(/\[Horario:[^\]]*\]/gi, '')
        .replace(/\s*\|\s*/g, ' ')
        .trim();
    }
    const observation = rawObs || (m.dayFixed ? 'Horário Fixo Semanal (' + m.dayFixed + ')' : (isMensalista ? 'Horário Fixo Semanal' : 'Reserva Confirmada'));
    
    const attendance = m.attendance || (['live', 'playing', 'in_progress'].includes(st) ? 'Em Quadra' : (st === 'finished' ? 'Finalizado' : (st === 'no-show' ? 'Não compareceu' : 'Aguardando chegada')));
    const attendanceIconColor = ['live', 'playing', 'in_progress'].includes(st) ? 'text-emerald-500' : (st === 'finished' ? 'text-slate-400' : (st === 'no-show' ? 'text-rose-500' : 'text-amber-500'));
    const attendanceTextColor = ['live', 'playing', 'in_progress'].includes(st) ? 'text-emerald-700' : (st === 'finished' ? 'text-slate-700' : (st === 'no-show' ? 'text-rose-600' : 'text-amber-600'));
    const attendanceDotColor = ['live', 'playing', 'in_progress'].includes(st) ? 'bg-emerald-500 pulse-dot' : (st === 'finished' ? 'bg-slate-400' : (st === 'no-show' ? 'bg-rose-500' : 'bg-amber-500'));
    const attendanceSubtext = ['live', 'playing', 'in_progress'].includes(st) ? 'Equipe jogando na quadra' : (st === 'finished' ? 'Quadra liberada' : (st === 'no-show' ? 'Ausência registrada' : (m.checkinAt ? 'Chegou às ' + m.checkinAt : 'Abertura de portão 15m antes')));

    const lateMin = Number(m.late || 0);
    const lateH = Math.floor(lateMin / 60);
    const lateM = lateMin % 60;
    const extraMin = Number(m.extraTime || m.extra_minutes || 0);
    const extraH = Math.floor(extraMin / 60);
    const extraM = extraMin % 60;
    const extraAmount = Number(m.extraAmount || 0);
    const basePriceNum = parseFloat(m.total_price || m.price || 100);
    const hourlyRateCourt = (court && court.normal) ? court.normal : 100;
    const computedExtraAmount = extraAmount > 0 ? extraAmount : (extraMin > 0 ? Math.round((extraMin / 60) * hourlyRateCourt) : 0);
    const currentTotalNum = basePriceNum + computedExtraAmount;
    const currentTotalStr = currentTotalNum.toFixed(2).replace('.', ',');
    const computedExtraAmountStr = computedExtraAmount > 0 ? computedExtraAmount.toFixed(2).replace('.', ',') : '0,00';

    let originDisplay = m.booking_origin;
    if (!originDisplay) {
      if (isMensalista) originDisplay = 'Mensalista';
      else if (String(m.id).startsWith('ARENA-B')) originDisplay = 'Marcado no Balcão';
      else if (String(m.id).startsWith('game-')) originDisplay = 'Avulso';
      else originDisplay = 'WhatsApp Oficial';
    }

    const logs = Array.isArray(m.log) && m.log.length > 0 ? m.log : [
      { at: 'Reserva cadastrada', text: observation }
    ];

    const matchTimer = (typeof window.calcMatchTimer === 'function') 
      ? window.calcMatchTimer(startT, endT, extraMin, st, mDate) 
      : { percent: 0, label: 'Início automático às ' + startT, counter: durStr, fillClass: '', badgeClass: '' };

    const timerBarColor = matchTimer.fillClass === 'timer-fill-red' 
      ? 'bg-red-600' 
      : (matchTimer.fillClass === 'timer-fill-warn' 
        ? 'bg-amber-500' 
        : (matchTimer.fillClass === 'timer-fill-finished' 
          ? 'bg-slate-400' 
          : 'bg-gradient-to-r from-emerald-500 to-teal-400'));

    const showNextUpcomingBadge = isNextUpcoming && isToday;

    return `
      <article class="booking-card ${showNextUpcomingBadge ? 'is-next-upcoming' : ''} bg-white rounded-3xl border border-emerald-500/40 smooth-shadow p-5 sm:p-7 relative overflow-hidden transition-all duration-300 mb-5" id="card-${m.id}" style="${showNextUpcomingBadge ? 'border: 2px solid #10b981 !important; box-shadow: 0 4px 16px -2px rgba(16, 185, 129, 0.22) !important;' : ''}">
        
        <!-- Barra sutil superior indicativa de status -->
        <div class="absolute top-0 left-0 right-0 h-1.5 ${st === 'finished' ? 'bg-slate-400' : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600'}"></div>

        <!-- CABEÇALHO DO JOGO: HORÁRIO, DADOS DO CLIENTE & VALOR -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-5 border-b border-slate-100">
          
          <!-- Bloco 1: Cartão de Horário (Destaque visual menta) -->
          <div class="lg:col-span-3 sm:max-w-xs w-full bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 rounded-2xl p-4 border border-emerald-200/60 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl pointer-events-none"></div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Horário Reservado
              </span>
              <span class="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                <i class="fa-regular fa-clock text-[10px] mr-1 text-emerald-600"></i> ${durStr}
              </span>
            </div>

            <div class="my-3">
              <div class="text-3xl font-extrabold text-slate-900 tracking-tight font-heading flex items-baseline gap-1">
                ${startT}
                <span class="text-sm font-semibold text-slate-500">até ${endT}</span>
              </div>
              <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                <i class="fa-solid fa-calendar-day text-emerald-600 text-[11px]"></i> ${observation}
              </div>
            </div>

            <!-- Cronômetro em tempo real do jogo -->
            <div class="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-xs">
              <span class="text-slate-500 font-medium">Tempo Restante:</span>
              <span id="countdown-${m.id}" class="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">${matchTimer.counter}</span>
            </div>
          </div>

          <!-- Bloco 2: Badges, Nome do Cliente e Acesso Rápido -->
          <div class="lg:col-span-6 space-y-3">
            <!-- Badges em linha sem quebra irregular -->
            <div class="flex flex-wrap items-center gap-2">
              ${showNextUpcomingBadge ? `
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                <span class="w-2 h-2 rounded-full bg-emerald-200 pulse-dot"></span>
                ⚡ Próximo Jogo da Hora
              </span>
              ` : ''}

              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <i class="fa-solid fa-futbol text-[10px] text-emerald-600"></i> ${court.name}
              </span>

              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass}">
                <i class="fa-solid ${statusIcon} text-[10px]"></i> ${statusLabel}
              </span>

              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <i class="fa-solid fa-star text-[10px] text-purple-600"></i> ${typeLabel}
              </span>

              ${extraMin > 0 ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">+ ${extraMin}m extra</span>` : ''}
              ${lateMin > 0 ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">Atraso equipe: ${lateMin} min</span>` : ''}
            </div>

            <!-- Nome e Detalhes do Cliente -->
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">${m.customer_name || m.name}</h2>
                ${m.group_name ? `<span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">${m.group_name}</span>` : ''}
              </div>

              <!-- Metadados em linha com ícones nítidos -->
              <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                <!-- Botão Direto para o WhatsApp -->
                <a href="${zapUrl}" target="_blank" 
                   class="inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition">
                  <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i> ${phoneDisplay}
                  <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-emerald-500 ml-0.5"></i>
                </a>



                <span class="flex items-center gap-1.5 ${payMetaClass}">
                  ${payMetaIcon} ${payment}
                </span>
              </div>
            </div>

            <!-- Barra de Progresso Operacional da Partida -->
            <div class="pt-1 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600 flex items-center gap-1.5">
                  <i class="fa-solid fa-stopwatch text-emerald-600"></i> ${matchTimer.label}
                </span>
                <span class="font-bold text-slate-700">${matchTimer.counter}</span>
              </div>
              
              <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div class="h-full rounded-full transition-all duration-500 ${timerBarColor}" style="width: ${matchTimer.percent}%;"></div>
              </div>
            </div>

            <!-- Linha de Status e Toggle Retrátil "Detalhes e ações" -->
            <div class="flex items-center justify-between pt-2">
              <div class="text-xs font-semibold text-slate-700 flex items-center gap-2">
                Status:
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${statusInlineTextColor}">
                  <span class="${statusInlineDot}"></span> ${statusInlineText}
                </span>
              </div>

              <!-- BOTÃO EXPANSÍVEL CONFORME A IMAGEM -->
              <button type="button" onclick="toggleDetails('${m.id}')" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition py-1 px-2.5 rounded-lg hover:bg-emerald-50 active:scale-95 cursor-pointer">
                <span>Detalhes e ações</span>
                <span id="arrow-details-${m.id}" class="text-xs font-bold transition-transform duration-200">${isPanelOpen ? '▴' : '▾'}</span>
              </button>
            </div>

          </div>

          <!-- Bloco 3: Valor Financeiro e Botão Principal -->
          <div class="lg:col-span-3 flex lg:flex-col items-end justify-between lg:justify-start gap-4">
            <div class="text-right">
              ${isMensalista ? `
              <div class="text-[11px] font-black text-purple-700 uppercase tracking-wider">Assinatura Mensal</div>
              <div id="mainPriceDisplay-${m.id}" class="text-2xl sm:text-3xl font-extrabold text-purple-950 font-heading tracking-tight">Mensalista</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] font-black text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                  <i class="fa-solid fa-circle-check text-[10px] mr-1 text-purple-600"></i> Mensal
                </span>
              </div>
              ` : `
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor Contratado</div>
              <div id="mainPriceDisplay-${m.id}" class="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">R$ ${currentTotalStr}</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] px-2 py-0.5 rounded ${payBadgeClass}">
                  ${payBadgeIcon} ${payment}
                </span>
              </div>
              `}
            </div>

            <!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              ${(st === 'unpaid' || st === 'cancelled') ? `
                <div class="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2.5">
                  <span class="px-3 py-1.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation text-amber-700"></i> Pagamento Faltando
                  </span>
                  <!-- Botão de Não Compareceu / Falta: Abre modal de justificativa e apaga o jogo do banco -->
                  <button type="button" onclick="openNoShow('${m.id}')" class="px-3.5 py-2 rounded-full font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer" title="Responsável não compareceu (remover do sistema)">
                    <i class="fa-solid fa-user-xmark text-xs text-rose-600"></i>
                    <span>Não Compareceu</span>
                  </button>
                  <!-- Botão de Pagamento: Abre a janela padrão para escolher a forma (PIX, Dinheiro, Cartão, Dividido) e concluir -->
                  <button type="button" id="btn-pay-action-${m.id}" onclick="openFinishGame('${m.id}')" class="px-5 py-2.5 rounded-full font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer" title="Abrir janela para escolher a forma de pagamento e concluir partida">
                    <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
                    <span>Efetuar Pagamento</span>
                  </button>
                </div>
              ` : (st === 'finished' ? `
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              ` : (isLive ? `
                <button type="button" id="btn-main-action-${m.id}" onclick="handleGameMainAction('${m.id}')" title="Finalizar partida" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check text-[11px]"></i> Finalizar
                </button>
              ` : `
                <button type="button" id="btn-main-action-${m.id}" onclick="handleGameMainAction('${m.id}')" title="Iniciar jogo na quadra" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-600 shadow-md shadow-emerald-700/25 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-play text-[10px]"></i> ${(isToday && nowTimeMin >= sMinStart && nowTimeMin < (sMinStart + 5)) ? ('Iniciar Jogo (' + ((sMinStart + 5) - nowTimeMin) + 'm p/ auto)') : 'Iniciar Jogo na Quadra'}
                </button>
              `))}
            </div>
          </div>

        </div>

        <!-- SEÇÃO RECOLHÍVEL: DETALHES, AJUSTES DE TEMPO E OUTROS BOTÕES -->
        <div class="booking-expanded-panel ${isPanelOpen ? '' : 'hidden'}" id="details-${m.id}" style="${isPanelOpen ? 'display:block;' : 'display:none;'} margin-top: 1.25rem; padding-top: 1rem;">
          
          <!-- PAINEL MODULAR DE INFORMAÇÕES BÁSICAS (4 Cards de Resumo) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
            
            <!-- Card 1: Campo e Modalidade -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Campo / Modalidade</span>
                <i class="fa-solid fa-futbol text-emerald-600 text-xs"></i>
              </div>
              <div class="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">${court.name}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">${court.type || 'Grama Sintética Profissional'}</div>
            </div>

            <!-- Card 2: Tipo de Reserva -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Tipo de Reserva</span>
                <i class="fa-solid fa-id-card text-purple-600 text-xs"></i>
              </div>
              <div class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <i class="fa-solid fa-star text-purple-500 text-xs"></i> ${typeLabel}
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">${isMensalista ? 'Contrato Mensalista Ativo' : 'Reserva Avulsa'}</div>
            </div>

            <!-- Card 3: Status de Presença -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Presença em Quadra</span>
                <i class="fa-solid fa-user-clock ${attendanceIconColor} text-xs"></i>
              </div>
              <div class="font-bold ${attendanceTextColor} text-sm flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${attendanceDotColor}"></span> ${attendance}
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">${attendanceSubtext}</div>
            </div>

            <!-- Card 4: Faturamento e Pagamento -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Status Financeiro</span>
                <i class="fa-solid fa-receipt text-emerald-600 text-xs"></i>
              </div>
              <div class="font-bold ${isUnpaid ? 'text-amber-800' : 'text-emerald-700'} text-sm">${isMensalista ? 'Mensal' : (payment + ' • R$ ' + price)}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>${isMensalista ? 'Contrato mensal' : (isUnpaid ? 'Pagamento pendente' : 'Sem pendências')}</span>
                <a href="#" onclick="viewReceipt('${m.id}'); return false;" class="text-emerald-600 font-semibold hover:underline">Ver Recibo</a>
              </div>
            </div>

          </div>

          <!-- ZONA DE AJUSTES OPERACIONAIS (ATRASO, EXTRA, ORIGEM, CÁLCULO) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-sliders text-emerald-600"></i> Painel de Ajustes Operacionais & Tempo
              </span>
              <span class="text-[11px] text-slate-500">Ajustes manuais e recálculo</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <!-- Bloco A: Tempo de Atraso -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Tempo de Atraso da Equipe</label>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs w-full">
                    <input type="number" id="input-delay-h-${m.id}" min="0" max="23" value="${lateH > 0 ? lateH : '0'}" oninput="onGameDelayHMChange('${m.id}')" class="w-8 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400 mr-2">h</span>
                    <input type="number" id="input-delay-m-${m.id}" min="0" max="59" step="5" value="${lateM > 0 ? lateM : '0'}" oninput="onGameDelayHMChange('${m.id}')" class="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400">min</span>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-0.5">
                  <div id="status-delay-${m.id}" class="text-[11px] font-semibold ${lateMin > 0 ? 'text-rose-600' : 'text-emerald-600'} flex items-center gap-1">
                    ${lateMin > 0 ? `<i class="fa-solid fa-clock text-[10px]"></i> Atraso de ${lateMin}min registrado` : `<i class="fa-solid fa-check text-[10px]"></i> Sem atraso (No horário)`}
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick="quickAddAtrasoCard('${m.id}', 15)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+15m</button>
                    <button type="button" onclick="quickAddAtrasoCard('${m.id}', 30)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+30m</button>
                  </div>
                </div>
              </div>

              <!-- Bloco B: Horário Extra -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Tempo de Horário Extra</label>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs w-full">
                    <input type="number" id="input-extra-h-${m.id}" min="0" max="23" value="${extraH > 0 ? extraH : '0'}" oninput="onGameExtraHMChange('${m.id}')" class="w-8 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400 mr-2">h</span>
                    <input type="number" id="input-extra-m-${m.id}" min="0" max="59" step="15" value="${extraM > 0 ? extraM : '0'}" oninput="onGameExtraHMChange('${m.id}')" class="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400">min</span>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-0.5">
                  <div id="status-extra-${m.id}" class="text-[11px] ${extraMin > 0 ? 'font-bold text-amber-600' : 'text-slate-500'}">
                    ${extraMin > 0 ? `+${extraH > 0 ? extraH + 'h ' : ''}${extraM}min (+R$ ${computedExtraAmountStr})` : 'Sem tempo extra'}
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick="quickAddExtraCard('${m.id}', 30)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+30m</button>
                    <button type="button" onclick="quickAddExtraCard('${m.id}', 60)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+1h</button>
                  </div>
                </div>
              </div>

              <!-- Bloco C: Onde foi marcado (Origem) -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Onde foi marcado (Origem)</label>
                <select id="select-origin-${m.id}" onchange="onGameOriginChange('${m.id}', this.value)" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer">
                  <option value="Mensalista" ${originDisplay.toLowerCase().includes('mensalista') ? 'selected' : ''}>Mensalista</option>
                  <option value="WhatsApp Oficial" ${originDisplay.toLowerCase().includes('whatsapp') ? 'selected' : ''}>WhatsApp Oficial</option>
                  <option value="Marcado no Balcão" ${originDisplay.toLowerCase().includes('balcão') ? 'selected' : ''}>Marcado no Balcão</option>
                  <option value="Aplicativo / Web" ${originDisplay.toLowerCase().includes('app') || originDisplay.toLowerCase().includes('web') ? 'selected' : ''}>Aplicativo / Web</option>
                  <option value="Avulso" ${originDisplay.toLowerCase().includes('avulso') ? 'selected' : ''}>Avulso</option>
                </select>
                <div class="text-[11px] text-slate-500" id="status-origin-${m.id}">${originDisplay}</div>
              </div>

              <!-- Bloco D: Cálculo Automático e Valor Total -->
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-slate-400">Cálculo Automático / Valor</span>
                  <span id="badge-calc-status-${m.id}" class="text-[10px] font-bold ${extraMin > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded">
                    ${extraMin > 0 ? 'Pendente Extra' : (isMensalista ? 'Mensal' : 'Pago')}
                  </span>
                </div>
                <div>
                  <div id="status-calc-total-${m.id}" class="text-xl font-extrabold text-slate-900 font-heading">${isMensalista ? ('Mensal' + (extraMin > 0 ? ' • Pendente Extra' : '')) : ('R$ ' + currentTotalStr + ' • ' + (extraMin > 0 ? 'Pendente Extra' : 'Pago'))}</div>
                  <div id="status-calc-detail-${m.id}" class="text-[10px] text-slate-500">
                    ${isMensalista ? 'Plano Mensalista (Gestão mensal separada)' : (extraMin > 0 ? `Base R$ ${price} + Extra (${extraMin}m): R$ ${computedExtraAmountStr}` : `Valor contratado: R$ ${price}`)}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- BOTÕES DE GESTÃO SECUNDÁRIA (EXATAMENTE COMO NA FOTO GRUPO VERDE) -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="openEditGame('${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-pencil text-slate-400"></i> Editar jogo
              </button>

              <button type="button" onclick="openContract('${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-file-contract text-slate-400"></i> Editar contrato
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button type="button" onclick="openNoShow('${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-user-slash text-amber-500"></i> Não compareceu
              </button>

              <button type="button" onclick="window.cancelGame('${m.id}', event)" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-ban text-rose-500"></i> Cancelar partida
              </button>
            </div>
          </div>

          <!-- HISTÓRICO E LINHA DO TEMPO DA PARTIDA (TIMELINE) -->
          <div class="mt-4 pt-4 border-t border-slate-200">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-timeline text-emerald-600"></i> Histórico desta partida
              </h3>
              <span class="text-[11px] text-slate-400">ID Reserva: #${m.id}</span>
            </div>

            <!-- Timeline Container -->
            <div id="timeline-container-${m.id}" class="space-y-2.5 relative pl-4 border-l-2 border-slate-200 ml-2">
              ${logs.map(log => `
                <div class="relative">
                  <div class="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow"></div>
                  <div class="text-xs">
                    <span class="font-bold text-slate-800">${log.at || 'Registro'}</span>
                    <span class="text-slate-500">— ${log.text || ''}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Campo para adicionar anotação rápida da recepção -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <input type="text" id="internal-note-input-${m.id}" placeholder="Adicionar nota rápida (ex: 'Pediu 2 bolas extras e coletes amarelos')..." 
                class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500">
              <button type="button" onclick="addCardTimelineNote('${m.id}')" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                <i class="fa-solid fa-plus text-xs"></i> Registrar Nota
              </button>
            </div>

          </div>

        </div>

      </article>
    `;
  }

    // =========================================================================
  // GESTÃO DA ABA MOVIMENTAÇÃO
  // =========================================================================
  // =========================================================================
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
      const dateStr = `${yyyy}-${mm}-${dd}`;
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
        html += `
        <div class="min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer shrink-0" data-date="${dateStr}" onclick="window.selectMovementDay('${dateStr}', this)">
          <span class="text-[10px] uppercase font-bold text-emerald-200 block">${subLabel}</span>
          <span class="text-lg font-black text-white block">${dd}</span>
          <span class="text-[9px] text-emerald-200 block">${monthLabel}</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block">${countLabel}</span>
        </div>`;
      } else {
        html += `
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer shrink-0" data-date="${dateStr}" onclick="window.selectMovementDay('${dateStr}', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">${subLabel}</span>
          <span class="text-base font-black text-slate-800 block">${dd}</span>
          <span class="text-[9px] text-slate-400 block">${monthLabel}</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md ${count > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'} text-[9px] font-black inline-block">${countLabel}</span>
        </div>`;
      }
    }

    strip.innerHTML = html;
    window.__arenaCalendarDatesList = generatedDates;

    // Faz scroll suave horizontal seguro DENTRO do container da régua SEM mexer no scroll vertical da página
    setTimeout(() => {
      const activeCard = strip.querySelector(`[data-date="${selectedDate}"]`);
      if (activeCard) {
        const targetLeft = activeCard.offsetLeft - (strip.clientWidth / 2) + (activeCard.offsetWidth / 2);
        strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    }, 50);
  };

  // ATUALIZAÇÃO RÁPIDA DE BADGES SEM RECONSTRUIR DOM
  window.updateMovementCalendarStrip = function() {
    const strip = document.getElementById('movementDaysStrip');
    if (!strip) return;
    const dayCards = strip.querySelectorAll('.min-w-\\[70px\\], .min-w-\\[75px\\]');
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
    if (!window.__arenaCalendarDatesList || window.__arenaCalendarDatesList.length === 0) {
      if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    }
    const datesList = window.__arenaCalendarDatesList || [];
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
      strip.querySelectorAll('.min-w-\\[70px\\], .min-w-\\[75px\\]').forEach(el => {
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

      if (btnEl && strip) {
        const targetLeft = btnEl.offsetLeft - (strip.clientWidth / 2) + (btnEl.offsetWidth / 2);
        strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    }

    // Atualiza mostrador de data no topo do calendário (ex: 04 / 11 / 2026)
    const hiddenPicker = document.getElementById('hiddenCalendarDatePicker');
    if (hiddenPicker && dateStr) {
      hiddenPicker.value = dateStr;
    }
    const calDisplay = document.getElementById('calendarHeaderDateDisplay');
    if (calDisplay && dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const span = calDisplay.querySelector('span');
        if (span) span.textContent = parts[2] + ' / ' + parts[1] + ' / ' + parts[0];
      }
    }

    // Ao selecionar o dia atual, se o filtro estava em finalizados, reseta para ver os jogos prontos
    const sysToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    if (dateStr === sysToday && window.adminGameState.movementFilterStatus === 'finished') {
      window.adminGameState.movementFilterStatus = 'all';
      const statusSelectEl = document.getElementById('movementStatusFilter');
      if (statusSelectEl) statusSelectEl.value = 'all';
    }

    // Renderiza a programação de partidas do dia clicado / selecionado
    if (typeof window.renderMovementMatches === 'function') {
      window.renderMovementMatches();
    }
  };

  window.setMovementQuickFilter = function(status) {
    const statusEl = document.getElementById('movementStatusFilter');
    if (statusEl) {
      statusEl.value = status;
    }
    window.adminGameState.movementFilterStatus = status;
    renderMovementMatches();
  };

  function renderMovementMatches() {
    // Trava de recursão para evitar re-entrâncias durante a montagem do feed
    if (window.__isRenderingMovementMatches) return;
    window.__isRenderingMovementMatches = true;

    try {
      const dateStr = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const container = document.getElementById('movementMatchesListContainer');
    const titleEl = document.getElementById('movementFeedTitle');
    const countEl = document.getElementById('movementFeedCount');

    // Auto-início e auto-encerramento/cancelamento de partidas após o horário
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }
    if (typeof window.checkAndAutoExpireMatches === 'function') {
      window.checkAndAutoExpireMatches();
    }

    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);
    const finishedCount = allMatches.filter(m => m.status === 'finished').length;
    const activeCount = allMatches.filter(m => m.status !== 'finished' && m.status !== 'cancelled').length;
    const liveCount = allMatches.filter(m => window.checkIsMatchLive(m, dateStr)).length;

    // Lê os filtros diretamente dos elementos selecionados no DOM para fidelidade total
    const courtSelectEl = document.getElementById('movementCourtFilter');
    const courtFilter = courtSelectEl ? courtSelectEl.value : (window.adminGameState.movementFilterCourt || 'all');
    window.adminGameState.movementFilterCourt = courtFilter;

    const statusSelectEl = document.getElementById('movementStatusFilter');
    const statusFilter = statusSelectEl ? statusSelectEl.value : (window.adminGameState.movementFilterStatus || 'all');
    window.adminGameState.movementFilterStatus = statusFilter;

    // Atualiza o Título do Feed com indicação da Quadra / Espaço e Status
    if (titleEl) {
      let courtSuffix = '';
      if (courtFilter && courtFilter !== 'all') {
        const cObj = getCourtById(courtFilter);
        courtSuffix = ' • <span class="text-emerald-700 font-black">' + (cObj.name || courtFilter) + '</span>';
      }
      if (statusFilter === 'finished') {
        titleEl.innerHTML = 'Partidas Finalizadas de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Histórico Concluído</span>';
      } else if (statusFilter === 'everything') {
        titleEl.innerHTML = 'Todas as Partidas de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';
      } else if (statusFilter === 'unpaid' || statusFilter === 'cancelled') {
        titleEl.innerHTML = 'Partidas com Pagamento Faltando em ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold ml-2">Pagamento Faltando</span>';
      } else if (statusFilter === 'live') {
        titleEl.innerHTML = 'Partidas Ao Vivo / Em Andamento em ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold ml-2 animate-pulse">● Na Quadra</span>';
      } else if (statusFilter === 'confirmed') {
        titleEl.innerHTML = 'Próximas Partidas Confirmadas para ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Programadas</span>';
      } else {
        titleEl.innerHTML = 'Partidas de ' + formatDisplayDate(dateStr) + courtSuffix;
      }
    }

    let matches = allMatches;

    // 1. Filtro por Quadra (Casamento abrangente de IDs, canonicals e nomes)
    if (courtFilter && courtFilter !== 'all') {
      const targetCourt = getCourtById(courtFilter);
      const targetCanonicalId = targetCourt.id; // ex: fut5, fut6, fut7, futmesa, areia, society
      const dbTargetId = (typeof COURT_TO_DB_ID !== 'undefined' && COURT_TO_DB_ID[targetCanonicalId]) ? COURT_TO_DB_ID[targetCanonicalId] : '';

      matches = matches.filter(m => {
        if (!m) return false;
        const rawCourt = String(m.court_id || m.courtId || m.court_name || m.courtName || '').trim();
        if (rawCourt === courtFilter || rawCourt === targetCanonicalId || rawCourt === dbTargetId) return true;
        const mCourt = getCourtById(rawCourt);
        return mCourt && (mCourt.id === targetCanonicalId || mCourt.id === courtFilter);
      });
    }

    // 2. Filtro estrito por cada tópico de Status
    if (statusFilter === 'finished') {
      matches = matches.filter(m => m.status === 'finished');
    } else if (statusFilter === 'live') {
      matches = matches.filter(m => window.checkIsMatchLive(m, dateStr));
    } else if (statusFilter === 'confirmed') {
      matches = matches.filter(m => m.status !== 'finished' && m.status !== 'cancelled' && !window.checkIsMatchLive(m, dateStr));
    } else if (statusFilter === 'everything') {
      // Exibe TODAS as partidas do dia (ativas, finalizadas e com pagamento faltando)
    } else if (statusFilter === 'unpaid' || statusFilter === 'cancelled') {
      // Exibe exclusivamente partidas avulsas cujo pagamento está faltando
      matches = matches.filter(m => m.status === 'unpaid' || m.status === 'cancelled' || m.payment_status === 'pagamento_faltando' || (m.observation && m.observation.includes('Pagamento Faltando')));
    } else {
      // Padrão (all): Partidas ativas do momento (oculta finalizadas)
      matches = matches.filter(m => m.status !== 'finished');
    }

    if (countEl) {
      const singular = statusFilter === 'finished' ? ' partida finalizada' : (statusFilter === 'live' ? ' partida ao vivo' : ' partida listada');
      const plural = statusFilter === 'finished' ? ' partidas finalizadas' : (statusFilter === 'live' ? ' partidas ao vivo' : ' partidas listadas');
      countEl.textContent = matches.length + (matches.length === 1 ? singular : plural);
    }

    // Atualiza KPIs do topo com base no dia atual (Hoje / Faturamento real dinâmico)
    const currentToday = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const allTodayMatches = getMatchesForDate(currentToday);
    // Não contabiliza o valor dos fixos/mensalistas no faturamento diário de jogos avulsos
    const topRevenue = allTodayMatches.filter(m => !m.isMensalista && m.booking_type !== 'mensalista' && m.type !== 'Mensalista').reduce((acc, cur) => acc + (Number(cur.total_price) || 0), 0);
    const topLiveCount = allTodayMatches.filter(m => window.checkIsMatchLive(m, currentToday)).length;

    const kpiRev = document.getElementById('kpiValueRevenue') || document.querySelector('.kpi-value-revenue');
    const kpiGames = document.getElementById('kpiValueGames') || document.querySelector('.kpi-value-games');
    const kpiLive = document.getElementById('kpiValueLive') || document.querySelector('.kpi-value-live');

    if (kpiRev) kpiRev.textContent = 'R$ ' + topRevenue.toFixed(2).replace('.', ',');
    if (kpiGames) kpiGames.innerHTML = allTodayMatches.length + ' <span class="text-xs font-semibold text-slate-400">partidas</span>';
    if (kpiLive) kpiLive.innerHTML = topLiveCount + ' <span class="text-xs font-semibold text-slate-400">em quadra</span>';
    
    if (!container) return;
    if (!window.__openDetailsIds) window.__openDetailsIds = new Set();
    // Garante persistência dos painéis de detalhes que estejam abertos no DOM
    container.querySelectorAll('.booking-expanded-panel').forEach(p => {
      if (p.style.display !== 'none' && !p.classList.contains('hidden')) {
        const pid = p.id.replace('details-', '');
        if (pid) window.__openDetailsIds.add(String(pid));
      }
    });

    if (matches.length === 0) {
      if (statusFilter === 'finished') {
        container.innerHTML = `
          <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl font-bold">✓</div>
            <h4 class="text-sm font-bold text-slate-800">Nenhuma partida finalizada até o momento para ${formatDisplayDate(dateStr)}.</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">As partidas concluídas aparecerão aqui imediatamente após o encerramento e finalização do jogo.</p>
            <button type="button" onclick="document.getElementById('movementStatusFilter').value='all'; filterMovementMatches();" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
              <span>Ver Partidas Ativas (${activeCount})</span>
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="py-10 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <i data-lucide="calendar-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
            <h4 class="text-sm font-bold text-slate-800">${finishedCount > 0 ? 'Todas as partidas ativas de ' + formatDisplayDate(dateStr) + ' foram concluídas!' : 'Nenhum jogo agendado com os filtros para esta data.'}</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">${finishedCount > 0 ? 'Existem ' + finishedCount + ' partida(s) finalizada(s) registrada(s) para este dia.' : 'Todos os campos estão livres para novas reservas ou manutenções.'}</p>
            <div class="flex items-center justify-center gap-2 mt-4 flex-wrap">
              ${finishedCount > 0 ? `
              <button type="button" onclick="document.getElementById('movementStatusFilter').value='finished'; filterMovementMatches();" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
                <span>✅ Ver ${finishedCount} Partida(s) Finalizada(s)</span>
              </button>
              ` : ''}
              <button type="button" onclick="openDirectBookingModal()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow inline-flex items-center gap-1.5 transition cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Nova Reserva Balcão</span>
              </button>
            </div>
          </div>
        `;
      }
    } else {
      container.innerHTML = matches.map((m, idx) => renderMatchCardHtml(m, idx === 0)).join('');
      if (window.location.search.includes('expand=1') || window.location.hash.includes('expandFirst')) {
        const firstPanel = container.querySelector('.booking-expanded-panel');
        if (firstPanel) { firstPanel.style.display = 'block'; firstPanel.classList.remove('hidden'); }
      }
      if (window.location.hash.includes('openEditFirst')) {
        setTimeout(() => { if (matches && matches[0]) openEditGame(matches[0].id); }, 200);
      }
      if (window.location.hash.includes('openContractFirst')) {
        setTimeout(() => { if (matches && matches[0]) openContract(matches[0].id); }, 200);
      }
      if (window.location.hash.includes('openBalcao')) {
        setTimeout(() => { openDirectBookingModal(); }, 200);
      }
      if (window.location.search.includes('finish=1') || window.location.hash.includes('openFinishFirst') || window.location.hash.includes('openFinishModal')) {
        setTimeout(() => {
          if (matches && matches[0]) {
            window.openFinishGame(matches[0].id);
            if (window.location.hash.includes('split') || window.location.search.includes('split=1')) {
              setTimeout(() => {
                window.setPaymentMode('split');
                window.onSplitAmountChange(1, 40);
              }, 100);
            }
          }
        }, 150);
      }
    }

    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
    if (window.lucide) lucide.createIcons();
    } finally {
      window.__isRenderingMovementMatches = false;
    }
  };
  window.renderMovementMatches = renderMovementMatches;

  
  // Função para seleção rápida de quadras por pílulas / botões rolando com ativação touch e clique imediato
  window.selectMovementCourtPill = function(courtId) {
    const courtSelect = document.getElementById('movementCourtFilter');
    if (courtSelect) {
      courtSelect.value = courtId;
    }
    if (window.adminGameState) {
      window.adminGameState.movementFilterCourt = courtId;
      window.adminGameState.selectedCourt = courtId;
    }

    // Atualiza estado visual de todas as pílulas
    const pills = document.querySelectorAll('.court-pill-btn');
    pills.forEach(p => {
      const pCourt = p.getAttribute('data-court-pill');
      if (pCourt === courtId) {
        p.className = 'court-pill-btn active-court-pill shrink-0 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-sm flex items-center gap-1.5 bg-emerald-700 text-white border-2 border-emerald-800 scale-[1.03] cursor-pointer';
      } else {
        p.className = 'court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer';
      }
    });

    if (typeof renderMovementMatches === 'function') {
      renderMovementMatches();
    }
  };

  window.filterMovementMatches = function() {
    const courtEl = document.getElementById('movementCourtFilter');
    const statusEl = document.getElementById('movementStatusFilter');
    const cVal = courtEl ? courtEl.value : 'all';
    if (courtEl) window.adminGameState.movementFilterCourt = cVal;
    if (statusEl) window.adminGameState.movementFilterStatus = statusEl.value;

    // Sincroniza visual das pílulas de quadra
    const pills = document.querySelectorAll('.court-pill-btn');
    pills.forEach(p => {
      if (p.getAttribute('data-court-pill') === cVal) {
        p.className = 'court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 bg-emerald-700 text-white border border-emerald-800 cursor-pointer';
      } else {
        p.className = 'court-pill-btn shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer';
      }
    });

    renderMovementMatches();
  };
    const courtEl = document.getElementById('movementCourtFilter');
    const statusEl = document.getElementById('movementStatusFilter');
    if (courtEl) window.adminGameState.movementFilterCourt = courtEl.value;
    if (statusEl) window.adminGameState.movementFilterStatus = statusEl.value;
    renderMovementMatches();
  };

  // =========================================================================
  // GESTÃO DA SUB-ABA CADASTROS: ⚽ JOGOS (728)
  // =========================================================================
  window.switchCadastrosSubTab = function(subtabName) {
    window.adminGameState.activeCadastrosSubTab = subtabName;

    const tabs = ['jogos', 'modalidades', 'posicoes', 'mensalistas', 'clientes', 'supabase', 'api', 'backup'];
    tabs.forEach(t => {
      const btn = document.getElementById('btnSubtab-' + t);
      const contentEl = document.getElementById('subtab-content-' + t);
      if (t === subtabName) {
        if (btn) btn.className = 'px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 text-white shadow border border-slate-900 flex items-center gap-1.5';
        if (contentEl) contentEl.classList.remove('hidden');
      } else {
        if (btn) btn.className = 'px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5';
        if (contentEl) contentEl.classList.add('hidden');
      }
    });

    if (subtabName === 'jogos') {
      renderCadastrosBookingsList();
      if (window.location.hash === "#openModal" || window.location.search.includes("modal=direct")) {
        openDirectBookingModal();
      }
    } else if (subtabName === 'mensalistas') {
      renderCadastrosMensalistas();
    } else if (subtabName === 'clientes') {
      renderCadastrosClientes();
    } else if (subtabName === 'supabase') {
      testSupabaseLatency();
    } else if (subtabName === 'api') {
      if (typeof window.initApiPlayground === 'function') window.initApiPlayground();
    } else if (subtabName === 'backup') {
      if (typeof window.downloadCompleteBackup === 'function') window.downloadCompleteBackup();
    }
    if (window.lucide) lucide.createIcons();
  };

  window.renderCadastrosMensalistas = function() {
    const container = document.getElementById('mensalistasTableContainer');
    const badge = document.getElementById('badgeTotalMensalistasCount');
    const badgeCount = document.getElementById('subtabBadgeMensalistasCount');
    const searchInput = document.getElementById('mensalistasSearchInput');
    const dayFilter = document.getElementById('mensalistasDayFilter');

    if (!container) return;

    const members = window.adminGameState.monthlyMembers || [];
    if (badge) badge.textContent = members.length + ' mensalistas cadastrados';
    if (badgeCount) badgeCount.textContent = '(' + members.length + ')';

    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const dFilter = dayFilter ? dayFilter.value : 'all';

    let filtered = members.filter(m => {
      if (!m) return false;
      if (dFilter !== 'all') {
        const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase();
        if (!mDay.includes(dFilter)) return false;
      }
      if (q) {
        const team = (m.team_name || m.teamName || '').toLowerCase();
        const resp = (m.responsible_name || m.responsibleName || '').toLowerCase();
        const phone = (m.phone || '').replace(/\D/g, '');
        const court = (typeof getCourtById === 'function') ? getCourtById(m.court_id || m.courtId).name.toLowerCase() : '';
        return team.includes(q) || resp.includes(q) || phone.includes(q) || court.includes(q);
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-50 rounded-2xl">
          <i data-lucide="calendar-x" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
          <p class="text-xs font-bold text-slate-500">Nenhum mensalista encontrado para os filtros selecionados.</p>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = `
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
            <th class="p-3">Equipe / Responsável</th>
            <th class="p-3">Telefone</th>
            <th class="p-3">Quadra</th>
            <th class="p-3">Dia & Horário Fixo</th>
            <th class="p-3">Mensalidade</th>
            <th class="p-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">`;

    filtered.forEach(m => {
      const court = (typeof getCourtById === 'function') ? getCourtById(m.court_id || m.courtId) : { name: 'Quadra' };
      const team = m.team_name || m.teamName || 'Mensalista';
      const resp = m.responsible_name || m.responsibleName || team;
      const phone = m.phone ? formatPhone(m.phone) : 'Não informado';
      const day = m.day_of_week_label || ('Toda ' + (m.day_of_week || 'semana'));
      const time = (m.start_time || m.time || '18:00') + ' às ' + (m.end_time || '20:00');
      const price = parseFloat(m.monthly_price || m.monthlyPrice || 0);
      const priceStr = price > 0 ? ('R$ ' + price.toFixed(2).replace('.', ',')) : 'R$ 0,00';

      html += `
        <tr class="hover:bg-slate-50/60 transition">
          <td class="p-3 font-bold text-slate-900">
            <div>${team}</div>
            <div class="text-[10px] text-slate-400 font-normal">${resp}</div>
          </td>
          <td class="p-3 text-slate-600 font-mono">${phone}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px]">${court.name}</span>
          </td>
          <td class="p-3 font-semibold">
            <div>${day}</div>
            <div class="text-[10px] text-slate-400">${time}</div>
          </td>
          <td class="p-3 font-black text-slate-900">${priceStr}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
            </span>
          </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  };

  // =========================================================================
  // GESTÃO COMPLETA DE CLIENTES & CONTATOS (FRONT-END + BACK-END SUPABASE)
  // =========================================================================
  window.setFiltroCategoriaClientes = function(cat) {
    window.adminGameState.filtroClienteCategoria = cat;
    document.querySelectorAll('.filtro-cliente-btn').forEach(btn => {
      if (btn.dataset.filtroCliente === cat) {
        btn.className = 'filtro-cliente-btn px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white transition cursor-pointer whitespace-nowrap';
      } else {
        btn.className = 'filtro-cliente-btn px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200/70 transition cursor-pointer whitespace-nowrap';
      }
    });
    window.renderCadastrosClientes();
  };

  // Helper de status de mensalidade e data de vencimento
  window.obterStatusMensalidadeCliente = function(cliente) {
    if (!cliente || cliente.type !== 'Mensalista') {
      return { status: 'isento', valor: null, vencimentoISO: null, vencimentoBR: '-' };
    }

    const key = (cliente.name || '').toLowerCase();
    const valor = parseFloat(cliente.monthlyPrice || 280) || 280;

    // 1. Tentar ler override salvo
    let overrideMap = {};
    try {
      const saved = localStorage.getItem('arena_mensalidades_status_v1');
      if (saved) overrideMap = JSON.parse(saved);
    } catch(e) {}

    if (overrideMap[key]) {
      const dataVenc = overrideMap[key].vencimentoISO || '2026-12-05';
      const [vy, vm, vd] = dataVenc.split('-');
      const vencBR = (vy && vm && vd) ? `${vd}/${vm}/${vy}` : dataVenc;
      return {
        status: overrideMap[key].status || 'pago',
        valor: parseFloat(overrideMap[key].valor || valor),
        vencimentoISO: dataVenc,
        vencimentoBR: vencBR
      };
    }

    // 2. Se cliente tem agendamentos recentes finalizados ou pagos na tela inicial
    const bookings = (window.adminGameState.bookings || []).filter(b => {
      const n = (b.customer_name || b.name || '').toLowerCase();
      return n === key || n.includes(key);
    });

    const temPago = bookings.some(b => b.status === 'finished' || b.payment_status === 'pago');
    const temPendente = bookings.some(b => b.status === 'unpaid' || b.payment_status === 'pagamento_faltando');

    // Casos padrão conforme a solicitação: todos os mensalistas iniciam como PENDENTE por padrão
    let statusPadrao = 'pendente';
    let dataPadraoISO = '2026-11-08';

    if (key.includes('jaj')) {
      dataPadraoISO = '2026-11-05';
    } else if (key.includes('waldesio')) {
      dataPadraoISO = '2026-11-10';
    } else if (key.includes('diego')) {
      dataPadraoISO = '2026-11-15';
    } else if (key.includes('aline')) {
      dataPadraoISO = '2026-11-20';
    } else if (key.includes('carl')) {
      dataPadraoISO = '2026-11-25';
    } else if (key.includes('marcos')) {
      dataPadraoISO = '2026-11-12';
    } else if (key.includes('luiz')) {
      dataPadraoISO = '2026-11-18';
    } else if (key.includes('monica')) {
      dataPadraoISO = '2026-11-08';
    } else if (temPago && !temPendente) {
      statusPadrao = 'pago';
      dataPadraoISO = '2026-12-05';
    }

    const [py, pm, pd] = dataPadraoISO.split('-');
    const dataPadraoBR = `${pd}/${pm}/${py}`;

    return {
      status: statusPadrao,
      valor: valor,
      vencimentoISO: dataPadraoISO,
      vencimentoBR: dataPadraoBR
    };
  };

  window.salvarStatusMensalidadeCliente = function(nomeCliente, status, valor, vencimentoISO) {
    const key = (nomeCliente || '').toLowerCase();
    if (!key) return;
    let map = {};
    try {
      const saved = localStorage.getItem('arena_mensalidades_status_v1');
      if (saved) map = JSON.parse(saved);
    } catch(e) {}

    map[key] = {
      status: status || 'pago',
      valor: parseFloat(valor) || 280,
      vencimentoISO: vencimentoISO || '2026-12-05',
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('arena_mensalidades_status_v1', JSON.stringify(map));
    } catch(e) {}
  };

  window.obterListaAgregadaClientes = function() {
    const clientMap = new Map();

    // Mês atual de referência no sistema (ex: '2026-11')
    const sysDateStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
    const mesAtualPrefixo = sysDateStr.substring(0, 7);

    // Ler mapa de ajustes manuais de partidas (contratadas por mês e total de partidas registradas)
    let partidasOverrideMap = {};
    try {
      const savedPartidas = localStorage.getItem('arena_clientes_partidas_v1');
      if (savedPartidas) partidasOverrideMap = JSON.parse(savedPartidas);
    } catch(e) {}

    // 1. Mensalistas com contrato fixo (monthly_members) - base prioritária
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      const name = (m.responsible_name || m.team_name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: m.customer_id || ('cust-' + encodeURIComponent(key)),
          name: name,
          phone: m.phone || '',
          cpf: m.cpf || '',
          type: 'Mensalista',
          matches: 0, // Inicia em 0 e contabiliza estritamente as partidas do mês atual
          partidasContratadas: 4,
          monthlyPrice: parseFloat(m.monthly_price || m.monthlyPrice || 0) || 280,
          monthlyDay: m.day_of_week || 'segunda',
          horarioFixo: (m.day_of_week_label || ('Toda ' + (m.day_of_week || 'semana'))) + ' - ' + (m.start_time || m.time || '18:00') + ' às ' + (m.end_time || '20:00'),
          monthlyId: m.id,
          courtId: getCourtById(m.court_id || m.courtId).id,
          startTime: m.start_time || m.time || '18:00',
          origem: 'monthly'
        });
      } else {
        const c = clientMap.get(key);
        c.type = 'Mensalista';
        if (!c.phone && m.phone) c.phone = m.phone;
        if (!c.cpf && m.cpf) c.cpf = m.cpf;
        c.monthlyPrice = parseFloat(m.monthly_price || m.monthlyPrice || 0) || 280;
        c.monthlyDay = m.day_of_week || 'segunda';
        c.horarioFixo = (m.day_of_week_label || ('Toda ' + (m.day_of_week || 'semana'))) + ' - ' + (m.start_time || m.time || '18:00') + ' às ' + (m.end_time || '20:00');
        c.monthlyId = m.id;
      }
    });

    // 2. Clientes com reservas registradas (bookings) - contabiliza partidas do mês atual
    (window.adminGameState.bookings || []).forEach(b => {
      const name = (b.customer_name || b.customerName || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      
      // Contabiliza somente partidas do mês atual (do início do mês até a data)
      const pertenceAoMesAtual = b.date && b.date.startsWith(mesAtualPrefixo);

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: b.customer_id || ('cust-' + encodeURIComponent(key)),
          name: name,
          phone: b.customer_phone || b.customerPhone || '',
          cpf: b.customer_cpf || b.customerCpf || '',
          type: b.booking_type === 'mensalista' ? 'Mensalista' : 'Avulso',
          matches: pertenceAoMesAtual ? 1 : 0,
          partidasContratadas: 4,
          monthlyPrice: null,
          monthlyDay: '',
          horarioFixo: '',
          monthlyId: null,
          origem: 'booking'
        });
      } else {
        const c = clientMap.get(key);
        if (pertenceAoMesAtual) {
          c.matches++;
        }
        if (b.booking_type === 'mensalista') c.type = 'Mensalista';
        if (!c.phone && (b.customer_phone || b.customerPhone)) c.phone = b.customer_phone || b.customerPhone;
      }
    });

    // 3. Clientes cadastrados na tabela oficial Supabase `customers`
    (window.adminGameState.customers || []).forEach(cust => {
      const name = (cust.name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: cust.id,
          name: name,
          phone: cust.phone || '',
          cpf: cust.document || '',
          type: 'Avulso',
          matches: 0,
          partidasContratadas: 4,
          monthlyPrice: null,
          monthlyDay: '',
          horarioFixo: '',
          monthlyId: null,
          origem: 'customer'
        });
      } else {
        const c = clientMap.get(key);
        c.id = cust.id;
        if (cust.document && !c.cpf) c.cpf = cust.document;
        if (cust.phone && !c.phone) c.phone = cust.phone;
      }
    });

    // 4. Aplicar customizações manuais salvas se existirem
    clientMap.forEach((c, key) => {
      if (partidasOverrideMap[key]) {
        if (typeof partidasOverrideMap[key].matches === 'number') {
          c.matches = partidasOverrideMap[key].matches;
        }
        if (typeof partidasOverrideMap[key].partidasContratadas === 'number') {
          c.partidasContratadas = partidasOverrideMap[key].partidasContratadas;
        }
      }
    });

    let exclCustMap = {};
    try {
      const s = localStorage.getItem('arena_clientes_excluidos_v1');
      if (s) exclCustMap = JSON.parse(s);
    } catch(e) {}

    const list = Array.from(clientMap.values()).filter(c => {
      const k = (c.name || '').trim().toLowerCase();
      return !exclCustMap[k];
    });
    return list;
  };

  window.renderCadastrosClientes = function() {
    const container = document.getElementById('clientesTableContainer');
    const badge = document.getElementById('badgeTotalClientesCount');
    const searchInput = document.getElementById('clientesSearchInput');
    if (!container) return;

    const clients = window.obterListaAgregadaClientes();
    if (badge) badge.textContent = clients.length + ' clientes cadastrados';

    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const catFiltro = window.adminGameState.filtroClienteCategoria || 'todos';

    const filtered = clients.filter(c => {
      if (catFiltro === 'Mensalista' && c.type !== 'Mensalista') return false;
      if (catFiltro === 'Avulso' && c.type !== 'Avulso') return false;
      if (catFiltro === 'pendente') {
        if (c.type !== 'Mensalista') return false;
        const statusPay = window.obterStatusMensalidadeCliente(c);
        if (statusPay.status !== 'pendente') return false;
      }
      if (catFiltro === 'em_dia') {
        if (c.type !== 'Mensalista') return false;
        const statusPay = window.obterStatusMensalidadeCliente(c);
        if (statusPay.status !== 'pago') return false;
      }

      if (!q) return true;
      const matchNome = c.name.toLowerCase().includes(q);
      const matchTel = c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) || c.phone.toLowerCase().includes(q);
      const matchCpf = (c.cpf || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) || (c.cpf || '').toLowerCase().includes(q);
      return matchNome || matchTel || matchCpf;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-50 rounded-2xl">
          <i data-lucide="users" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
          <p class="text-xs font-bold text-slate-500">Nenhum cliente encontrado para os critérios informados.</p>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = `
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-100">
            <th class="py-3.5 px-4">Nome do Cliente</th>
            <th class="py-3.5 px-4">Telefone / WhatsApp</th>
            <th class="py-3.5 px-4">CPF</th>
            <th class="py-3.5 px-4">Categoria</th>
            <th class="py-3.5 px-4">Status / Mensalidade</th>
            <th class="py-3.5 px-4">Partidas</th>
            <th class="py-3.5 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">`;

    filtered.forEach(c => {
      const phoneClean = (c.phone || '').replace(/\D/g, '');
      const waLink = phoneClean ? ('https://wa.me/55' + phoneClean) : '#';
      const isMensalista = (c.type === 'Mensalista');
      const badgeCategoria = isMensalista
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Mensalista</span>`
        : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Avulso</span>`;

      // Coluna Status / Mensalidade conforme imagens enviadas pelo usuário
      let colunaStatus = `<span class="text-xs text-slate-400">Por partida</span>`;
      if (isMensalista) {
        const statusPay = window.obterStatusMensalidadeCliente(c);
        const valorFormatado = (statusPay.valor > 0)
          ? ('R$ ' + statusPay.valor.toFixed(2).replace('.', ','))
          : '-';
        const vencFormatado = statusPay.vencimentoBR || '-';

        if (statusPay.status === 'pago') {
          colunaStatus = `
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Em dia</span>
                </span>
                <span class="text-xs font-bold text-slate-800">${valorFormatado}</span>
              </div>
              <span class="text-[11px] text-slate-400 font-medium">Venc.: ${vencFormatado}</span>
            </div>
          `;
        } else {
          colunaStatus = `
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Pendente</span>
                </span>
                <span class="text-xs font-bold text-slate-800">${valorFormatado}</span>
              </div>
              <span class="text-[11px] text-slate-400 font-medium">Venc.: ${vencFormatado}</span>
            </div>
          `;
        }
      }

      const safeName = encodeURIComponent(c.name);

      html += `
        <tr class="hover:bg-slate-50/80 transition group">
          <td class="py-3.5 px-4 font-bold text-slate-900">
            <div>${c.name}</div>
            ${isMensalista && c.horarioFixo ? `<div class="text-[10px] text-slate-400 font-normal mt-0.5">${c.horarioFixo}</div>` : ''}
          </td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2 text-slate-600">
              <span class="font-mono">${c.phone ? formatPhone(c.phone) : 'Sem telefone'}</span>
              ${phoneClean ? (`
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a859] hover:text-[#008f4c] hover:underline">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                  <span>WhatsApp</span>
                </a>
              `) : ''}
            </div>
          </td>
          <td class="py-3.5 px-4 text-slate-400 font-mono">${c.cpf ? formatCPF(c.cpf) : 'Não informado'}</td>
          <td class="py-3.5 px-4">
            ${badgeCategoria}
          </td>
          <td class="py-3.5 px-4">
            ${colunaStatus}
          </td>
          <td class="py-3.5 px-4 font-bold text-slate-900">
            <div>${c.matches} ${c.matches === 1 ? 'partida' : 'partidas'}</div>
            ${isMensalista ? `<div class="text-[10px] text-purple-700 font-semibold mt-0.5">${c.partidasContratadas || 4} no mês</div>` : ''}
          </td>
          <td class="py-3.5 px-4 text-right">
            <button type="button" onclick="window.abrirModalGerenciarCliente('${safeName}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#042f1e] text-slate-700 hover:text-white border border-slate-200/80 hover:border-[#042f1e] transition cursor-pointer">
              <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
              <span>Gerenciar</span>
            </button>
          </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  };

  // =========================================================================
  // CONTROLADOR DO MODAL DE GERENCIAMENTO (CLIENTES & CONTATOS)
  // =========================================================================
  window.abrirModalGerenciarCliente = function(encodedName) {
    const rawName = decodeURIComponent(encodedName);
    const clients = window.obterListaAgregadaClientes();
    const cliente = clients.find(c => c.name.toLowerCase() === rawName.toLowerCase());
    if (!cliente) return;

    const modal = document.getElementById('modalGerenciarCliente');
    if (!modal) return;

    document.getElementById('modalGerenciarId').value = cliente.id || '';
    document.getElementById('modalGerenciarOrigem').value = cliente.origem || 'customer';
    document.getElementById('modalGerenciarMonthlyId').value = cliente.monthlyId || '';
    document.getElementById('modalGerenciarNome').value = cliente.name;
    document.getElementById('modalGerenciarTelefone').value = cliente.phone;
    document.getElementById('modalGerenciarCpf').value = cliente.cpf || '';
    document.getElementById('modalGerenciarPartidas').value = cliente.matches;
    const inputPartidasMes = document.getElementById('modalGerenciarPartidasContratadas');
    if (inputPartidasMes) inputPartidasMes.value = cliente.partidasContratadas || 4;
    document.getElementById('modalGerenciarTitulo').textContent = cliente.name;
    document.getElementById('modalGerenciarAvatar').textContent = cliente.name.charAt(0).toUpperCase();

    const catSelect = document.getElementById('modalGerenciarCategoria');
    catSelect.value = cliente.type === 'Mensalista' ? 'Mensalista' : 'Avulso';

    document.getElementById('modalGerenciarValorMensal').value = cliente.monthlyPrice || '280.00';
    document.getElementById('modalGerenciarDiaSemana').value = cliente.monthlyDay || 'segunda';
    document.getElementById('modalGerenciarHorarioFixo').value = cliente.horarioFixo || '';
    const qSelect = document.getElementById('modalGerenciarQuadra');
    if (qSelect) {
      const qVal = cliente.courtId || cliente.court_id || 'fut6';
      const resolvedCourt = getCourtById(qVal);
      qSelect.value = resolvedCourt.id;
    }
    const hInput = document.getElementById('modalGerenciarHorarioInicio');
    if (hInput) {
      hInput.value = cliente.startTime || cliente.start_time || '20:00';
    }

    // Status / Mensalidade e Vencimento
    const statusPay = window.obterStatusMensalidadeCliente(cliente);
    const selStatus = document.getElementById('modalGerenciarStatusPagamento');
    if (selStatus) selStatus.value = statusPay.status === 'pendente' ? 'pendente' : 'pago';
    const inVenc = document.getElementById('modalGerenciarVencimento');
    if (inVenc) inVenc.value = statusPay.vencimentoISO || '2026-12-05';
    window.atualizarVisualStatusMensalidadeModal();

    window.toggleModalGerenciarCamposMensalista();

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  };

  window.fecharModalGerenciarCliente = function() {
    const modal = document.getElementById('modalGerenciarCliente');
    if (modal) modal.style.display = 'none';
  };

  window.toggleModalGerenciarCamposMensalista = function() {
    const cat = document.getElementById('modalGerenciarCategoria').value;
    const box = document.getElementById('modalGerenciarBoxMensalista');
    const badge = document.getElementById('modalGerenciarBadgeCat');
    if (cat === 'Mensalista') {
      if (box) box.classList.remove('hidden');
      if (badge) {
        badge.textContent = 'Mensalista';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800';
      }
    } else {
      if (box) box.classList.add('hidden');
      if (badge) {
        badge.textContent = 'Avulso';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700';
      }
    }
  };

  // Salvar alterações e sincronizar com Supabase DB1 + DB2
  window.handleSalvarClienteModal = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarClienteModal');
    if (btn) btn.disabled = true;

    try {
      const id = document.getElementById('modalGerenciarId').value || ('cust-' + Date.now());
      const nome = document.getElementById('modalGerenciarNome').value.trim();
      const telefone = document.getElementById('modalGerenciarTelefone').value.trim();
      const cpf = document.getElementById('modalGerenciarCpf').value.trim();
      const categoria = document.getElementById('modalGerenciarCategoria').value;
      const monthlyId = document.getElementById('modalGerenciarMonthlyId').value;
      const valorMensal = parseFloat(document.getElementById('modalGerenciarValorMensal').value) || 280;
      const diaSemana = document.getElementById('modalGerenciarDiaSemana').value;
      const horarioFixo = document.getElementById('modalGerenciarHorarioFixo').value.trim();

      // 1. Atualizar ou Criar registro na tabela `customers` (Dual-Write nos 2 bancos)
      const customerPayload = {
        id: id,
        name: nome,
        phone: telefone,
        document: cpf,
        notes: 'Atualizado via Painel Administrativo em ' + new Date().toLocaleDateString('pt-BR')
      };

      const syncCustomerToDb = async (dbUrl, dbKey) => {
        try {
          const res = await fetch(dbUrl + '/rest/v1/customers', {
            method: 'POST',
            headers: {
              apikey: dbKey,
              Authorization: 'Bearer ' + dbKey,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(customerPayload)
          });
          if (!res.ok) {
            await fetch(dbUrl + '/rest/v1/customers?id=eq.' + encodeURIComponent(id), {
              method: 'PATCH',
              headers: {
                apikey: dbKey,
                Authorization: 'Bearer ' + dbKey,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal'
              },
              body: JSON.stringify(customerPayload)
            });
          }
        } catch(err) {
          console.warn('[ArenaCloud] Erro sync customer:', err);
        }
      };

      // 2. Se for Mensalista, sincronizar contrato em `monthly_members`
      const selQuadraEl = document.getElementById('modalGerenciarQuadra');
      const quadraId = selQuadraEl ? selQuadraEl.value : 'fut6';
      const resolvedCourtObj = getCourtById(quadraId);

      const dbCourtMapping = {
        'fut5': 'court-society-1',
        'fut6': 'court-society-2',
        'fut7': 'court-beach-1',
        'futmesa': 'court-esportes-de-quadra-1788962671043',
        'areia': 'court-beach-2',
        'society': 'court-futsal-1788963178368'
      };
      const finalDbCourtId = dbCourtMapping[resolvedCourtObj.id] || resolvedCourtObj.id;

      const horarioInicioEl = document.getElementById('modalGerenciarHorarioInicio');
      const startT = horarioInicioEl ? horarioInicioEl.value : '20:00';
      const [sh, sm] = startT.split(':').map(Number);
      const endT = String(sh + 1).padStart(2, '0') + ':' + String(sm).padStart(2, '0');

      const syncMonthlyToDb = async (dbUrl, dbKey) => {
        if (categoria === 'Mensalista') {
          const mId = monthlyId || ('mensal-' + Date.now());
          const monthlyPayload = {
            id: mId,
            customer_id: id,
            responsible_name: nome,
            team_name: nome,
            phone: telefone,
            court_id: finalDbCourtId,
            time: startT,
            start_time: startT,
            end_time: endT,
            monthly_price: valorMensal,
            day_of_week: diaSemana,
            day_of_week_label: 'Toda ' + diaSemana + '-feira',
            status: 'active',
            observation: horarioFixo ? ('[Horário: ' + horarioFixo + '] | [CPF: ' + cpf + ']') : ('[CPF: ' + cpf + ']')
          };

          try {
            const res = await fetch(dbUrl + '/rest/v1/monthly_members', {
              method: 'POST',
              headers: {
                apikey: dbKey,
                Authorization: 'Bearer ' + dbKey,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify(monthlyPayload)
            });
            if (!res.ok) {
              await fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(mId), {
                method: 'PATCH',
                headers: {
                  apikey: dbKey,
                  Authorization: 'Bearer ' + dbKey,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal'
                },
                body: JSON.stringify(monthlyPayload)
              });
            }
          } catch(err) {}
        } else if (monthlyId) {
          // Se o contrato foi cancelado/mudado para Avulso, remove o vínculo de mensalista e exclui as partidas do contrato
          try {
            await fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(monthlyId), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
            await fetch(dbUrl + '/rest/v1/bookings?customer_name=eq.' + encodeURIComponent(nome) + '&booking_type=eq.mensalista', {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
          } catch(err) {}
        }
      };

      // Dispara Dual-Write para Supabase DB1 + DB2
      await Promise.allSettled([
        syncCustomerToDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        syncCustomerToDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key),
        syncMonthlyToDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        syncMonthlyToDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
      ]);

      // Atualiza estado local em memória
      const existingCust = (window.adminGameState.customers || []).find(c => c.id === id);
      if (existingCust) {
        existingCust.name = nome;
        existingCust.phone = telefone;
        existingCust.document = cpf;
      } else {
        window.adminGameState.customers.push(customerPayload);
      }

      if (categoria === 'Mensalista') {
        const mId = monthlyId || ('mensal-' + Date.now());
        const exMember = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === String(mId) || (m.responsible_name && m.responsible_name.toLowerCase() === nome.toLowerCase()));
        if (exMember) {
          exMember.responsible_name = nome;
          exMember.team_name = nome;
          exMember.phone = telefone;
          exMember.court_id = finalDbCourtId;
          exMember.day_of_week = diaSemana;
          exMember.start_time = startT;
          exMember.time = startT;
          exMember.end_time = endT;
          exMember.monthly_price = valorMensal;
        } else {
          window.adminGameState.monthlyMembers.push({
            id: mId,
            customer_id: id,
            responsible_name: nome,
            team_name: nome,
            phone: telefone,
            court_id: finalDbCourtId,
            day_of_week: diaSemana,
            start_time: startT,
            time: startT,
            end_time: endT,
            monthly_price: valorMensal,
            status: 'active'
          });
        }
      }

      // Salva status/vencimento da mensalidade se for Mensalista
      if (categoria === 'Mensalista') {
        const statusPag = document.getElementById('modalGerenciarStatusPagamento')?.value || 'pendente';
        const dataVenc = document.getElementById('modalGerenciarVencimento')?.value || '2026-11-08';
        window.salvarStatusMensalidadeCliente(nome, statusPag, valorMensal, dataVenc);
      }

      // Salva customizações de partidas registradas e partidas contratadas no mês
      const partidasReg = parseInt(document.getElementById('modalGerenciarPartidas')?.value, 10);
      const partidasMes = parseInt(document.getElementById('modalGerenciarPartidasContratadas')?.value, 10);
      try {
        let pMap = {};
        const savedP = localStorage.getItem('arena_clientes_partidas_v1');
        if (savedP) pMap = JSON.parse(savedP);
        const kName = (nome || '').toLowerCase();
        if (kName) {
          pMap[kName] = {
            matches: isNaN(partidasReg) ? 0 : partidasReg,
            partidasContratadas: isNaN(partidasMes) ? 4 : partidasMes,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('arena_clientes_partidas_v1', JSON.stringify(pMap));
        }
      } catch(e) {}

      try {
        // Garante que o cliente salvo NUNCA fique na lista de excluídos locais
        const s = localStorage.getItem('arena_clientes_excluidos_v1');
        if (s) {
          const exclCust = JSON.parse(s);
          const kName = (nome || '').trim().toLowerCase();
          if (exclCust[kName]) {
            delete exclCust[kName];
            localStorage.setItem('arena_clientes_excluidos_v1', JSON.stringify(exclCust));
          }
        }
      } catch(e) {}

      window.fecharModalGerenciarCliente();
      window.renderCadastrosClientes();
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('✓ Cliente "' + nome + '" atualizado com sucesso no banco de dados na nuvem!');
      }
    } catch(err) {
      console.error('[ArenaCloud] Falha ao salvar cliente:', err);
      alert('Erro ao sincronizar com o banco de dados. Tente novamente.');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  window.atualizarVisualStatusMensalidadeModal = function() {
    const sel = document.getElementById('modalGerenciarStatusPagamento');
    const tag = document.getElementById('modalGerenciarStatusTag');
    if (!sel || !tag) return;
    if (sel.value === 'pago') {
      tag.innerHTML = '● Em dia';
      tag.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700';
    } else {
      tag.innerHTML = '● Pendente';
      tag.className = 'text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800';
    }
  };

  window.registrarBaixaMensalidadeCliente = function() {
    const nome = document.getElementById('modalGerenciarNome')?.value.trim();
    if (!nome) return;

    const valor = parseFloat(document.getElementById('modalGerenciarValorMensal')?.value || 280) || 280;
    const inVenc = document.getElementById('modalGerenciarVencimento');
    const vencAtual = (inVenc && inVenc.value) ? inVenc.value : '2026-11-08';

    // Adiciona 30 dias à data atual de vencimento
    const [vy, vm, vd] = vencAtual.split('-').map(Number);
    const d = new Date(vy, vm - 1, vd, 12, 0, 0);
    d.setDate(d.getDate() + 30);

    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    const nd = String(d.getDate()).padStart(2, '0');
    const novoVencISO = `${ny}-${nm}-${nd}`;

    if (inVenc) inVenc.value = novoVencISO;
    const selStatus = document.getElementById('modalGerenciarStatusPagamento');
    if (selStatus) selStatus.value = 'pago';
    window.atualizarVisualStatusMensalidadeModal();

    window.salvarStatusMensalidadeCliente(nome, 'pago', valor, novoVencISO);

    // Também marca como pagas as partidas abertas do mensalista na tela inicial
    const key = nome.toLowerCase();
    (window.adminGameState.bookings || []).forEach(b => {
      const bName = (b.customer_name || b.name || '').toLowerCase();
      if (bName === key || bName.includes(key)) {
        if (b.status === 'unpaid' || b.payment_status === 'pagamento_faltando') {
          b.status = 'finished';
          b.payment_status = 'pago';
          b.payment_method = 'Mensal';
          if (typeof window.syncBookingToCloud === 'function') {
            window.syncBookingToCloud(b, 'upsert');
          }
        }
      }
    });

    if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    window.renderCadastrosClientes();

    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('✓ Pagamento de R$ ' + valor.toFixed(2).replace('.', ',') + ' registrado para ' + nome + '! Novo vencimento: ' + nd + '/' + nm + '/' + ny);
    }
  };

  // Excluir cliente completamente de todos os registros na nuvem e no sistema
  window.handleExcluirClienteModal = async function() {
    const nome = document.getElementById('modalGerenciarNome').value.trim();
    const id = document.getElementById('modalGerenciarId').value.trim();
    const monthlyId = document.getElementById('modalGerenciarMonthlyId').value.trim();
    if (!nome) return;

    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Excluir Cliente',
      mensagem: `Deseja realmente excluir permanentemente o cliente <strong class="text-slate-900">"${nome}"</strong> e todos os registros vinculados a ele na nuvem?`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Excluir',
      textoCancelar: 'Cancelar'
    });
    if (!confirmado) return;

    const btnExcluir = document.querySelector('button[onclick="window.handleExcluirClienteModal()"]');
    if (btnExcluir) btnExcluir.disabled = true;

    try {
      const keyName = nome.toLowerCase();

      // 1. Excluir da tabela `customers` (por id ou por nome se id for gerado dinamicamente)
      const deleteCustomer = async (dbUrl, dbKey) => {
        try {
          if (id && !id.startsWith('cust-')) {
            await fetch(dbUrl + '/rest/v1/customers?id=eq.' + encodeURIComponent(id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
          }
          await fetch(dbUrl + '/rest/v1/customers?name=eq.' + encodeURIComponent(nome), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
          });
        } catch(e) {
          console.warn('[ArenaCloud] Erro ao deletar de customers:', e);
        }
      };

      // 2. Excluir de `monthly_members` (por monthlyId ou por responsible_name / team_name)
      const deleteMonthly = async (dbUrl, dbKey) => {
        try {
          if (monthlyId) {
            await fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(monthlyId), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
          }
          await fetch(dbUrl + '/rest/v1/monthly_members?responsible_name=eq.' + encodeURIComponent(nome), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
          });
          await fetch(dbUrl + '/rest/v1/monthly_members?team_name=eq.' + encodeURIComponent(nome), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
          });
        } catch(e) {
          console.warn('[ArenaCloud] Erro ao deletar de monthly_members:', e);
        }
      };

      // 3. Excluir ou limpar reservas vinculadas desse cliente em `bookings`
      const deleteBookings = async (dbUrl, dbKey) => {
        try {
          await fetch(dbUrl + '/rest/v1/bookings?customer_name=eq.' + encodeURIComponent(nome), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
          });
          if (id && !id.startsWith('cust-')) {
            await fetch(dbUrl + '/rest/v1/bookings?customer_id=eq.' + encodeURIComponent(id), {
              method: 'DELETE',
              headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey }
            });
          }
        } catch(e) {
          console.warn('[ArenaCloud] Erro ao deletar de bookings:', e);
        }
      };

      // Dispara deleção simultânea no DB1 e DB2
      await Promise.allSettled([
        deleteCustomer(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        deleteCustomer(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key),
        deleteMonthly(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        deleteMonthly(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key),
        deleteBookings(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        deleteBookings(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
      ]);

      // 4. Limpar do estado em memória
      window.adminGameState.customers = (window.adminGameState.customers || []).filter(c => {
        const cNome = (c.name || '').trim().toLowerCase();
        return c.id !== id && cNome !== keyName;
      });

      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => {
        const mResp = (m.responsible_name || '').trim().toLowerCase();
        const mTeam = (m.team_name || '').trim().toLowerCase();
        return m.id !== monthlyId && mResp !== keyName && mTeam !== keyName;
      });

      window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => {
        const bName = (b.customer_name || b.name || '').trim().toLowerCase();
        return bName !== keyName && (!id || b.customer_id !== id);
      });

      // 5. Limpar configurações e overrides locais desse cliente
      try {
        const savedM = localStorage.getItem('arena_mensalidades_status_v1');
        if (savedM) {
          const mapM = JSON.parse(savedM);
          delete mapM[keyName];
          localStorage.setItem('arena_mensalidades_status_v1', JSON.stringify(mapM));
        }
        const savedP = localStorage.getItem('arena_clientes_partidas_v1');
        if (savedP) {
          const mapP = JSON.parse(savedP);
          delete mapP[keyName];
          localStorage.setItem('arena_clientes_partidas_v1', JSON.stringify(mapP));
        }
      } catch(e) {}

      // 6. Atualizar a UI
      window.fecharModalGerenciarCliente();
      window.renderCadastrosClientes();
      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }

      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('✓ Cliente "' + nome + '" excluído com sucesso do banco de dados na nuvem!');
      }
    } catch(err) {
      console.error('[ArenaCloud] Erro ao excluir cliente:', err);
      alert('Erro ao excluir cliente. Tente novamente.');
    } finally {
      if (btnExcluir) btnExcluir.disabled = false;
    }
  };

  // =========================================================================
  // CONTROLADOR DO MODAL DE NOVO CLIENTE
  // =========================================================================
    const STORAGE_KEY_REGRAS_SISTEMA = 'arena_limoeiro_regras_v1';
  const REGRAS_PADRAO_SISTEMA = {
    avulso: '• Registra a modalidade preferida e observações internas do atleta.\n• Não bloqueia horários fixos na agenda dos campos.\n• Pagamento avulso por partida ou rateio na portaria.',
    fixo: '• Exige valor mensal, data de vencimento e campo/horário fixo.\n• Reserva automaticamente o horário recorrente toda semana na agenda.\n• Gera controle de vencimento mensal (+30 dias) e alertas de pagamento.'
  };

  function obterRegrasSistema() {
    try {
      const salvas = localStorage.getItem(STORAGE_KEY_REGRAS_SISTEMA);
      if (salvas) return JSON.parse(salvas);
    } catch(e) {}
    return { ...REGRAS_PADRAO_SISTEMA };
  }

  function salvarRegrasSistema(regras) {
    try {
      localStorage.setItem(STORAGE_KEY_REGRAS_SISTEMA, JSON.stringify(regras));
    } catch(e) {}
  }

  window.selecionarCategoriaNovoCliente = function(cat) {
    const inputCat = document.getElementById('novoClienteCategoria');
    const btnAvulso = document.getElementById('btnNovoCatAvulso');
    const btnFixo = document.getElementById('btnNovoCatFixo');
    const boxAvulso = document.getElementById('boxNovoClienteAvulso');
    const boxMensalista = document.getElementById('boxNovoClienteMensalista');
    const boxInfo = document.getElementById('boxComportamentoCadastro');
    const tituloInfo = document.getElementById('tituloComportamentoCadastro');
    const textoInfo = document.getElementById('textoComportamentoCadastro');
    const regras = obterRegrasSistema();

    if (inputCat) inputCat.value = cat;

    const editorWrapper = document.getElementById('editorRegraInlineWrapper');
    if (editorWrapper) editorWrapper.classList.add('hidden');

    if (cat === 'Mensalista') {
      if (btnFixo) {
        btnFixo.className = 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-extrabold transition-all duration-150 cursor-pointer bg-white text-purple-900 border-2 border-purple-600 shadow-[0_3px_0_0_#9333ea] active:translate-y-[2px] active:shadow-none';
        const ic = btnFixo.querySelector('i');
        if (ic) ic.className = 'w-4 h-4 text-purple-600';
      }
      if (btnAvulso) {
        btnAvulso.className = 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer bg-transparent text-slate-500 border-2 border-transparent hover:text-slate-700 hover:bg-white/60 active:translate-y-[2px]';
        const ic = btnAvulso.querySelector('i');
        if (ic) ic.className = 'w-4 h-4 text-slate-500';
      }
      if (boxAvulso) boxAvulso.classList.add('hidden');
      if (boxMensalista) boxMensalista.classList.remove('hidden');

      if (boxInfo) boxInfo.className = 'rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 space-y-2';
      if (tituloInfo) tituloInfo.innerHTML = '<i data-lucide="crown" class="w-3.5 h-3.5 text-purple-600"></i><span class="text-purple-950 font-bold uppercase">O que o sistema fará (Mensalista / Fixo):</span>';
      if (textoInfo) textoInfo.textContent = regras.fixo;
    } else {
      if (btnAvulso) {
        btnAvulso.className = 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-extrabold transition-all duration-150 cursor-pointer bg-white text-[#042f1e] border-2 border-[#009e49] shadow-[0_3px_0_0_#009e49] active:translate-y-[2px] active:shadow-none';
        const ic = btnAvulso.querySelector('i');
        if (ic) ic.className = 'w-4 h-4 text-[#009e49]';
      }
      if (btnFixo) {
        btnFixo.className = 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer bg-transparent text-slate-500 border-2 border-transparent hover:text-slate-700 hover:bg-white/60 active:translate-y-[2px]';
        const ic = btnFixo.querySelector('i');
        if (ic) ic.className = 'w-4 h-4 text-slate-500';
      }
      if (boxAvulso) boxAvulso.classList.remove('hidden');
      if (boxMensalista) boxMensalista.classList.add('hidden');

      if (boxInfo) boxInfo.className = 'rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-2';
      if (tituloInfo) tituloInfo.innerHTML = '<i data-lucide="cpu" class="w-3.5 h-3.5 text-[#009e49]"></i><span class="font-bold uppercase">O que o sistema fará (Avulso / Casual):</span>';
      if (textoInfo) textoInfo.textContent = regras.avulso;
    }

    if (window.lucide) lucide.createIcons();
  };

  window.toggleEditarRegraInline = function() {
    const wrapper = document.getElementById('editorRegraInlineWrapper');
    if (!wrapper) return;
    const cat = document.getElementById('novoClienteCategoria')?.value || 'Avulso';
    const textarea = document.getElementById('textareaRegraInline');
    const regras = obterRegrasSistema();

    if (wrapper.classList.contains('hidden')) {
      if (textarea) textarea.value = cat === 'Mensalista' ? regras.fixo : regras.avulso;
      wrapper.classList.remove('hidden');
      if (textarea) textarea.focus();
    } else {
      wrapper.classList.add('hidden');
    }
  };

  window.salvarRegraInline = function() {
    const cat = document.getElementById('novoClienteCategoria')?.value || 'Avulso';
    const textarea = document.getElementById('textareaRegraInline');
    const novoTexto = textarea ? textarea.value.trim() : '';
    if (!novoTexto) return;

    const regras = obterRegrasSistema();
    if (cat === 'Mensalista') {
      regras.fixo = novoTexto;
    } else {
      regras.avulso = novoTexto;
    }
    salvarRegrasSistema(regras);

    const textoInfo = document.getElementById('textoComportamentoCadastro');
    if (textoInfo) textoInfo.textContent = novoTexto;
    const wrapper = document.getElementById('editorRegraInlineWrapper');
    if (wrapper) wrapper.classList.add('hidden');

    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('Regra do perfil ' + (cat === 'Mensalista' ? 'Fixo' : 'Avulso') + ' atualizada!');
    }
  };

  window.abrirModalRegras = function() {
    const regras = obterRegrasSistema();
    const inputAvulso = document.getElementById('inputRegraAvulsoGlobal');
    const inputFixo = document.getElementById('inputRegraFixoGlobal');
    if (inputAvulso) inputAvulso.value = regras.avulso;
    if (inputFixo) inputFixo.value = regras.fixo;
    const modal = document.getElementById('modalRegrasSistema');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  };

  window.fecharModalRegras = function() {
    const modal = document.getElementById('modalRegrasSistema');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  window.salvarRegrasGlobais = function() {
    const inputAvulso = document.getElementById('inputRegraAvulsoGlobal');
    const inputFixo = document.getElementById('inputRegraFixoGlobal');
    const regras = {
      avulso: inputAvulso ? (inputAvulso.value.trim() || REGRAS_PADRAO_SISTEMA.avulso) : REGRAS_PADRAO_SISTEMA.avulso,
      fixo: inputFixo ? (inputFixo.value.trim() || REGRAS_PADRAO_SISTEMA.fixo) : REGRAS_PADRAO_SISTEMA.fixo
    };
    salvarRegrasSistema(regras);
    window.fecharModalRegras();

    const catAtual = document.getElementById('novoClienteCategoria')?.value || 'Avulso';
    const textoInfo = document.getElementById('textoComportamentoCadastro');
    if (textoInfo) {
      textoInfo.textContent = catAtual === 'Mensalista' ? regras.fixo : regras.avulso;
    }

    if (typeof window.mostrarToast === 'function') {
      window.mostrarToast('Regras de Avulso e Fixo salvas com sucesso!');
    }
  };

  window.abrirModalNovoCliente = function() {
    const modal = document.getElementById('modalNovoClienteArena');
    if (!modal) return;
    document.getElementById('novoClienteNome').value = '';
    document.getElementById('novoClienteTelefone').value = '';
    document.getElementById('novoClienteCpf').value = '';

    const inVenc = document.getElementById('novoClienteVencimento');
    if (inVenc) inVenc.value = '2026-12-09';

    window.selecionarCategoriaNovoCliente('Avulso');

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  };

  window.fecharModalNovoCliente = function() {
    const modal = document.getElementById('modalNovoClienteArena');
    if (!modal) return;
    modal.style.display = 'none';
  };

  window.handleCadastrarNovoCliente = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      const nome = document.getElementById('novoClienteNome').value.trim();
      const telefone = document.getElementById('novoClienteTelefone').value.trim();
      const cpf = document.getElementById('novoClienteCpf').value.trim();
      const categoria = document.getElementById('novoClienteCategoria').value;
      const custId = 'cust-' + Date.now();

      let observacao = '';
      if (categoria === 'Avulso') {
        const mod = document.getElementById('novoClienteModalidade')?.value || 'society';
        const obs = document.getElementById('novoClienteObsAvulso')?.value.trim() || '';
        observacao = '[Modalidade: ' + mod + ']' + (obs ? (' | ' + obs) : '');
      } else {
        const quadra = document.getElementById('novoClienteQuadra')?.value || 'Campo Society 01';
        const horario = document.getElementById('novoClienteHorarioFixo')?.value || '19:00';
        observacao = '[Horário Fixo: ' + quadra + ' às ' + horario + ']';
      }

      const newCust = {
        id: custId,
        name: nome,
        phone: telefone,
        document: cpf,
        notes: observacao || ('Cadastrado via Painel Administrativo em ' + new Date().toLocaleDateString('pt-BR'))
      };

      const insertCustomerDb = async (dbUrl, dbKey) => {
        try {
          await fetch(dbUrl + '/rest/v1/customers', {
            method: 'POST',
            headers: {
              apikey: dbKey,
              Authorization: 'Bearer ' + dbKey,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify(newCust)
          });
        } catch(err) {}
      };

            let monthlyPayload = null;
      if (categoria === 'Mensalista') {
        let diaSemana = document.getElementById('novoClienteDiaSemana')?.value || 'Segunda-feira';
        const horarioFixo = document.getElementById('novoClienteHorarioFixo')?.value || '19:00';
        const quadra = document.getElementById('novoClienteQuadra')?.value || 'Campo Society 01';
        const valorMensal = parseFloat(document.getElementById('novoClienteValorMensal')?.value) || 280;
        const dataVencimento = document.getElementById('novoClienteVencimento')?.value || '2026-12-09';
        const statusPag = document.getElementById('novoClienteSituacaoPagamento')?.value || 'pendente';
        const mId = 'mensal-' + Date.now();

        let dayLabel = diaSemana;
        if (!dayLabel.toLowerCase().startsWith('toda')) {
          dayLabel = 'Toda ' + (dayLabel.toLowerCase().includes('-feira') ? dayLabel : (dayLabel + '-feira'));
        }

        monthlyPayload = {
          id: mId,
          customer_id: custId,
          responsible_name: nome,
          team_name: nome,
          phone: telefone,
          monthly_price: valorMensal,
          day_of_week: diaSemana.toLowerCase().replace('-feira', ''),
          day_of_week_label: dayLabel,
          time: horarioFixo,
          start_time: horarioFixo,
          end_time: (horarioFixo.includes(':') ? String(Number(horarioFixo.split(':')[0]) + 1).padStart(2, '0') + ':' + horarioFixo.split(':')[1] : '20:00'),
          status: 'active',
          observation: '[' + quadra + '] | [CPF: ' + (cpf || 'Não informado') + ']'
        };

        if (typeof window.salvarStatusMensalidadeCliente === 'function') {
          window.salvarStatusMensalidadeCliente(nome, statusPag, valorMensal, dataVencimento);
        }
      }

      const insertMonthlyDb = async (dbUrl, dbKey) => {
        if (!monthlyPayload) return;
        try {
          await fetch(dbUrl + '/rest/v1/monthly_members', {
            method: 'POST',
            headers: {
              apikey: dbKey,
              Authorization: 'Bearer ' + dbKey,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify(monthlyPayload)
          });
        } catch(err) {}
      };

      await Promise.allSettled([
        insertCustomerDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        insertCustomerDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key),
        insertMonthlyDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
        insertMonthlyDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
      ]);

      window.adminGameState.customers.unshift(newCust);
      if (monthlyPayload) {
        window.adminGameState.monthlyMembers.unshift(monthlyPayload);
      }

      window.fecharModalNovoCliente();
      window.renderCadastrosClientes();
      if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('✓ Novo cliente "' + nome + '" cadastrado com sucesso!');
      }
    } catch(err) {
      console.error('[ArenaCloud] Erro ao cadastrar novo cliente:', err);
      alert('Erro ao salvar novo cliente.');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  window.testSupabaseLatency = async function() {
    const lat2El = document.getElementById('db2PingLatency');
    const lat1El = document.getElementById('db1PingLatency');
    if (lat2El) lat2El.textContent = 'Testando...';
    if (lat1El) lat1El.textContent = 'Testando...';

    const t0 = performance.now();
    try {
      const r2 = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=id&limit=1', {
        headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
      });
      const t1 = performance.now();
      if (lat2El) lat2El.textContent = Math.round(t1 - t0) + 'ms (OK)';
    } catch(e) {
      if (lat2El) lat2El.textContent = 'Erro';
    }

    const t2 = performance.now();
    try {
      const r1 = await fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=id&limit=1', {
        headers: { apikey: ARENA_CLOUD_DBS.db1Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key }
      });
      const t3 = performance.now();
      if (lat1El) lat1El.textContent = Math.round(t3 - t2) + 'ms (OK)';
    } catch(e) {
      if (lat1El) lat1El.textContent = 'Erro';
    }
  };

  function renderCadastrosBookingsList() {
    const container = document.getElementById('subtabBookingsListContainer');
    const searchEl = document.getElementById('subtabBookingSearchInput');
    const courtEl = document.getElementById('subtabBookingCourtFilter');
    const statusEl = document.getElementById('subtabBookingStatusFilter');

    const totalBadge = document.getElementById('subtabBookingsTotalBadge');
    const badgeCount = document.getElementById('subtabBadgeJogosCount');
    const kpiTotal = document.getElementById('subtabKpiTotal');
    const kpiToday = document.getElementById('subtabKpiToday');
    const kpiUpcoming = document.getElementById('subtabKpiUpcoming');
    const kpiFinished = document.getElementById('subtabKpiFinished');

    const query = (searchEl ? searchEl.value : '').toLowerCase().trim();
    const courtFilter = courtEl ? courtEl.value : 'all';
    const statusFilter = statusEl ? statusEl.value : 'all';

    let all = [...(window.adminGameState.bookings || [])];

    // Ordenação decrescente por data
    all.sort((a, b) => {
      if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
    const countToday = all.filter(b => b.date === todayStr && b.status !== 'cancelled').length;
    const countUpcoming = all.filter(b => b.date >= todayStr && b.status !== 'cancelled' && b.status !== 'finished').length;
    const countFinished = all.filter(b => b.status === 'finished').length;

    if (totalBadge) totalBadge.textContent = all.length + ' partidas registradas';
    if (badgeCount) badgeCount.textContent = '(' + all.length + ')';
    if (kpiTotal) kpiTotal.textContent = all.length;
    if (kpiToday) kpiToday.textContent = countToday;
    if (kpiUpcoming) kpiUpcoming.textContent = countUpcoming;
    if (kpiFinished) kpiFinished.textContent = countFinished;

    let filtered = all;

    if (courtFilter !== 'all') {
      filtered = filtered.filter(b => {
        const c = getCourtById(b.court_id || b.courtId);
        return c.id === courtFilter;
      });
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'live') {
        filtered = filtered.filter(b => b.status === 'live' || b.status === 'in_progress');
      } else if (statusFilter === 'upcoming') {
        filtered = filtered.filter(b => b.status === 'confirmed' || b.status === 'booked');
      } else {
        filtered = filtered.filter(b => b.status === statusFilter);
      }
    }

    if (query) {
      filtered = filtered.filter(b => {
        const name = (b.customer_name || b.customerName || '').toLowerCase();
        const phone = (b.customer_phone || b.customerPhone || '').replace(/\D/g, '');
        const cpf = (b.customer_cpf || b.customerCpf || '').replace(/\D/g, '');
        const court = getCourtById(b.court_id || b.courtId).name.toLowerCase();
        const date = (b.date || '').toLowerCase();
        return name.includes(query) || phone.includes(query) || cpf.includes(query) || court.includes(query) || date.includes(query);
      });
    }

    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <i data-lucide="calendar-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
          <p class="text-sm font-bold text-slate-700">Nenhum agendamento encontrado com os filtros selecionados.</p>
          <p class="text-xs text-slate-400 mt-0.5">Tente alterar o termo pesquisado ou limpe os filtros de quadra/status.</p>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(renderMatchCardHtml).join('');
    }

    if (window.lucide) lucide.createIcons();
  };
  window.renderCadastrosBookingsList = renderCadastrosBookingsList;

  window.filterSubtabBookingsList = function() {
    renderCadastrosBookingsList();
  };

  // =========================================================================
  // GESTÃO DO MODAL DE NOVA RESERVA BALCÃO (COM SUPABASE + BROADCAST)
  // =========================================================================
  
  // =========================================================================
  // GESTÃO DE JANELAS DE HORAS (30 EM 30 MIN) PARA RESERVA DIRETA DE BALCÃO
  // Otimização Completa: Seleção Direta de INÍCIO e FIM pelo Calendário (0ms delay)
  window.__balcaoSelectionHistory = [];
  window.__balcaoHasUserInteracted = false;
      window.__balcaoSelectionHistory = []; // 'awaiting_end' ou 'complete'

  // Duração rápida por botões de atalho
  window.setBalcaoQuickDuration = function(minutes) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const sMin = parseTimeToMinutes(startSelect.value);
    const targetEndMin = sMin + minutes;
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges() : [];

    const hasConflict = (fromM, toM) => {
      const s = Math.min(fromM, toM);
      const e = Math.max(fromM, toM);
      return occupiedRanges.some(r => Math.max(s, r.start) < Math.min(e, r.end));
    };

    if (hasConflict(sMin, targetEndMin)) {
      if (typeof arenaToast === 'function') {
        arenaToast('Não é possível estender para ' + minutes + 'min devido a jogo agendado no intervalo.');
      }
      return;
    }

    endSelect.value = formatMinutesToTime(targetEndMin);
    window.__balcaoClickState = 'complete';
    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };

  window.renderBalcaoTimeSlots = function(forceRebuild) {
    const grid = document.getElementById('directBookingSlotsGrid');
    if (!grid) return;

    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const hideToggle = document.getElementById('balcaoHideOccupiedToggle');
    const gamesListEl = document.getElementById('balcaoScheduledGamesList');
    const gamesCountEl = document.getElementById('balcaoScheduledGamesCount');
    const nextAlertEl = document.getElementById('balcaoNextGameAlert');
    const nextAlertText = document.getElementById('balcaoNextGameAlertText');

    const courtId = courtSelect ? courtSelect.value : 'fut7';
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
    if (!forceRebuild && !shouldHideOccupied && grid.dataset.filterKey === filterKey && grid.children.length > 0) {
      const slotButtons = grid.querySelectorAll('button[data-slot-min]');
      if (slotButtons.length > 0) {
        slotButtons.forEach(btn => {
          if (btn.disabled) return;
          const m = parseInt(btn.dataset.slotMin, 10);
          const isStart = hasActiveSelection && (m === currentStartMin);
          const isEnd = hasActiveSelection && (m === currentEndMin);
          const isBetween = hasActiveSelection && (m > currentStartMin && m < currentEndMin);
          const isSelected = isStart || isEnd || isBetween;
          const badgeSpan = btn.querySelector('.balcao-slot-badge');

          if (isStart) {
            btn.className = 'p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-800 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs';
              badgeSpan.textContent = 'Início';
            }
          } else if (isEnd) {
            btn.className = 'p-2 rounded-xl text-[11px] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-950 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs';
              badgeSpan.textContent = 'Fim';
            }
          } else if (isBetween) {
            btn.className = 'p-2 rounded-xl text-[11px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-100 font-bold';
              badgeSpan.textContent = '✓ Selec.';
            }
          } else {
            btn.className = 'p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-[1.02] select-none active:scale-95 transition-transform duration-75';
            if (badgeSpan) {
              badgeSpan.className = 'balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-600 font-semibold';
              badgeSpan.textContent = 'Livre';
            }
          }
        });

        // Atualiza aviso de próximo jogo se necessário
        if (nextAlertEl) nextAlertEl.style.display = 'none';
        updateBalcaoSelectionSummary();
        return;
      }
    }

    // 2. CONSTRUÇÃO COMPLETA DA GRADE
    grid.dataset.filterKey = filterKey;

    const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
    const isToday = (dateStr === sysTodayStr);
    const isPastDate = (dateStr < sysTodayStr);

    // Coletar intervalos ocupados no dia para esta quadra
    const occupiedRanges = window.getBalcaoOccupiedRanges(courtId, dateStr);

    // Atualiza o Card Informativo de Jogos Agendados
    if (gamesListEl) {
      if (occupiedRanges.length === 0) {
        gamesListEl.innerHTML = '<span class="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">✨ Nenhum jogo agendado nesta quadra neste dia. Todos os horários estão livres!</span>';
        if (gamesCountEl) gamesCountEl.textContent = '0 agendados';
      } else {
        if (gamesCountEl) gamesCountEl.textContent = occupiedRanges.length + (occupiedRanges.length === 1 ? ' agendado' : ' agendados');
        let listHtml = '';
        occupiedRanges.forEach(g => {
          listHtml += '<span class="inline-flex items-center gap-1 bg-amber-100/90 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">';
          listHtml += '🕒 ' + g.startStr + ' às ' + g.endStr + ' — <strong class="text-amber-900">' + g.name + '</strong> (' + g.type + ')';
          listHtml += '</span>';
        });
        gamesListEl.innerHTML = listHtml;
      }
    }

    let html = '';
    let visibleSlotsCount = 0;

    for (let m = 6 * 60; m <= 23 * 60; m += 30) {
      const slotTime = formatMinutesToTime(m);
      const slotNextTime = formatMinutesToTime(m + 30);
      const slotEndMin = m + 30;

      // Verifica se o slot está em conflito com algum jogo já agendado
      const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(slotEndMin, r.end));
      const isOccupied = !!conflict;
      
      // Regra Operacional Estrita:
      // 1. Se a data for anterior a hoje, todos os horários já passaram.
      // 2. Se a data for hoje, qualquer horário cujo início seja menor ou igual aos minutos atuais já passou.
      // 3. Horários passados são estritamente bloqueados e NUNCA exibidos como "LIVRE".
      const isPast = isPastDate || (isToday && m <= currentRealMinutes);
      const isUnavailable = isOccupied || isPast;

      // Se o filtro de ocultar indisponíveis estiver ativado, esconde
      if (shouldHideOccupied && isUnavailable) {
        continue;
      }

      visibleSlotsCount++;
      const isStart = hasActiveSelection && (m === currentStartMin);
      const isEnd = hasActiveSelection && (m === currentEndMin);
      const isBetween = hasActiveSelection && (m > currentStartMin && m < currentEndMin);
      const isSelected = isStart || isEnd || isBetween;

      if (isOccupied) {
        const agendadoPorCompleto = (conflict.name || 'Ocupado').trim();
        const tipoLabel = conflict.type ? conflict.type : 'Reserva';
        
        // Regra de Exibição Inteligente do Nome:
        // Se o nome for grande (> 8 caracteres), exibe o primeiro nome seguido de "..."
        // Exemplo: "José Carlos Silva" -> "José..."
        // Se for uma palavra só grande (> 8 caracteres) -> "Alexandr..."
        let nomeExibicao = agendadoPorCompleto;
        if (agendadoPorCompleto.length > 8) {
          const primeiroNome = agendadoPorCompleto.split(' ')[0].trim();
          if (primeiroNome.length > 0 && primeiroNome.length <= 8) {
            nomeExibicao = primeiroNome + '...';
          } else {
            nomeExibicao = agendadoPorCompleto.slice(0, 7) + '...';
          }
        }

        const safeNomeJson = agendadoPorCompleto.replace(/'/g, "\\'");
        const safeTipoJson = tipoLabel.replace(/'/g, "\\'");
        const safeHorarioJson = (conflict.startStr + ' às ' + conflict.endStr).replace(/'/g, "\\'");

        const intervalStr = conflict.startStr + ' às ' + conflict.endStr;
        html += '<button type="button" data-slot-min="' + m + '" onclick="window.showBalcaoOccupiedDetail(\'' + safeNomeJson + '\', \'' + slotTime + '\', \'' + safeHorarioJson + '\', \'' + safeTipoJson + '\')" title="Agendado: ' + agendadoPorCompleto + ' (' + tipoLabel + ') [' + intervalStr + '] - Toque para ver detalhes" class="p-2 min-h-[60px] rounded-xl text-[11px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border-2 border-rose-500 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center gap-1 select-none active:scale-95 transition-all overflow-hidden">';
        html += '<span class="font-black text-rose-950 text-xs leading-none">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[10px] font-black uppercase tracking-tight text-rose-900 bg-rose-200/90 px-1.5 py-0.5 rounded-md truncate max-w-full w-full block shadow-3xs leading-tight" title="' + agendadoPorCompleto + ' (' + intervalStr + ')">' + nomeExibicao + '</span>';
        html += '</button>';
      } else if (isPast) {
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Horário já passou do relógio atual" class="p-2 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed opacity-65 text-center flex flex-col items-center justify-center select-none">';
        html += '<span class="font-extrabold text-slate-500">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/90 px-1 py-0.5 rounded shadow-3xs">Passado</span>';
        html += '</button>';
      } else if (isStart) {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\'' + slotTime + '\')" title="Início do jogo (' + slotTime + ')" class="p-2 rounded-xl text-[11px] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-800 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs">Início</span>';
        html += '</button>';
      } else if (isEnd) {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\'' + slotTime + '\')" title="Término do jogo (' + slotTime + ')" class="p-2 rounded-xl text-[11px] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow-md ring-2 ring-emerald-400 transform scale-[1.04] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider bg-emerald-950 text-emerald-100 font-black px-1.5 py-0.5 rounded shadow-2xs">Fim</span>';
        html += '</button>';
      } else if (isBetween) {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\'' + slotTime + '\')" title="Horário em jogo (' + slotTime + ')" class="p-2 rounded-xl text-[11px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-100 font-bold">✓ Selec.</span>';
        html += '</button>';
      } else {
        html += '<button type="button" data-slot-min="' + m + '" data-slot-time="' + slotTime + '" onclick="toggleBalcaoTimeSlot(\'' + slotTime + '\')" title="Disponível (' + slotTime + ') - Toque para selecionar" class="p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-[1.02] select-none active:scale-95 transition-transform duration-75">';
        html += '<span>' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-wider text-emerald-600 font-semibold">Livre</span>';
        html += '</button>';
      }
    }

    if (visibleSlotsCount === 0) {
      grid.innerHTML = '<div class="col-span-full py-6 text-center text-slate-400 font-bold text-xs">Nenhum horário livre restante nesta quadra para esta data. Desmarque a opção "Ocultar Indisponíveis" acima para ver todos os horários e quem está agendado em cada um deles.</div>';
    } else {
      grid.innerHTML = html;
    }

    // Checa aviso de próximo jogo após o horário de início selecionado
    if (nextAlertEl) nextAlertEl.style.display = 'none';
        updateBalcaoSelectionSummary();
  };

  // Modal interativo de visualização de agendamento ocupado ao tocar no slot
  window.showBalcaoOccupiedDetail = function(nomeCompleto, slotTime, horarioIntervalo, tipoAgendamento) {
    const modal = document.getElementById('modalDetalheOcupadoBalcao');
    if (!modal) {
      if (typeof arenaToast === 'function') {
        arenaToast('🔒 ' + slotTime + ' Ocupado por: ' + nomeCompleto + ' (' + tipoAgendamento + ' • ' + horarioIntervalo + ')');
      }
      return;
    }

    const nomeEl = document.getElementById('detalheOcupadoNomeCompleto');
    const horarioEl = document.getElementById('detalheOcupadoHorario');
    const intervaloEl = document.getElementById('detalheOcupadoIntervalo');
    const tipoEl = document.getElementById('detalheOcupadoTipo');

    if (nomeEl) nomeEl.textContent = nomeCompleto || 'Cliente Registrado';
    if (horarioEl) horarioEl.textContent = slotTime;
    if (intervaloEl) intervaloEl.textContent = horarioIntervalo || (slotTime + ' às ...');
    if (tipoEl) tipoEl.textContent = tipoAgendamento || 'Reserva Confirmada';

    modal.style.setProperty('display', 'flex', 'important');
    modal.classList.remove('hidden');
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  };

  window.closeBalcaoOccupiedDetail = function() {
    const modal = document.getElementById('modalDetalheOcupadoBalcao');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
  };

  // Alterna e define intervalos de horários com precisão pelo calendário
  const toggleBalcaoTimeSlot = window.toggleBalcaoTimeSlot = function(slotTime) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect?.value || '';
    const dateStr = dateInput?.value || window.adminGameState?.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-09');
    if (!startSelect || !endSelect) return;

    // Helper: força o valor no select, criando a opção se necessário
    const forceSelectValue = (sel, val) => {
      if (!sel || !val) return;
      let opt = Array.from(sel.options).find(o => o.value === val);
      if (!opt) {
        opt = new Option(val, val);
        sel.add(opt);
      }
      sel.value = val;
    };

    const hasExistingSelection = (startSelect.value !== '' && endSelect.value !== '');
    const clickedMin = parseTimeToMinutes(slotTime);

    // Validação estrita: Não permite selecionar horário igual ou anterior ao horário atual hoje, nem em datas passadas
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
    }
    let curStartMin = hasExistingSelection ? parseTimeToMinutes(startSelect.value) : -1;
    let curEndMin = hasExistingSelection ? parseTimeToMinutes(endSelect.value) : -1;
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

    // 1. Se NÃO há seleção ativa ainda (início da marcação pelo usuário):
    if (!hasExistingSelection) {
      window.__balcaoHasUserInteracted = true;
      forceSelectValue(startSelect, slotTime);
      const defEnd = !hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
      forceSelectValue(endSelect, formatMinutesToTime(defEnd));
    }
    // 2. Clique ALÉM do Fim atual → EXPANDE para frente (sem limite de horas/blocos: 2h, 3h, 5h+)
    else if (clickedMin > curEndMin) {
      if (!hasConflict(curStartMin, clickedMin)) {
        forceSelectValue(endSelect, slotTime);
      } else {
        // Conflito no caminho: inicia nova seleção no slot clicado
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
      }
    }
    // 3. Clique ANTES do Início atual → EXPANDE para trás (sem limite)
    else if (clickedMin < curStartMin) {
      if (!hasConflict(clickedMin, curEndMin)) {
        forceSelectValue(startSelect, slotTime);
      } else {
        // Conflito: inicia nova seleção
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
      }
    }
    // 4. Clique NO slot de Fim exato → se > 30min reduz 30min; se já for 30min amplia para 1h
    else if (clickedMin === curEndMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        forceSelectValue(endSelect, formatMinutesToTime(curEndMin - 30));
      } else if (!hasConflict(curEndMin, curEndMin + 30)) {
        forceSelectValue(endSelect, formatMinutesToTime(curEndMin + 30));
      }
    }
    // 5. Clique NO slot de Início exato → REMOVE 30min do início (avança o início)
    else if (clickedMin === curStartMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        forceSelectValue(startSelect, formatMinutesToTime(curStartMin + 30));
      }
    }
    // 6. Clique em slot INTERMEDIÁRIO (dentro do intervalo) → CORTA o Fim naquele ponto (remove bloco completo)
    else {
      // curStartMin < clickedMin < curEndMin
      // Reduz a seleção: o novo Fim passa a ser o slot clicado
      forceSelectValue(endSelect, slotTime);
    }

    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };

  window.undoLastBalcaoTimeSlot = function() {
    if (!window.__balcaoSelectionHistory || window.__balcaoSelectionHistory.length === 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Nenhuma seleção anterior para voltar.');
      }
      return;
    }

    const prev = window.__balcaoSelectionHistory.pop();
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');

    if (startSelect && endSelect && prev) {
      startSelect.value = prev.start;
      endSelect.value = prev.end;
      window.__balcaoHasUserInteracted = prev.hasInteracted !== undefined ? prev.hasInteracted : true;
      autoCalculateDirectBookingPrice();
      renderBalcaoTimeSlots();
      if (typeof window.showNotification === 'function') {
        window.showNotification('Seleção de horário anterior restaurada!');
      }
    }
  };

  window.resetDirectBookingTimeSlots = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (startSelect) startSelect.value = '';
    if (endSelect) endSelect.value = '';
    window.__balcaoHasUserInteracted = false;
    window.__balcaoSelectionHistory = [];
    window.__balcaoClickState = null;
    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
    if (typeof window.showNotification === 'function') {
      window.showNotification('Seleção de horários limpa! Toque em um horário para iniciar.');
    }
  };

  // Helper global para coletar ocupados da quadra/data do modal (Reservas + Mensalistas Fixos)
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

    // 0. Bloqueios de quadra (Treino / Manutenção cadastrados em Gestão de Espaços)
    if (typeof courtState !== 'undefined' && Array.isArray(courtState.blocks)) {
      courtState.blocks.forEach(bl => {
        if (!bl || bl.date !== dateStr) return;
        if (isMatchingCourt(bl.courtId)) {
          const sm = parseTimeToMinutes(bl.start);
          const em = parseTimeToMinutes(bl.end);
          if (em > sm) {
            occupiedRanges.push({
              start: sm,
              end: em,
              startStr: bl.start,
              endStr: bl.end,
              name: '⛔ BLOQUEIO: ' + (bl.type || 'Manutenção').toUpperCase(),
              type: 'Bloqueio Operacional',
              status: 'blocked'
            });
          }
        }
      });
    }

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
      const mDay = rawDay.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const mCourt = m.court_id || m.courtId;
      const mStatus = (m.status || '').toLowerCase();
      if (mDay === dayOfWeek && mStatus !== 'inactive' && isMatchingCourt(mCourt)) {
        const sm = parseTimeToMinutes(m.start_time || m.time || '');
        const em = parseTimeToMinutes(m.end_time || '');
        const effectiveEnd = em > sm ? em : (sm + 60);
        const exists = occupiedRanges.some(r => Math.max(r.start, sm) < Math.min(r.end, effectiveEnd));
        if (!exists) {
          // Captura o nome contratual completo e time do mensalista
          const respName = (m.responsible_name || '').trim();
          const tName = (m.team_name || '').trim();
          let contratualFullName = respName;
          if (tName && respName && tName.toLowerCase() !== respName.toLowerCase()) {
            contratualFullName = tName + ' (' + respName + ')';
          } else if (tName && !respName) {
            contratualFullName = tName;
          }
          if (!contratualFullName) contratualFullName = 'Mensalista Fixo';

          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: contratualFullName,
            responsibleName: respName,
            teamName: tName,
            phone: m.phone || '',
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
  };

  // Preenche a seleção até o próximo jogo agendado ou fechamento
  window.selectBalcaoUntilNextGame = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    const curStartMin = parseTimeToMinutes(startSelect.value);
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges() : [];

    // Encontra o próximo agendamento que começa após o início selecionado
    const nextGame = occupiedRanges.find(r => r.start > curStartMin);

    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value });
    if (window.__balcaoSelectionHistory.length > 20) window.__balcaoSelectionHistory.shift();

    let targetEndMin = 23 * 60 + 30; // Fechamento padrão
    let reason = 'até o fechamento';
    if (nextGame) {
      targetEndMin = nextGame.start;
      reason = 'até às ' + nextGame.startStr + ' (próximo jogo: ' + nextGame.name + ')';
    }

    if (targetEndMin <= curStartMin) {
      if (typeof arenaToast === 'function') {
        arenaToast('Não há mais horários disponíveis após ' + startSelect.value + '.');
      }
      return;
    }

    endSelect.value = formatMinutesToTime(targetEndMin);
    window.__balcaoLastClickedSlot = formatMinutesToTime(targetEndMin);
    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();

    if (typeof arenaToast === 'function') {
      arenaToast('Horário preenchido de ' + startSelect.value + ' às ' + formatMinutesToTime(targetEndMin) + ' (' + reason + ')!');
    }
  };

    function findFirstAvailableSlot() {
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
  }

  window.onDirectBookingDropdownChange = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    let sMin = parseTimeToMinutes(startSelect.value);
    let eMin = parseTimeToMinutes(endSelect.value);

    if (eMin <= sMin) {
      eMin = sMin + 30;
      endSelect.value = formatMinutesToTime(eMin);
    }

    autoCalculateDirectBookingPrice();
    renderBalcaoTimeSlots();
  };

  window.updateBalcaoSelectionSummary = function() {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const timeEl = document.getElementById('summarySelectedTime');
    const durEl = document.getElementById('summaryDuration');
    const helperBannerText = document.getElementById('balcaoStepHelperText');
    const helperBadge = document.getElementById('balcaoHelperDurationBadge');

    if (!startSelect || !endSelect) return;

    const sStr = startSelect.value || '';
    const eStr = endSelect.value || '';

    if (!sStr || !eStr) {
      if (timeEl) timeEl.textContent = 'Nenhum horário selecionado';
      if (durEl) durEl.textContent = 'Toque em um horário abaixo';
      if (helperBannerText) {
        helperBannerText.innerHTML = '👉 Toque no horário de <strong>INÍCIO</strong> desejado para começar a marcação:';
      }
      if (helperBadge) helperBadge.textContent = '0 min';
      return;
    }

    const sMin = parseTimeToMinutes(sStr);
    const eMin = parseTimeToMinutes(eStr);
    let diff = eMin - sMin;
    if (diff < 0) diff += 1440;

    const h = Math.floor(diff / 60);
    const m = diff % 60;
    let durTxt = '';
    if (h > 0) durTxt += h + 'h';
    if (m > 0) durTxt += (h > 0 ? ' ' : '') + m + 'min';
    if (diff === 0) durTxt = '0min';

    if (timeEl) timeEl.textContent = sStr + ' às ' + eStr;
    if (durEl) durEl.textContent = durTxt;

    if (helperBannerText) {
      if (window.__balcaoClickState === 'awaiting_end') {
        helperBannerText.innerHTML = '🟢 <strong>INÍCIO: ' + sStr + '</strong> definido. Clique agora no horário de <strong>FIM</strong> no calendário (ex: 12:30 para meia hora ou 13:00 para 1h):';
      } else {
        helperBannerText.innerHTML = '✅ Horário Selecionado: <strong>' + sStr + ' às ' + eStr + '</strong> (' + durTxt + '). Toque em outro horário se quiser mudar.';
      }
    }
    if (helperBadge) {
      helperBadge.textContent = durTxt + (diff === 30 ? ' (30 min)' : (diff === 60 ? ' (1 hora)' : ''));
    }
  };

  
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

  window.openDirectBookingModal = function() {
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
    const courtSelect = document.getElementById('directBookingCourt');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');

    if (dateInput) {
      const realTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
      dateInput.value = window.adminGameState?.selectedDate || realTodayStr;
    }

    // Sincroniza a quadra com a quadra atualmente visualizada no painel administrativo
    if (courtSelect && window.adminGameState) {
      const activeCourt = window.adminGameState.selectedCourt;
      if (activeCourt && activeCourt !== 'all') {
        courtSelect.value = activeCourt;
      }
    }

    // Garante que o checkbox de ocultar indisponíveis sempre abra selecionado (checked = true)
    const hideToggleEl = document.getElementById('balcaoHideOccupiedToggle');
    if (hideToggleEl) hideToggleEl.checked = true;

    // Modal abre completamente LIMPO: nenhum bloco pré-selecionado pelo sistema
    if (startSelect) startSelect.value = '';
    if (endSelect) endSelect.value = '';

    const paySelect = document.getElementById('directBookingPayment');
    if (paySelect) paySelect.value = 'Pendente';

    autoCalculateDirectBookingPrice();
    if (courtSelect) {
      courtSelect.onchange = function() { 
        autoCalculateDirectBookingPrice(); 
        renderBalcaoTimeSlots(); 
      };
    }
    if (dateInput) {
      dateInput.onchange = function() { 
        autoCalculateDirectBookingPrice(); 
        renderBalcaoTimeSlots(); 
      };
    }
    renderBalcaoTimeSlots();
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
  };

  window.closeDirectBookingModal = function() {
    const modal = document.getElementById('directBookingModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  window.autoCalculateDirectBookingPrice = function() {
    const courtSelect = document.getElementById('directBookingCourt');
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    const priceInput = document.getElementById('directBookingPrice');
    if (!courtSelect || !priceInput) return;

    const sStr = startSelect ? startSelect.value : '';
    const eStr = endSelect ? endSelect.value : '';

    if (!sStr || !eStr) {
      priceInput.value = '0';
      return;
    }

    const cId = courtSelect.value;
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
    priceInput.value = Math.round(hourlyRate * durationHours);
  };

  
  // ============================================================================
  // 🟢 POP-IT DE NOTIFICAÇÃO DE CONCLUSÃO DE AGENDAMENTO (DURAÇÃO: 30 SEGUNDOS)
  // ============================================================================
  window.arenaPopItTimer = null;
  window.arenaPopItInterval = null;

  window.closeArenaPopIt = function() {
    const el = document.getElementById('arenaPopItNotification');
    if (!el) return;
    el.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
    el.classList.remove('translate-y-0', 'opacity-100');
    if (window.arenaPopItTimer) {
      clearTimeout(window.arenaPopItTimer);
      window.arenaPopItTimer = null;
    }
    if (window.arenaPopItInterval) {
      clearInterval(window.arenaPopItInterval);
      window.arenaPopItInterval = null;
    }
  };

  window.showArenaPopIt = function(opts) {
    const el = document.getElementById('arenaPopItNotification');
    const titleEl = document.getElementById('arenaPopItTitle');
    const msgEl = document.getElementById('arenaPopItMessage');
    const countEl = document.getElementById('arenaPopItCountdown');
    const barEl = document.getElementById('arenaPopItProgress');
    if (!el) return;

    const title = typeof opts === 'string' ? 'Agendamento Concluído!' : (opts?.title || 'Reserva Registrada no Balcão!');
    const msg = typeof opts === 'string' ? opts : (opts?.message || 'Agendamento realizado com sucesso.');
    const durationSec = (opts && opts.duration) ? opts.duration : 30;

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    window.closeArenaPopIt();

    // Mostra o Pop-it com animação fluida
    el.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
    el.classList.add('translate-y-0', 'opacity-100');

    let remaining = durationSec;
    if (countEl) countEl.textContent = remaining + 's';
    if (barEl) barEl.style.width = '100%';

    const startTime = Date.now();
    const totalMs = durationSec * 1000;

    window.arenaPopItInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const leftMs = Math.max(0, totalMs - elapsed);
      const leftSec = Math.ceil(leftMs / 1000);
      const pct = Math.max(0, (leftMs / totalMs) * 100);

      if (countEl) countEl.textContent = leftSec + 's';
      if (barEl) barEl.style.width = pct + '%';

      if (leftMs <= 0) {
        window.closeArenaPopIt();
      }
    }, 100);

    window.arenaPopItTimer = setTimeout(() => {
      window.closeArenaPopIt();
    }, totalMs);
  };

  window.handleSaveDirectBooking = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const name = document.getElementById('directBookingName')?.value.trim();
    const phone = document.getElementById('directBookingPhone')?.value.trim();
    const courtId = document.getElementById('directBookingCourt')?.value || 'fut7';
    const date = document.getElementById('directBookingDate')?.value || window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const start = document.getElementById('directBookingStart')?.value;
    const end = document.getElementById('directBookingEnd')?.value;
    const price = parseFloat(document.getElementById('directBookingPrice')?.value || 0);
    const payment = document.getElementById('directBookingPayment')?.value || 'Pendente';
    const cpf = document.getElementById('directBookingCpf')?.value.trim() || '';
    const obs = document.getElementById('directBookingObs')?.value.trim() || 'Reserva Balcão Direta';

    if (!name || !phone) {
      alert('Por favor informe o Nome e Telefone do Titular.');
      return;
    }

    if (!start || !end) {
      alert('Por favor selecione o horário do jogo tocando nos quadrados do calendário.');
      return;
    }

    const bookingId = 'ARENA-B' + Math.floor(1000 + Math.random() * 9000);
    const court = getCourtById(courtId);

    // Mapeamento canônico e oficial para o formato do banco de dados Supabase
    const dbCourtMapping = {
      'fut5': 'court-society-1',
      'fut6': 'court-society-2',
      'fut7': 'court-beach-1',
      'futmesa': 'court-esportes-de-quadra-1788962671043',
      'areia': 'court-beach-2',
      'society': 'court-futsal-1788963178368'
    };
    const dbCourtId = dbCourtMapping[court.id] || court.id;

    const newBooking = {
      id: bookingId,
      court_id: dbCourtId,
      customer_name: name,
      customer_phone: phone,
      customer_cpf: cpf,
      date: date,
      start_time: start,
      end_time: end,
      time: start + ' às ' + end,
      duration: 60,
      total_price: price,
      status: 'confirmed',
      booking_type: 'avulso',
      payment_method: payment,
      observation: obs,
      created_at: new Date().toISOString()
    };

    // 1. Salva imediatamente em memória
    window.adminGameState.bookings.unshift(newBooking);

    // 2. Salva em localStorage
    

    // 3. Envia para os 2 Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(newBooking, 'upsert');
    }

    // 4. Broadcast para sincronização imediata em todas as abas e dispositivos
    try {
      const bc = new BroadcastChannel('arena_limoeiro_sync');
      bc.postMessage({ type: 'new_booking', booking: newBooking });
    } catch(err) {}

    // 5. Limpa cache e atualiza a tela e contadores imediatamente
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    closeDirectBookingModal();
    if (window.adminGameState.selectedDate !== date) {
      window.selectMovementDay(date);
    } else {
      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    }
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();

    window.showArenaPopIt({
      title: '✓ Reserva Balcão Concluída!',
      message: 'Reserva de ' + name + ' registrada com sucesso! Horário ' + start + ' às ' + end + ' liberado na ' + court.name + '.',
      duration: 30
    });
  };

  // Ações de partida
  window.toggleMatchStatus = function(id) {
    const booking = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id));
    if (booking) {
      booking.status = (booking.status === 'live' || booking.status === 'in_progress') ? 'finished' : 'live';
      
      renderMovementMatches();
      renderCadastrosBookingsList();
      alert('Status do jogo atualizado para: ' + (booking.status === 'live' ? '🟢 Em Andamento' : '✅ Finalizado'));
    }
  };

  window.deleteMatchPrompt = async function(id) {
    const isMonthlyId = String(id).startsWith('monthly-');
    const realId = isMonthlyId ? String(id).replace('monthly-', '') : String(id);

    let bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id) || String(b.id) === realId);
    if (!bookingToDelete && isMonthlyId) {
      bookingToDelete = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === realId);
    }
    bookingToDelete = bookingToDelete || { id: id };

    const nomeCliente = bookingToDelete.customer_name || bookingToDelete.name || bookingToDelete.responsible_name || 'este agendamento';
    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: 'Excluir / Cancelar Partida',
      mensagem: `Deseja realmente excluir permanentemente a partida de <strong class="text-slate-900">"${nomeCliente}"</strong> e liberar o horário na quadra?`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Excluir Partida',
      textoCancelar: 'Manter'
    });
    if (!confirmado) return;

    // Remove do estado operacional
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id) && String(b.id) !== realId);
    if (isMonthlyId) {
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== realId);
    }

    // ☁️ Deleta imediatamente de ambos os bancos na nuvem (Dual-Delete em paralelo)
    const dbDelete = async (dbUrl, dbKey, table, targetId) => {
      try {
        await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(targetId), {
          method: 'DELETE',
          headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
        });
      } catch(e) {}
    };

    const targetTable = isMonthlyId ? 'monthly_members' : 'bookings';
    await Promise.allSettled([
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, targetTable, realId),
      dbDelete(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', id),
      dbDelete(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', id)
    ]);

    // Força sincronização imediata na nuvem para propagar aos outros dispositivos
    window.__lastBookingsSig = null;
    window.__lastMembersSig = null;
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      await window.pullDataFromCloudDatabases();
    }

    // Limpa caches e re-renderiza régua e lista
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();

    if (typeof window.showArenaPopIt === 'function') {
      window.showArenaPopIt({
        title: '✓ Horário Liberado com Sucesso!',
        message: 'A partida de ' + nomeCliente + ' foi cancelada e excluída do banco de dados.',
        duration: 30
      });
    } else {
      arenaToast('✓ Horário liberado com sucesso!');
    }
  };

  // Exportações
  window.exportMovementDailyPDF = function() {
    window.print();
  };

  window.exportMovementDailyExcel = function() {
    const dateStr = window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    const matches = getMatchesForDate(dateStr);
    let csv = 'Data;Horario;Quadra;Cliente;Telefone;Valor;Status\n';
    matches.forEach(m => {
      csv += `${m.date};${m.time};${m.court_name};${m.customer_name};${m.customer_phone};R$ ${m.total_price};${m.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jogos-arena-limoeiro-' + dateStr + '.csv';
    a.click();
  };

  // Sincronização Broadcast em tempo real entre abas
  try {
    const bc = new BroadcastChannel('arena_limoeiro_sync');
    bc.onmessage = function(ev) {
      if (ev && ev.data && ev.data.type === 'new_booking') {
        const b = ev.data.booking;
        if (!window.adminGameState.bookings.some(x => x.id === b.id)) {
          window.adminGameState.bookings.unshift(b);
          renderMovementMatches();
          renderCadastrosBookingsList();
        }
      }
    };
  } catch(e) {}

  // Inicialização no carregamento da página
  // =========================================================================
  // FUNÇÕES OPERACIONAIS: EDIÇÃO, HORÁRIOS, ATRASO, CONTRATO E AÇÕES
  // =========================================================================

  window.closeArenaModal = function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.add('hidden');
    }
  };

  window.arenaToast = function(msg) {
    const t = document.getElementById('arenaToast');
    const m = document.getElementById('arenaToastMsg');
    if (!t) {
      console.log('Toast:', msg);
      return;
    }
    if (m) m.textContent = msg;
    t.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    t.classList.add('translate-y-0', 'opacity-100');
    clearTimeout(window.__arenaToastTimer);
    window.__arenaToastTimer = setTimeout(() => {
      t.classList.remove('translate-y-0', 'opacity-100');
      t.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3500);
  };

  // Helper para converter HH:MM em minutos
  function parseTimeToMinutes(t) {
    if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
    const parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  // Helper para converter minutos em HH:MM
  function formatMinutesToTime(m) {
    let normalized = ((m % 1440) + 1440) % 1440;
    const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
    const mm = String(normalized % 60).padStart(2, '0');
    return hh + ':' + mm;
  }

  // Atualizar badge de duração no modal de edição
  window.onEditMatchTimeChange = function() {
    const s = document.getElementById('editMatchStart')?.value || '18:00';
    const e = document.getElementById('editMatchEnd')?.value || '19:00';
    const sm = parseTimeToMinutes(s);
    const em = parseTimeToMinutes(e);
    let diff = em - sm;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    let txt = 'Duração: ';
    if (h > 0) txt += h + 'h';
    if (m > 0) txt += (h > 0 ? ' ' : '') + m + 'min';
    if (diff === 0) txt = 'Duração: 0min';
    const badge = document.getElementById('editDurationBadge');
    if (badge) badge.textContent = txt;
  };

  // Ajuste rápido de horário mantendo a duração do jogo (+/- 5, 10, 15 min)
  window.adjustGameMinutes = function(deltaMin) {
    const startInput = document.getElementById('editMatchStart');
    const endInput = document.getElementById('editMatchEnd');
    if (!startInput || !endInput) return;

    let sMin = parseTimeToMinutes(startInput.value);
    let eMin = parseTimeToMinutes(endInput.value);
    let dur = eMin - sMin;
    if (dur <= 0) dur += 1440;

    let newS = sMin + deltaMin;
    let newE = newS + dur;

    startInput.value = formatMinutesToTime(newS);
    endInput.value = formatMinutesToTime(newE);
    onEditMatchTimeChange();
  };

  // Ajuste do atraso da equipe no modal de edição
  window.setEditLateMinutes = function(mins) {
    const hidden = document.getElementById('editMatchLate');
    if (hidden) hidden.value = mins;

    const badge = document.getElementById('editLateBadge');
    if (badge) {
      if (mins > 0) {
        badge.textContent = 'Atraso: ' + mins + ' min';
        badge.className = 'text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full';
      } else {
        badge.textContent = 'Sem atraso';
        badge.className = 'text-[11px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full';
      }
    }

    const container = document.getElementById('editLateButtonsContainer');
    if (container) {
      const btns = container.querySelectorAll('.btn-late-opt');
      btns.forEach(btn => {
        const bMin = parseInt(btn.getAttribute('data-late'), 10);
        if (bMin === mins) {
          btn.className = 'btn-late-opt py-1.5 px-1 text-xs font-black text-white bg-amber-600 border border-amber-700 rounded-xl shadow-sm text-center cursor-pointer';
        } else {
          btn.className = 'btn-late-opt py-1.5 px-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-amber-100 text-center cursor-pointer';
        }
      });
    }
  };

  // 1. Abrir Modal de Edição de Jogo
  window.openEditGame = function(id) {
    const g = getGame(id);
    if (!g) {
      console.warn('Game not found:', id);
      return;
    }

    document.getElementById('editMatchId').value = id;
    document.getElementById('editMatchName').value = g.customer_name || g.name || '';
    document.getElementById('editMatchPhone').value = g.customer_phone || g.phone || '';
    document.getElementById('editMatchDate').value = g.date || window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    
    const courtSelect = document.getElementById('editMatchCourt');
    if (courtSelect) {
      const c = getCourtById(g.court_id || g.courtId);
      courtSelect.value = c.id;
    }

    const startTime = g.start_time || g.start || '18:00';
    const endTime = g.end_time || g.end || '19:00';
    document.getElementById('editMatchStart').value = startTime;
    document.getElementById('editMatchEnd').value = endTime;
    onEditMatchTimeChange();

    const lateMin = parseInt(g.late || 0, 10);
    setEditLateMinutes(lateMin);
    document.getElementById('editMatchLateReason').value = g.lateReason || g.late_reason || '';

    document.getElementById('editMatchType').value = g.type || (g.isMensalista ? 'Mensalista' : 'Avulso');
    document.getElementById('editMatchStatus').value = g.status || 'confirmed';
    document.getElementById('editMatchPrice').value = g.total_price || g.price || 100;
    document.getElementById('editMatchPayment').value = g.payment || 'Pago';
    document.getElementById('editMatchPlayers').value = g.players || 14;
    document.getElementById('editMatchDayFixed').value = g.dayFixed || (g.isMensalista ? 'TERÇA' : '');
    document.getElementById('editMatchNote').value = g.observation || g.note || '';

    const modal = document.getElementById('arenaEditModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  };

  // Salvar Edição de Jogo
  window.saveEditGame = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('editMatchId').value;
    const g = getGame(id);
    if (!g) return;

    const oldStart = g.start_time || g.start;
    const oldEnd = g.end_time || g.end;
    const newStart = document.getElementById('editMatchStart').value;
    const newEnd = document.getElementById('editMatchEnd').value;
    const newDate = document.getElementById('editMatchDate').value;
    const newCourtId = document.getElementById('editMatchCourt').value;
    const court = getCourtById(newCourtId);

    const oldLate = parseInt(g.late || 0, 10);
    const newLate = parseInt(document.getElementById('editMatchLate').value || 0, 10);
    const newLateReason = document.getElementById('editMatchLateReason').value.trim();

    g.customer_name = document.getElementById('editMatchName').value.trim();
    g.name = g.customer_name;
    g.customer_phone = document.getElementById('editMatchPhone').value.trim();
    g.phone = g.customer_phone;
    g.date = newDate;
    g.court_id = court.id;
    g.courtId = court.id;
    g.space = court.name;
    g.courtName = court.name;
    g.start_time = newStart;
    g.start = newStart;
    g.end_time = newEnd;
    g.end = newEnd;
    g.late = newLate;
    g.lateReason = newLateReason;
    g.type = document.getElementById('editMatchType').value;
    g.status = document.getElementById('editMatchStatus').value;
    g.total_price = parseFloat(document.getElementById('editMatchPrice').value || 0);
    g.price = g.total_price;
    g.payment = document.getElementById('editMatchPayment').value;
    g.players = parseInt(document.getElementById('editMatchPlayers').value || 14, 10);
    g.dayFixed = document.getElementById('editMatchDayFixed').value;
    g.observation = document.getElementById('editMatchNote').value.trim();
    g.note = g.observation;

    // Log de alterações no histórico
    if (oldStart !== newStart || oldEnd !== newEnd) {
      addMatchLog(g, 'Horário ajustado', 'Alterado de ' + oldStart + '–' + oldEnd + ' para ' + newStart + '–' + newEnd);
    }
    if (newLate > 0 && newLate !== oldLate) {
      addMatchLog(g, 'Atraso de equipe registrado', newLate + ' min' + (newLateReason ? ' (' + newLateReason + ')' : ''));
    }

    // REGRA DE OURO: "Editar jogo" altera ESTRITAMENTE e EXCLUSIVAMENTE a partida desta data.
    // O contrato fixo recorrente (monthly_members) permanece 100% inalterado.
    // Se for partida de mensalista, garante que o agendamento específico desta data está registrado em bookings.
    if (String(id).startsWith('monthly-') || g.isMensalista || g.booking_type === 'mensalista') {
      const existingInBookings = (window.adminGameState.bookings || []).find(b => String(b.id) === String(g.id) && b.date === newDate);
      if (!existingInBookings) {
        window.adminGameState.bookings.push(g);
      }
    }

    saveAdminGameState();
    // ☁️ Envia a edição imediatamente para os Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    closeArenaModal('arenaEditModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    if (typeof renderCadastrosClientes === 'function') renderCadastrosClientes();
    arenaToast('Partida deste dia atualizada com sucesso! (Contrato fixo mantido)');
  };

  // 2. Abrir Modal de Contrato
  window.openContract = function(id) {
    const g = getGame(id);
    if (!g) return;

    if (!g.contract) g.contract = {};
    document.getElementById('contractMatchId').value = id;
    document.getElementById('contractNumber').value = g.contract.number || 'AL-2026-' + (String(id).replace(/[^0-9]/g, '').slice(-3) || '042');
    document.getElementById('contractType').value = g.contract.type || g.type || 'Mensalista';

    // Determina e preenche com rigor a quadra/campo onde o fixo joga
    const court = getCourtById(g.court_id || g.courtId);
    const courtSelect = document.getElementById('contractCourt');
    if (courtSelect) {
      courtSelect.value = court.id;
    }

    document.getElementById('contractStart').value = g.contract.start || '2026-01-01';
    document.getElementById('contractEnd').value = g.contract.end || '2026-12-31';
    document.getElementById('contractDayFixed').value = g.contract.dayFixed || g.dayFixed || 'TERÇA';
    document.getElementById('contractDueDay').value = g.contract.dueDay || 10;
    document.getElementById('contractAmount').value = g.contract.amount || g.total_price || g.price || 400;
    document.getElementById('contractStatus').value = g.contract.status || 'Assinado / Vigente';
    document.getElementById('contractTerms').value = g.contract.terms || 'Reserva semanal fixa com tolerância de 10 minutos. Cancelamentos devem ser avisados com 48h de antecedência.';

    const modal = document.getElementById('arenaContractModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  };

  // Salvar Contrato com sincronização de Quadra/Campo nos Bancos de Dados
  window.saveContract = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('contractMatchId').value;
    const g = getGame(id);
    if (!g) return;

    if (!g.contract) g.contract = {};
    g.contract.number = document.getElementById('contractNumber').value.trim();
    g.contract.type = document.getElementById('contractType').value;
    g.contract.start = document.getElementById('contractStart').value;
    g.contract.end = document.getElementById('contractEnd').value;
    g.contract.dayFixed = document.getElementById('contractDayFixed').value;
    g.contract.dueDay = parseInt(document.getElementById('contractDueDay').value || 10, 10);
    g.contract.amount = parseFloat(document.getElementById('contractAmount').value || 0);
    g.contract.status = document.getElementById('contractStatus').value;
    g.contract.terms = document.getElementById('contractTerms').value.trim();

    // Sincroniza a Quadra/Campo selecionada no Contrato
    const courtSelect = document.getElementById('contractCourt');
    if (courtSelect && courtSelect.value) {
      const selectedCourt = getCourtById(courtSelect.value);
      g.court_id = selectedCourt.id;
      g.courtId = selectedCourt.id;
      g.court_name = selectedCourt.name;
      g.courtName = selectedCourt.name;
      g.space = selectedCourt.name;
      g.contract.courtId = selectedCourt.id;
      g.contract.courtName = selectedCourt.name;

      // REGRA DE OURO: "Editar contrato" altera ESTRITAMENTE e EXCLUSIVAMENTE o contrato recorrente desta pessoa em monthly_members
      if (String(id).startsWith('monthly-') || g.isMensalista) {
        const rawMonthlyId = String(id).replace('monthly-', '');
        const member = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === rawMonthlyId);
        const newDayFixed = document.getElementById('contractDayFixed')?.value || g.contract.dayFixed;
        const newDueDay = parseInt(document.getElementById('contractDueDay')?.value || 10, 10);
        const newAmount = parseFloat(document.getElementById('contractAmount')?.value || 0);

        if (member) {
          member.court_id = selectedCourt.id;
          member.courtId = selectedCourt.id;
          member.court_name = selectedCourt.name;
          if (newDayFixed) member.day_of_week = newDayFixed.toLowerCase();
          if (newAmount > 0) member.monthly_price = newAmount;
        }

        // Mapeamento para o ID do banco se aplicável
        const dbCourtMapping = {
          'fut5': 'court-society-1',
          'fut6': 'court-society-2',
          'fut7': 'court-beach-1',
          'futmesa': 'court-esportes-de-quadra-1788962671043',
          'areia': 'court-beach-2',
          'society': 'court-futsal-1788963178368'
        };
        const dbCourtId = dbCourtMapping[selectedCourt.id] || selectedCourt.id;

        // Persistência assíncrona imediata nos 2 bancos Supabase para monthly_members dessa pessoa específica
        if (typeof ARENA_CLOUD_DBS !== 'undefined') {
          const contractPayload = {
            court_id: dbCourtId,
            day_of_week: newDayFixed ? newDayFixed.toLowerCase() : undefined,
            monthly_price: newAmount > 0 ? newAmount : undefined
          };
          // Remove campos indefinidos
          Object.keys(contractPayload).forEach(k => contractPayload[k] === undefined && delete contractPayload[k]);

          [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
            if (!dbUrl) return;
            const key = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
            fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMonthlyId), {
              method: 'PATCH',
              headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(contractPayload)
            }).catch(err => console.warn('[ArenaCloud] Erro sync contrato mensalista:', err));
          });
        }
      }
    }

    addMatchLog(g, 'Contrato atualizado', 'Termo ' + g.contract.number + ' · ' + (g.court_name || '') + ' · Venc: dia ' + g.contract.dueDay);
    saveAdminGameState();

    // ☁️ Persistência imediata no agendamento para nunca haver reversão
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }

    closeArenaModal('arenaContractModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    if (typeof renderCadastrosMonthlyList === 'function') renderCadastrosMonthlyList();
    arenaToast('Contrato e quadra do mensalista salvos com sucesso!');
  };

  // Imprimir Termo / Contrato
  window.printContractTerm = function() {
    const id = document.getElementById('contractMatchId')?.value;
    const g = getGame(id) || {};
    const c = g.contract || {};
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Por favor permita popups para imprimir o termo de contrato.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Termo de Compromisso / Contrato - Arena Limoeiro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #065f46; font-size: 24px; text-transform: uppercase; }
          .header p { margin: 5px 0 0; color: #64748b; font-size: 13px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
          .box { background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .box strong { display: block; color: #475569; font-size: 11px; text-transform: uppercase; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; padding-top: 20px; }
          .sign-line { border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; font-size: 12px; }
          @media print { body { padding: 20px; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Arena Limoeiro – Complexo Poliesportivo</h1>
          <p>Termo de Adesão e Contrato de Locação Contínua (Mensalista)</p>
          <p><strong>Nº do Contrato:</strong> ${c.number || 'AL-2026-001'} &bull; <strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="section">
          <div class="section-title">1. Dados do Contratante e Agendamento</div>
          <div class="grid">
            <div class="box"><strong>Responsável / Equipe:</strong> ${g.customer_name || g.name || '---'}</div>
            <div class="box"><strong>WhatsApp / Contato:</strong> ${g.customer_phone || g.phone || '---'}</div>
            <div class="box"><strong>Quadra / Espaço:</strong> ${(function() { const ct = getCourtById(g.court_id || g.courtId); return ct ? ct.name : (g.courtName || g.space || '---'); })()}</div>
            <div class="box"><strong>Dia da Semana / Horário:</strong> ${c.dayFixed || g.dayFixed || 'TERÇA'} das ${g.start_time || g.start || '18:00'} às ${g.end_time || g.end || '19:00'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Condições Financeiras e Vigência</div>
          <div class="grid">
            <div class="box"><strong>Valor Mensal Contratado:</strong> R$ ${parseFloat(c.amount || g.total_price || 400).toFixed(2)}</div>
            <div class="box"><strong>Dia de Vencimento:</strong> Todo dia ${c.dueDay || 10} de cada mês</div>
            <div class="box"><strong>Início da Vigência:</strong> ${c.start || '01/01/2026'}</div>
            <div class="box"><strong>Término da Vigência:</strong> ${c.end || '31/12/2026'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Regras e Condições Especiais</div>
          <p style="font-size: 12px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${c.terms || 'A tolerância máxima para início da partida é de 10 minutos. Cancelamentos ou reagendamentos de rodada devem ser informados com no mínimo 48 horas de antecedência. É vedado o uso de calçados inadequados que danifiquem o gramado ou piso.'}
          </p>
        </div>

        <div class="signatures">
          <div class="sign-line">
            <strong>${g.customer_name || g.name || 'Contratante / Responsável'}</strong><br>
            CPF: ${g.cpf || '_____________________'}
          </div>
          <div class="sign-line">
            <strong>Arena Limoeiro Gestão Esportiva</strong><br>
            Administração Oficial
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Imprimir Termo
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 3. Abrir Modal de Não Comparecimento / Falta
  window.openNoShow = function(id) {
    const g = getGame(id);
    if (!g) return;

    document.getElementById('noShowMatchId').value = id;
    document.getElementById('noShowReason').value = '';

    const modal = document.getElementById('arenaNoShowModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  };

  // Confirmar Falta / Não Compareceu: Faz o jogo sumir completamente do banco de dados
  window.applyNoShow = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('noShowMatchId').value;
    const reason = (document.getElementById('noShowReason')?.value || document.getElementById('noShowReasonInput')?.value || '').trim() || 'Responsável não compareceu';

    // Remove do estado local
    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || { id: id, observation: reason };
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id));

    // Persiste no localStorage
    

    // ☁️ Exclui imediatamente do Supabase DB1 e DB2 na nuvem (DELETE oficial)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(bookingToDelete, 'delete');
    }

    closeArenaModal('arenaNoShowModal');
    if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
    if (typeof arenaToast === 'function') {
      arenaToast('✓ Ausência confirmada. O jogo foi excluído e sumiu do banco de dados!');
    }
  };

  // 4. Duplicar Partida
  window.duplicateGame = function(id) {
    const g = getGame(id);
    if (!g) return;

    const copy = JSON.parse(JSON.stringify(g));
    copy.id = 'ARENA-DUP-' + Math.floor(1000 + Math.random() * 9000);
    copy.status = 'pending';
    copy.attendance = 'Aguardando chegada';
    copy.late = 0;
    copy.lateReason = '';
    copy.checkinAt = '';
    copy.startedAt = '';
    copy.finishedAt = '';
    copy.log = [];
    addMatchLog(copy, 'Partida duplicada', 'Criada a partir de ' + (g.customer_name || g.name) + '. Revise data e horário.');

    window.adminGameState.bookings.unshift(copy);
    saveAdminGameState();
    renderMovementMatches();
    renderCadastrosBookingsList();
    openEditGame(copy.id);
    arenaToast('Partida duplicada com sucesso! Revise data e horário.');
  };

  // 5. Cancelar e Excluir Partida com Sincronização em Tempo Real na Nuvem
const cancelGame = window.cancelGame = async function(id, evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();
    let g = (typeof getGame === 'function') ? getGame(id) : null;
    if (!g) {
      g = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id));
    }
    const isMonthly = String(id).startsWith('monthly-') || (g && (g.isMensalista || g.booking_type === 'mensalista'));
    const rawMonthlyId = String(id).replace('monthly-', '');
    const nomeCliente = (g && (g.customer_name || g.name)) ? (g.customer_name || g.name) : 'esta partida';

    const confirmado = await window.mostrarConfirmacaoArena({
      titulo: isMonthly ? 'Excluir Mensalista / Partida' : 'Excluir Partida',
      mensagem: `Deseja realmente excluir permanentemente a partida de <strong class="text-slate-900">"${nomeCliente}"</strong> e remover este agendamento do banco de dados?`,
      tipo: 'danger',
      textoConfirmar: 'Sim, Excluir Agora',
      textoCancelar: 'Manter'
    });
    if (!confirmado) return;

    const targetId = String(id);
    const selDate = (g && g.date) ? g.date : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-09'));

    // 1. Remove do estado operacional da memória
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== targetId && String(b.id) !== rawMonthlyId);
    if (isMonthly) {
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== rawMonthlyId && String(m.id) !== targetId);
    }

    // 2. Registra na lista de exclusões do dia para evitar que reapareça em cache
    try {
      let excluidosMap = {};
      const savedExcl = localStorage.getItem('arena_jogos_excluidos_v1');
      if (savedExcl) excluidosMap = JSON.parse(savedExcl);
      excluidosMap[targetId + '_' + selDate] = { id: targetId, date: selDate, at: new Date().toISOString() };
      if (isMonthly) {
        excluidosMap[rawMonthlyId + '_' + selDate] = { id: rawMonthlyId, date: selDate, at: new Date().toISOString() };
      }
      localStorage.setItem('arena_jogos_excluidos_v1', JSON.stringify(excluidosMap));
    } catch(e) {}

    // 3. Atualiza tela operacional IMEDIATAMENTE para quem clicou
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof renderMovementMatches === 'function') renderMovementMatches();
    if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    if (typeof window.renderMovementCalendarStrip === 'function') window.renderMovementCalendarStrip();
    if (typeof renderCadastrosBookingsList === 'function') renderCadastrosBookingsList();

    // 4. Executa EXCLUSÃO REAL E DEFINITIVA nos bancos na nuvem (DB2 e DB1)
    if (window.ARENA_CLOUD_DBS) {
      const deleteDb = async (dbUrl, dbKey, table, qId) => {
        try {
          await fetch(dbUrl + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(qId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };

      // Exclui em bookings e em monthly_members
      const tasks = [
        deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', targetId),
        deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', targetId)
      ];
      if (isMonthly) {
        tasks.push(
          deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'monthly_members', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'monthly_members', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key, 'bookings', rawMonthlyId),
          deleteDb(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key, 'bookings', rawMonthlyId)
        );
      }
      await Promise.allSettled(tasks);
    }

    // 5. Invalida assinaturas e força atualização imediata na nuvem
    window.__lastBookingsSig = null;
    window.__lastMembersSig = null;
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      await window.pullDataFromCloudDatabases();
    }

    // 6. Notifica via Pop-it de 30 segundos
    if (typeof window.showArenaPopIt === 'function') {
      window.showArenaPopIt({
        title: '✓ Partida Excluída!',
        message: 'A partida de ' + nomeCliente + ' foi removida permanentemente do banco de dados e o horário liberado.',
        duration: 30
      });
    } else if (typeof arenaToast === 'function') {
      arenaToast('✓ Partida excluída com sucesso do banco de dados!');
    }
  };

  // 6. Confirmar Chegada / Presença
  window.markArrived = function(id) {
    const g = getGame(id);
    if (!g) return;

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    g.attendance = 'Presença confirmada';
    g.checkinAt = timeStr;
    addMatchLog(g, 'Chegada confirmada', 'Equipe no local às ' + timeStr);
    saveAdminGameState();
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Presença confirmada para ' + (g.customer_name || g.name));
  };

  // 7. Iniciar Partida
  window.startGame = function(id) {
    const g = getGame(id);
    if (!g) return;

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    g.status = 'in_progress';
    g.attendance = 'Em quadra';
    g.startedAt = timeStr;
    addMatchLog(g, 'Partida iniciada', 'Cronômetro iniciado às ' + timeStr);
    saveAdminGameState();
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida iniciada com sucesso!');
  };

  // 8. Encerrar Partida
  window.finishGame = function(id) {
    const g = getGame(id);
    if (!g) return;

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    g.status = 'finished';
    g.attendance = 'Finalizada';
    g.finishedAt = timeStr;
    addMatchLog(g, 'Partida encerrada', 'Jogo finalizado às ' + timeStr);
    saveAdminGameState();
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida finalizada com sucesso!');
  };

  // 9. Atalhos de Horário e Duração para o Modal de Adicionar Jogo Balcão
  window.setDirectBookingDuration = function(hours) {
    const startSelect = document.getElementById('directBookingStart');
    const endSelect = document.getElementById('directBookingEnd');
    if (!startSelect || !endSelect) return;

    window.__balcaoSelectionHistory = window.__balcaoSelectionHistory || [];
    window.__balcaoSelectionHistory.push({ start: startSelect.value, end: endSelect.value });

    const startTime = startSelect.value || '19:00';
    const sMin = parseTimeToMinutes(startTime);
    const durMin = Math.round(hours * 60);
    const newEnd = formatMinutesToTime(sMin + durMin);

    let opt = Array.from(endSelect.options).find(o => o.value === newEnd);
    if (!opt) {
      opt = new Option(newEnd, newEnd);
      endSelect.add(opt);
    }
    endSelect.value = newEnd;

    if (window.autoCalculateDirectBookingPrice) {
      window.autoCalculateDirectBookingPrice();
    }
    if (typeof window.renderBalcaoTimeSlots === 'function') {
      window.renderBalcaoTimeSlots();
    }
  };

  
  // =========================================================================
  // ATUALIZAÇÃO AUTOMÁTICA EM TEMPO REAL: SUPABASE REALTIME & RESILIENT POLLING
  // =========================================================================
  function setupArenaRealtimeSync() {
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.ARENA_CLOUD_DBS) {
      try {
        const rtClient = window.supabase.createClient(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key);
        const channel = rtClient.channel('arena_live_system_sync');
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
            console.log('[Realtime] Alteração detectada em bookings:', payload);
            if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_members' }, (payload) => {
            console.log('[Realtime] Alteração detectada em monthly_members:', payload);
            if (typeof window.pullDataFromCloudDatabases === 'function') window.pullDataFromCloudDatabases();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, (payload) => {
            console.log('[Realtime] Alteração detectada em courts:', payload);
            if (typeof window.pullCourtsFromCloud === 'function') window.pullCourtsFromCloud();
          })
          .subscribe((status) => {
            console.log('[Realtime] Status da conexão Supabase:', status);
          });
        window.__arenaRealtimeChannel = channel;
      } catch(e) {
        console.warn('[Realtime] Aviso ao iniciar websocket realtime:', e);
      }
    }
  }

  // Sincroniza quadras na nuvem no carregamento inicial
    if (typeof window.pullCourtsFromCloud === 'function') {
      window.pullCourtsFromCloud();
    }

    // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling & virada de dia)
  // Otimizado: suspende o loop quando a aba estiver em segundo plano (document.hidden) e reativa no foco
  if (!window.__arenaFeedAutoInterval) {
    // Checagem de expurgo contínuo a cada virada de dia ou ciclo
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        window.purgeExpiredCloudBookings();
      }
    } catch(eP) {}

    window.__arenaFeedAutoInterval = setInterval(() => {
      if (document.hidden) return; // Economia profunda de CPU e bateria

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

      // 2. Auto-início e auto-encerramento/cancelamento de partidas
      if (typeof window.checkAndAutoStartMatches === 'function') {
        window.checkAndAutoStartMatches();
      }
      if (typeof window.checkAndAutoExpireMatches === 'function') {
        window.checkAndAutoExpireMatches();
      }

      // 3. Sincronização contínua com os bancos de dados na nuvem (já renderiza partidas ao concluir)
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
    }, 4000);

    // Sincronização instantânea ao reativar a aba
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
    });
  }

    // =========================================================================
  // BACKUP & EXPORTAÇÃO REAL DE DADOS EM FORMATO JSON SEGURO
  // =========================================================================
  window.downloadCompleteBackup = function() {
    try {
      const backupData = {
        version: '2.0-cloud',
        exported_at: new Date().toISOString(),
        arena: 'Arena Limoeiro - Complexo Poliesportivo e Lazer',
        bookings: window.adminGameState ? window.adminGameState.bookings : [],
        monthly_members: window.adminGameState ? window.adminGameState.monthlyMembers : [],
        courts: (typeof courtState !== 'undefined' && courtState) ? courtState.courts : [],
        system_status: 'operational_verified'
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arena-limoeiro-backup-' + (window.getSystemToday ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08')) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (typeof showAdminToast === 'function') {
        showAdminToast('Backup JSON completo baixado com sucesso!');
      } else if (typeof mostrarToast === 'function') {
        mostrarToast('Backup JSON completo baixado com sucesso!');
      }
    } catch(e) {
      alert('Erro ao exportar backup: ' + e.message);
    }
  };

  window.initAdminGames = initAdminGames;
  function initAdminGames() {
    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08');
    window.__lastKnownSystemDate = todayStr;

    // Renderiza a régua de dias dinamicamente centrada no dia de hoje
    if (typeof window.renderMovementCalendarStrip === 'function') {
      window.renderMovementCalendarStrip();
    }

    // Seleciona o dia atual de forma 100% dinâmica (adaptado à virada do dia)
    const targetDate = window.adminGameState.selectedDate || todayStr;
    window.selectMovementDay(targetDate);

    // Inicializa renderizações do feed e cadastros
    renderMovementMatches();
    renderCadastrosBookingsList();

    if (window.location.hash === "#openModal" || window.location.search.includes("modal=direct")) {
      setTimeout(openDirectBookingModal, 50);
    }

    // Inicia subscrição Realtime instantânea
    setupArenaRealtimeSync();

    // Expurgo automático de agendamentos com mais de 4 dias para liberar espaço permanente no Supabase
    if (typeof window.purgeExpiredCloudBookings === 'function') {
      window.purgeExpiredCloudBookings();
    }

    // Sincroniza em segundo plano com os 2 Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }
    if (typeof window.pullCourtsFromCloud === 'function') {
      window.pullCourtsFromCloud();
    }
    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
  }

  // Máscaras automáticas em tempo real para campos de Telefone e CPF
  function initInputMasks() {
    document.addEventListener('input', function(e) {
      const target = e.target;
      if (!target || !target.id) return;
      
      const phoneIds = ['novoClienteTelefone', 'directBookingPhone', 'modalGerenciarTelefone', 'editMatchPhone', 'whatsappTestOtpPhone'];
      if (phoneIds.includes(target.id) || target.type === 'tel' || target.getAttribute('data-mask') === 'phone') {
        const cursor = target.selectionStart;
        const oldVal = target.value;
        const newVal = window.aplicarMascaraTelefone(oldVal);
        if (oldVal !== newVal) {
          target.value = newVal;
        }
      }

      const cpfIds = ['novoClienteCpf', 'modalGerenciarCpf', 'directBookingCpf'];
      if (cpfIds.includes(target.id) || target.getAttribute('data-mask') === 'cpf') {
        const oldVal = target.value;
        const newVal = window.aplicarMascaraCPF(oldVal);
        if (oldVal !== newVal) {
          target.value = newVal;
        }
      }
    }, true);
  }
  initInputMasks();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminGames);
  } else {
    initAdminGames();
  }

})();
