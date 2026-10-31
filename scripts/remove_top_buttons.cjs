const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// Target snippet to remove: Baixar APK, Info Sistema, and 📄 Relatórios
const targetSnippetCRLF = `          <button onclick="openDownloadApkModal()" class="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-amber-600" title="Baixar APK Controle e Cliente">\r
            <i data-lucide="download" class="w-4 h-4 text-white flex-shrink-0"></i>\r
            <span class="whitespace-nowrap">Baixar APK</span>\r
          </button>\r
          <button onclick="openSystemInfoModal()" class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200" title="Ver Informações do Sistema">\r
            <i data-lucide="info" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>\r
            <span class="whitespace-nowrap">Info Sistema</span>\r
          </button>\r
          <button onclick="setAdminTab('reports')" class="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-800" title="Acessar Relatórios e Planilhas">\r
            <i data-lucide="file-text" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>\r
            <span class="whitespace-nowrap">📄 Relatórios</span>\r
          </button>`;

const targetSnippetLF = `          <button onclick="openDownloadApkModal()" class="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-amber-600" title="Baixar APK Controle e Cliente">
            <i data-lucide="download" class="w-4 h-4 text-white flex-shrink-0"></i>
            <span class="whitespace-nowrap">Baixar APK</span>
          </button>
          <button onclick="openSystemInfoModal()" class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200" title="Ver Informações do Sistema">
            <i data-lucide="info" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
            <span class="whitespace-nowrap">Info Sistema</span>
          </button>
          <button onclick="setAdminTab('reports')" class="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-800" title="Acessar Relatórios e Planilhas">
            <i data-lucide="file-text" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
            <span class="whitespace-nowrap">📄 Relatórios</span>
          </button>`;

if (appJs.includes(targetSnippetCRLF)) {
  appJs = appJs.replace(targetSnippetCRLF, '');
  console.log('Removed targetSnippetCRLF successfully');
} else if (appJs.includes(targetSnippetLF)) {
  appJs = appJs.replace(targetSnippetLF, '');
  console.log('Removed targetSnippetLF successfully');
} else {
  console.log('Trying regex replacement for the 3 buttons...');
  const regex = /<button onclick="openDownloadApkModal\(\)"[\s\S]*?<button onclick="setAdminTab\('reports'\)"[\s\S]*?<\/button>\s*/;
  if (regex.test(appJs)) {
    appJs = appJs.replace(regex, '');
    console.log('Removed buttons using regex successfully');
  } else {
    console.error('Could not find buttons snippet to remove');
    process.exit(1);
  }
}

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('public/app.js updated successfully!');
