const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find CSP meta tag
const cspMatch = html.match(/Content-Security-Policy[^>]*content="([^"]*)"/i);
if (cspMatch) {
  console.log('CSP in meta:', cspMatch[1]);
} else {
  console.log('No CSP meta tag found');
}

// Find CSP in middleware
const mwPath = path.join(__dirname, '../middleware.js');
if (fs.existsSync(mwPath)) {
  const mw = fs.readFileSync(mwPath, 'utf8');
  const m = mw.match(/content-security-policy['"]?,\s*[`'"]([^`'"]*)[`'"]/i);
  if (m) console.log('CSP in middleware:', m[1]);
}
