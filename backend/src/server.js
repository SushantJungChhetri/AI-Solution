// backend/src/server.js
import 'dotenv/config';
import express from 'express';
import { createApi } from './app.js';
import { assertDatabaseConnectionOk } from './db.js';

const root = express();
root.use('/api', createApi());

if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = Number(process.env.PORT || 3000);
  (async () => {
    await assertDatabaseConnectionOk();
    root.listen(PORT, () => {
      console.log(`[dev] API listening on http://localhost:${PORT}/api`);
    });
  })();
}

export default root;
