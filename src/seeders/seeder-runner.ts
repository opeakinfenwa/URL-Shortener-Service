import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const env = process.env.NODE_ENV || 'development';
console.log(`Running seeds in ${env} environment...`);

let connectionString = process.env.DATABASE_URL;
if (env === 'production') connectionString = process.env.DATABASE_URL_PROD;
else if (env === 'test') connectionString = process.env.DATABASE_URL_TEST;

const client = new Client({ connectionString });

const seedDir = join(__dirname);
const sqlDir = join(seedDir, 'sql');
const undoDir = join(seedDir, 'undo');
const historyFile = join(seedDir, 'seeder.history.json');

function getSeedHistory(): string[] {
  if (!existsSync(historyFile)) return [];
  const content = readFileSync(historyFile, 'utf8');
  return content.trim() ? JSON.parse(content) : [];
}

function saveSeedHistory(history: string[]) {
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

async function runSeeds() {
  try {
    await client.connect();
    const appliedSeeds = getSeedHistory();
    const files = readdirSync(sqlDir).filter((f) => f.endsWith('.sql'));

    for (const file of files) {
      if (appliedSeeds.includes(file)) {
        console.log(`Already seeded: ${file}`);
        continue;
      }

      const sql = readFileSync(join(sqlDir, file), 'utf8');
      console.log(`Seeding: ${file}`);

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');

      appliedSeeds.push(file);
      saveSeedHistory(appliedSeeds);
      console.log(`Seeded: ${file}`);
    }

    console.log('All seeders executed.');
  } catch (err) {
    console.error('Seeding failed:', err);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

async function rollbackSeeds() {
  try {
    await client.connect();
    const history = getSeedHistory().reverse();

    for (const file of history) {
      const undoPath = join(undoDir, file);
      if (!existsSync(undoPath)) {
        console.warn(`No undo file found for: ${file}`);
        continue;
      }

      const undoSql = readFileSync(undoPath, 'utf8');
      console.log(`Undoing seed: ${file}`);

      await client.query('BEGIN');
      await client.query(undoSql);
      await client.query('COMMIT');

      history.pop();
      saveSeedHistory([...history].reverse());
      console.log(`Seed Undone: ${file}`);
    }

    console.log('All seeders rolled back.');
  } catch (err) {
    console.error('Rollback failed:', err);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

const command = process.argv[2];
if (command === 'undo') {
  rollbackSeeds();
} else {
  runSeeds();
}