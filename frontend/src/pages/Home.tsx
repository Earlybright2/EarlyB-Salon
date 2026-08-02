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
  ScanFace,
  CalendarClock,
  CalendarDays,
  BadgeCheck,
  Gauge,
  HeartPulse,
  Feather,
  Palette,
  Wind,
  Droplets,
  Scissors,
  Mail,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useApiQuery } from "@/hooks/useApi";
import type { Hairstyle, Hero } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const featureIcons: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-6 w-6" />,
  Shield: <BadgeCheck className="h-6 w-6" />,
  TrendingUp: <HeartPulse className="h-6 w-6" />,
  Users: <Gauge className="h-6 w-6" />,
};

const stepIcons: Record<string, React.ReactNode> = {
  Scan: <ScanFace className="h-8 w-8" />,
  Sparkles: <Sparkles className="h-8 w-8" />,
  Calendar: <CalendarClock className="h-8 w-8" />,
};

const stats = [
  { value: "5,000+", label: "Happy Clients", icon: <Users className="h-6 w-6" /> },
  { value: "300+", label: "Verified Stylists", icon: <BadgeCheck className="h-6 w-6" /> },
  { value: "4.9/5", label: "Average Rating", icon: <Star className="h-6 w-6" /> },
  { value: "50+", label: "Partner Salons", icon: <Scissors className="h-6 w-6" /> },
];

const services = [
  {
    name: "Braids & Twists",
    price: "from ₦8,000",
    description: "Knotless, box braids, and protective styles by certified stylists.",
    icon: <Feather className="h-6 w-6" />,
  },
  {
    name: "Hair Coloring",
    price: "from ₦12,000",
    description: "Global and dimensional color with premium ammonia-free formulas.",
    icon: <Palette className="h-6 w-6" />,
  },
  {
    name: "Hairline Restoration",
    price: "from ₦15,000",
    description: "Trichologist-led treatments to restore and protect your hairline.",
    icon: <HeartPulse className="h-6 w-6" />,
  },
  {
    name: "Blow Dry & Styling",
    price: "from ₦5,000",
    description: "Silky blowouts and occasion-ready styling tailored to you.",
    icon: <Wind className="h-6 w-6" />,
  },
  {
    name: "Keratin & Treatments",
    price: "from ₦20,000",
    description: "Deep conditioning, bond repair, and smoothing treatments.",
    icon: <Droplets className="h-6 w-6" />,
  },
  {
    name: "Beard Grooming",
    price: "from ₦3,500",
    description: "Precision trims, shaping, and hot towel shaves for men.",
    icon: <Scissors className="h-6 w-6" />,
  },
];

