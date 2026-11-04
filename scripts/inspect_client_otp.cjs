const fs = require('fs');
const path = require('path');

const clientFiles = ['index.html', 'index-sistema1.html', 'sistema1.html', 'sistema2.html', 'app.js'];

clientFiles.forEach(f => {
  const p = path.join(__dirname, '..', 'public', f);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    const hasSendCode = content.includes('send-code') || content.includes('verify-code') || content.includes('whatsapp');
    console.log(`${f}: has send-code/whatsapp?`, hasSendCode);
    if (content.includes('send-code')) {
      const idx = content.indexOf('send-code');
      console.log(`  Snippet around send-code in ${f}:`, content.substring(idx - 100, idx + 200).replace(/\n/g, ' '));
    }
  }
});
