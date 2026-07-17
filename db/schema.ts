import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  bigint as pgBigint,
  smallint,
} from "drizzle-orm/pg-core";

const mysqlTable = pgTable;
const mysqlEnum = (enumName: string, values: readonly string[] | Record<string, string>) => {
  // pgEnum returns a callable enum factory; calling it with no args returns a column builder
  // which matches the original mysqlEnum usage in this schema.
  const e = pgEnum(enumName as any, values as any);
  return ((name?: string) => e(name as any))() as any;
};
const int = integer as any;
const decimal = numeric as any;
const json = jsonb as any;
const tinyint = smallint as any;

// Wrap bigint to accept legacy MySQL 'unsigned' option by stripping it.
const bigint = (name: string, config?: any) => {
  const cfg = { ...(config || {}) };
  if (cfg.unsigned !== undefined) delete cfg.unsigned;
  return pgBigint(name as any, cfg as any) as any;
};

/* =====================================================
   EARLY BRIGHT SHOP — COMPLETE DATABASE SCHEMA
   MySQL/Drizzle ORM adaptation of blueprint
   ===================================================== */

// ─── USERS ───────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("password_hash"),
  avatar: text("avatar"),
  role: mysqlEnum("role", [
    "user", "admin", "super_admin",
    "verification_admin", "finance_admin",
    "support_admin", "content_admin"
  ]).default("user").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  gender: mysqlEnum("gender", ["male", "female", "non_binary", "prefer_not_to_say"]),
  dateOfBirth: timestamp("date_of_birth"),
  hairType: mysqlEnum("hair_type", ["straight", "wavy", "curly", "coily", "kinky"]),
  faceShape: mysqlEnum("face_shape", ["oval", "round", "square", "heart", "diamond", "oblong"]),
  hairlineStage: tinyint("hairline_stage"),
  skinTone: tinyint("skin_tone"),
  authProvider: mysqlEnum("auth_provider", ["email", "google", "apple", "phone"]).default("email"),
  isVerified: tinyint("is_verified").default(0),
  isActive: tinyint("is_active").default(1),
  isSuspended: tinyint("is_suspended").default(0),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── STYLISTS ────────────────────────────────────────
