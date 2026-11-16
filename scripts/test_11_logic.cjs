const fs = require('fs');

const path = 'public/admin.html';
const content = fs.readFileSync(path, 'utf-8');

// Verificando getMatchesForDate e a data de 2026-11-11
const ADMIN_COURTS = [
  { id: 'fut5', name: 'FUT 5 – SOCCER 5' },
  { id: 'fut6', name: 'FUT 6 – SOCCER 6' },
  { id: 'fut7', name: 'FUT 7 – SOCCER 7' },
  { id: 'futmesa', name: 'FOOT TABLE – FUTMESA' },
  { id: 'areia', name: 'AREIA – BEACH SPORTS' },
  { id: 'society', name: 'SOCIETY – ARENA CENTRAL' }
];

function getCourtById(cId) {
  if (!cId) return ADMIN_COURTS[0];
  const clean = String(cId).toLowerCase();
  if (clean === 'court-society-1' || clean === 'fut5' || clean.includes('fut 5') || clean.includes('soccer 5')) return ADMIN_COURTS[0];
  if (clean === 'court-society-2' || clean === 'fut6' || clean.includes('fut 6') || clean.includes('soccer 6')) return ADMIN_COURTS[1];
  if (clean === 'court-beach-1' || clean === 'fut7' || clean.includes('fut 7') || clean.includes('soccer 7')) return ADMIN_COURTS[2];
  if (clean === 'court-esportes-de-quadra-1788962671043' || clean === 'futmesa' || clean.includes('futmesa')) return ADMIN_COURTS[3];
  if (clean === 'court-beach-2' || clean === 'areia' || clean.includes('areia')) return ADMIN_COURTS[4];
  if (clean === 'court-futsal-1788963178368' || clean === 'society' || clean.includes('futsal') || clean.includes('quadra society') || clean.includes('arena central')) return ADMIN_COURTS[5];
  return ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];
}

console.log('Testing 2026-11-11 getMatchesForDate simulation:');
const dateStr = '2026-11-11';
const [y, m, d] = dateStr.split('-');
const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const currentDayOfWeek = dayOfWeekMap[dt.getDay()];
console.log('Day of week:', currentDayOfWeek);

const monthly = [
  { id: '1792434474139', responsible_name: 'Davi', team_name: 'Davi', day_of_week: 'quarta', court_id: 'court-society-2', start_time: '15:00', end_time: '19:00', status: 'active' },
  { id: '1792439863387', responsible_name: 'Aline', team_name: 'Aline', day_of_week: 'quarta', court_id: 'court-futsal-1788963178368', start_time: '18:00', end_time: '20:00', status: 'active' },
  { id: '1791847145447', responsible_name: 'Jajá', team_name: 'Jajá', day_of_week: 'quarta', court_id: 'court-futsal-1788963178368', start_time: '20:00', end_time: '22:00', status: 'active' },
  { id: '1792605719811', responsible_name: 'Monica', team_name: 'Monica', day_of_week: 'quarta', court_id: 'court-futsal-1788963178368', start_time: '15:30', end_time: '16:30', status: 'active' },
  { id: '1792614686540', responsible_name: 'Diego', team_name: 'Diego', day_of_week: 'quarta', court_id: 'court-society-1', start_time: '17:00', end_time: '19:00', status: 'active' }
];

const bookings = [
  { id: 'ARENA-B7871', customer_name: 'Pietro', court_id: 'court-esportes-de-quadra-1788962671043', date: '2026-11-11', start_time: '15:30', end_time: '16:30', status: 'confirmed' },
  { id: 'ARENA-5364', customer_name: 'Monica', court_id: 'court-futsal-1788963178368', date: '2026-11-11', start_time: '15:30', end_time: '16:30', status: 'confirmed' },
  { id: 'ARENA-9520', customer_name: 'Aline', court_id: 'court-futsal-1788963178368', date: '2026-11-11', start_time: '18:00', end_time: '20:00', status: 'confirmed' },
  { id: 'ARENA-9733', customer_name: 'Jajá', court_id: 'court-futsal-1788963178368', date: '2026-11-11', start_time: '20:00', end_time: '22:00', status: 'confirmed' },
  { id: 'ARENA-7466', customer_name: 'Diego', court_id: 'court-society-1', date: '2026-11-11', start_time: '17:00', end_time: '19:00', status: 'confirmed' },
  { id: 'ARENA-1698', customer_name: 'Davi', court_id: 'court-society-2', date: '2026-11-11', start_time: '15:00', end_time: '19:00', status: 'confirmed' },
  { id: 'monthly-mensal-1792437535347', customer_name: 'Esc Ariadnes', court_id: 'fut5', date: '2026-11-11', start_time: '16:00', end_time: '18:00', status: 'finished' },
  { id: 'monthly-mensal-1793115878805', customer_name: 'Ariadnes', court_id: 'society', date: '2026-11-11', start_time: '16:00', end_time: '18:00', status: 'finished' }
];

// Observe as duas últimas reservas em bookings no Supabase:
// id: monthly-mensal-1792437535347 (Esc Ariadnes) com status: "finished"
// id: monthly-mensal-1793115878805 (Ariadnes) com status: "finished"
// Ariadnes na verdade é de terça-feira!
console.log('Bookings in DB:', bookings.length);