export default function Home() {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"female" | "male">("female");
  const productScrollRef = useRef<HTMLDivElement>(null);
  const salonScrollRef = useRef<HTMLDivElement>(null);
  const hairstyleScrollRef = useRef<HTMLDivElement>(null);
  const heroPausedRef = useRef(false);

  const { data: apiHeroes } = useApiQuery<Hero[]>("/api/shop/heroes", ["shop", "heroes"]);
  const { data: apiHairstyles } = useApiQuery<Hairstyle[]>(
    "/api/shop/hairstyles",
    ["shop", "hairstyles"],
  );

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

  const featuredProducts = useMemo(() => {
    return products
      .slice(0, 8)
      .map((product) => ({
        ...product,
        image: product.image ?? "/product-serum.jpg",
        rating: Number(product.rating ?? 0),
        reviews: Number(product.reviews ?? 0),
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      }));
  }, []);

  const featuredSalons = useMemo(() => {
    const localSalons = [
      ...salons.filter((salon) => salon.isFeatured),
      {
        id: 3,
        name: "Luna Luxe Salon",
        description:
          "A polished beauty lounge for luxury color, styling, and extension services with a calm, premium finish.",
        address: "25 Keffi Street, Gwarinpa",
        city: "Abuja",
        rating: 4.7,
        reviews: 154,
        image: "/salon-interior.jpg",
        isVerified: true,
        isOpen: true,
        isFeatured: true,
        busyPercentage: 64,
        specialties: ["Color", "Styling", "Extensions"],
        phoneNumber: "+234 703 111 2222",
        seatCapacity: 7,
        services: [],
      },
    ];

    return localSalons.map((salon) => ({
      ...salon,
      image: salon.image ?? "/salon-interior.jpg",
      specialties: salon.specialties ?? [],
    }));
  }, []);

  const trendingHairstyles = useMemo(() => {
    const apiStyles = (apiHairstyles ?? []).map((style) => ({
      id: style.id,
      name: style.name,
      category: style.category ?? "",
      genderTarget: style.genderTarget ?? "unisex",
      image: style.imageUrl ?? "/hairstyle-afro.jpg",
      faceShapes:
        typeof style.faceShapes === "string"
          ? style.faceShapes.split(",").map((shape) => shape.trim())
          : (style.faceShapes ?? []),
      hairTypes: [],
      trendScore: style.trendScore ?? 0,
    }));
    const source = apiStyles.length > 0 ? apiStyles : hairstyles;
    return source
      .filter(
        (style) =>
          !style.genderTarget || style.genderTarget === genderFilter || style.genderTarget === "unisex",
      )
      .slice(0, 4)
      .map((style) => ({
        ...style,
        image: style.image ?? "/hairstyle-fade.jpg",
        faceShapes: Array.isArray(style.faceShapes)
          ? style.faceShapes
          : String(style.faceShapes ?? "")
              .split(",")
              .map((shape) => shape.trim())
              .filter(Boolean),
      }));
  }, [apiHairstyles, genderFilter]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const timer = setInterval(() => {
      if (!heroPausedRef.current) emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [emblaApi]);

  const fallbackHeroSlides = [
    {
      image: "/hero1.png",
      title: "Discover Your Signature Style",
      subtitle: "Explore premium hairstyles tailored to your unique features.",
    },
    {
      image: "/hero2.png",
      title: "Expert Salon Services",
      subtitle: "Book appointments with top-rated professionals in your area.",
    },
    {
      image: "/hero3.png",
      title: "Transform Your Look",
      subtitle: "Experience the magic of AI-powered hairstyle try-ons.",
    },
    {
      image: "/hero4.png",
      title: "Premium Haircare Products",
      subtitle: "Shop curated products for your ultimate hair health.",
    },
    {
      image: "/hero5.png",
      title: "Start Your Hair Journey",
      subtitle: "From consultation to restoration, we care for your hair at every stage.",
    }
  ];

  const heroSlides =
    apiHeroes && apiHeroes.length > 0
      ? apiHeroes.map((hero) => ({
          image: hero.imageUrl ?? "/hero1.png",
          title: hero.title,
          subtitle: hero.subtitle ?? "",
        }))
      : fallbackHeroSlides;

  return (
    <div className="min-h-screen bg-ebs-bg">
      {/* ═══════════════════════════════════════════════════
          HERO SECTION (CAROUSEL)
          ═══════════════════════════════════════════════════ */}
      <section
        className="relative h-screen w-full overflow-hidden"
        onMouseEnter={() => (heroPausedRef.current = true)}
        onMouseLeave={() => (heroPausedRef.current = false)}
      >
        <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {heroSlides.map((slide, index) => (
              <div key={index} className="relative flex-[0_0_100%] h-full min-w-0">
                <div className="absolute inset-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-contain object-right"
                  />
                  {/* Subtle dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-ebs-bg/90 via-ebs-bg/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ebs-bg/80 via-transparent to-transparent" />
                </div>

                <div className="relative h-full flex items-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="max-w-xl space-y-6 mt-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                      <Sparkles className="h-4 w-4 text-ebs-gold" />
                      <span className="text-sm font-medium text-white shadow-sm">
                        Early Bright Excellence
                      </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display text-white font-bold leading-tight">
                      {slide.title}
                    </h1>

                    <p className="text-2xl md:text-3xl text-white/90 font-light leading-relaxed max-w-lg">
                      {slide.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link to="/try-on">
                        <Button className="h-14 px-8 bg-ebs-gold text-ebs-bg font-bold text-base hover:bg-ebs-gold-light transition-all rounded-xl shadow-lg">
                          Get Started Now
                        </Button>
                      </Link>
                      <Link to="/salons">
                        <Button
                          variant="outline"
                          className="h-14 px-8 border-white/30 text-white font-semibold hover:bg-white/10 backdrop-blur-md rounded-xl transition-all"
                        >
                          Find a Salon
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Subtle Navigation Arrows */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 md:opacity-100 z-10"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 md:opacity-100 z-10"
          onClick={scrollNext}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === selectedIndex ? "w-8 bg-ebs-gold" : "w-2 bg-white/50"
                }`}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS BAND
          ═══════════════════════════════════════════════════ */}
      <section className="py-14 bg-ebs-bg-card/40 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-ebs-gold/10 flex items-center justify-center text-ebs-gold shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p className="font-display text-3xl md:text-4xl text-ebs-text font-semibold leading-none">
                    {stat.value}
                  </p>
                  <p className="text-sm text-ebs-text-muted mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ABOUT / WELCOME SECTION
          ═══════════════════════════════════════════════════ */}
      <section id="about" data-animate className="py-24 bg-ebs-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="font-display text-4xl md:text-5xl text-ebs-text font-light">
                Welcome to <span className="font-semibold text-gradient-gold">EARLY BRIGHT</span>
              </h2>
              <div className="space-y-4 text-ebs-text-secondary leading-relaxed">
                <p>
                  Early Bright is a modern boutique hair salon. We specialise in all hair types and ethnicities including European hair, Asian hair, Afro hair and more. We offer various luxury extension methods including tape-ins, microlinks and LA Weave.
                </p>
                <p>
                  It is our priority that our clients receive a personalised service and impeccable results at our salon. Our philosophy derives from the understanding that customer service comes first and we are proud to bring that experience to you in our salon.
                </p>
                <p className="font-medium text-ebs-text">
                  We hope to see you soon!
                </p>
              </div>
              <div className="pt-4">
                <Link to="/salons/book" className="inline-flex items-center gap-2 text-lg font-semibold text-ebs-text hover:text-ebs-gold transition-colors group">
                  Book Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in delay-200">
              <div className="aspect-[4/3] rounded-sm overflow-hidden relative shadow-dark-lg">
                <img
                  src="/salon-interior.jpg"
                  alt="Salon Interior"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
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
                className={`relative group p-8 rounded-2xl bg-ebs-bg-card border border-white/5 hover:border-ebs-gold/30 transition-all duration-300 hover:-translate-y-1 ${visibleSections.has("how-it-works") ? "animate-fade-in-up" : "opacity-0"
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
                className={`p-6 rounded-2xl bg-ebs-bg border border-white/5 hover:border-ebs-gold/20 transition-all duration-300 group ${visibleSections.has("features") ? "animate-fade-in-up" : "opacity-0"
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
          OUR SERVICES
          ═══════════════════════════════════════════════════ */}
      <section id="services" data-animate className="py-24 relative">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-ebs-teal/5 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ebs-teal tracking-widest uppercase mb-3">
              Our Services
            </p>
            <h2 className="font-display text-ebs-text mb-4">
              Complete Hair Care, <span className="text-ebs-teal">Expertly Done</span>
            </h2>
            <p className="text-ebs-text-secondary max-w-xl mx-auto">
              From protective styling to restoration, our certified stylists
              deliver premium results across every service.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div
                key={service.name}
                className={`p-7 rounded-2xl bg-ebs-bg-card border border-white/5 hover:border-ebs-teal/30 transition-all duration-300 group ${visibleSections.has("services") ? "animate-fade-in-up" : "opacity-0"
                  }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-ebs-teal/10 flex items-center justify-center text-ebs-teal group-hover:bg-ebs-teal group-hover:text-white transition-colors">
                    {service.icon}
                  </div>
                  <span className="text-sm font-semibold text-ebs-teal">
                    {service.price}
                  </span>
                </div>
                <h3 className="font-display text-xl text-ebs-text mb-2">{service.name}</h3>
                <p className="text-sm text-ebs-text-secondary leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/salons">
              <Button className="h-12 px-8 bg-ebs-teal hover:bg-ebs-teal-light text-white font-semibold rounded-xl">
                View Full Menu
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
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
                  className="min-w-[220px] max-w-[220px] rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden group hover:border-ebs-gold/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-dark"
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
                          category: product.category ?? "",
                        });
                      }}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-ebs-bg/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ right: product.isNew ? "3rem" : "0.75rem" }}
                    >
                      <Heart
                        className={`h-4 w-4 ${isInWishlist(product.id)
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
                            category: product.category ?? "",
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
                  className="min-w-[320px] max-w-[320px] rounded-2xl bg-ebs-bg border border-white/5 overflow-hidden group hover:border-ebs-teal/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-dark"
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
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${salon.isOpen
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
            <div className="flex justify-center mt-8">
              <div className="inline-flex rounded-full border border-white/20 p-1 bg-ebs-bg-card/50">
                <button
                  onClick={() => setGenderFilter("male")}
                  className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                    genderFilter === "male"
                      ? "bg-white text-ebs-bg"
                      : "text-ebs-text hover:text-white"
                  }`}
                >
                  Male Styles
                </button>
                <button
                  onClick={() => setGenderFilter("female")}
                  className={`px-8 py-2.5 rounded-full text-sm font-medium transition-all ${
                    genderFilter === "female"
                      ? "bg-white text-ebs-bg"
                      : "text-ebs-text hover:text-white"
                  }`}
                >
                  Female Styles
                </button>
              </div>
            </div>
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
              {trendingHairstyles.map((style) => (
                <div
                  key={style.id}
                  className="min-w-[220px] max-w-[220px] rounded-2xl overflow-hidden group relative"
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
          AI TRY-ON SHOWCASE
          ═══════════════════════════════════════════════════ */}
      <section id="tryon" data-animate className="py-24 bg-ebs-bg-card/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-ebs-gold/5 via-transparent to-ebs-rose/5" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/5] max-w-md mx-auto rounded-2xl overflow-hidden shadow-dark-lg">
                <img
                  src="/hero-model.jpg"
                  alt="AI hairstyle try-on preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full bg-ebs-bg-elevated border border-white/10 shadow-dark backdrop-blur">
                <ScanFace className="h-5 w-5 text-ebs-gold" />
                <span className="text-sm font-medium text-ebs-text">
                  AI Try-On Powered
                </span>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-rose/10 border border-ebs-rose/20">
                <Sparkles className="h-4 w-4 text-ebs-rose" />
                <span className="text-sm font-medium text-ebs-rose">
                  AI Hairstyle Try-On
                </span>
              </div>
              <h2 className="font-display text-ebs-text">
                See It on You Before <br />
                <span className="text-gradient-gold">You Commit</span>
              </h2>
              <p className="text-ebs-text-secondary leading-relaxed max-w-md">
                Upload a photo and our AI instantly renders hundreds of
                hairstyles, colors, and textures onto your face. Match styles to
                your features, compare looks side by side, and book with total
                confidence.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time style rendering tailored to your face shape",
                  "Hairline and color analysis for accurate recommendations",
                  "Direct booking from any style you love",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-ebs-text-secondary">
                    <CheckCircle2 className="h-5 w-5 text-ebs-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/try-on">
                  <Button className="h-12 px-8 bg-ebs-gold text-ebs-bg font-bold hover:bg-ebs-gold-light rounded-xl">
                    Try It Now — Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/hairstyles">
                  <Button
                    variant="outline"
                    className="h-12 px-6 border-ebs-rose/30 text-ebs-rose hover:bg-ebs-rose/10 rounded-xl"
                  >
                    Browse Styles
                  </Button>
                </Link>
              </div>
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
                className={`p-6 rounded-2xl bg-ebs-bg border border-white/5 hover:border-ebs-gold/10 transition-all duration-300 ${visibleSections.has("testimonials") ? "animate-fade-in-up" : "opacity-0"
                  }`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${j < t.rating
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
          FAQ SECTION
          ═══════════════════════════════════════════════════ */}
      <section id="faq" data-animate className="py-24 bg-ebs-bg-card/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl text-ebs-text">
              Frequently Asked <span className="text-gradient-gold">Questions</span>
            </h2>
            <p className="mt-4 text-ebs-text-secondary">
              Everything you need to know about our salon and services.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-white/10 rounded-xl px-6 bg-ebs-bg">
              <AccordionTrigger className="text-ebs-text hover:text-ebs-gold font-medium py-4 text-left">
                Do I need to book an appointment in advance?
              </AccordionTrigger>
              <AccordionContent className="text-ebs-text-secondary pb-4">
                While we do accept walk-ins depending on availability, we highly recommend booking in advance to secure your preferred time slot and stylist, especially for specialized services like LA Weave or microlinks.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border border-white/10 rounded-xl px-6 bg-ebs-bg">
              <AccordionTrigger className="text-ebs-text hover:text-ebs-gold font-medium py-4 text-left">
                What types of hair extensions do you offer?
              </AccordionTrigger>
              <AccordionContent className="text-ebs-text-secondary pb-4">
                We offer a premium selection of luxury extensions including tape-ins, microlinks, and the LA Weave. Our specialists will consult with you to determine the best method for your hair type and desired look.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border border-white/10 rounded-xl px-6 bg-ebs-bg">
              <AccordionTrigger className="text-ebs-text hover:text-ebs-gold font-medium py-4 text-left">
                Is your AI Try-On feature accurate?
              </AccordionTrigger>
              <AccordionContent className="text-ebs-text-secondary pb-4">
                Our AI Try-On uses advanced facial recognition and mapping to provide highly realistic previews of different hairstyles and colors on your face, helping you make confident decisions before your appointment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-white/10 rounded-xl px-6 bg-ebs-bg">
              <AccordionTrigger className="text-ebs-text hover:text-ebs-gold font-medium py-4 text-left">
                Do you cater to all hair types?
              </AccordionTrigger>
              <AccordionContent className="text-ebs-text-secondary pb-4">
                Yes! We are proud to be a versatile salon specializing in all hair ethnicities and textures, including European, Asian, and Afro hair. Our stylists are extensively trained across all hair types.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          NEWSLETTER
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ebs-gold/10 via-ebs-bg to-ebs-teal/10" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-ebs-gold/10 text-ebs-gold mb-6">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="font-display text-ebs-text mb-4">
            Stay in the <span className="text-gradient-gold">Loop</span>
          </h2>
          <p className="text-ebs-text-secondary max-w-xl mx-auto mb-8">
            Join our newsletter for expert hair tips, exclusive offers, and
            early access to new services and product drops. No spam — just
            great hair content.
          </p>
          {newsletterSubscribed ? (
            <div className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-ebs-success/10 border border-ebs-success/30">
              <CheckCircle2 className="h-6 w-6 text-ebs-success shrink-0" />
              <p className="text-ebs-text font-medium">
                You're subscribed! Watch your inbox for the latest from Early Bright.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail.includes("@")) setNewsletterSubscribed(true);
              }}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 h-14 px-5 rounded-xl bg-ebs-bg-elevated border border-white/10 text-ebs-text placeholder:text-ebs-text-muted focus:outline-none focus:border-ebs-gold/50 transition-colors"
              />
              <Button
                type="submit"
                className="h-14 px-8 bg-ebs-gold text-ebs-bg font-bold hover:bg-ebs-gold-light rounded-xl transition-all"
              >
                Subscribe
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </form>
          )}
          <p className="text-xs text-ebs-text-muted mt-4">
            By subscribing you agree to our privacy policy. Unsubscribe anytime.
          </p>
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
