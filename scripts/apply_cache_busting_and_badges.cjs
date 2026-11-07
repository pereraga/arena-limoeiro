const fs = require("fs");
const path = require("path");

// 1. Update vercel.json
const vercelPath = path.join(__dirname, "../vercel.json");
const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf8"));

const buildVersion = "20261107_v4_unlimited_" + Date.now();

vercelConfig.rewrites = vercelConfig.rewrites.map(r => {
  if (r.source === "/adm-sec-x9k7-limoeiro-2026-auth") {
    r.destination = `/index-sistema1.html?adm_token=x9k7_limoeiro_sec2026_auth&v=${buildVersion}`;
  } else if (r.source === "/adm-sec-x9k7-limoeiro-2026") {
    r.destination = `/index-sistema1.html?adm_token=x9k7_limoeiro_sec2026_auth&v=${buildVersion}`;
  } else if (r.source === "/admin") {
    r.destination = `/index-sistema1.html?v=${buildVersion}`;
  }
  return r;
});

// Ensure top-level headers have strict no-cache for all HTML
vercelConfig.headers[0].headers = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "Surrogate-Control", value: "no-store" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://unpkg.com https://cdnjs.cloudflare.com; font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.onrender.com wss://*.onrender.com https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://*.vercel.app https://arenalimoeiro.vercel.app https://arenalimoeiro.com.br; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests;" }
];

fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2), "utf8");
console.log("Updated vercel.json with version:", buildVersion);

// 2. Update public/admin.html
const adminPath = path.join(__dirname, "../public/admin.html");
let html = fs.readFileSync(adminPath, "utf8");

// Add meta tags in <head> if not present
if (!html.includes('<meta http-equiv="Cache-Control"')) {
  html = html.replace(
    '<head>',
    `<head>\n  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n  <meta http-equiv="Pragma" content="no-cache">\n  <meta http-equiv="Expires" content="0">`
  );
  console.log("Added cache-control meta tags to <head>");
}

// Add visual badge in modal
if (!html.includes('⚡ Seleção Livre (3h, 5h+)')) {
  html = html.replace(
    '<span class="text-xs font-black text-slate-800 uppercase tracking-tight block">Janelas de Horas (30 em 30 min):</span>',
    '<span class="text-xs font-black text-slate-800 uppercase tracking-tight block flex items-center gap-1.5 flex-wrap"><span>Janelas de Horas (30 em 30 min):</span><span class="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">⚡ Seleção Livre (3h, 5h+)</span></span>'
  );
  console.log("Added visual badge in modal header");
}

// Enhance updateBalcaoSelectionSummary to detail hours & blocks
const summaryOld = `    if (timeEl) timeEl.textContent = sStr + ' às ' + eStr;
    if (durEl) durEl.textContent = durTxt;`;

const summaryNew = `    if (timeEl) timeEl.textContent = sStr + ' às ' + eStr;
    if (durEl) durEl.textContent = durTxt + ' (' + blocksCount + ' blocos)';`;

if (html.includes(summaryOld)) {
  html = html.replace(summaryOld, summaryNew);
  console.log("Updated summary detail text");
}

fs.writeFileSync(adminPath, html, "utf8");
console.log("Updated public/admin.html");

// 3. Sync all mirrors
const mirrors = [
  "public/adm-sec-x9k7-limoeiro-2026-auth.html",
  "public/adm-sec-x9k7-limoeiro-2026.html",
  "public/index-sistema1.html",
  "public/sistema1.html"
];

mirrors.forEach(m => {
  const fullPath = path.join(__dirname, "..", m);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, html, "utf8");
    console.log(`Synchronized ${m}`);
  }
});
