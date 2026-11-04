const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'conectar-whatsapp.html');
const content = fs.readFileSync(filePath, 'utf8');

const scriptIdx = content.indexOf('<script>');
console.log(content.substring(scriptIdx));
