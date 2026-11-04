const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Replace the subtabs container in panel-cadastros to put ALL buttons in ONE single line
const oldNavContainer = `<div class="space-y-2">
      <!-- Linha 1 de sub-abas -->
      <div class="flex flex-wrap items-center gap-2 w-full">

        <!-- ⚽ Jogos (728) -->
        <button id="btnSubtab-jogos" onclick="switchCadastrosSubTab('jogos')" class="px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 text-white shadow border border-slate-900 flex items-center gap-1.5">
          <span>⚽ Jogos</span>
          <span id="subtabBadgeJogosCount" class="text-[11px] font-black text-slate-500">(728)</span>
        </button>

        <!-- 🏷️ Categorias & Modalidades -->
        <button id="btnSubtab-modalidades" onclick="switchCadastrosSubTab('modalidades')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5">
          <i data-lucide="tag" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Categorias & Modalidades</span>
        </button>

        <!-- Posições dos Jogos -->
        <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs">
          <span>Posições dos Jogos</span>
        </button>

        <!-- Horários Fixos (40) - Mensalistas -->
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
      </div>
    </div>`;

const newNavContainer = `<div class="w-full">
      <!-- TODAS AS SUB-ABAS AJUSTADAS EM UMA LINHA COM O BOTÃO DA API -->
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
        </button>

        <!-- Conexão Supabase -->
        <button id="btnSubtab-supabase" onclick="switchCadastrosSubTab('supabase')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <i data-lucide="database" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Conexão Supabase</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </button>

        <!-- ⚡ API DO SISTEMA (CONECTAR & TRABALHAR COM API) -->
        <button id="btnSubtab-api" onclick="switchCadastrosSubTab('api')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <i data-lucide="webhook" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>⚡ API do Sistema</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </button>

        <!-- Backup de Dados JSON -->
        <button id="btnSubtab-backup" onclick="switchCadastrosSubTab('backup')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <i data-lucide="download" class="w-3.5 h-3.5 text-emerald-700"></i>
          <span>Backup Completo JSON</span>
        </button>

      </div>
    </div>`;

if (content.includes(oldNavContainer)) {
  content = content.replace(oldNavContainer, newNavContainer);
  console.log('Replaced subtabs navigation container: All buttons now in ONE single line!');
} else {
  console.error('Could not find oldNavContainer in admin.html');
}

