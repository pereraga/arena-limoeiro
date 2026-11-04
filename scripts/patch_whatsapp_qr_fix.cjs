const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Update the Connected Panel HTML to include the "Desconectar e Ler Novo QR Code" button
const oldConnectedPanel = `              <!-- Painel de Conexão Ativa (Exibido quando state === 'open') -->
              <div id="whatsappConnectedPanel" style="display:none;" class="w-full text-center py-4 space-y-2">
                <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
                <h4 class="text-base font-extrabold text-emerald-800">WhatsApp Conectado com Sucesso!</h4>
                <p class="text-xs text-slate-600 max-w-xs mx-auto">O sistema está pronto. Quando novos clientes solicitarem agendamentos, o código de confirmação será enviado automaticamente via WhatsApp.</p>
                <div class="pt-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                    <span class="w-2 h-2 rounded-full bg-emerald-200 pulse-dot"></span> Instância: arena-limoeiro
                  </span>
                </div>
              </div>`;

const newConnectedPanel = `              <!-- Painel de Conexão Ativa (Exibido quando state === 'open') -->
              <div id="whatsappConnectedPanel" style="display:none;" class="w-full text-center py-4 space-y-3">
                <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
                <div>
                  <h4 class="text-base font-extrabold text-emerald-800">WhatsApp Conectado com Sucesso!</h4>
                  <p class="text-xs text-slate-600 max-w-xs mx-auto mt-1">O sistema está ativo e enviando mensagens automáticas de confirmação de conta para novos clientes.</p>
                </div>
                <div class="pt-1 flex flex-col items-center gap-2">
                  <span id="whatsappConnectedInfo" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    <span class="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span> Instância Conectada: arena-limoeiro
                  </span>
                  <button type="button" onclick="disconnectAndRenewWhatsappQr()" class="mt-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                    <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                    <span>Desconectar e Ler Novo QR Code</span>
                  </button>
                </div>
              </div>`;

if (content.includes(oldConnectedPanel)) {
  content = content.replace(oldConnectedPanel, newConnectedPanel);
  console.log('Connected Panel HTML updated with disconnect button.');
}

// Also update the "Atualizar QR Code" button in header to force renew
content = content.replace(/onclick="loadWhatsappQrCodeLive\(\)"/g, 'onclick="loadWhatsappQrCodeLive(true)"');

// 2. Update loadWhatsappQrCodeLive, checkWhatsappStatusLive, and add disconnectAndRenewWhatsappQr
const oldWhatsappJsStart = '  window.checkWhatsappStatusLive = async function() {';
const oldWhatsappJsEnd = '  window.initApiPlayground = function() {';

const newWhatsappJs = `  window.checkWhatsappStatusLive = async function() {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      const state = data?.instance?.state || data?.state;
      
      const badge = document.getElementById('whatsappConnectionBadge');
      const qrBox = document.getElementById('whatsappQrBox');
      const connectedPanel = document.getElementById('whatsappConnectedPanel');
      const subtitle = document.getElementById('whatsappStatusSubtitle');

      if (state === 'open') {
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WhatsApp Conectado';
        }
        if (qrBox) qrBox.style.display = 'none';
        if (connectedPanel) connectedPanel.style.display = 'block';
        if (subtitle) subtitle.textContent = 'WhatsApp conectado e pronto para envio de códigos de agendamento.';
      } else {
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando Conexão';
        }
        if (qrBox) qrBox.style.display = 'flex';
        if (connectedPanel) connectedPanel.style.display = 'none';
      }
    } catch (err) {
      console.warn('[WhatsApp] Erro ao checar status:', err);
    }
  };

  window.loadWhatsappQrCodeLive = async function(renew = false) {
    const loading = document.getElementById('whatsappQrLoading');
    const qrImg = document.getElementById('whatsappQrImage');
    const qrBox = document.getElementById('whatsappQrBox');
    const connectedPanel = document.getElementById('whatsappConnectedPanel');
    const subtitle = document.getElementById('whatsappStatusSubtitle');
    const badge = document.getElementById('whatsappConnectionBadge');

    if (qrBox) qrBox.style.display = 'flex';
    if (connectedPanel) connectedPanel.style.display = 'none';
    if (loading) {
      loading.style.display = 'block';
      loading.innerHTML = '<div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><span class="text-xs font-bold text-slate-700 block">' + (renew ? 'Gerando Novo QR Code...' : 'Buscando QR Code...') + '</span><span class="text-[10px] text-slate-400 mt-1 block">Conectando à Evolution API</span>';
    }
    if (qrImg) qrImg.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Solicitando QR Code à Evolution API...';

    try {
      const url = renew ? '/api/whatsapp/qrcode?force=true' : '/api/whatsapp/qrcode';
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.base64) {
        const imgSrc = data.base64.startsWith('data:') ? data.base64 : 'data:image/png;base64,' + data.base64;
        if (qrImg) {
          qrImg.src = imgSrc;
          qrImg.style.display = 'block';
        }
        if (loading) loading.style.display = 'none';
        if (subtitle) subtitle.textContent = 'Aponte a câmera do WhatsApp para escanear o QR Code acima:';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando Leitura';
        }
        return;
      }

      if (data && data.code) {
        const imgSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(data.code);
        if (qrImg) {
          qrImg.src = imgSrc;
          qrImg.style.display = 'block';
        }
        if (loading) loading.style.display = 'none';
        if (subtitle) subtitle.textContent = 'Aponte a câmera do WhatsApp para escanear o QR Code acima:';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando Leitura';
        }
        return;
      }

      if (data?.instance?.state === 'open' && !renew) {
        if (qrBox) qrBox.style.display = 'none';
        if (connectedPanel) connectedPanel.style.display = 'block';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WhatsApp Conectado';
        }
        if (subtitle) subtitle.textContent = 'WhatsApp conectado e pronto para envio de códigos de agendamento.';
        return;
      }

      // Se não retornou base64 nem code e pedimos renew, aguarda 1.5s e tenta novamente
      setTimeout(async () => {
        try {
          const retryRes = await fetch('/api/whatsapp/qrcode');
          const retryData = await retryRes.json();
          if (retryData && (retryData.base64 || retryData.code)) {
            const imgSrc = retryData.base64 
              ? (retryData.base64.startsWith('data:') ? retryData.base64 : 'data:image/png;base64,' + retryData.base64)
              : ('https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(retryData.code));
            if (qrImg) {
              qrImg.src = imgSrc;
              qrImg.style.display = 'block';
            }
            if (loading) loading.style.display = 'none';
            if (subtitle) subtitle.textContent = 'Aponte a câmera do WhatsApp para escanear o QR Code acima:';
          }
        } catch(e) {}
      }, 1500);

    } catch (err) {
      console.warn('[WhatsApp] Erro ao carregar QR Code:', err);
      if (subtitle) subtitle.textContent = 'Erro ao solicitar QR Code. Clique em Atualizar QR Code.';
    }
  };

  window.disconnectAndRenewWhatsappQr = async function() {
    if (!confirm('Deseja desconectar o WhatsApp atual para ler um novo QR Code pelo celular da Arena?')) return;
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    } catch(e) {}
    window.loadWhatsappQrCodeLive(true);
    if (typeof window.showNotification === 'function') {
      window.showNotification('Instância liberada! Escaneie o novo QR Code com o WhatsApp.');
    }
  };`;

const startIdx = content.indexOf(oldWhatsappJsStart);
const endIdx = content.indexOf(oldWhatsappJsEnd);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + newWhatsappJs + '\n\n  ' + content.slice(endIdx);
  console.log('WhatsApp JS logic successfully updated.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved public/admin.html.');
