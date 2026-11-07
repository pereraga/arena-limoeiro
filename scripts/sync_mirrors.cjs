const fs = require("fs");
const path = require("path");

const adminHtml = fs.readFileSync(path.join(__dirname, "../public/admin.html"), "utf8");

const mirrors = [
  "public/adm-sec-x9k7-limoeiro-2026-auth.html",
  "public/adm-sec-x9k7-limoeiro-2026.html",
  "public/index-sistema1.html",
  "public/sistema1.html"
];

mirrors.forEach(m => {
  const fullPath = path.join(__dirname, "..", m);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, adminHtml, "utf8");
    console.log(`Synchronized ${m} (${adminHtml.length} bytes)`);
  } else {
    console.log(`Mirror not found: ${m}`);
  }
});
