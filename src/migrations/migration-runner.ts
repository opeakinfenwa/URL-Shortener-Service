import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const env = process.env.NODE_ENV || 'development';
console.log(`Running migration in ${env} environment...`);

let connectionString = process.env.DATABASE_URL;
if (env === 'production') connectionString = process.env.DATABASE_URL_PROD;
else if (env === 'test') connectionString = process.env.DATABASE_URL_TEST;

const client = new Client({ connectionString });
const historyFile = join(__dirname, 'migration.history.json');

function getMigrationHistory(): string[] {
  if (!existsSync(historyFile)) writeFileSync(historyFile, JSON.stringify([]));
  return JSON.parse(readFileSync(historyFile, 'utf8'));
}

function saveMigrationHistory(history: string[]) {
  writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

async function runMigrations() {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      run_on TIMESTAMP DEFAULT now()
    );
  `);

  const { rows } = await client.query('SELECT filename FROM migrations');
  const dbApplied = new Set(rows.map((r) => r.filename));
  const localApplied = getMigrationHistory();

  const upDir = join(__dirname, 'up');
  const files = readdirSync(upDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (dbApplied.has(file) || localApplied.includes(file)) {
      console.log(`Already applied: ${file}`);
      continue;
    }

    const sql = readFileSync(join(upDir, file), 'utf8');
    console.log(`Running migration: ${file}`);

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO migrations (filename) VALUES ($1)`, [
        file,
      ]);
      await client.query('COMMIT');
      localApplied.push(file);
      saveMigrationHistory(localApplied);
      console.log(`Applied Migration: ${file}`);
      console.log('All migrations completed.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Migration failed: ${file}`, err);
      break;
    }
  }

  await client.end();
}

async function rollbackLastMigration() {
  await client.connect();

  const localHistory = getMigrationHistory();
  const lastMigration = localHistory[localHistory.length - 1];

  if (!lastMigration) {
    console.log('No migration to rollback.');
    return await client.end();
  }

  const downDir = join(__dirname, 'down');
  const rollbackFile = join(downDir, lastMigration);

  if (!existsSync(rollbackFile)) {
    console.error(`No rollback SQL file found for: ${lastMigration}`);
    return await client.end();
  }

  const sql = readFileSync(rollbackFile, 'utf8');

  try {
    console.log(`Rolling back: ${lastMigration}`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(`DELETE FROM migrations WHERE filename = $1`, [
      lastMigration,
    ]);
    await client.query('COMMIT');
    localHistory.pop();
    saveMigrationHistory(localHistory);
    console.log(`Rolled back: ${lastMigration}`);
    console.log('Rollback completed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Rollback failed for: ${lastMigration}`, err);
  } finally {
    await client.end();
  }
}

const action = process.argv[2];
if (action === 'rollback') rollbackLastMigration();
else runMigrations();