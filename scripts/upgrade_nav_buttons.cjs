const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(filePath, 'utf8');

const targetOldGroup = `        <div class="flex items-center gap-2">
          <button onclick="window.selectMovementDay(window.getSystemToday())" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 shadow cursor-pointer transition">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>Hoje</span>
          </button>
          <button onclick="window.navigateMovementDay(-7)" title="Semana anterior" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">&lt; Mês</button>
          <button onclick="window.navigateMovementDay(-1)" title="Dia anterior" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">&lt;</button>
          <button onclick="window.navigateMovementDay(1)" title="Próximo dia" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">&gt;</button>
          <button onclick="window.navigateMovementDay(7)" title="Próxima semana" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer transition">Mês &gt;</button>
          <span id="calendarHeaderDateDisplay" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 flex items-center gap-1">
            <span id="calendarHeaderDateSpan">-- / -- / ----</span>
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-400"></i>
          </span>
        </div>`;

const modernNewGroup = `        <!-- Controles Modernos de Navegação Temporal -->
        <div class="flex items-center flex-wrap gap-2">
          
          <!-- Botão HOJE com Destaque Premium -->
          <button onclick="window.selectMovementDay(window.getSystemToday())" 
                  title="Ir diretamente para o dia de hoje"
                  class="h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer">
            <i data-lucide="sparkles" class="w-4 h-4 text-emerald-200"></i>
            <span>Hoje</span>
          </button>

          <!-- Grupo de Navegação em Segmento Unificado -->
          <div class="inline-flex items-center p-1 bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs gap-0.5">
            <button onclick="window.navigateMovementDay(-7)" 
                    title="Voltar 7 dias (Semana anterior)"
                    class="h-7 px-2.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-white active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
              <i data-lucide="chevrons-left" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Semana</span>
            </button>
            <button onclick="window.navigateMovementDay(-1)" 
                    title="Dia anterior"
                    class="h-7 w-7 rounded-lg text-slate-700 hover:text-emerald-700 hover:bg-white active:scale-95 transition-all flex items-center justify-center cursor-pointer">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div class="w-px h-4 bg-slate-200 mx-0.5"></div>
            <button onclick="window.navigateMovementDay(1)" 
                    title="Próximo dia"
                    class="h-7 w-7 rounded-lg text-slate-700 hover:text-emerald-700 hover:bg-white active:scale-95 transition-all flex items-center justify-center cursor-pointer">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
            <button onclick="window.navigateMovementDay(7)" 
                    title="Avançar 7 dias (Próxima semana)"
                    class="h-7 px-2.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-white active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
              <span class="hidden sm:inline">Semana</span>
              <i data-lucide="chevrons-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Seletor de Data Interativo (Badge Clicável com Datepicker Nativo Oculto) -->
          <div class="relative inline-flex items-center">
            <label for="hiddenCalendarDatePicker" 
                   id="calendarHeaderDateDisplay" 
                   title="Clique para escolher qualquer data no calendário"
                   class="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-500/50 text-xs font-extrabold text-slate-800 shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-95">
              <i data-lucide="calendar" class="w-4 h-4 text-emerald-600 shrink-0"></i>
              <span id="calendarHeaderDateSpan" class="tracking-tight">-- / -- / ----</span>
              <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400 shrink-0"></i>
            </label>
            <input type="date" 
                   id="hiddenCalendarDatePicker" 
                   class="sr-only" 
                   onchange="if(this.value) window.selectMovementDay(this.value)">
          </div>

        </div>`;

if (html.includes(targetOldGroup)) {
  html = html.replace(targetOldGroup, modernNewGroup);
  console.log('✓ Successfully replaced navigation button group with modern UI');
} else {
  console.error('❌ Could not find targetOldGroup in admin.html!');
  process.exit(1);
}

// Ensure selectMovementDay updates hiddenCalendarDatePicker.value if present
const selectDayAnchor = "const calDisplay = document.getElementById('calendarHeaderDateDisplay');";
const datePickerSync = `const hiddenPicker = document.getElementById('hiddenCalendarDatePicker');
    if (hiddenPicker && dateStr) {
      hiddenPicker.value = dateStr;
    }
    const calDisplay = document.getElementById('calendarHeaderDateDisplay');`;

if (html.includes(selectDayAnchor) && !html.includes('hiddenCalendarDatePicker')) {
  html = html.replace(selectDayAnchor, datePickerSync);
  console.log('✓ Added hiddenCalendarDatePicker sync to selectMovementDay');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved admin.html, new length:', html.length);

// Validate scripts
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let errors = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  scriptIdx++;
  const scriptContent = match[1];
  if (!scriptContent.trim()) continue;
  try {
    new vm.Script(scriptContent);
  } catch(e) {
    console.error(`Script #${scriptIdx} validation error:`, e.message);
    errors++;
  }
}
if (errors === 0) {
  console.log(`✓ All ${scriptIdx} <script> tags validated successfully with 0 errors!`);
} else {
  console.error(`❌ Found ${errors} script validation errors!`);
  process.exit(1);
}
