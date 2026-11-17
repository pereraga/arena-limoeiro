const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Adiciona overscroll-none no modal container e overscroll-contain touch-pan-y no formulário
html = html.replace(
  '<div id="directBookingModal" style="display:none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">',
  '<div id="directBookingModal" style="display:none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in overscroll-none">'
);

html = html.replace(
  '<form onsubmit="handleSaveDirectBooking(event)" class="p-2.5 sm:p-3 space-y-1.5 overflow-y-auto text-xs">',
  '<form onsubmit="handleSaveDirectBooking(event)" class="p-2.5 sm:p-3 space-y-1.5 overflow-y-auto text-xs overscroll-contain touch-pan-y">'
);

// 2. Trava o scroll do body e html ao abrir o modal, e restaura ao fechar
html = html.replace(
  "modal.classList.remove('hidden');\n    modal.style.display = 'flex';",
  "modal.classList.remove('hidden');\n    modal.style.display = 'flex';\n    document.body.style.overflow = 'hidden';\n    document.documentElement.style.overflow = 'hidden';"
);

html = html.replace(
  "modal.classList.add('hidden');\n      modal.style.display = 'none';",
  "modal.classList.add('hidden');\n      modal.style.display = 'none';\n      document.body.style.overflow = '';\n      document.documentElement.style.overflow = '';"
);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Scroll lock script executed successfully!');
