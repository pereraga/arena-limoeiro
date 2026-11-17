const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find Chart.js in admin.html
console.log('Includes Chart.js:', html.includes('chart.js') || html.includes('Chart.js'));
