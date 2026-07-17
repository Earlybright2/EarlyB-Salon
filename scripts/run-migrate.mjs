import pg from "pg";
import fs from "fs";
import "dotenv/config";

const sql = fs.readFileSync("./db/migrations/0000_outstanding_sway.sql", "utf8");
console.log("SQL length:", sql.length, "chars");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await pool.query(sql);
  console.log("Migration applied successfully!");
} catch (err) {
  console.error("Migration error:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
