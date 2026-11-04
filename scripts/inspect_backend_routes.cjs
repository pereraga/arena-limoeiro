const fs = require('fs');

console.log('--- Inspecting backend endpoints in server.js ---');
const serverJs = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/server.js', 'utf8');

const routes = [];
const lines = serverJs.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('app.get') || line.includes('app.post') || line.includes('app.put') || line.includes('app.delete') || line.includes('/api/')) {
    routes.push(`L${idx+1}: ${line.trim()}`);
  }
});

console.log(routes.join('\n'));
