const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const start = content.indexOf('window.loadWhatsappQrCodeLive = async function');
const end = content.indexOf('window.initApiPlayground =', start);
console.log(content.substring(start, end));
