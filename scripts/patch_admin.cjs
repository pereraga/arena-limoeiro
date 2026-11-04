const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Normalize to LF for matching
content = content.replace(/\r\n/g, '\n');

// 1. Patch getLoadedBookings to sanitize Davi and any invalid date contamination
const oldLoadedBookings = `  // 2. Carregamento de Bookings e MonthlyMembers
  function getLoadedBookings() {
    let list = [];
    try {
      const stored = localStorage.getItem('arena_local_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch(e) {}
    if (list.length === 0 && window.ARENA_DEFAULT_DATA && Array.isArray(window.ARENA_DEFAULT_DATA.initialBookings)) {
      list = [...window.ARENA_DEFAULT_DATA.initialBookings];
    }
    // Higienização automática: remove IDs de teste legados e registros com horário inválido
    const obsoleteIds = new Set(['ARENA-M4066', 'ARENA-M2526', 'ARENA-8673']);
    list = list.filter(b => !obsoleteIds.has(b.id) && (b.start_time || b.time));
    return list;
  }`;

const newLoadedBookings = `  // 2. Carregamento de Bookings e MonthlyMembers
  function getLoadedBookings() {
    let list = [];
    try {
      const stored = localStorage.getItem('arena_local_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch(e) {}
    if (list.length === 0 && window.ARENA_DEFAULT_DATA && Array.isArray(window.ARENA_DEFAULT_DATA.initialBookings)) {
      list = [...window.ARENA_DEFAULT_DATA.initialBookings];
    }
    // Higienização automática profunda: remove IDs obsoletos e contaminações entre dias
    const obsoleteIds = new Set(['ARENA-M4066', 'ARENA-M2526', 'ARENA-8673']);
    list = list.filter(b => {
      if (!b || !b.id || obsoleteIds.has(b.id)) return false;
      if (!b.start_time && !b.time) return false;
      // Higienização estrita: Davi só joga às segundas, quartas, sextas e sábados (nunca na terça 03/11)
      if ((b.customer_name === 'Davi' || (b.name && b.name.includes('Davi'))) && b.date === '2026-11-03') return false;
      return true;
    });
    return list;
  }`;

// 2. Patch getMatchesForDate with strict date isolation and weekday verification
const oldGetMatches = `  function getMatchesForDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayOfWeek = dayOfWeekMap[dt.getDay()];

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
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')'
        });
      }
    });

    // 2. Reservas diretas da data
    (window.adminGameState.bookings || []).forEach(b => {
      if (!b || b.status === 'cancelled') return;
      if (b.date === dateStr) {
        const court = getCourtById(b.court_id || b.courtId);
        const startT = b.start_time || (b.time ? b.time.split(' ')[0] : '19:00');
        const endT = b.end_time || (b.time ? b.time.split(' às ')[1] : '20:00');

        // Evita duplicatas se já existe mensalista no mesmo horário e campo
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.court_id === court.id && m.start_time === startT));
        if (existing) {
          Object.assign(existing, b);
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
            status: b.status || 'confirmed',
            isMensalista: b.booking_type === 'mensalista' || (b.id && String(b.id).startsWith('monthly-')),
            booking_type: b.booking_type || 'avulso',
            payment_method: b.payment_method || 'PIX Balcão',
            observation: b.observation || 'Reserva direta confirmada'
          });
        }
      }
    });

    // Fallback garantido para terça-feira 03/11/2026 com sequência cronológica limpa
    if (matches.length === 0 && (dateStr === '2026-11-03' || dateStr.endsWith('-11-03'))) {
      matches = [
        {
          id: 'ARENA-2913',
          court_id: 'court-society-1',
          court_name: 'SOCIETY - ARENA CENTRAL',
          date: '2026-11-03',
          customer_name: 'Esc Ariadnes',
          customer_phone: '(81) 99556-2693',
          customer_cpf: '000.000.000-00',
          start_time: '16:00',
          end_time: '18:00',
          time: '16:00 às 18:00',
          total_price: 500,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-3251',
          court_id: 'court-futsal-1788963178368',
          court_name: 'QUADRA SOCIETY',
          date: '2026-11-03',
          customer_name: 'Aline',
          customer_phone: '(81) 99246-3081',
          customer_cpf: '',
          start_time: '18:00',
          end_time: '19:30',
          time: '18:00 às 19:30',
          total_price: 150,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'pago_balcao',
          observation: 'Reserva direta confirmada'
        },
        {
          id: 'ARENA-GENILSON-1103',
          court_id: 'court-society-2',
          court_name: 'FUT 6 - SOCCER 6',
          date: '2026-11-03',
          customer_name: 'Genilson',
          customer_phone: '(81) 99966-4317',
          customer_cpf: '',
          start_time: '19:30',
          end_time: '21:00',
          time: '19:30 às 21:00',
          total_price: 140,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'pago_balcao',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-ZELUIZ-1103',
          court_id: 'court-beach-1',
          court_name: 'FUT 7 - SOCCER 7',
          date: '2026-11-03',
          customer_name: 'Zé Luiz',
          customer_phone: '(81) 98877-6655',
          customer_cpf: '',
          start_time: '21:00',
          end_time: '22:30',
          time: '21:00 às 22:30',
          total_price: 160,
          status: 'confirmed',
          booking_type: 'avulso',
          payment_method: 'PIX Balcão',
          observation: 'Reserva Avulsa Noturna'
        }
      ];
    }

    matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return matches;
  }`;

