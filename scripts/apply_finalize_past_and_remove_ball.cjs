const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

console.log('Original admin.html size:', content.length);

// 1. CSS comment
content = content.replace(
  'BOTAO VERMELHO FINALIZAR / RECEBER BOLA E BARRA DE MINUTOS',
  'BOTAO VERMELHO FINALIZAR E BARRA DE MINUTOS'
);

// 2. calcMatchTimer overdue counter
content = content.replace(
  "counter: overdue > 0 ? '+' + overdue + ' min (Receber bola)' : 'Concluir partida',",
  "counter: overdue > 0 ? '+' + overdue + ' min (Finalizar)' : 'Finalizar',"
);

// 3. saveFinishGame log text
content = content.replace(
  "if (ballReturned) logText += ' • Bola devolvida e conferida';",
  "// ball mentions removed"
);

// 4. viewReceipt modal line
content = content.replace(
  `<div class="flex justify-between border-b border-slate-200 pb-1.5"><strong>Bola Devolvida:</strong> <span class="text-emerald-700 font-bold">\${g.ballReturned !== false ? '✓ Devolvida & Conferida' : 'Não informada'}</span></div>`,
  ''
);

// 5. renderMovementMatches finished badge
content = content.replace(
  '✓ Finalizada · Bola Recebida',
  '✓ Finalizada'
);

// 6. renderMovementMatches button title & content
content = content.replace(
  'title="Encerrar aula/jogo e receber a bola"',
  'title="Finalizar partida"'
);

const oldButtonInner = `<span class="booking-finish-red-icon">⚽</span>
                    <span>\${isFutureDay ? 'Concluir Jogo' : 'Finalizar / Receber Bola'}</span>`;

const newButtonInner = `<span class="booking-finish-red-icon">✓</span>
                    <span>Finalizar</span>`;

if (content.includes(oldButtonInner)) {
  content = content.replace(oldButtonInner, newButtonInner);
  console.log('✓ Successfully replaced main action button to just Finalizar');
} else {
  // Try single line or regex
  const regexBtn = /<span class="booking-finish-red-icon">⚽<\/span>[\s\n]*<span>\$\{isFutureDay \? 'Concluir Jogo' : 'Finalizar \/ Receber Bola'\}<\/span>/;
  if (regexBtn.test(content)) {
    content = content.replace(regexBtn, `<span class="booking-finish-red-icon">✓</span>\n                    <span>Finalizar</span>`);
    console.log('✓ Successfully replaced main action button via regex');
  } else {
    console.warn('! Could not find oldButtonInner');
  }
}

// 7. Status footer text
content = content.replace(
  "st === 'finished' ? '✓ Finalizada · Bola recebida' :",
  "st === 'finished' ? '✓ Finalizada' : "
);

// 8. Quick button in details panel
content = content.replace(
  '⚽ Concluir / Receber Bola',
  '✓ Finalizar'
);

// 9. Empty feed message
content = content.replace(
  'As partidas concluídas aparecerão aqui imediatamente após o encerramento do jogo e recebimento da bola.',
  'As partidas concluídas aparecerão aqui imediatamente após o encerramento e finalização do jogo.'
);

// 10. Update getMatchesForDate so past dates (<= 2026-11-03) are finished
const oldGetMatchesStart = `function getMatchesForDate(dateStr) {
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
    });`;

const newGetMatchesStart = `function getMatchesForDate(dateStr) {
    if (!dateStr) dateStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayOfWeek = dayOfWeekMap[dt.getDay()];

    // Regra: Finaliza todos os jogos dos dias anteriores (do dia 03 para trás)
    const isPastOrDay3 = (dateStr <= '2026-11-03');
    const defaultPastStatus = isPastOrDay3 ? 'finished' : 'confirmed';

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
          status: defaultPastStatus,
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')'
        });
      }
    });`;

if (content.includes(oldGetMatchesStart)) {
  content = content.replace(oldGetMatchesStart, newGetMatchesStart);
  console.log('✓ Successfully updated getMatchesForDate start with isPastOrDay3 default status');
} else {
  // Slicing approach
  const idxGMS = content.indexOf('function getMatchesForDate(dateStr) {');
  const idxGME = content.indexOf('// 2. Reservas diretas da data', idxGMS);
  if (idxGMS !== -1 && idxGME !== -1) {
    content = content.slice(0, idxGMS) + newGetMatchesStart + '\n\n    ' + content.slice(idxGME);
    console.log('✓ Successfully replaced getMatchesForDate start via index boundaries');
  } else {
    console.warn('! Could not find getMatchesForDate block');
  }
}

// In part 2 of getMatchesForDate: if isPastOrDay3, direct bookings also enforce finished
const oldPart2Logic = `existing.status = b.status || existing.status;`;
const newPart2Logic = `existing.status = (isPastOrDay3 ? 'finished' : (b.status || existing.status));`;
if (content.includes(oldPart2Logic)) {
  content = content.replace(oldPart2Logic, newPart2Logic);
  console.log('✓ Updated existing.status in getMatchesForDate part 2');
}

const oldPushStatus = `status: b.status || 'confirmed',`;
const newPushStatus = `status: (isPastOrDay3 ? 'finished' : (b.status || 'confirmed')),`;
if (content.includes(oldPushStatus)) {
  content = content.replace(oldPushStatus, newPushStatus);
  console.log('✓ Updated pushed booking status in getMatchesForDate part 2');
}

fs.writeFileSync(path, content, 'utf8');
console.log('✓ Successfully saved public/admin.html with all finalizations and ball removal!');
