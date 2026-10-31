const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const idx = content.indexOf('async function requestOtpCode()');
console.log(content.slice(idx, idx + 2500));
