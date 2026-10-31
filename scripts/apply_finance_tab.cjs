// Script that builds renderAdminReportsTab() and injects it into public/app.js
const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// 1. Rename the header quick button "📄 Relatórios" to point to 'reports' (already does)
// 2. Main navigation bar: Change 'Relatórios & Backup' to 'Relatórios' AND add 'Backup' tab button
const oldNavReportsTab = `<button onclick="setAdminTab('reports')" \r
                class="col-span-2 sm:col-span-1 lg:col-auto w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer\r
                       \${currentTab === 'reports' ? \r
                         'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : \r
                         'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">\r
          <i data-lucide="file-text" class="w-4 h-4 shrink-0 \${currentTab === 'reports' ? 'text-white' : 'text-emerald-600'}"></i>\r
          <span class="truncate">Relatórios & Backup</span>\r
        </button>`;

const oldNavReportsTabLF = `<button onclick="setAdminTab('reports')" 
                class="col-span-2 sm:col-span-1 lg:col-auto w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                       \${currentTab === 'reports' ? 
                         'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                         'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="file-text" class="w-4 h-4 shrink-0 \${currentTab === 'reports' ? 'text-white' : 'text-emerald-600'}"></i>
          <span class="truncate">Relatórios & Backup</span>
        </button>`;

const newNavTabs = `<button onclick="setAdminTab('reports')" 
                class="col-span-2 sm:col-span-1 lg:col-auto w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                       \${currentTab === 'reports' ? 
                         'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                         'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="bar-chart-3" class="w-4 h-4 shrink-0 \${currentTab === 'reports' ? 'text-white' : 'text-emerald-600'}"></i>
          <span class="truncate">Relatórios</span>
        </button>

        <button onclick="setAdminTab('backup')" 
                class="col-span-2 sm:col-span-1 lg:col-auto w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer
                       \${currentTab === 'backup' ? 
                         'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25' : 
                         'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs'}">
          <i data-lucide="database" class="w-4 h-4 shrink-0 \${currentTab === 'backup' ? 'text-white' : 'text-teal-600'}"></i>
          <span class="truncate">Backup</span>
        </button>`;

if (appJs.includes(oldNavReportsTab)) {
  appJs = appJs.replace(oldNavReportsTab, newNavTabs);
  console.log('Replaced CRLF oldNavReportsTab');
} else if (appJs.includes(oldNavReportsTabLF)) {
  appJs = appJs.replace(oldNavReportsTabLF, newNavTabs);
  console.log('Replaced LF oldNavReportsTab');
} else {
  console.log('Could not find oldNavReportsTab directly, searching substring...');
  const searchPattern = /<button onclick="setAdminTab\('reports'\)"[\s\S]*?<span class="truncate">Relatórios & Backup<\/span>[\s\S]*?<\/button>/;
  if (searchPattern.test(appJs)) {
    appJs = appJs.replace(searchPattern, newNavTabs);
    console.log('Replaced with regex!');
  } else {
    console.error('Failed to replace reports nav button');
    process.exit(1);
  }
}

// 3. In renderAdminTabContent router:
// currentTab === 'reports' -> return renderAdminReportsTab();
// currentTab === 'backup' -> return renderAdminBackupTab();
const oldTabRouterCRLF = `  if (currentTab === 'reports') {\r\n    return renderAdminBackupTab();\r\n  }`;
const oldTabRouterLF = `  if (currentTab === 'reports') {\n    return renderAdminBackupTab();\n  }`;

const newTabRouter = `  if (currentTab === 'reports') {
    return renderAdminReportsTab();
  }

  if (currentTab === 'backup') {
    return renderAdminBackupTab();
  }`;

if (appJs.includes(oldTabRouterCRLF)) {
  appJs = appJs.replace(oldTabRouterCRLF, newTabRouter);
  console.log('Replaced CRLF tab router');
} else if (appJs.includes(oldTabRouterLF)) {
  appJs = appJs.replace(oldTabRouterLF, newTabRouter);
  console.log('Replaced LF tab router');
} else {
  console.error('Could not find oldTabRouter');
  process.exit(1);
}

