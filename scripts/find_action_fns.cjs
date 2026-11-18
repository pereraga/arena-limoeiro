const fs = require('fs');
const path = require('path');
const adminPath = path.resolve(__dirname, '../public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Find all functions that save or edit bookings / matches
const regex = /(function\s+[a-zA-Z0-9_]+|window\.[a-zA-Z0-9_]+\s*=\s*(?:async\s+)?function)\s*\([^)]*\)\s*\{/g;
let match;
const saveFns = [];
while ((match = regex.exec(content)) !== null) {
  const name = match[1];
  if (/save|edit|delete|cancel|update|confirm|create|finish|start/i.test(name)) {
    saveFns.push(name);
  }
}
console.log('Save/Edit/Action functions:', saveFns);
