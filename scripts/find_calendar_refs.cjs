const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const regex = /calendar|calendário|datePicker|datepicker|monthPicker|movementDaysStrip|movementDatePicker/gi;
let m;
const matches = [];
while ((m = regex.exec(content)) !== null) {
  const lineNum = content.substring(0, m.index).split('\n').length;
  matches.push(`Line ${lineNum}: ` + content.substring(m.index - 20, m.index + 80).replace(/\n/g, ' '));
}
console.log('Matches found:', matches.length);
matches.slice(0, 30).forEach(m => console.log(m));
