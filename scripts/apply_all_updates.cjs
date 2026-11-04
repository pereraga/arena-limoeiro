const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

console.log('Original content length:', content.length);

// -------------------------------------------------------------
// 1. UPDATE STRIP HTML (03 Nov 5 jogos + dates on all cards)
// -------------------------------------------------------------
const oldStripHtml = `<div id="movementDaysStrip" class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">QUI</span>
          <span class="text-base font-black text-slate-800 block">29</span>
          <span class="text-[9px] text-slate-400 block">Out</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">4 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SEX</span>
          <span class="text-base font-black text-slate-800 block">30</span>
          <span class="text-[9px] text-slate-400 block">Out</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">9 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SÁB</span>
          <span class="text-base font-black text-slate-800 block">31</span>
          <span class="text-[9px] text-slate-400 block">Out</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">6 jogos</span>
        </div>
        <!-- DOM 01 -->
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-01" onclick="selectMovementDay('2026-11-01', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">DOM</span>
          <span class="text-base font-black text-slate-800 block">01</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black inline-block">Sem jogos</span>
        </div>
        <!-- SEG 02 -->
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-02" onclick="selectMovementDay('2026-11-02', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SEG</span>
          <span class="text-base font-black text-slate-800 block">02</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">12 jogos</span>
        </div>
        <!-- DIA ATUAL: TER 03 (HOJE) -->
        <div class="min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer" data-date="2026-11-03" onclick="selectMovementDay('2026-11-03', this)">
          <span class="text-[10px] uppercase font-bold text-emerald-200 block">TER • HOJE</span>
          <span class="text-lg font-black text-white block">03</span>
          <span class="text-[9px] text-emerald-200 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block">4 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">QUA</span>
          <span class="text-base font-black text-slate-800 block">04</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">8 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">QUI</span>
          <span class="text-base font-black text-slate-800 block">05</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">7 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SEX</span>
          <span class="text-base font-black text-slate-800 block">06</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">9 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SÁB</span>
          <span class="text-base font-black text-slate-800 block">07</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">6 jogos</span>
        </div>
      </div>`;

const newStripHtml = `<div id="movementDaysStrip" class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-10-29" onclick="selectMovementDay('2026-10-29', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">QUI</span>
          <span class="text-base font-black text-slate-800 block">29</span>
          <span class="text-[9px] text-slate-400 block">Out</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">4 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-10-30" onclick="selectMovementDay('2026-10-30', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SEX</span>
          <span class="text-base font-black text-slate-800 block">30</span>
          <span class="text-[9px] text-slate-400 block">Out</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">9 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-10-31" onclick="selectMovementDay('2026-10-31', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SÁB</span>
          <span class="text-base font-black text-slate-800 block">31</span>
          <span class="text-[9px] text-slate-400 block">Out</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">6 jogos</span>
        </div>
        <!-- DOM 01 -->
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-01" onclick="selectMovementDay('2026-11-01', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">DOM</span>
          <span class="text-base font-black text-slate-800 block">01</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black inline-block">Sem jogos</span>
        </div>
        <!-- SEG 02 -->
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-02" onclick="selectMovementDay('2026-11-02', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SEG</span>
          <span class="text-base font-black text-slate-800 block">02</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">12 jogos</span>
        </div>
        <!-- DIA ATUAL: TER 03 (HOJE) -->
        <div class="min-w-[75px] p-2.5 rounded-2xl text-center bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-600 transition cursor-pointer" data-date="2026-11-03" onclick="selectMovementDay('2026-11-03', this)">
          <span class="text-[10px] uppercase font-bold text-emerald-200 block">TER • HOJE</span>
          <span class="text-lg font-black text-white block">03</span>
          <span class="text-[9px] text-emerald-200 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block">5 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-04" onclick="selectMovementDay('2026-11-04', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">QUA</span>
          <span class="text-base font-black text-slate-800 block">04</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">8 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-05" onclick="selectMovementDay('2026-11-05', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">QUI</span>
          <span class="text-base font-black text-slate-800 block">05</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">7 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-06" onclick="selectMovementDay('2026-11-06', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SEX</span>
          <span class="text-base font-black text-slate-800 block">06</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">9 jogos</span>
        </div>
        <div class="min-w-[70px] p-2.5 rounded-2xl border border-slate-200 text-center bg-white hover:border-slate-300 transition cursor-pointer" data-date="2026-11-07" onclick="selectMovementDay('2026-11-07', this)">
          <span class="text-[10px] uppercase font-bold text-slate-400 block">SÁB</span>
          <span class="text-base font-black text-slate-800 block">07</span>
          <span class="text-[9px] text-slate-400 block">Nov</span>
          <span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-black inline-block">6 jogos</span>
        </div>
      </div>`;

