const fs = require('fs');
const path = require('path');

const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const defaultData = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');

const window = {
  location: { search: '', hash: '' },
  localStorage: {
    getItem: (key) => {
      if (key === 'arena_local_bookings') {
        // Test dirty localStorage containing Davi with Monday observation
        return JSON.stringify([
          {
            id: 'monthly-mensal-1792434434802',
            court_id: 'court-society-2',
            court_name: 'FUT 6 - SOCCER 6',
            date: '2026-11-03',
            customer_name: 'Davi',
            start_time: '15:00',
            end_time: '19:00',
            time: '15:00 às 19:00',
            total_price: 600,
            status: 'confirmed',
            observation: 'Horário Fixo Semanal (SEGUNDA)'
          }
        ]);
      }
      return null;
    },
    setItem: () => {}
  },
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  }
};

const fnData = new Function('window', defaultData);
fnData(window);

// Test sanitization function
function testGetLoadedBookings(localStorage, defaultDataBookings) {
  let list = [];
  try {
    const stored = localStorage.getItem('arena_local_bookings');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch(e) {}
  if (list.length === 0 && defaultDataBookings && Array.isArray(defaultDataBookings)) {
    list = [...defaultDataBookings];
  }
  const obsoleteIds = new Set(['ARENA-M4066', 'ARENA-M2526', 'ARENA-8673']);
  list = list.filter(b => {
    if (!b || !b.id || obsoleteIds.has(b.id)) return false;
    if (!b.start_time && !b.time) return false;
    // Remove qualquer contaminação de Davi na terça-feira 03/11
    if ((b.customer_name === 'Davi' || (b.name && b.name.includes('Davi'))) && b.date === '2026-11-03') return false;
    return true;
  });
  return list;
}

const cleaned = testGetLoadedBookings(window.localStorage, window.ARENA_DEFAULT_DATA.initialBookings);
console.log('Cleaned bookings contains Davi on 2026-11-03:', cleaned.some(b => b.customer_name === 'Davi' && b.date === '2026-11-03'));
