const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
const content = fs.readFileSync(schemaPath, 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('CREATE TABLE') || l.includes('ENABLE ROW LEVEL SECURITY') || l.includes('CREATE POLICY')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
