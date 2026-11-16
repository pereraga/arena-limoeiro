const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('dbCourtId =') || l.includes('court-beach-1') || l.includes('court-society-2') || l.includes('court-futsal-1788963178368')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
