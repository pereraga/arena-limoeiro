const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('window.calcularMetricasBackend = function() {');
console.log(html.substring(idx + 1800, idx + 4000));
