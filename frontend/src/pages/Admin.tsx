import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import type {
  Dashboard,
  PlatformStats,
  Product,
  Review,
  Salon,
  TopSalon,
  Transaction,
  User,
} from "@/lib/types";
import {
  Users, ShoppingBag, Calendar,
  Star, ShieldCheck, AlertTriangle, ChevronRight, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity, UserCheck, Scissors,
  Package, CreditCard, FileText, MessageSquare,
  Settings, Image as ImageIcon, CheckCircle2,
  XCircle, Search, Eye, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminRole =
  | "super_admin" | "verification_admin" | "finance_admin"
  | "support_admin" | "content_admin";

type TabId =
  | "overview" | "users" | "stylists" | "salons" | "products"
  | "kyc" | "transactions" | "disputes" | "reviews"
  | "analytics" | "subscriptions" | "ads" | "settings";

interface SidebarItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  roles: AdminRole[];
}

const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["super_admin", "verification_admin", "finance_admin", "support_admin", "content_admin"] },
  { id: "users", label: "Users", icon: <Users className="h-5 w-5" />, roles: ["super_admin"] },
  { id: "stylists", label: "Stylists", icon: <UserCheck className="h-5 w-5" />, roles: ["super_admin"] },
  { id: "salons", label: "Salons", icon: <Scissors className="h-5 w-5" />, roles: ["super_admin", "verification_admin"] },
  { id: "products", label: "Products", icon: <Package className="h-5 w-5" />, roles: ["super_admin"] },
  { id: "kyc", label: "KYC Reviews", icon: <ShieldCheck className="h-5 w-5" />, roles: ["verification_admin", "super_admin"] },
  { id: "transactions", label: "Transactions", icon: <CreditCard className="h-5 w-5" />, roles: ["finance_admin", "super_admin"] },
  { id: "disputes", label: "Disputes", icon: <AlertTriangle className="h-5 w-5" />, roles: ["support_admin", "super_admin"] },
  { id: "reviews", label: "Reviews", icon: <MessageSquare className="h-5 w-5" />, roles: ["content_admin", "super_admin"] },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" />, roles: ["super_admin", "finance_admin"] },
  { id: "subscriptions", label: "Subscriptions", icon: <Star className="h-5 w-5" />, roles: ["super_admin", "finance_admin"] },
  { id: "ads", label: "Advertisements", icon: <ImageIcon className="h-5 w-5" />, roles: ["super_admin"] },
  { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" />, roles: ["super_admin"] },
];

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    verification_admin: "Verification Admin",
    finance_admin: "Finance Admin",
    support_admin: "Support Admin",
    content_admin: "Content Admin",
    admin: "Admin",
    user: "User",
  };
  return labels[role] || role;
}

function roleBadgeColor(role: string): string {
  if (role === "super_admin") return "bg-purple-500/10 text-purple-400";
  if (role.includes("admin")) return "bg-ebs-gold/10 text-ebs-gold";
  return "bg-blue-500/10 text-blue-400";
}

