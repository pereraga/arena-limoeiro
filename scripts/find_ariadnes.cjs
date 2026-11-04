const fs = require('fs');
const content = fs.readFileSync('public/default-data.js', 'utf8');

const regex = /Ariadnes/gi;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log(`Found Ariadnes at char ${m.index}:`);
  console.log(content.substring(Math.max(0, m.index - 50), Math.min(content.length, m.index + 250)));
  console.log('---');
}
