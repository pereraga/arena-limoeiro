const fs = require('fs');
const content = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

const regex = /Cancelad[oa][^\n\r<"']*/gi;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log('Found:', JSON.stringify(m[0]), 'at', m.index);
  console.log('Snippet:', JSON.stringify(content.slice(Math.max(0, m.index - 40), m.index + 80)));
}
