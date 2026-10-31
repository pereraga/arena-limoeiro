const fs = require('fs');

let content = fs.readFileSync('public/app.js', 'utf8');

// 1. Function getDailyMatchesList(targetDate) & exportDailyPDF & exportDailyExcel
const dailyReportFunctions = `
// ==============================================================================
// RELATÓRIOS DO DIA ESPECÍFICO (HOJE OU DATA SELECIONADA) - PDF & EXCEL
// ==============================================================================
function getDailyMatchesList(targetDate) {
  const selectedDate = targetDate || state.adminFilterDate || getFormattedDate(new Date());
  const [y, m, d] = selectedDate.split('-');
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDaysMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const currentDayOfWeek = weekDaysMap[dateObj.getDay()];

  const deletedBookingSet = typeof getDeletedBookingIds === 'function' ? getDeletedBookingIds() : new Set();
  const rawBookings = (Array.isArray(state.bookings) && state.bookings.length > 0)
    ? state.bookings
    : JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
  const allBookings = rawBookings.filter(b => b && b.status !== 'cancelled' && !deletedBookingSet.has(String(b.id)));

  let list = [];

  // 1. Mensalistas e Fixos recorrentes para o dia da semana
  (state.monthlyMembers || []).forEach(m => {
    if (!m || !m.id) return;
    if (deletedBookingSet.has(String(m.id)) || deletedBookingSet.has('monthly-' + String(m.id))) return;
    const day = typeof normalizeDayOfWeek === 'function' ? normalizeDayOfWeek(m.day_of_week || m.dayOfWeek) : '';
    if (day === (typeof normalizeDayOfWeek === 'function' ? normalizeDayOfWeek(currentDayOfWeek) : '') && (typeof isMensalistaActive === 'function' ? isMensalistaActive(m) : true)) {
      const startT = m.start_time || m.startTime || m.time || '19:00';
      const endT = m.end_time || m.endTime || '20:00';
      const cId = m.court_id || m.courtId;

      const parsedObs = typeof parseCustomerFromObservation === 'function' ? parseCustomerFromObservation(m.observation || '') : {};
      const custObj = typeof findCustomerByPhone === 'function' ? findCustomerByPhone(m.phone || '') : null;
      const cpfVal = m.cpf || parsedObs.cpf || (custObj ? custObj.cpf : '');

      const sMin = typeof timeToMinutes === 'function' ? timeToMinutes(startT) : 0;
      const eMin = typeof timeToMinutes === 'function' ? timeToMinutes(endT) : 0;

      const existingOverlap = list.find(b => {
        const bCourt = b.court_id || b.courtId;
        if (bCourt !== cId) return false;
        const bS = typeof timeToMinutes === 'function' ? timeToMinutes(b.start_time) : 0;
        const bE = typeof timeToMinutes === 'function' ? timeToMinutes(b.end_time) : 0;
        return Math.max(sMin, bS) < Math.min(eMin, bE);
      });

      if (!existingOverlap) {
        list.push({
          id: 'monthly-' + m.id,
          court_id: cId,
          date: selectedDate,
          customer_name: (m.team_name || m.teamName || 'Pelada') + ' (' + (m.responsible_name || m.responsibleName || 'Responsável') + ')',
          customer_phone: m.phone || '',
          customer_cpf: cpfVal,
          start_time: startT,
          end_time: endT,
          time: m.time || (startT + ' às ' + endT),
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4,
          status: 'confirmed',
          contract_type: m.contract_type || 'fixo',
          booking_type: m.contract_type === 'fixo' ? 'fixo' : 'mensalista',
          isMensalista: m.contract_type !== 'fixo',
          payment_method: m.contract_type === 'fixo' ? 'pos_jogo' : 'mensalidade',
          observation: m.contract_type === 'fixo' ? 'Horário Fixo Semanal (Paga no jogo)' : 'Mensalista Semanal'
        });
      }
    }
  });

  // 2. Reservas avulsas ou com data específica
  allBookings.forEach(b => {
    if (!b || b.status === 'cancelled') return;
    const isMensal = typeof isMensalistaBooking === 'function' ? isMensalistaBooking(b) : false;
    let matchesThisDate = (b.date === selectedDate);

    if (!matchesThisDate && isMensal && b.date && (b.date.toLowerCase().includes('toda ') || b.date.toLowerCase().includes('todo '))) {
      const matchDay = b.date.toLowerCase().match(/tod[ao]\\s+([a-zçãé]+)/);
      if (matchDay && matchDay[1] && typeof normalizeDayOfWeek === 'function' && normalizeDayOfWeek(matchDay[1]) === normalizeDayOfWeek(currentDayOfWeek)) {
        matchesThisDate = true;
      }
    }

    if (matchesThisDate) {
      const bCourtId = b.court_id || b.courtId;
      const startT = b.start_time || b.startTime || (b.time ? b.time.split(' ')[0] : '19:00');
      const endT = b.end_time || b.endTime || (b.time ? b.time.split(' às ')[1] : '20:00');
      const sMin = typeof timeToMinutes === 'function' ? timeToMinutes(startT) : 0;
      const eMin = typeof timeToMinutes === 'function' ? timeToMinutes(endT) : 0;

      const overlapMatch = list.find(m => {
        const mCourt = m.court_id || m.courtId;
        if (mCourt !== bCourtId) return false;
        const mS = typeof timeToMinutes === 'function' ? timeToMinutes(m.start_time) : 0;
        const mE = typeof timeToMinutes === 'function' ? timeToMinutes(m.end_time) : 0;
        return Math.max(sMin, mS) < Math.min(eMin, mE);
      });

      if (overlapMatch) return;

      const parsedObs = typeof parseCustomerFromObservation === 'function' ? parseCustomerFromObservation(b.observation || '') : {};
      const custObj = typeof findCustomerByPhone === 'function' ? findCustomerByPhone(b.customer_phone || b.customerPhone || '') : null;
      const cpfVal = b.customer_cpf || b.customerCpf || b.customerCPF || parsedObs.cpf || (custObj ? custObj.cpf : '');

      list.push({
        id: b.id,
        court_id: bCourtId,
        date: selectedDate,
        customer_name: b.customer_name || b.customerName || 'Cliente',
        customer_phone: b.customer_phone || b.customerPhone || '',
        customer_cpf: cpfVal,
        start_time: startT,
        end_time: endT,
        time: b.time || (startT + ' às ' + endT),
        total_price: parseFloat(b.total_price || b.totalPrice || 0),
        status: b.status || 'confirmed',
        contract_type: b.contract_type || b.contractType || (b.booking_type === 'fixo' ? 'fixo' : (isMensal ? 'mensalista' : 'avulso')),
        booking_type: b.booking_type || b.bookingType || (isMensal ? 'mensalista' : 'avulso'),
        isMensalista: isMensal,
        payment_method: b.payment_method || b.paymentMethod || 'pix',
        observation: b.observation || ''
      });
    }
  });

  list.sort((a, b) => {
    const aM = typeof timeToMinutes === 'function' ? timeToMinutes(a.start_time) : 0;
    const bM = typeof timeToMinutes === 'function' ? timeToMinutes(b.start_time) : 0;
    return aM - bM;
  });

  return { selectedDate, currentDayOfWeek, matchesList: list };
}

function exportDailyPDF(targetDate) {
  const data = getDailyMatchesList(targetDate);
  const selectedDate = data.selectedDate;
  const matches = data.matchesList;
  const totalRevenue = matches.reduce((acc, m) => acc + (Number(m.total_price || 0) || 0), 0);
  const totalFixos = matches.filter(m => m.contract_type === 'fixo' || m.booking_type === 'mensalista' || m.isMensalista).length;
  const totalAvulsos = matches.length - totalFixos;

  const displayDateStr = typeof formatDisplayDate === 'function' ? formatDisplayDate(selectedDate) : selectedDate;

  const html = \`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Jogos do Dia (\${displayDateStr}) - Arena Limoeiro</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
        .logo-title h1 { margin: 0; font-size: 20px; font-weight: 900; color: #065f46; text-transform: uppercase; }
        .logo-title p { margin: 2px 0 0; font-size: 11px; color: #64748b; }
        .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; }
        .stat-box { flex: 1; }
        .stat-label { font-size: 9px; text-transform: uppercase; font-weight: 800; color: #64748b; }
        .stat-val { font-size: 16px; font-weight: 900; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #065f46; color: #ffffff; padding: 8px 8px; text-align: left; font-weight: 800; text-transform: uppercase; }
        td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; }
        .badge-fixo { background: #fef3c7; color: #92400e; }
        .badge-avulso { background: #e2e8f0; color: #334155; }
        .price { font-weight: 900; color: #065f46; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
          🖨️ Salvar como PDF / Imprimir
        </button>
      </div>

      <div class="header">
        <div class="logo-title">
          <h1>Arena Limoeiro - Relatório de Jogos do Dia</h1>
          <p>Relatório Detalhado de Partidas e Peladas Previstas • Data: <strong>\${displayDateStr}</strong></p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <strong>Emissão:</strong> \${new Date().toLocaleString('pt-BR')}<br>
          <strong>Data Focal:</strong> \${displayDateStr}
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-box">
          <div class="stat-label">Total de Jogos / Peladas</div>
          <div class="stat-val">\${matches.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Faturamento Previsto do Dia</div>
          <div class="stat-val" style="color: #059669;">R$ \${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Jogos Avulsos</div>
          <div class="stat-val">\${totalAvulsos}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Horários Fixos / Mensalistas</div>
          <div class="stat-val" style="color: #b45309;">\${totalFixos}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Horário</th>
            <th>Espaço / Quadra</th>
            <th>Cliente / Time / Pelada</th>
            <th>Telefone</th>
            <th>CPF</th>
            <th>Tipo de Jogo</th>
            <th>Pagamento</th>
            <th>Status</th>
            <th>Valor Previsto (R$)</th>
          </tr>
        </thead>
        <tbody>
          \${matches.length === 0 ? \`
            <tr>
              <td colspan="9" style="text-align: center; padding: 30px; color: #94a3b8; font-size: 12px;">
                Nenhum jogo ou pelada agendada para \${displayDateStr}.
              </td>
            </tr>
          \` : matches.map(m => {
            const isFixo = m.contract_type === 'fixo' || m.booking_type === 'mensalista' || m.isMensalista;
            const cName = typeof getCourtNameForExport === 'function' ? getCourtNameForExport(m.court_id || m.courtId) : (m.court_id || 'Quadra');
            const price = 'R$ ' + Number(m.total_price || 0).toFixed(2).replace('.', ',');
            const tipoLabel = m.contract_type === 'fixo' ? 'Fixo Semanal' : (m.isMensalista ? 'Mensalista' : 'Avulso');
            return \`
              <tr>
                <td><strong>\${m.time || (m.start_time + ' às ' + m.end_time)}</strong></td>
                <td>\${cName}</td>
                <td><strong>\${m.customer_name || 'Pelada'}</strong></td>
                <td>\${m.customer_phone || '-'}</td>
                <td>\${m.customer_cpf || '-'}</td>
                <td><span class="badge \${isFixo ? 'badge-fixo' : 'badge-avulso'}">\${tipoLabel}</span></td>
                <td>\${m.payment_method || (isFixo ? 'Pós-jogo' : 'Balcão')}</td>
                <td>\${m.status || 'Confirmado'}</td>
                <td class="price">\${price}</td>
              </tr>
            \`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #e2e8f0; font-weight: 900; font-size: 11px;">
            <td colspan="8" style="text-align: right; padding: 10px;">TOTAL PREVISTO DO DIA:</td>
            <td class="price" style="padding: 10px; font-size: 13px;">R$ \${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  \`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert('Por favor, permita pop-ups para abrir o relatório em PDF.');
  }
}

function exportDailyExcel(targetDate) {
  const data = getDailyMatchesList(targetDate);
  const selectedDate = data.selectedDate;
  const matches = data.matchesList;
  const totalRevenue = matches.reduce((acc, m) => acc + (Number(m.total_price || 0) || 0), 0);

  const headers = [
    'Data',
    'Horário Início',
    'Horário Fim',
    'Horário Completo',
    'Espaço / Quadra',
    'Nome do Time / Cliente / Pelada',
    'Telefone',
    'CPF',
    'Tipo de Contrato',
    'Forma de Pagamento',
    'Status',
    'Valor Previsto (R$)',
    'Observações'
  ];

  const rows = [headers.map(csvCell).join(';')];

  matches.forEach(m => {
    const cName = typeof getCourtNameForExport === 'function' ? getCourtNameForExport(m.court_id || m.courtId) : (m.court_id || 'Quadra');
    const sTime = m.start_time || (m.time ? m.time.split(' ')[0] : '');
    const eTime = m.end_time || (m.time ? m.time.split(' às ')[1] : '');
    const priceStr = Number(m.total_price || 0).toFixed(2).replace('.', ',');
    const tipoLabel = m.contract_type === 'fixo' ? 'Fixo Semanal' : (m.isMensalista ? 'Mensalista' : 'Jogo Avulso');

    rows.push([
      csvCell(selectedDate),
      csvCell(sTime),
      csvCell(eTime),
      csvCell(m.time || (sTime + ' às ' + eTime)),
      csvCell(cName),
      csvCell(m.customer_name || 'Pelada'),
      csvCell(m.customer_phone || ''),
      csvCell(m.customer_cpf || ''),
      csvCell(tipoLabel),
      csvCell(m.payment_method || 'Balcão'),
      csvCell(m.status || 'confirmed'),
      csvCell(priceStr),
      csvCell(m.observation || '')
    ].join(';'));
  });

  // Linha de total
  rows.push([
    csvCell('TOTAL PREVISTO'),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(''),
    csvCell(Number(totalRevenue).toFixed(2).replace('.', ',')),
    csvCell('')
  ].join(';'));

  const csvContent = '\\uFEFF' + rows.join('\\r\\n');
  downloadExportFile(csvContent, \`arena_limoeiro_relatorio_do_dia_\${selectedDate}.csv\`, 'text/csv;charset=utf-8;');
}
`;

