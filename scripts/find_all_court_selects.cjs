const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all selects and their IDs
const selectRegex = /<select[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
let match;
while ((match = selectRegex.exec(html)) !== null) {
  const id = match[1];
  const body = match[2];
  if (body.includes('society') || body.includes('CENTRAL') || body.includes('SOCIETY')) {
    console.log('--- SELECT ID:', id, '---');
    const optionRegex = /<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;
    let optMatch;
    while ((optMatch = optionRegex.exec(body)) !== null) {
      console.log(`  value="${optMatch[1]}" label="${optMatch[2].trim()}"`);
    }
  }
}
