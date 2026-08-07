import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Scissors,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { getAdminDashboardPath } from "@/const";
import type {
  AdminAnalytics,
  Dashboard,
  PlatformStats,
  Product,
  ProductSale,
  RevenueStats,
  Salon,
  Stylist,
  TopSalon,
  User,
} from "@/lib/types";

type AdminTab = "dashboard" | "kyc" | "users" | "salons" | "products";

type UserFilter = "all" | "barber" | "stylist" | "admin";

const userFilters: { id: UserFilter; label: string }[] = [
  { id: "all", label: "All users" },
  { id: "barber", label: "Barbers" },
  { id: "stylist", label: "Stylists" },
  { id: "admin", label: "Admins" },
];

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "kyc", label: "KYC Approvals", icon: ShieldCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "salons", label: "Salons", icon: Scissors },
  { id: "products", label: "Products", icon: Package },
];

const adminRoles = [
  "admin",
  "super_admin",
  "verification_admin",
  "finance_admin",
  "support_admin",
  "content_admin",
];

// Muted, desaturated chart palette — avoids the neon-on-black look.
const chartColors = ["#C9A227", "#3E8E86", "#B5748A", "#4C7AB5", "#7A6BA8", "#B58A46", "#5A5A68"];

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? Number(value) || 0 : value;
  return `₦${Math.round(num).toLocaleString()}`;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function displayRole(role?: string) {
  if (!role) return "User";
  if (role === "barber" || role === "stylist") return role.charAt(0).toUpperCase() + role.slice(1);
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function splitName(name?: string | null) {
  const parts = (name ?? "Unknown").trim().split(/\s+/);
  return { first: parts[0] ?? "Unknown", last: parts.slice(1).join(" ") || "—" };
}

function initialsOf(name?: string | null) {
  return (name ?? "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleBadgeStyle(role?: string) {
  switch (role) {
    case "barber":
      return "border-ebs-teal/25 text-ebs-teal";
    case "stylist":
      return "border-ebs-rose/25 text-ebs-rose";
    case "admin":
    case "super_admin":
    case "verification_admin":
    case "finance_admin":
    case "support_admin":
    case "content_admin":
      return "border-ebs-gold/25 text-ebs-gold";
    default:
      return "border-white/10 text-ebs-text-secondary";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function tooltipStyle() {
  return {
    backgroundColor: "#131318",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#F5F5F0",
    fontSize: 12,
  } as const;
}

const labelStyle = { color: "#75758A" } as const;

// Flat surface, hairline border, no gradient wash, no blur — one consistent card type.
function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-white/10 bg-ebs-bg-card p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ebs-text">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

// Stat cards: a single-color left rule signals category instead of a
// gradient icon tile repeated four times across the row.
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentClass,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Users;
  accentClass: string;
  trend?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-white/10 border-l-2 bg-ebs-bg-card p-4 ${accentClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ebs-text-muted">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 text-ebs-text-muted" strokeWidth={1.75} />
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-ebs-text">
        {value}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] leading-4 text-ebs-text-muted">{sub}</p>
        {trend ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-ebs-success">
            <TrendingUp className="h-3 w-3" /> {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function KpiChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ebs-bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0 text-ebs-text-muted" strokeWidth={1.75} />
        <p className="truncate text-[11px] uppercase tracking-[0.14em] text-ebs-text-muted">
          {label}
        </p>
      </div>
      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ebs-text">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");

  const dashboardQuery = useApiQuery<Dashboard>("/api/admin/dashboard", ["admin", "dashboard"], {
    enabled: isAuthenticated,
  });
  const analyticsQuery = useApiQuery<AdminAnalytics>("/api/admin/analytics", ["admin", "analytics"], {
    enabled: isAuthenticated,
  });
  const revenueQuery = useApiQuery<RevenueStats>("/api/admin/revenue", ["admin", "revenue"], {
    enabled: isAuthenticated,
  });
  const platformStatsQuery = useApiQuery<PlatformStats>(
    "/api/admin/platform-stats",
    ["admin", "platform-stats"],
    { enabled: isAuthenticated },
  );
  const usersQuery = useApiQuery<User[]>("/api/admin/users", ["admin", "users"], {
    enabled: isAuthenticated,
  });
  const salonsQuery = useApiQuery<Salon[]>("/api/shop/salons", ["shop", "salons"], {
    enabled: isAuthenticated,
  });
  const productsQuery = useApiQuery<Product[]>("/api/shop/products", ["shop", "products"], {
    enabled: isAuthenticated,
  });
  const pendingKycQuery = useApiQuery<Stylist[]>("/api/admin/kyc/pending", ["admin", "kyc"], {
    enabled: isAuthenticated,
  });
  const disputesQuery = useApiQuery<unknown[]>("/api/admin/disputes", ["admin", "disputes"], {
    enabled: isAuthenticated,
  });
  const topSalonsQuery = useApiQuery<TopSalon[]>("/api/admin/top-salons", ["admin", "top-salons"], {
    enabled: isAuthenticated,
  });

  const kycMutation = useApiMutation<unknown, { id: number; approved: boolean }>(
    ({ id }) => `/api/admin/kyc/${id}/approve`,
    "post",
  );

  const isAdmin = Boolean(
    user && (user.isStaff || user.isSuperuser || adminRoles.includes(user.role)),
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      navigate("/");
      return;
    }
    const rolePath = getAdminDashboardPath(user?.role);
    if (rolePath !== "/admin") {
      navigate(rolePath);
    }
  }, [isLoading, isAdmin, user?.role, navigate]);

  const dashboard = dashboardQuery.data;
  const analytics = analyticsQuery.data;
  const platformStats = platformStatsQuery.data;

  const totalUsers = dashboard?.totalUsers ?? usersQuery.data?.length ?? 0;
  const totalSalons = dashboard?.totalSalons ?? salonsQuery.data?.length ?? 0;
  const totalBookings = dashboard?.totalBookings ?? 0;
  const pendingKyc = dashboard?.pendingKyc ?? pendingKycQuery.data?.length ?? 0;
  const pendingDisputes = dashboard?.pendingDisputes ?? disputesQuery.data?.length ?? 0;
  const activeSubscriptions = dashboard?.activeSubscriptions ?? 0;
  const dailyBookings = analytics?.dailyBookings ?? 0;
  const aiUsage = analytics?.aiUsage ?? 0;
  const activeUsers30d = platformStats?.activeUsers30d ?? 0;
  const weeklyBookings = platformStats?.weeklyBookings ?? 0;
  const totalRevenue = Number(revenueQuery.data?.totalRevenue ?? 0);
  const pendingPayouts = Number(revenueQuery.data?.pendingPayouts ?? 0);

  const bookingsByDay = analytics?.bookingsByDay ?? [];
  const monthlyRevenue = analytics?.monthlyRevenue ?? [];
  const productSales = analytics?.productSales?.length
    ? analytics.productSales
    : (productsQuery.data ?? [])
        .map<ProductSale>((product) => ({
          name: product.name,
          reviews: product.totalReviews ?? 0,
          price: product.price,
          stockQuantity: product.stockQuantity ?? 0,
          category: product.category,
          imageUrl: product.imageUrl,
        }))
        .sort((a, b) => b.reviews - a.reviews);
  const popularHairstyles = analytics?.popularHairstyles ?? [];
  const usersByRole = analytics?.usersByRole ?? [];
  const topSalons = useMemo(() => topSalonsQuery.data ?? [], [topSalonsQuery.data]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    const matchesFilter = (role: string) => {
      if (userFilter === "all") return true;
      if (userFilter === "admin") return adminRoles.includes(role);
      return role === userFilter;
    };
    return (usersQuery.data ?? []).filter((record) => {
      if (!matchesFilter(record.role)) return false;
      if (!query) return true;
      return `${record.name ?? ""} ${record.email ?? ""} ${record.role}`
        .toLowerCase()
        .includes(query);
    });
  }, [usersQuery.data, userSearch, userFilter]);

  const maxProductReviews = useMemo(
    () => Math.max(1, ...productSales.map((item) => item.reviews)),
    [productSales],
  );

  const maxBookings = useMemo(
    () => Math.max(1, ...topSalons.map((item) => item.bookings ?? 0)),
    [topSalons],
  );

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ebs-bg">
        <div className="flex flex-col items-center gap-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ebs-gold border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ebs-text-muted">
            Loading command center
          </p>
        </div>
      </div>
    );
  }

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="min-h-screen bg-ebs-bg text-ebs-text">
      {/* Faint structural grid only — no colored glow blobs. */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* ─────────────────────────── Sidebar ─────────────────────────── */}
        <aside className="shrink-0 border-b border-white/[0.06] bg-[#0C0C13] lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:w-[240px] lg:flex-col lg:border-b-0 lg:border-r">
          {/* Brand — wordmark only, no icon tile */}
          <div className="px-5 pb-3 pt-6">
            <p className="font-display text-base font-semibold leading-none tracking-[0.1em] text-ebs-text">
              EARLY BRIGHT
            </p>
            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.32em] text-ebs-gold">
              Admin Suite
            </p>
            <div className="mt-4 h-px w-8 bg-ebs-gold/40" />
          </div>

          {/* Nav */}
          <nav className="mt-2 flex gap-1 overflow-x-auto px-3 pb-2 lg:mt-4 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex shrink-0 items-center gap-2.5 border-l-2 px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "border-ebs-gold bg-white/[0.04] text-ebs-text"
                      : "border-transparent text-ebs-text-secondary hover:bg-white/[0.02] hover:text-ebs-text"
                  }`}
                >
                  <tab.icon
                    className={`h-4 w-4 ${active ? "text-ebs-gold" : "text-ebs-text-muted"}`}
                    strokeWidth={1.75}
                  />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User card + logout */}
          <div className="px-3 pb-4 pt-3 lg:mt-auto">
            <div className="rounded-lg border border-white/[0.08] p-3">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ebs-gold/30 font-display text-xs font-semibold text-ebs-gold">
                  {initialsOf(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ebs-text">
                    {user.name ?? "Admin User"}
                  </p>
                  <p className="truncate text-[11px] text-ebs-text-muted">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 text-ebs-text-muted transition hover:border-ebs-rose/40 hover:text-ebs-rose"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${roleBadgeStyle(user.role)}`}>
                  {displayRole(user.role)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-ebs-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-ebs-success" /> Online
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ─────────────────────────── Main ─────────────────────────── */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {/* Header */}
          <header className="mb-5 flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <activeTabMeta.icon className="h-5 w-5 text-ebs-gold" strokeWidth={1.75} />
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight text-ebs-text">
                  {activeTabMeta.label}
                </h1>
                <p className="mt-0.5 text-xs text-ebs-text-muted">
                  {new Date().toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ebs-text-secondary sm:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-ebs-success" /> Live
            </span>
          </header>

          {/* ═══════════════════════ DASHBOARD ═══════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              {/* Hero — flat panel, gold rule instead of glow */}
              <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-gold bg-ebs-bg-card p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-gold">
                      Command Center
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight text-ebs-text">
                      {greeting()}, {user.name?.split(" ")[0] ?? "Admin"}.
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-ebs-text-muted">
                      The entire Early Bright ecosystem at a glance — users, salons, revenue,
                      bookings, verifications and growth signals, all live.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-6">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">All-time bookings</p>
                        <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ebs-text">{formatNumber(totalBookings)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Revenue</p>
                        <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ebs-gold">{formatCurrency(totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Active (30d)</p>
                        <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ebs-teal">{formatNumber(activeUsers30d)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Primary stats */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total users"
                  value={formatNumber(totalUsers)}
                  sub="Every account ever created, tracked live."
                  icon={Users}
                  accentClass="border-l-ebs-gold"
                  trend="Live"
                />
                <StatCard
                  label="Total salons"
                  value={formatNumber(totalSalons)}
                  sub="Salons onboarded across the platform."
                  icon={Building2}
                  accentClass="border-l-ebs-teal"
                />
                <StatCard
                  label="Revenue analytics"
                  value={formatCurrency(totalRevenue)}
                  sub="Paid booking revenue recorded."
                  icon={Wallet}
                  accentClass="border-l-ebs-success"
                />
                <StatCard
                  label="Daily bookings"
                  value={formatNumber(dailyBookings)}
                  sub="New bookings created in the last 24 hours."
                  icon={Calendar}
                  accentClass="border-l-ebs-rose"
                />
              </section>

              {/* Secondary KPI chips */}
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiChip icon={ShieldCheck} label="Pending KYC" value={formatNumber(pendingKyc)} />
                <KpiChip icon={AlertTriangle} label="Pending disputes" value={formatNumber(pendingDisputes)} />
                <KpiChip icon={BadgeCheck} label="Active subscriptions" value={formatNumber(activeSubscriptions)} />
                <KpiChip icon={Sparkles} label="AI usage" value={formatNumber(aiUsage)} />
              </section>

              {/* Charts */}
              <section className="grid gap-4 xl:grid-cols-5">
                <Panel className="xl:col-span-3">
                  <SectionTitle
                    eyebrow="Performance"
                    title="Bookings this week"
                    action={
                      <span className="text-xs font-medium text-ebs-text-muted">
                        {weeklyBookings} this week
                      </span>
                    }
                  />
                  <div className="h-56">
                    {bookingsByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bookingsByDay} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                          <defs>
                            <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#C9A227" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="day" tick={{ fill: "#75758A", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#75758A", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={tooltipStyle()} labelStyle={labelStyle} cursor={{ stroke: "rgba(201,162,39,0.25)", strokeDasharray: "3 3" }} />
                          <Area type="monotone" dataKey="bookings" stroke="#C9A227" strokeWidth={2} fill="url(#bookingsFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-ebs-text-muted">
                        No booking data this week yet.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel className="xl:col-span-2">
                  <SectionTitle eyebrow="Distribution" title="Users by role" />
                  <div className="flex h-56 flex-col items-center justify-center">
                    {usersByRole.length > 0 ? (
                      <>
                        <div className="relative h-28 w-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={usersByRole}
                                dataKey="count"
                                nameKey="role"
                                innerRadius={36}
                                outerRadius={56}
                                paddingAngle={2}
                                stroke="none"
                              >
                                {usersByRole.map((entry, index) => (
                                  <Cell key={entry.role} fill={chartColors[index % chartColors.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle()} labelStyle={labelStyle} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <p className="font-mono text-lg font-semibold tabular-nums text-ebs-text">{formatNumber(totalUsers)}</p>
                            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-ebs-text-muted">Total</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                          {usersByRole.map((entry, index) => (
                            <span key={entry.role} className="inline-flex items-center gap-1.5 text-[11px] text-ebs-text-secondary">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                              {displayRole(entry.role)} · {formatNumber(entry.count)}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-ebs-text-muted">No user data yet.</div>
                    )}
                  </div>
                </Panel>
              </section>

              {/* Revenue + top salons */}
              <section className="grid gap-4 xl:grid-cols-5">
                <Panel className="xl:col-span-3">
                  <SectionTitle
                    eyebrow="Finance"
                    title="Monthly revenue"
                    action={
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5 text-ebs-success">
                          <DollarSign className="h-3.5 w-3.5" />
                          {formatCurrency(totalRevenue)} paid
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-ebs-warning">
                          <Clock className="h-3.5 w-3.5" />
                          {formatCurrency(pendingPayouts)} pending
                        </span>
                      </div>
                    }
                  />
                  <div className="h-56">
                    {monthlyRevenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "#75758A", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#75758A", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₦${Number(value) / 1000}k`} />
                          <Tooltip
                            contentStyle={tooltipStyle()}
                            labelStyle={labelStyle}
                            cursor={{ fill: "rgba(255,255,255,0.03)" }}
                            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                          />
                          <Bar dataKey="revenue" fill="#C9A227" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-ebs-text-muted">
                        No paid revenue recorded yet.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel className="xl:col-span-2">
                  <SectionTitle
                    eyebrow="Leaderboard"
                    title="Most booked salons"
                    action={<Award className="h-4 w-4 text-ebs-gold" strokeWidth={1.75} />}
                  />
                  <div className="space-y-3">
                    {topSalons.slice(0, 5).map((salon, index) => (
                      <div key={salon.id} className="border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="font-mono text-xs font-semibold tabular-nums text-ebs-text-muted">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ebs-text">{salon.name}</p>
                              <p className="truncate text-xs text-ebs-text-muted">{salon.city ?? "Unknown city"}</p>
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-ebs-gold">
                            {salon.bookings ?? 0}
                          </span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-ebs-gold transition-all duration-700"
                            style={{ width: `${((salon.bookings ?? 0) / maxBookings) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {topSalons.length === 0 && (
                      <div className="py-8 text-center text-sm text-ebs-text-muted">
                        No booking data yet.
                      </div>
                    )}
                  </div>
                </Panel>
              </section>

              {/* Hairstyles + product sales */}
              <section className="grid gap-4 xl:grid-cols-5">
                <Panel className="xl:col-span-2">
                  <SectionTitle
                    eyebrow="Trending"
                    title="Most popular hairstyles"
                    action={<Star className="h-4 w-4 text-ebs-gold" strokeWidth={1.75} />}
                  />
                  <div className="space-y-1">
                    {popularHairstyles.slice(0, 6).map((style) => (
                      <div key={style.id} className="flex items-center gap-3 border-b border-white/[0.05] py-2.5 last:border-0">
                        <Scissors className="h-4 w-4 shrink-0 text-ebs-text-muted" strokeWidth={1.75} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ebs-text">{style.name}</p>
                          <p className="truncate text-xs capitalize text-ebs-text-muted">
                            {style.category ?? "Hairstyle"} · {style.genderTarget ?? "unisex"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-ebs-gold">
                          <TrendingUp className="h-3 w-3" /> {style.trendScore}
                        </span>
                      </div>
                    ))}
                    {popularHairstyles.length === 0 && (
                      <div className="py-8 text-center text-sm text-ebs-text-muted">
                        No hairstyle data yet.
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel className="xl:col-span-3">
                  <SectionTitle
                    eyebrow="Commerce"
                    title="Product sales report"
                    action={
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ebs-text-muted">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        {formatNumber(productSales.length)} tracked
                      </span>
                    }
                  />
                  <div className="space-y-1">
                    {productSales.slice(0, 5).map((product) => (
                      <div key={product.name} className="flex items-center gap-4 border-b border-white/[0.05] py-3 last:border-0">
                        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-ebs-bg">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-ebs-text-muted" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ebs-text">{product.name}</p>
                          <p className="truncate text-xs capitalize text-ebs-text-muted">
                            {product.category ?? "General"} · {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div className="hidden w-36 shrink-0 sm:block">
                          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-ebs-text-muted">
                            <span>Sales</span>
                            <span className="font-mono tabular-nums">{formatNumber(product.reviews)}</span>
                          </div>
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-ebs-teal transition-all duration-700"
                              style={{ width: `${(product.reviews / maxProductReviews) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="hidden shrink-0 font-mono text-xs tabular-nums text-ebs-text-secondary md:inline-flex">
                          {formatNumber(product.stockQuantity)} in stock
                        </span>
                      </div>
                    ))}
                    {productSales.length === 0 && (
                      <div className="py-8 text-center text-sm text-ebs-text-muted">
                        No product data yet.
                      </div>
                    )}
                  </div>
                </Panel>
              </section>
            </div>
          )}

          {/* ═══════════════════════ KYC ═══════════════════════ */}
          {activeTab === "kyc" && (
            <div className="space-y-5">
              <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-warning bg-ebs-bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-warning">
                      Verification Desk
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ebs-text">
                      KYC approvals queue
                    </h2>
                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-ebs-text-muted">
                      Approve verified barbers and stylists so they can unlock their dashboard and
                      start serving clients. Rejected profiles are returned for resubmission.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <p className="font-mono text-3xl font-semibold tabular-nums text-ebs-warning">{pendingKyc}</p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-ebs-text-muted">Pending review</p>
                  </div>
                </div>
              </section>

              {pendingKycQuery.isLoading ? (
                <Panel className="flex items-center justify-center py-12 text-sm text-ebs-text-muted">
                  Loading verification requests...
                </Panel>
              ) : (pendingKycQuery.data ?? []).length === 0 ? (
                <Panel className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-ebs-success" strokeWidth={1.75} />
                  <p className="font-display text-lg font-medium text-ebs-text">All caught up</p>
                  <p className="text-sm text-ebs-text-muted">No pending KYC requests right now.</p>
                </Panel>
              ) : (
                <section className="grid gap-4 xl:grid-cols-2">
                  {(pendingKycQuery.data ?? []).map((item) => {
                    const processing = kycMutation.isPending && kycMutation.variables?.id === item.id;
                    const docs = [
                      { label: "Government ID", url: item.governmentIdUrl, icon: FileText },
                      { label: "Business Certificate", url: item.businessCertificateUrl, icon: BadgeCheck },
                      { label: "Utility Bill", url: item.utilityBillUrl, icon: FileText },
                      { label: "Salon Photo", url: item.salonPhotoUrl, icon: ImageIcon },
                    ];
                    return (
                      <div key={item.id} className="rounded-lg border border-white/10 bg-ebs-bg-card p-5">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ebs-gold/30 font-display text-sm font-semibold text-ebs-gold">
                            {initialsOf(item.displayName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-base font-semibold text-ebs-text">
                              {item.displayName ?? "Unknown"}
                            </p>
                            <p className="truncate text-xs text-ebs-text-muted">
                              Submitted {formatDate(item.kycSubmittedAt)}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-ebs-warning/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ebs-warning">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {docs.map((doc) => {
                            const available = Boolean(doc.url);
                            return (
                              <a
                                key={doc.label}
                                href={doc.url ?? "#"}
                                target={available ? "_blank" : undefined}
                                rel="noreferrer"
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
                                  available
                                    ? "border-white/10 text-ebs-text-secondary hover:border-ebs-gold/40 hover:text-ebs-gold"
                                    : "pointer-events-none border-white/[0.05] text-ebs-text-muted/60"
                                }`}
                              >
                                <doc.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                <span className="truncate">{doc.label}</span>
                                {available && <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0" />}
                              </a>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex items-center gap-2.5 border-t border-white/[0.06] pt-4">
                          <button
                            onClick={() => kycMutation.mutate({ id: item.id, approved: true })}
                            disabled={processing}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ebs-success/40 bg-ebs-success/10 px-4 py-2 text-sm font-semibold text-ebs-success transition hover:bg-ebs-success/20 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" strokeWidth={2.5} />
                            {processing ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => kycMutation.mutate({ id: item.id, approved: false })}
                            disabled={processing}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ebs-error/40 bg-ebs-error/10 px-4 py-2 text-sm font-semibold text-ebs-error transition hover:bg-ebs-error/20 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" strokeWidth={2.5} />
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}
            </div>
          )}

          {/* ═══════════════════════ USERS ═══════════════════════ */}
          {activeTab === "users" && (
            <div className="space-y-5">
              <Panel>
                <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">
                      Live registry
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-ebs-text">
                      {formatNumber(totalUsers)} users tracked
                    </h2>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-1 rounded-md border border-white/10 bg-ebs-bg p-1">
                    {userFilters.map((filter) => {
                      const active = userFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setUserFilter(filter.id)}
                          className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? "bg-ebs-gold text-black"
                              : "text-ebs-text-secondary hover:text-ebs-text"
                          }`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ebs-text-muted" />
                    <input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Search name, email or role..."
                      className="w-full rounded-md border border-white/10 bg-ebs-bg py-2 pl-9 pr-3 text-sm text-ebs-text outline-none transition placeholder:text-ebs-text-muted focus:border-ebs-gold/40"
                    />
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.16em] text-ebs-text-muted">
                        {["User", "First name", "Last name", "Email", "Role", "Joined"].map((title) => (
                          <th key={title} className="px-3 py-2.5 whitespace-nowrap">{title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((record) => {
                        const { first, last } = splitName(record.name);
                        return (
                          <tr key={record.id} className="border-b border-white/[0.05] transition hover:bg-white/[0.02]">
                            <td className="px-3 py-2.5">
                              <div className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 text-[10px] font-semibold text-ebs-gold">
                                {initialsOf(record.name)}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-medium text-ebs-text">{first}</td>
                            <td className="px-3 py-2.5 text-ebs-text-secondary">{last}</td>
                            <td className="px-3 py-2.5 text-ebs-text-secondary">{record.email ?? "—"}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${roleBadgeStyle(record.role)}`}>
                                {displayRole(record.role)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs tabular-nums text-ebs-text-muted">
                              {formatDate(record.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-12 text-center text-sm text-ebs-text-muted">
                            {userSearch ? "No users match your search." : "No users yet."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs text-ebs-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-ebs-success" />
                  Synced with the live user database — every signup is counted automatically.
                </p>
              </Panel>
            </div>
          )}

          {/* ═══════════════════════ SALONS ═══════════════════════ */}
          {activeTab === "salons" && (
            <div className="space-y-5">
              <SectionTitle
                eyebrow="Directory"
                title={`${formatNumber(totalSalons)} salons on the platform`}
              />
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(salonsQuery.data ?? []).map((salon) => (
                  <div
                    key={salon.id}
                    className="rounded-lg border border-white/10 bg-ebs-bg-card p-5 transition-colors duration-150 hover:border-ebs-gold/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Building2 className="h-5 w-5 text-ebs-text-muted" strokeWidth={1.75} />
                      <div className="flex gap-1.5">
                        {salon.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded border border-ebs-teal/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ebs-teal">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {salon.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded border border-ebs-gold/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ebs-gold">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-tight text-ebs-text">
                      {salon.businessName}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-ebs-text-muted">
                      {[salon.city, salon.state, salon.country].filter(Boolean).join(", ") || salon.address}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-ebs-text-secondary">
                      {salon.description ?? "No description available."}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ebs-text">
                        <Star className="h-3.5 w-3.5 fill-ebs-gold text-ebs-gold" />
                        {Number(salon.averageRating ?? 0).toFixed(1)}
                        <span className="text-xs font-normal text-ebs-text-muted">
                          · {salon.totalReviews ?? 0} reviews
                        </span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-ebs-text-secondary">
                        {salon.seatCapacity ?? "—"} seats
                      </span>
                    </div>
                  </div>
                ))}
                {(salonsQuery.data ?? []).length === 0 && (
                  <Panel className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <Building2 className="h-8 w-8 text-ebs-text-muted" strokeWidth={1.75} />
                    <p className="text-sm text-ebs-text-muted">No salons have been created yet.</p>
                  </Panel>
                )}
              </section>
            </div>
          )}

          {/* ═══════════════════════ PRODUCTS ═══════════════════════ */}
          {activeTab === "products" && (
            <div className="space-y-5">
              <SectionTitle
                eyebrow="Inventory"
                title={`${formatNumber((productsQuery.data ?? []).length)} products on the platform`}
              />
              <Panel>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.16em] text-ebs-text-muted">
                        {["Product", "Category", "Price", "Stock", "Rating"].map((title) => (
                          <th key={title} className="px-3 py-2.5 whitespace-nowrap">{title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(productsQuery.data ?? []).map((product) => (
                        <tr key={product.id} className="border-b border-white/[0.05] transition hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-ebs-bg">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-4 w-4 text-ebs-text-muted" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-ebs-text">{product.name}</p>
                                {product.sku && (
                                  <p className="font-mono text-[11px] text-ebs-text-muted">{product.sku}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 capitalize text-ebs-text-secondary">
                            {product.category ?? "General"}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-medium tabular-nums text-ebs-gold">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded border px-2 py-0.5 font-mono text-xs font-medium tabular-nums ${
                                (product.stockQuantity ?? 0) === 0
                                  ? "border-ebs-error/30 text-ebs-error"
                                  : (product.stockQuantity ?? 0) < 10
                                    ? "border-ebs-warning/30 text-ebs-warning"
                                    : "border-ebs-success/30 text-ebs-success"
                              }`}
                            >
                              {product.stockQuantity ?? 0} units
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 text-ebs-text-secondary">
                              <Star className="h-3.5 w-3.5 fill-ebs-gold text-ebs-gold" />
                              <span className="font-mono tabular-nums">{Number(product.averageRating ?? 0).toFixed(1)}</span>
                              <span className="font-mono text-xs tabular-nums text-ebs-text-muted">
                                ({product.totalReviews ?? 0})
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(productsQuery.data ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-12 text-center text-sm text-ebs-text-muted">
                            No products have been created yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}