const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const vercelJsonPath = path.join(rootDir, 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  console.log('vercel.json contents:');
  console.log(fs.readFileSync(vercelJsonPath, 'utf8'));
} else {
  console.log('No vercel.json');
}

console.log('\nRoot directory files:');
console.log(fs.readdirSync(rootDir).filter(f => f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.json')));

console.log('\nPublic directory files:');
console.log(fs.readdirSync(path.join(rootDir, 'public')).filter(f => f.endsWith('.html')));
