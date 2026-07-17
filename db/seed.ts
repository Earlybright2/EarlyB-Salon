import { getDb } from "../api/queries/connection";
import { products, salons, hairstyles, services } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed Products
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    const productData = [
      {
        name: "Aurora Hair Elixir Serum",
        description: "Premium hair growth serum infused with biotin, argan oil, and caffeine. Stimulates follicles for thicker, fuller hair in just 4 weeks. Dermatologist tested and approved for all hair types.",
        category: "serum" as const,
        price: "12500",
        comparePrice: "18000",
        stockQuantity: 45,
        sku: "AUR-SER-001",
        photos: JSON.stringify(["/product-serum.jpg"]),
        badge: "Best Seller",
        isFeatured: 1,
        averageRating: "4.8",
        totalReviews: 142,
      },
      {
        name: "Organic Elixir Shampoo",
        description: "Sulfate-free shampoo with natural botanical extracts. Gently cleanses while preserving natural oils. Contains shea butter, coconut oil, and aloe vera for deep hydration and scalp health.",
        category: "shampoo" as const,
        price: "8500",
        comparePrice: "12000",
        stockQuantity: 62,
        sku: "ORG-SHA-002",
        photos: JSON.stringify(["/product-shampoo.jpg"]),
        isFeatured: 1,
        averageRating: "4.6",
        totalReviews: 98,
      },
      {
        name: "Nocture Regenerating Mask",
        description: "Intensive overnight hair treatment mask. Deep conditioning formula repairs damaged hair, restores shine, and prevents breakage. Wake up to silky, manageable hair every morning.",
        category: "treatment" as const,
        price: "15000",
        comparePrice: "22000",
        stockQuantity: 28,
        sku: "NOC-MSK-003",
        photos: JSON.stringify(["/product-treatment.jpg"]),
        badge: "Top Rated",
        isFeatured: 1,
        isNew: 1,
        averageRating: "4.9",
        totalReviews: 215,
      },
      {
        name: "Hair Revitalize Complex",
        description: "Advanced hair growth supplement with biotin, zinc, saw palmetto, and collagen. Supports healthy hair growth from within. 60 capsules, 30-day supply.",
        category: "supplement" as const,
        price: "18000",
        stockQuantity: 35,
        sku: "REV-SUP-004",
        photos: JSON.stringify(["/product-supplement.jpg"]),
        isFeatured: 1,
        averageRating: "4.7",
        totalReviews: 87,
      },
      {
        name: "Rose Gold Styling Set",
        description: "Premium wide-tooth comb and detangling brush set in luxurious rose gold finish. Gentle on all hair types, reduces breakage and frizz. Ergonomic design for comfortable styling.",
        category: "tool" as const,
        price: "9500",
        comparePrice: "14000",
        stockQuantity: 18,
        sku: "ROS-SET-005",
        photos: JSON.stringify(["/product-tools.jpg"]),
        isNew: 1,
        averageRating: "4.5",
        totalReviews: 64,
      },
      {
        name: "Argan Elixir Hair Oil",
        description: "Pure Moroccan argan oil infused with vitamin E and essential fatty acids. Adds brilliant shine, tames frizz, and protects against heat damage. Lightweight, non-greasy formula.",
        category: "serum" as const,
        price: "11000",
        stockQuantity: 40,
        sku: "ARG-OIL-006",
        photos: JSON.stringify(["/product-oil.jpg"]),
        badge: "Popular",
        averageRating: "4.8",
        totalReviews: 176,
      },
      {
        name: "Aurora Bliss Conditioner",
        description: "Luxury restorative conditioner with keratin and silk proteins. Detangles, softens, and strengthens hair. pH-balanced formula for optimal hair health and manageability.",
        category: "treatment" as const,
        price: "9200",
        comparePrice: "13000",
        stockQuantity: 55,
        sku: "AUR-CON-007",
        photos: JSON.stringify(["/product-conditioner.jpg"]),
        averageRating: "4.6",
        totalReviews: 112,
      },
      {
        name: "Aurum Nectar Moisturizer",
        description: "Leave-in hair moisturizer with honey extract and natural humectants. Provides 24-hour hydration, defines curls, and eliminates dryness. Perfect for natural and protective styles.",
        category: "treatment" as const,
        price: "7800",
        stockQuantity: 48,
        sku: "AUR-MOI-008",
        photos: JSON.stringify(["/product-moisturizer.jpg"]),
        isNew: 1,
        averageRating: "4.7",
        totalReviews: 93,
      },
      {
        name: "Opulence Edge Control Gel",
        description: "Professional-grade edge control gel with extreme hold. Smooths and lays edges without flaking or white residue. Infused with castor oil to promote healthy hairline growth.",
        category: "other" as const,
        price: "5500",
        stockQuantity: 72,
        sku: "OPU-EDG-009",
        photos: JSON.stringify(["/product-edge-control.jpg"]),
        badge: "Trending",
        averageRating: "4.4",
        totalReviews: 156,
      },
    ];

    for (const product of productData) {
      await db.insert(products).values(product);
    }
    console.log("Products seeded!");
  }

  // Seed Hairstyles
  const existingHairstyles = await db.select().from(hairstyles);
  if (existingHairstyles.length === 0) {
    const hairstyleData = [
      { name: "Golden Box Braids", category: "Braids", genderTarget: "female" as const, faceShapes: JSON.stringify(["oval", "round", "square", "heart"]), hairTypes: JSON.stringify(["curly", "coily", "kinky"]), trendScore: 95 },
      { name: "Low Fade with Waves", category: "Fade", genderTarget: "male" as const, faceShapes: JSON.stringify(["oval", "round", "square"]), hairTypes: JSON.stringify(["curly", "coily"]), trendScore: 92 },
      { name: "Natural Afro Glow", category: "Natural", genderTarget: "female" as const, faceShapes: JSON.stringify(["oval", "heart", "diamond"]), hairTypes: JSON.stringify(["coily", "kinky"]), trendScore: 88 },
      { name: "Knotless Braids", category: "Braids", genderTarget: "female" as const, faceShapes: JSON.stringify(["oval", "round", "heart"]), hairTypes: JSON.stringify(["curly", "coily", "kinky"]), trendScore: 90 },
      { name: "High Top Fade", category: "Fade", genderTarget: "male" as const, faceShapes: JSON.stringify(["oval", "square", "oblong"]), hairTypes: JSON.stringify(["coily", "kinky"]), trendScore: 85 },
    ];

    for (const hairstyle of hairstyleData) {
      await db.insert(hairstyles).values(hairstyle);
    }
    console.log("Hairstyles seeded!");
  }

  // Seed Salons
  const existingSalons = await db.select().from(salons);
  if (existingSalons.length === 0) {
    const salonData = [
      {
        businessName: "Amaka's Hair Studio",
        description: "Luxury hair braiding and styling studio specializing in protective styles, knotless braids, and natural hair care.",
        address: "14 Admiralty Way, Lekki Phase 1",
        city: "Lagos",
        state: "Lagos",
        phoneNumber: "+234 801 234 5678",
        isVerified: 1,
        isActive: 1,
        isFeatured: 1,
        averageRating: "4.9",
        totalReviews: 286,
        seatCapacity: 8,
        currentOccupancy: 6,
        busyPercentage: 78,
        specializations: JSON.stringify(["Braids", "Twists", "Natural Hair"]),
        workingHours: JSON.stringify({ monday: { open: "09:00", close: "20:00" }, tuesday: { open: "09:00", close: "20:00" } }),
      },
      {
        businessName: "Kings Barbershop",
        description: "Premium men's grooming lounge offering precision cuts, beard grooming, and hairline restoration services.",
        address: "22 Adeola Odeku Street, Victoria Island",
        city: "Lagos",
        state: "Lagos",
        phoneNumber: "+234 802 345 6789",
        isVerified: 1,
        isActive: 1,
        isFeatured: 1,
        averageRating: "4.8",
        totalReviews: 195,
        seatCapacity: 6,
        currentOccupancy: 4,
        busyPercentage: 60,
        specializations: JSON.stringify(["Fade", "Beard Grooming", "Hairline"]),
        workingHours: JSON.stringify({ monday: { open: "08:00", close: "21:00" }, tuesday: { open: "08:00", close: "21:00" } }),
      },
    ];

    for (const salon of salonData) {
      await db.insert(salons).values(salon);
    }
    console.log("Salons seeded!");
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
