const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Modificar directBookingName
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">Nome do Titular \*<\/label>\s*<input type="text" id="directBookingName" required placeholder="Ex\.: Gabriel Silva"[^>]*>/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Nome do Titular *</label>\n          <input type="text" id="directBookingName" required placeholder="Ex.: Gabriel Silva" class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

// 2. Modificar directBookingPhone
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">WhatsApp \/ Telefone \*<\/label>\s*<input type="tel" id="directBookingPhone" required placeholder="\([0-9]{2}\) 9\.9999-9999"[^>]*>/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">WhatsApp / Telefone *</label>\n          <input type="tel" id="directBookingPhone" required placeholder="(81) 9.9999-9999" class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

// 3. Modificar directBookingCourt
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">Quadra \/ Espaço \*<\/label>\s*<select id="directBookingCourt" required\s+class="[^"]*">/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Quadra / Espaço *</label>\n          <select id="directBookingCourt" required class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer">'
);

// 4. Modificar directBookingDate
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">Data do Jogo \*<\/label>\s*<input type="date" id="directBookingDate" required\s+class="[^"]*">/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Data do Jogo *</label>\n          <input type="date" id="directBookingDate" required class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

// 5. Modificar directBookingPrice
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">Valor Total \(R\$\) \*<\/label>\s*<div class="relative">\s*<span class="[^"]*">R\$<\/span>\s*<input type="number" id="directBookingPrice" required value="110" step="5" min="0"\s+class="[^"]*">\s*<\/div>/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Valor Total (R$) *</label>\n          <div class="relative">\n            <span class="absolute left-2 top-1 text-[9.5px] font-bold text-slate-400">R$</span>\n            <input type="number" id="directBookingPrice" required value="110" step="5" min="0" class="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-black text-emerald-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">\n          </div>'
);

// 6. Modificar directBookingPayment
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">Pagamento<\/label>\s*<select id="directBookingPayment"\s+class="[^"]*">/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Pagamento</label>\n          <select id="directBookingPayment" class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer">'
);

// 7. Modificar directBookingCpf
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">CPF \(Opcional\)<\/label>\s*<input type="text" id="directBookingCpf" placeholder="000\.000\.000-00"\s+class="[^"]*">/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">CPF (Opcional)</label>\n          <input type="text" id="directBookingCpf" placeholder="000.000.000-00" class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none">'
);

// 8. Modificar directBookingObs
html = html.replace(
  /<label class="block text-\[9\.5px\] font-bold text-slate-600 uppercase mb-0\.5">Observações do Agendamento<\/label>\s*<textarea id="directBookingObs" rows="2" placeholder="[^"]*"\s+class="[^"]*"><\/textarea>/,
  '<label class="block text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">Observações do Agendamento</label>\n        <textarea id="directBookingObs" rows="1" placeholder="Ex.: Time do camisa 10, levar coletes..." class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"></textarea>'
);

// 9. Gap das grids
html = html.replace(
  '<form onsubmit="handleSaveDirectBooking(event)" class="p-3.5 sm:p-4 space-y-2.5 overflow-y-auto text-xs">',
  '<form onsubmit="handleSaveDirectBooking(event)" class="p-2.5 sm:p-3 space-y-1.5 overflow-y-auto text-xs">'
);

html = html.replace(
  '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">',
  '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">'
);

html = html.replace(
  '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">',
  '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">'
);

html = html.replace(
  '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">',
  '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">'
);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Script completed successfully!');
