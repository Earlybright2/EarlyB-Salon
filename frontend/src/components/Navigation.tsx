import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/salons", label: "Salons" },
  { href: "/try-on", label: "AI Try-On" },
  { href: "/restore", label: "Restore" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { totalItems: wishlistCount, setIsWishlistOpen } = useWishlist();
  const location = useLocation();
  const isAdmin = user?.role !== "user" && !!user?.role;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
            <Sparkles className="h-6 w-6 text-ebs-gold" />
            <span className="font-display text-xl md:text-2xl font-semibold tracking-tight text-ebs-text">
              Early <span className="text-ebs-gold">Bright</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-ebs-gold ${
                  location.pathname === link.href
                    ? "text-ebs-gold"
                    : "text-ebs-text-secondary"
                }`}
              >
                {link.label}
              </Link>
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

            {isAuthenticated ? (
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
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
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
                  <button
                    onClick={logout}
                    className="p-1.5 text-ebs-text-muted hover:text-ebs-error transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-ebs-bg bg-gradient-gold rounded-lg hover:shadow-gold transition-shadow"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
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
                        to="/login"
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