// Insert the functions right before renderAdminBackupTab
const targetAnchor = 'function renderAdminBackupTab() {';
if (!content.includes(targetAnchor)) {
  console.error("Could not find targetAnchor in public/app.js");
  process.exit(1);
}

content = content.replace(targetAnchor, dailyReportFunctions + '\n' + targetAnchor);

// Add window exports
const windowExportTarget = 'window.exportBookingsPDF = exportBookingsPDF;';
content = content.replace(windowExportTarget, windowExportTarget + '\r\nwindow.exportDailyPDF = exportDailyPDF;\r\nwindow.exportDailyExcel = exportDailyExcel;\r\nwindow.getDailyMatchesList = getDailyMatchesList;');

// Add Report buttons in renderLiveDashboardTab
const searchMatchesBtnStr = 'Pesquisar Jogos (Nome/Quadra/CPF)</span>\r\n          </button>';
const dailyReportButtons = `\r
          <div class="flex items-center gap-2 w-full sm:w-auto">\r
            <button onclick="exportDailyPDF()" class="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all text-center cursor-pointer" title="Gerar relatório impresso ou PDF detalhado dos jogos do dia">\r
              <i data-lucide="printer" class="w-4 h-4 flex-shrink-0"></i>\r
              <span>📄 Relatório do Dia (PDF)</span>\r
            </button>\r
            <button onclick="exportDailyExcel()" class="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all text-center cursor-pointer" title="Exportar jogos do dia detalhado para Excel / CSV">\r
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>\r
              <span>📊 Excel (Dia)</span>\r
            </button>\r
          </div>`;

