const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
console.log('Project dir:', projectDir);

const files = fs.readdirSync(projectDir);
console.log('Project root files/folders:\n', files);

const scripts = fs.readdirSync(path.join(projectDir, 'scripts'));
const apkScripts = scripts.filter(s => s.toLowerCase().includes('apk') || s.toLowerCase().includes('build'));
console.log('APK related scripts:\n', apkScripts);
