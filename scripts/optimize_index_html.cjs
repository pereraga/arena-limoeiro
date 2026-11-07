const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');
const indexSistema2Path = path.join(__dirname, '..', 'public', 'index-sistema2.html');

let html = fs.readFileSync(indexHtmlPath, 'utf8');
const originalSize = Buffer.byteLength(html, 'utf8');

// Replace favicon
html = html.replace(/<link rel="icon" type="image\/png" href="data:image\/png;base64,[^"]+"\s*\/?>/, '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n  <link rel="apple-touch-icon" href="/apple-touch-icon.png">');

// Replace logo
html = html.replace(/<img class="brand-logo" src="data:image\/png;base64,[^"]+"/, '<img class="brand-logo" src="/logo.png"');

const newSize = Buffer.byteLength(html, 'utf8');
console.log('Original size:', originalSize, 'New size:', newSize, 'Saved:', (originalSize - newSize), 'bytes (~' + Math.round((originalSize - newSize) / 1024) + ' KB)');

fs.writeFileSync(indexHtmlPath, html, 'utf8');
fs.writeFileSync(indexSistema2Path, html, 'utf8');
console.log('Successfully updated index.html and index-sistema2.html');
