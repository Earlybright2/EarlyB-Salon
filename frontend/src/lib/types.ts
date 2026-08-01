export type Role =
  | "user"
  | "admin"
  | "super_admin"
  | "verification_admin"
  | "finance_admin"
  | "support_admin"
  | "content_admin";

export interface User {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  role: Role;
  avatar?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  hairType?: string | null;
  faceShape?: string | null;
  hairlineStage?: number | null;
  skinTone?: number | null;
  authProvider?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  isSuspended?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  price: string;
  comparePrice?: string | null;
  stockQuantity?: number;
  sku?: string | null;
  photos?: string | null;
  ingredients?: string | null;
  usageGuide?: string | null;
  badge?: string | null;
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  averageRating?: string;
  totalReviews?: number;
  imageUrl?: string | null;
  createdAt?: string;
}

export interface Salon {
  id: number;
  ownerId?: number | null;
  businessName: string;
  description?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  coverPhoto?: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  workingHours?: Record<string, unknown> | null;
  isVerified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  averageRating?: string;
  totalReviews?: number;
  seatCapacity?: number;
  currentOccupancy?: number;
  busyPercentage?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Service {
  id: number;
  salonId?: number | null;
  stylistId?: number | null;
  name: string;
  description?: string | null;
  category?: string | null;
  minPrice: string;
  maxPrice?: string | null;
  durationMin?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Hairstyle {
  id: number;
  name: string;
  category?: string | null;
  genderTarget?: string;
  faceShapes?: string | null;
  hairTypes?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  trendScore?: number;
  isCelebrity?: boolean;
  celebrityName?: string | null;
  tags?: string | null;
  createdAt?: string;
}

export interface Stylist {
  id: number;
  userId?: number | null;
  displayName?: string | null;
  bio?: string | null;
  kycStatus?: string;
  kycSubmittedAt?: string | null;
  kycApprovedAt?: string | null;
  averageRating?: string;
  totalReviews?: number;
  totalEarnings?: string;
  subscriptionPlan?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface Appointment {
  id: number;
  bookingReference: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  userNotes?: string | null;
  scheduledAt?: string;
  createdAt?: string;
}

export interface Review {
  id: number;
  rating?: number | null;
  title?: string | null;
  body?: string | null;
  targetType?: string;
  targetId?: number | null;
  isVerified?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface Dashboard {
  totalUsers: number;
  totalSalons: number;
  totalBookings: number;
  totalProducts: number;
  pendingKyc: number;
  pendingDisputes: number;
  activeSubscriptions: number;
}

export interface TopSalon {
  id: number;
  name: string;
  city: string | null;
  rating: string;
  bookings: number;
}

export interface Transaction {
  id: number;
  amount: string;
  status: string;
  type: string;
  createdAt?: string;
}

export interface PlatformStats {
  weeklyBookings: number;
  activeUsers30d: number;
}

export interface Hero {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  isActive: boolean;
  order: number;
}
