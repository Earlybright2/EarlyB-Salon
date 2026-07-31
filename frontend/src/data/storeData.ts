export interface Product {
  id: number;
  name: string;
  description: string;
  category: "serum" | "shampoo" | "supplement" | "tool" | "treatment" | "other";
  price: number;
  comparePrice?: number;
  image: string;
  rating: number;
  reviews: number;
  stock: number;
  badge?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Salon {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  rating: number;
  reviews: number;
  image: string;
  logoUrl?: string;
  isVerified: boolean;
  isOpen: boolean;
  isFeatured: boolean;
  busyPercentage: number;
  specialties: string[];
  phoneNumber?: string;
  seatCapacity: number;
  services: Service[];
}

export interface Service {
  id: number;
  name: string;
  minPrice: number;
  maxPrice?: number;
  duration: number;
  category: string;
}

export interface Hairstyle {
  id: number;
  name: string;
  category: string;
  genderTarget: string;
  image: string;
  faceShapes: string[];
  hairTypes: string[];
  trendScore: number;
  isCelebrity?: boolean;
  celebrityName?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
  date: string;
}

// ─── PRODUCTS ────────────────────────────────────────
export const products: Product[] = [
  {
    id: 1,
    name: "Aurora Hair Elixir Serum",
    description: "Premium hair growth serum infused with biotin, argan oil, and caffeine. Stimulates follicles for thicker, fuller hair in just 4 weeks. Dermatologist tested and approved for all hair types.",
    category: "serum",
    price: 12500,
    comparePrice: 18000,
    image: "/product-serum.jpg",
    rating: 4.8,
    reviews: 142,
    stock: 45,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: 2,
    name: "Organic Elixir Shampoo",
    description: "Sulfate-free shampoo with natural botanical extracts. Gently cleanses while preserving natural oils. Contains shea butter, coconut oil, and aloe vera for deep hydration and scalp health.",
    category: "shampoo",
    price: 8500,
    comparePrice: 12000,
    image: "/product-shampoo.jpg",
    rating: 4.6,
    reviews: 98,
    stock: 62,
    isFeatured: true,
  },
  {
    id: 3,
    name: "Nocture Regenerating Mask",
    description: "Intensive overnight hair treatment mask. Deep conditioning formula repairs damaged hair, restores shine, and prevents breakage. Wake up to silky, manageable hair every morning.",
    category: "treatment",
    price: 15000,
    comparePrice: 22000,
    image: "/product-treatment.jpg",
    rating: 4.9,
    reviews: 215,
    stock: 28,
    badge: "Top Rated",
    isNew: true,
    isFeatured: true,
  },
  {
    id: 4,
    name: "Hair Revitalize Complex",
    description: "Advanced hair growth supplement with biotin, zinc, saw palmetto, and collagen. Supports healthy hair growth from within. 60 capsules, 30-day supply.",
    category: "supplement",
    price: 18000,
    image: "/product-supplement.jpg",
    rating: 4.7,
    reviews: 87,
    stock: 35,
    isFeatured: true,
  },
  {
    id: 5,
    name: "Rose Gold Styling Set",
    description: "Premium wide-tooth comb and detangling brush set in luxurious rose gold finish. Gentle on all hair types, reduces breakage and frizz. Ergonomic design for comfortable styling.",
    category: "tool",
    price: 9500,
    comparePrice: 14000,
    image: "/product-tools.jpg",
    rating: 4.5,
    reviews: 64,
    stock: 18,
    isNew: true,
  },
  {
    id: 6,
    name: "Argan Elixir Hair Oil",
    description: "Pure Moroccan argan oil infused with vitamin E and essential fatty acids. Adds brilliant shine, tames frizz, and protects against heat damage. Lightweight, non-greasy formula.",
    category: "serum",
    price: 11000,
    image: "/product-oil.jpg",
    rating: 4.8,
    reviews: 176,
    stock: 40,
    badge: "Popular",
  },
  {
    id: 7,
    name: "Aurora Bliss Conditioner",
    description: "Luxury restorative conditioner with keratin and silk proteins. Detangles, softens, and strengthens hair. pH-balanced formula for optimal hair health and manageability.",
    category: "treatment",
    price: 9200,
    comparePrice: 13000,
    image: "/product-conditioner.jpg",
    rating: 4.6,
    reviews: 112,
    stock: 55,
  },
  {
    id: 8,
    name: "Aurum Nectar Moisturizer",
    description: "Leave-in hair moisturizer with honey extract and natural humectants. Provides 24-hour hydration, defines curls, and eliminates dryness. Perfect for natural and protective styles.",
    category: "treatment",
    price: 7800,
    image: "/product-moisturizer.jpg",
    rating: 4.7,
    reviews: 93,
    stock: 48,
    isNew: true,
  },
  {
    id: 9,
    name: "Opulence Edge Control Gel",
    description: "Professional-grade edge control gel with extreme hold. Smooths and lays edges without flaking or white residue. Infused with castor oil to promote healthy hairline growth.",
    category: "other",
    price: 5500,
    image: "/product-edge-control.jpg",
    rating: 4.4,
    reviews: 156,
    stock: 72,
    badge: "Trending",
  },
];

// ─── SALONS ──────────────────────────────────────────
export const salons: Salon[] = [
  {
    id: 1,
    name: "Amaka's Hair Studio",
    description: "Luxury hair braiding and styling studio specializing in protective styles, knotless braids, and natural hair care. Our team of certified stylists delivers premium results every time.",
    address: "14 Admiralty Way, Lekki Phase 1",
    city: "Lagos",
    rating: 4.9,
    reviews: 286,
    image: "/salon-interior.jpg",
    isVerified: true,
    isOpen: true,
    isFeatured: true,
    busyPercentage: 78,
    specialties: ["Braids", "Twists", "Natural Hair"],
    phoneNumber: "+234 801 234 5678",
    seatCapacity: 8,
    services: [
      { id: 1, name: "Women's Braids", minPrice: 8000, maxPrice: 25000, duration: 180, category: "Braiding" },
      { id: 2, name: "Hair Coloring", minPrice: 12000, maxPrice: 40000, duration: 120, category: "Color" },
      { id: 3, name: "Hairline Treatment", minPrice: 15000, duration: 60, category: "Treatment" },
      { id: 4, name: "Blow Dry & Style", minPrice: 5000, duration: 45, category: "Styling" },
    ],
  },
  {
    id: 2,
    name: "Kings Barbershop",
    description: "Premium men's grooming lounge offering precision cuts, beard grooming, and hairline restoration services. Experience luxury grooming in a sophisticated atmosphere.",
    address: "22 Adeola Odeku Street, Victoria Island",
    city: "Lagos",
    rating: 4.8,
    reviews: 195,
    image: "/barbershop-interior.jpg",
    isVerified: true,
    isOpen: true,
    isFeatured: true,
    busyPercentage: 60,
    specialties: ["Fade", "Beard Grooming", "Hairline"],
    phoneNumber: "+234 802 345 6789",
    seatCapacity: 6,
    services: [
      { id: 5, name: "Premium Haircut", minPrice: 5000, duration: 45, category: "Cut" },
      { id: 6, name: "Beard Grooming", minPrice: 3500, duration: 30, category: "Beard" },
      { id: 7, name: "Hairline Restoration", minPrice: 25000, duration: 90, category: "Treatment" },
      { id: 8, name: "Hot Towel Shave", minPrice: 4000, duration: 30, category: "Shave" },
    ],
  },
];

// ─── HAIRSTYLES ──────────────────────────────────────
export const hairstyles: Hairstyle[] = [
  {
    id: 1,
    name: "Golden Box Braids",
    category: "Braids",
    genderTarget: "female",
    image: "/hairstyle-braids.jpg",
    faceShapes: ["oval", "round", "square", "heart"],
    hairTypes: ["curly", "coily", "kinky"],
    trendScore: 95,
  },
  {
    id: 2,
    name: "Low Fade with Waves",
    category: "Fade",
    genderTarget: "male",
    image: "/hairstyle-fade.jpg",
    faceShapes: ["oval", "round", "square"],
    hairTypes: ["curly", "coily"],
    trendScore: 92,
  },
  {
    id: 3,
    name: "Natural Afro Glow",
    category: "Natural",
    genderTarget: "female",
    image: "/hairstyle-afro.jpg",
    faceShapes: ["oval", "heart", "diamond"],
    hairTypes: ["coily", "kinky"],
    trendScore: 88,
  },
];

// ─── TESTIMONIALS ────────────────────────────────────
export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ngozi Adeleke",
    avatar: "/hairstyle-afro.jpg",
    role: "Content Creator, Abuja",
    content: "Early Bright completely transformed how I find stylists. The AI try-on feature helped me discover the perfect braids for my face shape. I've never been more confident in my look!",
    rating: 5,
    date: "2 weeks ago",
  },
  {
    id: 2,
    name: "Chukwuemeka Obi",
    avatar: "/hairstyle-fade.jpg",
    role: "Software Engineer, Lagos",
    content: "Finally, a platform that understands men's hair care too. Found an amazing barber through Early Bright and the booking system is seamless. No more WhatsApp back-and-forth!",
    rating: 5,
    date: "1 month ago",
  },
  {
    id: 3,
    name: "Amaka Johnson",
    avatar: "/hairstyle-braids.jpg",
    role: "Salon Owner, Lekki",
    content: "As a stylist, Early Bright has doubled my client base. The KYC verification gives clients confidence, and the earnings dashboard helps me track my growth. Truly game-changing!",
    rating: 5,
    date: "3 weeks ago",
  },
];

