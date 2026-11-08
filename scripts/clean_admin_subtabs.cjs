const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let html = fs.readFileSync(path, 'utf8');

// The 4 subtabs to remove from panel-cadastros are Jogos, Categorias & Modalidades, Posições dos Jogos, Horários Fixos
// Keep Clientes Cadastrados (active by default), Conexão Supabase, API do Sistema, Backup Completo JSON
const targetNav = `      <!-- TODAS AS SUB-ABAS AJUSTADAS EM UMA LINHA COM O BOTÃO DA API -->
      <div class="flex items-center gap-2 w-full overflow-x-auto pb-2 scrollbar-none flex-nowrap">

        <!-- ⚽ Jogos (728) -->
        <button id="btnSubtab-jogos" onclick="switchCadastrosSubTab('jogos')" class="px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 text-white shadow border border-slate-900 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span>⚽ Jogos</span>
          <span id="subtabBadgeJogosCount" class="text-[11px] font-black text-slate-400">(728)</span>
        </button>

        <!-- 🏷️ Categorias & Modalidades -->
        <button id="btnSubtab-modalidades" onclick="switchCadastrosSubTab('modalidades')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <i data-lucide="tag" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Categorias & Modalidades</span>
        </button>

        <!-- Posições dos Jogos -->
        <button id="btnSubtab-posicoes" onclick="switchCadastrosSubTab('posicoes')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Posições dos Jogos</span>
        </button>

        <!-- Horários Fixos (40) - Mensalistas -->
        <button id="btnSubtab-mensalistas" onclick="switchCadastrosSubTab('mensalistas')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span>📅 Horários Fixos</span>
          <span id="subtabBadgeMensalistasCount" class="text-[11px] font-black text-slate-400">(40)</span>
        </button>

        <!-- Clientes Cadastrados -->
        <button id="btnSubtab-clientes" onclick="switchCadastrosSubTab('clientes')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span>👥 Clientes Cadastrados</span>
        </button>`;

const newNav = `      <!-- SUB-ABAS DO PAINEL ADMINISTRATIVO: Clientes, Supabase, API e Backup -->
      <div class="flex items-center gap-2 w-full overflow-x-auto pb-2 scrollbar-none flex-nowrap">

        <!-- Clientes Cadastrados (Aba Ativa Inicial) -->
        <button id="btnSubtab-clientes" onclick="switchCadastrosSubTab('clientes')" class="px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 text-white shadow border border-slate-900 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span>👥 Clientes Cadastrados</span>
        </button>`;

if (!html.includes(targetNav)) {
  console.error('Target nav not found in admin.html!');
  process.exit(1);
}

html = html.replace(targetNav, newNav);

// Also in panel-cadastros, subtab-content-jogos, subtab-content-modalidades, subtab-content-mensalistas should be hidden by default, while subtab-content-clientes should NOT be hidden
html = html.replace('<div id="subtab-content-jogos" class="space-y-6">', '<div id="subtab-content-jogos" class="space-y-6 hidden">');
html = html.replace('<div id="subtab-content-clientes" class="space-y-6 hidden">', '<div id="subtab-content-clientes" class="space-y-6">');

// Update activeCadastrosSubTab initialization
html = html.replace("activeCadastrosSubTab: 'jogos'", "activeCadastrosSubTab: 'clientes'");

// In showAdminTab: if opening cadastros, renderCadastrosClientes()
const oldShowAdminTabCadastros = "if (typeof renderSpacesGrid === 'function' && targetTab === 'cadastros') renderSpacesGrid();";
const newShowAdminTabCadastros = "if (typeof renderCadastrosClientes === 'function' && targetTab === 'cadastros') renderCadastrosClientes();";
if (html.includes(oldShowAdminTabCadastros)) {
  html = html.replace(oldShowAdminTabCadastros, newShowAdminTabCadastros);
}

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully updated panel-cadastros navigation in admin.html!');
