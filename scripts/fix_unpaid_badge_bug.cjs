const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[Script] Iniciando correção do bug de "pago balcão" com Falta de Pagamento...');

// 1. LOCALIZAR O BLOCO DE CÁLCULO DE PAGAMENTO EM renderMatchCardHtml
const target1 = `    const price = Number(m.total_price || m.price || 100).toFixed(2).replace('.', ',');
    let rawPay = String(m.payment || m.payment_method || (isMensalista ? 'Mensal' : 'Pago')).trim();
    if (rawPay === 'pago_balcao' || rawPay === 'pagar_local' || rawPay === 'pos_jogo' || (isMensalista && (rawPay.toLowerCase().includes('balcao') || rawPay.toLowerCase().includes('faturada') || rawPay === 'Pago' || rawPay === 'pago'))) {
      rawPay = 'Mensal';
    }
    const payment = rawPay;`;

const replacement1 = `    const price = Number(m.total_price || m.price || 100).toFixed(2).replace('.', ',');
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
    const payMetaClass = isUnpaid ? 'text-amber-800 font-bold' : 'text-emerald-700 font-semibold';`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('✓ Bloco 1 (Cálculo de pagamento e classes condicionais) atualizado com sucesso!');
} else {
  console.error('! target1 não encontrado.');
}

// 2. ATUALIZAR METADADOS EM LINHA (ao lado de 'jogadores previstos')
const target2 = `<span class="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i> \${payment}
                </span>`;

const replacement2 = `<span class="flex items-center gap-1.5 \${payMetaClass}">
                  \${payMetaIcon} \${payment}
                </span>`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log('✓ Bloco 2 (Metadados em linha de pagamento) atualizado com sucesso!');
} else {
  console.error('! target2 não encontrado.');
}

// 3. ATUALIZAR BADGE SOB O VALOR CONTRATADO
const target3 = `<div id="mainPriceDisplay-\${m.id}" class="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">R$ \${currentTotalStr}</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <i class="fa-solid fa-check text-[9px] mr-1 text-emerald-600"></i> \${payment}
                </span>
              </div>`;

const replacement3 = `<div id="mainPriceDisplay-\${m.id}" class="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">R$ \${currentTotalStr}</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] px-2 py-0.5 rounded \${payBadgeClass}">
                  \${payBadgeIcon} \${payment}
                </span>
              </div>`;

if (content.includes(target3)) {
  content = content.replace(target3, replacement3);
  console.log('✓ Bloco 3 (Badge sob o Valor Contratado) atualizado com sucesso!');
} else {
  console.error('! target3 não encontrado.');
}

// 4. ATUALIZAR CARD 4 EM DETALHES EXPANDIDOS (Status Financeiro)
const target4 = `<div class="font-bold text-emerald-700 text-sm">\${isMensalista ? 'Mensal' : (payment + ' • R$ ' + price)}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>\${isMensalista ? 'Contrato mensal' : 'Sem pendências'}</span>`;

const replacement4 = `<div class="font-bold \${isUnpaid ? 'text-amber-800' : 'text-emerald-700'} text-sm">\${isMensalista ? 'Mensal' : (payment + ' • R$ ' + price)}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>\${isMensalista ? 'Contrato mensal' : (isUnpaid ? 'Pagamento pendente' : 'Sem pendências')}</span>`;

if (content.includes(target4)) {
  content = content.replace(target4, replacement4);
  console.log('✓ Bloco 4 (Card 4 de detalhes expandidos) atualizado com sucesso!');
} else {
  console.error('! target4 não encontrado.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✓ public/admin.html salvo com sucesso!');