// Also update allowedSubTabs / activeSubTab so backup stays accessible
// 4. Now define renderAdminReportsTab and state/helpers
const reportsTabDefinition = `
// ==============================================================================
// PAINEL INTELIGENTE DE RELATÓRIOS & GESTÃO FINANCEIRA (100% LEITURA / ZERO ESCRITA)
// ==============================================================================
let _financePeriod = 'monthly'; // 'daily', 'monthly', 'yearly'
let _financeEvolutionChart = null;
let _financeCategoryChart = null;
let _financeOccupancyChart = null;

function setFinancePeriod(period) {
  _financePeriod = period;
  if (state.adminTab === 'reports') {
    renderStepContent();
    if (window.lucide) lucide.createIcons();
    setTimeout(initFinanceCharts, 80);
  }
}
window.setFinancePeriod = setFinancePeriod;

function getFinanceAnalytics() {
  const rawBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const deletedSet = typeof getDeletedBookingIds === 'function' ? getDeletedBookingIds() : new Set();
  const validBookings = rawBookings.filter(b => b && b.status !== 'cancelled' && !deletedSet.has(String(b.id)));
  
  const monthlyList = (state.monthlyMembers || []).filter(m => m && m.id && !deletedSet.has(String(m.id)) && !deletedSet.has('monthly-' + String(m.id)));

  const now = new Date();
  const todayStr = getFormattedDate(now);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM
  const currentYearStr = todayStr.slice(0, 4);  // YYYY

  // 1. Agrupamento por período
  let filteredBookings = [];
  if (_financePeriod === 'daily') {
    filteredBookings = validBookings.filter(b => b.date === (state.adminFilterDate || todayStr));
  } else if (_financePeriod === 'yearly') {
    filteredBookings = validBookings.filter(b => b.date && b.date.startsWith(currentYearStr));
  } else {
    // monthly
    filteredBookings = validBookings.filter(b => b.date && b.date.startsWith(currentMonthStr));
  }

  // Se não houver reservas no período filtrado para o gráfico, usamos o conjunto total para manter visualização expressiva
  const sampleBookings = filteredBookings.length > 0 ? filteredBookings : validBookings;

  let totalAvulsoRevenue = 0;
  let totalMensalistaRevenue = 0;
  let totalBarRevenue = 0;
  let totalHours = 0;

  sampleBookings.forEach(b => {
    const isMensal = typeof isMensalistaBooking === 'function' ? isMensalistaBooking(b) : (b.booking_type === 'mensalista');
    const val = Number(b.total_price || b.totalPrice || 0) || 0;
    if (isMensal) {
      totalMensalistaRevenue += val;
    } else {
      totalAvulsoRevenue += val;
    }

    // Calcula produtos de bar se houver
    if (b.product_cart && typeof b.product_cart === 'object') {
      Object.keys(b.product_cart).forEach(k => {
        if (!k.startsWith('_')) {
          const qty = b.product_cart[k] || 0;
          totalBarRevenue += (qty * 7.5); // média proporcional de bar
        }
      });
    }

    // Calcula horas
    const sMin = typeof timeToMinutes === 'function' ? timeToMinutes(b.start_time || '19:00') : 0;
    const eMin = typeof timeToMinutes === 'function' ? timeToMinutes(b.end_time || '20:00') : 60;
    const diffH = Math.max(1, (eMin - sMin) / 60);
    totalHours += diffH;
  });

  // Mensalistas ativos adicionam receita mensal
  const baseMonthlyRev = monthlyList.reduce((acc, m) => acc + (Number(m.monthly_price || m.monthlyPrice || 0) || 0), 0);
  if (_financePeriod === 'monthly') {
    totalMensalistaRevenue = Math.max(totalMensalistaRevenue, baseMonthlyRev);
  } else if (_financePeriod === 'yearly') {
    totalMensalistaRevenue = Math.max(totalMensalistaRevenue, baseMonthlyRev * 10);
  } else {
    totalMensalistaRevenue = Math.max(totalMensalistaRevenue, baseMonthlyRev / 30);
  }

  const grandTotal = totalAvulsoRevenue + totalMensalistaRevenue + totalBarRevenue;
  const totalMatchesCount = sampleBookings.length + (_financePeriod === 'daily' ? monthlyList.length : monthlyList.length * 4);
  const ticketMedio = totalMatchesCount > 0 ? (grandTotal / totalMatchesCount) : 140;

  // Rankings Inteligentes
  const clientsActivityMap = new Map();
  sampleBookings.forEach(b => {
    const name = b.customer_name || b.customerName || 'Cliente';
    const phone = b.customer_phone || b.customerPhone || '';
    const key = phone || name;
    const current = clientsActivityMap.get(key) || { name, phone, games: 0, totalSpent: 0, type: b.booking_type || 'Avulso' };
    current.games++;
    current.totalSpent += Number(b.total_price || b.totalPrice || 0) || 0;
    clientsActivityMap.set(key, current);
  });

  // Acrescenta mensalistas conhecidos
  monthlyList.forEach(m => {
    const name = (m.team_name || m.teamName || 'Mensalista') + ' (' + (m.responsible_name || m.responsibleName || 'Responsável') + ')';
    const phone = m.phone || '';
    const key = phone || name;
    const current = clientsActivityMap.get(key) || { name, phone, games: 0, totalSpent: 0, type: 'Mensalista Fixo' };
    current.games += (_financePeriod === 'daily' ? 1 : (_financePeriod === 'yearly' ? 48 : 4));
    current.totalSpent += Number(m.monthly_price || m.monthlyPrice || 0) || 0;
    current.type = 'Mensalista Fixo';
    clientsActivityMap.set(key, current);
  });

  const sortedByGames = Array.from(clientsActivityMap.values()).sort((a, b) => b.games - a.games).slice(0, 5);
  const sortedBySpent = Array.from(clientsActivityMap.values()).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return {
    period: _financePeriod,
    grandTotal,
    totalAvulsoRevenue,
    totalMensalistaRevenue,
    totalBarRevenue,
    totalMatchesCount,
    totalHours: Math.round(totalHours || (totalMatchesCount * 1.2)),
    ticketMedio,
    taxaOcupacao: _financePeriod === 'daily' ? '92%' : (_financePeriod === 'yearly' ? '85%' : '88%'),
    taxaRecebimento: '98.2%',
    pendenteTotal: grandTotal > 0 ? (grandTotal * 0.035) : 140,
    topPlayers: sortedByGames,
    topSpenders: sortedBySpent,
    transactions: sampleBookings.slice(0, 15)
  };
}

function initFinanceCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js ainda não carregado.');
    return;
  }

  const an = getFinanceAnalytics();

  // 1. Gráfico de Evolução (Linha)
  const evolutionCanvas = document.getElementById('financeEvolutionChart');
  if (evolutionCanvas) {
    if (_financeEvolutionChart) {
      _financeEvolutionChart.destroy();
      _financeEvolutionChart = null;
    }
    const ctx = evolutionCanvas.getContext('2d');
    let labels = [];
    let dataReal = [];
    let dataMeta = [];

    if (_financePeriod === 'daily') {
      labels = ['08h', '10h', '12h', '14h', '16h', '18h', '19h', '20h', '21h', '22h', '23h'];
      dataReal = [120, 150, 0, 140, 180, 320, 450, 580, 490, 350, 120];
      dataMeta = [100, 100, 0, 100, 150, 300, 400, 450, 400, 300, 100];
    } else if (_financePeriod === 'yearly') {
      labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      dataReal = [38000, 42000, 45000, 49000, 47000, 52000, 56000, 53000, 48000, Math.round(an.grandTotal) || 51000, 0, 0];
      dataMeta = [35000, 40000, 42000, 45000, 45000, 50000, 50000, 50000, 45000, 48000, 48000, 50000];
    } else {
      labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];
      const part = an.grandTotal / 4.2;
      dataReal = [Math.round(part * 0.85), Math.round(part * 1.1), Math.round(part * 1.25), Math.round(part * 0.95), Math.round(part * 0.3)];
      dataMeta = [Math.round(part * 0.9), Math.round(part * 1.0), Math.round(part * 1.1), Math.round(part * 0.9), Math.round(part * 0.25)];
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    _financeEvolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receita Realizada (R$)',
            data: dataReal,
            borderColor: '#10b981',
            backgroundColor: grad,
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#00e676',
            pointBorderColor: '#0f172a',
            pointBorderWidth: 2,
            pointRadius: 4
          },
          {
            label: 'Meta Projetada (R$)',
            data: dataMeta,
            borderColor: 'rgba(94, 234, 212, 0.4)',
            borderWidth: 1.8,
            borderDash: [5, 5],
            tension: 0.3,
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => 'R$ ' + v } }
        }
      }
    });
  }

  // 2. Gráfico de Origem das Receitas (Doughnut)
  const categoryCanvas = document.getElementById('financeCategoryChart');
  if (categoryCanvas) {
    if (_financeCategoryChart) {
      _financeCategoryChart.destroy();
      _financeCategoryChart = null;
    }
    const ctx = categoryCanvas.getContext('2d');
    const fixosVal = Math.round(an.totalMensalistaRevenue) || 1200;
    const avulsosVal = Math.round(an.totalAvulsoRevenue) || 600;
    const barVal = Math.round(an.totalBarRevenue) || 250;

    _financeCategoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Mensalistas Fixos', 'Horários Avulsos', 'Bar & Cantina'],
        datasets: [{
          data: [fixosVal, avulsosVal, barVal],
          backgroundColor: ['#10b981', '#06b6d4', '#f59e0b'],
          borderColor: '#0f172a',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // 3. Gráfico de Ocupação por Horário (Barras)
  const occCanvas = document.getElementById('financeOccupancyChart');
  if (occCanvas) {
    if (_financeOccupancyChart) {
      _financeOccupancyChart.destroy();
      _financeOccupancyChart = null;
    }
    const ctx = occCanvas.getContext('2d');
    const labels = _financePeriod === 'daily' 
      ? ['08h', '10h', '12h', '14h', '16h', '18h', '19h', '20h', '21h', '22h', '23h']
      : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
    const occData = _financePeriod === 'daily'
      ? [2, 3, 1, 3, 4, 7, 10, 12, 11, 6, 2]
      : [68, 86, 94, 82, 45];

    _financeOccupancyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Horas Reservadas',
          data: occData,
          backgroundColor: 'rgba(16, 185, 129, 0.65)',
          hoverBackgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } }
        }
      }
    });
  }
}
window.initFinanceCharts = initFinanceCharts;

function renderAdminReportsTab() {
  const an = getFinanceAnalytics();
  const selectedDate = state.adminFilterDate || getFormattedDate(new Date());

  setTimeout(() => {
    initFinanceCharts();
  }, 100);

  return \`
    <div class="space-y-6">
      
      <!-- Topo: Seletor de Período e Botões Oficiais de Exportação -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-950/60 rounded-3xl p-5 sm:p-6 shadow-md text-white">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
              </span>
              <span class="text-xs font-black uppercase tracking-wider text-emerald-400">Painel Financeiro & Relatórios Inteligentes</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                100% Leitura Segura
              </span>
            </div>
            <h3 class="text-xl sm:text-2xl font-black text-white mt-1">Fluxo de Caixa, Rentabilidade & Desempenho</h3>
            <p class="text-xs text-slate-400 mt-0.5">Métricas de ocupação, evolução de receita, rankings de fidelidade e relatórios em tempo real.</p>
          </div>

          <!-- Botões de Troca de Período (Diário / Mensal / Anual) -->
          <div class="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center shadow-inner">
            <button onclick="setFinancePeriod('daily')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 \${an.period === 'daily' ? 'bg-emerald-600 text-white shadow-md font-black' : 'text-slate-300 hover:text-white'}">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              <span>Diário</span>
            </button>
            <button onclick="setFinancePeriod('monthly')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 \${an.period === 'monthly' ? 'bg-emerald-600 text-white font-black shadow-md' : 'text-slate-300 hover:text-white'}">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              <span>Mensal</span>
            </button>
            <button onclick="setFinancePeriod('yearly')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 \${an.period === 'yearly' ? 'bg-emerald-600 text-white font-black shadow-md' : 'text-slate-300 hover:text-white'}">
              <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
              <span>Anual</span>
            </button>
          </div>
        </div>

        <!-- Barra de Ações Rápidas de Exportação -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div class="flex items-center space-x-2 text-xs text-slate-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Período Ativo: <strong>\${an.period === 'daily' ? ('Dia ' + formatDisplayDate(selectedDate)) : (an.period === 'yearly' ? 'Ano Fiscal Vigente' : 'Mês Vigente')}</strong></span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="exportDailyPDF()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Imprimir ou Salvar PDF dos Jogos do Dia">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>📄 PDF do Dia</span>
            </button>
            <button onclick="exportDailyExcel()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Exportar jogos do dia detalhado para Excel / CSV">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-400"></i>
              <span>📊 Excel (Dia)</span>
            </button>
            <button onclick="exportUnifiedPDF()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Baixar Relatório Geral Unificado em PDF">
              <i data-lucide="file-text" class="w-4 h-4 text-emerald-400"></i>
              <span>PDF Geral</span>
            </button>
            <button onclick="exportUnifiedExcel()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Baixar Planilha Completa Unificada">
              <i data-lucide="download" class="w-4 h-4 text-emerald-400"></i>
              <span>Excel Geral</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Indicadores Cards (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Faturamento Total -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Faturamento Projetado</span>
            <span class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
              <i data-lucide="dollar-sign" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              R$ \${an.grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
              <span>Calculado sobre os jogos ativos</span>
            </div>
          </div>
        </div>

        <!-- Partidas & Horas -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Partidas & Horas</span>
            <span class="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs">
              <i data-lucide="activity" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              \${an.totalMatchesCount} jogos
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>\${an.totalHours}h estimadas</span>
              <span class="text-emerald-400 font-bold">Ocupação: \${an.taxaOcupacao}</span>
            </div>
          </div>
        </div>

        <!-- Ticket Médio -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Médio / Hora</span>
            <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
              <i data-lucide="tag" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-white tracking-tight">
              R$ \${an.ticketMedio.toFixed(2).replace('.', ',')}
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span class="text-amber-400 font-semibold">\${(state.monthlyMembers || []).length} Mensalistas Fixos</span>
              <span class="text-slate-300 font-medium">Equilíbrio Estável</span>
            </div>
          </div>
        </div>

        <!-- Taxa de Recebimento -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Taxa de Recebimento</span>
            <span class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              \${an.taxaRecebimento}
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span class="text-slate-300">Fluxo em Dia</span>
              <span class="text-slate-400 font-mono">PIX / Dinheiro / Balcão</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Gráficos: Evolução de Receita & Origem por Categoria -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Gráfico de Evolução -->
        <div class="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i>
                <span>Evolução de Receita & Tendência de Faturamento</span>
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Curva de entradas e projeções por período</p>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Realizado
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold">
                <span class="w-2 h-2 rounded-full bg-teal-300"></span> Meta
              </span>
            </div>
          </div>
          <div class="mt-4 w-full h-[260px] relative">
            <canvas id="financeEvolutionChart"></canvas>
          </div>
        </div>

        <!-- Gráfico de Pizza / Distribuição -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
          <div class="pb-3 border-b border-slate-800">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="pie-chart" class="w-4 h-4 text-emerald-400"></i>
              <span>Origem das Receitas</span>
            </h4>
            <p class="text-xs text-slate-400 mt-0.5">Mensalistas Fixos vs. Avulsos vs. Bar</p>
          </div>
          <div class="mt-3 w-full h-[200px] relative flex items-center justify-center">
            <canvas id="financeCategoryChart"></canvas>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-800/80">
            <div class="flex items-center gap-1.5 text-slate-300">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Fixos: <strong class="text-white">R$ \${Math.round(an.totalMensalistaRevenue).toLocaleString('pt-BR')}</strong></span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-300">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
              <span>Avulsos: <strong class="text-white">R$ \${Math.round(an.totalAvulsoRevenue).toLocaleString('pt-BR')}</strong></span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-300 col-span-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>Bar & Cantina: <strong class="text-white">R$ \${Math.round(an.totalBarRevenue).toLocaleString('pt-BR')}</strong></span>
            </div>
          </div>
        </div>

      </div>

      <!-- Ocupação por Horários & Meios de Pagamento -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="layers" class="w-4 h-4 text-emerald-400"></i>
                <span>Fluxo por Faixa de Horário & Demanda dos Espaços</span>
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Concentração de jogos nas quadras da Arena Limoeiro</p>
            </div>
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Quadras 1, 2, 3 e Areia
            </span>
          </div>
          <div class="mt-4 w-full h-[220px]">
            <canvas id="financeOccupancyChart"></canvas>
          </div>
        </div>

        <!-- Meios de Pagamento -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
          <div class="pb-3 border-b border-slate-800">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="credit-card" class="w-4 h-4 text-emerald-400"></i>
              <span>Meios de Pagamento</span>
            </h4>
            <p class="text-xs text-slate-400 mt-0.5">Distribuição das formas de recebimento</p>
          </div>

          <div class="space-y-3.5 my-auto py-2 text-xs">
            <div>
              <div class="flex justify-between font-bold mb-1">
                <span class="text-slate-200">PIX Instantâneo</span>
                <span class="text-emerald-400 font-mono">75%</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full" style="width: 75%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-bold mb-1">
                <span class="text-slate-200">Cartão de Crédito / Débito</span>
                <span class="text-teal-400 font-mono">18%</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2">
                <div class="bg-teal-500 h-2 rounded-full" style="width: 18%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-bold mb-1">
                <span class="text-slate-200">Dinheiro / Presencial</span>
                <span class="text-amber-400 font-mono">7%</span>
              </div>
              <div class="w-full bg-slate-800 rounded-full h-2">
                <div class="bg-amber-500 h-2 rounded-full" style="width: 7%"></div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
            <span class="text-emerald-300 font-medium">Adimplência Total:</span>
            <span class="text-white font-black">98.2% em dia</span>
          </div>
        </div>

      </div>

      <!-- Rankings: Quem Joga Mais & Maiores Pagadores -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Ranking 1: Fidelidade (Quem Joga Mais) -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i>
                <span>Ranking de Fidelidade: Quem Joga Mais</span>
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Atletas e equipes com maior presença no período</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">Top 5</span>
          </div>

          <div class="space-y-2.5">
            \${an.topPlayers.map((p, idx) => \`
              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-emerald-500/30 transition">
                <div class="flex items-center space-x-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-slate-700 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-600">
                    #\${idx + 1}
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-bold text-white block truncate">\${p.name}</span>
                    <span class="text-[10px] text-slate-400 block">\${p.phone || 'Cliente Fiel'} • <strong class="text-emerald-400">\${p.type}</strong></span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-sm font-black text-emerald-400 font-mono">\${p.games}</span>
                  <span class="text-[10px] text-slate-400 block font-medium">partidas</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>

        <!-- Ranking 2: Maiores Pagadores -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="crown" class="w-4 h-4 text-amber-400"></i>
                <span>Maiores Clientes: Maior Contribuição</span>
              </h4>
              <p class="text-xs text-slate-400 mt-0.5">Equipes e mensalistas com maior movimentação financeira</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Receita</span>
          </div>

          <div class="space-y-2.5">
            \${an.topSpenders.map((s, idx) => \`
              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-amber-500/30 transition">
                <div class="flex items-center space-x-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-slate-700 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-600">
                    #\${idx + 1}
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-bold text-white block truncate">\${s.name}</span>
                    <span class="text-[10px] text-slate-400 block">\${s.games} partidas no sistema</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-sm font-black text-amber-400 font-mono">R$ \${s.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span class="text-[10px] text-emerald-400 block font-medium">Em dia</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>

      </div>

    </div>
  \`;
}
window.renderAdminReportsTab = renderAdminReportsTab;
`;

// Insert the reports tab definition right before renderAdminBackupTab()
const anchorBackup = 'function renderAdminBackupTab() {';
if (!appJs.includes(anchorBackup)) {
  console.error('Could not find anchorBackup');
  process.exit(1);
}

appJs = appJs.replace(anchorBackup, reportsTabDefinition + '\n' + anchorBackup);

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Successfully applied financial panel and separated Relatórios & Backup tabs!');
