// =============================================
// 마이그레이션 SQL을 Supabase에 직접 실행합니다.
//
// 사용법:
//   node scripts/run-migration.mjs                         # 기본: 001_init.sql
//   node scripts/run-migration.mjs 002_self_monitoring.sql # 특정 파일 지정
//
// DB 접속 정보는 .env.local 의 DATABASE_URL 에서 읽습니다.
// (비밀번호를 코드에 하드코딩하지 않습니다)
// =============================================
import pg from "pg";
import { readFileSync } from "fs";

// --- .env.local 간단 파서 ---
function loadEnv(path) {
  const env = {};
  let text;
  try {
    text = readFileSync(path, "utf-8");
  } catch {
    return env;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv(".env.local");
const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ .env.local 에 DATABASE_URL 이 필요합니다.");
  process.exit(1);
}

// 실행할 마이그레이션 파일 (인자로 받거나 기본 001_init.sql)
const fileArg = process.argv[2] || "001_init.sql";
const migrationPath = `supabase/migrations/${fileArg}`;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const sql = readFileSync(migrationPath, "utf-8");
  await client.query(sql);

  console.log(`Migration completed successfully! (${fileArg})`);

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
