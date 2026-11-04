const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const start = content.indexOf('id="panel-cadastros"');
const nextSection = content.indexOf('<section id="panel-reports"', start);
console.log('start panel-cadastros:', start, 'next section (reports):', nextSection);
console.log(content.substring(nextSection - 150, nextSection + 50));
