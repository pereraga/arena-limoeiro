const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const start = content.indexOf('function getMatchesForDate');
const end = content.indexOf('function calcDuration');
console.log('Start:', start, 'End:', end);
console.log(content.slice(start, start + 400));
