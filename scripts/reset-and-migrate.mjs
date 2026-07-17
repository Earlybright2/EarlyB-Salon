import pg from "pg";
import fs from "fs";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  const tables = [
    "order_items", "orders", "wishlist_items", "cart_items",
    "reviews", "appointments", "notifications", "ai_recommendations",
    "services", "hairstyles", "products", "salons", "stylists", "users",
  ];
  for (const t of tables) {
    try { await pool.query(`DROP TABLE IF EXISTS "${t}" CASCADE`); } catch {}
  }

  const enums = [
    "role", "gender", "hair_type", "face_shape", "auth_provider",
    "kyc_status", "subscription_plan", "gender_target",
    "category", "status", "payment_status", "target_type", "order_status",
  ];
  for (const e of enums) {
    try { await pool.query(`DROP TYPE IF EXISTS "${e}" CASCADE`); } catch {}
  }

  console.log("Cleaned existing objects");

  const sql = fs.readFileSync("./db/migrations/0000_outstanding_sway.sql", "utf8");
  const statements = sql.split("--> statement-breakpoint");
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    try {
      await pool.query(stmt);
      console.log(`  [${i + 1}/${statements.length}] OK`);
    } catch (err) {
      console.log(`  [${i + 1}/${statements.length}] ERROR:`, err.message.substring(0, 80));
    }
  }

  console.log("Migration complete!");
} catch (err) {
  console.error("Fatal:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
