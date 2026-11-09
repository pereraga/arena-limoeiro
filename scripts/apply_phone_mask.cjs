const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Atualizar o helper formatPhone para suportar o formato pedido: (81) 9.9999-9999 ou (81) 9.999-9999
const oldFormatPhone = `  // Helper de formatação de telefone
  function formatPhone(phone) {
    if (!phone) return '';
    const clean = String(phone).replace(/\\D/g, '');
    if (clean.length === 11) return '(' + clean.slice(0, 2) + ') ' + clean.slice(2, 7) + '-' + clean.slice(7);
    if (clean.length === 10) return '(' + clean.slice(0, 2) + ') ' + clean.slice(2, 6) + '-' + clean.slice(6);
    return phone;
  }`;

const newFormatPhone = `  // Máscara e formatação inteligente de telefone/WhatsApp: (81) 9.9999-9999
  window.aplicarMascaraTelefone = function(v) {
    let digits = String(v || '').replace(/\\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length === 3) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + '.' + digits.slice(3);
    if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + '.' + digits.slice(3, 6) + '-' + digits.slice(6);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 3) + '.' + digits.slice(3, 7) + '-' + digits.slice(7);
  };

  // Máscara e formatação de CPF: 000.000.000-00
  window.aplicarMascaraCPF = function(v) {
    let digits = String(v || '').replace(/\\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length <= 9) return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6);
    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9);
  };

  // Helper de formatação de telefone para exibição
  function formatPhone(phone) {
    if (!phone) return '';
    return window.aplicarMascaraTelefone(phone);
  }`;

if (html.includes(oldFormatPhone)) {
  html = html.replace(oldFormatPhone, newFormatPhone);
  console.log('1. formatPhone e helpers de máscara adicionados ao admin.html');
} else {
  console.log('1. oldFormatPhone não encontrado diretamente, verificando...');
}

// 2. Adicionar listeners automáticos globais para inputs de telefone e CPF em tempo de digitação
const targetInitScript = `  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminGames);
  } else {
    initAdminGames();
  }`;

const replInitScript = `  // Máscaras automáticas em tempo real para campos de Telefone e CPF
  function initInputMasks() {
    document.addEventListener('input', function(e) {
      const target = e.target;
      if (!target || !target.id) return;
      
      const phoneIds = ['novoClienteTelefone', 'directBookingPhone', 'modalGerenciarTelefone', 'editMatchPhone', 'whatsappTestOtpPhone'];
      if (phoneIds.includes(target.id) || target.type === 'tel' || target.getAttribute('data-mask') === 'phone') {
        const cursor = target.selectionStart;
        const oldVal = target.value;
        const newVal = window.aplicarMascaraTelefone(oldVal);
        if (oldVal !== newVal) {
          target.value = newVal;
        }
      }

      const cpfIds = ['novoClienteCpf', 'modalGerenciarCpf', 'directBookingCpf'];
      if (cpfIds.includes(target.id) || target.getAttribute('data-mask') === 'cpf') {
        const oldVal = target.value;
        const newVal = window.aplicarMascaraCPF(oldVal);
        if (oldVal !== newVal) {
          target.value = newVal;
        }
      }
    }, true);
  }
  initInputMasks();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminGames);
  } else {
    initAdminGames();
  }`;

if (html.includes(targetInitScript)) {
  html = html.replace(targetInitScript, replInitScript);
  console.log('2. initInputMasks listener adicionado com sucesso');
} else {
  console.log('2. targetInitScript não encontrado');
}

// 3. Atualizar placeholder do input novoClienteTelefone e directBookingPhone para "(81) 9.9999-9999"
html = html.replace('id="novoClienteTelefone"\n            required\n            placeholder="(81) 98765-4321"', 'id="novoClienteTelefone"\n            required\n            placeholder="(81) 9.9999-9999"');
html = html.replace('id="novoClienteTelefone" \n            required \n            placeholder="(81) 98765-4321"', 'id="novoClienteTelefone" \n            required \n            placeholder="(81) 9.9999-9999"');
html = html.replace('id="directBookingPhone" required placeholder="(81) 98765-4321"', 'id="directBookingPhone" required placeholder="(81) 9.9999-9999"');
html = html.replace('id="modalGerenciarTelefone" required placeholder="(81) 98765-4321"', 'id="modalGerenciarTelefone" required placeholder="(81) 9.9999-9999"');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('public/admin.html atualizado e salvo.');
