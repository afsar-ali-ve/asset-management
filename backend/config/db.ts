const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const databaseUrl = process.env.DATABASE_URL;
const shouldUseSsl = process.env.NODE_ENV === 'production' || /sslmode=require/i.test(databaseUrl || '');

const pool = new Pool({
  connectionString: databaseUrl,
  ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

module.exports = pool;
