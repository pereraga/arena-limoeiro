const fs = require('fs');

const path = 'public/default-data.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Ariadnes to initialMonthlyMembers if not present
if (!content.includes('mensal-1793115878805')) {
  const insertPos = content.indexOf('initialMonthlyMembers = [');
  if (insertPos !== -1) {
    const bracketEnd = insertPos + 'initialMonthlyMembers = ['.length;
    const newMember = `
  {
    "id": "mensal-1793115878805",
    "team_name": "Ariadnes",
    "responsible_name": "Ariadnes",
    "phone": "81999992609",
    "customer_id": "cust-1793115878784",
    "court_id": "court-futsal-1788963178368",
    "day_of_week": "terca",
    "day_of_week_label": "Toda terca-feira",
    "time": "16:00",
    "start_time": "16:00",
    "end_time": "18:00",
    "monthly_price": 1600,
    "status": "active",
    "start_month": null,
    "observation": "[CPF: 000.000.000-00] | [Emergência: 81999992609] (Contratado para 6 mês/meses)",
    "created_at": "2026-10-27T19:37:15.853+00:00"
  },`;
    content = content.substring(0, bracketEnd) + newMember + content.substring(bracketEnd);
    console.log('Added mensal-1793115878805 to initialMonthlyMembers');
  }
}

// 2. Add ARENA-3294 to initialBookings if not present
if (!content.includes('ARENA-3294')) {
  const insertPosB = content.indexOf('initialBookings = [');
  if (insertPosB !== -1) {
    const bracketEndB = insertPosB + 'initialBookings = ['.length;
    const newBooking = `
  {
    "id": "ARENA-3294",
    "court_id": "court-futsal-1788963178368",
    "customer_id": "cust-1793115878784",
    "date": "2026-11-03",
    "start_time": "16:00",
    "end_time": "18:00",
    "time": "16:00 às 18:00",
    "duration": 120,
    "customer_name": "Ariadnes",
    "customer_phone": "81999992609",
    "total_price": 400,
    "status": "confirmed",
    "booking_type": "mensalista",
    "payment_method": "pago_balcao",
    "product_cart": {},
    "observation": "[CPF: 000.000.000-00] | [Emergência: 81999992609] (Jogo 3/24 - Mensalista)",
    "created_at": "2026-10-27T19:37:16.116+00:00"
  },`;
    content = content.substring(0, bracketEndB) + newBooking + content.substring(bracketEndB);
    console.log('Added ARENA-3294 to initialBookings');
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Updated public/default-data.js successfully');
