import { Client } from "pg";
import { readFileSync } from "node:fs";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envFile = readFileSync(".env", "utf8");
  const lines = envFile.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index <= 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    if (key !== "DATABASE_URL") {
      continue;
    }

    const rawValue = trimmed.slice(index + 1).trim();
    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (unquoted) {
      return unquoted;
    }
  }

  throw new Error("Missing DATABASE_URL in environment or .env file");
}

async function run() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await client.query("BEGIN");

    const schemaInfo = await client.query<{
      table_name: string;
      column_name: string;
    }>(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('user', 'opportunities', 'ungatekeep_posts')
    `);

    const columnsByTable = schemaInfo.rows.reduce<Record<string, Set<string>>>(
      (acc, row) => {
        if (!acc[row.table_name]) {
          acc[row.table_name] = new Set<string>();
        }
        acc[row.table_name].add(row.column_name);
        return acc;
      },
      {}
    );

    let userCleared = 0;
    let opportunityCleared = 0;
    let ungatekeepCleared = 0;

    if (columnsByTable.user?.has("image")) {
      const userResult = await client.query(
        `UPDATE "user" SET image = NULL WHERE image IS NOT NULL`
      );
      userCleared = userResult.rowCount ?? 0;
    }

    const opportunityHasImages = columnsByTable.opportunities?.has("images");
    const opportunityHasImage = columnsByTable.opportunities?.has("image");
    const opportunityHasAttachments =
      columnsByTable.opportunities?.has("attachments");

    if (
      opportunityHasImages ||
      opportunityHasImage ||
      opportunityHasAttachments
    ) {
      const setParts: string[] = [];
      const whereParts: string[] = [];

      if (opportunityHasImages) {
        setParts.push("images = '{}'");
        whereParts.push("COALESCE(array_length(images, 1), 0) > 0");
      }

      if (opportunityHasImage) {
        setParts.push("image = NULL");
        whereParts.push("image IS NOT NULL");
      }

      if (opportunityHasAttachments) {
        setParts.push("attachments = '{}'");
        whereParts.push("COALESCE(array_length(attachments, 1), 0) > 0");
      }

      const opportunityResult = await client.query(`
        UPDATE opportunities
        SET ${setParts.join(", ")}
        WHERE ${whereParts.join(" OR ")}
      `);
      opportunityCleared = opportunityResult.rowCount ?? 0;
    }

    const ungatekeepHasImages = columnsByTable.ungatekeep_posts?.has("images");
    const ungatekeepHasImage = columnsByTable.ungatekeep_posts?.has("image");

    if (ungatekeepHasImages || ungatekeepHasImage) {
      const setParts: string[] = [];
      const whereParts: string[] = [];

      if (ungatekeepHasImages) {
        setParts.push("images = '{}'");
        whereParts.push("COALESCE(array_length(images, 1), 0) > 0");
      }

      if (ungatekeepHasImage) {
        setParts.push("image = NULL");
        whereParts.push("image IS NOT NULL");
      }

      const ungatekeepResult = await client.query(`
        UPDATE ungatekeep_posts
        SET ${setParts.join(", ")}
        WHERE ${whereParts.join(" OR ")}
      `);
      ungatekeepCleared = ungatekeepResult.rowCount ?? 0;
    }

    await client.query("COMMIT");

    console.log("Legacy Appwrite references wiped successfully:");
    console.log(`- user image cleared rows: ${userCleared}`);
    console.log(`- opportunities media cleared rows: ${opportunityCleared}`);
    console.log(`- ungatekeep_posts media cleared rows: ${ungatekeepCleared}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("Failed to wipe legacy Appwrite references:", error);
  process.exit(1);
});
