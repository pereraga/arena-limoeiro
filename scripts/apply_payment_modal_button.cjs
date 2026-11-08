const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/2] Aprimorando openFinishGame para garantir que pagamentos pendentes/faltando venham como "Pago" por padrão...');

const oldStatusSelect = `const paymentStatusSelect = document.getElementById('finishPaymentStatus');
      if (paymentStatusSelect) {
        paymentStatusSelect.value = (g.payment && g.payment.includes('Pendente')) ? 'Pendente' : 'Pago';
      }`;

const newStatusSelect = `const paymentStatusSelect = document.getElementById('finishPaymentStatus');
      if (paymentStatusSelect) {
        // Ao abrir a janela para efetuar pagamento, o status padrão é sempre "Pago" (confirmando a liquidação)
        paymentStatusSelect.value = 'Pago';
      }`;

if (content.includes(oldStatusSelect)) {
  content = content.replace(oldStatusSelect, newStatusSelect);
  console.log('✓ openFinishGame configurado com status padrão "Pago"!');
} else {
  console.error('❌ oldStatusSelect não encontrado!');
  process.exit(1);
}

console.log('[2/2] Atualizando os botões do card para deixar o botão "Efetuar Pagamento" chamando a janela oficial de finalização...');

const oldCardButtons = `<!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              \${(st === 'unpaid' || st === 'cancelled') ? \`
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <span class="px-3 py-1.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation text-amber-700"></i> Pagamento Faltando
                  </span>
                  <!-- Botão 1: Efetuar Pagamento Rápido (PIX / Dinheiro) e mover para área de Pago -->
                  <button type="button" onclick="quickPayAndFinishMatch('\${m.id}', 'PIX')" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5" title="Efetuar pagamento e mover para área de pago">
                    <i class="fa-solid fa-circle-check text-xs"></i>
                    <span>Efetuar Pagamento</span>
                  </button>
                  <!-- Botão 2: Opções detalhadas de fechamento / parcelamento -->
                  <button type="button" onclick="openFinishGame('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Outras opções e detalhes de pagamento">
                    <i class="fa-solid fa-sliders text-slate-500"></i>
                    <span>Opções</span>
                  </button>
                </div>`;

const newCardButtons = `<!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              \${(st === 'unpaid' || st === 'cancelled') ? \`
                <div class="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2.5">
                  <span class="px-3 py-1.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation text-amber-700"></i> Pagamento Faltando
                  </span>
                  <!-- Botão de Pagamento: Abre a janela padrão para escolher a forma (PIX, Dinheiro, Cartão, Dividido) e concluir -->
                  <button type="button" id="btn-pay-action-\${m.id}" onclick="openFinishGame('\${m.id}')" class="px-5 py-2.5 rounded-full font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer" title="Abrir janela para escolher a forma de pagamento e concluir partida">
                    <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
                    <span>Efetuar Pagamento</span>
                  </button>
                </div>`;

if (content.includes(oldCardButtons)) {
  content = content.replace(oldCardButtons, newCardButtons);
  console.log('✓ Botão "Efetuar Pagamento" atualizado no card!');
} else {
  console.error('❌ oldCardButtons não encontrado!');
  process.exit(1);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
