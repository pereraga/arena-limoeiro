const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
console.log('package.json scripts:', pkg.scripts);

if (fs.existsSync(path.join(root, 'vercel.json'))) {
  console.log('vercel.json:', fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
}

if (fs.existsSync(path.join(root, 'supabase'))) {
  console.log('supabase dir:', fs.readdirSync(path.join(root, 'supabase')));
}

if (fs.existsSync(path.join(root, 'api'))) {
  console.log('api dir:', fs.readdirSync(path.join(root, 'api')));
}
