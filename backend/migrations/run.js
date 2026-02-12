const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log('Connected to MySQL server');

  const migrationFile = path.join(__dirname, '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Running migration: 001_initial_schema.sql');
  await connection.query(sql);
  console.log('Migration completed successfully!');

  await connection.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
