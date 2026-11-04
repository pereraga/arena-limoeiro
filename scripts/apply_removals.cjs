const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Remover o CARD INFORMATIVO: JOGOS JÁ AGENDADOS NESTA QUADRA NO DIA
const scheduledGamesCardRegex = /<!-- CARD INFORMATIVO: JOGOS JÁ AGENDADOS NESTA QUADRA NO DIA -->[\s\S]*?<\/div>[\s]*?<\/div>[\s]*?<!-- AVISO DE JOGO EM ANDAMENTO/i;

if (scheduledGamesCardRegex.test(html)) {
  html = html.replace(scheduledGamesCardRegex, '<!-- AVISO DE JOGO EM ANDAMENTO');
  console.log('✅ Removido balcaoScheduledGamesCard com sucesso.');
} else {
  console.log('⚠️ Tentando remoção alternativa de balcaoScheduledGamesCard...');
  const idxStart = html.indexOf('<div id="balcaoScheduledGamesCard"');
  if (idxStart !== -1) {
    const idxEnd = html.indexOf('<!-- AVISO DE JOGO EM ANDAMENTO', idxStart);
    if (idxEnd !== -1) {
      html = html.substring(0, idxStart) + html.substring(idxEnd);
      console.log('✅ Removido balcaoScheduledGamesCard por índice.');
    }
  }
}

// 2. Remover a exibição dos dropdowns INÍCIO * e FIM * do modal Balcão (mantendo os selects ocultos no DOM)
// E remover todos os textos "(Promo)"
const oldNumericRowRegex = /<!-- SELEÇÃO NUMÉRICA & VALOR TOTAL -->[\s\S]*?<div class="grid grid-cols-1 sm:grid-cols-2 gap-3\.5">/i;

// Vamos ler o bloco atual para extrair os selects e directBookingPrice
const idxNumeric = html.indexOf('<!-- SELEÇÃO NUMÉRICA & VALOR TOTAL -->');
const idxPagamento = html.indexOf('id="directBookingPayment"');

if (idxNumeric !== -1 && idxPagamento !== -1) {
  const paymentRowStart = html.lastIndexOf('<div class="grid', idxPagamento);
  const numericBlock = html.substring(idxNumeric, paymentRowStart);

  // Extrair select de início e fim limpando "(Promo)"
  let cleanedBlock = numericBlock.replace(/\s*\(Promo\)/g, '');

  // Substituir o grid por inputs ocultos para início/fim e realocar Valor Total junto com Pagamento e CPF
  // Vamos criar um layout limpo com inputs ocultos
  const newNumericSection = `<!-- INPUTS DE INÍCIO E FIM (OCULTOS - CONTROLADOS PELAS JANELAS DE 30 MIN) -->
      <div style="display:none;" aria-hidden="true">
        <select id="directBookingStart" onchange="onDirectBookingDropdownChange()" required>
          <option value="06:00">06:00</option>
          <option value="06:30">06:30</option>
          <option value="07:00">07:00</option>
          <option value="07:30">07:30</option>
          <option value="08:00">08:00</option>
          <option value="08:30">08:30</option>
          <option value="09:00">09:00</option>
          <option value="09:30">09:30</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
          <option value="11:00">11:00</option>
          <option value="11:30">11:30</option>
          <option value="12:00">12:00</option>
          <option value="12:30">12:30</option>
          <option value="13:00">13:00</option>
          <option value="13:30">13:30</option>
          <option value="14:00">14:00</option>
          <option value="14:30">14:30</option>
          <option value="15:00">15:00</option>
          <option value="15:30">15:30</option>
          <option value="16:00">16:00</option>
          <option value="16:30">16:30</option>
          <option value="17:00">17:00</option>
          <option value="17:30">17:30</option>
          <option value="18:00">18:00</option>
          <option value="18:30">18:30</option>
          <option value="19:00" selected>19:00</option>
          <option value="19:30">19:30</option>
          <option value="20:00">20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
          <option value="22:00">22:00</option>
          <option value="22:30">22:30</option>
          <option value="23:00">23:00</option>
          <option value="23:30">23:30</option>
        </select>

        <select id="directBookingEnd" onchange="onDirectBookingDropdownChange()" required>
          <option value="06:30">06:30</option>
          <option value="07:00">07:00</option>
          <option value="07:30">07:30</option>
          <option value="08:00">08:00</option>
          <option value="08:30">08:30</option>
          <option value="09:00">09:00</option>
          <option value="09:30">09:30</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
          <option value="11:00">11:00</option>
          <option value="11:30">11:30</option>
          <option value="12:00">12:00</option>
          <option value="12:30">12:30</option>
          <option value="13:00">13:00</option>
          <option value="13:30">13:30</option>
          <option value="14:00">14:00</option>
          <option value="14:30">14:30</option>
          <option value="15:00">15:00</option>
          <option value="15:30">15:30</option>
          <option value="16:00">16:00</option>
          <option value="16:30">16:30</option>
          <option value="17:00">17:00</option>
          <option value="17:30">17:30</option>
          <option value="18:00">18:00</option>
          <option value="18:30">18:30</option>
          <option value="19:00">19:00</option>
          <option value="19:30">19:30</option>
          <option value="20:00" selected>20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
          <option value="22:00">22:00</option>
          <option value="22:30">22:30</option>
          <option value="23:00">23:00</option>
          <option value="23:30">23:30</option>
          <option value="23:59">23:59</option>
        </select>
      </div>

      <!-- VALOR TOTAL E FORMA DE PAGAMENTO -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Total (R$) *</label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
            <input type="number" id="directBookingPrice" required value="110" step="5" min="0"
                   class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">
          </div>
        </div>`;

  // Agora vamos atualizar a linha de Pagamento e CPF para encaixar com Valor Total
  const oldPaymentEnd = html.indexOf('</div>', idxPagamento);
  const oldCpfIdx = html.indexOf('id="directBookingCpf"', oldPaymentEnd);
  const oldCpfColEnd = html.indexOf('</div>', oldCpfIdx) + 6;
  const oldGridEnd = html.indexOf('</div>', oldCpfColEnd) + 6;

  const paymentColStart = html.indexOf('<div>', paymentRowStart);
  const paymentAndCpfHtml = html.substring(paymentColStart, oldGridEnd - 6);

  const replacement = newNumericSection + '\n' + paymentAndCpfHtml + '\n      </div>';

  html = html.substring(0, idxNumeric) + replacement + html.substring(oldGridEnd);
  console.log('✅ Removidos dropdowns visíveis Início e Fim; mantidos selects ocultos e Valor Total integrado.');
} else {
  console.log('❌ Não encontrou idxNumeric ou idxPagamento');
}

// 3. Remover a lógica de isPromo do cálculo de preço direto
html = html.replace(/const isPromo = sH >= 9 && sH < 16;\s*const hourlyRate = isPromo \? \(court\.promo \|\| 50\) : \(court\.normal \|\| 90\);/g,
  'const hourlyRate = court.normal || court.price || (court.name && court.name.includes("7") ? 110 : 90);');

fs.writeFileSync(adminPath, html, 'utf8');
console.log('✅ public/admin.html atualizado.');
