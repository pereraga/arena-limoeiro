const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar o select de pagamento no HTML para 'Pendente' ser a opção selecionada por padrão
const oldSelect = `<select id="directBookingPayment"
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
            <option value="PIX Balcão" selected>Pago no Balcão (PIX)</option>
            <option value="Dinheiro Balcão">Pago no Balcão (Dinheiro)</option>
            <option value="Cartão Balcão">Pago no Balcão (Cartão)</option>
            <option value="Pagar pós jogo">Pagar no Fim da Pelada</option>
            <option value="Pendente">Pagamento Pendente</option>
          </select>`;

const newSelect = `<select id="directBookingPayment"
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
            <option value="Pendente" selected>Pagamento Pendente</option>
            <option value="PIX Balcão">Pago no Balcão (PIX)</option>
            <option value="Dinheiro Balcão">Pago no Balcão (Dinheiro)</option>
            <option value="Cartão Balcão">Pago no Balcão (Cartão)</option>
            <option value="Pagar pós jogo">Pagar no Fim da Pelada</option>
          </select>`;

if (!content.includes(oldSelect)) {
  console.error('Error: oldSelect not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldSelect, newSelect);
console.log('1. Updated directBookingPayment select HTML: SUCCESS');

// 2. Atualizar openDirectBookingModal para sempre resetar directBookingPayment para 'Pendente'
const oldOpenReset = `    // Modal abre completamente LIMPO: nenhum bloco pré-selecionado pelo sistema
    if (startSelect) startSelect.value = '';
    if (endSelect) endSelect.value = '';`;

const newOpenReset = `    // Modal abre completamente LIMPO: nenhum bloco pré-selecionado pelo sistema
    if (startSelect) startSelect.value = '';
    if (endSelect) endSelect.value = '';

    const paySelect = document.getElementById('directBookingPayment');
    if (paySelect) paySelect.value = 'Pendente';`;

if (!content.includes(oldOpenReset)) {
  console.error('Error: oldOpenReset not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldOpenReset, newOpenReset);
console.log('2. Updated openDirectBookingModal default payment to Pendente: SUCCESS');

// 3. Em handleSaveDirectBooking, atualizar fallback de payment para 'Pendente'
content = content.replace(
  "const payment = document.getElementById('directBookingPayment')?.value || 'PIX Balcão';",
  "const payment = document.getElementById('directBookingPayment')?.value || 'Pendente';"
);
console.log('3. Updated handleSaveDirectBooking fallback to Pendente: SUCCESS');

fs.writeFileSync(path, content, 'utf8');
console.log('All updates written to admin.html successfully!');
