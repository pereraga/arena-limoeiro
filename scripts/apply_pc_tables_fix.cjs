const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Target the table in renderCadastrosClientes
const oldTableStart = `    let html = \`
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-100">
            <th class="py-3.5 px-4">Nome do Cliente</th>
            <th class="py-3.5 px-4">Telefone / WhatsApp</th>
            <th class="py-3.5 px-4">CPF</th>
            <th class="py-3.5 px-4">Categoria</th>
            <th class="py-3.5 px-4">Status / Mensalidade</th>
            <th class="py-3.5 px-4">Partidas</th>
            <th class="py-3.5 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">\`;`;

const newTableStart = `    let html = \`
      <table class="w-full text-left text-xs border-collapse min-w-[900px] table-auto">
        <thead>
          <tr class="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200 tracking-wider">
            <th class="py-3.5 px-4 whitespace-nowrap min-w-[200px]">Nome do Cliente</th>
            <th class="py-3.5 px-4 whitespace-nowrap min-w-[210px]">Telefone / WhatsApp</th>
            <th class="py-3.5 px-4 whitespace-nowrap min-w-[130px]">CPF</th>
            <th class="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Categoria</th>
            <th class="py-3.5 px-4 whitespace-nowrap min-w-[200px]">Status / Mensalidade</th>
            <th class="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Partidas</th>
            <th class="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">\`;`;

if (!content.includes(oldTableStart)) {
  console.error('oldTableStart not found!');
  process.exit(1);
}
content = content.replace(oldTableStart, newTableStart);

// Now target td in renderCadastrosClientes
const oldTdBlock = `      html += \`
        <tr class="hover:bg-slate-50/80 transition group">
          <td class="py-3.5 px-4 font-bold text-slate-900">
            <div>\${c.name}</div>
            \${isMensalista && c.horarioFixo ? \`<div class="text-[10px] text-slate-400 font-normal mt-0.5">\${c.horarioFixo}</div>\` : ''}
          </td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2 text-slate-600">
              <span class="font-mono">\${c.phone ? formatPhone(c.phone) : 'Sem telefone'}</span>
              \${phoneClean ? (\`
                <a href="\${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a859] hover:text-[#008f4c] hover:underline">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                  <span>WhatsApp</span>
                </a>
              \`) : ''}
            </div>
          </td>
          <td class="py-3.5 px-4 text-slate-400 font-mono">\${c.cpf ? formatCPF(c.cpf) : 'Não informado'}</td>
          <td class="py-3.5 px-4">
            \${badgeCategoria}
          </td>
          <td class="py-3.5 px-4">
            \${colunaStatus}
          </td>
          <td class="py-3.5 px-4 font-bold text-slate-900">
            <div>\${c.matches} \${c.matches === 1 ? 'partida' : 'partidas'}</div>
            \${isMensalista ? \`<div class="text-[10px] text-purple-700 font-semibold mt-0.5">\${c.partidasContratadas || 4} no mês</div>\` : ''}
          </td>
          <td class="py-3.5 px-4 text-right">
            <button type="button" onclick="window.abrirModalGerenciarCliente('\${safeName}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#042f1e] text-slate-700 hover:text-white border border-slate-200/80 hover:border-[#042f1e] transition cursor-pointer">
              <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
              <span>Gerenciar</span>
            </button>
          </td>
        </tr>\`;`;

const newTdBlock = `      html += \`
        <tr class="hover:bg-slate-50/80 transition group">
          <td class="py-3.5 px-4 font-bold text-slate-900 align-middle">
            <div class="text-sm font-bold text-slate-900">\${c.name}</div>
            \${isMensalista && c.horarioFixo ? \`<div class="text-[11px] text-slate-400 font-normal whitespace-nowrap mt-0.5">\${c.horarioFixo}</div>\` : ''}
          </td>
          <td class="py-3.5 px-4 align-middle whitespace-nowrap">
            <div class="inline-flex items-center gap-2.5 text-slate-600">
              <span class="font-mono text-xs font-semibold">\${c.phone ? formatPhone(c.phone) : 'Sem telefone'}</span>
              \${phoneClean ? (\`
                <a href="\${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a859] hover:text-[#008f4c] hover:underline bg-emerald-50/80 hover:bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60 transition">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5 text-[#00a859]"></i>
                  <span>WhatsApp</span>
                </a>
              \`) : ''}
            </div>
          </td>
          <td class="py-3.5 px-4 text-slate-400 font-mono text-xs align-middle whitespace-nowrap">\${c.cpf ? formatCPF(c.cpf) : 'Não informado'}</td>
          <td class="py-3.5 px-4 align-middle whitespace-nowrap">
            \${badgeCategoria}
          </td>
          <td class="py-3.5 px-4 align-middle whitespace-nowrap">
            \${colunaStatus}
          </td>
          <td class="py-3.5 px-4 font-bold text-slate-900 align-middle whitespace-nowrap">
            <div>\${c.matches} \${c.matches === 1 ? 'partida' : 'partidas'}</div>
            \${isMensalista ? \`<div class="text-[10px] text-purple-700 font-semibold mt-0.5">\${c.partidasContratadas || 4} no mês</div>\` : ''}
          </td>
          <td class="py-3.5 px-4 text-right align-middle whitespace-nowrap">
            <button type="button" onclick="window.abrirModalGerenciarCliente('\${safeName}')" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-900 shadow-2xs transition cursor-pointer whitespace-nowrap">
              <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
              <span>Gerenciar</span>
            </button>
          </td>
        </tr>\`;`;

if (!content.includes(oldTdBlock)) {
  console.error('oldTdBlock not found!');
  process.exit(1);
}
content = content.replace(oldTdBlock, newTdBlock);

// Also improve mensalistas table for PC view
const oldMensalistasTable = `    let html = \`
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
            <th class="p-3">Equipe / Responsável</th>
            <th class="p-3">Telefone</th>
            <th class="p-3">Quadra</th>
            <th class="p-3">Dia & Horário Fixo</th>
            <th class="p-3">Mensalidade</th>
            <th class="p-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">\`;`;

const newMensalistasTable = `    let html = \`
      <table class="w-full text-left text-xs border-collapse min-w-[850px] table-auto">
        <thead>
          <tr class="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200 tracking-wider">
            <th class="py-3 px-4 whitespace-nowrap min-w-[200px]">Equipe / Responsável</th>
            <th class="py-3 px-4 whitespace-nowrap min-w-[160px]">Telefone</th>
            <th class="py-3 px-4 whitespace-nowrap min-w-[140px]">Quadra</th>
            <th class="py-3 px-4 whitespace-nowrap min-w-[180px]">Dia & Horário Fixo</th>
            <th class="py-3 px-4 whitespace-nowrap min-w-[120px]">Mensalidade</th>
            <th class="py-3 px-4 whitespace-nowrap min-w-[100px]">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">\`;`;

if (content.includes(oldMensalistasTable)) {
  content = content.replace(oldMensalistasTable, newMensalistasTable);
  console.log('Mensalistas table header updated for PC.');
}

// Adjust container of clientesTableContainer to look clean on PC
const oldContainerHtml = `<div id="clientesTableContainer" class="overflow-x-auto rounded-xl border border-slate-100">`;
const newContainerHtml = `<div id="clientesTableContainer" class="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs bg-white">`;

if (content.includes(oldContainerHtml)) {
  content = content.replace(oldContainerHtml, newContainerHtml);
  console.log('clientesTableContainer wrapper updated.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully adjusted tables for PC desktop display!');
