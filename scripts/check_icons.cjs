const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find how lucide icons are rendered in admin.html
console.log('Uses Lucide:', html.includes('lucide.createIcons'));
console.log('Uses FontAwesome:', html.includes('fa-solid') || html.includes('font-awesome'));