if (!content.includes(searchMatchesBtnStr)) {
  console.error("Could not find searchMatchesBtnStr in renderLiveDashboardTab");
  process.exit(1);
}

content = content.replace(searchMatchesBtnStr, searchMatchesBtnStr + dailyReportButtons);

// Add Card in renderAdminReportsTab: dedicated card for Daily Report
const unifiedCardAnchor = '<!-- CARD 3: TUDO EM UMA PLANILHA SÓ (JOGOS + FIXOS + CLIENTES) -->';
const dailyReportCard = `<!-- CARD 0: RELATÓRIO DO DIA ATUAL / SELECIONADO -->\r
        <div class="bg-gradient-to-br from-emerald-950 to-slate-900 p-6 rounded-3xl border border-emerald-400/40 shadow-md flex flex-col justify-between space-y-4">\r
          <div class="space-y-3">\r
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30 shadow-inner">\r
              <i data-lucide="calendar-check" class="w-6 h-6"></i>\r
            </div>\r
            <div>\r
              <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">Foco do Dia</span>\r
              <h4 class="text-base font-black text-white mt-1.5">Relatório de Jogos do Dia</h4>\r
              <p class="text-xs text-slate-300 mt-1">Gera o relatório com todos os jogos, peladas e horários previstos da data selecionada, com o cálculo exato do faturamento previsto do dia.</p>\r
            </div>\r
          </div>\r
\r
          <div class="space-y-2 pt-2 border-t border-slate-700/60">\r
            <button onclick="exportDailyPDF()" class="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer">\r
              <i data-lucide="printer" class="w-4 h-4"></i>\r
              <span>Imprimir / Salvar PDF do Dia</span>\r
            </button>\r
            <button onclick="exportDailyExcel()" class="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer">\r
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-300"></i>\r
              <span>Baixar Planilha Excel do Dia</span>\r
            </button>\r
          </div>\r
        </div>\r
\r
        `;

if (!content.includes(unifiedCardAnchor)) {
  console.error("Could not find unifiedCardAnchor in renderAdminReportsTab");
  process.exit(1);
}

content = content.replace(unifiedCardAnchor, dailyReportCard + unifiedCardAnchor);

fs.writeFileSync('public/app.js', content, 'utf8');
console.log('Successfully updated public/app.js with daily report features!');
