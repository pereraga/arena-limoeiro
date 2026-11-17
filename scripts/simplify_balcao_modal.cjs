const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Ocultar o card balcaoScheduledGamesContainer que polui o topo da grade com jogos de outros horários
html = html.replace(
  'id="balcaoScheduledGamesContainer" class="p-3 bg-rose-50/90 border border-rose-200 rounded-xl space-y-1.5"',
  'id="balcaoScheduledGamesContainer" style="display:none !important;" class="hidden"'
);

// 2. Compactar o cabeçalho "JANELA DE AGENDAMENTO", botões de desfazer/limpar e legenda
const oldSubHeader = `<div class="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i>
            </span>
            <div>
              <span class="text-xs font-black text-slate-800 uppercase tracking-tight block">JANELA DE AGENDAMENTO</span>
              <span class="text-[10px] text-slate-500 font-medium">Selecione o horário desejado para a nova reserva de balcão.</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <label class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50">
              <input type="checkbox" id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" checked class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
              <span>Ocultar Indisponíveis</span>
            </label>
            <button type="button" onclick="undoLastBalcaoTimeSlot()" title="Desfazer última alteração de horário" class="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="undo-2" class="w-3 h-3 text-slate-500"></i>
              <span>Voltar Seleção</span>
            </button>
            <button type="button" onclick="resetDirectBookingTimeSlots()" title="Limpar horários selecionados" class="px-2 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>Limpar</span>
            </button>
          </div>
        </div>`;

const newSubHeader = `<div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-black text-slate-800 uppercase tracking-tight">Horários Disponíveis</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="resetDirectBookingTimeSlots()" title="Limpar horários selecionados" class="px-2 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>Limpar</span>
            </button>
            <div style="display:none !important;">
              <input type="checkbox" id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" checked>
            </div>
          </div>
        </div>`;

html = html.replace(oldSubHeader, newSubHeader);

// 3. Compactar a legenda e deixar o card de resumo do horário selecionado limpo e direto
const oldLegenda = `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
          <div class="flex items-center gap-2 flex-wrap text-[10px]">
            <span class="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
              <span class="w-2 h-2 rounded-xs bg-emerald-500"></span> Livre
            </span>
            <span class="inline-flex items-center gap-1 text-emerald-900 font-black bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-600">
              <span class="w-2 h-2 rounded-xs bg-emerald-700"></span> Selecionado
            </span>
            <span class="inline-flex items-center gap-1 text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
              <span class="w-2 h-2 rounded-xs bg-rose-500"></span> Ocupado (Nome)
            </span>
            <span class="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
              <span class="w-2 h-2 rounded-xs bg-slate-400"></span> Horário Passado
            </span>
          </div>

          <div id="balcaoSlotSelectionSummary" class="text-[11px] sm:text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
            <span class="truncate">Horário: <strong id="summarySelectedTime">Nenhum horário selecionado</strong> (<span id="summaryDuration">Toque abaixo</span>)</span>
          </div>
        </div>`;

const newLegenda = `<div class="flex items-center justify-between gap-2 pt-1 text-xs">
          <div class="flex items-center gap-2 text-[11px]">
            <span class="inline-flex items-center gap-1 text-emerald-800 font-bold">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Livre
            </span>
            <span class="inline-flex items-center gap-1 text-emerald-950 font-bold">
              <span class="w-2 h-2 rounded-full bg-emerald-700"></span> Selecionado
            </span>
          </div>

          <div id="balcaoSlotSelectionSummary" class="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
            <span><strong id="summarySelectedTime">Selecione o horário</strong> (<span id="summaryDuration">--</span>)</span>
          </div>
        </div>`;

html = html.replace(oldLegenda, newLegenda);

// 4. Compactar a altura máxima e espaçamento da grade de botões (de max-h-64 para max-h-48, p-1.5)
html = html.replace(
  'id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner"',
  'id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50/80 rounded-xl border border-slate-200"'
);

// 5. Ocultar o campo opcional de CPF para enxugar a tela, focando no essencial: Valor e Pagamento
html = html.replace(
  '<div>\n          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">CPF (Opcional)</label>\n          <input type="text" id="directBookingCpf" placeholder="000.000.000-00"\n                 class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">\n        </div>',
  '<div style="display:none !important;">\n          <input type="hidden" id="directBookingCpf" value="">\n        </div>'
);

// Ajustar o grid de Valor e Pagamento de 3 colunas para 2 colunas
html = html.replace(
  '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">',
  '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">'
);

// 6. Ocultar o campo secundário de observações para deixar a tela enxuta
html = html.replace(
  '<div>\n        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Observações do Agendamento</label>\n        <textarea id="directBookingObs" rows="2" placeholder="Ex.: Time do camisa 10, levar coletes..."\n                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"></textarea>\n      </div>',
  '<div style="display:none !important;">\n        <textarea id="directBookingObs" rows="1"></textarea>\n      </div>'
);

// 7. Simplificar os botões de slots para ficarem menores e mais limpos (apenas o horário e badge sutil)
html = html.replace(
  /class="p-2 rounded-xl text-\[11px\] font-bold bg-emerald-50\/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-\[1\.02\] select-none active:scale-95 transition-transform duration-75"/g,
  'class="p-1.5 rounded-lg text-xs font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully simplified and streamlined direct booking modal!');
