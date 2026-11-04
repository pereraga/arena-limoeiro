const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('otpCodeInput') || l.includes('otpBox')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
