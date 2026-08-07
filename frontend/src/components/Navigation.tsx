import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import {
  ShoppingBag,
  Heart,
  Menu,
  Sparkles,
  Search,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/about-us", label: "About" },
  { 
    href: "/shop", 
    label: "Shop",
    subLinks: [
      { href: "/shop", label: "All Products" },
      { href: "/shop?category=haircare", label: "Haircare" },
      { href: "/shop?category=tools", label: "Tools" },
    ]
  },
  { 
    href: "/salons", 
    label: "Salons",
    subLinks: [
      { href: "/salons", label: "Find Salons" },
      { href: "/salons/book", label: "Book Appointment" },
    ]
  },
  { href: "/try-on", label: "AI Try-On" },
  { href: "/restore", label: "Restore" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { totalItems: wishlistCount, setIsWishlistOpen } = useWishlist();
  const location = useLocation();
  const adminRoles = [
    "admin",
    "super_admin",
    "verification_admin",
    "finance_admin",
    "support_admin",
    "content_admin",
  ];
  const isAdmin = !!user?.role && adminRoles.includes(user.role);
  const userRole = user?.role as string | undefined;
  const dashboardPath = isAdmin
    ? "/admin"
    : userRole === "barber"
    ? "/barber/dashboard"
    : userRole === "stylist"
    ? "/stylist/dashboard"
    : "/";
  const profilePath = "/profile";
  const settingsPath = "/settings";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const openAvatarMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setAvatarMenuOpen(true);
  };

  const scheduleAvatarClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setAvatarMenuOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ebs-bg/95 backdrop-blur-xl border-b border-ebs-gold/10 shadow-dark"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-xl md:text-2xl font-semibold tracking-tight text-ebs-text">
              Early <span className="text-ebs-gold">Bright</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  to={link.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-ebs-gold py-4 ${
                    location.pathname === link.href || (link.subLinks && location.pathname.startsWith(link.href))
                      ? "text-ebs-gold"
                      : "text-ebs-text-secondary"
                  }`}
                >
                  {link.label}
                  {link.subLinks && <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />}
                </Link>
                {link.subLinks && (
                  <div className="absolute top-[80%] left-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left group-hover:translate-y-0 translate-y-2 z-50">
                    <div className="py-2 rounded-xl bg-ebs-bg/95 backdrop-blur-xl border border-ebs-gold/10 shadow-dark-lg">
                      {link.subLinks.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.href}
                          className="block px-4 py-2 text-sm text-ebs-text-secondary hover:text-ebs-gold hover:bg-ebs-gold/5 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <button className="hidden md:flex p-2 text-ebs-text-secondary hover:text-ebs-gold transition-colors">
              <Search className="h-5 w-5" />
            </button>

            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 text-ebs-text-secondary hover:text-ebs-rose transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-ebs-rose text-[10px] font-bold text-white flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-ebs-text-secondary hover:text-ebs-gold transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-ebs-gold text-[10px] font-bold text-ebs-bg flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {isLoading ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
                <div className="hidden xl:block h-4 w-24 rounded-full bg-white/10 animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="p-2 text-ebs-gold hover:text-ebs-gold-light transition-colors"
                    title="Admin Dashboard"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </Link>
                )}
                <DropdownMenu open={avatarMenuOpen} onOpenChange={setAvatarMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onMouseEnter={openAvatarMenu}
                      onMouseLeave={scheduleAvatarClose}
                      className="flex items-center gap-2 pl-2 border-l border-white/10 text-ebs-text-secondary hover:text-ebs-text transition-colors"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || "User"}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-ebs-gold/30"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-ebs-gold/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-ebs-gold" />
                        </div>
                      )}
                      <span className="text-sm text-ebs-text-secondary hidden xl:block">
                        {user?.name?.split(" ")[0] || "User"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onMouseEnter={openAvatarMenu}
                    onMouseLeave={scheduleAvatarClose}
                    className="w-64"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        to={profilePath}
                        className="block w-full rounded-xl px-4 py-2 text-sm font-medium text-ebs-text-secondary hover:bg-ebs-bg-elevated hover:text-ebs-text transition-colors"
                      >
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {!isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/auth/kyc"
                          className="block w-full rounded-xl px-4 py-2 text-sm font-medium text-ebs-text-secondary hover:bg-ebs-bg-elevated hover:text-ebs-text transition-colors"
                        >
                          KYC Status
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        to={dashboardPath}
                        className="block w-full rounded-xl px-4 py-2 text-sm font-medium text-ebs-text-secondary hover:bg-ebs-bg-elevated hover:text-ebs-text transition-colors"
                      >
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {!isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          to={settingsPath}
                          className="block w-full rounded-xl px-4 py-2 text-sm font-medium text-ebs-text-secondary hover:bg-ebs-bg-elevated hover:text-ebs-text transition-colors"
                        >
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-ebs-text-muted hover:text-ebs-error transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-ebs-text hover:text-ebs-gold transition-colors"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-ebs-bg bg-gradient-gold rounded-lg hover:shadow-gold transition-shadow"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-ebs-text-secondary hover:text-ebs-gold transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 bg-ebs-bg-card border-l border-ebs-gold/10 p-0"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-ebs-gold" />
                      <span className="font-display text-lg font-semibold">
                        Early <span className="text-ebs-gold">Bright</span>
                      </span>
                    </Link>
                  </div>
                  <div className="flex-1 py-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={`block px-6 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${
                          location.pathname === link.href
                            ? "text-ebs-gold bg-ebs-gold/5 border-l-2 border-ebs-gold"
                            : "text-ebs-text-secondary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-6 py-3 text-sm font-medium text-ebs-gold hover:bg-white/5"
                      >
                        <ShieldCheck className="inline h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                  <div className="p-6 border-t border-white/5">
                    {isAuthenticated ? (
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name || "User"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-ebs-gold/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-ebs-gold" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ebs-text">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-ebs-text-muted">
                            {user?.email || ""}
                          </p>
                        </div>
                        <button
                          onClick={logout}
                          className="p-2 text-ebs-text-muted hover:text-ebs-error transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Link
                        to="/auth/login"
                        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-ebs-bg bg-gradient-gold rounded-lg"
                      >
                        <User className="h-4 w-4" />
                        Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
