const fs = require('fs');

const filePath = 'public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

const targetOld = `    // 2. Prepara o link direto para o WhatsApp do cliente
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

const targetNew = `    // 2. Link direto para o WhatsApp Oficial da Arena Limoeiro
    const arenaPhone = '558199895484';
    const zapMessageToArena = 
      \`⚽ *VALIDAÇÃO DE NÚMERO - ARENA LIMOEIRO*\\n\\n\` +
      \`Olá! Sou *\${name}* e estou agendando uma partida na Arena.\\n\` +
      \`Meu WhatsApp: *\${phone}*\\n\\n\` +
      \`👉 *CÓDIGO DE SEGURANÇA:* *\${_generatedOtp}*\\n\\n\` +
      \`Envio esta mensagem para validar meu número e liberar meu agendamento!\`;

    const zapUrl = \`https://api.whatsapp.com/send?phone=\${arenaPhone}&text=\${encodeURIComponent(zapMessageToArena)}\`;

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
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <a href="\${zapUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background: #25d366; color: #ffffff; padding: 10px 16px; border-radius: 10px; font-weight: 800; text-decoration: none; font-size: 13.5px; box-shadow: 0 4px 12px rgba(37,211,102,0.35); transition: transform 0.15s ease;">
              <span>📲</span>
              <span>1. Clique Aqui para Enviar ao WhatsApp da Arena (81 9989-5484)</span>
            </a>
          </div>
          <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #166534;">
            👉 Seu código de verificação é: <strong style="font-size: 16px; letter-spacing: 2px; color: #059669; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">\${_generatedOtp}</strong> (digite-o no campo ao lado e clique em Confirmar).
          </div>
        </div>
      \`;
    }

    if (btnText) btnText.textContent = 'REENVIAR';
    if (btn) btn.disabled = false;`;

if (content.includes(targetOld)) {
  content = content.replace(targetOld, targetNew);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully installed Arena Limoeiro official WhatsApp verification flow!');
} else {
  console.log('targetOld not matched, searching slice...');
  const startIdx = content.indexOf('// 2. Prepara o link direto para o WhatsApp do cliente');
  const endIdx = content.indexOf('if (btn) btn.disabled = false;') + 30;
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.slice(0, startIdx) + targetNew + content.slice(endIdx);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced slice with Arena Limoeiro WhatsApp verification flow!');
  } else {
    console.error('Could not find slice');
  }
}
