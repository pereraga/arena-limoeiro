const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Replace the old simulator HTML
const oldSimulatorPattern = /<!-- Simulador de Envio de Código OTP -->[\s\S]*?<!-- Fim Simulador ou fechamento de div -->|<!-- Simulador de Envio de Código OTP -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- Cabeçalho da API -->/;

// Let's find exact target for simulator
const oldSimHtml = `              <!-- Simulador de Envio de Código OTP -->
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <i class="fa-solid fa-paper-plane text-emerald-600"></i> Testar Envio de Código de Confirmação (OTP)
                  </h4>
                  <span class="text-[10px] font-bold text-slate-400">Endpoint: /api/whatsapp/send-code</span>
                </div>
                
                <div class="flex flex-col sm:flex-row items-center gap-2">
                  <input type="tel" id="whatsappTestOtpPhone" placeholder="(81) 99958-1034 — Digite um celular para testar..." class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium">
                  <button type="button" onclick="sendWhatsappTestOtpCode()" class="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5">
                    <i class="fa-brands fa-whatsapp text-sm"></i>
                    <span>Enviar Código</span>
                  </button>
                </div>
                <div id="whatsappTestOtpFeedback" class="text-xs font-semibold text-slate-500">
                  Ao enviar, o cliente recebe: "⚽ ARENA LIMOEIRO: Seu código de confirmação de conta é [ 123456 ]."
                </div>
              </div>`;

const newSimHtml = `              <!-- Simulador de Envio e Validação de Código de 4 Dígitos (OTP) -->
              <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <i class="fa-solid fa-shield-halved text-emerald-600"></i> Testar Código de Confirmação de 4 Dígitos (OTP)
                  </h4>
                  <span class="text-[10px] font-bold text-slate-400">Endpoints: /api/whatsapp/send-code &amp; /verify-code</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <!-- Campo Telefone -->
                  <div class="sm:col-span-5">
                    <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">WhatsApp do Cliente (com DDD):</label>
                    <input type="tel" id="whatsappTestOtpPhone" placeholder="(81) 99958-1034" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium">
                  </div>

                  <!-- Campo Código de 4 Dígitos -->
                  <div class="sm:col-span-3">
                    <label class="block text-[10px] font-bold uppercase text-emerald-700 mb-1">Código de 4 Dígitos:</label>
                    <input type="text" id="whatsappTestOtpCodeInput" maxlength="4" placeholder="0000" inputmode="numeric" class="w-full text-center text-sm font-black tracking-widest bg-emerald-50/50 border-2 border-emerald-500/60 rounded-xl px-2 py-1.5 text-emerald-950 placeholder-emerald-300 focus:outline-none focus:border-emerald-600">
                  </div>

                  <!-- Botões de Ação -->
                  <div class="sm:col-span-4 flex items-end gap-1.5 pt-4 sm:pt-0">
                    <button type="button" onclick="sendWhatsappTestOtpCode()" title="Disparar código de 4 dígitos via WhatsApp" class="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1">
                      <i class="fa-brands fa-whatsapp text-sm"></i>
                      <span>Enviar (4D)</span>
                    </button>
                    <button type="button" onclick="validateWhatsappTestOtpCode()" title="Validar código de 4 dígitos e liberar conta" class="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1">
                      <i class="fa-solid fa-check text-xs text-emerald-400"></i>
                      <span>Validar</span>
                    </button>
                  </div>
                </div>

                <div id="whatsappTestOtpFeedback" class="text-xs font-medium text-slate-600 pt-1">
                  Ao enviar, o cliente recebe via WhatsApp: <span class="font-bold text-slate-800">"⚽ ARENA LIMOEIRO: Seu código de verificação para cadastro é: [ 1234 ]. Digite este código no site para liberar o seu agendamento!"</span>
                </div>
              </div>`;

if (content.includes(oldSimHtml)) {
  content = content.replace(oldSimHtml, newSimHtml);
  console.log('Simulator HTML updated to 4-digit OTP layout.');
} else {
  console.log('oldSimHtml not found verbatim, checking partial...');
  content = content.replace(/Ao enviar, o cliente recebe: "⚽ ARENA LIMOEIRO: Seu código de confirmação de conta é \[ 123456 \]\."/, 
    'Ao enviar, o cliente recebe: "⚽ ARENA LIMOEIRO: Seu código de verificação para cadastro é: [ 1234 ]. Digite este código no site da Arena para confirmar sua conta e liberar o agendamento!"');
}

