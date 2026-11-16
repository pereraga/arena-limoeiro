const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. In editCourtItem: set c.__lastEditTs = Date.now();
const oldEditAssign = `Object.assign(c, {
      name: f.get('name').toUpperCase(),
      type: f.get('type'),
      capacity: f.get('capacity'),
      floor: f.get('floor'),
      price: +f.get('price'),
      promo: +f.get('promo'),
      promoStart: f.get('promoStart'),
      promoEnd: f.get('promoEnd'),
      hours: f.get('open') + ' às ' + f.get('close'),
      status: f.get('status')
    });`;

const newEditAssign = `Object.assign(c, {
      name: f.get('name').toUpperCase(),
      type: f.get('type'),
      capacity: f.get('capacity'),
      floor: f.get('floor'),
      price: +f.get('price'),
      promo: +f.get('promo'),
      promoStart: f.get('promoStart'),
      promoEnd: f.get('promoEnd'),
      hours: f.get('open') + ' às ' + f.get('close'),
      status: f.get('status'),
      __lastEditTs: Date.now()
    });`;

if (content.includes(oldEditAssign)) {
  content = content.replace(oldEditAssign, newEditAssign);
  console.log('[1] editCourtItem updated with __lastEditTs!');
} else {
  console.error('[1] oldEditAssign not found!');
}

// 2. In pullCourtsFromCloud: do not overwrite existing.name if recently edited
const oldPullExisting = `if (existing) {
            existing.name = cc.name || existing.name;
            existing.price = priceNum;`;

const newPullExisting = `if (existing) {
            const isRecentlyEdited = existing.__lastEditTs && (Date.now() - existing.__lastEditTs < 20000);
            if (!isRecentlyEdited) {
              existing.name = cc.name || existing.name;
            }
            existing.price = priceNum;`;

if (content.includes(oldPullExisting)) {
  content = content.replace(oldPullExisting, newPullExisting);
  console.log('[2] pullCourtsFromCloud updated with protection for recently edited courts!');
} else {
  console.error('[2] oldPullExisting not found!');
}

// 3. In persistCourtState: send update_court to /api/sync alongside DB1 and DB2
const oldPatchEnd = `await Promise.all([p1, p2]);
        console.log('[ArenaCloud] Quadra ' + dbId + ' atualizada na nuvem com sucesso!');
      } catch(e) {
        console.warn('[ArenaCloud] Erro no patch de quadra:', e);
      }`;

const newPatchEnd = `await Promise.all([p1, p2]);

        // Envia também para a API Serverless /api/sync com Service Role e Gist redundante
        try {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_court',
              payload: {
                id: c.id,
                dbId: dbId,
                name: c.name,
                price: parseFloat(c.price || 100),
                base_price_per_hour: parseFloat(c.price || 100),
                status: c.status || 'operacional',
                observation: c.status || 'operacional',
                specs: payload.specs
              }
            })
          }).catch(() => {});
        } catch(e) {}

        console.log('[ArenaCloud] Quadra ' + dbId + ' atualizada na nuvem com sucesso!');
      } catch(e) {
        console.warn('[ArenaCloud] Erro no patch de quadra:', e);
      }`;

if (content.includes(oldPatchEnd)) {
  content = content.replace(oldPatchEnd, newPatchEnd);
  console.log('[3] persistCourtState updated to dispatch update_court to /api/sync!');
} else {
  console.error('[3] oldPatchEnd not found!');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('admin.html updated successfully!');