if (content.includes(oldStripHtml)) {
  content = content.replace(oldStripHtml, newStripHtml);
  console.log('✓ Updated strip HTML to 5 jogos on 03 Nov and added data-date attributes');
} else {
  console.warn('! Could not find exact oldStripHtml');
}

// -------------------------------------------------------------
// 2. WIRE CALENDAR HEADER BUTTONS (< Mês, <, >, Mês >, Hoje)
// -------------------------------------------------------------
const oldCalHeaderNav = `<div class="flex items-center gap-2">
          <button class="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>Hoje</span>
          </button>
          <button class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">&lt; Mês</button>
          <button class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">&lt;</button>
          <button class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">&gt;</button>
          <button class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">Mês &gt;</button>
          <span class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 flex items-center gap-1">
            <span>03 / 11 / 2026</span>
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
          </span>
        </div>`;

const newCalHeaderNav = `<div class="flex items-center gap-2">
          <button onclick="window.selectMovementDay('2026-11-03')" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer transition">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>Hoje</span>
          </button>
          <button onclick="window.navigateMovementDay(-7)" title="Semana anterior" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">&lt; Mês</button>
          <button onclick="window.navigateMovementDay(-1)" title="Dia anterior" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">&lt;</button>
          <button onclick="window.navigateMovementDay(1)" title="Próximo dia" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">&gt;</button>
          <button onclick="window.navigateMovementDay(7)" title="Próxima semana" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">Mês &gt;</button>
          <span id="calendarHeaderDateDisplay" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 flex items-center gap-1">
            <span>03 / 11 / 2026</span>
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
          </span>
        </div>`;

if (content.includes(oldCalHeaderNav)) {
  content = content.replace(oldCalHeaderNav, newCalHeaderNav);
  console.log('✓ Wired calendar header navigation buttons');
} else {
  console.warn('! Could not find exact oldCalHeaderNav');
}

// -------------------------------------------------------------
// 3. UPDATE FALLBACK IN getMatchesForDate (INCLUDE 5 GAMES)
// -------------------------------------------------------------
const oldFallback = `    // Fallback garantido para terça-feira 03/11/2026 com sequência cronológica limpa
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
    }`;

const newFallback = `    // Fallback garantido para terça-feira 03/11/2026 com os 5 jogos oficiais completos
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
          id: 'ARENA-3294',
          court_id: 'court-futsal-1788963178368',
          court_name: 'FUT 5 - SOCCER 5',
          date: '2026-11-03',
          customer_name: 'Ariadnes',
          customer_phone: '(81) 99999-2609',
          customer_cpf: '000.000.000-00',
          start_time: '16:00',
          end_time: '18:00',
          time: '16:00 às 18:00',
          total_price: 400,
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
          total_price: 400,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'pago_balcao',
          observation: 'Horário Fixo Semanal (TERÇA)'
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
          total_price: 600,
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
          total_price: 500,
          status: 'confirmed',
          booking_type: 'avulso',
          payment_method: 'PIX Balcão',
          observation: 'Reserva Avulsa Noturna'
        }
      ];
    }`;

if (content.includes(oldFallback)) {
  content = content.replace(oldFallback, newFallback);
  console.log('✓ Updated fallback in getMatchesForDate with 5 games (Total R$ 2400)');
} else {
  console.warn('! Could not find exact oldFallback');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Admin html written (Part 1)');
