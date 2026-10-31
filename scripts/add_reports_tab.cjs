const fs = require('fs');

let content = fs.readFileSync('public/app.js', 'utf8');

// 1. Add "Relatórios & Backup" tab to main tabs bar (after Cadastros & Ajustes)
const settingsBtnEnd = '<span class="truncate">Cadastros & Ajustes</span>\r\n          </button>\r\n        ` : \'\'}';

const reportsTabBtn = '<span class="truncate">Cadastros & Ajustes</span>\r\n' +
  '          </button>\r\n' +
  '        ` : \'\'}\r\n' +
  '\r\n' +
  '        <button onclick="setAdminTab(\'reports\')" \r\n' +
  '                class="col-span-2 sm:col-span-1 lg:col-auto w-full lg:w-auto justify-center text-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer\r\n' +
  '                       ${currentTab === \'reports\' ? \r\n' +
  '                         \'bg-emerald-600 text-white font-black border border-emerald-600 shadow-md shadow-emerald-600/25\' : \r\n' +
  '                         \'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs\'}">\r\n' +
  '          <i data-lucide="file-text" class="w-4 h-4 shrink-0 ${currentTab === \'reports\' ? \'text-white\' : \'text-emerald-600\'}"></i>\r\n' +
  '          <span class="truncate">Relatórios & Backup</span>\r\n' +
  '        </button>';

if (!content.includes(settingsBtnEnd)) {
  console.error("Could not find settingsBtnEnd");
  process.exit(1);
}

content = content.replace(settingsBtnEnd, reportsTabBtn);

// 2. Add 'reports' tab in renderAdminTabContent()
const tabContentAnchorCRLF = "  if (currentTab === 'bar_control') {\r\n    return renderBarControlTab();\r\n  }";

const reportsTabContentHandler = "  if (currentTab === 'bar_control') {\r\n" +
  "    return renderBarControlTab();\r\n" +
  "  }\r\n" +
  "\r\n" +
  "  if (currentTab === 'reports') {\r\n" +
  "    return renderAdminBackupTab();\r\n" +
  "  }";

if (!content.includes(tabContentAnchorCRLF)) {
  console.error("Could not find tabContentAnchorCRLF");
  process.exit(1);
}

content = content.replace(tabContentAnchorCRLF, reportsTabContentHandler);

// 3. Add top-header quick button "📄 Relatórios" right next to "⚡ Fazer Reserva Balcão" in the top header
const topHeaderBtnAnchorCRLF = "          ${canDirectBooking() ? `\r\n" +
  "            <button onclick=\"openDirectBookingModal()\" class=\"flex-1 md:flex-initial justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center space-x-1.5 transition-all cursor-pointer\">\r\n" +
  "              <i data-lucide=\"plus-circle\" class=\"w-4 h-4 flex-shrink-0\"></i>\r\n" +
  "              <span class=\"whitespace-nowrap\">⚡ Fazer Reserva Balcão</span>\r\n" +
  "            </button>\r\n" +
  "          ` : ''}";

const reportsQuickHeaderBtn = "          <button onclick=\"setAdminTab('reports')\" class=\"px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-800\" title=\"Acessar Relatórios e Planilhas\">\r\n" +
  "            <i data-lucide=\"file-text\" class=\"w-4 h-4 text-emerald-400 flex-shrink-0\"></i>\r\n" +
  "            <span class=\"whitespace-nowrap\">📄 Relatórios</span>\r\n" +
  "          </button>\r\n" +
  topHeaderBtnAnchorCRLF;

if (!content.includes(topHeaderBtnAnchorCRLF)) {
  console.error("Could not find topHeaderBtnAnchorCRLF");
  process.exit(1);
}

content = content.replace(topHeaderBtnAnchorCRLF, reportsQuickHeaderBtn);

fs.writeFileSync('public/app.js', content, 'utf8');
console.log('Successfully added Relatórios tab to main admin tabs bar and top header!');
