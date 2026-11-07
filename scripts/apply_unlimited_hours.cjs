const fs = require("fs");
const path = require("path");

const adminPath = path.join(__dirname, "../public/admin.html");
let html = fs.readFileSync(adminPath, "utf8");

// 1. Update toggleBalcaoTimeSlot to allow unlimited forward extension (3h, 5h, etc.)
const targetOld = `      } else if (clickedMin > curEndMin) {
        // Se for muito distante (> 180 min após o fim), inicia novo intervalo
        if (clickedMin - curEndMin > 180) {
          startSelect.value = slotTime;
          endSelect.value = formatMinutesToTime(clickedMin + 30);
        } else {
          // Estende o Fim diretamente para o slot clicado
          endSelect.value = slotTime;
        }
      }`;

const targetNew = `      } else if (clickedMin > curEndMin) {
        // Estende o Fim diretamente para o slot clicado (3h, 5h ou quantas horas desejar)
        endSelect.value = slotTime;
      }`;

if (html.includes(targetOld)) {
  html = html.replace(targetOld, targetNew);
  console.log("Successfully removed 180min cap! Unlimited hours enabled.");
} else {
  console.log("targetOld not found, checking with regex...");
  html = html.replace(
    /\}\s*else if\s*\(clickedMin > curEndMin\)\s*\{[\s\S]*?endSelect\.value = slotTime;\s*\}\s*\}/,
    `} else if (clickedMin > curEndMin) {\n        // Estende o Fim diretamente para o slot clicado (3h, 5h ou quantas horas desejar)\n        endSelect.value = slotTime;\n      }`
  );
}

// 2. Expand max-h of slots grid from max-h-48 to max-h-64 for better visibility of 3h-5h ranges
html = html.replace(
  'id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-48 overflow-y-auto',
  'id="directBookingSlotsGrid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 max-h-64 overflow-y-auto'
);

fs.writeFileSync(adminPath, html, "utf8");
console.log("Saved public/admin.html");
