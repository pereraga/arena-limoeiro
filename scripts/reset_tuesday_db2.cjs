const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const tuesdayBookings = [
  {
    id: 'ARENA-2913',
    court_id: 'court-society-1',
    customer_id: 'cust-1792437535039',
    date: '2026-11-03',
    start_time: '16:00',
    end_time: '18:00',
    time: '16:00 às 18:00',
    duration: 120,
    customer_name: 'Esc Ariadnes',
    customer_phone: '(81) 99556-2693',
    total_price: 500,
    status: 'confirmed',
    booking_type: 'mensalista',
    payment_method: 'Mensalidade Faturada',
    product_cart: {},
    observation: '[CPF: 000.000.000-00] | [Emergência: 8199556-2693] (Jogo 3/24 - Mensalista)'
  },
  {
    id: 'ARENA-3251',
    court_id: 'court-futsal-1788963178368',
    customer_id: 'cust-1792439823611',
    date: '2026-11-03',
    start_time: '18:30',
    end_time: '20:00',
    time: '18:30 às 20:00',
    duration: 90,
    customer_name: 'Aline',
    customer_phone: '(81) 99246-3081',
    total_price: 150,
    status: 'confirmed',
    booking_type: 'mensalista',
    payment_method: 'pago_balcao',
    product_cart: {},
    observation: '[CPF: 000.000.000-00] | [Emergência: 8199246308] (Jogo 3/24 - Mensalista)'
  },
  {
    id: 'ARENA-GENILSON-1103',
    court_id: 'court-society-2',
    customer_id: 'cust-1793143166708',
    date: '2026-11-03',
    start_time: '20:00',
    end_time: '21:30',
    time: '20:00 às 21:30',
    duration: 90,
    customer_name: 'Genilson',
    customer_phone: '(81) 99966-4317',
    total_price: 140,
    status: 'confirmed',
    booking_type: 'mensalista',
    payment_method: 'pago_balcao',
    product_cart: {},
    observation: '[CPF: 299.340.408-32] | [Emergência: 819996643172] (Jogo 4/24 - Mensalista)'
  },
  {
    id: 'ARENA-ZELUIZ-1103',
    court_id: 'court-beach-1',
    customer_id: 'cust-zeluiz',
    date: '2026-11-03',
    start_time: '21:00',
    end_time: '22:30',
    time: '21:00 às 22:30',
    duration: 90,
    customer_name: 'Zé Luiz',
    customer_phone: '(81) 98877-6655',
    total_price: 160,
    status: 'confirmed',
    booking_type: 'avulso',
    payment_method: 'PIX Balcão',
    product_cart: {},
    observation: 'Reserva Avulsa Noturna'
  }
];

const body = JSON.stringify(tuesdayBookings);

const req = https.request(`${SUPABASE_URL}/rest/v1/bookings`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Upsert status code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => console.error(e));
req.write(body);
req.end();
