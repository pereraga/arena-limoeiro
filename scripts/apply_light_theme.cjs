const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// Function to replace dark backgrounds in renderAdminReportsTab & initFinanceCharts with high-contrast light theme
const oldReportsCodeStart = 'function initFinanceCharts() {';
const oldReportsCodeEnd = 'window.renderAdminReportsTab = renderAdminReportsTab;';

const startIdx = appJs.indexOf(oldReportsCodeStart);
const endIdx = appJs.indexOf(oldReportsCodeEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not locate reports code boundaries');
  process.exit(1);
}

const newLightReportsCode = `function initFinanceCharts() {
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
    grad.addColorStop(0, 'rgba(5, 150, 105, 0.28)');
    grad.addColorStop(1, 'rgba(5, 150, 105, 0.0)');

    _financeEvolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receita Realizada (R$)',
            data: dataReal,
            borderColor: '#059669',
            backgroundColor: grad,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#047857',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 6.5
          },
          {
            label: 'Meta Projetada (R$)',
            data: dataMeta,
            borderColor: '#0284c7',
            borderWidth: 2,
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
          x: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, ticks: { color: '#475569', font: { size: 11, weight: '600' } } },
          y: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, ticks: { color: '#475569', font: { size: 11, weight: '600' }, callback: v => 'R$ ' + v } }
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
          backgroundColor: ['#059669', '#0284c7', '#f59e0b'],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
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
          backgroundColor: '#10b981',
          hoverBackgroundColor: '#059669',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11, weight: '600' } } },
          y: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, ticks: { color: '#475569', font: { size: 11, weight: '600' } } }
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
      <div class="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
              </span>
              <span class="text-xs font-black uppercase tracking-wider text-emerald-800">Painel Financeiro & Relatórios Inteligentes</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                100% Leitura Segura
              </span>
            </div>
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">Fluxo de Caixa, Rentabilidade & Desempenho</h3>
            <p class="text-xs text-slate-500 mt-0.5">Métricas de ocupação, evolução de receita, rankings de fidelidade e relatórios em tempo real.</p>
          </div>

          <!-- Botões de Troca de Período (Diário / Mensal / Anual) -->
          <div class="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-center shadow-inner">
            <button onclick="setFinancePeriod('daily')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer \${an.period === 'daily' ? 'bg-emerald-600 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              <span>Diário</span>
            </button>
            <button onclick="setFinancePeriod('monthly')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer \${an.period === 'monthly' ? 'bg-emerald-600 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              <span>Mensal</span>
            </button>
            <button onclick="setFinancePeriod('yearly')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer \${an.period === 'yearly' ? 'bg-emerald-600 text-white shadow font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}">
              <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i>
              <span>Anual</span>
            </button>
          </div>
        </div>

        <!-- Barra de Ações Rápidas de Exportação -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div class="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Período Ativo: <strong class="text-slate-900 font-bold">\${an.period === 'daily' ? ('Dia ' + formatDisplayDate(selectedDate)) : (an.period === 'yearly' ? 'Ano Fiscal Vigente' : 'Mês Vigente')}</strong></span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="exportDailyPDF()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Imprimir ou Salvar PDF dos Jogos do Dia">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>📄 PDF do Dia</span>
            </button>
            <button onclick="exportDailyExcel()" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Exportar jogos do dia detalhado para Excel / CSV">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-400"></i>
              <span>📊 Excel (Dia)</span>
            </button>
            <button onclick="exportUnifiedPDF()" class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Baixar Relatório Geral Unificado em PDF">
              <i data-lucide="file-text" class="w-4 h-4 text-emerald-600"></i>
              <span>PDF Geral</span>
            </button>
            <button onclick="exportUnifiedExcel()" class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer" title="Baixar Planilha Completa Unificada">
              <i data-lucide="download" class="w-4 h-4 text-emerald-600"></i>
              <span>Excel Geral</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Indicadores Cards (KPIs) com Fundo Claro e Alta Nitidez -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Faturamento Total -->
        <div class="bg-white border border-slate-200 p-5 rounded-3xl relative overflow-hidden shadow-xs hover:border-emerald-300 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Faturamento Projetado</span>
            <span class="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs">
              <i data-lucide="dollar-sign" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              R$ \${an.grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
              <span>Calculado sobre os jogos ativos</span>
            </div>
          </div>
        </div>

        <!-- Partidas & Horas -->
        <div class="bg-white border border-slate-200 p-5 rounded-3xl relative overflow-hidden shadow-xs hover:border-teal-300 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Partidas & Horas</span>
            <span class="p-2.5 rounded-2xl bg-teal-100 text-teal-800 text-xs">
              <i data-lucide="activity" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              \${an.totalMatchesCount} jogos
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>\${an.totalHours}h estimadas</span>
              <span class="text-teal-700 font-bold">Ocupação: \${an.taxaOcupacao}</span>
            </div>
          </div>
        </div>

        <!-- Ticket Médio -->
        <div class="bg-white border border-slate-200 p-5 rounded-3xl relative overflow-hidden shadow-xs hover:border-amber-300 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio / Hora</span>
            <span class="p-2.5 rounded-2xl bg-amber-100 text-amber-800 text-xs">
              <i data-lucide="tag" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              R$ \${an.ticketMedio.toFixed(2).replace('.', ',')}
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span class="text-amber-800 font-bold">\${(state.monthlyMembers || []).length} Mensalistas Fixos</span>
              <span class="text-slate-600 font-medium">Equilíbrio Estável</span>
            </div>
          </div>
        </div>

        <!-- Taxa de Recebimento -->
        <div class="bg-white border border-slate-200 p-5 rounded-3xl relative overflow-hidden shadow-xs hover:border-blue-300 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Taxa de Recebimento</span>
            <span class="p-2.5 rounded-2xl bg-blue-100 text-blue-800 text-xs">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
            </span>
          </div>
          <div class="mt-3">
            <div class="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              \${an.taxaRecebimento}
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span class="text-slate-700 font-medium">Fluxo em Dia</span>
              <span class="text-slate-500 font-mono">PIX / Dinheiro / Balcão</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Gráficos: Evolução de Receita & Origem por Categoria -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Gráfico de Evolução -->
        <div class="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h4 class="text-base font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="trending-up" class="w-4 h-4 text-emerald-600"></i>
                <span>Evolução de Receita & Tendência de Faturamento</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Curva de entradas e projeções por período</p>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-600"></span> Realizado
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-bold">
                <span class="w-2 h-2 rounded-full bg-sky-600"></span> Meta
              </span>
            </div>
          </div>
          <div class="mt-4 w-full h-[260px] relative">
            <canvas id="financeEvolutionChart"></canvas>
          </div>
        </div>

        <!-- Gráfico de Pizza / Distribuição -->
        <div class="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-xs">
          <div class="pb-3 border-b border-slate-100">
            <h4 class="text-base font-black text-slate-900 flex items-center gap-2">
              <i data-lucide="pie-chart" class="w-4 h-4 text-emerald-600"></i>
              <span>Origem das Receitas</span>
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">Mensalistas Fixos vs. Avulsos vs. Bar</p>
          </div>
          <div class="mt-3 w-full h-[200px] relative flex items-center justify-center">
            <canvas id="financeCategoryChart"></canvas>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5 text-slate-700">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
              <span>Fixos: <strong class="text-slate-900">R$ \${Math.round(an.totalMensalistaRevenue).toLocaleString('pt-BR')}</strong></span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-700">
              <span class="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0"></span>
              <span>Avulsos: <strong class="text-slate-900">R$ \${Math.round(an.totalAvulsoRevenue).toLocaleString('pt-BR')}</strong></span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-700 col-span-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>Bar & Cantina: <strong class="text-slate-900">R$ \${Math.round(an.totalBarRevenue).toLocaleString('pt-BR')}</strong></span>
            </div>
          </div>
        </div>

      </div>

      <!-- Ocupação por Horários & Meios de Pagamento -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 class="text-base font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="layers" class="w-4 h-4 text-emerald-600"></i>
                <span>Fluxo por Faixa de Horário & Demanda dos Espaços</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Concentração de jogos nas quadras da Arena Limoeiro</p>
            </div>
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Quadras 1, 2, 3 e Areia
            </span>
          </div>
          <div class="mt-4 w-full h-[220px]">
            <canvas id="financeOccupancyChart"></canvas>
          </div>
        </div>

        <!-- Meios de Pagamento -->
        <div class="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-xs">
          <div class="pb-3 border-b border-slate-100">
            <h4 class="text-base font-black text-slate-900 flex items-center gap-2">
              <i data-lucide="credit-card" class="w-4 h-4 text-emerald-600"></i>
              <span>Meios de Pagamento</span>
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">Distribuição das formas de recebimento</p>
          </div>

          <div class="space-y-3.5 my-auto py-2 text-xs">
            <div>
              <div class="flex justify-between font-bold mb-1">
                <span class="text-slate-700">PIX Instantâneo</span>
                <span class="text-emerald-700 font-mono font-black">75%</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-emerald-600 h-2 rounded-full" style="width: 75%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-bold mb-1">
                <span class="text-slate-700">Cartão de Crédito / Débito</span>
                <span class="text-teal-700 font-mono font-black">18%</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-teal-600 h-2 rounded-full" style="width: 18%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-bold mb-1">
                <span class="text-slate-700">Dinheiro / Presencial</span>
                <span class="text-amber-700 font-mono font-black">7%</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-amber-500 h-2 rounded-full" style="width: 7%"></div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <span class="text-emerald-800 font-semibold">Adimplência Total:</span>
            <span class="text-emerald-950 font-black">98.2% em dia</span>
          </div>
        </div>

      </div>

      <!-- Rankings: Quem Joga Mais & Maiores Pagadores -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Ranking 1: Fidelidade (Quem Joga Mais) -->
        <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 class="text-base font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="trophy" class="w-4 h-4 text-amber-500"></i>
                <span>Ranking de Fidelidade: Quem Joga Mais</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Atletas e equipes com maior presença no período</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">Top 5</span>
          </div>

          <div class="space-y-2.5">
            \${an.topPlayers.map((p, idx) => \`
              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition">
                <div class="flex items-center space-x-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300">
                    #\${idx + 1}
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-black text-slate-900 block truncate">\${p.name}</span>
                    <span class="text-[10px] text-slate-500 block">\${p.phone || 'Cliente Fiel'} • <strong class="text-emerald-700">\${p.type}</strong></span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-sm font-black text-emerald-700 font-mono">\${p.games}</span>
                  <span class="text-[10px] text-slate-500 block font-medium">partidas</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>

        <!-- Ranking 2: Maiores Pagadores -->
        <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 class="text-base font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="crown" class="w-4 h-4 text-amber-500"></i>
                <span>Maiores Clientes: Maior Contribuição</span>
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">Equipes e mensalistas com maior movimentação financeira</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">Receita</span>
          </div>

          <div class="space-y-2.5">
            \${an.topSpenders.map((s, idx) => \`
              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition">
                <div class="flex items-center space-x-3 min-w-0">
                  <div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 border border-slate-300">
                    #\${idx + 1}
                  </div>
                  <div class="min-w-0">
                    <span class="text-xs font-black text-slate-900 block truncate">\${s.name}</span>
                    <span class="text-[10px] text-slate-500 block">\${s.games} partidas no sistema</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-sm font-black text-amber-800 font-mono">R$ \${s.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span class="text-[10px] text-emerald-700 block font-bold">Em dia</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>

      </div>

    </div>
  \`;
}
window.renderAdminReportsTab = renderAdminReportsTab;`;

appJs = appJs.slice(0, startIdx) + newLightReportsCode + appJs.slice(endIdx + oldReportsCodeEnd.length);

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Successfully updated reports tab to clean, highly-visible light theme!');
