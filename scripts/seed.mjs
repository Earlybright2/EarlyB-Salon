import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const hash = await bcrypt.hash("admin123", 10);

await pool.query(
  `INSERT INTO "users" ("unionId", "name", "email", "password_hash", "role", "is_verified", "is_active")
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   ON CONFLICT ("unionId") DO NOTHING`,
  ["super-admin@earlybright.com", "Super Admin", "super-admin@earlybright.com", hash, "super_admin", 1, 1]
);

const products = [
  ["Aurora Hair Elixir Serum", 12500, 18000, "serum", "Best Seller", 1, 45, 4.8],
  ["Organic Elixir Shampoo", 8500, 12000, "shampoo", null, 1, 62, 4.6],
  ["Nocture Regenerating Mask", 15000, 22000, "treatment", "Top Rated", 1, 28, 4.9],
  ["Hair Revitalize Complex", 18000, null, "supplement", null, 1, 35, 4.7],
];
for (const [name, price, compare, category, badge, featured, stock, rating] of products) {
  await pool.query(
    `INSERT INTO "products" ("name", "price", "compare_price", "category", "badge", "is_featured", "stock_quantity", "average_rating")
     VALUES ($1, $2, $3, $4::"category", $5, $6, $7, $8)`,
    [name, price, compare, category, badge, featured, stock, rating]
  );
}

const salons = [
  ["Amaka's Hair Studio", "14 Admiralty Way, Lekki Phase 1", "Lagos", 4.9, 1, 1, 286],
  ["Kings Barbershop", "22 Adeola Odeku Street, Victoria Island", "Lagos", 4.8, 1, 1, 195],
];
for (const [name, addr, city, rating, verified, featured, reviews] of salons) {
  await pool.query(
    `INSERT INTO "salons" ("business_name", "address", "city", "average_rating", "is_verified", "is_featured", "total_reviews")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [name, addr, city, rating, verified, featured, reviews]
  );
}

await pool.end();
console.log("Seed complete!");
