const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. WhatsApp label que ainda estava com text-xs font-bold text-slate-700
html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone *</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">WhatsApp / Telefone *</label>'
);

// 2. Reduzir todos os outros labels do modal para text-[9.5px]
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Nome do Titular *</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Nome do Titular *</label>'
);
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Quadra / Espaço *</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Quadra / Espaço *</label>'
);
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Data do Jogo *</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Data do Jogo *</label>'
);
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Valor Total (R$) *</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Valor Total (R$) *</label>'
);
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Pagamento</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Pagamento</label>'
);
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">CPF (Opcional)</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">CPF (Opcional)</label>'
);
html = html.replace(
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Observações do Agendamento</label>',
  '<label class="block text-[9.5px] font-bold text-slate-600 uppercase mb-0.5">Observações do Agendamento</label>'
);

// 3. Inputs do formulário: reduzir para text-[11px] e altura menor (py-1 px-2)
html = html.replace(
  /class="w-full py-1\.5 px-2\.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"/g,
  'class="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"'
);
html = html.replace(
  'class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"',
  'class="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"'
);
html = html.replace(
  'class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"',
  'class="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"'
);
html = html.replace(
  'class="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"',
  'class="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"'
);
html = html.replace(
  '<span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>',
  '<span class="absolute left-2.5 top-1.5 text-[10.5px] font-bold text-slate-400">R$</span>'
);
html = html.replace(
  'class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"',
  'class="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"'
);

// 4. Cabeçalho da grade de slots
html = html.replace(
  '<span class="text-[11px] font-black text-slate-800 uppercase tracking-tight block">JANELA DE AGENDAMENTO</span>',
  '<span class="text-[10px] font-black text-slate-800 uppercase tracking-tight block">JANELA DE AGENDAMENTO</span>'
);
html = html.replace(
  '<span class="text-[9.5px] text-slate-500 font-medium leading-tight">Selecione o horário desejado para a nova reserva de balcão.</span>',
  '<span class="text-[8.5px] text-slate-500 font-medium leading-tight">Selecione o horário desejado para a nova reserva de balcão.</span>'
);

// Botões do topo da grade: Ocultar Indisponíveis, Voltar Seleção, Limpar
html = html.replace(
  'class="inline-flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50"',
  'class="inline-flex items-center gap-1 cursor-pointer text-[8.5px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50"'
);
html = html.replace(
  'class="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded flex items-center gap-1 cursor-pointer transition"',
  'class="px-1.5 py-0.5 text-[8.5px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded flex items-center gap-0.5 cursor-pointer transition"'
);
html = html.replace(
  'class="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded flex items-center gap-1 cursor-pointer transition"',
  'class="px-1.5 py-0.5 text-[8.5px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded flex items-center gap-0.5 cursor-pointer transition"'
);

// Card de agendamentos agendados
html = html.replace(
  '<div id="balcaoScheduledGamesContainer" class="p-2 bg-rose-50/90 border border-rose-200 rounded-lg space-y-1 text-[10.5px]">',
  '<div id="balcaoScheduledGamesContainer" class="p-1.5 bg-rose-50/90 border border-rose-200 rounded-lg space-y-0.5 text-[9.5px]">'
);
html = html.replace(
  '<div class="flex items-center justify-between text-[10.5px] font-bold text-rose-900">',
  '<div class="flex items-center justify-between text-[9px] font-bold text-rose-900">'
);
html = html.replace(
  '<span id="balcaoScheduledGamesCount" class="text-[9px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-full font-black">0 agendados</span>',
  '<span id="balcaoScheduledGamesCount" class="text-[8px] bg-rose-200 text-rose-800 px-1 py-0.2 rounded-full font-black">0 agendados</span>'
);

// 5. Botões de slots na grade (HTML gerado via JS)
html = html.replace(
  /class="py-1 px-1 rounded-lg text-\[10px\] font-bold bg-emerald-50\/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /<span class="balcao-slot-badge text-\[9px\] uppercase tracking-wider text-emerald-600 font-semibold">Livre<\/span>/g,
  '<span class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter text-emerald-600 font-semibold leading-none">Livre</span>'
);
html = html.replace(
  /class="py-1 px-1 rounded-lg text-\[10px\] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 text-center flex flex-col items-center justify-center select-none"/g,
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 text-center flex flex-col items-center justify-center select-none"'
);
html = html.replace(
  /<span class="balcao-slot-badge text-\[9px\] font-black uppercase tracking-wider text-slate-400 bg-slate-200\/90 px-1 py-0\.5 rounded shadow-3xs">Passado<\/span>/g,
  '<span class="balcao-slot-badge text-[7px] font-black uppercase tracking-tighter text-slate-400 bg-slate-200/90 px-0.5 rounded leading-none">Passado</span>'
);
html = html.replace(
  /class="py-1 px-1 rounded-lg text-\[10px\] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow ring-1 ring-emerald-400 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-black bg-emerald-600 text-white border border-emerald-800 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /<span class="balcao-slot-badge text-\[9px\] uppercase tracking-wider bg-emerald-800 text-emerald-100 font-black px-1\.5 py-0\.5 rounded shadow-2xs">Início<\/span>/g,
  '<span class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter bg-emerald-800 text-emerald-100 font-black px-1 rounded leading-none">Início</span>'
);
html = html.replace(
  /class="py-1 px-1 rounded-lg text-\[10px\] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow ring-1 ring-emerald-400 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-black bg-emerald-700 text-white border border-emerald-900 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /<span class="balcao-slot-badge text-\[9px\] uppercase tracking-wider bg-emerald-950 text-emerald-100 font-black px-1\.5 py-0\.5 rounded shadow-2xs">Fim<\/span>/g,
  '<span class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter bg-emerald-950 text-emerald-100 font-black px-1 rounded leading-none">Fim</span>'
);
html = html.replace(
  /class="py-1 px-1 rounded-lg text-\[10px\] font-black bg-emerald-500 text-white border border-emerald-600 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /<span class="balcao-slot-badge text-\[9px\] uppercase tracking-wider text-emerald-100 font-bold">✓ Selec\.<\/span>/g,
  '<span class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter text-emerald-100 font-bold leading-none">✓ Selec.</span>'
);
html = html.replace(
  /class="py-1 px-1 rounded-lg text-\[10px\] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-400 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center gap-0\.5 select-none active:scale-95 transition-all overflow-hidden"/g,
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-400 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center gap-0.2 select-none active:scale-95 transition-all overflow-hidden"'
);

// 6. Legenda e Resumo inferior
html = html.replace(
  '<div class="flex items-center gap-1.5 flex-wrap text-[9px]">',
  '<div class="flex items-center gap-1 flex-wrap text-[8px]">'
);
html = html.replace(
  '<div id="balcaoSlotSelectionSummary" class="text-[10.5px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-1 rounded-md border border-emerald-300 flex items-center gap-1 whitespace-nowrap overflow-hidden">',
  '<div id="balcaoSlotSelectionSummary" class="text-[9.5px] font-bold text-emerald-900 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1 whitespace-nowrap overflow-hidden">'
);

// 7. Botões de Cancelar e Confirmar
html = html.replace(
  'class="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"',
  'class="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10.5px] font-bold transition cursor-pointer"'
);
html = html.replace(
  'class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow flex items-center gap-1.5 transition cursor-pointer"',
  'class="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black shadow flex items-center gap-1 transition cursor-pointer"'
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully further reduced typography across all elements of directBookingModal in public/admin.html!');
