// Test script to verify getMatchesForDate calculation with all 5 games
function test5Games() {
  const courts = [
    { id: 'court-society-1', name: 'SOCIETY - ARENA CENTRAL' },
    { id: 'court-futsal-1788963178368', name: 'QUADRA SOCIETY' },
    { id: 'court-society-2', name: 'FUT 6 - SOCCER 6' },
    { id: 'court-beach-1', name: 'FUT 7 - SOCCER 7' }
  ];

  function getCourtById(id) {
    return courts.find(c => c.id === id) || { id: id || 'court-society-1', name: 'Quadra Central' };
  }

  const monthlyMembers = [
    {
      id: 'mensal-1792437535347',
      team_name: 'Esc Ariadnes',
      responsible_name: 'Esc Ariadnes',
      phone: '(81) 99556-2693',
      court_id: 'court-society-1',
      day_of_week: 'terca',
      start_time: '16:00',
      end_time: '18:00',
      monthly_price: 2000,
      status: 'active'
    },
    {
      id: 'mensal-1793115878805',
      team_name: 'Ariadnes',
      responsible_name: 'Ariadnes',
      phone: '(81) 99999-2609',
      court_id: 'court-futsal-1788963178368',
      day_of_week: 'terca',
      start_time: '16:00',
      end_time: '18:00',
      monthly_price: 1600,
      status: 'active'
    },
    {
      id: 'mensal-1792439823965',
      team_name: 'Aline',
      responsible_name: 'Aline',
      phone: '(81) 99246-3081',
      court_id: 'court-futsal-1788963178368',
      day_of_week: 'terca',
      start_time: '18:30',
      end_time: '20:00',
      monthly_price: 1600,
      status: 'active'
    },
    {
      id: 'mensal-1793143167053',
      team_name: 'Genilson',
      responsible_name: 'Genilson',
      phone: '(81) 99966-4317',
      court_id: 'court-society-2',
      day_of_week: 'terca',
      start_time: '20:00',
      end_time: '21:30',
      monthly_price: 2400,
      status: 'active'
    }
  ];

  const bookings = [
    {
      id: 'ARENA-ZELUIZ-1103',
      court_id: 'court-beach-1',
      date: '2026-11-03',
      customer_name: 'Zé Luiz',
      customer_phone: '(81) 98877-6655',
      start_time: '21:00',
      end_time: '22:30',
      total_price: 500,
      status: 'confirmed',
      booking_type: 'avulso'
    }
  ];

  const dateStr = '2026-11-03';
  const matches = [];

  monthlyMembers.forEach(m => {
    const court = getCourtById(m.court_id);
    const startT = m.start_time;
    const endT = m.end_time;
    matches.push({
      id: 'monthly-' + m.id,
      court_id: court.id,
      court_name: court.name,
      date: dateStr,
      customer_name: m.team_name,
      start_time: startT,
      end_time: endT,
      total_price: parseFloat(m.monthly_price) / 4,
      status: 'confirmed'
    });
  });

  bookings.forEach(b => {
    const court = getCourtById(b.court_id);
    matches.push({
      id: b.id,
      court_id: court.id,
      court_name: court.name,
      date: dateStr,
      customer_name: b.customer_name,
      start_time: b.start_time,
      end_time: b.end_time,
      total_price: parseFloat(b.total_price),
      status: b.status
    });
  });

  matches.sort((a, b) => a.start_time.localeCompare(b.start_time));

  console.log(`Total matches on ${dateStr}: ${matches.length}`);
  let totalRevenue = 0;
  matches.forEach((m, i) => {
    totalRevenue += m.total_price;
    console.log(`  Match ${i+1}: [${m.start_time} - ${m.end_time}] ${m.customer_name} | ${m.court_name} | R$ ${m.total_price}`);
  });
  console.log(`Total revenue: R$ ${totalRevenue.toFixed(2)}`);
}

test5Games();
