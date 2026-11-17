const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find calcularMetricasBackend implementation in admin.html
const idx = html.indexOf('window.calcularMetricasBackend = function');
console.log(html.substring(idx, idx + 2500));
