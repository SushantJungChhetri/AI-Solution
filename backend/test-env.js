import 'dotenv/config.js';

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('PGHOST:', process.env.PGHOST);
console.log('PGUSER:', process.env.PGUSER);
console.log('PGPASSWORD:', typeof process.env.PGPASSWORD, process.env.PGPASSWORD ? 'set' : 'not set');
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGPORT:', process.env.PGPORT);
