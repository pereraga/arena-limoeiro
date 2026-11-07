const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "../public/admin.html"), "utf8");

console.log("Check Duração Rápida:", html.includes("Duração Rápida") || html.includes("DURAÇÃO RÁPIDA"));
console.log("Check balcaoCalendarStepHelper:", html.includes("balcaoCalendarStepHelper"));
console.log("Check balcaoNextGameAlert style:", html.match(/id="balcaoNextGameAlert"[^>]*>/)?.[0]);
console.log("Check toggleBalcaoTimeSlot exists:", html.includes("window.toggleBalcaoTimeSlot = function"));
console.log("Check directBookingSlotsGrid exists:", html.includes('id="directBookingSlotsGrid"'));
