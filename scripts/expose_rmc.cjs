const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

if (!content.includes('window.renderMatchCardHtml = renderMatchCardHtml;')) {
  content = content.replace(
    'function renderMatchCardHtml(m, isNextUpcoming) {',
    'window.renderMatchCardHtml = renderMatchCardHtml;\n  function renderMatchCardHtml(m, isNextUpcoming) {'
  );
  fs.writeFileSync('public/admin.html', content, 'utf8');
  console.log('✓ Exposed window.renderMatchCardHtml');
} else {
  console.log('Already exposed');
}
