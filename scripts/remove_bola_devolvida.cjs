const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('Bola Devolvida');
console.log('Index:', idx);
if (idx !== -1) {
  const lineStart = content.lastIndexOf('<div', idx);
  const lineEnd = content.indexOf('</div>', idx) + 6;
  console.log('Removing:\n', content.slice(lineStart, lineEnd));
  content = content.slice(0, lineStart) + content.slice(lineEnd);
  fs.writeFileSync('public/admin.html', content, 'utf8');
  console.log('✓ Successfully removed Bola Devolvida line');
}
