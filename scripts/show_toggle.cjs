const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "../public/admin.html"), "utf8");
const toggleIdx = html.indexOf("window.toggleBalcaoTimeSlot = function");
console.log(html.slice(toggleIdx, toggleIdx + 3000));
