const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetStr = `    const st = m.status || 'confirmed';

    // Status classes and labels`;

const replacementStr = `    const st = m.status || 'confirmed';
    const isLive = (st === 'live' || st === 'playing' || st === 'in_progress');

    // Status classes and labels`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('Successfully inserted const isLive in renderMatchCardHtml.');
} else {
  console.error('Target string not found in admin.html');
}
