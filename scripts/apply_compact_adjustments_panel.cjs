const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetPanel = `          <!-- ZONA DE AJUSTES OPERACIONAIS (ATRASO, EXTRA, ORIGEM, CÁLCULO) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-sliders text-emerald-600"></i> Painel de Ajustes Operacionais & Tempo
              </span>
              <span class="text-[11px] text-slate-500">Ajustes manuais e recálculo</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <!-- Bloco A: Tempo de Atraso -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Tempo de Atraso da Equipe</label>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs w-full">
                    <input type="number" id="input-delay-h-\${m.id}" min="0" max="23" value="\${lateH > 0 ? lateH : '0'}" oninput="onGameDelayHMChange('\${m.id}')" class="w-8 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400 mr-2">h</span>
                    <input type="number" id="input-delay-m-\${m.id}" min="0" max="59" step="5" value="\${lateM > 0 ? lateM : '0'}" oninput="onGameDelayHMChange('\${m.id}')" class="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400">min</span>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-0.5">
                  <div id="status-delay-\${m.id}" class="text-[11px] font-semibold \${lateMin > 0 ? 'text-rose-600' : 'text-emerald-600'} flex items-center gap-1">
                    \${lateMin > 0 ? \`<i class="fa-solid fa-clock text-[10px]"></i> Atraso de \${lateMin}min registrado\` : \`<i class="fa-solid fa-check text-[10px]"></i> Sem atraso (No horário)\`}
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick="quickAddAtrasoCard('\${m.id}', 15)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+15m</button>
                    <button type="button" onclick="quickAddAtrasoCard('\${m.id}', 30)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+30m</button>
                  </div>
                </div>
              </div>

              <!-- Bloco B: Horário Extra -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Tempo de Horário Extra</label>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs w-full">
                    <input type="number" id="input-extra-h-\${m.id}" min="0" max="23" value="\${extraH > 0 ? extraH : '0'}" oninput="onGameExtraHMChange('\${m.id}')" class="w-8 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400 mr-2">h</span>
                    <input type="number" id="input-extra-m-\${m.id}" min="0" max="59" step="15" value="\${extraM > 0 ? extraM : '0'}" oninput="onGameExtraHMChange('\${m.id}')" class="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400">min</span>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-0.5">
                  <div id="status-extra-\${m.id}" class="text-[11px] \${extraMin > 0 ? 'font-bold text-amber-600' : 'text-slate-500'}">
                    \${extraMin > 0 ? \`+\${extraH > 0 ? extraH + 'h ' : ''}\${extraM}min (+R$ \${computedExtraAmountStr})\` : 'Sem tempo extra'}
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick="quickAddExtraCard('\${m.id}', 30)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+30m</button>
                    <button type="button" onclick="quickAddExtraCard('\${m.id}', 60)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+1h</button>
                  </div>
                </div>
              </div>

              <!-- Bloco C: Onde foi marcado (Origem) -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Onde foi marcado (Origem)</label>
                <select id="select-origin-\${m.id}" onchange="onGameOriginChange('\${m.id}', this.value)" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer">
                  <option value="Mensalista" \${originDisplay.toLowerCase().includes('mensalista') ? 'selected' : ''}>Mensalista</option>
                  <option value="WhatsApp Oficial" \${originDisplay.toLowerCase().includes('whatsapp') ? 'selected' : ''}>WhatsApp Oficial</option>
                  <option value="Marcado no Balcão" \${originDisplay.toLowerCase().includes('balcão') ? 'selected' : ''}>Marcado no Balcão</option>
                  <option value="Aplicativo / Web" \${originDisplay.toLowerCase().includes('app') || originDisplay.toLowerCase().includes('web') ? 'selected' : ''}>Aplicativo / Web</option>
                  <option value="Avulso" \${originDisplay.toLowerCase().includes('avulso') ? 'selected' : ''}>Avulso</option>
                </select>
                <div class="text-[11px] text-slate-500" id="status-origin-\${m.id}">\${originDisplay}</div>
              </div>

              <!-- Bloco D: Cálculo Automático e Valor Total -->
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-slate-400">Cálculo Automático / Valor</span>
                  <span id="badge-calc-status-\${m.id}" class="text-[10px] font-bold \${extraMin > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded">
                    \${extraMin > 0 ? 'Pendente Extra' : (isMensalista ? 'Mensal' : 'Pago')}
                  </span>
                </div>
                <div>
                  <div id="status-calc-total-\${m.id}" class="text-xl font-extrabold text-slate-900 font-heading">\${isMensalista ? ('Mensal' + (extraMin > 0 ? ' • Pendente Extra' : '')) : ('R$ ' + currentTotalStr + ' • ' + (extraMin > 0 ? 'Pendente Extra' : 'Pago'))}</div>
                  <div id="status-calc-detail-\${m.id}" class="text-[10px] text-slate-500">
                    \${isMensalista ? 'Plano Mensalista (Gestão mensal separada)' : (extraMin > 0 ? \`Base R$ \${price} + Extra (\${extraMin}m): R$ \${computedExtraAmountStr}\` : \`Valor contratado: R$ \${price}\`)}
                  </div>
                </div>
              </div>

            </div>
          </div>`;

