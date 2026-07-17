import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { products, salons, hairstyles, services } from "@db/schema";
import { eq } from "drizzle-orm";

export const shopRouter = createRouter({
  // ─── PRODUCTS ──────────────────────────────────────
  products: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(products);
  }),

  productById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(products).where(eq(products.id, input.id));
      return result[0] ?? null;
    }),

  productsByCategory: publicQuery
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(products).where(eq(products.category, input.category as any));
    }),

  featuredProducts: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(products).where(eq(products.isFeatured, 1));
  }),

  // ─── SALONS ────────────────────────────────────────
  salons: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(salons);
  }),

  salonById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(salons).where(eq(salons.id, input.id));
      return result[0] ?? null;
    }),

  featuredSalons: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(salons).where(eq(salons.isFeatured, 1));
  }),

  salonServices: publicQuery
    .input(z.object({ salonId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(services).where(eq(services.salonId, input.salonId));
    }),

  // ─── HAIRSTYLES ────────────────────────────────────
  hairstyles: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(hairstyles);
  }),

  hairstyleById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(hairstyles).where(eq(hairstyles.id, input.id));
      return result[0] ?? null;
    }),
});
