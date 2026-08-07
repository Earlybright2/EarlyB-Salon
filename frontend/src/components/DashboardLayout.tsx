import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  LayoutDashboard,
  CalendarDays,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type DashboardNavItem = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path?: string;
};

const DASHBOARD_NAV: DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "#overview" },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "kyc", label: "KYC Status", icon: ShieldCheck, path: "/auth/kyc" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function DashboardLayout({
  title,
  subtitle,
  activeTab,
  onTabChange,
  children,
}: {
  title: string;
  subtitle: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (item: DashboardNavItem) => {
    setMobileOpen(false);
    if (item.path) {
      navigate(item.path);
    } else {
      onTabChange(item.id);
    }
  };

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-ebs-bg lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-white/5 bg-ebs-bg-card/50">
        <div className="px-6 py-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full border border-ebs-gold" />
            <span className="font-display text-lg font-semibold tracking-wide text-ebs-text">
              Early <span className="text-ebs-gold">Bright</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {DASHBOARD_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === item.id
                  ? "bg-ebs-gold/10 text-ebs-gold border-l-2 border-ebs-gold"
                  : "text-ebs-text-secondary hover:bg-white/5 hover:text-ebs-text",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 space-y-1 border-t border-white/5">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ebs-text-secondary hover:bg-white/5 hover:text-ebs-text transition-all"
          >
            <Home className="h-5 w-5 shrink-0" />
            Back to Site
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ebs-text-muted hover:bg-ebs-error/10 hover:text-ebs-error transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-ebs-bg-card/95 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full border border-ebs-gold" />
          <span className="font-display text-base font-semibold tracking-wide text-ebs-text">
            Early <span className="text-ebs-gold">Bright</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-ebs-text-secondary hover:text-ebs-gold transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-30 bg-ebs-bg/95 backdrop-blur-xl pt-16">
          <nav className="px-4 space-y-1">
            {DASHBOARD_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === item.id
                    ? "bg-ebs-gold/10 text-ebs-gold border-l-2 border-ebs-gold"
                    : "text-ebs-text-secondary hover:bg-white/5 hover:text-ebs-text",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ebs-text-secondary hover:bg-white/5 hover:text-ebs-text transition-all"
            >
              <Home className="h-5 w-5" />
              Back to Site
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ebs-text-muted hover:bg-ebs-error/10 hover:text-ebs-error transition-all"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </nav>
        </div>
      ) : null}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        <header className="hidden lg:flex items-center justify-between px-10 py-6 border-b border-white/5">
          <div>
            <h1 className="font-display text-2xl text-ebs-text">{title}</h1>
            <p className="text-sm text-ebs-text-muted mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ebs-gold/20 text-sm font-semibold text-ebs-gold">
              {initials || "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-ebs-text">{user?.name || "User"}</p>
              <p className="text-xs text-ebs-text-muted">{user?.email || ""}</p>
            </div>
          </div>
        </header>

        <div className="lg:hidden px-4 pt-6 pb-2">
          <h1 className="font-display text-xl text-ebs-text">{title}</h1>
          <p className="text-sm text-ebs-text-muted mt-1">{subtitle}</p>
        </div>

        <div className="p-4 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
