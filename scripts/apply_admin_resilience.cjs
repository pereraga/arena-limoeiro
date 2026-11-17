const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Inserir script arena-default-members.js antes de adminGameState
if (!html.includes('arena-default-members.js')) {
  html = html.replace('<script src="/supabase-client.js"></script>', '<script src="/supabase-client.js"></script>\n    <script src="/arena-default-members.js"></script>');
}

// 2. Aumentar timeout do fetchFast de 4500ms para 9000ms
html = html.replace('const timer = setTimeout(() => ctrl.abort(), 4500);', 'const timer = setTimeout(() => ctrl.abort(), 9000);');

// 3. Proteger cloudMembers para não sobrescrever com lista vazia ou menor que os 38 se o retorno do DB1 for incompleto
const oldMemberCheck = 'if (Array.isArray(cloudMembers)) {';
const newMemberCheck = 'if (Array.isArray(cloudMembers) && (cloudMembers.length >= 10 || !window.adminGameState.monthlyMembers || window.adminGameState.monthlyMembers.length === 0)) {';

if (html.includes(oldMemberCheck)) {
  html = html.replace(oldMemberCheck, newMemberCheck);
}

// 4. Salvar cache em localStorage de monthlyMembers quando vierem com sucesso da nuvem
const oldMemSigAssign = 'window.adminGameState.monthlyMembers = cloudMembers;';
const newMemSigAssign = 'window.adminGameState.monthlyMembers = cloudMembers;\n          try { localStorage.setItem("arena_cached_monthly_v2", JSON.stringify(cloudMembers)); } catch(e) {}';

if (html.includes(oldMemSigAssign)) {
  html = html.replace(oldMemSigAssign, newMemSigAssign);
}

// 5. No getLoadedMonthly, carregar do localStorage ou window.ARENA_DEFAULT_DATA
const oldGetLoadedMonthly = `  function getLoadedMonthly() {
    if (window.ARENA_DEFAULT_DATA && Array.isArray(window.ARENA_DEFAULT_DATA.initialMonthlyMembers)) {
      return [...window.ARENA_DEFAULT_DATA.initialMonthlyMembers];
    }
    return [];
  }`;

const newGetLoadedMonthly = `  function getLoadedMonthly() {
    try {
      const cached = localStorage.getItem('arena_cached_monthly_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 20) return parsed;
      }
    } catch(e) {}
    if (window.ARENA_DEFAULT_DATA && Array.isArray(window.ARENA_DEFAULT_DATA.initialMonthlyMembers)) {
      return [...window.ARENA_DEFAULT_DATA.initialMonthlyMembers];
    }
    return [];
  }`;

if (html.includes(oldGetLoadedMonthly)) {
  html = html.replace(oldGetLoadedMonthly, newGetLoadedMonthly);
}

fs.writeFileSync(adminPath, html, 'utf8');
console.log('Successfully updated public/admin.html');
