const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Reduzir largura do modal de max-w-lg (512px) para max-w-md (448px) e padding
html = html.replace(
  '<div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">',
  '<div class="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">'
);

// 2. Reduzir cabeçalho do modal: padding, ícone e tamanho dos textos
html = html.replace(
  '<div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-5 text-white flex items-center justify-between">',
  '<div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 px-4 py-3 text-white flex items-center justify-between">'
);
html = html.replace(
  '<div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">',
  '<div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">'
);
html = html.replace(
  '<i data-lucide="calendar-plus" class="w-5 h-5"></i>',
  '<i data-lucide="calendar-plus" class="w-4 h-4"></i>'
);
html = html.replace(
  '<h3 class="text-base font-black tracking-tight uppercase">Nova Reserva Balcão</h3>',
  '<h3 class="text-sm font-black tracking-tight uppercase">Nova Reserva Balcão</h3>'
);
html = html.replace(
  '<p class="text-xs text-emerald-300 font-medium">Cadastre e libere a partida imediatamente em todas as plataformas</p>',
  '<p class="text-[11px] text-emerald-300 font-medium leading-tight">Cadastre e libere a partida imediatamente em todas as plataformas</p>'
);

// 3. Reduzir padding do form e espaçamento
html = html.replace(
  '<form onsubmit="handleSaveDirectBooking(event)" class="p-5 sm:p-6 space-y-4 overflow-y-auto">',
  '<form onsubmit="handleSaveDirectBooking(event)" class="p-3.5 sm:p-4 space-y-2.5 overflow-y-auto text-xs">'
);

// 4. Reduzir labels e inputs
// Substituir labels text-xs por text-[10px] ou text-[11px] e inputs p-2.5 por py-1.5 px-2.5 text-xs
html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nome do Titular *</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Nome do Titular *</label>'
);
html = html.replace(
  '<input type="text" id="directBookingName" required placeholder="Ex.: Gabriel Silva"\n                 class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">',
  '<input type="text" id="directBookingName" required placeholder="Ex.: Gabriel Silva"\n                 class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone *</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">WhatsApp / Telefone *</label>'
);
html = html.replace(
  '<input type="tel" id="directBookingPhone" required placeholder="(81) 9.9999-9999"\n                 class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">',
  '<input type="tel" id="directBookingPhone" required placeholder="(81) 9.9999-9999"\n                 class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">Quadra / Espaço *</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Quadra / Espaço *</label>'
);
html = html.replace(
  'class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">',
  'class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer">'
);

html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">Data do Jogo *</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Data do Jogo *</label>'
);
html = html.replace(
  '<input type="date" id="directBookingDate" required\n                 class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">',
  '<input type="date" id="directBookingDate" required\n                 class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

// 5. Container de slots: reduzir padding e tamanho da fonte dos textos internos
html = html.replace(
  '<div class="space-y-3 p-3.5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-emerald-200/80 rounded-2xl shadow-xs">',
  '<div class="space-y-2 p-2.5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-emerald-200/80 rounded-xl shadow-2xs text-[11px]">'
);
html = html.replace(
  '<span class="text-xs font-black text-slate-800 uppercase tracking-tight block">JANELA DE AGENDAMENTO</span>',
  '<span class="text-[11px] font-black text-slate-800 uppercase tracking-tight block">JANELA DE AGENDAMENTO</span>'
);
html = html.replace(
  '<span class="text-[10px] text-slate-500 font-medium">Selecione o horário desejado para a nova reserva de balcão.</span>',
  '<span class="text-[9.5px] text-slate-500 font-medium leading-tight">Selecione o horário desejado para a nova reserva de balcão.</span>'
);

// Botões de Ocultar, Voltar, Limpar menores
html = html.replace(
  'class="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50"',
  'class="inline-flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50"'
);
html = html.replace(
  'class="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition"',
  'class="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded flex items-center gap-1 cursor-pointer transition"'
);
html = html.replace(
  'class="px-2 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition"',
  'class="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded flex items-center gap-1 cursor-pointer transition"'
);

// Card de agendamentos agendados
html = html.replace(
  '<div id="balcaoScheduledGamesContainer" class="p-3 bg-rose-50/90 border border-rose-200 rounded-xl space-y-1.5">',
  '<div id="balcaoScheduledGamesContainer" class="p-2 bg-rose-50/90 border border-rose-200 rounded-lg space-y-1 text-[10.5px]">'
);
html = html.replace(
  '<div class="flex items-center justify-between text-xs font-bold text-rose-900">',
  '<div class="flex items-center justify-between text-[10.5px] font-bold text-rose-900">'
);
html = html.replace(
  '<span id="balcaoScheduledGamesCount" class="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full font-black">0 agendados</span>',
  '<span id="balcaoScheduledGamesCount" class="text-[9px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-full font-black">0 agendados</span>'
);

// 6. Grade de botões: reduzir padding interno e fontes nos botões gerados dinamicamente
html = html.replace(
  'id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner"',
  'id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1 max-h-52 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200 shadow-inner"'
);

// 7. Legenda inferior e resumo
html = html.replace(
  '<div class="flex items-center gap-2 flex-wrap text-[10px]">',
  '<div class="flex items-center gap-1.5 flex-wrap text-[9px]">'
);
html = html.replace(
  '<div id="balcaoSlotSelectionSummary" class="text-[11px] sm:text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden">',
  '<div id="balcaoSlotSelectionSummary" class="text-[10.5px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-1 rounded-md border border-emerald-300 flex items-center gap-1 whitespace-nowrap overflow-hidden">'
);

// 8. Campos inferiores: Valor Total, Pagamento, CPF e Observações
html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Total (R$) *</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Valor Total (R$) *</label>'
);
html = html.replace(
  '<input type="number" id="directBookingPrice" required value="110" step="5" min="0"\n                   class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">',
  '<input type="number" id="directBookingPrice" required value="110" step="5" min="0"\n                   class="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">Pagamento</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Pagamento</label>'
);
html = html.replace(
  '<select id="directBookingPayment"\n                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">',
  '<select id="directBookingPayment"\n                  class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer">'
);

