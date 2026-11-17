const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Injetar Chart.js no <head> se não estiver presente
if (!html.includes('chart.js') && !html.includes('Chart.js')) {
  const chartJsScript = '  <!-- Chart.js para Relatórios & Métricas Operacionais -->\n  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n';
  html = html.replace('</head>', chartJsScript + '</head>');
}

// 2. Seção completa do panel-reports substituindo a seção estática existente
const targetPanelStart = '<!-- 🟢 PAINEL 6: RELATÓRIOS -->';
const targetPanelEnd = '<!-- 🟢 PAINEL 7: BACKUP -->';

const pStartIdx = html.indexOf(targetPanelStart);
const pEndIdx = html.indexOf(targetPanelEnd);

if (pStartIdx === -1 || pEndIdx === -1) {
  console.error('Painel de relatórios não localizado!');
  process.exit(1);
}

const reportsPanelHtml = `<!-- 🟢 PAINEL 6: RELATÓRIOS -->
    <section id="panel-reports" class="space-y-6 hidden">
      <!-- Cabeçalho do Relatório & Filtros de Período -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        
        <!-- Título do Painel -->
        <div class="flex items-start sm:items-center gap-3.5">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00a868] flex-shrink-0 shadow-inner">
            <i class="fa-solid fa-chart-simple text-2xl"></i>
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Relatórios & Métricas Operacionais
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 font-normal">
              Visão consolidada do banco de dados: ocupação, faturamento e fluxo de agendamentos
            </p>
          </div>
        </div>

        <!-- Barra de Filtros (Diário, Semanal, Mensal, Anual) -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold text-slate-600 border border-slate-200">
            <button onclick="window.alterarPeriodoRelatorios('diario')" id="btn-periodo-diario" class="periodo-btn px-3 py-1.5 rounded-lg transition hover:text-slate-900">
              Hoje (Diário)
            </button>
            <button onclick="window.alterarPeriodoRelatorios('semanal')" id="btn-periodo-semanal" class="periodo-btn px-3 py-1.5 rounded-lg transition hover:text-slate-900">
              Semana
            </button>
            <button onclick="window.alterarPeriodoRelatorios('mensal')" id="btn-periodo-mensal" class="periodo-btn px-3.5 py-1.5 rounded-lg bg-white text-[#00a868] font-bold shadow-sm transition">
              Mês
            </button>
            <button onclick="window.alterarPeriodoRelatorios('anual')" id="btn-periodo-anual" class="periodo-btn px-3 py-1.5 rounded-lg transition hover:text-slate-900">
              Ano
            </button>
          </div>

          <!-- Filtro por Espaço / Quadra -->
          <div class="relative">
            <select id="filtro-espaco-relatorio" onchange="window.atualizarFiltroEspacoRelatorio(this.value)" class="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
              <option value="todos">Todos os Espaços Esportivos (6)</option>
              <option value="fut5">FUT 5 – SOCCER 5</option>
              <option value="fut6">FUT 6 – SOCCER 6</option>
              <option value="fut7">FUT 7 – SOCCER 7</option>
              <option value="futmesa">FOOT TABLE – FUTMESA</option>
              <option value="areia">AREIA – BEACH SPORTS</option>
              <option value="society">QUADRA – ARENA CENTRAL</option>
            </select>
          </div>

          <!-- Ações de Exportação -->
          <div class="flex items-center gap-1.5 no-print">
            <button onclick="window.exportarRelatorioCSV()" title="Exportar dados em CSV/Planilha" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer">
              <i class="fa-solid fa-file-excel text-emerald-600"></i>
              <span class="hidden sm:inline">CSV</span>
            </button>
            <button onclick="window.print()" title="Imprimir ou Salvar em PDF" class="px-3.5 py-2 bg-[#00a868] hover:bg-[#008e57] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
              <i class="fa-solid fa-print"></i>
              <span>Imprimir</span>
            </button>
          </div>

        </div>

      </div>

      <!-- ================= CARDS DE KPIS ================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- KPI 1: Partidas Realizadas -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide" id="kpi-label-partidas">Partidas Realizadas no Mês</span>
            <span class="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs">
              <i class="fa-regular fa-futbol"></i>
            </span>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight" id="kpi-partidas">
            0
          </div>
          <div class="mt-2.5 flex items-center text-xs font-semibold text-emerald-600 gap-1" id="kpi-partidas-sub">
            <i class="fa-solid fa-arrow-trend-up"></i>
            <span>Sincronizado com a nuvem</span>
          </div>
        </div>

        <!-- KPI 2: Faturamento Consolidado -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide" id="kpi-label-faturamento">Faturamento Consolidado</span>
            <span class="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs">
              <i class="fa-solid fa-brazilian-real-sign"></i>
            </span>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight" id="kpi-faturamento">
            R$ 0,00
          </div>
          <div class="mt-2.5 flex items-center text-xs font-semibold text-emerald-600 gap-1" id="kpi-faturamento-sub">
            <i class="fa-solid fa-check"></i>
            <span>Total apurado no período</span>
          </div>
        </div>

        <!-- KPI 3: Taxa Média de Ocupação -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Taxa Média de Ocupação</span>
            <span class="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs">
              <i class="fa-solid fa-percent"></i>
            </span>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight" id="kpi-ocupacao">
            0%
          </div>
          <div class="mt-2.5 flex items-center text-xs font-semibold text-slate-600 gap-1.5" id="kpi-ocupacao-sub">
            <span class="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold text-[10px]">Pico</span>
            <span>18h às 22h</span>
          </div>
        </div>

        <!-- KPI 4: Ticket Médio por Agendamento -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between text-slate-400 mb-2">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Ticket Médio / Locação</span>
            <span class="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs">
              <i class="fa-solid fa-receipt"></i>
            </span>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight" id="kpi-ticket">
            R$ 0,00
          </div>
          <div class="mt-2.5 flex items-center text-xs text-slate-500 gap-1 font-medium" id="kpi-ticket-sub">
            <span>Valor médio por hora/partida</span>
          </div>
        </div>

      </div>

      <!-- ================= SEÇÃO DE GRÁFICOS: LINHA DO TEMPO & FORMAS DE PAGAMENTO ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Gráfico 1: Evolução de Faturamento & Agendamentos (Ocupa 2 colunas) -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-arrow-trend-up text-emerald-600"></i>
                <span>Evolução de Faturamento & Ocupação</span>
              </h3>
              <p class="text-xs text-slate-500" id="subtitulo-grafico-evolucao">
                Acompanhamento com base nos dados reais do sistema
              </p>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="inline-flex items-center gap-1.5 text-slate-600">
                <span class="w-3 h-3 rounded-full bg-[#00a868]"></span> Faturamento (R$)
              </span>
              <span class="inline-flex items-center gap-1.5 text-slate-600 ml-2">
                <span class="w-3 h-3 rounded-full bg-[#032e1d]"></span> Agendamentos
              </span>
            </div>
          </div>

          <div class="relative w-full h-[300px]">
            <canvas id="chartEvolucaoRelatorios"></canvas>
          </div>
        </div>

        <!-- Gráfico 2: Formas de Pagamento Mais Usadas (1 coluna) -->
        <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-wallet text-emerald-600"></i>
                <span>Formas de Pagamento</span>
              </h3>
              <span class="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                Ranking
              </span>
            </div>
            <p class="text-xs text-slate-500 mb-4">
              Meios mais utilizados pelos clientes da Arena
            </p>

            <div class="relative w-full h-[220px] flex items-center justify-center">
              <canvas id="chartPagamentosRelatorios"></canvas>
            </div>
          </div>

          <!-- Lista explicativa das formas com porcentagem -->
          <div class="grid grid-cols-2 gap-2 pt-4 mt-2 border-t border-slate-100 text-xs" id="legendas-pagamentos-relatorios">
            <div class="flex items-center justify-between p-1.5 rounded bg-slate-50">
              <span class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-[#00a868]"></span> Pix
              </span>
              <strong class="text-slate-900" id="pct-pix-rel">0%</strong>
            </div>
            <div class="flex items-center justify-between p-1.5 rounded bg-slate-50">
              <span class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-[#08442e]"></span> Crédito
              </span>
              <strong class="text-slate-900" id="pct-credito-rel">0%</strong>
            </div>
            <div class="flex items-center justify-between p-1.5 rounded bg-slate-50">
              <span class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Débito
              </span>
              <strong class="text-slate-900" id="pct-debito-rel">0%</strong>
            </div>
            <div class="flex items-center justify-between p-1.5 rounded bg-slate-50">
              <span class="flex items-center gap-1.5 font-medium text-slate-700">
                <span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Dinheiro
              </span>
              <strong class="text-slate-900" id="pct-dinheiro-rel">0%</strong>
            </div>
          </div>

        </div>

      </div>

      <!-- ================= SEÇÃO DE GRÁFICOS SECUNDÁRIOS: RECEITA POR ESPAÇO E HORÁRIOS DE PICO ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Gráfico 3: Faturamento por Espaço -->
        <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-layer-group text-emerald-600"></i>
                <span>Faturamento por Espaço Esportivo</span>
              </h3>
              <p class="text-xs text-slate-500">Distribuição financeira entre as quadras e campos da Arena</p>
            </div>
            <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              6 Quadras/Campos
            </span>
          </div>
          <div class="relative w-full h-[260px]">
            <canvas id="chartCategoriasRelatorios"></canvas>
          </div>
        </div>

        <!-- Gráfico 4: Horários de Pico / Ocupação por Faixa -->
        <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
                <i class="fa-solid fa-clock text-emerald-600"></i>
                <span>Fluxo de Horários de Maior Movimento</span>
              </h3>
              <p class="text-xs text-slate-500">Volume de partidas e intensidade de ocupação ao longo do dia</p>
            </div>
            <span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              Fluxo Diário
            </span>
          </div>
          <div class="relative w-full h-[260px]">
            <canvas id="chartHorariosRelatorios"></canvas>
          </div>
        </div>

      </div>

      <!-- ================= TABELA DE TRANSAÇÕES E FECHAMENTOS RECENTES ================= -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        <!-- Topo da Tabela -->
        <div class="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-receipt text-emerald-600"></i>
              <span>Últimos Agendamentos & Transações Registradas</span>
            </h3>
            <p class="text-xs text-slate-500">Histórico de reservas, mensalistas e pagamentos sincronizados com a nuvem</p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Campo de Pesquisa Rápida -->
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-xs text-slate-400"></i>
              <input type="text" id="filtro-tabela-relatorios" onkeyup="window.filtrarTabelaRelatorios()" placeholder="Buscar cliente, quadra ou forma..." class="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 w-56 sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition">
            </div>
            
            <button onclick="window.atualizarRelatoriosOperacionais(true)" title="Recarregar dados da nuvem" class="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-rotate"></i>
              <span class="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        <!-- Tabela Responsiva -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="tabela-transacoes-relatorios">
            <thead class="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/70">
              <tr>
                <th class="py-3 px-4">Horário / Data</th>
                <th class="py-3 px-4">Cliente / Contratante</th>
                <th class="py-3 px-4">Espaço / Atividade</th>
                <th class="py-3 px-4">Categoria</th>
                <th class="py-3 px-4">Forma Pagto</th>
                <th class="py-3 px-4 text-right">Valor</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700" id="tabela-corpo-relatorios">
              <!-- Linhas Injetadas via JavaScript -->
            </tbody>
          </table>
        </div>

        <!-- Rodapé da Tabela -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span id="contagem-transacoes-relatorios">Carregando registros...</span>
          <div class="flex items-center gap-1 font-medium">
            <span class="text-emerald-700 font-bold">● Sistema Online e Sincronizado com Banco de Dados</span>
          </div>
        </div>

      </div>
    </section>

    `;

html = html.substring(0, pStartIdx) + reportsPanelHtml + html.substring(pEndIdx);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully injected rich reports panel markup into public/admin.html!');
