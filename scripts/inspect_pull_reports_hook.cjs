const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find pullDataFromCloudDatabases and where renderReports is triggered
const idx = html.indexOf('window.pullDataFromCloudDatabases = async function');
console.log(html.substring(idx + 7500, idx + 9500));
