import { sql } from 'drizzle-orm';
import { db } from './lib/db';

async function main() {
  try {
    await db.execute(sql`ALTER TABLE toolkits ADD COLUMN IF NOT EXISTS session_whatsapp_link text;`);
    await db.execute(sql`ALTER TABLE toolkits ADD COLUMN IF NOT EXISTS session_meet_link text;`);
    await db.execute(sql`ALTER TABLE toolkits ADD COLUMN IF NOT EXISTS session_date timestamp;`);
    await db.execute(sql`ALTER TABLE toolkits ADD COLUMN IF NOT EXISTS session_questions jsonb DEFAULT '[]'::jsonb;`);
    console.log('Database updated successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