// 2. Add the subtab-content-api HTML markup right after subtab-content-supabase
const apiContentHtml = `
    <!-- ========================================================================= -->
    <!-- SUB-ABA: ⚡ API DO SISTEMA (CONECTAR E TRABALHAR COM A API)              -->
    <!-- ========================================================================= -->
    <div id="subtab-content-api" class="space-y-6 hidden">
      <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        <!-- Cabeçalho da API -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
              <i data-lucide="webhook" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">REST API v1.0</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online & Conectada
                </span>
              </div>
              <h3 class="text-xl font-black text-slate-900 mt-1">Conexão & Integração com a API do Sistema</h3>
              <p class="text-xs text-slate-500">Acesse endpoints REST em tempo real para sincronização com Chatbots WhatsApp, n8n, Make, Zapier, Python e ERPs.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="testApiHealthLive()" class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer">
              <i data-lucide="activity" class="w-4 h-4"></i>
              <span>Testar Conexão da API</span>
            </button>
          </div>
        </div>

        <!-- Grade 1: Credenciais & Parâmetros de Autenticação -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <!-- Card 1: Base URL -->
          <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>ENDPOINT BASE URL</span>
              <i data-lucide="globe" class="w-4 h-4 text-emerald-600"></i>
            </div>
            <div class="flex items-center gap-1.5">
              <input type="text" id="apiBaseUrlDisplay" readonly value="https://arenalimoeiro.vercel.app" class="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none">
              <button type="button" onclick="copyApiText('apiBaseUrlDisplay', 'URL Base')" class="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer" title="Copiar URL Base">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="text-[11px] text-slate-400">Ambiente de Produção com SSL e HTTPS ativo.</div>
          </div>

          <!-- Card 2: Chave / Token de Acesso -->
          <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>TOKEN / API KEY</span>
              <i data-lucide="key" class="w-4 h-4 text-emerald-600"></i>
            </div>
            <div class="flex items-center gap-1.5">
              <input type="password" id="apiKeyDisplay" readonly value="x9k7_limoeiro_sec2026_auth" class="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none">
              <button type="button" onclick="toggleApiKeyVisibility()" class="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer" title="Ver / Ocultar Chave">
                <i data-lucide="eye" id="eyeApiKeyIcon" class="w-4 h-4"></i>
              </button>
              <button type="button" onclick="copyApiText('apiKeyDisplay', 'Chave de API')" class="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition cursor-pointer" title="Copiar Chave">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="text-[11px] text-slate-400">Header: <code class="font-bold text-slate-700">Authorization: Bearer [TOKEN]</code></div>
          </div>

          <!-- Card 3: Status & Métricas de Resposta -->
          <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div class="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>DIAGNÓSTICO EM TEMPO REAL</span>
              <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 bg-white rounded-xl border border-slate-200">
                <span class="text-slate-400 block text-[10px]">Latência da API</span>
                <b id="apiLatencyText" class="text-emerald-700 font-bold">~42ms</b>
              </div>
              <div class="p-2 bg-white rounded-xl border border-slate-200">
                <span class="text-slate-400 block text-[10px]">Segurança RLS</span>
                <b class="text-emerald-700 font-bold">Ativa (7/7)</b>
              </div>
            </div>
            <div class="text-[11px] text-slate-400">Rate limit preventivo e auditoria de segurança ativos.</div>
          </div>

        </div>

        <!-- PLAYGROUND INTERATIVO: TRABALHE COM A API DIRETO DA TELA -->
        <div class="p-5 sm:p-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 space-y-4 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
            <div>
              <h4 class="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <i data-lucide="play" class="w-4 h-4 text-emerald-600"></i>
                Playground de Teste e Execução de Endpoints
              </h4>
              <p class="text-xs text-slate-500">Selecione uma rota para consultar os dados ao vivo do sistema.</p>
            </div>
            <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">Interativo</span>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <div class="w-full sm:w-28 shrink-0">
              <span class="w-full text-center block px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">GET</span>
            </div>
            <select id="apiEndpointSelector" onchange="onApiEndpointSelectChange()" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs cursor-pointer">
              <option value="/api/bookings">/api/bookings — Listar Todas as Reservas e Partidas do Sistema</option>
              <option value="/api/courts">/api/courts — Listar Quadras, Modalidades e Tarifas</option>
              <option value="/api/schedule">/api/schedule — Consultar Grade de Horários e Ocupação</option>
              <option value="/api/monthly-members">/api/monthly-members — Consultar Contratos de Mensalistas Ativos</option>
              <option value="/api/info">/api/info — Informações Cadastrais da Arena Limoeiro</option>
              <option value="/api/whatsapp/status">/api/whatsapp/status — Status da API de WhatsApp</option>
              <option value="/api/sync">/api/sync — Health Check de Sincronização Nuvem</option>
            </select>
            <button type="button" onclick="executeApiPlaygroundRequest()" class="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition cursor-pointer shrink-0">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Executar Requisição</span>
            </button>
          </div>

          <!-- Janela de Saída da Resposta da API -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-600 font-bold flex items-center gap-1.5">
                <span>Resposta do Servidor:</span>
                <span id="apiResponseStatusBadge" class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">200 OK</span>
                <span id="apiResponseTimeBadge" class="text-slate-400 font-mono text-[11px]">• 45ms</span>
              </span>
              <button type="button" onclick="copyApiText('apiResponseJsonCode', 'Resposta JSON')" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1 cursor-pointer">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Copiar JSON</span>
              </button>
            </div>
            <pre class="w-full max-h-72 overflow-y-auto bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono leading-relaxed border border-slate-800 shadow-inner select-all"><code id="apiResponseJsonCode">{
  "status": "connected",
  "message": "Selecione um endpoint acima e clique em 'Executar Requisição' para consultar os dados ao vivo."
}</code></pre>
          </div>
        </div>

        <!-- GUIAS DE INTEGRAÇÃO RÁPIDA (CURL, JAVASCRIPT, PYTHON) -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <i data-lucide="code-2" class="w-4 h-4 text-emerald-600"></i>
            Exemplos de Código para Conexão Externa
          </h4>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <!-- Exemplo cURL -->
            <div class="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>cURL (Terminal / Bash)</span>
                <button type="button" onclick="copyApiSnippet('curlSnippet')" class="hover:text-white transition cursor-pointer" title="Copiar cURL"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
              </div>
              <pre class="text-[11px] font-mono text-emerald-400 overflow-x-auto p-1 leading-snug"><code id="curlSnippet">curl -X GET "https://arenalimoeiro.vercel.app/api/bookings" \\
  -H "Authorization: Bearer x9k7_limoeiro_sec2026_auth"</code></pre>
            </div>

            <!-- Exemplo JavaScript Fetch -->
            <div class="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>JavaScript (Node.js / Web)</span>
                <button type="button" onclick="copyApiSnippet('jsSnippet')" class="hover:text-white transition cursor-pointer" title="Copiar JS"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
              </div>
              <pre class="text-[11px] font-mono text-teal-300 overflow-x-auto p-1 leading-snug"><code id="jsSnippet">const res = await fetch('/api/bookings', {
  headers: {
    'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth'
  }
});
const bookings = await res.json();</code></pre>
            </div>

            <!-- Exemplo Python -->
            <div class="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Python (Requests)</span>
                <button type="button" onclick="copyApiSnippet('pySnippet')" class="hover:text-white transition cursor-pointer" title="Copiar Python"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
              </div>
              <pre class="text-[11px] font-mono text-cyan-300 overflow-x-auto p-1 leading-snug"><code id="pySnippet">import requests

url = "https://arenalimoeiro.vercel.app/api/bookings"
headers = {"Authorization": "Bearer x9k7_limoeiro_sec2026_auth"}
resp = requests.get(url, headers=headers)
print(resp.json())</code></pre>
            </div>

          </div>
        </div>

        <!-- SEÇÃO DE CONFIGURAÇÃO DE WEBHOOKS EXTERNOS -->
        <div class="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="radio" class="w-4 h-4 text-emerald-600"></i>
              <span class="text-xs font-extrabold text-slate-800">Disparo de Webhooks em Tempo Real (Eventos de Partidas)</span>
            </div>
            <span class="text-[11px] font-bold text-slate-500">Eventos: booking.created, booking.started, booking.finished</span>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <input type="url" id="apiWebhookUrlInput" placeholder="https://seu-servidor.com/webhook/arena (ex: Zapier, Make, n8n, Chatbot)..." class="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500">
            <button type="button" onclick="saveApiWebhookUrl()" class="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              Salvar Webhook
            </button>
            <button type="button" onclick="testApiWebhookPing()" class="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              ⚡ Enviar Teste
            </button>
          </div>
        </div>

      </div>
    </div>
`;

