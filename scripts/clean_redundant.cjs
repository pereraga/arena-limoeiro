const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const oldBlock = `    let curStartMin = hasExistingSelection ? parseTimeToMinutes(startSelect.value) : -1;
    let curEndMin = hasExistingSelection ? parseTimeToMinutes(endSelect.value) : -1;
    const courtSelect = document.getElementById('directBookingCourt');
    const dateInput = document.getElementById('directBookingDate');
    const courtId = courtSelect ? courtSelect.value : 'fut7';
    const dateStr = dateInput ? dateInput.value : (window.adminGameState.selectedDate || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08'));
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges(courtId, dateStr) : [];`;

const newBlock = `    let curStartMin = hasExistingSelection ? parseTimeToMinutes(startSelect.value) : -1;
    let curEndMin = hasExistingSelection ? parseTimeToMinutes(endSelect.value) : -1;
    const occupiedRanges = window.getBalcaoOccupiedRanges ? window.getBalcaoOccupiedRanges(courtId, dateStr) : [];`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(adminPath, content, 'utf8');
    console.log('Successfully cleaned redundant redeclarations!');
} else {
    console.error('Could not find oldBlock to clean!');
    process.exit(1);
}
