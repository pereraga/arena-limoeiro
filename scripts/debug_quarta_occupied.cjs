const https = require('https');
const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const fetchData = (endpoint) => new Promise((resolve) => {
  https.get(db2Url + endpoint, { headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch(e) { resolve([]); }
    });
  }).on('error', () => resolve([]));
});

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
  if (clean === 'court-society-1' || clean === 'fut5' || clean.includes('fut 5') || clean.includes('fut5') || clean.includes('soccer 5') || clean.includes('soccer-5')) return ADMIN_COURTS[0];
  if (clean === 'court-society-2' || clean === 'fut6' || clean.includes('fut 6') || clean.includes('fut6') || clean.includes('soccer 6') || clean.includes('soccer-6')) return ADMIN_COURTS[1];
  if (clean === 'court-beach-1' || clean === 'fut7' || clean.includes('fut 7') || clean.includes('fut7') || clean.includes('soccer 7') || clean.includes('soccer-7')) return ADMIN_COURTS[2];
  if (clean === 'court-esportes-de-quadra-1788962671043' || clean === 'futmesa' || clean.includes('futmesa') || clean.includes('foot-table') || clean.includes('foottable') || clean.includes('esportes-de-quadra')) return ADMIN_COURTS[3];
  if (clean === 'court-beach-2' || clean === 'areia' || clean.includes('areia') || clean.includes('sand court') || clean.includes('beach-2')) return ADMIN_COURTS[4];
  if (clean === 'court-futsal-1788963178368' || clean === 'society' || clean.includes('futsal') || clean.includes('quadra society') || clean.includes('arena central')) return ADMIN_COURTS[5];
  return ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];
}

const parseTimeToMinutes = (t) => {
  if (!t || !t.includes(':')) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const formatMinutesToTime = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
};

async function test() {
  const members = await fetchData('/rest/v1/monthly_members?select=*');
  const bookings = await fetchData('/rest/v1/bookings?select=*&date=eq.2026-11-11');

  function getBalcaoOccupiedRanges(courtId, dateStr) {
    const targetCourtObj = getCourtById(courtId);
    const targetCourtId = targetCourtObj.id;
    const dbCourtMapping = {
      'fut5': 'court-society-1',
      'fut6': 'court-society-2',
      'fut7': 'court-beach-1',
      'futmesa': 'court-esportes-de-quadra-1788962671043',
      'areia': 'court-beach-2',
      'society': 'court-futsal-1788963178368'
    };
    const dbCourtId = dbCourtMapping[targetCourtId] || targetCourtId;

    const isMatchingCourt = (cValue) => {
      if (!cValue) return false;
      if (cValue === targetCourtId || cValue === dbCourtId || cValue === courtId) return true;
      const resolved = getCourtById(cValue);
      if (resolved && (resolved.id === targetCourtId || resolved.id === courtId)) return true;
      return false;
    };

    const dateObj = new Date(dateStr + 'T12:00:00');
    const daysMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = daysMap[dateObj.getDay()];

    const occupiedRanges = [];

    bookings.forEach(b => {
      if (!b) return;
      const bDate = b.date;
      const bCourt = b.court_id || b.courtId;
      const st = (b.status || '').toLowerCase();
      if (bDate === dateStr && st !== 'cancelled' && isMatchingCourt(bCourt)) {
        const sm = parseTimeToMinutes(b.start_time || (b.time ? b.time.split(' ')[0] : ''));
        const em = parseTimeToMinutes(b.end_time || (b.time && b.time.includes('às') ? b.time.split('às')[1].trim() : ''));
        if (em > sm) {
          occupiedRanges.push({
            start: sm,
            end: em,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(em),
            name: b.customer_name || 'Cliente',
            type: b.booking_type === 'mensalista' ? 'Mensalista' : 'Reserva'
          });
        }
      }
    });

    members.forEach(m => {
      if (!m) return;
      const rawDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase();
      const mDay = rawDay.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const mCourt = m.court_id || m.courtId;
      const mStatus = (m.status || '').toLowerCase();
      if (mDay === dayOfWeek && mStatus !== 'inactive' && isMatchingCourt(mCourt)) {
        const sm = parseTimeToMinutes(m.start_time || m.time || '');
        const em = parseTimeToMinutes(m.end_time || '');
        const effectiveEnd = em > sm ? em : (sm + 60);
        const exists = occupiedRanges.some(r => Math.max(r.start, sm) < Math.min(r.end, effectiveEnd));
        if (!exists) {
          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: (m.team_name || m.responsible_name) + ' (' + m.responsible_name + ')',
            type: 'Mensalista Fixo'
          });
        }
      }
    });

    return occupiedRanges;
  }

  ADMIN_COURTS.forEach(c => {
    const occ = getBalcaoOccupiedRanges(c.id, '2026-11-11');
    console.log(`=== Quadra: ${c.name} (${c.id}) ===`);
    console.log(`Total Ocupados: ${occ.length}`);
    occ.forEach(o => {
      console.log(`  - ${o.startStr} às ${o.endStr}: ${o.name} [${o.type}]`);
    });
  });
}

test();
