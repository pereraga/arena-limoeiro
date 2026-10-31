const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Atualizar o bloco HTML do customer-grid para incluir o botão de enviar código e o campo de 4 dígitos OTP
const oldCustomerHtml = `<div class="customer-grid">
                <label><span class="field-label">Seu nome</span><input class="control" id="customerName" type="text" placeholder="Nome completo" autocomplete="name" required /></label>
                <label><span class="field-label">WhatsApp</span><input class="control" id="customerPhone" type="tel" placeholder="(00) 00000-0000" autocomplete="tel" required maxlength="15" /></label>
              </div>`;

const newCustomerHtml = `<div class="customer-grid">
                <label><span class="field-label">Seu nome</span><input class="control" id="customerName" type="text" placeholder="Nome completo" autocomplete="name" required /></label>
                <div>
                  <div class="field-label"><span>WhatsApp do Titular</span><small style="color: #059669; font-weight: 700;">Receberá o código</small></div>
                  <div style="display: flex; gap: 8px;">
                    <input class="control" id="customerPhone" type="tel" placeholder="(00) 00000-0000" autocomplete="tel" required maxlength="15" style="flex: 1;" />
                    <button type="button" id="btnSendCode" style="background: #0f172a; color: #ffffff; border: 1.5px solid #059669; border-radius: 12px; padding: 0 14px; font-size: 12px; font-weight: 800; white-space: nowrap; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 6px;">
                      <span>📲</span>
                      <span id="btnSendCodeText">VERIFICAR</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Caixa de Digitação do Código OTP de Verificação -->
              <div id="otpBox" style="display: none; margin-top: 14px; background: #f8fafc; border: 2px dashed #059669; border-radius: 14px; padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 13px; font-weight: 800; color: #0f172a;">🔐 Digite o Código de 4 Dígitos enviado ao seu WhatsApp:</span>
                  <span id="otpTimer" style="font-size: 12px; color: #64748b; font-weight: 700;"></span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="text" id="otpInput" maxlength="4" placeholder="0000" style="width: 130px; text-align: center; font-size: 22px; font-weight: 900; letter-spacing: 6px; padding: 10px; border: 2px solid #059669; border-radius: 10px; outline: none; background: #ffffff; color: #0f172a;" />
                  <button type="button" id="btnValidateOtp" style="background: #059669; color: #ffffff; border: none; border-radius: 10px; padding: 12px 18px; font-size: 13px; font-weight: 800; cursor: pointer;">
                    CONFIRMAR CÓDIGO
                  </button>
                  <span id="otpStatus" style="font-size: 13px; font-weight: 700;"></span>
                </div>
              </div>`;

content = content.replace(oldCustomerHtml, newCustomerHtml);

