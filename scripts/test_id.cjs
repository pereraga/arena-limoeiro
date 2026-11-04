const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
console.log('Contains mensal-1792434434802:', content.includes('mensal-1792434434802'));
