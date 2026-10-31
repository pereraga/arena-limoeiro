const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'public', 'app.js');
let content = fs.readFileSync(appJsPath, 'utf8');

const target = '<div class="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0 flex-wrap">';
const addition = `
          <a href="/conectar-whatsapp" target="_blank" class="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-black shadow flex items-center space-x-1.5 transition-all text-decoration-none cursor-pointer" title="Conectar o WhatsApp da Arena via Evolution API">
            <i data-lucide="message-circle" class="w-4 h-4 text-emerald-300"></i>
            <span>📲 Conectar WhatsApp</span>
          </a>
          <a href="/" target="_blank" class="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow flex items-center space-x-1.5 transition-all text-decoration-none cursor-pointer" title="Abrir o site de agendamento online dos clientes">
            <i data-lucide="globe" class="w-4 h-4 text-sky-400"></i>
            <span>🌐 Site Clientes</span>
          </a>`;

if (content.includes(target)) {
  content = content.replace(target, target + addition);
  fs.writeFileSync(appJsPath, content, 'utf8');
  console.log('SUCCESS: Admin header updated with WhatsApp & Client Site buttons!');
} else {
  console.error('ERROR: Target div not found in app.js');
}
