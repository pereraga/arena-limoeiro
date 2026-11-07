const https = require("https");

https.get("https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Has Duração Rápida:", data.includes("Duração Rápida"));
    console.log("Has balcaoCalendarStepHelper:", data.includes("balcaoCalendarStepHelper"));
    console.log("Has __balcaoHasUserInteracted:", data.includes("__balcaoHasUserInteracted"));
  });
}).on("error", (err) => {
  console.error("Request error:", err.message);
});
