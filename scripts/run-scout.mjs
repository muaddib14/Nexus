import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const port = process.env.PORT || 3000;
const secret = process.env.CRON_SECRET || "nexus_scout_secret_key_123";
const targetUrl = process.env.APP_URL 
  ? `${process.env.APP_URL}/api/scout/cycle`
  : `http://localhost:${port}/api/scout/cycle`;

async function main() {
  console.log(`⚡ [NEXUS Scout CLI] Triggering Scout cycle at: ${targetUrl}...`);

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    console.log("✓ Cycle Execution Success:\n", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Scout Cycle Failed:", error.message);
    process.exit(1);
  }
}

main();
