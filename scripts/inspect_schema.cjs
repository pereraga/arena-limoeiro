const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const content = fs.readFileSync(schemaPath, 'utf8');
  console.log('schema.sql size:', content.length);
  console.log('First 500 chars:\n', content.slice(0, 500));
} else {
  console.log('No schema.sql found');
}
