const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Substituir o bloco do whatsappQrBox pelo novo com loading nativo e sem imagem estática expirada
const oldBoxRegex = /<div id="whatsappQrBox"[\s\S]*?<\/div>[\s]*?<!-- Painel de Conexão Ativa/i;

const newBoxHtml = `<div id="whatsappQrBox" class="w-64 h-64 bg-white rounded-2xl border-2 border-emerald-500/80 shadow-md flex flex-col items-center justify-center p-2.5 relative overflow-hidden">
                <div id="whatsappQrLoading" class="text-center p-4">
                  <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <span class="text-xs font-bold text-slate-700 block">Gerando QR Code ao Vivo...</span>
                  <span class="text-[10px] text-slate-400 mt-1 block">Conectando à Evolution API</span>
                </div>
                <img id="whatsappQrImage" style="display:none;" class="w-full h-full object-contain rounded-xl" alt="QR Code WhatsApp Oficial Arena Limoeiro" />
              </div>
              <div id="whatsappQrCountdownBadge" class="mt-2 text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Código ativo • Expira em: <b id="whatsappCountdownSec" class="text-emerald-900 font-black">20</b>s</span>
              </div>

              <!-- Painel de Conexão Ativa`;

if (oldBoxRegex.test(html)) {
  html = html.replace(oldBoxRegex, newBoxHtml);
  console.log('✅ Substituído whatsappQrBox com sucesso.');
} else {
  console.log('❌ Não encontrou regex oldBoxRegex');
}

// 2. Atualizar a lógica do loadWhatsappQrCodeLive e temporizador de 20s
const oldJsRegex = /window\.loadWhatsappQrCodeLive = async function[\s\S]*?window\.initApiPlayground = function\(\) \{/i;

const newJsHtml = `window.__whatsappCountdownVal = 20;
  window.__whatsappCountdownTimer = null;
  window.__whatsappQrRefreshTimer = null;

  window.startWhatsappQrCountdown = function() {
    if (window.__whatsappCountdownTimer) clearInterval(window.__whatsappCountdownTimer);
    window.__whatsappCountdownVal = 20;
    const secEl = document.getElementById('whatsappCountdownSec');
    if (secEl) secEl.textContent = '20';

    window.__whatsappCountdownTimer = setInterval(() => {
      window.__whatsappCountdownVal--;
      const el = document.getElementById('whatsappCountdownSec');
      if (el) el.textContent = Math.max(0, window.__whatsappCountdownVal);
      if (window.__whatsappCountdownVal <= 0) {
        clearInterval(window.__whatsappCountdownTimer);
        // Atualiza para novo QR code automaticamente
        window.loadWhatsappQrCodeLive(false);
      }
    }, 1000);
  };

  window.loadWhatsappQrCodeLive = async function(force = false) {
    const loading = document.getElementById('whatsappQrLoading');
    const qrImg = document.getElementById('whatsappQrImage');
    const qrBox = document.getElementById('whatsappQrBox');
    const countdownBadge = document.getElementById('whatsappQrCountdownBadge');
    const connectedPanel = document.getElementById('whatsappConnectedPanel');
    const subtitle = document.getElementById('whatsappStatusSubtitle');
    const badge = document.getElementById('whatsappConnectionBadge');

    if (loading && force) {
      loading.style.display = 'block';
      if (qrImg) qrImg.style.display = 'none';
    }
    if (subtitle) subtitle.textContent = 'Solicitando QR Code em tempo real à Evolution API...';

    try {
      const url = force ? '/api/whatsapp/qrcode?force=true' : '/api/whatsapp/qrcode';
      const res = await fetch(url);
      const data = await res.json();

      if (data?.instance?.state === 'open' || data?.state === 'open') {
        if (qrBox) qrBox.style.display = 'none';
        if (countdownBadge) countdownBadge.style.display = 'none';
        if (connectedPanel) connectedPanel.style.display = 'block';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> WhatsApp Conectado';
        }
        if (subtitle) subtitle.textContent = 'WhatsApp conectado e pronto para envio de códigos de agendamento.';
        if (window.__whatsappCountdownTimer) clearInterval(window.__whatsappCountdownTimer);
        return;
      }

      let srcToRender = null;
      if (data && data.base64) {
        srcToRender = data.base64.startsWith('data:') ? data.base64 : 'data:image/png;base64,' + data.base64;
      } else if (data && data.code) {
        srcToRender = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(data.code);
      }

      if (srcToRender) {
        if (qrImg) {
          qrImg.src = srcToRender;
          qrImg.style.display = 'block';
        }
        if (loading) loading.style.display = 'none';
        if (qrBox) qrBox.style.display = 'flex';
        if (countdownBadge) countdownBadge.style.display = 'inline-flex';
        if (connectedPanel) connectedPanel.style.display = 'none';
        if (subtitle) subtitle.textContent = 'Aponte a câmera do WhatsApp para escanear o QR Code acima:';
        if (badge) {
          badge.className = 'inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Aguardando Leitura';
        }
        // Inicia contagem regressiva para renovação contínua
        window.startWhatsappQrCountdown();
        return;
      }

      // Se ainda não gerou, aguarda 2s e tenta novamente
      setTimeout(() => {
        window.loadWhatsappQrCodeLive(false);
      }, 2000);

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
  };

  window.initApiPlayground = function() {`;

if (oldJsRegex.test(html)) {
  html = html.replace(oldJsRegex, newJsHtml);
  console.log('✅ Substituído JS loadWhatsappQrCodeLive com sucesso.');
} else {
  console.log('❌ Não encontrou regex oldJsRegex');
}

fs.writeFileSync(adminPath, html, 'utf8');
console.log('✅ public/admin.html atualizado.');
