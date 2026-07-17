import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle>;
let pool: pg.Pool | undefined;

export function getDb() {
  if (!instance) {
    pool = new pg.Pool({
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
    instance = drizzle(pool, { schema: fullSchema });
  }
  return instance;
}
