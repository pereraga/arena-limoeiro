const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find Chart.js in head or scripts
console.log('chart.js:', html.indexOf('chart.js'));
console.log('Chart.js:', html.indexOf('Chart.js'));
