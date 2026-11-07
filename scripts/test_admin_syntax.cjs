const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

// Check script tags syntax
const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const code = match[1];
  try {
    new Function(code);
  } catch (err) {
    console.error(`Syntax error in script tag #${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`All ${count} inline script tags parsed without syntax errors!`);
