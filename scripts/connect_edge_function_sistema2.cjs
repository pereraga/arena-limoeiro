const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// Trecho antigo a ser substituído
const targetOld = `        const cleanPhone = phone.replace(/\\D/g, '');
        const zapText = encodeURIComponent(
          \`*Agendamento Confirmado - Arena Limoeiro*\\n\\n\` +
          \`*ID:* \${bookingId}\\n\` +
          \`*Cliente:* \${name}\\n\` +
          \`*Espaço:* \${courtName}\\n\` +
          \`*Data:* \${dateText}\\n\` +
          \`*Horário:* \${selectedTime} às \${selectedEndTime} (\${duration}h)\\n\` +
          \`*Valor Total:* \${money(price)}\\n\\n\` +
          \`Apresente esta confirmação na recepção da Arena Limoeiro. Bom jogo!\`
        );
        const zapUrl = \`https://api.whatsapp.com/send?phone=55\${cleanPhone}&text=\${zapText}\`;

        if (notice) {
          notice.innerHTML = \`<strong>✅ Agendamento Confirmado com Sucesso!</strong><br><br>\` +
            \`<strong>Código do Jogo:</strong> \${bookingId}<br>\` +
            \`\${courtName} • \${dateText}<br>\` +
            \`\${selectedTime} às \${selectedEndTime} (\${duration}h) • <strong>\${money(price)}</strong><br><br>\` +
            \`<a href="\${zapUrl}" target="_blank" style="display:inline-block;background:#25d366;color:#ffffff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:6px;box-shadow:0 4px 12px rgba(37,211,102,0.3);">📲 Abrir Confirmação no WhatsApp</a>\`;
          notice.classList.add('show');
          notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }`;

// Novo trecho integrado com a Edge Function do Supabase e envio imediato no WhatsApp
const targetNew = `        const cleanPhone = phone.replace(/\\D/g, '');
        const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : ('55' + cleanPhone);

        // Chamada à Edge Function do Supabase API-MENSAGEM
        let edgeResult = null;
        try {
          const edgeRes = await fetch('https://aukrcnhuyultkjqsgvea.supabase.co/functions/v1/API-MENSAGEM', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
            },
            body: JSON.stringify({
              id: bookingId,
              customer_name: name,
              customer_phone: cleanPhone,
              court_name: courtName,
              date: dateVal,
              start_time: selectedTime,
              end_time: selectedEndTime,
              time: selectedTime + ' às ' + selectedEndTime,
              total_price: price,
              observation: courtName
            })
          });
          if (edgeRes.ok) {
            edgeResult = await edgeRes.json();
          }
        } catch (e) {
          console.warn('Edge Function fallback:', e);
        }

        // Mensagem oficial gerada pela Edge Function ou fallback formatado
        const messageText = (edgeResult && edgeResult.message) ? edgeResult.message : (
          \`🏟️ *ARENA LIMOEIRO - COMPROVANTE & CÓDIGO*\\n\\n\` +
          \`Olá, *\${name}*! Seu agendamento foi registrado com sucesso.\\n\\n\` +
          \`🔑 *Código de Verificação:* \`\${bookingId}\`\\n\` +
          \`📍 *Espaço:* \${courtName}\\n\` +
          \`📅 *Data:* \${dateText}\\n\` +
          \`⏰ *Horário:* \${selectedTime} às \${selectedEndTime}\\n\` +
          \`💰 *Valor:* \${money(price)}\\n\\n\` +
          \`_Apresente este código na recepção ao chegar. Bom jogo!_ ⚽\`
        );

        const zapEncoded = encodeURIComponent(messageText);
        const zapUrl = \`https://api.whatsapp.com/send?phone=\${formattedPhone}&text=\${zapEncoded}\`;

        if (notice) {
          notice.innerHTML = \`
            <div style="background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 14px; padding: 18px; color: #14532d; font-family: 'Plus Jakarta Sans', sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="font-size: 22px;">✅</span>
                <strong style="font-size: 17px; color: #166534;">Agendamento Registrado com Sucesso!</strong>
              </div>
              <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; font-size: 14px; line-height: 1.6;">
                <div>🔑 <strong>Código de Verificação:</strong> <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-family: monospace; font-size: 15px;">\${bookingId}</span></div>
                <div>📍 <strong>Espaço:</strong> \${courtName}</div>
                <div>📅 <strong>Data:</strong> \${dateText}</div>
                <div>⏰ <strong>Horário:</strong> \${selectedTime} às \${selectedEndTime}</div>
                <div>💰 <strong>Valor Total:</strong> <strong style="color: #15803d; font-size: 16px;">\${money(price)}</strong></div>
                <div>📱 <strong>WhatsApp:</strong> \${phone}</div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                <a href="\${zapUrl}" target="_blank" id="btnSendZap" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #25d366; color: #ffffff; font-weight: 800; font-size: 15px; padding: 14px 20px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(37,211,102,0.35); transition: transform 0.15s ease;">
                  <span style="font-size: 20px;">📲</span>
                  <span>ENVIAR COMPROVANTE VIA WHATSAPP AGORA</span>
                </a>
                <small style="color: #4b5563; font-size: 12px; text-align: center;">Clique acima para abrir o WhatsApp diretamente no número \${phone} com a mensagem oficial montada pela Edge Function.</small>
              </div>
            </div>
          \`;
          notice.classList.add('show');
          notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          // Disparo automático em nova aba do navegador para abrir o WhatsApp imediatamente
          try {
            window.open(zapUrl, '_blank');
          } catch(e) {}
        }`;

if (content.includes('const zapUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${zapText}`;')) {
  content = content.replace(targetOld, targetNew);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully connected Sistema 2 with Supabase Edge Function API-MENSAGEM!');
} else {
  console.log('Target text not found directly, checking partial replacement...');
  const idx = content.indexOf('const cleanPhone = phone.replace');
  const endIdx = content.indexOf('loadBookingsFromDatabase().then');
  if (idx !== -1 && endIdx !== -1) {
    content = content.slice(0, idx) + targetNew + '\n\n        ' + content.slice(endIdx);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced onsubmit block via range in Sistema 2!');
  } else {
    console.error('Could not find onsubmit range');
  }
}
