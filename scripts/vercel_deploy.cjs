const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
console.log('Deploying to Vercel production...');
try {
  const out = execSync('npx vercel --prod --yes', { cwd, stdio: 'pipe' });
  console.log(out.toString());
} catch(e) {
  console.error('Vercel deploy output/error:', e.stdout ? e.stdout.toString() : e.message);
}
