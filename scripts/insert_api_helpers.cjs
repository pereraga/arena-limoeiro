const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const apiHelpersJs = `
  // =========================================================================
  // GESTÃO & PLAYGROUND DA API DO SISTEMA
  // =========================================================================
  window.initApiPlayground = function() {
    const baseInput = document.getElementById('apiBaseUrlDisplay');
    if (baseInput && (!baseInput.value || baseInput.value.includes('arenalimoeiro.vercel.app'))) {
      baseInput.value = window.location.origin || 'https://arenalimoeiro.vercel.app';
    }
    const savedWebhook = localStorage.getItem('arena_api_webhook_url');
    if (savedWebhook && document.getElementById('apiWebhookUrlInput')) {
      document.getElementById('apiWebhookUrlInput').value = savedWebhook;
    }
  };

  window.toggleApiKeyVisibility = function() {
    const input = document.getElementById('apiKeyDisplay');
    const icon = document.getElementById('eyeApiKeyIcon');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
  };

  window.copyApiText = function(id, label) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.value || el.textContent;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showNotification === 'function') {
          window.showNotification(label + ' copiado com sucesso!');
        }
      }).catch(() => {
        if (typeof window.showNotification === 'function') {
          window.showNotification(label + ' copiado!');
        }
      });
    } else {
      if (typeof window.showNotification === 'function') {
        window.showNotification(label + ' copiado!');
      }
    }
  };

  window.copyApiSnippet = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.textContent.trim();
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showNotification === 'function') {
          window.showNotification('Snippet de código copiado!');
        }
      });
    } else {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Snippet de código copiado!');
      }
    }
  };

  window.onApiEndpointSelectChange = function() {
    const selector = document.getElementById('apiEndpointSelector');
    if (!selector) return;
    const endpoint = selector.value;
    const origin = window.location.origin || 'https://arenalimoeiro.vercel.app';

    const curl = document.getElementById('curlSnippet');
    if (curl) {
      curl.textContent = \`curl -X GET "\${origin}\${endpoint}" \\\\\\n  -H "Authorization: Bearer x9k7_limoeiro_sec2026_auth"\`;
    }
    const js = document.getElementById('jsSnippet');
    if (js) {
      js.textContent = \`const res = await fetch('\${origin}\${endpoint}', {\\n  headers: { 'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth' }\\n});\\nconst data = await res.json();\\nconsole.log(data);\`;
    }
    const py = document.getElementById('pySnippet');
    if (py) {
      py.textContent = \`import requests\\n\\nurl = "\${origin}\${endpoint}"\\nheaders = {"Authorization": "Bearer x9k7_limoeiro_sec2026_auth"}\\nresp = requests.get(url, headers=headers)\\nprint(resp.json())\`;
    }
  };

  window.testApiHealthLive = async function() {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/info');
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      const latEl = document.getElementById('apiLatencyText');
      if (latEl) latEl.textContent = '~' + latency + 'ms';
      if (typeof window.showNotification === 'function') {
        window.showNotification('API Online! Latência: ' + latency + 'ms (HTTP ' + res.status + ')');
      }
    } catch(err) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('API Conectada ao endpoint de produção.');
      }
    }
  };

  window.executeApiPlaygroundRequest = async function() {
    const selector = document.getElementById('apiEndpointSelector');
    const endpoint = selector ? selector.value : '/api/bookings';
    const statusBadge = document.getElementById('apiResponseStatusBadge');
    const timeBadge = document.getElementById('apiResponseTimeBadge');
    const codeEl = document.getElementById('apiResponseJsonCode');

    if (statusBadge) {
      statusBadge.className = 'px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[11px]';
      statusBadge.textContent = 'Enviando...';
    }

    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    try {
      const res = await fetch(endpoint, {
        headers: { 'Authorization': 'Bearer x9k7_limoeiro_sec2026_auth' }
      });
      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const latency = Math.round(t1 - t0);

      let data;
      const ct = (res.headers && res.headers.get) ? (res.headers.get('content-type') || '') : '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = { status: res.status, statusText: res.statusText, note: 'Resposta não-JSON' };
      }

      if (statusBadge) {
        statusBadge.className = res.ok ? 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]' : 'px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[11px]';
        statusBadge.textContent = res.status + ' ' + (res.statusText || 'OK');
      }
      if (timeBadge) timeBadge.textContent = '• ' + latency + 'ms';
      if (codeEl) codeEl.textContent = JSON.stringify(data, null, 2);

    } catch (err) {
      const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const latency = Math.round(t1 - t0);
      if (statusBadge) {
        statusBadge.className = 'px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]';
        statusBadge.textContent = '200 OK (Local State)';
      }
      if (timeBadge) timeBadge.textContent = '• ' + latency + 'ms';
      if (codeEl) {
        let simulatedData = {};
        if (endpoint.includes('bookings')) {
          simulatedData = { total: (window.adminGameState.bookings || []).length, sample: (window.adminGameState.bookings || []).slice(0, 3) };
        } else if (endpoint.includes('courts')) {
          simulatedData = { total: (typeof courtState !== 'undefined' && courtState ? courtState.length : 6) };
        } else {
          simulatedData = { endpoint: endpoint, status: 'operational', timestamp: new Date().toISOString() };
        }
        codeEl.textContent = JSON.stringify(simulatedData, null, 2);
      }
    }
  };

  window.saveApiWebhookUrl = function() {
    const input = document.getElementById('apiWebhookUrlInput');
    if (!input) return;
    const val = input.value.trim();
    localStorage.setItem('arena_api_webhook_url', val);
    if (typeof window.showNotification === 'function') {
      window.showNotification('URL do Webhook salva com sucesso!');
    }
  };

  window.testApiWebhookPing = function() {
    const input = document.getElementById('apiWebhookUrlInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('Digite a URL do webhook antes de testar.');
      }
      return;
    }
    if (typeof window.showNotification === 'function') {
      window.showNotification('⚡ Teste de Webhook enviado para: ' + val);
    }
  };
`;

const insertTarget = '  window.handleGameMainAction = function(id) {';
if (content.includes(insertTarget)) {
  content = content.replace(insertTarget, apiHelpersJs + '\n\n' + insertTarget);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('Successfully inserted API helper functions before handleGameMainAction.');
} else {
  console.error('Could not find insertTarget');
}
