import { useMemo, useState } from "react";
import { Link } from "react-router";
import { productCategories } from "@/data/storeData";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useApiQuery } from "@/hooks/useApi";
import type { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag,
  Heart,
  Star,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
} from "lucide-react";

export default function Shop() {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "newest">("popular");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useApiQuery<Product[]>(
    "/api/shop/products",
    ["shop", "products"],
  );

  const productList = useMemo(() => {
    return (products ?? []).map((product) => {
      const photos = typeof product.photos === "string" ? JSON.parse(product.photos) : [];
      return {
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
        stock: product.stockQuantity,
        rating: Number(product.averageRating ?? 0),
        reviews: product.totalReviews,
        image: photos[0] ?? "/product-placeholder.jpg",
      };
    });
  }, [products]);

  const filtered = productList
    .filter((p) => {
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "newest") return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return (b.reviews ?? 0) - (a.reviews ?? 0);
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ebs-bg pt-24 pb-16 flex items-center justify-center">
        <p className="text-lg text-ebs-text">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ebs-bg pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-2">
            Shop Collection
          </p>
          <h1 className="font-display text-ebs-text mb-4">
            Premium <span className="text-gradient-gold">Hair Care</span>
          </h1>
          <p className="text-ebs-text-secondary max-w-xl">
            Discover our curated collection of professional-grade hair care
            products, from growth serums to styling essentials.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ebs-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 bg-ebs-bg-card border-white/10 text-ebs-text placeholder:text-ebs-text-muted focus:border-ebs-gold/50 h-11"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ebs-text-muted hover:text-ebs-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 h-11 rounded-lg bg-ebs-bg-card border border-white/10 text-sm text-ebs-text-secondary hover:border-ebs-gold/30 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none px-4 pr-10 h-11 rounded-lg bg-ebs-bg-card border border-white/10 text-sm text-ebs-text-secondary focus:border-ebs-gold/50 cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ebs-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div
          className={`flex flex-wrap gap-2 mb-8 transition-all duration-300 ${
            showFilters ? "block" : "hidden md:flex"
          }`}
        >
          {productCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.value
                  ? "bg-ebs-gold text-ebs-bg"
                  : "bg-ebs-bg-card text-ebs-text-secondary border border-white/10 hover:border-ebs-gold/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-ebs-text-muted mb-6">
          Showing {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* Product Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden group hover:border-ebs-gold/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-dark"
              >
                <Link to={`/shop/${product.id}`} className="relative block">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
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
                        category: product.category ?? undefined,
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
                    <h3 className="font-display text-lg text-ebs-text mb-2 group-hover:text-ebs-gold transition-colors line-clamp-1">
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
                          category: product.category ?? undefined,
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
        ) : (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-ebs-text-muted mx-auto mb-4" />
            <h3 className="font-display text-xl text-ebs-text mb-2">
              No products found
            </h3>
            <p className="text-sm text-ebs-text-muted">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
