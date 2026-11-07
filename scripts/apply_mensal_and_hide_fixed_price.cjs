const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('Original length:', content.length);

// 1. Atualizar fallback em getMatchesForDate onde tinha 'pago_balcao'
content = content.replace(
  "payment_method: 'pago_balcao',\n          observation: 'Horário Fixo Semanal (TERÇA)'\n        },\n        {\n          id: 'ARENA-GENILSON-1103'",
  "payment_method: 'Mensal',\n          observation: 'Horário Fixo Semanal (TERÇA)'\n        },\n        {\n          id: 'ARENA-GENILSON-1103'"
);
content = content.replace(
  "payment_method: 'pago_balcao',\n          observation: 'Horário Fixo Semanal (TERÇA)'\n        },\n        {\n          id: 'ARENA-ZELUIZ-1103'",
  "payment_method: 'Mensal',\n          observation: 'Horário Fixo Semanal (TERÇA)'\n        },\n        {\n          id: 'ARENA-ZELUIZ-1103'"
);
console.log('✓ Fallback getMatchesForDate atualizado.');

// 2. Atualizar const payment na função renderMatchCardHtml
const oldPaymentDef = `    const price = Number(m.total_price || m.price || 100).toFixed(2).replace('.', ',');
    const payment = m.payment || (m.payment_method ? (m.payment_method.includes('Pago') || m.payment_method.includes('PIX') ? 'Pago' : m.payment_method) : 'Pago');`;

const newPaymentDef = `    const price = Number(m.total_price || m.price || 100).toFixed(2).replace('.', ',');
    let rawPay = String(m.payment || m.payment_method || (isMensalista ? 'Mensal' : 'Pago')).trim();
    if (rawPay === 'pago_balcao' || rawPay === 'pagar_local' || rawPay === 'pos_jogo' || (isMensalista && (rawPay.toLowerCase().includes('balcao') || rawPay.toLowerCase().includes('faturada') || rawPay === 'Pago' || rawPay === 'pago'))) {
      rawPay = 'Mensal';
    }
    const payment = rawPay;`;