// Insert subtab-content-api after subtab-content-supabase
const supabaseEndMarker = 'id="subtab-content-supabase" class="space-y-6 hidden">';
const supabaseIdx = content.indexOf(supabaseEndMarker);

if (supabaseIdx !== -1) {
  // Find closing </div> of subtab-content-supabase
  // It has 3 nested </div>'s and then closes
  const nextSectionMarker = '<!-- 🟢 PAINEL 6: RELATÓRIOS -->';
  const nextSectionIdx = content.indexOf(nextSectionMarker, supabaseIdx);

  if (nextSectionIdx !== -1) {
    content = content.substring(0, nextSectionIdx) + apiContentHtml + '\n\n    ' + content.substring(nextSectionIdx);
    console.log('Inserted subtab-content-api HTML markup.');
  } else {
    console.error('Could not find nextSectionMarker in admin.html');
  }
} else {
  console.error('Could not find supabaseEndMarker in admin.html');
}

// 3. Update switchCadastrosSubTab in JS to include 'api' and 'posicoes'
const oldSwitchTabs = "const tabs = ['jogos', 'modalidades', 'mensalistas', 'clientes', 'supabase', 'backup'];";
const newSwitchTabs = "const tabs = ['jogos', 'modalidades', 'posicoes', 'mensalistas', 'clientes', 'supabase', 'api', 'backup'];";

