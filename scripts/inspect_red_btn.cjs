const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'booking-finish-red-btn';
console.log('Occurrences of booking-finish-red-btn:', (content.match(new RegExp(target, 'g')) || []).length);
