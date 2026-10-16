const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connStr = process.env.DATABASE_URL;

async function initDb() {
  if (!connStr) {
    console.error('DATABASE_URL is not defined in backend/.env');
    process.exit(1);
  }
  console.log('Connecting to database...');
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected! Reading schema.sql...');
  
  const schemaPath = path.join(__dirname, '../schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  console.log('Executing schema.sql...');
  await client.query(sql);
  console.log('✅ schema.sql executed successfully!');

  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('🎉 Verified tables in your database:', res.rows.map(r => r.table_name));
  await client.end();
}

initDb().catch(e => {
  console.error('Error initializing DB:', e);
  process.exit(1);
});