html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">CPF (Opcional)</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">CPF (Opcional)</label>'
);
html = html.replace(
  '<input type="text" id="directBookingCpf" placeholder="000.000.000-00"\n                 class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none">',
  '<input type="text" id="directBookingCpf" placeholder="000.000.000-00"\n                 class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

html = html.replace(
  '<label class="block text-xs font-bold text-slate-700 uppercase mb-1">Observações do Agendamento</label>',
  '<label class="block text-[10.5px] font-bold text-slate-600 uppercase mb-0.5">Observações do Agendamento</label>'
);
html = html.replace(
  '<textarea id="directBookingObs" rows="2" placeholder="Ex.: Time do camisa 10, levar coletes..."\n                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"></textarea>',
  '<textarea id="directBookingObs" rows="1" placeholder="Ex.: Time do camisa 10, levar coletes..."\n                  class="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"></textarea>'
);

// 9. Botões de Ação do Rodapé
html = html.replace(
  'class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"',
  'class="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"'
);
html = html.replace(
  'class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"',
  'class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow flex items-center gap-1.5 transition cursor-pointer"'
);

// 10. No Javascript que gera cada botão de slot na grade:
// Substituir tamanhos de p-2 por py-1 px-1.5 e text-[11px] / text-xs por text-[10px]
html = html.replace(
  /class="p-2 min-h-\[60px\] rounded-xl text-\[11px\] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border-2 border-rose-500 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center gap-1 select-none active:scale-95 transition-all overflow-hidden"/g,
  'class="py-1 px-1 rounded-lg text-[10px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-400 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 select-none active:scale-95 transition-all overflow-hidden"'
);
html = html.replace(
  /<span class="font-black text-rose-950 text-xs leading-none">/g,
  '<span class="font-black text-rose-950 text-[10.5px] leading-none">'
);
html = html.replace(
  /class="p-2 rounded-xl text-\[11px\] font-bold bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed opacity-65 text-center flex flex-col items-center justify-center select-none"/g,
  'class="py-1 px-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 text-center flex flex-col items-center justify-center select-none"'
);
html = html.replace(
  /class="p-2 rounded-xl text-\[11px\] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow-md ring-2 ring-emerald-400 transform scale-\[1\.04\] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-1 px-1 rounded-lg text-[10px] font-black bg-emerald-600 text-white border-2 border-emerald-800 shadow ring-1 ring-emerald-400 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /class="p-2 rounded-xl text-\[11px\] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow-md ring-2 ring-emerald-400 transform scale-\[1\.04\] cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-1 px-1 rounded-lg text-[10px] font-black bg-emerald-700 text-white border-2 border-emerald-900 shadow ring-1 ring-emerald-400 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /class="p-2 rounded-xl text-\[11px\] font-black bg-emerald-500 text-white border border-emerald-600 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-1 px-1 rounded-lg text-[10px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);
html = html.replace(
  /class="p-2 rounded-xl text-\[11px\] font-bold bg-emerald-50\/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-500 cursor-pointer text-center flex flex-col items-center justify-center hover:scale-\[1\.02\] select-none active:scale-95 transition-transform duration-75"/g,
  'class="py-1 px-1 rounded-lg text-[10px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully reduced typography and element sizes of directBookingModal in public/admin.html!');