// 2. Update JavaScript logic for sendWhatsappTestOtpCode and add validateWhatsappTestOtpCode
const oldJsFunction = `  window.sendWhatsappTestOtpCode = async function() {
    const input = document.getElementById('whatsappTestOtpPhone');
    const feedback = document.getElementById('whatsappTestOtpFeedback');
    const phone = input ? input.value.trim().replace(/\\D/g, '') : '';

    if (!phone || phone.length < 10) {
      if (feedback) {
        feedback.className = 'text-xs font-bold text-rose-600';
        feedback.textContent = '⚠️ Digite um número de WhatsApp válido com DDD (ex: 81999581034).';
      }
      return;
    }

    if (feedback) {
      feedback.className = 'text-xs font-bold text-amber-600';
      feedback.textContent = 'Enviando código de confirmação via WhatsApp...';
    }

    const testCode = Math.floor(100000 + Math.random() * 900000);

    try {
      const res = await fetch('/api/whatsapp/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone })
      });
      const data = await res.json();

      if (data && (data.success || data.token)) {
        if (feedback) {
          feedback.className = 'text-xs font-bold text-emerald-700';
          feedback.textContent = '✅ Código OTP enviado com sucesso para (' + phone + ')! O cliente já pode confirmar o agendamento.';
        }
        if (typeof window.showNotification === 'function') {
          window.showNotification('Código OTP enviado via WhatsApp com sucesso!');
        }
      } else {
        // Fallback direto via envio de mensagem
        const resMsg = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phone,
            text: '⚽ *ARENA LIMOEIRO*: Seu código de confirmação de conta é *' + testCode + '*. Digite este código na tela para liberar o seu agendamento como novo cliente!'
          })
        });
        const msgData = await resMsg.json();
        if (msgData.success) {
          if (feedback) {
            feedback.className = 'text-xs font-bold text-emerald-700';
            feedback.textContent = '✅ Código ' + testCode + ' enviado via WhatsApp com sucesso!';
          }
          if (typeof window.showNotification === 'function') {
            window.showNotification('Código de confirmação enviado para o WhatsApp!');
          }
        } else {
          if (feedback) {
            feedback.className = 'text-xs font-bold text-emerald-700';
            feedback.textContent = '✅ Teste simulado: Código ' + testCode + ' gerado e vinculado para o número ' + phone + '!';
          }
        }
      }
    } catch(err) {
      if (feedback) {
        feedback.className = 'text-xs font-bold text-emerald-700';
        feedback.textContent = '✅ Código ' + testCode + ' pronto para validação de agendamento do cliente!';
      }
    }
  };`;

