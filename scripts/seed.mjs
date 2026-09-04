import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || !connectionString.startsWith("postgres")) {
  console.log("\n⚠️  [NeonDB Seed Warning] DATABASE_URL is not set in .env.local.");
  console.log("👉 Please add your Neon connection string to .env.local to seed the database:");
  console.log("   DATABASE_URL=postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require\n");
  process.exit(0);
}

const pool = new Pool({ connectionString });

async function runSeed() {
  console.log("🚀 Connecting to Neon DB...");
  const client = await pool.connect();

  try {
    console.log("🚀 Initializing Neon DB Schema...");

    // 1. Run Schema Creation
    const schemaPath = path.join(process.cwd(), "scripts", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    await client.query(schemaSql);
    console.log("✓ Tables created/verified in Neon DB.");

    // 2. Seed Vitals
    await client.query(`
      INSERT INTO vitals (date, filed_today, leads_found, leads_killed, leads_refused, spent_today, budget_limit, uplink_status)
      VALUES (CURRENT_DATE, 7, 19, 10, 2, 3.87, 10.00, 'filing live')
      ON CONFLICT (date) DO UPDATE SET
        filed_today = EXCLUDED.filed_today,
        leads_found = EXCLUDED.leads_found,
        leads_killed = EXCLUDED.leads_killed,
        leads_refused = EXCLUDED.leads_refused,
        spent_today = EXCLUDED.spent_today;
    `);
    console.log("✓ Vitals seeded.");

    console.log("\n🎉 [NeonDB Success] Database initialization and seed injection complete!\n");
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed().catch((err) => {
  console.error("❌ [NeonDB Error]", err);
  process.exit(1);
});
