const fs = require('fs');
const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

const p = content.indexOf('<!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR');
const pEnd = content.indexOf('<!-- SEÇÃO RECOLHÍVEL: DETALHES, AJUSTES DE TEMPO E OUTROS BOTÕES -->', p);

console.log('Snippet currently between p and pEnd:');
console.log(content.slice(p, pEnd));

const replacementBlock = `<!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              \${st === 'cancelled' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-ban text-rose-600"></i> Cancelado (Falta de Pagamento)
                  </span>
                </div>
              \` : (st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              \` : (isLive ? \`
                <button type="button" id="btn-main-action-\${m.id}" onclick="handleGameMainAction('\${m.id}')" title="Finalizar partida" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check text-[11px]"></i> Finalizar
                </button>
              \` : \`
                <button type="button" id="btn-main-action-\${m.id}" onclick="handleGameMainAction('\${m.id}')" title="Iniciar jogo na quadra" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-600 shadow-md shadow-emerald-700/25 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-play text-[10px]"></i> \${(isToday && nowTimeMin >= sMinStart && nowTimeMin < (sMinStart + 5)) ? ('Iniciar Jogo (' + ((sMinStart + 5) - nowTimeMin) + 'm p/ auto)') : 'Iniciar Jogo na Quadra'}
                </button>
              \`))}
            </div>
          </div>

        </div>

        `;

content = content.slice(0, p) + replacementBlock + content.slice(pEnd);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully replaced button block!');