const newGetMatches = `  function getMatchesForDate(dateStr) {
    if (!dateStr) dateStr = '2026-11-03';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayOfWeek = dayOfWeekMap[dt.getDay()];

    let matches = [];

    // 1. Mensalistas fixos do dia da semana
    (window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
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
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')'
        });
      }
    });

    // 2. Reservas diretas da data (estritamente b.date === dateStr)
    (window.adminGameState.bookings || []).forEach(b => {
      if (!b || b.status === 'cancelled') return;
      if (b.date === dateStr) {
        const court = getCourtById(b.court_id || b.courtId);
        const startT = b.start_time || (b.time ? b.time.split(' ')[0] : '19:00');
        const endT = b.end_time || (b.time ? b.time.split(' às ')[1] : '20:00');

        // Evita duplicatas se já existe mensalista no mesmo horário e campo, mantendo a data estrita
        const existing = matches.find(m => String(m.id) === String(b.id) || (m.court_id === court.id && m.start_time === startT));
        if (existing) {
          existing.status = b.status || existing.status;
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          if (b.ballReturned !== undefined) existing.ballReturned = b.ballReturned;
          if (b.finishedAt) existing.finishedAt = b.finishedAt;
          if (b.customer_name) existing.customer_name = b.customer_name;
          if (b.customer_phone) existing.customer_phone = b.customer_phone;
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
            status: b.status || 'confirmed',
            isMensalista: b.booking_type === 'mensalista' || (b.id && String(b.id).startsWith('monthly-')),
            booking_type: b.booking_type || 'avulso',
            payment_method: b.payment_method || 'PIX Balcão',
            observation: b.observation || 'Reserva direta confirmada'
          });
        }
      }
    });

    // Fallback garantido para terça-feira 03/11/2026 com sequência cronológica limpa
    if (matches.length === 0 && (dateStr === '2026-11-03' || dateStr.endsWith('-11-03'))) {
      matches = [
        {
          id: 'ARENA-2913',
          court_id: 'court-society-1',
          court_name: 'SOCIETY - ARENA CENTRAL',
          date: '2026-11-03',
          customer_name: 'Esc Ariadnes',
          customer_phone: '(81) 99556-2693',
          customer_cpf: '000.000.000-00',
          start_time: '16:00',
          end_time: '18:00',
          time: '16:00 às 18:00',
          total_price: 500,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-3251',
          court_id: 'court-futsal-1788963178368',
          court_name: 'QUADRA SOCIETY',
          date: '2026-11-03',
          customer_name: 'Aline',
          customer_phone: '(81) 99246-3081',
          customer_cpf: '',
          start_time: '18:30',
          end_time: '20:00',
          time: '18:30 às 20:00',
          total_price: 150,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'pago_balcao',
          observation: 'Reserva direta confirmada'
        },
        {
          id: 'ARENA-GENILSON-1103',
          court_id: 'court-society-2',
          court_name: 'FUT 6 - SOCCER 6',
          date: '2026-11-03',
          customer_name: 'Genilson',
          customer_phone: '(81) 99966-4317',
          customer_cpf: '',
          start_time: '20:00',
          end_time: '21:30',
          time: '20:00 às 21:30',
          total_price: 140,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'pago_balcao',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-ZELUIZ-1103',
          court_id: 'court-beach-1',
          court_name: 'FUT 7 - SOCCER 7',
          date: '2026-11-03',
          customer_name: 'Zé Luiz',
          customer_phone: '(81) 98877-6655',
          customer_cpf: '',
          start_time: '21:00',
          end_time: '22:30',
          time: '21:00 às 22:30',
          total_price: 160,
          status: 'confirmed',
          booking_type: 'avulso',
          payment_method: 'PIX Balcão',
          observation: 'Reserva Avulsa Noturna'
        }
      ];
    }

    // FILTRO ESTRITO DE DATA E HIGIENIZAÇÃO:
    // Garante que TODOS os jogos pertencem rigorosamente a dateStr e exclui contaminações entre dias
    matches = matches.filter(m => {
      if (!m) return false;
      if (m.date !== dateStr) return false;
      // Impede que mensalista fixo de outro dia apareça (ex: Davi de segunda aparecendo na terça)
      if (m.observation && m.observation.includes('Horário Fixo Semanal (')) {
        const expectedObs = 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')';
        if (m.observation !== expectedObs) return false;
      }
      return true;
    });

    matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return matches;
  }
  window.getMatchesForDate = getMatchesForDate;`;

