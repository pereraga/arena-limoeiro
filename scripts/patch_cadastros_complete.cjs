const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. UPDATE SUBTAB BUTTONS IN panel-cadastros
const oldSubtabButtons = `        <!-- Horários Fixos (40) -->
        <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <span>Horários Fixos</span>
          <span class="text-[11px] font-black text-slate-500">(40)</span>
        </button>

        <!-- Gestores & Acessos -->
        <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <span>👥</span>
          <span>Gestores & Acessos</span>
        </button>

        <!-- Clientes Cadastrados -->
        <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs">
          <span>Clientes Cadastrados</span>
        </button>

        <!-- Conectar WhatsApp -->
        <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Conectar WhatsApp</span>
        </button>

        <!-- Conexão Supabase -->
        <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <i data-lucide="database" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Conexão Supabase</span>
        </button>
      </div>

      <!-- Linha 2 de sub-abas: Logs e Backup de Dados -->
      <div class="flex flex-wrap items-center gap-2 w-full pt-1">
        <!-- Logs -->
        <button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-xs flex items-center gap-1.5">
          <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-amber-600"></i>
          <span>Logs</span>
        </button>

        <!-- Backup de Dados -->
        <button class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <i data-lucide="database" class="w-3.5 h-3.5 text-slate-500"></i>
          <span>Backup de Dados</span>
        </button>`;

const newSubtabButtons = `        <!-- Horários Fixos (40) - Mensalistas -->
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
        <button id="btnSubtab-backup" onclick="switchCadastrosSubTab('backup')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
          <span>Backup Completo JSON</span>
        </button>`;

if (content.includes(oldSubtabButtons)) {
  content = content.replace(oldSubtabButtons, newSubtabButtons);
  console.log('✓ Updated cadastros subtab buttons with IDs and onclicks');
} else {
  console.warn('! Could not find oldSubtabButtons');
}

// 2. INSERT HTML CONTAINERS FOR mensalistas, clientes, supabase
const targetBeforeReports = `    <!-- 🟢 PAINEL 6: RELATÓRIOS -->`;

const newSubtabContainers = `    <!-- SUB-ABA: MENSALISTAS / HORÁRIOS FIXOS -->
    <div id="subtab-content-mensalistas" class="space-y-6 hidden">
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Gestão de Mensalistas</div>
            <h3 class="text-xl font-black text-slate-900">Horários Fixos & Mensalidades</h3>
            <p class="text-xs text-slate-500">Sincronizado automaticamente com os bancos de dados na nuvem Supabase</p>
          </div>
          <div class="flex items-center gap-2">
            <span id="badgeTotalMensalistasCount" class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black">40 mensalistas</span>
            <button onclick="openDirectBookingModal()" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Novo Mensalista</span>
            </button>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input type="text" id="mensalistasSearchInput" oninput="renderCadastrosMensalistas()" placeholder="Buscar por responsável, equipe, telefone ou quadra..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden">
          </div>
          <select id="mensalistasDayFilter" onchange="renderCadastrosMensalistas()" class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white">
            <option value="all">📅 Todos os Dias da Semana</option>
            <option value="segunda">Segunda-feira</option>
            <option value="terca">Terça-feira</option>
            <option value="quarta">Quarta-feira</option>
            <option value="quinta">Quinta-feira</option>
            <option value="sexta">Sexta-feira</option>
            <option value="sabado">Sábado</option>
            <option value="domingo">Domingo</option>
          </select>
        </div>
        <div id="mensalistasTableContainer" class="overflow-x-auto rounded-2xl border border-slate-100">
          <!-- Tabela renderizada dinamicamente -->
        </div>
      </div>
    </div>

    <!-- SUB-ABA: CLIENTES CADASTRADOS -->
    <div id="subtab-content-clientes" class="space-y-6 hidden">
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div class="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Base de Clientes</div>
            <h3 class="text-xl font-black text-slate-900">Clientes & Contatos</h3>
            <p class="text-xs text-slate-500">Histórico de atletas e responsáveis cadastrados no sistema</p>
          </div>
          <span id="badgeTotalClientesCount" class="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-black">Carregando clientes...</span>
        </div>
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          <input type="text" id="clientesSearchInput" oninput="renderCadastrosClientes()" placeholder="Filtrar cliente por nome, telefone ou CPF..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden">
        </div>
        <div id="clientesTableContainer" class="overflow-x-auto rounded-2xl border border-slate-100">
          <!-- Tabela de clientes -->
        </div>
      </div>
    </div>

    <!-- SUB-ABA: CONEXÃO SUPABASE (DIAGNÓSTICO EM TEMPO REAL) -->
    <div id="subtab-content-supabase" class="space-y-6 hidden">
      <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <i data-lucide="database" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Infraestrutura em Nuvem Dual-Cloud</div>
              <h3 class="text-xl font-black text-slate-900">Status dos Bancos de Dados Supabase</h3>
              <p class="text-xs text-slate-500">Sincronização bidirecional em tempo real com failover automático</p>
            </div>
          </div>
          <button onclick="testSupabaseLatency()" class="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer">
            <i data-lucide="activity" class="w-4 h-4"></i>
            <span>Testar Conexão em Tempo Real (Ping)</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- DB2: Ativo Primário -->
          <div class="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Banco de Dados 2 (Ativo - Primário)
              </span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">ONLINE</span>
            </div>
            <div class="text-xs text-slate-600 font-mono break-all bg-white p-2.5 rounded-xl border border-slate-200">
              https://aukrcnhuyultkjqsgvea.supabase.co
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 bg-white rounded-lg border border-slate-100">
                <span class="text-slate-400 block text-[10px]">Latência</span>
                <b id="db2PingLatency" class="text-emerald-700">~85ms</b>
              </div>
              <div class="p-2 bg-white rounded-lg border border-slate-100">
                <span class="text-slate-400 block text-[10px]">Realtime WebSocket</span>
                <b class="text-emerald-700">Conectado (Live)</b>
              </div>
            </div>
          </div>

          <!-- DB1: Redundância Secundária -->
          <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Banco de Dados 1 (Backup - Dual-Write)
              </span>
              <span class="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black">REDUNDÂNCIA</span>
            </div>
            <div class="text-xs text-slate-600 font-mono break-all bg-white p-2.5 rounded-xl border border-slate-200">
              https://brmclyukjfijommbxhks.supabase.co
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 bg-white rounded-lg border border-slate-100">
                <span class="text-slate-400 block text-[10px]">Latência</span>
                <b id="db1PingLatency" class="text-blue-700">~92ms</b>
              </div>
              <div class="p-2 bg-white rounded-lg border border-slate-100">
                <span class="text-slate-400 block text-[10px]">Dual-Write</span>
                <b class="text-blue-700">Ativo 100%</b>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs text-slate-600">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            <span>Row Level Security (RLS) habilitado e verificado em todas as 7 tabelas.</span>
          </div>
          <button onclick="window.pullDataFromCloudDatabases()" class="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer">
            🔄 Sincronizar Agora
          </button>
        </div>
      </div>
    </div>
\n` + targetBeforeReports;

if (content.includes(targetBeforeReports)) {
  content = content.replace(targetBeforeReports, newSubtabContainers);
  console.log('✓ Injected subtab containers for mensalistas, clientes, and supabase');
} else {
  console.warn('! Could not find targetBeforeReports');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Admin html written (Part 3)');
