const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let html = fs.readFileSync(path, 'utf8');

// 1. In subtab-content-modalidades inside panel-cadastros, fix premature </section>
const targetPremature = `      <div class="footer-note">
        <b>Observação:</b> as alterações realizadas ficam salvas no armazenamento local deste dispositivo para testes operacionais imediatos sem alterar o banco de dados de produção.
      </div>

    </div>
  </div>
  </div>
    </section>

    <!-- SUB-ABA: MENSALISTAS / HORÁRIOS FIXOS -->`;

const replacementCorrected = `      <div class="footer-note">
        <b>Observação:</b> as alterações realizadas ficam salvas no armazenamento local deste dispositivo para testes operacionais imediatos sem alterar o banco de dados de produção.
      </div>

    </div>
  </div>
  </div>

    <!-- SUB-ABA: MENSALISTAS / HORÁRIOS FIXOS -->`;

if (!html.includes(targetPremature)) {
  console.error('Could not find targetPremature!');
  process.exit(1);
}
html = html.replace(targetPremature, replacementCorrected);

// 2. Add </section> closing panel-cadastros right before panel-reports
const targetBeforeReports = `            <button type="button" onclick="testApiWebhookPing()" class="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              ⚡ Enviar Teste
            </button>
          </div>
        </div>

      </div>
    </div>


    <!-- 🟢 PAINEL 6: RELATÓRIOS -->`;

const replacementBeforeReports = `            <button type="button" onclick="testApiWebhookPing()" class="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer">
              ⚡ Enviar Teste
            </button>
          </div>
        </div>

      </div>
    </div>

    </section>

    <!-- 🟢 PAINEL 6: RELATÓRIOS -->`;

if (!html.includes(targetBeforeReports)) {
  console.error('Could not find targetBeforeReports!');
  process.exit(1);
}
html = html.replace(targetBeforeReports, replacementBeforeReports);

fs.writeFileSync(path, html, 'utf8');
console.log('Successfully fixed section containment for panel-cadastros!');
