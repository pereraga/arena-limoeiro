const fs = require('fs');
const path = require('path');

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminHtmlPath, 'utf8');

console.log('Hiding the dropdown selects (Horário de Início e Horário de Término)...');

const startMarker = '<!-- SELEÇÃO VISÍVEL E CONFIRMAÇÃO DE HORÁRIO DE INÍCIO E FIM -->';
const endMarker = '<!-- VALOR TOTAL E FORMA DE PAGAMENTO -->';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const hiddenInputsCode = `<!-- INPUTS DE INÍCIO E FIM (INTERNOS - CONTROLADOS PELO CALENDÁRIO) -->
      <div style="display:none;" aria-hidden="true">
        <select id="directBookingStart" onchange="onDirectBookingDropdownChange()" required>
          <option value="06:00">06:00</option>
          <option value="06:30">06:30</option>
          <option value="07:00">07:00</option>
          <option value="07:30">07:30</option>
          <option value="08:00">08:00</option>
          <option value="08:30">08:30</option>
          <option value="09:00">09:00</option>
          <option value="09:30">09:30</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
          <option value="11:00">11:00</option>
          <option value="11:30">11:30</option>
          <option value="12:00">12:00</option>
          <option value="12:30">12:30</option>
          <option value="13:00">13:00</option>
          <option value="13:30">13:30</option>
          <option value="14:00">14:00</option>
          <option value="14:30">14:30</option>
          <option value="15:00">15:00</option>
          <option value="15:30">15:30</option>
          <option value="16:00">16:00</option>
          <option value="16:30">16:30</option>
          <option value="17:00">17:00</option>
          <option value="17:30">17:30</option>
          <option value="18:00">18:00</option>
          <option value="18:30">18:30</option>
          <option value="19:00" selected>19:00</option>
          <option value="19:30">19:30</option>
          <option value="20:00">20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
          <option value="22:00">22:00</option>
          <option value="22:30">22:30</option>
          <option value="23:00">23:00</option>
          <option value="23:30">23:30</option>
        </select>

        <select id="directBookingEnd" onchange="onDirectBookingDropdownChange()" required>
          <option value="06:30">06:30</option>
          <option value="07:00">07:00</option>
          <option value="07:30">07:30</option>
          <option value="08:00">08:00</option>
          <option value="08:30">08:30</option>
          <option value="09:00">09:00</option>
          <option value="09:30">09:30</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
          <option value="11:00">11:00</option>
          <option value="11:30">11:30</option>
          <option value="12:00">12:00</option>
          <option value="12:30">12:30</option>
          <option value="13:00">13:00</option>
          <option value="13:30">13:30</option>
          <option value="14:00">14:00</option>
          <option value="14:30">14:30</option>
          <option value="15:00">15:00</option>
          <option value="15:30">15:30</option>
          <option value="16:00">16:00</option>
          <option value="16:30">16:30</option>
          <option value="17:00">17:00</option>
          <option value="17:30">17:30</option>
          <option value="18:00">18:00</option>
          <option value="18:30">18:30</option>
          <option value="19:00">19:00</option>
          <option value="19:30">19:30</option>
          <option value="20:00" selected>20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
          <option value="22:00">22:00</option>
          <option value="22:30">22:30</option>
          <option value="23:00">23:00</option>
          <option value="23:30">23:30</option>
          <option value="23:59">23:59</option>
        </select>
      </div>\n\n      `;

html = html.substring(0, startIdx) + hiddenInputsCode + html.substring(endIdx);
console.log('Successfully replaced visible selects with hidden selects');

fs.writeFileSync(adminHtmlPath, html, 'utf8');
console.log('Successfully written public/admin.html');

// Sync to mirrors
const mirrors = [
  'adm-sec-x9k7-limoeiro-2026-auth.html',
  'adm-sec-x9k7-limoeiro-2026.html',
  'index-sistema1.html',
  'sistema1.html'
];

mirrors.forEach(m => {
  const dest = path.join(__dirname, '..', 'public', m);
  fs.writeFileSync(dest, html, 'utf8');
  console.log('Synced to public/' + m);
});
