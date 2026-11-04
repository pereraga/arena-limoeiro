const fs = require('fs');
const qr = JSON.parse(fs.readFileSync('scripts/last_valid_qr.json', 'utf8'));
console.log('Base64 length:', qr.base64.length);
console.log('Code length:', qr.code.length);
console.log('Updated at:', qr.updatedAt);
