const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'conectar-whatsapp.html');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('conectar-whatsapp.html length:', content.length);
  console.log(content.substring(0, 1500));
} else {
  console.log('File does not exist');
}
