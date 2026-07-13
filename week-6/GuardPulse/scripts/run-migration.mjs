import pg from "pg";
import { readFileSync } from "fs";

const client = new pg.Client({
  connectionString:
    "postgresql://postgres.ilzjueatkjrzgdpibvvr:cHrGAKWsc5sQz5zQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const sql = readFileSync("supabase/migrations/001_init.sql", "utf-8");
  await client.query(sql);

  console.log("Migration completed successfully!");

  // Verify tables
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log("\nCreated tables:");
  res.rows.forEach((r) => console.log(`  - ${r.table_name}`));
} catch (err) {
  console.error("Migration error:", err.message);
} finally {
  await client.end();
}
