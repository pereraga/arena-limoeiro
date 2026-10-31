const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'public', 'index-sistema1.html');
const destPath = path.join(__dirname, '..', 'public', 'adm-sec-x9k7-limoeiro-2026-auth.html');

let content = fs.readFileSync(srcPath, 'utf8');
const script = `
  <script>
    (function() {
      try {
        var sp = new URLSearchParams(window.location.search);
        if (!sp.get('adm_token')) {
          var u = new URL(window.location.href);
          u.searchParams.set('adm_token', 'x9k7_limoeiro_sec2026_auth');
          window.history.replaceState({}, '', u.toString());
        }
      } catch(e) {}
    })();
  </script>`;

content = content.replace('<head>', '<head>' + script);
fs.writeFileSync(destPath, content, 'utf8');

// Also create adm-sec-x9k7-limoeiro-2026.html
const destPath2 = path.join(__dirname, '..', 'public', 'adm-sec-x9k7-limoeiro-2026.html');
fs.writeFileSync(destPath2, content, 'utf8');

console.log('Created adm-sec auth HTML files successfully.');
