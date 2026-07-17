import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

const adminRoles = [
  "admin",
  "super_admin",
  "verification_admin",
  "finance_admin",
  "support_admin",
  "content_admin",
] as const;

export type AdminRole = (typeof adminRoles)[number];

function isAdminRole(role: string): role is AdminRole {
  return adminRoles.includes(role as AdminRole);
}

const requireAnyAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user || !isAdminRole(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ErrorMessages.insufficientRole,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = t.procedure.use(requireAnyAdmin);
export const superAdminQuery = adminQuery.use(requireRole("super_admin"));
export const verificationAdminQuery = adminQuery.use(requireRole("verification_admin"));
export const financeAdminQuery = adminQuery.use(requireRole("finance_admin"));
export const supportAdminQuery = adminQuery.use(requireRole("support_admin"));
export const contentAdminQuery = adminQuery.use(requireRole("content_admin"));
