const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

// Let's search for functions handling cadastros
const keywords = [
  'openModalNovoMensalista', 'salvarMensalista', 'saveMensalista', 'novoMensalista',
  'salvarCliente', 'saveCustomer', 'novoCliente',
  'salvarAgendamento', 'openModalNovoAgendamento', 'handleSaveDirectBooking'
];

keywords.forEach(kw => {
  const idx = content.indexOf(kw);
  console.log(`Keyword '${kw}': index ${idx}`);
  if (idx !== -1) {
    console.log(content.substring(idx - 20, idx + 250));
    console.log('---');
  }
});