// 3. Patch arenaToast
const oldToast = `  window.arenaToast = function(msg) {
    const t = document.getElementById('arenaToast');
    const txt = document.getElementById('arenaToastText');
    if (!t) return;
    if (txt) txt.textContent = msg;
    t.classList.remove('opacity-0', 'translate-y-3', 'pointer-events-none');
    t.classList.add('opacity-100', 'translate-y-0');
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    clearTimeout(window.arenaToastTimer);
    window.arenaToastTimer = setTimeout(() => {
      t.classList.add('opacity-0', 'translate-y-3', 'pointer-events-none');
      t.classList.remove('opacity-100', 'translate-y-0');
    }, 2800);
  };`;

const newToast = `  window.arenaToast = function(msg) {
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
  };`;

// 4. Patch getGame to avoid cross-day monthly promotions
const oldGetGamePromote = `        const court = getCourtById(m.court_id || m.courtId);
        const startT = m.start_time || m.startTime || m.time || '18:00';
        const endT = m.end_time || m.endTime || (startT.includes(':') ? String(Number(startT.split(':')[0]) + 1).padStart(2, '0') + ':' + startT.split(':')[1] : '19:00');
        const promoted = {
          id: String(id),
          court_id: court.id,
          court_name: court.name,
          date: window.adminGameState.selectedDate || '2026-11-03',
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
          dayFixed: (m.day_of_week || m.dayOfWeek || 'TERÇA').toUpperCase(),
          observation: 'Horário Fixo Semanal (' + (m.day_of_week || m.dayOfWeek || 'TERÇA').toUpperCase() + ')',
          note: 'Horário Fixo Semanal (' + (m.day_of_week || m.dayOfWeek || 'TERÇA').toUpperCase() + ')',
          attendance: 'Aguardando chegada',
          late: 0,
          log: [{ at: 'Reserva cadastrada', text: 'Horário fixo semanal · ' + (m.day_of_week || m.dayOfWeek || 'terça-feira') }],
          contract: {
            number: 'AL-MENS-' + m.id,
            type: 'Mensalista',
            start: '2026-10-01',
            end: '2026-12-31',
            day: (m.day_of_week || m.dayOfWeek || 'TERÇA').toUpperCase(),
            due: '10',
            amount: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
            signed: 'Assinado',
            terms: 'Horário fixo semanal às ' + (m.day_of_week || m.dayOfWeek || 'terças-feiras') + '. Comunicar alterações com antecedência.'
          }
        };
        window.adminGameState.bookings.push(promoted);
        return promoted;`;

const newGetGamePromote = `        const court = getCourtById(m.court_id || m.courtId);
        const startT = m.start_time || m.startTime || m.time || '18:00';
        const endT = m.end_time || m.endTime || (startT.includes(':') ? String(Number(startT.split(':')[0]) + 1).padStart(2, '0') + ':' + startT.split(':')[1] : '19:00');
        const selDate = window.adminGameState.selectedDate || '2026-11-03';
        const [sy, smm, sd] = selDate.split('-');
        const sdt = new Date(Number(sy), Number(smm) - 1, Number(sd), 12, 0, 0);
        const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const currentDayOfWeek = dayOfWeekMap[sdt.getDay()];
        const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");

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
        return promoted;`;

let countPatches = 0;

if (content.includes(oldLoadedBookings)) {
  content = content.replace(oldLoadedBookings, newLoadedBookings);
  countPatches++;
  console.log('✓ getLoadedBookings patched');
} else {
  console.warn('✗ oldLoadedBookings not found');
}

if (content.includes(oldGetMatches)) {
  content = content.replace(oldGetMatches, newGetMatches);
  countPatches++;
  console.log('✓ getMatchesForDate patched');
} else {
  console.warn('✗ oldGetMatches not found');
}

if (content.includes(oldToast)) {
  content = content.replace(oldToast, newToast);
  countPatches++;
  console.log('✓ arenaToast patched');
} else {
  console.warn('✗ oldToast not found');
}

if (content.includes(oldGetGamePromote)) {
  content = content.replace(oldGetGamePromote, newGetGamePromote);
  countPatches++;
  console.log('✓ getGame patched');
} else {
  console.warn('✗ oldGetGamePromote not found');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log(`Total patches applied: ${countPatches}/4`);
