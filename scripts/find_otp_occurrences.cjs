const fs = require('fs');
const path = require('path');

function searchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('send-code') || 
        line.toLowerCase().includes('verify-code') || 
        line.includes('100000') || 
        line.includes('900000') ||
        line.includes('123456') ||
        line.toLowerCase().includes('código de confirmação') ||
        line.toLowerCase().includes('codigo de confirmacao') ||
        line.includes('otp') || line.includes('OTP')) {
      console.log(`${filePath}:${idx + 1}: ${line.trim()}`);
    }
  });
}

searchFile('server.js');
searchFile('public/index.html');
searchFile('public/admin.html');
if (fs.existsSync('api')) {
  fs.readdirSync('api').forEach(f => searchFile(path.join('api', f)));
}
