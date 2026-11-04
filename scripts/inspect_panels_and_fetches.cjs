const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

// Find all panels
const panelRegex = /id="(panel-[^"]+)"/g;
let m;
const panels = [];
while ((m = panelRegex.exec(content)) !== null) {
  panels.push(m[1]);
}
console.log('Panels found:', panels);

// Find navigation buttons / tabs
const navRegex = /data-tab="([^"]+)"/g;
const tabs = [];
while ((m = navRegex.exec(content)) !== null) {
  tabs.push(m[1]);
}
console.log('Tabs found:', tabs);

// Let's check for any fetch calls across admin.html
const fetchRegex = /fetch\s*\(([^)]+)\)/g;
const fetches = [];
while ((m = fetchRegex.exec(content)) !== null) {
  fetches.push(m[0].substring(0, 100));
}
console.log(`Total fetch calls: ${fetches.length}`);
fetches.forEach((f, i) => console.log(`${i+1}: ${f}`));