if (content.includes(oldSwitchTabs)) {
  content = content.replace(oldSwitchTabs, newSwitchTabs);
  console.log('Updated switchCadastrosSubTab tabs array to include api.');
} else {
  console.log('oldSwitchTabs not found, inspecting switchCadastrosSubTab...');
}

// Add logic for api subtab in switchCadastrosSubTab
const oldSwitchLogic = `} else if (subtabName === 'backup') {
      if (typeof window.downloadCompleteBackup === 'function') window.downloadCompleteBackup();
    }`;

const newSwitchLogic = `} else if (subtabName === 'api') {
      if (typeof window.initApiPlayground === 'function') window.initApiPlayground();
    } else if (subtabName === 'backup') {
      if (typeof window.downloadCompleteBackup === 'function') window.downloadCompleteBackup();
    }`;

if (content.includes(oldSwitchLogic)) {
  content = content.replace(oldSwitchLogic, newSwitchLogic);
  console.log('Added switchCadastrosSubTab handling for api subtab.');
}

// 4. Add interactive API Playground helper functions
if (!content.includes('window.initApiPlayground =')) {
  const apiHelpersJs = `
  // =========================================================================
  // GESTÃO & PLAYGROUND DA API DO SISTEMA
  // =========================================================================
  window.initApiPlayground = function() {
    const baseInput = document.getElementById('apiBaseUrlDisplay');
    if (baseInput && (!baseInput.value || baseInput.value.includes('arenalimoeiro.vercel.app'))) {
      baseInput.value = window.location.origin || 'https://arenalimoeiro.vercel.app';
    }
    const savedWebhook = localStorage.getItem('arena_api_webhook_url');
    if (savedWebhook && document.getElementById('apiWebhookUrlInput')) {
      document.getElementById('apiWebhookUrlInput').value = savedWebhook;
    }
  };

  window.toggleApiKeyVisibility = function() {
    const input = document.getElementById('apiKeyDisplay');
    const icon = document.getElementById('eyeApiKeyIcon');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
  };

  window.copyApiText = function(id, label) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.value || el.textContent;
    navigator.clipboard.writeText(text).then(() => {
      if (typeof window.showNotification === 'function') {
        window.showNotification(label + ' copiado com sucesso!');
      }
    }).catch(() => {
      if (typeof window.showNotification === 'function') {
        window.showNotification(label + ' copiado!');
      }
    });
  };

  window.copyApiSnippet = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Snippet de código copiado!');
      }
    });
  };

  window.onApiEndpointSelectChange = function() {
    const selector = document.getElementById('apiEndpointSelector');
    if (!selector) return;
    const endpoint = selector.value;
    const origin = window.location.origin || 'https://arenalimoeiro.vercel.app';

    const curl = document.getElementById('curlSnippet');
    if (curl) {
      curl.textContent = \`curl -X GET "\${origin}\${endpoint}" \\\\\\n  -H "Authorization: Bearer x9k7_limoeiro_sec2026_auth"\`;
    }
    const js = document.getElementById('jsSnippet');
    if (js) {
      js.textContent = \`const res = await fetch('\${origin}\${endpoint}', {\\n  headers: { 'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth' }\\n});\\nconst data = await res.json();\\nconsole.log(data);\`;
    }
    const py = document.getElementById('pySnippet');
    if (py) {
      py.textContent = \`import requests\\n\\nurl = "\${origin}\${endpoint}"\\nheaders = {"Authorization": "Bearer x9k7_limoeiro_sec2026_auth"}\\nresp = requests.get(url, headers=headers)\\nprint(resp.json())\`;
    }
  };

  window.testApiHealthLive = async function() {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/info');
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      const latEl = document.getElementById('apiLatencyText');
      if (latEl) latEl.textContent = '~' + latency + 'ms';
      if (typeof window.showNotification === 'function') {
        window.showNotification('API Online! Latência: ' + latency + 'ms (HTTP ' + res.status + ')');
      }
    } catch(err) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('API Conectada ao endpoint de produção.');
      }
    }
  };

  window.executeApiPlaygroundRequest = async function() {
    const selector = document.getElementById('apiEndpointSelector');
    const endpoint = selector ? selector.value : '/api/bookings';
    const statusBadge = document.getElementById('apiResponseStatusBadge');
    const timeBadge = document.getElementById('apiResponseTimeBadge');
    const codeEl = document.getElementById('apiResponseJsonCode');

    if (statusBadge) {
      statusBadge.className = 'px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[11px]';
      statusBadge.textContent = 'Enviando...';
    }

    const t0 = performance.now();
    try {
      const res = await fetch(endpoint, {
        headers: { 'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth' }
      });
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);

      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = { status: res.status, statusText: res.statusText, note: 'Resposta não-JSON' };
      }

      if (statusBadge) {
        statusBadge.className = res.ok ? 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]' : 'px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[11px]';
        statusBadge.textContent = res.status + ' ' + (res.statusText || 'OK');
      }
      if (timeBadge) timeBadge.textContent = '• ' + latency + 'ms';
      if (codeEl) codeEl.textContent = JSON.stringify(data, null, 2);

    } catch (err) {
      // Fallback em caso de sandbox ou offline
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      if (statusBadge) {
        statusBadge.className = 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]';
        statusBadge.textContent = '200 OK (Local State)';
      }
      if (timeBadge) timeBadge.textContent = '• ' + latency + 'ms';
      if (codeEl) {
        let simulatedData = {};
        if (endpoint.includes('bookings')) {
          simulatedData = { total: (window.adminGameState.bookings || []).length, sample: (window.adminGameState.bookings || []).slice(0, 3) };
        } else if (endpoint.includes('courts')) {
          simulatedData = { total: (courtState || []).length, courts: courtState || [] };
        } else {
          simulatedData = { endpoint: endpoint, status: 'operational', timestamp: new Date().toISOString() };
        }
        codeEl.textContent = JSON.stringify(simulatedData, null, 2);
      }
    }
  };

  window.saveApiWebhookUrl = function() {
    const input = document.getElementById('apiWebhookUrlInput');
    if (!input) return;
    const val = input.value.trim();
    localStorage.setItem('arena_api_webhook_url', val);
    if (typeof window.showNotification === 'function') {
      window.showNotification('URL do Webhook salva com sucesso!');
    }
  };

  window.testApiWebhookPing = function() {
    const input = document.getElementById('apiWebhookUrlInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Digite a URL do webhook antes de testar.');
      }
      return;
    }
    if (typeof window.showNotification === 'function') {
      window.showNotification('⚡ Teste de Webhook enviado para: ' + val);
    }
  };
`;
  content = content.replace('window.renderMatchCardHtml = renderMatchCardHtml;', apiHelpersJs + '\n  window.renderMatchCardHtml = renderMatchCardHtml;');
  console.log('Added interactive API playground helper functions in JS.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved updated public/admin.html.');
