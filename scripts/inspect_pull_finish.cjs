const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find pullDataFromCloudDatabases and check if it calls atualizarRelatoriosOperacionais
const idx = html.indexOf('window.pullDataFromCloudDatabases = async function');
console.log(html.substring(idx + 7000, idx + 8500));
