import { Routes, Route } from "react-router";
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
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen bg-ebs-bg">
          <Navigation />
          <CartDrawer />
          <WishlistDrawer />
          <AIChatbot />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<About />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ProductDetail />} />
            <Route path="/salons" element={<Salons />} />
            <Route path="/salons/:id" element={<Salons />} />
            <Route path="/try-on" element={<TryOn />} />
            <Route path="/restore" element={<Restore />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