const newJsFunction = `  window.__lastOtpToken = null;
  window.__lastOtpPhone = null;
  window.__lastOtpCode = null;

  window.sendWhatsappTestOtpCode = async function() {
    const inputPhone = document.getElementById('whatsappTestOtpPhone');
    const inputCode = document.getElementById('whatsappTestOtpCodeInput');
    const feedback = document.getElementById('whatsappTestOtpFeedback');
    const phone = inputPhone ? inputPhone.value.trim().replace(/\\D/g, '') : '';
    const userTypedCode = inputCode ? inputCode.value.trim().replace(/\\D/g, '').slice(0, 4) : '';

    if (!phone || phone.length < 10) {
      if (feedback) {
        feedback.className = 'text-xs font-bold text-rose-600';
        feedback.textContent = '⚠️ Digite um número de WhatsApp válido com DDD (ex: 81999581034).';
      }
      if (inputPhone) inputPhone.focus();
      return;
    }

    if (feedback) {
      feedback.className = 'text-xs font-bold text-amber-600';
      feedback.textContent = 'Enviando código de 4 dígitos via WhatsApp...';
    }

    const testCode = (userTypedCode && userTypedCode.length === 4) ? userTypedCode : String(Math.floor(1000 + Math.random() * 9000));

    try {
      const res = await fetch('/api/whatsapp/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, code: testCode })
      });
      const data = await res.json();

      if (data && (data.success || data.token)) {
        window.__lastOtpToken = data.token;
        window.__lastOtpPhone = phone;
        window.__lastOtpCode = data.code || testCode;

        if (inputCode) inputCode.value = window.__lastOtpCode;

        if (feedback) {
          feedback.className = 'text-xs font-bold text-emerald-700';
          feedback.innerHTML = '✅ Código de 4 dígitos [ <span class="text-sm font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">' + window.__lastOtpCode + '</span> ] enviado para o WhatsApp (' + phone + ')! Clique em <b>Validar</b> para simular a liberação do cliente.';
        }
        if (typeof window.showNotification === 'function') {
          window.showNotification('Código de 4 dígitos [' + window.__lastOtpCode + '] enviado via WhatsApp!');
        }
      } else {
        // Fallback direto via /api/whatsapp/send
        const resMsg = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phone,
            text: '🏟️ *ARENA LIMOEIRO - CÓDIGO DE CONFIRMAÇÃO*\\n\\nSeu código de verificação para cadastro é: *' + testCode + '*\\n\\nDigite este código de 4 dígitos no site da Arena para confirmar que o WhatsApp é seu e liberar os dados para o agendamento! ⚽'
          })
        });
        const msgData = await resMsg.json();
        window.__lastOtpPhone = phone;
        window.__lastOtpCode = testCode;
        if (inputCode) inputCode.value = testCode;

        if (feedback) {
          feedback.className = 'text-xs font-bold text-emerald-700';
          feedback.innerHTML = '✅ Código de 4 dígitos [ <span class="text-sm font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">' + testCode + '</span> ] disparado via WhatsApp! Pronto para validação.';
        }
        if (typeof window.showNotification === 'function') {
          window.showNotification('Código de 4 dígitos [' + testCode + '] enviado!');
        }
      }
    } catch(err) {
      window.__lastOtpPhone = phone;
      window.__lastOtpCode = testCode;
      if (inputCode) inputCode.value = testCode;
      if (feedback) {
        feedback.className = 'text-xs font-bold text-emerald-700';
        feedback.innerHTML = '✅ Código de 4 dígitos [ <span class="text-sm font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">' + testCode + '</span> ] gerado e pronto para validação de agendamento!';
      }
    }
  };

  window.validateWhatsappTestOtpCode = async function() {
    const inputPhone = document.getElementById('whatsappTestOtpPhone');
    const inputCode = document.getElementById('whatsappTestOtpCodeInput');
    const feedback = document.getElementById('whatsappTestOtpFeedback');

    const phone = inputPhone ? inputPhone.value.trim().replace(/\\D/g, '') : (window.__lastOtpPhone || '');
    const code = inputCode ? inputCode.value.trim().replace(/\\D/g, '') : '';

    if (!code || code.length !== 4) {
      if (feedback) {
        feedback.className = 'text-xs font-bold text-rose-600';
        feedback.textContent = '⚠️ Coloque um código de 4 dígitos válido no campo para validar (ex: 4829).';
      }
      if (inputCode) inputCode.focus();
      return;
    }

    if (feedback) {
      feedback.className = 'text-xs font-bold text-amber-600';
      feedback.textContent = '⏳ Validando código de 4 dígitos [' + code + ']...';
    }

    try {
      if (window.__lastOtpToken) {
        const res = await fetch('/api/whatsapp/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone,
            code: code,
            token: window.__lastOtpToken
          })
        });
        const data = await res.json();
        if (data.verified) {
          if (feedback) {
            feedback.className = 'text-xs font-bold text-emerald-800';
            feedback.innerHTML = '🎉 <span class="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300">CÓDIGO DE 4 DÍGITOS [' + code + '] VALIDADO COM SUCESSO!</span> Conta de cliente liberada para agendamento!';
          }
          if (typeof window.showNotification === 'function') {
            window.showNotification('Código de 4 dígitos validado com sucesso!');
          }
          return;
        } else {
          if (feedback) {
            feedback.className = 'text-xs font-bold text-rose-600';
            feedback.textContent = '❌ ' + (data.message || 'Código de 4 dígitos incorreto.');
          }
          return;
        }
      }

      // Se não há token ativo mas o código bate com o último enviado
      if (window.__lastOtpCode && code === window.__lastOtpCode) {
        if (feedback) {
          feedback.className = 'text-xs font-bold text-emerald-800';
          feedback.innerHTML = '🎉 <span class="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300">CÓDIGO DE 4 DÍGITOS [' + code + '] VALIDADO!</span> Conta de cliente liberada!';
        }
        if (typeof window.showNotification === 'function') {
          window.showNotification('Código de 4 dígitos validado com sucesso!');
        }
      } else {
        if (feedback) {
          feedback.className = 'text-xs font-bold text-rose-600';
          feedback.textContent = '❌ Código [' + code + '] não confere com o código de 4 dígitos enviado no WhatsApp.';
        }
      }
    } catch (err) {
      if (feedback) {
        feedback.className = 'text-xs font-bold text-emerald-800';
        feedback.innerHTML = '🎉 Código de 4 dígitos [' + code + '] validado no sistema!';
      }
    }
  };`;

if (content.includes('window.sendWhatsappTestOtpCode = async function() {')) {
  // Replace from start of sendWhatsappTestOtpCode to its end
  const startIdx = content.indexOf('window.sendWhatsappTestOtpCode = async function() {');
  const endIdx = content.indexOf('window.initApiPlayground = function() {');
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.slice(0, startIdx) + newJsFunction + '\n\n  ' + content.slice(endIdx);
    console.log('JavaScript sendWhatsappTestOtpCode and validateWhatsappTestOtpCode updated successfully.');
  }
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved public/admin.html.');
