const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Let's create the HTML for the 30s Pop-it notification modal/toast
const popitHtml = `
<!-- ========================================================================= -->
<!-- 🟢 POP-IT / NOTIFICAÇÃO DE CONCLUSÃO DE AGENDAMENTO (30 SEGUNDOS)         -->
<!-- ========================================================================= -->
<div id="arenaPopItNotification" class="fixed bottom-6 right-6 z-[9999] max-w-md w-[calc(100%-3rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden transform translate-y-32 opacity-0 pointer-events-none transition-all duration-500 ease-out font-sans">
  <!-- Barra de Progresso com contagem regressiva de 30s -->
  <div class="h-1.5 w-full bg-slate-100 overflow-hidden">
    <div id="arenaPopItProgress" class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full transition-all duration-100 ease-linear"></div>
  </div>

  <div class="p-4 sm:p-5 flex items-start gap-3.5">
    <!-- Ícone Animado de Sucesso -->
    <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
      <svg class="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <!-- Conteúdo da Notificação -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Agendamento Concluído
        </span>
        <span id="arenaPopItCountdown" class="text-xs font-black text-slate-500">30s</span>
      </div>
      <h4 id="arenaPopItTitle" class="text-sm font-black text-slate-800 leading-snug">Reserva Confirmada com Sucesso!</h4>
      <p id="arenaPopItMessage" class="text-xs font-medium text-slate-600 mt-1 leading-relaxed">Os detalhes foram salvos e sincronizados com o banco de dados.</p>
    </div>

    <!-- Botão Fechar -->
    <button type="button" onclick="window.closeArenaPopIt()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0" title="Fechar notificação">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>
`;

// Insert the popitHtml right after arenaToast
const toastTag = '</div>\n\n<!-- ========================================================================= -->\n<!-- JAVASCRIPT INTEGRADO: GESTÃO COMPLETA DE JOGOS';
const targetPos = content.indexOf('<div id="arenaToast"');
if (targetPos === -1) {
  console.error('arenaToast not found!');
  process.exit(1);
}

const toastEnd = content.indexOf('</div>', targetPos) + 6;
content = content.substring(0, toastEnd) + '\n' + popitHtml + content.substring(toastEnd);

// 2. Add JavaScript functions for window.showArenaPopIt and window.closeArenaPopIt
const jsFunctions = `
  // ============================================================================
  // 🟢 POP-IT DE NOTIFICAÇÃO DE CONCLUSÃO DE AGENDAMENTO (DURAÇÃO: 30 SEGUNDOS)
  // ============================================================================
  window.arenaPopItTimer = null;
  window.arenaPopItInterval = null;

  window.closeArenaPopIt = function() {
    const el = document.getElementById('arenaPopItNotification');
    if (!el) return;
    el.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
    el.classList.remove('translate-y-0', 'opacity-100');
    if (window.arenaPopItTimer) {
      clearTimeout(window.arenaPopItTimer);
      window.arenaPopItTimer = null;
    }
    if (window.arenaPopItInterval) {
      clearInterval(window.arenaPopItInterval);
      window.arenaPopItInterval = null;
    }
  };

  window.showArenaPopIt = function(opts) {
    const el = document.getElementById('arenaPopItNotification');
    const titleEl = document.getElementById('arenaPopItTitle');
    const msgEl = document.getElementById('arenaPopItMessage');
    const countEl = document.getElementById('arenaPopItCountdown');
    const barEl = document.getElementById('arenaPopItProgress');
    if (!el) return;

    const title = typeof opts === 'string' ? 'Agendamento Concluído!' : (opts?.title || 'Reserva Registrada no Balcão!');
    const msg = typeof opts === 'string' ? opts : (opts?.message || 'Agendamento realizado com sucesso.');
    const durationSec = (opts && opts.duration) ? opts.duration : 30;

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;

    window.closeArenaPopIt();

    // Mostra o Pop-it com animação fluida
    el.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
    el.classList.add('translate-y-0', 'opacity-100');

    let remaining = durationSec;
    if (countEl) countEl.textContent = remaining + 's';
    if (barEl) barEl.style.width = '100%';

    const startTime = Date.now();
    const totalMs = durationSec * 1000;

    window.arenaPopItInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const leftMs = Math.max(0, totalMs - elapsed);
      const leftSec = Math.ceil(leftMs / 1000);
      const pct = Math.max(0, (leftMs / totalMs) * 100);

      if (countEl) countEl.textContent = leftSec + 's';
      if (barEl) barEl.style.width = pct + '%';

      if (leftMs <= 0) {
        window.closeArenaPopIt();
      }
    }, 100);

    window.arenaPopItTimer = setTimeout(() => {
      window.closeArenaPopIt();
    }, totalMs);
  };
`;

// Insert the JS functions right before window.handleSaveDirectBooking
const directSaveIdx = content.indexOf('window.handleSaveDirectBooking =');
if (directSaveIdx === -1) {
  console.error('window.handleSaveDirectBooking not found!');
  process.exit(1);
}

content = content.substring(0, directSaveIdx) + jsFunctions + '\n  ' + content.substring(directSaveIdx);

// 3. Replace the native alert in handleSaveDirectBooking with showArenaPopIt
const oldAlert = `alert('✓ Reserva de ' + name + ' registrada com sucesso no balcão! Horário ' + start + ' às ' + end + ' liberado na ' + court.name + '.');`;
const newPopItCall = `window.showArenaPopIt({
      title: '✓ Reserva Balcão Concluída!',
      message: 'Reserva de ' + name + ' registrada com sucesso! Horário ' + start + ' às ' + end + ' liberado na ' + court.name + '.',
      duration: 30
    });`;

if (!content.includes(oldAlert)) {
  console.error('oldAlert not found in content!');
  process.exit(1);
}

content = content.replace(oldAlert, newPopItCall);

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully updated public/admin.html with 30s Pop-it notification!');