export const stylists = mysqlTable("stylists", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 255 }),
  bio: text("bio"),
  yearsExperience: int("years_experience"),
  specializations: text("specializations"),
  serviceCategories: text("service_categories"),
  workingHours: json("working_hours"),
  isMobile: tinyint("is_mobile").default(0),
  kycStatus: mysqlEnum("kyc_status", ["pending", "under_review", "approved", "rejected"]).default("pending"),
  kycSubmittedAt: timestamp("kyc_submitted_at"),
  kycApprovedAt: timestamp("kyc_approved_at"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: int("total_reviews").default(0),
  totalEarnings: decimal("total_earnings", { precision: 15, scale: 2 }).default("0"),
  walletBalance: decimal("wallet_balance", { precision: 15, scale: 2 }).default("0"),
  isFeatured: tinyint("is_featured").default(0),
  subscriptionPlan: mysqlEnum("subscription_plan", ["free", "pro", "enterprise"]).default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Stylist = typeof stylists.$inferSelect;

// ─── SALONS ──────────────────────────────────────────
export const salons = mysqlTable("salons", {
  id: serial("id").primaryKey(),
  ownerId: bigint("owner_id", { mode: "number", unsigned: true }).references(() => stylists.id),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Nigeria"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  instagramUrl: varchar("instagram_url", { length: 500 }),
  coverPhoto: varchar("cover_photo", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  workingHours: json("working_hours"),
  isVerified: tinyint("is_verified").default(0),
  isActive: tinyint("is_active").default(1),
  isFeatured: tinyint("is_featured").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: int("total_reviews").default(0),
  seatCapacity: int("seat_capacity").default(1),
  currentOccupancy: int("current_occupancy").default(0),
  busyPercentage: int("busy_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Salon = typeof salons.$inferSelect;

// ─── SERVICES ────────────────────────────────────────
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  salonId: bigint("salon_id", { mode: "number", unsigned: true }).references(() => salons.id),
  stylistId: bigint("stylist_id", { mode: "number", unsigned: true }).references(() => stylists.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }).notNull(),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
  durationMin: int("duration_min").default(60),
  isActive: tinyint("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;

// ─── HAIRSTYLES ──────────────────────────────────────
export const hairstyles = mysqlTable("hairstyles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  genderTarget: mysqlEnum("gender_target", ["male", "female", "unisex"]).default("unisex"),
  faceShapes: text("face_shapes"),
  hairTypes: text("hair_types"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  trendScore: int("trend_score").default(0),
  isCelebrity: tinyint("is_celebrity").default(0),
  celebrityName: varchar("celebrity_name", { length: 255 }),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Hairstyle = typeof hairstyles.$inferSelect;

// ─── PRODUCTS ────────────────────────────────────────
export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["serum", "shampoo", "supplement", "tool", "treatment", "other"]),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  stockQuantity: int("stock_quantity").default(0),
  sku: varchar("sku", { length: 100 }),
  photos: text("photos"),
  ingredients: text("ingredients"),
  usageGuide: text("usage_guide"),
  badge: varchar("badge", { length: 50 }),
  isNew: tinyint("is_new").default(0),
  isFeatured: tinyint("is_featured").default(0),
  isActive: tinyint("is_active").default(1),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: int("total_reviews").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;

// ─── APPOINTMENTS ────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: serial("id").primaryKey(),
  bookingReference: varchar("booking_reference", { length: 12 }).notNull().unique(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  stylistId: bigint("stylist_id", { mode: "number", unsigned: true }).references(() => stylists.id),
  salonId: bigint("salon_id", { mode: "number", unsigned: true }).references(() => salons.id),
  serviceId: bigint("service_id", { mode: "number", unsigned: true }).references(() => services.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: int("duration_minutes").default(60),
  status: mysqlEnum("status", [
    "pending", "confirmed", "in_progress", "completed",
    "cancelled_by_user", "cancelled_by_stylist", "no_show"
  ]).default("pending"),
  userNotes: text("user_notes"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 12, scale: 2 }).notNull(),
  stylistAmount: decimal("stylist_amount", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "refunded", "disputed"]).default("pending"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;

// ─── REVIEWS ─────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  appointmentId: bigint("appointment_id", { mode: "number", unsigned: true }).references(() => appointments.id),
  targetType: mysqlEnum("target_type", ["salon", "stylist", "product"]),
  targetId: bigint("target_id", { mode: "number", unsigned: true }),
  rating: tinyint("rating"),
  title: varchar("title", { length: 255 }),
  body: text("body"),
  photos: text("photos"),
  isVerified: tinyint("is_verified").default(0),
  isFeatured: tinyint("is_featured").default(0),
  helpfulCount: int("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ─── CART ITEMS ──────────────────────────────────────
export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type CartItem = typeof cartItems.$inferSelect;

// ─── WISHLIST ITEMS ──────────────────────────────────
export const wishlistItems = mysqlTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WishlistItem = typeof wishlistItems.$inferSelect;

// ─── ORDERS ──────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("order_status", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

// ─── ORDER ITEMS ─────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── NOTIFICATIONS ───────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  data: json("data"),
  isRead: tinyint("is_read").default(0),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── AI RECOMMENDATIONS ──────────────────────────────
export const aiRecommendations = mysqlTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  faceScanData: json("face_scan_data"),
  faceShape: varchar("face_shape", { length: 50 }),
  skinTone: tinyint("skin_tone"),
  hairlineStage: tinyint("hairline_stage"),
  recommendedStyles: text("recommended_styles"),
  modelVersion: varchar("model_version", { length: 20 }),
  scanImageUrl: varchar("scan_image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiRecommendation = typeof aiRecommendations.$inferSelect;
