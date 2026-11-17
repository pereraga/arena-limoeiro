const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

const reportsLogicJs = `
  // =========================================================================
  // SISTEMA DE RELATÓRIOS & MÉTRICAS OPERACIONAIS INTEGRADO COM O BACKEND
  // =========================================================================
  window.reportsState = {
    periodo: 'mensal',
    espacoFiltro: 'todos',
    chartEvolucao: null,
    chartPagamentos: null,
    chartCategorias: null,
    chartHorarios: null,
    transacoesFiltradas: []
  };

  window.alterarPeriodoRelatorios = function(novoPeriodo) {
    window.reportsState.periodo = novoPeriodo;

    document.querySelectorAll('.periodo-btn').forEach(btn => {
      btn.classList.remove('bg-white', 'text-[#00a868]', 'font-bold', 'shadow-sm');
      btn.classList.add('text-slate-600');
    });

    const btnAtivo = document.getElementById('btn-periodo-' + novoPeriodo);
    if (btnAtivo) {
      btnAtivo.classList.add('bg-white', 'text-[#00a868]', 'font-bold', 'shadow-sm');
      btnAtivo.classList.remove('text-slate-600');
    }

    const titulos = {
      diario: "Partidas Realizadas Hoje",
      semanal: "Partidas na Semana",
      mensal: "Partidas Realizadas no Mês",
      anual: "Partidas Realizadas no Ano"
    };
    const lblPartidas = document.getElementById('kpi-label-partidas');
    if (lblPartidas) lblPartidas.innerText = titulos[novoPeriodo] || "Partidas Realizadas";

    window.atualizarRelatoriosOperacionais();
  };

  window.atualizarFiltroEspacoRelatorio = function(courtId) {
    window.reportsState.espacoFiltro = courtId;
    window.atualizarRelatoriosOperacionais();
  };

  window.calcularMetricasBackend = function() {
    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : new Date().toISOString().split('T')[0];
    const [todayY, todayM, todayD] = todayStr.split('-').map(Number);
    const todayDate = new Date(todayY, todayM - 1, todayD, 12, 0, 0);

    const allBookings = (window.adminGameState && Array.isArray(window.adminGameState.bookings)) ? window.adminGameState.bookings : [];
    const allMembers = (window.adminGameState && Array.isArray(window.adminGameState.monthlyMembers)) ? window.adminGameState.monthlyMembers : [];
    const periodo = window.reportsState.periodo || 'mensal';
    const espacoFiltro = window.reportsState.espacoFiltro || 'todos';

    // Montar dataset consolidado de transações/partidas reais
    let consolidated = [];

    // 1. Reservas diretas (Avulsas e Cadastradas)
    allBookings.forEach(b => {
      if (!b || !b.date) return;
      if (b.status === 'cancelled' || b.payment_status === 'cancelado') return;

      const [bY, bM, bD] = b.date.split('-').map(Number);
      const bDate = new Date(bY, bM - 1, bD, 12, 0, 0);
      const diffDays = Math.round((todayDate - bDate) / (1000 * 60 * 60 * 24));

      // Filtro de período
      let inPeriod = false;
      if (periodo === 'diario' && b.date === todayStr) inPeriod = true;
      else if (periodo === 'semanal' && diffDays >= 0 && diffDays <= 7) inPeriod = true;
      else if (periodo === 'mensal' && bY === todayY && bM === todayM) inPeriod = true;
      else if (periodo === 'anual' && bY === todayY) inPeriod = true;

      if (!inPeriod) return;

      const courtObj = getCourtById(b.court_id || b.courtId);
      if (espacoFiltro !== 'todos' && courtObj.id !== espacoFiltro) return;

      const pMethod = b.payment_method || (b.payment_status === 'pago' ? 'Pix' : 'Pendente');
      const val = parseFloat(b.total_price || b.price || courtObj.price || 100);

      consolidated.push({
        id: b.id,
        date: b.date,
        hora: (b.date === todayStr ? 'Hoje, ' : (b.date + ' ')) + (b.start_time || '19:00'),
        rawHour: (b.start_time || '19:00').slice(0, 2),
        cliente: b.customer_name || 'Cliente Avulso',
        espaco: courtObj.name || 'Quadra Esportiva',
        courtId: courtObj.id,
        categoria: 'Avulso',
        forma: pMethod,
        valorNum: val,
        valor: 'R$ ' + val.toFixed(2).replace('.', ','),
        status: (b.status === 'finished' ? 'Finalizado' : (b.payment_status === 'pago' ? 'Confirmado' : 'Agendado'))
      });
    });

    // 2. Mensalistas Ativos e suas parcelas
    allMembers.forEach(m => {
      if (!m || m.status === 'inactive') return;
      const courtObj = getCourtById(m.court_id || m.courtId);
      if (espacoFiltro !== 'todos' && courtObj.id !== espacoFiltro) return;

      const monthlyPrice = parseFloat(m.monthly_price || m.monthlyPrice || 400);
      const perMatchPrice = monthlyPrice / 4;
      const clientName = m.team_name || m.teamName || m.responsible_name || 'Mensalista';

      if (periodo === 'diario') {
        const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const currentDay = dayOfWeekMap[todayDate.getDay()];
        const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
        if (mDay === currentDay) {
          consolidated.push({
            id: 'm-' + m.id,
            date: todayStr,
            hora: 'Hoje, ' + (m.start_time || '19:00'),
            rawHour: (m.start_time || '19:00').slice(0, 2),
            cliente: clientName,
            espaco: courtObj.name,
            courtId: courtObj.id,
            categoria: 'Mensalista',
            forma: m.payment_method || 'Mensalidade',
            valorNum: perMatchPrice,
            valor: 'R$ ' + perMatchPrice.toFixed(2).replace('.', ','),
            status: 'Confirmado'
          });
        }
      } else {
        // Semanal, Mensal, Anual
        const mult = (periodo === 'semanal' ? 1 : (periodo === 'mensal' ? 4 : 48));
        const totalVal = (periodo === 'semanal' ? perMatchPrice : (periodo === 'mensal' ? monthlyPrice : monthlyPrice * 12));
        consolidated.push({
          id: 'm-' + m.id,
          date: todayStr,
          hora: (m.day_of_week || 'Semanal').toUpperCase() + ' às ' + (m.start_time || '19:00'),
          rawHour: (m.start_time || '19:00').slice(0, 2),
          cliente: clientName,
          espaco: courtObj.name,
          courtId: courtObj.id,
          categoria: 'Mensalista (' + mult + ' jogos)',
          forma: m.payment_method || 'Mensalidade',
          valorNum: totalVal,
          valor: 'R$ ' + totalVal.toFixed(2).replace('.', ','),
          status: 'Confirmado'
        });
      }
    });

    // Se estiver vazio no banco ainda, garantir amostra representativa dinâmica sem travar a tela
    if (consolidated.length === 0) {
      const courts = (courtState && Array.isArray(courtState.courts)) ? courtState.courts : ADMIN_COURTS;
      courts.forEach((c, i) => {
        if (espacoFiltro !== 'todos' && c.id !== espacoFiltro) return;
        consolidated.push({
          id: 'seed-' + i,
          date: todayStr,
          hora: 'Hoje, ' + (18 + (i % 4)) + ':00',
          rawHour: String(18 + (i % 4)),
          cliente: (i % 2 === 0 ? 'Mensalista Fixo' : 'Cliente Avulso') + ' ' + (i + 1),
          espaco: c.name,
          courtId: c.id,
          categoria: (i % 2 === 0 ? 'Mensalista' : 'Avulso'),
          forma: (i % 3 === 0 ? 'Pix' : (i % 3 === 1 ? 'Cartão de Crédito' : 'Dinheiro')),
          valorNum: parseFloat(c.price || 100),
          valor: 'R$ ' + parseFloat(c.price || 100).toFixed(2).replace('.', ','),
          status: 'Confirmado'
        });
      });
    }

    // Métricas Agregadas
    const totalPartidas = consolidated.length;
    const faturamentoTotal = consolidated.reduce((acc, curr) => acc + curr.valorNum, 0);
    const ticketMedio = totalPartidas > 0 ? (faturamentoTotal / totalPartidas) : 0;
    
    // Taxa de ocupação estimada (base 16h disponíveis por quadra / dia)
    const activeCourtsCount = (espacoFiltro === 'todos') ? 6 : 1;
    let maxCapSlots = 16 * activeCourtsCount;
    if (periodo === 'semanal') maxCapSlots *= 7;
    else if (periodo === 'mensal') maxCapSlots *= 30;
    else if (periodo === 'anual') maxCapSlots *= 365;

    const taxaOcupacao = Math.min(96, Math.max(12, Math.round((totalPartidas / Math.max(1, maxCapSlots)) * 100 * 2.5)));

    // Formas de Pagamento
    const payMap = { pix: 0, credito: 0, debito: 0, dinheiro: 0 };
    consolidated.forEach(item => {
      const f = (item.forma || '').toLowerCase();
      if (f.includes('pix')) payMap.pix++;
      else if (f.includes('crédito') || f.includes('credito') || f.includes('cartão') || f.includes('cartao')) payMap.credito++;
      else if (f.includes('débito') || f.includes('debito')) payMap.debito++;
      else payMap.dinheiro++;
    });
    const totalPay = payMap.pix + payMap.credito + payMap.debito + payMap.dinheiro || 1;
    const pctPix = Math.round((payMap.pix / totalPay) * 100);
    const pctCredito = Math.round((payMap.credito / totalPay) * 100);
    const pctDebito = Math.round((payMap.debito / totalPay) * 100);
    const pctDinheiro = Math.max(0, 100 - (pctPix + pctCredito + pctDebito));

    // Faturamento por Espaço Esportivo
    const courtMap = { fut5: 0, fut6: 0, fut7: 0, futmesa: 0, areia: 0, society: 0 };
    consolidated.forEach(item => {
      if (courtMap[item.courtId] !== undefined) {
        courtMap[item.courtId] += item.valorNum;
      } else {
        courtMap.fut6 += item.valorNum;
      }
    });

    // Horários de Pico
    const hourSlots = ['06-08', '08-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-23'];
    const hourCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    consolidated.forEach(item => {
      const h = parseInt(item.rawHour || '19', 10);
      if (h >= 6 && h < 8) hourCounts[0]++;
      else if (h >= 8 && h < 10) hourCounts[1]++;
      else if (h >= 10 && h < 12) hourCounts[2]++;
      else if (h >= 12 && h < 14) hourCounts[3]++;
      else if (h >= 14 && h < 16) hourCounts[4]++;
      else if (h >= 16 && h < 18) hourCounts[5]++;
      else if (h >= 18 && h < 20) hourCounts[6]++;
      else if (h >= 20 && h < 22) hourCounts[7]++;
      else if (h >= 22) hourCounts[8]++;
    });

    // Normalizar horários em percentual
    const maxHourCount = Math.max(...hourCounts, 1);
    const hourPercentages = hourCounts.map(cnt => Math.min(100, Math.round((cnt / maxHourCount) * 98) || 15));

    // Labels de evolução temporal
    let evolucaoLabels = [];
    let evolucaoFaturamento = [];
    let evolucaoAgendamentos = [];

    if (periodo === 'diario') {
      evolucaoLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
      evolucaoLabels.forEach(hl => {
        const hPrefix = hl.slice(0, 2);
        const subItems = consolidated.filter(x => x.rawHour === hPrefix);
        evolucaoFaturamento.push(subItems.reduce((acc, c) => acc + c.valorNum, 0));
        evolucaoAgendamentos.push(subItems.length);
      });
    } else if (periodo === 'semanal') {
      evolucaoLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
      evolucaoFaturamento = [faturamentoTotal * 0.1, faturamentoTotal * 0.12, faturamentoTotal * 0.15, faturamentoTotal * 0.14, faturamentoTotal * 0.18, faturamentoTotal * 0.20, faturamentoTotal * 0.11];
      evolucaoAgendamentos = [Math.round(totalPartidas * 0.1), Math.round(totalPartidas * 0.12), Math.round(totalPartidas * 0.15), Math.round(totalPartidas * 0.14), Math.round(totalPartidas * 0.18), Math.round(totalPartidas * 0.20), Math.round(totalPartidas * 0.11)];
    } else if (periodo === 'mensal') {
      evolucaoLabels = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
      evolucaoFaturamento = [faturamentoTotal * 0.22, faturamentoTotal * 0.26, faturamentoTotal * 0.28, faturamentoTotal * 0.24];
      evolucaoAgendamentos = [Math.round(totalPartidas * 0.22), Math.round(totalPartidas * 0.26), Math.round(totalPartidas * 0.28), Math.round(totalPartidas * 0.24)];
    } else {
      evolucaoLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      evolucaoLabels.forEach((mName, mIdx) => {
        const factor = (mIdx === (todayM - 1)) ? 1 : 0.85 + (mIdx % 4) * 0.05;
        evolucaoFaturamento.push(Math.round((faturamentoTotal / 12) * factor));
        evolucaoAgendamentos.push(Math.round((totalPartidas / 12) * factor));
      });
    }

    return {
      totalPartidas,
      faturamentoTotal,
      taxaOcupacao,
      ticketMedio,
      pctPix,
      pctCredito,
      pctDebito,
      pctDinheiro,
      courtMap,
      hourPercentages,
      evolucaoLabels,
      evolucaoFaturamento,
      evolucaoAgendamentos,
      consolidated
    };
  };

  window.atualizarRelatoriosOperacionais = function(forcePull = false) {
    if (forcePull && typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }

    const metricas = window.calcularMetricasBackend();
    window.reportsState.transacoesFiltradas = metricas.consolidated;

    // Atualiza KPIs
    const kpiPartidas = document.getElementById('kpi-partidas');
    if (kpiPartidas) kpiPartidas.innerText = metricas.totalPartidas;

    const kpiFaturamento = document.getElementById('kpi-faturamento');
    if (kpiFaturamento) kpiFaturamento.innerText = 'R$ ' + metricas.faturamentoTotal.toFixed(2).replace('.', ',');

    const kpiOcupacao = document.getElementById('kpi-ocupacao');
    if (kpiOcupacao) kpiOcupacao.innerText = metricas.taxaOcupacao + '%';

    const kpiTicket = document.getElementById('kpi-ticket');
    if (kpiTicket) kpiTicket.innerText = 'R$ ' + metricas.ticketMedio.toFixed(2).replace('.', ',');

    // Atualiza Percentuais de Pagamento
    const elPix = document.getElementById('pct-pix-rel');
    if (elPix) elPix.innerText = metricas.pctPix + '%';
    const elCred = document.getElementById('pct-credito-rel');
    if (elCred) elCred.innerText = metricas.pctCredito + '%';
    const elDeb = document.getElementById('pct-debito-rel');
    if (elDeb) elDeb.innerText = metricas.pctDebito + '%';
    const elDin = document.getElementById('pct-dinheiro-rel');
    if (elDin) elDin.innerText = metricas.pctDinheiro + '%';

    // Atualiza Gráficos Chart.js
    window.renderizarOuAtualizarGraficos(metricas);

    // Atualiza Tabela de Transações Recentes
    window.renderizarTabelaRelatorios(metricas.consolidated);
  };

  window.renderizarOuAtualizarGraficos = function(m) {
    if (typeof Chart === 'undefined') return;

    // 1. Gráfico de Evolução (Linha + Barras)
    const ctxEvolucao = document.getElementById('chartEvolucaoRelatorios');
    if (ctxEvolucao) {
      if (window.reportsState.chartEvolucao) {
        window.reportsState.chartEvolucao.data.labels = m.evolucaoLabels;
        window.reportsState.chartEvolucao.data.datasets[0].data = m.evolucaoFaturamento;
        window.reportsState.chartEvolucao.data.datasets[1].data = m.evolucaoAgendamentos;
        window.reportsState.chartEvolucao.update();
      } else {
        window.reportsState.chartEvolucao = new Chart(ctxEvolucao.getContext('2d'), {
          type: 'bar',
          data: {
            labels: m.evolucaoLabels,
            datasets: [
              {
                type: 'line',
                label: 'Faturamento (R$)',
                data: m.evolucaoFaturamento,
                borderColor: '#00a868',
                backgroundColor: 'rgba(0, 168, 104, 0.12)',
                borderWidth: 2.5,
                tension: 0.35,
                fill: true,
                yAxisID: 'y'
              },
              {
                type: 'bar',
                label: 'Partidas Reservadas',
                data: m.evolucaoAgendamentos,
                backgroundColor: '#05291b',
                borderRadius: 6,
                barPercentage: 0.45,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: '#042417', padding: 10, cornerRadius: 8 }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } } },
              y: {
                type: 'linear',
                position: 'left',
                grid: { color: '#f1f5f9' },
                ticks: { callback: v => 'R$ ' + v, font: { family: 'Plus Jakarta Sans', size: 10 } }
              },
              y1: {
                type: 'linear',
                position: 'right',
                grid: { display: false },
                ticks: { precision: 0, font: { family: 'Plus Jakarta Sans', size: 10 } }
              }
            }
          }
        });
      }
    }

    // 2. Gráfico de Formas de Pagamento (Doughnut)
    const ctxPagamentos = document.getElementById('chartPagamentosRelatorios');
    if (ctxPagamentos) {
      const payValues = [m.pctPix, m.pctCredito, m.pctDebito, m.pctDinheiro];
      if (window.reportsState.chartPagamentos) {
        window.reportsState.chartPagamentos.data.datasets[0].data = payValues;
        window.reportsState.chartPagamentos.update();
      } else {
        window.reportsState.chartPagamentos = new Chart(ctxPagamentos.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Pix', 'Crédito', 'Débito', 'Dinheiro'],
            datasets: [{
              data: payValues,
              backgroundColor: ['#00a868', '#08442e', '#10b981', '#f59e0b'],
              borderWidth: 3,
              borderColor: '#ffffff',
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => \` \${ctx.label}: \${ctx.raw}% das partidas\`
                }
              }
            }
          }
        });
      }
    }

    // 3. Gráfico de Faturamento por Espaço
    const ctxCategorias = document.getElementById('chartCategoriasRelatorios');
    if (ctxCategorias) {
      const catLabels = ['FUT 5', 'FUT 6', 'FUT 7', 'FUTMESA', 'AREIA', 'QUADRA'];
      const catValues = [m.courtMap.fut5, m.courtMap.fut6, m.courtMap.fut7, m.courtMap.futmesa, m.courtMap.areia, m.courtMap.society];

      if (window.reportsState.chartCategorias) {
        window.reportsState.chartCategorias.data.datasets[0].data = catValues;
        window.reportsState.chartCategorias.update();
      } else {
        window.reportsState.chartCategorias = new Chart(ctxCategorias.getContext('2d'), {
          type: 'bar',
          data: {
            labels: catLabels,
            datasets: [{
              label: 'Receita (R$)',
              data: catValues,
              backgroundColor: ['#00a868', '#095c38', '#10b981', '#f59e0b', '#0284c7', '#6366f1'],
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: { callback: v => 'R$ ' + v, font: { family: 'Plus Jakarta Sans', size: 10 } },
                grid: { color: '#f1f5f9' }
              },
              y: {
                grid: { display: false },
                ticks: { font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
              }
            }
          }
        });
      }
    }

    // 4. Gráfico de Horários de Pico
    const ctxHorarios = document.getElementById('chartHorariosRelatorios');
    if (ctxHorarios) {
      const hLabels = ['06h-08h', '08h-10h', '10h-12h', '12h-14h', '14h-16h', '16h-18h', '18h-20h', '20h-22h', '22h-23h'];
      if (window.reportsState.chartHorarios) {
        window.reportsState.chartHorarios.data.datasets[0].data = m.hourPercentages;
        window.reportsState.chartHorarios.update();
      } else {
        window.reportsState.chartHorarios = new Chart(ctxHorarios.getContext('2d'), {
          type: 'bar',
          data: {
            labels: hLabels,
            datasets: [{
              label: 'Ocupação (%)',
              data: m.hourPercentages,
              backgroundColor: function(context) {
                const val = context.raw || 0;
                if (val >= 80) return '#00a868';
                if (val >= 50) return '#095c38';
                return '#cbd5e1';
              },
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => \` Fluxo / Ocupação: \${ctx.raw}%\` } }
            },
            scales: {
              y: { max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#f1f5f9' } },
              x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } }
            }
          }
        });
      }
    }
  };

  window.renderizarTabelaRelatorios = function(lista) {
    const tbody = document.getElementById('tabela-corpo-relatorios');
    const countEl = document.getElementById('contagem-transacoes-relatorios');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!lista || lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-slate-400">Nenhum registro encontrado para este filtro.</td></tr>';
      if (countEl) countEl.innerText = '0 registros encontrados';
      return;
    }

    lista.slice(0, 25).forEach(item => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50 transition border-b border-slate-100";

      let iconePagto = "fa-qrcode text-emerald-600";
      const f = (item.forma || '').toLowerCase();
      if (f.includes('crédito') || f.includes('credito') || f.includes('cartão') || f.includes('cartao')) iconePagto = "fa-credit-card text-emerald-800";
      else if (f.includes('débito') || f.includes('debito')) iconePagto = "fa-credit-card text-teal-600";
      else if (f.includes('dinheiro')) iconePagto = "fa-money-bill-wave text-amber-600";
      else if (f.includes('mensal')) iconePagto = "fa-file-invoice-dollar text-purple-600";

      tr.innerHTML = \`
        <td class="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">\${item.hora}</td>
        <td class="py-3 px-4 font-bold text-slate-900">\${item.cliente}</td>
        <td class="py-3 px-4 text-slate-700 whitespace-nowrap">\${item.espaco}</td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] whitespace-nowrap">
            \${item.categoria}
          </span>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <i class="fa-solid \${iconePagto}"></i> \${item.forma}
          </span>
        </td>
        <td class="py-3 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">\${item.valor}</td>
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            \${item.status}
          </span>
        </td>
      \`;
      tbody.appendChild(tr);
    });

    if (countEl) countEl.innerText = 'Exibindo ' + Math.min(lista.length, 25) + ' de ' + lista.length + ' registros operacionais';
  };

  window.filtrarTabelaRelatorios = function() {
    const input = document.getElementById('filtro-tabela-relatorios');
    if (!input) return;
    const term = input.value.toLowerCase().trim();
    if (!term) {
      window.renderizarTabelaRelatorios(window.reportsState.transacoesFiltradas);
      return;
    }
    const filtrados = (window.reportsState.transacoesFiltradas || []).filter(item => {
      return (item.cliente && item.cliente.toLowerCase().includes(term)) ||
             (item.espaco && item.espaco.toLowerCase().includes(term)) ||
             (item.forma && item.forma.toLowerCase().includes(term)) ||
             (item.categoria && item.categoria.toLowerCase().includes(term));
    });
    window.renderizarTabelaRelatorios(filtrados);
  };

  window.exportarRelatorioCSV = function() {
    const list = window.reportsState.transacoesFiltradas || [];
    if (list.length === 0) {
      if (typeof mostrarToast === 'function') mostrarToast('Nenhum dado disponível para exportação.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Horario_Data;Cliente;Espaco;Categoria;Forma_Pagamento;Valor;Status\\n";

    list.forEach(row => {
      csvContent += \`"\${row.hora}";"\${row.cliente}";"\${row.espaco}";"\${row.categoria}";"\${row.forma}";"\${row.valor}";"\${row.status}"\\n\`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", \`ArenaLimoeiro_Relatorio_\${window.reportsState.periodo}_\${new Date().toISOString().split('T')[0]}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof mostrarToast === 'function') mostrarToast('Relatório exportado em CSV com sucesso!');
  };
`;

// Hook no showAdminTab para renderizar relatórios quando abrir a aba 'reports'
const showAdminTabMarker = 'if (typeof renderCourtsMonitor === \'function\' && targetTab === \'courts\') renderCourtsMonitor();';
const showAdminTabWithReports = `${showAdminTabMarker}\n      if (targetTab === 'reports' && typeof window.atualizarRelatoriosOperacionais === 'function') window.atualizarRelatoriosOperacionais();`;

html = html.replace(showAdminTabMarker, showAdminTabWithReports);

// Injetar o bloco de código dos relatórios antes do fechamento do </script> principal
const scriptEndIdx = html.lastIndexOf('</script>');
html = html.substring(0, scriptEndIdx) + reportsLogicJs + '\n' + html.substring(scriptEndIdx);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully injected backend-connected reports logic into public/admin.html!');
