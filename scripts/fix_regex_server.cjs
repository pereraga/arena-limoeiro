const fs = require('fs');

let s = fs.readFileSync('server.js', 'utf8');
const isCRLF = s.includes('\r\n');
if (isCRLF) s = s.replace(/\r\n/g, '\n');

const oldFn = s.match(/function checkMaliciousString[\s\S]*?return patterns\.some[\s\S]*?\}/)[0];
const newFn = `function checkMaliciousString(str) {
  if (typeof str !== 'string') return false;
  const patterns = [
    /\\bUNION\\s+SELECT\\b/i,
    /\\bSELECT\\b.*\\bFROM\\b/i,
    /'\\s*OR\\s*['"]?1['"]?\\s*=\\s*['"]?1/i,
    /\\bDROP\\s+TABLE\\b/i,
    /<script\\b[^>]*>/i,
    /javascript:\\s*/i,
    /--\\s*$/m
  ];
  return patterns.some(p => p.test(str));
}`;

s = s.replace(oldFn, newFn);
if (isCRLF) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync('server.js', s, 'utf8');
console.log('Regex fixed!');
