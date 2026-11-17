// test_reports_calc.cjs
const bookings = [
  { id: '1', date: '2026-11-17', court_id: 'fut6', customer_name: 'Gabriel', total_price: 100, payment_method: 'Pix', status: 'confirmed', start_time: '19:00', end_time: '20:00' },
  { id: '2', date: '2026-11-17', court_id: 'fut5', customer_name: 'Carlos', total_price: 90, payment_method: 'Cartão de Crédito', status: 'finished', start_time: '18:00', end_time: '19:00' },
  { id: '3', date: '2026-11-16', court_id: 'areia', customer_name: 'Ana', total_price: 60, payment_method: 'Pix', status: 'finished', start_time: '17:00', end_time: '18:00' },
  { id: '4', date: '2026-11-10', court_id: 'fut7', customer_name: 'Marcos', total_price: 110, payment_method: 'Dinheiro', status: 'finished', start_time: '20:00', end_time: '21:00' }
];

const monthly = [
  { id: 'm1', team_name: 'Quarta FC', day_of_week: 'terca', court_id: 'fut6', monthly_price: 400, start_time: '20:00', end_time: '21:00', status: 'active' },
  { id: 'm2', team_name: 'Futsal Sexta', day_of_week: 'sexta', court_id: 'fut5', monthly_price: 360, start_time: '19:00', end_time: '20:00', status: 'active' }
];

console.log('Bookings count:', bookings.length);
console.log('Monthly count:', monthly.length);
