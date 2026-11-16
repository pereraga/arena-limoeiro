const getCourtById = (cId) => {
  if (!cId) return { id: 'fut5', name: 'FUT 5' };
  const clean = String(cId).toLowerCase();
  if (clean === 'court-society-1' || clean === 'fut5') return { id: 'fut5', name: 'FUT 5' };
  if (clean === 'court-society-2' || clean === 'fut6') return { id: 'fut6', name: 'FUT 6' };
  if (clean === 'court-beach-1' || clean === 'fut7') return { id: 'fut7', name: 'FUT 7' };
  if (clean === 'court-esportes-de-quadra-1788962671043' || clean === 'futmesa') return { id: 'futmesa', name: 'FUTMESA' };
  if (clean === 'court-beach-2' || clean === 'areia') return { id: 'areia', name: 'AREIA' };
  if (clean === 'court-futsal-1788963178368' || clean === 'society') return { id: 'society', name: 'SOCIETY' };
  return { id: cId, name: cId };
};

const dbCourtMapping = {
  'fut5': 'court-society-1',
  'fut6': 'court-society-2',
  'fut7': 'court-beach-1',
  'futmesa': 'court-esportes-de-quadra-1788962671043',
  'areia': 'court-beach-2',
  'society': 'court-futsal-1788963178368'
};

function testCourt(selectedCourtId) {
  const targetCourtObj = getCourtById(selectedCourtId);
  const targetCourtId = targetCourtObj.id;
  const dbCourtId = dbCourtMapping[targetCourtId] || targetCourtId;

  const isMatchingCourt = (cValue) => {
    if (!cValue) return false;
    if (cValue === targetCourtId || cValue === dbCourtId || cValue === selectedCourtId) return true;
    const resolved = getCourtById(cValue);
    if (resolved && (resolved.id === targetCourtId || resolved.id === selectedCourtId)) return true;
    return false;
  };

  console.log('Selected:', selectedCourtId, '-> targetCourtId:', targetCourtId, 'dbCourtId:', dbCourtId);
  console.log('Match court-beach-1:', isMatchingCourt('court-beach-1'));
  console.log('Match fut7:', isMatchingCourt('fut7'));
}

testCourt('fut7');
testCourt('fut5');
testCourt('society');