if (!content.includes(oldPaymentDef)) {
  console.error('ERROR: oldPaymentDef not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldPaymentDef, newPaymentDef);
console.log('✓ renderMatchCardHtml payment definition atualizada.');

// 3. Atualizar Bloco 3: Para fixos/mensalistas, não exibir "VALOR CONTRATADO R$ 320,00"
const oldBloco3Price = `          <!-- Bloco 3: Valor Financeiro e Botão Principal -->
          <div class="lg:col-span-3 flex lg:flex-col items-end justify-between lg:justify-start gap-4">
            <div class="text-right">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor Contratado</div>
              <div id="mainPriceDisplay-\${m.id}" class="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">R$ \${currentTotalStr}</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <i class="fa-solid fa-check text-[9px] mr-1 text-emerald-600"></i> \${payment}
                </span>
              </div>
            </div>`;

const newBloco3Price = `          <!-- Bloco 3: Valor Financeiro e Botão Principal -->
          <div class="lg:col-span-3 flex lg:flex-col items-end justify-between lg:justify-start gap-4">
            <div class="text-right">
              \${isMensalista ? \`
              <div class="text-[11px] font-black text-purple-700 uppercase tracking-wider">Assinatura Mensal</div>
              <div id="mainPriceDisplay-\${m.id}" class="text-2xl sm:text-3xl font-extrabold text-purple-950 font-heading tracking-tight">Mensalista</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] font-black text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                  <i class="fa-solid fa-circle-check text-[10px] mr-1 text-purple-600"></i> Mensal
                </span>
              </div>
              \` : \`
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor Contratado</div>
              <div id="mainPriceDisplay-\${m.id}" class="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">R$ \${currentTotalStr}</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <i class="fa-solid fa-check text-[9px] mr-1 text-emerald-600"></i> \${payment}
                </span>
              </div>
              \`}
            </div>`;

if (!content.includes(oldBloco3Price)) {
  console.error('ERROR: oldBloco3Price not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldBloco3Price, newBloco3Price);
console.log('✓ Bloco 3 de exibição de valor atualizado para ocultar valor nos fixos e exibir Mensal.');

// 4. Atualizar Card 4 dos detalhes para fixos
const oldCard4 = `<!-- Card 4: Faturamento e Pagamento -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Status Financeiro</span>
                <i class="fa-solid fa-receipt text-emerald-600 text-xs"></i>
              </div>
              <div class="font-bold text-emerald-700 text-sm">\${payment} • R$ \${price}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>Sem pendências</span>
                <a href="#" onclick="viewReceipt('\${m.id}'); return false;" class="text-emerald-600 font-semibold hover:underline">Ver Recibo</a>
              </div>
            </div>`;

const newCard4 = `<!-- Card 4: Faturamento e Pagamento -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Status Financeiro</span>
                <i class="fa-solid fa-receipt text-emerald-600 text-xs"></i>
              </div>
              <div class="font-bold text-emerald-700 text-sm">\${isMensalista ? 'Mensal' : (payment + ' • R$ ' + price)}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>\${isMensalista ? 'Contrato mensal' : 'Sem pendências'}</span>
                <a href="#" onclick="viewReceipt('\${m.id}'); return false;" class="text-emerald-600 font-semibold hover:underline">Ver Recibo</a>
              </div>
            </div>`;

if (content.includes(oldCard4)) {
  content = content.replace(oldCard4, newCard4);
  console.log('✓ Card 4 dos detalhes atualizado.');
}

// 5. Atualizar Bloco D de cálculo automático nos detalhes
const oldBlocoD = `<!-- Bloco D: Cálculo Automático e Valor Total -->
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-slate-400">Cálculo Automático / Valor</span>
                  <span id="badge-calc-status-\${m.id}" class="text-[10px] font-bold \${extraMin > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded">
                    \${extraMin > 0 ? 'Pendente Extra' : 'Pago'}
                  </span>
                </div>
                <div>
                  <div id="status-calc-total-\${m.id}" class="text-xl font-extrabold text-slate-900 font-heading">R$ \${currentTotalStr} • \${extraMin > 0 ? 'Pendente Extra' : 'Pago'}</div>
                  <div id="status-calc-detail-\${m.id}" class="text-[10px] text-slate-500">
                    \${extraMin > 0 ? \`Base R$ \${price} + Extra (\${extraMin}m): R$ \${computedExtraAmountStr}\` : \`Valor contratado: R$ \${price}\`}
                  </div>
                </div>
              </div>`;

const newBlocoD = `<!-- Bloco D: Cálculo Automático e Valor Total -->
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-slate-400">Cálculo Automático / Valor</span>
                  <span id="badge-calc-status-\${m.id}" class="text-[10px] font-bold \${extraMin > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded">
                    \${extraMin > 0 ? 'Pendente Extra' : (isMensalista ? 'Mensal' : 'Pago')}
                  </span>
                </div>
                <div>
                  <div id="status-calc-total-\${m.id}" class="text-xl font-extrabold text-slate-900 font-heading">\${isMensalista ? ('Mensal' + (extraMin > 0 ? ' • Pendente Extra' : '')) : ('R$ ' + currentTotalStr + ' • ' + (extraMin > 0 ? 'Pendente Extra' : 'Pago'))}</div>
                  <div id="status-calc-detail-\${m.id}" class="text-[10px] text-slate-500">
                    \${isMensalista ? 'Plano Mensalista (Gestão mensal separada)' : (extraMin > 0 ? \`Base R$ \${price} + Extra (\${extraMin}m): R$ \${computedExtraAmountStr}\` : \`Valor contratado: R$ \${price}\`)}
                  </div>
                </div>
              </div>`;

if (content.includes(oldBlocoD)) {
  content = content.replace(oldBlocoD, newBlocoD);
  console.log('✓ Bloco D dos detalhes operacionais atualizado.');
}

// 6. Atualizar topRevenue (KPI de Faturamento do dia): Não somar o valor dos fixos
const oldTopRevenue = `    const allTodayMatches = getMatchesForDate(currentToday);
    const topRevenue = allTodayMatches.reduce((acc, cur) => acc + (Number(cur.total_price) || 0), 0);`;

const newTopRevenue = `    const allTodayMatches = getMatchesForDate(currentToday);
    // Não contabiliza o valor dos fixos/mensalistas no faturamento diário de jogos avulsos
    const topRevenue = allTodayMatches.filter(m => !m.isMensalista && m.booking_type !== 'mensalista' && m.type !== 'Mensalista').reduce((acc, cur) => acc + (Number(cur.total_price) || 0), 0);`;

if (!content.includes(oldTopRevenue)) {
  console.error('ERROR: oldTopRevenue not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldTopRevenue, newTopRevenue);
console.log('✓ topRevenue atualizado para não somar fixos.');

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✓ public/admin.html salvo com sucesso. Novo tamanho:', content.length);
