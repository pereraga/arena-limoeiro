const fs = require('fs');

// Test the dynamic calendar strip generator
function testCalendarGenerator(todayStr, selectedDate) {
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const baseDate = new Date(ty, tm - 1, td, 12, 0, 0);

  const dowMap = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const monthMap = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const generatedDates = [];
  const cards = [];

  for (let offset = -3; offset <= 17; offset++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offset);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    generatedDates.push(dateStr);

    const isToday = (dateStr === todayStr);
    const isSelected = (dateStr === selectedDate);
    const dow = dowMap[d.getDay()];
    const monthLabel = monthMap[d.getMonth()];

    let subLabel = dow;
    if (isToday) {
      subLabel = dow + ' • HOJE';
    }

    cards.push({
      dateStr,
      subLabel,
      dayNum: dd,
      monthLabel,
      isToday,
      isSelected
    });
  }

  console.log(`\n======================================================`);
  console.log(`TEST GENERATING CALENDAR for TODAY = ${todayStr}, SELECTED = ${selectedDate}`);
  console.log(`Total days generated: ${cards.length}`);
  cards.slice(0, 10).forEach(c => {
    console.log(`  [${c.dateStr}] ${c.subLabel} | Day: ${c.dayNum} ${c.monthLabel} | Today: ${c.isToday} | Selected: ${c.isSelected}`);
  });
  console.log('======================================================\n');
}

// Test 1: When today is 03/11
testCalendarGenerator('2026-11-03', '2026-11-03');

// Test 2: When day turns to 04/11
testCalendarGenerator('2026-11-04', '2026-11-04');
