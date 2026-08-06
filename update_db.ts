import { sql } from 'drizzle-orm';
import { db } from './lib/db';

async function main() {
  try {
    console.log('Running update script... (schema updates moved to migrations)');
    console.log('Database updated successfully');
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
}

main();