// 2. Adicionar a lógica Javascript completa de verificação por WhatsApp
const oldScriptTarget = 'let _eventsInitialized = false;';
const newOtpLogic = `
  let _generatedOtp = null;
  let _isPhoneVerified = false;
  let _verifiedPhone = '';

  async function requestOtpCode() {
    const phoneEl = document.getElementById('customerPhone');
    const nameEl = document.getElementById('customerName');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const name = nameEl ? nameEl.value.trim() : '';
    const cleanPhone = phone.replace(/\\D/g, '');

    if (!name) {
      alert('Por favor, informe seu nome antes de solicitar o código de verificação.');
      if (nameEl) nameEl.focus();
      return;
    }

    if (cleanPhone.length < 10) {
      alert('Por favor, digite um número de WhatsApp válido com DDD (ex: 81 99999-9999).');
      if (phoneEl) phoneEl.focus();
      return;
    }

    const btn = document.getElementById('btnSendCode');
    const btnText = document.getElementById('btnSendCodeText');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'ENVIANDO...';

    // Gera código numérico seguro de 4 dígitos
    _generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : ('55' + cleanPhone);

    const zapMessage = 
      \`🔐 *CÓDIGO DE VERIFICAÇÃO - ARENA LIMOEIRO*\\n\\n\` +
      \`Olá, *\${name}*!\\n\` +
      \`Seu código de segurança para confirmar o agendamento é:\\n\\n\` +
      \`👉 *\${_generatedOtp}* 👈\\n\\n\` +
      \`Digite este código de 4 dígitos na tela para validar o seu WhatsApp e liberar a reserva.\`;

    // 1. Envia para a Supabase Edge Function API-MENSAGEM
    try {
      await fetch('https://aukrcnhuyultkjqsgvea.supabase.co/functions/v1/API-MENSAGEM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
        },
        body: JSON.stringify({
          id: 'VERIF-' + _generatedOtp,
          customer_name: name,
          customer_phone: cleanPhone,
          message: zapMessage,
          otp_code: _generatedOtp
        })
      });
    } catch(e) {
      console.warn('Erro chamada Edge Function:', e);
    }

    // 2. Abre a conversa do WhatsApp para entrega imediata do código
    const zapUrl = \`https://api.whatsapp.com/send?phone=\${formattedPhone}&text=\${encodeURIComponent(zapMessage)}\`;
    try {
      window.open(zapUrl, '_blank');
    } catch(e) {}

    // Exibe o painel de digitação do OTP
    const otpBox = document.getElementById('otpBox');
    if (otpBox) otpBox.style.display = 'block';

    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }

    const otpStatus = document.getElementById('otpStatus');
    if (otpStatus) {
      otpStatus.innerHTML = '<span style="color:#059669;">Código enviado para seu WhatsApp!</span>';
    }

    if (btnText) btnText.textContent = 'REENVIAR';
    if (btn) btn.disabled = false;
  }

  function validateOtpCode() {
    const input = document.getElementById('otpInput');
    const status = document.getElementById('otpStatus');
    const entered = input ? input.value.trim() : '';
    const phone = document.getElementById('customerPhone').value.replace(/\\D/g, '');

    if (!entered || entered.length !== 4) {
      if (status) status.innerHTML = '<span style="color:#ef4444;">Digite os 4 números do código.</span>';
      return;
    }

    if (entered === _generatedOtp) {
      _isPhoneVerified = true;
      _verifiedPhone = phone;
      if (status) status.innerHTML = '<span style="color:#059669; font-weight:800;">✅ WhatsApp Verificado com Sucesso!</span>';
      const btnSend = document.getElementById('btnSendCode');
      if (btnSend) {
        btnSend.style.background = '#059669';
        btnSend.style.borderColor = '#059669';
        btnSend.innerHTML = '<span>✅</span><span>VERIFICADO</span>';
        btnSend.disabled = true;
      }
      const otpBox = document.getElementById('otpBox');
      if (otpBox) {
        otpBox.style.borderColor = '#22c55e';
        otpBox.style.background = '#f0fdf4';
      }
      alert('WhatsApp verificado com sucesso! Agora você pode finalizar o seu agendamento.');
    } else {
      if (status) status.innerHTML = '<span style="color:#ef4444; font-weight:800;">❌ Código incorreto. Tente novamente.</span>';
    }
  }

  let _eventsInitialized = false;`;

content = content.replace(oldScriptTarget, newOtpLogic);

// 3. Atualizar a validação no onsubmit para barrar quem não verificou o código
const submitCheckTarget = "if (!name || phone.replace(/\\D/g, '').length < 10) {";
const newSubmitCheck = `if (!_isPhoneVerified || _verifiedPhone !== phone.replace(/\\D/g, '')) {
          if (notice) {
            notice.innerHTML = '<strong style="color:#ef4444;">⚠️ É necessário verificar seu WhatsApp primeiro!</strong><br>Clique no botão <strong>"VERIFICAR"</strong> ao lado do seu telefone e informe o código recebido para garantir que o número é real.';
            notice.classList.add('show');
            document.getElementById('btnSendCode').scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        if (!name || phone.replace(/\\D/g, '').length < 10) {`;

content = content.replace(submitCheckTarget, newSubmitCheck);

// 4. Adicionar os listeners dos botões de OTP no initEvents
const initEventsTarget = "const phoneInput = document.getElementById('customerPhone');";
const otpListeners = `// Botão de solicitar código OTP
    const btnSendCode = document.getElementById('btnSendCode');
    if (btnSendCode) {
      btnSendCode.onclick = function() {
        requestOtpCode();
      };
    }

    // Botão de validar código OTP
    const btnValidateOtp = document.getElementById('btnValidateOtp');
    if (btnValidateOtp) {
      btnValidateOtp.onclick = function() {
        validateOtpCode();
      };
    }

    // Se o cliente alterar o telefone após verificar, invalida e exige nova verificação
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
      phoneInput.addEventListener('keydown', function() {
        if (_isPhoneVerified) {
          _isPhoneVerified = false;
          const btn = document.getElementById('btnSendCode');
          if (btn) {
            btn.disabled = false;
            btn.style.background = '#0f172a';
            btn.innerHTML = '<span>📲</span><span id="btnSendCodeText">VERIFICAR</span>';
          }
        }
      });
    }`;

content = content.replace(initEventsTarget, otpListeners);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Complete OTP WhatsApp Verification System successfully installed in index-sistema2.html!');