// ─── HOW IT WORKS STEPS ──────────────────────────────
export const howItWorksSteps = [
  {
    step: 1,
    title: "Scan Your Face",
    description: "Use our AI-powered face scan to analyze your face shape, skin tone, and hairline condition in seconds.",
    icon: "Scan",
  },
  {
    step: 2,
    title: "Choose Your Style",
    description: "Browse personalized hairstyle recommendations matched to your unique features and preferences.",
    icon: "Sparkles",
  },
  {
    step: 3,
    title: "Book & Arrive",
    description: "Book a verified stylist near you, pay securely, and walk in with confidence. It's that simple.",
    icon: "Calendar",
  },
];

// ─── FEATURES ────────────────────────────────────────
export const features = [
  {
    title: "AI Hairstyle Try-On",
    description: "See how any hairstyle looks on you before booking. Our AI overlay technology renders styles in real-time.",
    icon: "Sparkles",
  },
  {
    title: "Verified Stylists",
    description: "Every stylist is KYC-verified with professional credentials checked. Book with complete confidence.",
    icon: "Shield",
  },
  {
    title: "Hairline Restoration",
    description: "Access premium hairline treatments, track your progress, and connect with certified trichologists.",
    icon: "TrendingUp",
  },
  {
    title: "Live Crowd Intel",
    description: "Check salon occupancy in real-time. Know exactly when to visit for the best experience.",
    icon: "Users",
  },
];

// ─── CATEGORY FILTERS ────────────────────────────────
export const productCategories = [
  { value: "all", label: "All Products" },
  { value: "serum", label: "Serums & Oils" },
  { value: "shampoo", label: "Shampoos" },
  { value: "treatment", label: "Treatments & Masks" },
  { value: "supplement", label: "Supplements" },
  { value: "tool", label: "Tools" },
  { value: "other", label: "Other" },
];
