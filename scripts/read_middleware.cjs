const fs = require('fs');
const path = require('path');

const mwPath = path.join(__dirname, '../middleware.js');
if (fs.existsSync(mwPath)) {
  const mw = fs.readFileSync(mwPath, 'utf8');
  console.log(mw);
} else {
  console.log('middleware.js does not exist');
}
