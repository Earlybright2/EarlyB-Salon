import { Routes, Route, useLocation } from "react-router";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import Navigation from "@/components/Navigation";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import AIChatbot from "@/components/AIChatbot";
import Home from "./pages/Home";
import About from "./pages/About";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Salons from "./pages/Salons";
import TryOn from "./pages/TryOn";
import Restore from "./pages/Restore";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import VerificationAdminDashboard from "./pages/Dashboard/VerificationAdminDashboard";
import FinanceAdminDashboard from "./pages/Dashboard/FinanceAdminDashboard";
import SupportAdminDashboard from "./pages/Dashboard/SupportAdminDashboard";
import ModerationAdminDashboard from "./pages/Dashboard/ModerationAdminDashboard";
import AuthLogin from "./pages/auth/AuthLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import Signup from "./pages/auth/Signup";
import Register from "./pages/auth/Register";
import Kyc from "./pages/auth/Kyc";
import BarberDashboard from "./pages/Dashboard/BarberDashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import StylistDashboard from "./pages/Dashboard/StylistDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
  const location = useLocation();
  const authRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/register",
    "/auth/kyc",
    "/auth/admin/login",
  ];
  const dashboardRoutes = [
    "/admin",
    "/barber/dashboard",
    "/stylist/dashboard",
    "/admin/verification",
    "/admin/finance",
    "/admin/support",
    "/admin/moderation",
  ];
  const hideShell =
    authRoutes.includes(location.pathname) ||
    dashboardRoutes.some((route) => location.pathname.startsWith(route));

  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen bg-ebs-bg">
          {!hideShell && <Navigation />}
          {!hideShell && <CartDrawer />}
          {!hideShell && <WishlistDrawer />}
          {!hideShell && <AIChatbot />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ProductDetail />} />
            <Route path="/salons" element={<Salons />} />
            <Route path="/salons/:id" element={<Salons />} />
            <Route path="/try-on" element={<TryOn />} />
            <Route path="/restore" element={<Restore />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/verification" element={<VerificationAdminDashboard />} />
            <Route path="/admin/finance" element={<FinanceAdminDashboard />} />
            <Route path="/admin/support" element={<SupportAdminDashboard />} />
            <Route path="/admin/moderation" element={<ModerationAdminDashboard />} />
            <Route path="/auth/login" element={<AuthLogin />} />
            <Route path="/auth/admin/login" element={<AdminLogin />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/kyc" element={<Kyc />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/barber/dashboard" element={<BarberDashboard />} />
            <Route path="/stylist/dashboard" element={<StylistDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