function statusBadge(status: string, trueColor = "bg-ebs-success/10 text-ebs-success", falseColor = "bg-ebs-warning/10 text-ebs-warning") {
  const ok = status === "active" || status === "approved" || status === "verified" || status === "true" || status === "1";
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full ${ok ? trueColor : falseColor}`}>
      {status}
    </span>
  );
}

function StatCard({ title, value, change, trend, icon, color }: {
  title: string; value: string; change: string; trend: "up" | "down"; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6 hover:border-ebs-gold/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === "up" ? "bg-ebs-success/10 text-ebs-success" : "bg-ebs-error/10 text-ebs-error"}`}>
          {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
      </div>
      <p className="text-sm text-ebs-text-muted mb-1">{title}</p>
      <p className="text-2xl font-bold text-ebs-text">{value}</p>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || "overview");

  const currentRole = user?.role as AdminRole | undefined;
  const allowedTabs = sidebarItems
    .filter((item) => currentRole && item.roles.includes(currentRole))
    .map((item) => item.id);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.role || user.role === "user")) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab && allowedTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!allowedTabs.includes(activeTab) && allowedTabs.length > 0) {
      setActiveTab(allowedTabs[0]);
    }
  }, [activeTab, allowedTabs]);

  const updateTab = (tab: TabId) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const dashboard = useApiQuery<Dashboard>("/api/admin/dashboard", ["admin", "dashboard"], {
    enabled: isAuthenticated && allowedTabs.includes("overview"),
  });
  const platformStats = useApiQuery<PlatformStats>(
    "/api/admin/platform-stats",
    ["admin", "platform-stats"],
    { enabled: isAuthenticated && allowedTabs.includes("overview") },
  );
  const topSalons = useApiQuery<TopSalon[]>("/api/admin/top-salons", ["admin", "top-salons"], {
    enabled: isAuthenticated && allowedTabs.includes("overview"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ebs-bg flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-ebs-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.role || user.role === "user") return null;

  const visibleItems = sidebarItems.filter((item) => currentRole && item.roles.includes(currentRole));

  return (
    <div className="min-h-screen bg-ebs-bg pt-20">
      <div className="flex">
        <aside className="hidden lg:block w-64 fixed h-full border-r border-white/5 bg-ebs-bg-card/30 pt-6 overflow-y-auto">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-ebs-gold" />
              <span className="font-display text-lg font-semibold text-ebs-text">
                Admin <span className="text-ebs-gold">Panel</span>
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-ebs-bg">
              <div className={`h-2 w-2 rounded-full ${roleBadgeColor(user.role)}`} />
              <span className="text-xs text-ebs-text-muted">{roleLabel(user.role)}</span>
            </div>
          </div>
          <nav className="px-3 space-y-1">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => updateTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-ebs-gold/10 text-ebs-gold border-l-2 border-ebs-gold"
                    : "text-ebs-text-secondary hover:bg-white/5 hover:text-ebs-text"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 lg:ml-64 p-6 lg:p-10">
          <div className="lg:hidden flex gap-2 overflow-x-auto mb-6 scrollbar-hide pb-2">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => updateTab(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === item.id
                    ? "bg-ebs-gold text-ebs-bg"
                    : "bg-ebs-bg-card text-ebs-text-secondary border border-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl text-ebs-text">
                {visibleItems.find((i) => i.id === activeTab)?.label || "Admin"}
              </h1>
              <p className="text-sm text-ebs-text-muted">
                {roleLabel(user.role)} · Welcome back, {user?.name?.split(" ")[0] || "Admin"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-ebs-text-muted">
              <Activity className="h-4 w-4 text-ebs-teal" />
              Live
            </div>
          </div>

          {/* ─── OVERVIEW ─────────────────────────────── */}
          {activeTab === "overview" && <OverviewTab dashboard={dashboard.data} platformStats={platformStats.data} topSalons={topSalons.data} />}

          {/* ─── USERS ────────────────────────────────── */}
          {activeTab === "users" && <UsersTab />}

          {/* ─── STYLISTS ─────────────────────────────── */}
          {activeTab === "stylists" && <StylistsTab />}

          {/* ─── SALONS ───────────────────────────────── */}
          {activeTab === "salons" && <SalonsTab />}

          {/* ─── PRODUCTS ─────────────────────────────── */}
          {activeTab === "products" && <ProductsTab />}

          {/* ─── KYC ──────────────────────────────────── */}
          {activeTab === "kyc" && <KycTab />}

          {/* ─── TRANSACTIONS ─────────────────────────── */}
          {activeTab === "transactions" && <TransactionsTab />}

          {/* ─── DISPUTES ─────────────────────────────── */}
          {activeTab === "disputes" && <DisputesTab />}

          {/* ─── REVIEWS ──────────────────────────────── */}
          {activeTab === "reviews" && <ReviewsTab />}

          {/* ─── ANALYTICS ────────────────────────────── */}
          {activeTab === "analytics" && <AnalyticsTab />}

          {/* ─── SUBSCRIPTIONS ────────────────────────── */}
          {activeTab === "subscriptions" && <SubscriptionsTab />}

          {/* ─── ADS ──────────────────────────────────── */}
          {activeTab === "ads" && <AdsTab />}

          {/* ─── SETTINGS ─────────────────────────────── */}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────
function OverviewTab({ dashboard, platformStats, topSalons }: {
  dashboard: any; platformStats: any; topSalons: any;
}) {
  return (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={dashboard?.totalUsers?.toLocaleString() ?? "—"} change="Today" trend="up" icon={<Users className="h-5 w-5 text-blue-400" />} color="bg-blue-500/10" />
        <StatCard title="Active Salons" value={dashboard?.totalSalons?.toLocaleString() ?? "—"} change="Live" trend="up" icon={<Scissors className="h-5 w-5 text-ebs-teal" />} color="bg-ebs-teal/10" />
        <StatCard title="Total Bookings" value={dashboard?.totalBookings?.toLocaleString() ?? "—"} change="All time" trend="up" icon={<Calendar className="h-5 w-5 text-ebs-rose" />} color="bg-ebs-rose/10" />
        <StatCard title="Products" value={dashboard?.totalProducts?.toLocaleString() ?? "—"} change="Inventory" trend="up" icon={<Package className="h-5 w-5 text-ebs-gold" />} color="bg-ebs-gold/10" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
          <h3 className="font-display text-lg text-ebs-text mb-4">Top Salons</h3>
          <div className="space-y-3">
            {topSalons && topSalons.length > 0 ? topSalons.slice(0, 5).map((salon: any, i: number) => (
              <div key={salon.id} className="flex items-center gap-4 p-3 rounded-lg bg-ebs-bg">
                <span className="text-sm font-bold text-ebs-gold w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ebs-text">{salon.name}</p>
                  <p className="text-xs text-ebs-text-muted">{salon.city || "—"} · {salon.bookings ?? 0} bookings</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                  <span className="text-sm text-ebs-text">{Number(salon.rating).toFixed(1)}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-ebs-text-muted py-8 text-center">No salon data yet</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
          <h3 className="font-display text-lg text-ebs-text mb-4">Pending Actions</h3>
          <div className="space-y-4">
            {[
              { label: "KYC Reviews", count: dashboard?.pendingKyc ?? 0, color: "text-ebs-warning", tab: "kyc" },
              { label: "Disputes", count: dashboard?.pendingDisputes ?? 0, color: "text-ebs-error", tab: "disputes" },
              { label: "Weekly Bookings", count: platformStats?.weeklyBookings ?? 0, color: "text-ebs-teal" },
              { label: "Active (30d)", count: platformStats?.activeUsers30d ?? 0, color: "text-ebs-rose" },
            ].map((action) => (
              <div key={action.label} className="flex items-center justify-between p-3 rounded-lg bg-ebs-bg hover:bg-ebs-bg-elevated transition-colors cursor-pointer">
                <span className="text-sm text-ebs-text-secondary">{action.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${action.color}`}>{action.count}</span>
                  <ChevronRight className="h-4 w-4 text-ebs-text-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── USERS TAB ────────────────────────────────────────
function UsersTab() {
  const { data: allUsers, isLoading } = useApiQuery<User[]>("/api/admin/users", ["admin", "users"]);
  const updateRole = useApiMutation<{ success: boolean }, { userId: number; role: string }>(
    ({ userId }) => `/api/admin/users/${userId}/role`,
    "patch",
  );
  const suspendUser = useApiMutation<{ success: boolean }, { userId: number; suspended: boolean }>(
    ({ userId }) => `/api/admin/users/${userId}/suspend`,
    "post",
  );
  const [search, setSearch] = useState("");

  const filtered = allUsers?.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="font-display text-lg text-ebs-text">All Users</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ebs-text-muted" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm bg-ebs-bg border border-white/10 rounded-lg text-ebs-text placeholder:text-ebs-text-muted outline-none focus:border-ebs-gold/50"
            />
          </div>
          <Button size="sm" className="bg-ebs-gold text-ebs-bg hover:bg-ebs-gold-light shrink-0">
            <FileText className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">Loading...</td></tr>
            ) : filtered?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">No users found</td></tr>
            ) : filtered?.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-ebs-gold/20 flex items-center justify-center text-sm font-bold text-ebs-gold">
                      {u.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ebs-text">{u.name || "Unnamed"}</p>
                      <p className="text-xs text-ebs-text-muted">{u.email || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${roleBadgeColor(u.role)}`}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.isSuspended ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-ebs-error/10 text-ebs-error">Suspended</span>
                  ) : u.isVerified ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-ebs-success/10 text-ebs-success">Verified</span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-ebs-warning/10 text-ebs-warning">Unverified</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as any })}
                      className="text-xs bg-ebs-bg border border-white/10 rounded-lg px-2 py-1.5 text-ebs-text-secondary outline-none"
                    >
                      <option value="user">User</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="verification_admin">Verification Admin</option>
                      <option value="finance_admin">Finance Admin</option>
                      <option value="support_admin">Support Admin</option>
                      <option value="content_admin">Content Admin</option>
                    </select>
                    <button
                      onClick={() => suspendUser.mutate({ userId: u.id, suspended: !u.isSuspended })}
                      className={`text-xs px-2 py-1 rounded-lg border ${u.isSuspended ? "border-ebs-success/30 text-ebs-success hover:bg-ebs-success/10" : "border-ebs-error/30 text-ebs-error hover:bg-ebs-error/10"}`}
                    >
                      {u.isSuspended ? "Restore" : "Suspend"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── STYLISTS TAB ─────────────────────────────────────
function StylistsTab() {
  const { data: stylistsData, isLoading } = useApiQuery<any[]>("/api/admin/stylists", ["admin", "stylists"]);
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-display text-lg text-ebs-text">All Stylists</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Name", "KYC Status", "Rating", "Earnings", "Plan", "Featured"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-ebs-text-muted text-sm">Loading...</td></tr>
            ) : !stylistsData || stylistsData.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-ebs-text-muted text-sm">No stylists registered</td></tr>
            ) : stylistsData.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-ebs-text">{s.displayName || "—"}</td>
                <td className="px-6 py-4">{statusBadge(s.kycStatus)}</td>
                <td className="px-6 py-4 text-sm text-ebs-text">{Number(s.averageRating).toFixed(1)}</td>
                <td className="px-6 py-4 text-sm text-ebs-gold">₦{Number(s.totalEarnings).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-ebs-text-secondary capitalize">{s.subscriptionPlan}</td>
                <td className="px-6 py-4">{s.isFeatured ? <CheckCircle2 className="h-4 w-4 text-ebs-success" /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SALONS TAB ───────────────────────────────────────
function SalonsTab() {
  const { data: salonsData } = useApiQuery<Salon[]>("/api/shop/salons", ["shop", "salons"]);
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display text-lg text-ebs-text">All Salons</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-ebs-warning/30 text-ebs-warning hover:bg-ebs-warning/10">
            <AlertTriangle className="h-4 w-4 mr-2" /> Pending
          </Button>
          <Button size="sm" className="bg-ebs-teal text-white hover:bg-ebs-teal-light">
            <ShieldCheck className="h-4 w-4 mr-2" /> Verified
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Salon", "Location", "Rating", "Status", "Capacity"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salonsData && salonsData.length > 0 ? salonsData.map((s: any) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-ebs-text">{s.businessName}</td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">{s.city || s.address || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                    <span className="text-sm text-ebs-text">{Number(s.averageRating).toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{s.isVerified ? statusBadge("verified") : statusBadge("unverified", "bg-ebs-warning/10 text-ebs-warning", "bg-ebs-warning/10 text-ebs-warning")}</td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">{s.seatCapacity ?? "—"} seats</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">No salons yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PRODUCTS TAB ─────────────────────────────────────
function ProductsTab() {
  const { data: productsData } = useApiQuery<Product[]>("/api/shop/products", ["shop", "products"]);
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display text-lg text-ebs-text">Products</h3>
        <Button size="sm" className="bg-ebs-gold text-ebs-bg hover:bg-ebs-gold-light">
          <ShoppingBag className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Product", "Category", "Price", "Stock", "Rating"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productsData && productsData.length > 0 ? productsData.map((p: any) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-ebs-text">{p.name}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-ebs-bg text-ebs-text-secondary capitalize">{p.category}</span>
                </td>
                <td className="px-6 py-4 text-sm text-ebs-gold font-medium">₦{Number(p.price).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${p.stockQuantity < 30 ? "text-ebs-warning" : "text-ebs-success"}`}>
                    {p.stockQuantity} units
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                    <span className="text-sm text-ebs-text">{Number(p.averageRating).toFixed(1)}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">No products yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── KYC TAB ──────────────────────────────────────────
function KycTab() {
  const { data: pendingKyc, isLoading } = useApiQuery<any[]>("/api/admin/kyc/pending", ["admin", "kyc"]);
  const approveKyc = useApiMutation<{ success: boolean }, { stylistId: number; approved: boolean }>(
    ({ stylistId }) => `/api/admin/kyc/${stylistId}/approve`,
    "post",
  );

  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-display text-lg text-ebs-text">KYC Verification Requests</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Stylist", "Status", "Submitted", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-12 text-ebs-text-muted text-sm">Loading...</td></tr>
            ) : !pendingKyc || pendingKyc.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-ebs-text-muted text-sm">No pending KYC requests</td></tr>
            ) : pendingKyc.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-ebs-text">{s.displayName || "—"}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-ebs-warning/10 text-ebs-warning">{s.kycStatus}</span>
                </td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">
                  {s.kycSubmittedAt ? new Date(s.kycSubmittedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveKyc.mutate({ stylistId: s.id, approved: true })}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-ebs-success/10 text-ebs-success hover:bg-ebs-success/20 transition-colors"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => approveKyc.mutate({ stylistId: s.id, approved: false })}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-ebs-error/10 text-ebs-error hover:bg-ebs-error/20 transition-colors"
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-ebs-bg text-ebs-text-secondary border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1">
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS TAB ─────────────────────────────────
function TransactionsTab() {
  const { data: transactions, isLoading } = useApiQuery<Transaction[]>("/api/admin/transactions", ["admin", "transactions"]);

  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-display text-lg text-ebs-text">Recent Transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["ID", "Amount", "Status", "Type", "Date"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">Loading...</td></tr>
            ) : !transactions || transactions.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">No transactions yet</td></tr>
            ) : transactions.map((t: any) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm text-ebs-text-muted">#{t.id}</td>
                <td className="px-6 py-4 text-sm text-ebs-gold font-medium">₦{Number(t.amount).toLocaleString()}</td>
                <td className="px-6 py-4">{statusBadge(t.status)}</td>
                <td className="px-6 py-4 text-sm text-ebs-text-secondary capitalize">{t.type}</td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DISPUTES TAB ─────────────────────────────────────
function DisputesTab() {
  const { data: disputes, isLoading } = useApiQuery<any[]>("/api/admin/disputes", ["admin", "disputes"]);
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-display text-lg text-ebs-text">Booking Disputes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Reference", "Amount", "Status", "Payment", "Date"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">Loading...</td></tr>
            ) : !disputes || disputes.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">No pending disputes</td></tr>
            ) : disputes.map((d) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-ebs-text">{d.bookingReference}</td>
                <td className="px-6 py-4 text-sm text-ebs-gold font-medium">₦{Number(d.totalAmount).toLocaleString()}</td>
                <td className="px-6 py-4">{statusBadge(d.status)}</td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-ebs-error/10 text-ebs-error">{d.paymentStatus}</span>
                </td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">
                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REVIEWS TAB ──────────────────────────────────────
function ReviewsTab() {
  const { data: flaggedReviews, isLoading } = useApiQuery<Review[]>("/api/admin/reviews", ["admin", "reviews"]);
  const moderateReview = useApiMutation<{ success: boolean }, { reviewId: number; verified: boolean }>(
    ({ reviewId }) => `/api/admin/reviews/${reviewId}/moderate`,
    "post",
  );

  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-display text-lg text-ebs-text">Reviews & Moderation</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Review", "Rating", "Target", "Date", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-ebs-text-muted uppercase tracking-wider px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">Loading...</td></tr>
            ) : !flaggedReviews || flaggedReviews.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-ebs-text-muted text-sm">No reviews to moderate</td></tr>
            ) : flaggedReviews.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-ebs-text">{r.title || "Untitled"}</p>
                  <p className="text-xs text-ebs-text-muted line-clamp-1">{r.body || "—"}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                    <span className="text-sm text-ebs-text">{r.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-ebs-text-secondary capitalize">{r.targetType}</td>
                <td className="px-6 py-4 text-sm text-ebs-text-muted">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moderateReview.mutate({ reviewId: r.id, verified: true })}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-ebs-success/10 text-ebs-success hover:bg-ebs-success/20 transition-colors"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => moderateReview.mutate({ reviewId: r.id, verified: false })}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-ebs-error/10 text-ebs-error hover:bg-ebs-error/20 transition-colors"
                    >
                      <XCircle className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────
function AnalyticsTab() {
  const { data: platformStats } = useApiQuery<PlatformStats>("/api/admin/platform-stats", ["admin", "platform-stats"]);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
        <h3 className="font-display text-lg text-ebs-text mb-6">Platform Analytics</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Weekly Bookings", value: platformStats?.weeklyBookings?.toLocaleString() ?? "—", change: "" },
            { label: "Active Users (30d)", value: platformStats?.activeUsers30d?.toLocaleString() ?? "—", change: "" },
            { label: "AI Try-On Usage", value: "—", change: "" },
            { label: "Salon Onboarding", value: "—/mo", change: "" },
            { label: "Product Sales", value: "—", change: "" },
            { label: "Avg. Booking Value", value: "—", change: "" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-ebs-bg border border-white/5">
              <p className="text-xs text-ebs-text-muted mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-ebs-text">{stat.value}</p>
              {stat.change && <p className="text-xs text-ebs-success">{stat.change}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTIONS TAB ────────────────────────────────
function SubscriptionsTab() {
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
      <h3 className="font-display text-lg text-ebs-text mb-6">Subscription Management</h3>
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { plan: "Free", color: "text-ebs-text-muted", border: "border-ebs-text-muted/20" },
          { plan: "Pro", color: "text-ebs-gold", border: "border-ebs-gold/30" },
          { plan: "Enterprise", color: "text-purple-400", border: "border-purple-400/30" },
        ].map((p) => (
          <div key={p.plan} className={`rounded-xl bg-ebs-bg border ${p.border} p-6`}>
            <h4 className={`font-display text-lg font-semibold ${p.color}`}>{p.plan}</h4>
            <p className="text-3xl font-bold text-ebs-text mt-2">
              {p.plan === "Free" ? "₦0" : p.plan === "Pro" ? "₦15K" : "₦50K"}
              <span className="text-sm font-normal text-ebs-text-muted">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ebs-text-secondary">
              {p.plan === "Free" && <> <li>Basic profile</li> <li>Up to 5 bookings/mo</li> <li>Standard support</li> </>}
              {p.plan === "Pro" && <> <li>Featured listing</li> <li>Unlimited bookings</li> <li>Priority support</li> <li>Analytics dashboard</li> </>}
              {p.plan === "Enterprise" && <> <li>Everything in Pro</li> <li>Dedicated account manager</li> <li>Custom integrations</li> <li>White-label options</li> </>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADS TAB ──────────────────────────────────────────
function AdsTab() {
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
      <h3 className="font-display text-lg text-ebs-text mb-4">Advertisements</h3>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="h-12 w-12 text-ebs-text-muted mb-4" />
        <p className="text-ebs-text-secondary text-sm">Ad management coming soon</p>
        <p className="text-ebs-text-muted text-xs mt-1">Create and manage platform advertisements</p>
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────
function SettingsTab() {
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
      <h3 className="font-display text-lg text-ebs-text mb-4">Platform Settings</h3>
      <div className="space-y-6">
        {[
          { label: "Maintenance Mode", desc: "Disable public access during maintenance" },
          { label: "Stylist Auto-Approval", desc: "Automatically approve new stylist registrations" },
          { label: "AI Recommendations", desc: "Enable AI-powered hairstyle recommendations" },
          { label: "Email Notifications", desc: "Send transactional emails to users" },
        ].map((setting) => (
          <div key={setting.label} className="flex items-center justify-between p-4 rounded-xl bg-ebs-bg border border-white/5">
            <div>
              <p className="text-sm font-medium text-ebs-text">{setting.label}</p>
              <p className="text-xs text-ebs-text-muted">{setting.desc}</p>
            </div>
            <div className="h-6 w-11 rounded-full bg-ebs-gold/30 relative cursor-pointer">
              <div className="h-5 w-5 rounded-full bg-ebs-gold absolute top-0.5 right-0.5 shadow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
