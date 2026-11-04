const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

const idx = content.indexOf('<!-- Horários Fixos (40) -->');
const idxEnd = content.indexOf('<!-- Linha 2 de sub-abas', idx);
const idxEnd2 = content.indexOf('</div>', idxEnd + 50);

if (idx !== -1 && idxEnd2 !== -1) {
  const replacement = `<!-- Horários Fixos (40) - Mensalistas -->
        <button id="btnSubtab-mensalistas" onclick="switchCadastrosSubTab('mensalistas')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <span>📅 Horários Fixos</span>
          <span id="subtabBadgeMensalistasCount" class="text-[11px] font-black text-slate-500">(40)</span>
        </button>

        <!-- Clientes Cadastrados -->
        <button id="btnSubtab-clientes" onclick="switchCadastrosSubTab('clientes')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <span>👥 Clientes Cadastrados</span>
        </button>

        <!-- Conexão Supabase -->
        <button id="btnSubtab-supabase" onclick="switchCadastrosSubTab('supabase')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <i data-lucide="database" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Conexão Supabase</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </button>
      </div>

      <!-- Linha 2 de sub-abas: Backup de Dados -->
      <div class="flex flex-wrap items-center gap-2 w-full pt-1">
        <!-- Backup de Dados -->
        <button id="btnSubtab-backup" onclick="switchCadastrosSubTab('backup')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-xs flex items-center gap-1.5">
          <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-700"></i>
          <span>Backup Completo JSON</span>
        </button>
      </div>`;

  content = content.substring(0, idx) + replacement + content.substring(idxEnd2 + 6);
  fs.writeFileSync(path, content, 'utf8');
  console.log('✓ Replaced subtab buttons in panel-cadastros');
} else {
  console.error('Indices not found!');
}
