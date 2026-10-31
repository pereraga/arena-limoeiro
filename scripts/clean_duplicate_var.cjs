const fs = require('fs');

const filePath = 'public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the lower let _eventsInitialized = false; with a comment
content = content.replace('let _eventsInitialized = false;\n  function initEvents()', 'function initEvents()');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed duplicate declaration');
