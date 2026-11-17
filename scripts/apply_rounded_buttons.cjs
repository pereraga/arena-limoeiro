const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Substituir a classe 'rounded' dos botões de slot por 'rounded-xl' ou 'rounded-lg'
// Ocupado:
html = html.replace(
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-400 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center gap-0.2 select-none active:scale-95 transition-all overflow-hidden"',
  'class="py-0.5 px-0.5 rounded-xl text-[8.5px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-400 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center gap-0.2 select-none active:scale-95 transition-all overflow-hidden"'
);

// Passado:
html = html.replace(
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 text-center flex flex-col items-center justify-center select-none"',
  'class="py-0.5 px-0.5 rounded-xl text-[8.5px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 text-center flex flex-col items-center justify-center select-none"'
);

// Início:
html = html.replace(
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-black bg-emerald-600 text-white border border-emerald-800 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"',
  'class="py-0.5 px-0.5 rounded-xl text-[8.5px] font-black bg-emerald-600 text-white border border-emerald-800 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);

// Fim:
html = html.replace(
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-black bg-emerald-700 text-white border border-emerald-900 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"',
  'class="py-0.5 px-0.5 rounded-xl text-[8.5px] font-black bg-emerald-700 text-white border border-emerald-900 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);

// Entre (Selecionado):
html = html.replace(
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"',
  'class="py-0.5 px-0.5 rounded-xl text-[8.5px] font-black bg-emerald-500 text-white border border-emerald-600 shadow-3xs cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);

// Livre (Padrão):
html = html.replace(
  'class="py-0.5 px-0.5 rounded text-[8.5px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"',
  'class="py-0.5 px-0.5 rounded-xl text-[8.5px] font-bold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer text-center flex flex-col items-center justify-center select-none active:scale-95 transition-transform duration-75"'
);

// 2. Badges internas dos botões:
html = html.replace(
  'class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter bg-emerald-800 text-emerald-100 font-black px-1 rounded leading-none"',
  'class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter bg-emerald-800 text-emerald-100 font-black px-1 rounded-md leading-none"'
);

html = html.replace(
  'class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter bg-emerald-950 text-emerald-100 font-black px-1 rounded leading-none"',
  'class="balcao-slot-badge text-[7.5px] uppercase tracking-tighter bg-emerald-950 text-emerald-100 font-black px-1 rounded-md leading-none"'
);

html = html.replace(
  'class="balcao-slot-badge text-[7px] font-black uppercase tracking-tighter text-slate-400 bg-slate-200/90 px-0.5 rounded leading-none"',
  'class="balcao-slot-badge text-[7px] font-black uppercase tracking-tighter text-slate-400 bg-slate-200/90 px-0.5 rounded-md leading-none"'
);

// 3. Legenda e Resumo:
html = html.replace(
  '<span class="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">',
  '<span class="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-300">'
);

html = html.replace(
  '<span class="inline-flex items-center gap-1 text-emerald-900 font-black bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-600">',
  '<span class="inline-flex items-center gap-1 text-emerald-900 font-black bg-emerald-100 px-1.5 py-0.5 rounded-lg border border-emerald-600">'
);

html = html.replace(
  '<span class="inline-flex items-center gap-1 text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">',
  '<span class="inline-flex items-center gap-1 text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 rounded-lg border border-rose-300">'
);

html = html.replace(
  '<span class="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">',
  '<span class="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-300">'
);

html = html.replace(
  '<div id="balcaoSlotSelectionSummary" class="text-[9.5px] font-bold text-emerald-900 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1 whitespace-nowrap overflow-hidden">',
  '<div id="balcaoSlotSelectionSummary" class="text-[9.5px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 whitespace-nowrap overflow-hidden">'
);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Successfully updated slot buttons to rounded-xl!');
