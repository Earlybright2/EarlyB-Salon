import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { products, salons, hairstyles, testimonials, howItWorksSteps, features } from "@/data/storeData";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Users,
  Star,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  Scan,
  CalendarDays,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

const featureIcons: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-6 w-6" />,
  Shield: <ShieldCheck className="h-6 w-6" />,
  TrendingUp: <TrendingUp className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
};

const stepIcons: Record<string, React.ReactNode> = {
  Scan: <Scan className="h-8 w-8" />,
  Sparkles: <Sparkles className="h-8 w-8" />,
  Calendar: <CalendarDays className="h-8 w-8" />,
};

export default function Home() {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const productScrollRef = useRef<HTMLDivElement>(null);
  const salonScrollRef = useRef<HTMLDivElement>(null);
  const hairstyleScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  const featuredProducts = products.filter((p) => p.isFeatured);
  const featuredSalons = salons.filter((s) => s.isFeatured);

  return (
    <div className="min-h-screen bg-ebs-bg">
      {/* ═══════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-ebs-bg via-ebs-bg to-ebs-bg-elevated" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-ebs-gold/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-ebs-teal/5 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-gold/10 border border-ebs-gold/20">
                <Sparkles className="h-4 w-4 text-ebs-gold" />
                <span className="text-sm font-medium text-ebs-gold">
                  AI-Powered Hair & Beauty Platform
                </span>
              </div>

              <h1 className="font-display text-ebs-text">
                Your Next Great
                <br />
                <span className="text-gradient-gold">Look Starts Here</span>
              </h1>

              <p className="text-lg md:text-xl text-ebs-text-secondary max-w-lg leading-relaxed">
                AI-powered hairstyle try-on, verified salon booking, and hairline
                restoration — all built for you. Discover styles that match your
                unique features.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/try-on">
                  <Button className="h-14 px-8 bg-gradient-gold text-ebs-bg font-bold text-base hover:shadow-gold transition-all rounded-xl">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Try AI Filter Free
                  </Button>
                </Link>
                <Link to="/salons">
                  <Button
                    variant="outline"
                    className="h-14 px-8 border-ebs-gold/40 text-ebs-gold font-semibold hover:bg-ebs-gold/10 rounded-xl"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Find a Salon
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[
                    "/hairstyle-afro.jpg",
                    "/hairstyle-fade.jpg",
                    "/hairstyle-braids.jpg",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-ebs-bg object-cover"
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-ebs-bg bg-ebs-gold/20 flex items-center justify-center text-xs font-bold text-ebs-gold">
                    +
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ebs-text">50,000+ Users</p>
                  <p className="text-xs text-ebs-text-muted">Trust Early Bright</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div>
                  <p className="text-sm font-semibold text-ebs-text">2,000+ Salons</p>
                  <p className="text-xs text-ebs-text-muted">Verified & Ready</p>
                </div>
              </div>
            </div>

            <div className="relative lg:h-[600px] flex items-center justify-center animate-fade-in delay-200">
              <div className="absolute w-[350px] h-[350px] md:w-[450px] md:h-[450px] rounded-full bg-ebs-gold/10 animate-pulse-glow" />
              <img
                src="/hero-model.jpg"
                alt="Premium hairstyle"
                className="relative h-[450px] md:h-[550px] w-auto object-contain rounded-3xl shadow-dark-lg"
              />
              {/* Floating badges */}
              <div className="absolute top-10 right-4 glass-panel rounded-xl px-4 py-3 border border-ebs-gold/20 animate-float">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                  <span className="text-sm font-semibold text-ebs-text">4.9 Rating</span>
                </div>
              </div>
              <div className="absolute bottom-20 left-0 glass-panel rounded-xl px-4 py-3 border border-ebs-teal/20 animate-float delay-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-ebs-teal" />
                  <span className="text-sm font-semibold text-ebs-text">KYC Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════ */}
      <section id="how-it-works" data-animate className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-3">
              How It Works
            </p>
            <h2 className="font-display text-ebs-text mb-4">
              Three Steps to Your <span className="text-gradient-gold">Perfect Look</span>
            </h2>
            <p className="text-ebs-text-secondary max-w-xl mx-auto">
              Our AI-powered platform makes finding and booking your ideal style
              effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, i) => (
              <div
                key={step.step}
                className={`relative group p-8 rounded-2xl bg-ebs-bg-card border border-white/5 hover:border-ebs-gold/30 transition-all duration-300 hover:-translate-y-1 ${
                  visibleSections.has("how-it-works") ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="absolute -top-4 left-8 h-8 w-8 rounded-full bg-ebs-gold text-ebs-bg flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <div className="h-14 w-14 rounded-xl bg-ebs-gold/10 flex items-center justify-center text-ebs-gold mb-5 group-hover:bg-ebs-gold/20 transition-colors">
                  {stepIcons[step.icon]}
                </div>
                <h3 className="font-display text-xl text-ebs-text mb-3">{step.title}</h3>
                <p className="text-sm text-ebs-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════════════ */}
      <section id="features" data-animate className="py-24 bg-ebs-bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-3">
              Why Choose Us
            </p>
            <h2 className="font-display text-ebs-text">
              The <span className="text-gradient-gold">Early Bright</span> Advantage
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl bg-ebs-bg border border-white/5 hover:border-ebs-gold/20 transition-all duration-300 group ${
                  visibleSections.has("features") ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl bg-ebs-gold/10 flex items-center justify-center text-ebs-gold mb-4 group-hover:bg-ebs-gold/20 group-hover:scale-110 transition-all">
                  {featureIcons[feature.icon]}
                </div>
                <h3 className="font-display text-lg text-ebs-text mb-2">{feature.title}</h3>
                <p className="text-sm text-ebs-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURED PRODUCTS
          ═══════════════════════════════════════════════════ */}
      <section id="products" data-animate className="py-24 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-ebs-gold/3 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-3">
                Shop Collection
              </p>
              <h2 className="font-display text-ebs-text">
                Featured <span className="text-gradient-gold">Products</span>
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-ebs-gold hover:text-ebs-gold-light transition-colors"
            >
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => scroll(productScrollRef, "left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ebs-bg-elevated border border-white/10 flex items-center justify-center text-ebs-text hover:border-ebs-gold/30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(productScrollRef, "right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ebs-bg-elevated border border-white/10 flex items-center justify-center text-ebs-text hover:border-ebs-gold/30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              ref={productScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-2"
            >
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[280px] max-w-[280px] rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden group hover:border-ebs-gold/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-dark"
                >
                  <Link to={`/shop/${product.id}`} className="relative block">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.badge && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-ebs-gold text-ebs-bg text-xs font-bold">
                        {product.badge}
                      </span>
                    )}
                    {product.isNew && (
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-ebs-teal text-white text-xs font-bold">
                        New
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleItem({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          category: product.category,
                        });
                      }}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-ebs-bg/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ right: product.isNew ? "3rem" : "0.75rem" }}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isInWishlist(product.id)
                            ? "fill-ebs-rose text-ebs-rose"
                            : "text-ebs-text"
                        }`}
                      />
                    </button>
                  </Link>
                  <div className="p-5">
                    <p className="text-xs text-ebs-text-muted capitalize mb-1">
                      {product.category}
                    </p>
                    <Link to={`/shop/${product.id}`}>
                      <h3 className="font-display text-lg text-ebs-text mb-2 group-hover:text-ebs-gold transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-3.5 w-3.5 text-ebs-gold fill-ebs-gold" />
                      <span className="text-sm text-ebs-text">{product.rating}</span>
                      <span className="text-xs text-ebs-text-muted">
                        ({product.reviews})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-ebs-gold">
                          ₦{product.price.toLocaleString()}
                        </span>
                        {product.comparePrice && (
                          <span className="text-sm text-ebs-text-muted line-through">
                            ₦{product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          addItem({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                            image: product.image,
                            category: product.category,
                          })
                        }
                        className="h-9 w-9 rounded-lg bg-ebs-gold/10 flex items-center justify-center text-ebs-gold hover:bg-ebs-gold hover:text-ebs-bg transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURED SALONS
          ═══════════════════════════════════════════════════ */}
      <section id="salons" data-animate className="py-24 bg-ebs-bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-semibold text-ebs-teal tracking-widest uppercase mb-3">
                Discover
              </p>
              <h2 className="font-display text-ebs-text">
                Featured <span className="text-ebs-teal">Salons</span>
              </h2>
            </div>
            <Link
              to="/salons"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-ebs-teal hover:text-ebs-teal-light transition-colors"
            >
              Explore All Salons
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => scroll(salonScrollRef, "left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ebs-bg-elevated border border-white/10 flex items-center justify-center text-ebs-text hover:border-ebs-teal/30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(salonScrollRef, "right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ebs-bg-elevated border border-white/10 flex items-center justify-center text-ebs-text hover:border-ebs-teal/30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              ref={salonScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-2"
            >
              {featuredSalons.map((salon) => (
                <div
                  key={salon.id}
                  className="min-w-[380px] max-w-[380px] rounded-2xl bg-ebs-bg border border-white/5 overflow-hidden group hover:border-ebs-teal/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-dark"
                >
                  <div className="relative">
                    <img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {salon.isVerified && (
                        <span className="px-2.5 py-1 rounded-full bg-ebs-teal text-white text-xs font-semibold flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          salon.isOpen
                            ? "bg-ebs-success text-white"
                            : "bg-ebs-error text-white"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        {salon.isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-xl text-ebs-text group-hover:text-ebs-teal transition-colors">
                        {salon.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                        <span className="text-sm font-medium text-ebs-text">
                          {salon.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-ebs-text-muted mb-3 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {salon.address}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      {salon.specialties.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-full bg-ebs-bg-elevated text-xs text-ebs-text-secondary border border-white/5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-ebs-bg-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full bg-ebs-teal transition-all"
                            style={{ width: `${salon.busyPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-ebs-text-muted">
                          {salon.busyPercentage}% busy
                        </span>
                      </div>
                      <Link to={`/salons/${salon.id}`}>
                        <Button
                          size="sm"
                          className="bg-ebs-teal hover:bg-ebs-teal-light text-white"
                        >
                          <CalendarDays className="h-3.5 w-3.5 mr-1" />
                          Book
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TRENDING HAIRSTYLES
          ═══════════════════════════════════════════════════ */}
      <section id="hairstyles" data-animate className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-ebs-rose tracking-widest uppercase mb-3">
              Inspiration
            </p>
            <h2 className="font-display text-ebs-text">
              Trending <span className="text-ebs-rose">Hairstyles</span>
            </h2>
          </div>

          <div className="relative">
            <button
              onClick={() => scroll(hairstyleScrollRef, "left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ebs-bg-elevated border border-white/10 flex items-center justify-center text-ebs-text hover:border-ebs-rose/30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scroll(hairstyleScrollRef, "right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-ebs-bg-elevated border border-white/10 flex items-center justify-center text-ebs-text hover:border-ebs-rose/30 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              ref={hairstyleScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-2"
            >
              {hairstyles.map((style) => (
                <div
                  key={style.id}
                  className="min-w-[260px] max-w-[260px] rounded-2xl overflow-hidden group relative"
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="w-full h-[340px] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ebs-bg via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs text-ebs-gold font-medium mb-1 capitalize">
                      {style.category}
                    </p>
                    <h3 className="font-display text-xl text-ebs-text mb-2">
                      {style.name}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {style.faceShapes.slice(0, 3).map((shape) => (
                        <span
                          key={shape}
                          className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 backdrop-blur"
                        >
                          {shape}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HAIRLINE RESTORATION CTA
          ═══════════════════════════════════════════════════ */}
      <section id="restore" data-animate className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-ebs-gold/10 via-ebs-bg to-ebs-teal/10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-teal/10 border border-ebs-teal/20">
                <TrendingUp className="h-4 w-4 text-ebs-teal" />
                <span className="text-sm font-medium text-ebs-teal">
                  Hairline Restoration
                </span>
              </div>
              <h2 className="font-display text-ebs-text">
                Reclaim Your
                <br />
                <span className="text-ebs-teal">Confidence</span>
              </h2>
              <p className="text-ebs-text-secondary leading-relaxed max-w-md">
                Our hairline restoration program combines expert consultations,
                premium treatments, and progress tracking to help you achieve
                natural, lasting results. Connect with certified trichologists
                and start your journey today.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/restore">
                  <Button className="h-12 px-6 bg-ebs-teal hover:bg-ebs-teal-light text-white font-semibold rounded-xl">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Start Assessment
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-ebs-teal/30 text-ebs-teal hover:bg-ebs-teal/10 rounded-xl"
                  >
                    Shop Products
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/hairline-before-after.jpg"
                alt="Hairline restoration results"
                className="rounded-2xl shadow-dark-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS
          ═══════════════════════════════════════════════════ */}
      <section id="testimonials" data-animate className="py-24 bg-ebs-bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-3">
              Testimonials
            </p>
            <h2 className="font-display text-ebs-text mb-4">
              Loved by <span className="text-gradient-gold">Thousands</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={`p-6 rounded-2xl bg-ebs-bg border border-white/5 hover:border-ebs-gold/10 transition-all duration-300 ${
                  visibleSections.has("testimonials") ? "animate-fade-in-up" : "opacity-0"
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${
                        j < t.rating
                          ? "text-ebs-gold fill-ebs-gold"
                          : "text-ebs-text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-ebs-text-secondary leading-relaxed mb-6">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ebs-text">{t.name}</p>
                    <p className="text-xs text-ebs-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STYLIST PARTNER CTA
          ═══════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <img
              src="/salon-interior.jpg"
              alt="Join as a stylist"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ebs-bg via-ebs-bg/80 to-transparent" />
            <div className="absolute inset-0 flex items-center p-8 md:p-16">
              <div className="max-w-lg space-y-6">
                <h2 className="font-display text-ebs-text">
                  Grow Your Business with{" "}
                  <span className="text-gradient-gold">Early Bright</span>
                </h2>
                <p className="text-ebs-text-secondary">
                  Join 2,000+ verified stylists and salons. Get discovered by
                  thousands of clients, manage bookings digitally, and grow your
                  earnings with our powerful tools.
                </p>
                <Button className="h-12 px-8 bg-gradient-gold text-ebs-bg font-bold hover:shadow-gold transition-shadow rounded-xl">
                  Join as Professional
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-ebs-bg-card/30 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ebs-gold" />
                <span className="font-display text-lg font-semibold text-ebs-text">
                  Early <span className="text-ebs-gold">Bright</span>
                </span>
              </Link>
              <p className="text-sm text-ebs-text-secondary leading-relaxed">
                Africa's first AI-powered hair and beauty platform. Discover,
                book, and transform your look with confidence.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ebs-text mb-4">Discover</h4>
              <ul className="space-y-2.5">
                {["AI Try-On", "Find Salons", "Shop Products", "Hairline Restoration"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sm text-ebs-text-muted hover:text-ebs-gold transition-colors cursor-pointer">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ebs-text mb-4">For Stylists</h4>
              <ul className="space-y-2.5">
                {["Join as Pro", "Business Tools", "Pricing", "Success Stories"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sm text-ebs-text-muted hover:text-ebs-gold transition-colors cursor-pointer">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ebs-text mb-4">Support</h4>
              <ul className="space-y-2.5">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sm text-ebs-text-muted hover:text-ebs-gold transition-colors cursor-pointer">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-ebs-text-muted">
              © 2025 Early Bright Shop. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Instagram", "Twitter", "Facebook", "TikTok"].map((social) => (
                <span
                  key={social}
                  className="text-xs text-ebs-text-muted hover:text-ebs-gold transition-colors cursor-pointer"
                >
                  {social}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
