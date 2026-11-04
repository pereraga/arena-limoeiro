const fs = require('fs');

const ADMIN_COURTS = [
  { id: 'court-esportes-de-quadra-1788962671043', name: 'FUT 5 – SOCCER 5', normal: 100 },
  { id: 'court-society-2', name: 'FUT 6 – SOCCER 6', normal: 100 },
  { id: 'court-futsal-1788963178368', name: 'FUT 7 – SOCCER 7', normal: 100 },
  { id: 'court-futmesa-1', name: 'FOOT TABLE – FUTMESA', normal: 80 },
  { id: 'court-beach-1', name: 'AREIA – BEACH SPORTS', normal: 90 },
  { id: 'court-society-1', name: 'SOCIETY – ARENA CENTRAL', normal: 110 }
];

function getCourtById(cId) {
  if (!cId) return ADMIN_COURTS[0];
  const clean = String(cId).toLowerCase();
  if (clean === 'court-esportes-de-quadra-1788962671043' || clean.includes('fut5')) return ADMIN_COURTS[0];
  if (clean === 'court-society-2' || clean.includes('fut6')) return ADMIN_COURTS[1];
  if (clean === 'court-futsal-1788963178368' || clean.includes('fut7')) return ADMIN_COURTS[2];
  if (clean.includes('futmesa') || clean.includes('foot-table')) return ADMIN_COURTS[3];
  if (clean === 'court-beach-1' || clean === 'court-beach-2' || clean.includes('areia') || clean.includes('beach')) return ADMIN_COURTS[4];
  if (clean === 'court-society-1' || clean.includes('society')) return ADMIN_COURTS[5];
  return ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];
}

const https = require('https');
function fetchDB2(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'aukrcnhuyultkjqsgvea.supabase.co',
      path: endpoint,
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
        'Authorization': 'Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testWed() {
  const cloudBookings = await fetchDB2('/rest/v1/bookings?select=*&order=date.asc');
  const cloudMembers = await fetchDB2('/rest/v1/monthly_members?select=*&order=day_of_week.asc');

  const adminGameState = {
    bookings: cloudBookings,
    monthlyMembers: cloudMembers
  };

  function getMatchesForDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    const dayOfWeekMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayOfWeek = dayOfWeekMap[dt.getDay()];

    let matches = [];

    // 1. Mensalistas fixos do dia da semana
    (adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (mDay === currentDayOfWeek) {
        const startT = m.start_time || m.startTime || m.time || '19:00';
        const endT = m.end_time || m.endTime || (startT.includes(':') ? String(Number(startT.split(':')[0]) + 1).padStart(2, '0') + ':' + startT.split(':')[1] : '20:00');
        const court = getCourtById(m.court_id || m.courtId);
        
        matches.push({
          id: 'monthly-' + m.id,
          court_id: court.id,
          court_name: court.name,
          date: dateStr,
          customer_name: (m.team_name || m.teamName || 'Mensalista') + (m.responsible_name && m.responsible_name !== m.team_name ? ' (' + m.responsible_name + ')' : ''),
          customer_phone: m.phone || '(81) 98765-4321',
          customer_cpf: m.cpf || '',
          start_time: startT,
          end_time: endT,
          time: startT + ' às ' + endT,
          total_price: parseFloat(m.monthly_price || m.monthlyPrice || 0) / 4 || 100,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')'
        });
      }
    });

    (adminGameState.bookings || []).forEach(b => {
      if (!b || b.status === 'cancelled') return;
      if (b.date === dateStr) {
        const court = getCourtById(b.court_id || b.courtId);
        const startT = b.start_time || (b.time ? b.time.split(' ')[0] : '19:00');
        const endT = b.end_time || (b.time ? b.time.split(' às ')[1] : '20:00');

        const existing = matches.find(m => String(m.id) === String(b.id) || (getCourtById(m.court_id).id === court.id && m.start_time === startT));
        if (existing) {
          existing.status = b.status || existing.status;
          if (b.payment_method) existing.payment_method = b.payment_method;
          if (b.total_price) existing.total_price = b.total_price;
          existing.date = dateStr;
        } else {
          matches.push({
            id: b.id,
            court_id: court.id,
            court_name: court.name,
            date: dateStr,
            customer_name: b.customer_name || 'Cliente Arena',
            start_time: startT,
            end_time: endT,
            time: b.time || (startT + ' às ' + endT),
            total_price: parseFloat(b.total_price || 90),
            status: b.status || 'confirmed',
            isMensalista: b.booking_type === 'mensalista',
            booking_type: b.booking_type || 'avulso',
            observation: b.observation || 'Reserva direta'
          });
        }
      }
    });

    matches = matches.filter(m => {
      if (!m || m.date !== dateStr) return false;
      if (m.observation && m.observation.includes('Horário Fixo Semanal (')) {
        const expectedObs = 'Horário Fixo Semanal (' + currentDayOfWeek.toUpperCase() + ')';
        if (m.observation !== expectedObs) return false;
      }
      return true;
    });

    matches.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    return matches;
  }

  const wedMatches = getMatchesForDate('2026-11-04');
  console.log(`\n=== Matches on Wednesday 2026-11-04: ${wedMatches.length} ===`);
  wedMatches.forEach(m => {
    console.log(`[${m.status.toUpperCase()}] ${m.start_time} - ${m.court_name} - ${m.customer_name} (R$ ${m.total_price})`);
  });
}

testWed();