const replacementPanel = `          <!-- ZONA DE AJUSTES OPERACIONAIS (COMPACTA, ELEGANTE E ERGONÔMICA NO MOBILE) -->
          <div class="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/90 border border-slate-200/90 mb-3 sm:mb-4">
            <div class="flex items-center justify-between pb-1.5 sm:pb-2.5 mb-2 sm:mb-3 border-b border-slate-200/70">
              <span class="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 sm:gap-2">
                <i class="fa-solid fa-sliders text-emerald-600 text-[11px] sm:text-xs"></i> Ajustes Operacionais & Tempo
              </span>
              <span class="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:inline">Manual e recálculo</span>
            </div>

            <!-- Grade Responsiva Compacta: 2 colunas no mobile, 4 colunas em telas grandes -->
            <div class="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              
              <!-- Bloco A: Tempo de Atraso -->
              <div class="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <div class="flex items-center justify-between">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 truncate">Atraso da Equipe</label>
                  <div class="flex gap-1 shrink-0">
                    <button type="button" onclick="quickAddAtrasoCard('\${m.id}', 15)" class="text-[9.5px] bg-slate-50 border border-slate-200 px-1 py-0.2 rounded text-slate-600 hover:bg-slate-100 font-bold cursor-pointer">+15m</button>
                    <button type="button" onclick="quickAddAtrasoCard('\${m.id}', 30)" class="text-[9.5px] bg-slate-50 border border-slate-200 px-1 py-0.2 rounded text-slate-600 hover:bg-slate-100 font-bold cursor-pointer">+30m</button>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full justify-center">
                    <input type="number" id="input-delay-h-\${m.id}" min="0" max="23" value="\${lateH > 0 ? lateH : '0'}" oninput="onGameDelayHMChange('\${m.id}')" class="w-6 text-center text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none">
                    <span class="text-[10px] text-slate-400 mr-1.5 font-bold">h</span>
                    <input type="number" id="input-delay-m-\${m.id}" min="0" max="59" step="5" value="\${lateM > 0 ? lateM : '0'}" oninput="onGameDelayHMChange('\${m.id}')" class="w-8 text-center text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none">
                    <span class="text-[10px] text-slate-400 font-bold">min</span>
                  </div>
                </div>
                <div id="status-delay-\${m.id}" class="text-[10px] font-semibold truncate \${lateMin > 0 ? 'text-rose-600' : 'text-emerald-600'}">
                  \${lateMin > 0 ? \`Atraso: \${lateMin}min\` : \`✓ No horário\`}
                </div>
              </div>

              <!-- Bloco B: Horário Extra -->
              <div class="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                <div class="flex items-center justify-between">
                  <label class="block text-[10px] font-bold uppercase text-slate-500 truncate">Horário Extra</label>
                  <div class="flex gap-1 shrink-0">
                    <button type="button" onclick="quickAddExtraCard('\${m.id}', 30)" class="text-[9.5px] bg-slate-50 border border-slate-200 px-1 py-0.2 rounded text-slate-600 hover:bg-slate-100 font-bold cursor-pointer">+30m</button>
                    <button type="button" onclick="quickAddExtraCard('\${m.id}', 60)" class="text-[9.5px] bg-slate-50 border border-slate-200 px-1 py-0.2 rounded text-slate-600 hover:bg-slate-100 font-bold cursor-pointer">+1h</button>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full justify-center">
                    <input type="number" id="input-extra-h-\${m.id}" min="0" max="23" value="\${extraH > 0 ? extraH : '0'}" oninput="onGameExtraHMChange('\${m.id}')" class="w-6 text-center text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none">
                    <span class="text-[10px] text-slate-400 mr-1.5 font-bold">h</span>
                    <input type="number" id="input-extra-m-\${m.id}" min="0" max="59" step="15" value="\${extraM > 0 ? extraM : '0'}" oninput="onGameExtraHMChange('\${m.id}')" class="w-8 text-center text-xs font-extrabold text-slate-800 bg-transparent focus:outline-none">
                    <span class="text-[10px] text-slate-400 font-bold">min</span>
                  </div>
                </div>
                <div id="status-extra-\${m.id}" class="text-[10px] font-semibold truncate \${extraMin > 0 ? 'text-amber-600' : 'text-slate-400'}">
                  \${extraMin > 0 ? \`+\${extraH > 0 ? extraH + 'h ' : ''}\${extraM}m (+R$ \${computedExtraAmountStr})\` : 'Sem tempo extra'}
                </div>
              </div>

              <!-- Bloco C: Onde foi marcado (Origem) -->
              <div class="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1 flex flex-col justify-between">
                <label class="block text-[10px] font-bold uppercase text-slate-500 truncate">Origem</label>
                <select id="select-origin-\${m.id}" onchange="onGameOriginChange('\${m.id}', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer">
                  <option value="Mensalista" \${originDisplay.toLowerCase().includes('mensalista') ? 'selected' : ''}>Mensalista</option>
                  <option value="WhatsApp Oficial" \${originDisplay.toLowerCase().includes('whatsapp') ? 'selected' : ''}>WhatsApp Oficial</option>
                  <option value="Marcado no Balcão" \${originDisplay.toLowerCase().includes('balcão') ? 'selected' : ''}>Balcão</option>
                  <option value="Aplicativo / Web" \${originDisplay.toLowerCase().includes('app') || originDisplay.toLowerCase().includes('web') ? 'selected' : ''}>App / Web</option>
                  <option value="Avulso" \${originDisplay.toLowerCase().includes('avulso') ? 'selected' : ''}>Avulso</option>
                </select>
                <div class="text-[10px] text-slate-400 truncate" id="status-origin-\${m.id}">\${originDisplay}</div>
              </div>

              <!-- Bloco D: Cálculo Automático e Valor Total -->
              <div class="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[9.5px] font-bold uppercase text-slate-400 truncate">Valor / Recálculo</span>
                  <span id="badge-calc-status-\${m.id}" class="text-[9.5px] font-bold \${extraMin > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.2 rounded shrink-0">
                    \${extraMin > 0 ? 'Pendente' : (isMensalista ? 'Mensal' : 'Pago')}
                  </span>
                </div>
                <div>
                  <div id="status-calc-total-\${m.id}" class="text-base sm:text-lg font-extrabold text-slate-900 font-heading leading-tight">\${isMensalista ? ('Mensal' + (extraMin > 0 ? ' • Pendente' : '')) : ('R$ ' + currentTotalStr)}</div>
                  <div id="status-calc-detail-\${m.id}" class="text-[9.5px] text-slate-400 truncate">
                    \${isMensalista ? 'Contrato mensal ativo' : (extraMin > 0 ? \`Base R$ \${price} + Extra: R$ \${computedExtraAmountStr}\` : \`Total: R$ \${price}\`)}
                  </div>
                </div>
              </div>

            </div>
          </div>`;

if (content.includes(targetPanel)) {
  content = content.replace(targetPanel, replacementPanel);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('admin.html updated with ultra-compact operational adjustments panel!');
} else {
  console.error('targetPanel not found in admin.html!');
}
