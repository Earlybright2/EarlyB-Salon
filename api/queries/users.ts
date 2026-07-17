import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function createUser(data: InsertUser) {
  if (!data.email) {
    throw new Error("Email is required to create a user.");
  }
  const values = {
    ...data,
    email: data.email.trim().toLowerCase(),
    role: data.role ?? "user",
  };

  await getDb().insert(schema.users).values(values);
  const createdUser = await findUserByEmail(values.email);
  if (!createdUser) {
    throw new Error("Failed to create user.");
  }
  return createdUser;
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  const existing = values.unionId ? await findUserByUnionId(values.unionId) : null;
  if (existing) {
    await getDb()
      .update(schema.users)
      .set(updateSet)
      .where(eq(schema.users.id, existing.id));
    return existing;
  }

  const result = await getDb().insert(schema.users).values(values);
  return result;
}
