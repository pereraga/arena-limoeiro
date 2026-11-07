const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

console.log('1. Adding DNS prefetch / preconnect in <head>...');
const dnsBlock = `  <link rel="dns-prefetch" href="https://brmclyukjfijommbxhks.supabase.co">
  <link rel="dns-prefetch" href="https://aukrcnhuyultkjqsgvea.supabase.co">
  <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
  <link rel="dns-prefetch" href="https://unpkg.com">
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
  <link rel="preconnect" href="https://brmclyukjfijommbxhks.supabase.co" crossorigin>
  <link rel="preconnect" href="https://aukrcnhuyultkjqsgvea.supabase.co" crossorigin>
  <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
  <link rel="preconnect" href="https://unpkg.com" crossorigin>`;

html = html.replace(
  '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n  <title>',
  `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n${dnsBlock}\n  <title>`
);

console.log('2. Debouncing lucide.createIcons via requestAnimationFrame...');
const lucideDebounce = `  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    // Otimização: Debouncer RAF para lucide.createIcons (evita escaneamento múltiplo e pesado do DOM)
    (function() {
      if (typeof window !== 'undefined') {
        let _iconRaf = null;
        const hookLucide = () => {
          if (window.lucide && typeof window.lucide.createIcons === 'function' && !window.lucide._isDebounced) {
            const _orig = window.lucide.createIcons.bind(window.lucide);
            window.lucide.createIcons = function(options) {
              if (options) return _orig(options);
              if (_iconRaf) return;
              _iconRaf = requestAnimationFrame(() => {
                _iconRaf = null;
                try { _orig(); } catch(e) {}
              });
            };
            window.lucide._isDebounced = true;
          }
        };
        hookLucide();
        window.addEventListener('DOMContentLoaded', hookLucide);
      }
    })();
  </script>`;

html = html.replace('<script src="https://unpkg.com/lucide@latest"></script>', lucideDebounce);

console.log('3. Making Font Awesome non-render-blocking...');
const fontAwesomeAsync = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></noscript>`;

html = html.replace(
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
  fontAwesomeAsync
);

console.log('4. Optimizing background polling loop (document.hidden check + tab focus sync)...');
const targetLoop = `  // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling & virada de dia)
  if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {
      // 1. Detecção e adaptação automática na virada do dia
      if (typeof window.getSystemToday === 'function') {
        const currentToday = window.getSystemToday();
        if (window.__lastKnownSystemDate && window.__lastKnownSystemDate !== currentToday) {
          console.log('[ArenaCalendar] Virada do dia detectada!', window.__lastKnownSystemDate, '->', currentToday);
          window.__lastKnownSystemDate = currentToday;
          window.adminGameState.selectedDate = currentToday;
          if (typeof window.renderMovementCalendarStrip === 'function') {
            window.renderMovementCalendarStrip();
          }
          if (typeof window.selectMovementDay === 'function') {
            window.selectMovementDay(currentToday);
          }
        }
      }

      // 2. Sincronização contínua com os bancos de dados na nuvem
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
      if (typeof window.renderMovementMatches === 'function') {
        window.renderMovementMatches();
      }
      if (typeof window.updateMovementCalendarStrip === 'function') {
        window.updateMovementCalendarStrip();
      }
    }, 7000);
  }`;

const optimizedLoop = `  // Loop ativo e resiliente de sincronização a cada 7 segundos (dual-cloud polling & virada de dia)
  // Otimizado: suspende o loop quando a aba estiver em segundo plano (document.hidden) e reativa no foco
  if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {
      if (document.hidden) return; // Economia profunda de CPU e bateria

      // 1. Detecção e adaptação automática na virada do dia
      if (typeof window.getSystemToday === 'function') {
        const currentToday = window.getSystemToday();
        if (window.__lastKnownSystemDate && window.__lastKnownSystemDate !== currentToday) {
          console.log('[ArenaCalendar] Virada do dia detectada!', window.__lastKnownSystemDate, '->', currentToday);
          window.__lastKnownSystemDate = currentToday;
          window.adminGameState.selectedDate = currentToday;
          if (typeof window.renderMovementCalendarStrip === 'function') {
            window.renderMovementCalendarStrip();
          }
          if (typeof window.selectMovementDay === 'function') {
            window.selectMovementDay(currentToday);
          }
        }
      }

      // 2. Sincronização contínua com os bancos de dados na nuvem (já renderiza partidas ao concluir)
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
    }, 7000);

    // Sincronização instantânea ao reativar a aba
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }
    });
  }`;

if (html.includes(targetLoop)) {
  html = html.replace(targetLoop, optimizedLoop);
  console.log('  -> Target loop replaced successfully!');
} else {
  console.warn('  -> WARNING: targetLoop not found exact match. Trying line normalization...');
  const normalizedTarget = targetLoop.replace(/\r\n/g, '\n');
  const normalizedHtml = html.replace(/\r\n/g, '\n');
  if (normalizedHtml.includes(normalizedTarget)) {
    html = normalizedHtml.replace(normalizedTarget, optimizedLoop.replace(/\r\n/g, '\n'));
    console.log('  -> Target loop replaced after normalization!');
  } else {
    console.error('  -> Failed to replace target loop!');
    process.exit(1);
  }
}

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully written optimized public/admin.html');

// Sync to mirrors
const mirrors = [
  'adm-sec-x9k7-limoeiro-2026-auth.html',
  'adm-sec-x9k7-limoeiro-2026.html',
  'index-sistema1.html',
  'sistema1.html'
];

mirrors.forEach(m => {
  const dest = path.join(__dirname, '..', 'public', m);
  fs.writeFileSync(dest, html, 'utf8');
  console.log('Synced to public/' + m);
});
