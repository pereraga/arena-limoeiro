const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const regex = /function\s+([a-zA-Z0-9_]+)\s*\(|window\.([a-zA-Z0-9_]+)\s*=\s*function/g;
const syncLines = [];
content.split('\n').forEach((line, idx) => {
  if (line.includes('window.__arenaDualSyncHidden') || line.includes('syncBookingToCloud') || line.includes('syncMonthlyMemberToCloud')) {
    syncLines.push({ line: idx + 1, text: line.trim() });
  }
});

console.log('Total sync call lines in admin.html:', syncLines.length);
syncLines.forEach(s => console.log(`${s.line}: ${s.text}`));
