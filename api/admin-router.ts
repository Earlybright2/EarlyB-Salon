import { z } from "zod";
import { eq, count, sql, desc } from "drizzle-orm";
import { getDb } from "./queries/connection";
import {
  createRouter,
  publicQuery,
  adminQuery,
  superAdminQuery,
  verificationAdminQuery,
  financeAdminQuery,
  supportAdminQuery,
  contentAdminQuery,
} from "./middleware";
import {
  users,
  stylists,
  salons,
  appointments,
  reviews,
  products,
  orders,
  orderItems,
  notifications,
} from "@db/schema";

export const adminRouter = createRouter({
  // ─── DASHBOARD ─────────────────────────────────────
  dashboard: adminQuery.query(async () => {
    const db = getDb();
    const [userCount] = await db.select({ value: count() }).from(users);
    const [salonCount] = await db.select({ value: count() }).from(salons);
    const [bookingCount] = await db.select({ value: count() }).from(appointments);
    const [productCount] = await db.select({ value: count() }).from(products);
    const pendingKyc = await db
      .select({ value: count() })
      .from(stylists)
      .where(eq(stylists.kycStatus, "pending"));
    const pendingDisputes = await db
      .select({ value: count() })
      .from(appointments)
      .where(eq(appointments.paymentStatus, "disputed"));
    const activeSubscriptions = await db
      .select({ value: count() })
      .from(stylists)
      .where(sql`${stylists.subscriptionPlan} != 'free'`);

    return {
      totalUsers: userCount?.value ?? 0,
      totalSalons: salonCount?.value ?? 0,
      totalBookings: bookingCount?.value ?? 0,
      totalProducts: productCount?.value ?? 0,
      pendingKyc: pendingKyc[0]?.value ?? 0,
      pendingDisputes: pendingDisputes[0]?.value ?? 0,
      activeSubscriptions: activeSubscriptions[0]?.value ?? 0,
    };
  }),

  topSalons: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        id: salons.id,
        name: salons.businessName,
        city: salons.city,
        rating: salons.averageRating,
        bookings: count(appointments.id),
      })
      .from(salons)
      .leftJoin(appointments, eq(appointments.salonId, salons.id))
      .groupBy(salons.id)
      .orderBy(desc(count(appointments.id)))
      .limit(10);
    return result;
  }),

  // ─── SUPER ADMIN ───────────────────────────────────
  allUsers: superAdminQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phoneNumber: users.phoneNumber,
        isActive: users.isActive,
        isVerified: users.isVerified,
        isSuspended: users.isSuspended,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return result;
  }),

  updateUserRole: superAdminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum([
          "user", "admin", "super_admin",
          "verification_admin", "finance_admin",
          "support_admin", "content_admin",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  suspendUser: superAdminQuery
    .input(z.object({ userId: z.number(), suspended: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ isSuspended: input.suspended ? 1 : 0, isActive: input.suspended ? 0 : 1 })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  allStylists: superAdminQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        id: stylists.id,
        userId: stylists.userId,
        displayName: stylists.displayName,
        kycStatus: stylists.kycStatus,
        averageRating: stylists.averageRating,
        totalEarnings: stylists.totalEarnings,
        subscriptionPlan: stylists.subscriptionPlan,
        isFeatured: stylists.isFeatured,
        createdAt: stylists.createdAt,
      })
      .from(stylists)
      .orderBy(desc(stylists.createdAt));
    return result;
  }),

  manageFeaturedSalon: superAdminQuery
    .input(z.object({ salonId: z.number(), featured: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(salons).set({ isFeatured: input.featured ? 1 : 0 }).where(eq(salons.id, input.salonId));
      return { success: true };
    }),

  // ─── VERIFICATION ADMIN ────────────────────────────
  pendingKycList: verificationAdminQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        id: stylists.id,
        displayName: stylists.displayName,
        kycStatus: stylists.kycStatus,
        kycSubmittedAt: stylists.kycSubmittedAt,
        userId: stylists.userId,
      })
      .from(stylists)
      .where(eq(stylists.kycStatus, "pending"))
      .orderBy(desc(stylists.kycSubmittedAt));
    return result;
  }),

  approveKyc: verificationAdminQuery
    .input(z.object({ stylistId: z.number(), approved: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(stylists)
        .set({
          kycStatus: input.approved ? "approved" : "rejected",
          kycApprovedAt: input.approved ? sql`now()` : undefined,
        })
        .where(eq(stylists.id, input.stylistId));
      return { success: true };
    }),

  // ─── FINANCE ADMIN ─────────────────────────────────
  revenueStats: financeAdminQuery.query(async () => {
    const db = getDb();
    const totalRevenue = await db
      .select({ value: sql<number>`COALESCE(SUM(${appointments.totalAmount}), 0)` })
      .from(appointments)
      .where(eq(appointments.paymentStatus, "paid"));
    const pendingPayouts = await db
      .select({ value: sql<number>`COALESCE(SUM(${appointments.stylistAmount}), 0)` })
      .from(appointments)
      .where(eq(appointments.paymentStatus, "pending"));
    const totalOrders = await db
      .select({ value: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)` })
      .from(orders);
    return {
      totalRevenue: totalRevenue[0]?.value ?? 0,
      pendingPayouts: pendingPayouts[0]?.value ?? 0,
      totalOrdersRevenue: totalOrders[0]?.value ?? 0,
    };
  }),

  allTransactions: financeAdminQuery.query(async () => {
    const db = getDb();
    const bookingPayments = await db
      .select({
        id: appointments.id,
        amount: appointments.totalAmount,
        status: appointments.paymentStatus,
        type: sql<string>`'booking'`,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .orderBy(desc(appointments.createdAt))
      .limit(50);
    return bookingPayments;
  }),

  // ─── SUPPORT ADMIN ─────────────────────────────────
  pendingDisputes: supportAdminQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        id: appointments.id,
        bookingReference: appointments.bookingReference,
        totalAmount: appointments.totalAmount,
        status: appointments.status,
        paymentStatus: appointments.paymentStatus,
        userNotes: appointments.userNotes,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(eq(appointments.paymentStatus, "disputed"))
      .orderBy(desc(appointments.createdAt));
    return result;
  }),

  // ─── CONTENT ADMIN ─────────────────────────────────
  flaggedReviews: contentAdminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        isVerified: reviews.isVerified,
        targetType: reviews.targetType,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.isVerified, 0))
      .orderBy(desc(reviews.createdAt))
      .limit(50);
  }),

  moderateReview: contentAdminQuery
    .input(z.object({ reviewId: z.number(), verified: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(reviews)
        .set({ isVerified: input.verified ? 1 : 0 })
        .where(eq(reviews.id, input.reviewId));
      return { success: true };
    }),

  // ─── PLATFORM STATS (all admins) ───────────────────
  platformStats: adminQuery.query(async () => {
    const db = getDb();
    const weeklyBookings = await db
      .select({ value: count() })
      .from(appointments)
      .where(
        sql`${appointments.createdAt} >= now() - interval '7 days'`
      );
    const activeUsers = await db
      .select({ value: count() })
      .from(users)
      .where(sql`${users.lastLoginAt} >= now() - interval '30 days'`);
    return {
      weeklyBookings: weeklyBookings[0]?.value ?? 0,
      activeUsers30d: activeUsers[0]?.value ?? 0,
    };
  }),
});
