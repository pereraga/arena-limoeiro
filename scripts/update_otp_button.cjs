const fs = require('fs');

const filePath = 'public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

const targetOld = `    // 2. Abre a conversa do WhatsApp para entrega imediata do código
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
    if (btn) btn.disabled = false;`;

const targetNew = `    // 2. Prepara o link direto para o WhatsApp do cliente
    const zapUrl = \`https://api.whatsapp.com/send?phone=\${formattedPhone}&text=\${encodeURIComponent(zapMessage)}\`;

    // Exibe o painel de digitação do OTP
    const otpBox = document.getElementById('otpBox');
    if (otpBox) {
      otpBox.style.display = 'block';
      otpBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
      otpInput.value = '';
      setTimeout(() => otpInput.focus(), 150);
    }

    const otpStatus = document.getElementById('otpStatus');
    if (otpStatus) {
      otpStatus.innerHTML = \`
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="\${zapUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; background: #25d366; color: #ffffff; padding: 8px 14px; border-radius: 8px; font-weight: 800; text-decoration: none; font-size: 13px; box-shadow: 0 2px 8px rgba(37,211,102,0.3);">
              <span>📲</span>
              <span>Abrir no WhatsApp (\${phone})</span>
            </a>
            <span style="font-size: 12px; color: #059669; font-weight: 700;">Código: <strong>\${_generatedOtp}</strong></span>
          </div>
          <small style="color: #64748b; font-size: 11px;">O código foi enviado para a Edge Function do Supabase. Para envio automático invisível pelo WhatsApp da Arena, conecte a sua instância nos Secrets do Supabase.</small>
        </div>
      \`;
    }

    if (btnText) btnText.textContent = 'REENVIAR';
    if (btn) btn.disabled = false;`;

if (content.includes(targetOld)) {
  content = content.replace(targetOld, targetNew);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated requestOtpCode with direct WhatsApp button and visible test code!');
} else {
  console.log('Target old string did not match exactly, searching range...');
  const startIdx = content.indexOf('// 2. Abre a conversa do WhatsApp');
  const endIdx = content.indexOf('if (btn) btn.disabled = false;') + 30;
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.slice(0, startIdx) + targetNew + content.slice(endIdx);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated requestOtpCode via slice!');
  } else {
    console.error('Could not locate range');
  }
}
