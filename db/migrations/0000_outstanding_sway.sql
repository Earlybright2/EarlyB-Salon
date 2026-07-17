CREATE TYPE "role" AS ENUM ('user', 'admin', 'super_admin', 'verification_admin', 'finance_admin', 'support_admin', 'content_admin');
CREATE TYPE "gender" AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE "hair_type" AS ENUM ('straight', 'wavy', 'curly', 'coily', 'kinky');
CREATE TYPE "face_shape" AS ENUM ('oval', 'round', 'square', 'heart', 'diamond', 'oblong');
CREATE TYPE "auth_provider" AS ENUM ('email', 'google', 'apple', 'phone');
CREATE TYPE "kyc_status" AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE "subscription_plan" AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE "gender_target" AS ENUM ('male', 'female', 'unisex');
CREATE TYPE "category" AS ENUM ('serum', 'shampoo', 'supplement', 'tool', 'treatment', 'other');
CREATE TYPE "status" AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled_by_user', 'cancelled_by_stylist', 'no_show');
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'refunded', 'disputed');
CREATE TYPE "target_type" AS ENUM ('salon', 'stylist', 'product');
CREATE TYPE "order_status" AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
--> statement-breakpoint
CREATE TABLE "ai_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"face_scan_data" jsonb,
	"face_shape" varchar(50),
	"skin_tone" smallint,
	"hairline_stage" smallint,
	"recommended_styles" text,
	"model_version" varchar(20),
	"scan_image_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_reference" varchar(12) NOT NULL,
	"user_id" bigint,
	"stylist_id" bigint,
	"salon_id" bigint,
	"service_id" bigint,
	"scheduled_at" timestamp NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"status" "status" DEFAULT 'pending',
	"user_notes" text,
	"total_amount" numeric(12, 2) NOT NULL,
	"platform_fee" numeric(12, 2) NOT NULL,
	"stylist_amount" numeric(12, 2) NOT NULL,
	"paymentStatus" "payment_status" DEFAULT 'pending',
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_booking_reference_unique" UNIQUE("booking_reference")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"session_id" varchar(255),
	"product_id" bigint,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hairstyles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"genderTarget" "gender_target" DEFAULT 'unisex',
	"face_shapes" text,
	"hair_types" text,
	"thumbnail_url" varchar(500),
	"trend_score" integer DEFAULT 0,
	"is_celebrity" smallint DEFAULT 0,
	"celebrity_name" varchar(255),
	"tags" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"type" varchar(100) NOT NULL,
	"title" varchar(255),
	"message" text,
	"data" jsonb,
	"is_read" smallint DEFAULT 0,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" bigint,
	"product_id" bigint,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"order_number" varchar(20) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending',
	"shipping_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "category",
	"price" numeric(10, 2) NOT NULL,
	"compare_price" numeric(10, 2),
	"stock_quantity" integer DEFAULT 0,
	"sku" varchar(100),
	"photos" text,
	"ingredients" text,
	"usage_guide" text,
	"badge" varchar(50),
	"is_new" smallint DEFAULT 0,
	"is_featured" smallint DEFAULT 0,
	"is_active" smallint DEFAULT 1,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"appointment_id" bigint,
	"targetType" "target_type",
	"target_id" bigint,
	"rating" smallint,
	"title" varchar(255),
	"body" text,
	"photos" text,
	"is_verified" smallint DEFAULT 0,
	"is_featured" smallint DEFAULT 0,
	"helpful_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salons" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" bigint,
	"business_name" varchar(255) NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'Nigeria',
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"phone_number" varchar(20),
	"email" varchar(255),
	"website_url" varchar(500),
	"instagram_url" varchar(500),
	"cover_photo" varchar(500),
	"logo_url" varchar(500),
	"working_hours" jsonb,
	"is_verified" smallint DEFAULT 0,
	"is_active" smallint DEFAULT 1,
	"is_featured" smallint DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" integer DEFAULT 0,
	"seat_capacity" integer DEFAULT 1,
	"current_occupancy" integer DEFAULT 0,
	"busy_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"salon_id" bigint,
	"stylist_id" bigint,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"min_price" numeric(10, 2) NOT NULL,
	"max_price" numeric(10, 2),
	"duration_min" integer DEFAULT 60,
	"is_active" smallint DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stylists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"display_name" varchar(255),
	"bio" text,
	"years_experience" integer,
	"specializations" text,
	"service_categories" text,
	"working_hours" jsonb,
	"is_mobile" smallint DEFAULT 0,
	"kycStatus" "kyc_status" DEFAULT 'pending',
	"kyc_submitted_at" timestamp,
	"kyc_approved_at" timestamp,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" integer DEFAULT 0,
	"total_earnings" numeric(15, 2) DEFAULT '0',
	"wallet_balance" numeric(15, 2) DEFAULT '0',
	"is_featured" smallint DEFAULT 0,
	"subscriptionPlan" "subscription_plan" DEFAULT 'free',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"unionId" varchar(255) NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"password_hash" text,
	"avatar" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"phone_number" varchar(20),
	"gender" "gender",
	"date_of_birth" timestamp,
	"hairType" "hair_type",
	"faceShape" "face_shape",
	"hairline_stage" smallint,
	"skin_tone" smallint,
	"authProvider" "auth_provider" DEFAULT 'email',
	"is_verified" smallint DEFAULT 0,
	"is_active" smallint DEFAULT 1,
	"is_suspended" smallint DEFAULT 0,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_unionId_unique" UNIQUE("unionId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"product_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_stylist_id_stylists_id_fk" FOREIGN KEY ("stylist_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_owner_id_stylists_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_stylist_id_stylists_id_fk" FOREIGN KEY ("stylist_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stylists" ADD CONSTRAINT "stylists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;