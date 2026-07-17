import { useParams, Link, useNavigate } from "react-router";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import {
  Star,
  ShoppingBag,
  Heart,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
} from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "ingredients" | "reviews">("description");
  const [addedToCart, setAddedToCart] = useState(false);

  const productId = Number(id);
  const { data: product, isLoading } = trpc.shop.productById.useQuery(
    { id: productId },
    { enabled: !!id },
  );
  const { data: allProducts } = trpc.shop.products.useQuery();

  const relatedProducts = (allProducts ?? [])
    .filter((p) => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4)
    .map((related) => {
      const photos = typeof related.photos === "string" ? JSON.parse(related.photos) : [];
      return {
        ...related,
        price: Number(related.price),
        comparePrice: related.comparePrice ? Number(related.comparePrice) : undefined,
        image: photos[0] ?? "/product-placeholder.jpg",
        rating: Number(related.averageRating ?? 0),
        reviews: related.totalReviews,
      };
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ebs-bg flex items-center justify-center pt-20">
        <p className="text-lg text-ebs-text">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ebs-bg flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="font-display text-2xl text-ebs-text mb-4">
            Product not found
          </h2>
          <Link to="/shop">
            <Button className="bg-ebs-gold text-ebs-bg">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price,
      quantity,
      image: productImage,
      category: product.category ?? undefined,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const photos = typeof product.photos === "string" ? JSON.parse(product.photos) : [];
  const productImage = photos[0] ?? "/product-placeholder.jpg";
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : undefined;
  const stock = product.stockQuantity ?? 0;
  const savings = comparePrice
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-ebs-bg pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-ebs-text-muted hover:text-ebs-gold transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </button>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <div className="relative rounded-2xl overflow-hidden bg-ebs-bg-card border border-white/5">
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 px-4 py-1.5 rounded-full bg-ebs-gold text-ebs-bg text-sm font-bold">
                {product.badge}
              </span>
            )}
            {savings > 0 && (
              <span className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-ebs-success text-white text-sm font-bold">
                Save {savings}%
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-ebs-gold font-medium capitalize mb-2">
                {product.category}
              </p>
              <h1 className="font-display text-3xl md:text-4xl text-ebs-text mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(Number(product.averageRating ?? 0))
                          ? "text-ebs-gold fill-ebs-gold"
                          : "text-ebs-text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-ebs-text">
                  {Number(product.averageRating ?? 0).toFixed(1)} ({product.totalReviews} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ebs-gold">
                ₦{price.toLocaleString()}
              </span>
              {comparePrice && (
                <>
                  <span className="text-xl text-ebs-text-muted line-through">
                    ₦{comparePrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-ebs-success">
                    {savings}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-ebs-text-secondary leading-relaxed">
              {product.description}
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ebs-text">Quantity:</span>
              <div className="flex items-center gap-3 bg-ebs-bg-card rounded-lg p-1 border border-white/5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-ebs-text-secondary hover:text-ebs-gold transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-ebs-text w-6 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-ebs-text-secondary hover:text-ebs-gold transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span
                className={`text-sm ${
                  stock > 10
                    ? "text-ebs-success"
                    : stock > 0
                    ? "text-ebs-warning"
                    : "text-ebs-error"
                }`}
              >
                {stock > 10
                  ? "In Stock"
                  : stock > 0
                  ? `Only ${stock} left`
                  : "Out of Stock"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className={`flex-1 h-14 text-base font-bold rounded-xl transition-all ${
                  addedToCart
                    ? "bg-ebs-success hover:bg-ebs-success"
                    : "bg-gradient-gold text-ebs-bg hover:shadow-gold"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Add to Cart — ₦{(price * quantity).toLocaleString()}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toggleItem({
                    productId: product.id,
                    name: product.name,
                    price,
                    image: productImage,
                    category: product.category ?? undefined,
                  })
                }
                className={`h-14 w-14 rounded-xl border-2 ${
                  isInWishlist(product.id)
                    ? "border-ebs-rose bg-ebs-rose/10 text-ebs-rose"
                    : "border-white/10 text-ebs-text-muted hover:border-ebs-rose/30 hover:text-ebs-rose"
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isInWishlist(product.id) ? "fill-ebs-rose" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="flex flex-col items-center gap-2 text-center">
                <Truck className="h-5 w-5 text-ebs-teal" />
                <span className="text-xs text-ebs-text-secondary">
                  Free Shipping
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <ShieldCheck className="h-5 w-5 text-ebs-teal" />
                <span className="text-xs text-ebs-text-secondary">
                  Authentic Product
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <RotateCcw className="h-5 w-5 text-ebs-teal" />
                <span className="text-xs text-ebs-text-secondary">
                  Easy Returns
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-16">
          <div className="flex gap-1 p-1 rounded-xl bg-ebs-bg-card border border-white/5 w-fit mb-6">
            {(["description", "ingredients", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab
                    ? "bg-ebs-gold/10 text-ebs-gold"
                    : "text-ebs-text-muted hover:text-ebs-text"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-ebs-bg-card rounded-2xl border border-white/5 p-6 md:p-8">
            {activeTab === "description" && (
              <div className="space-y-4 text-ebs-text-secondary leading-relaxed">
                <p>{product.description}</p>
                <p>
                  This premium formula has been carefully developed by hair care
                  experts to deliver visible results. Suitable for all hair types
                  and textures, including natural, relaxed, and protective styles.
                </p>
                <ul className="space-y-2">
                  {[
                    "Dermatologist tested and approved",
                    "Free from sulfates, parabens, and mineral oils",
                    "Cruelty-free and vegan-friendly",
                    "Made with sustainably sourced ingredients",
                    "Suitable for daily use",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-ebs-success shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === "ingredients" && (
              <div className="space-y-4">
                <p className="text-ebs-text-secondary leading-relaxed">
                  {"Our proprietary blend includes natural oils, botanical extracts, and scientifically-proven active ingredients including Argan Oil, Shea Butter, Biotin, Vitamin E, Aloe Vera, Coconut Oil, Keratin, and Tea Tree Oil — all designed to nourish and protect your hair."}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Argan Oil",
                    "Shea Butter",
                    "Biotin",
                    "Vitamin E",
                    "Aloe Vera",
                    "Coconut Oil",
                    "Keratin",
                    "Tea Tree Oil",
                  ].map((ing) => (
                    <div
                      key={ing}
                      className="flex items-center gap-3 p-3 rounded-lg bg-ebs-bg border border-white/5"
                    >
                      <div className="h-2 w-2 rounded-full bg-ebs-gold" />
                      <span className="text-sm text-ebs-text">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-ebs-gold">
                      {Number(product.averageRating ?? 0).toFixed(1)}
                    </div>
                    <div className="flex items-center gap-0.5 my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(Number(product.averageRating ?? 0))
                              ? "text-ebs-gold fill-ebs-gold"
                              : "text-ebs-text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-ebs-text-muted">
                      {product.totalReviews} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-ebs-text-muted w-3">
                          {star}
                        </span>
                        <Star className="h-3 w-3 text-ebs-gold fill-ebs-gold" />
                        <div className="flex-1 h-2 rounded-full bg-ebs-bg overflow-hidden">
                          <div
                            className="h-full rounded-full bg-ebs-gold/60"
                            style={{
                              width: `${
                                star === 5
                                  ? 70
                                  : star === 4
                                  ? 20
                                  : star === 3
                                  ? 7
                                  : star === 2
                                  ? 2
                                  : 1
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Sample reviews */}
                {[
                  {
                    name: "Chioma N.",
                    rating: 5,
                    date: "2 weeks ago",
                    text: "Absolutely love this product! My hair has never felt softer and I've noticed significant growth after just 3 weeks of use.",
                  },
                  {
                    name: "Emeka O.",
                    rating: 5,
                    date: "1 month ago",
                    text: "Finally found a product that works for my hair type. The results are incredible and worth every naira.",
                  },
                  {
                    name: "Amina K.",
                    rating: 4,
                    date: "3 weeks ago",
                    text: "Great quality product. Smells amazing and leaves my hair feeling nourished. Will definitely repurchase.",
                  },
                ].map((review, i) => (
                  <div key={i} className="pb-6 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-ebs-gold/20 flex items-center justify-center text-xs font-bold text-ebs-gold">
                          {review.name[0]}
                        </div>
                        <span className="text-sm font-medium text-ebs-text">
                          {review.name}
                        </span>
                      </div>
                      <span className="text-xs text-ebs-text-muted">
                        {review.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className={`h-3.5 w-3.5 ${
                            j < review.rating
                              ? "text-ebs-gold fill-ebs-gold"
                              : "text-ebs-text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-ebs-text-secondary">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="font-display text-2xl text-ebs-text mb-6">
              You May Also <span className="text-gradient-gold">Like</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden group hover:border-ebs-gold/20 transition-all"
                >
                  <Link to={`/shop/${p.id}`} className="block">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="p-4">
                    <Link to={`/shop/${p.id}`}>
                      <h3 className="font-display text-base text-ebs-text mb-1 group-hover:text-ebs-gold transition-colors">
                        {p.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-ebs-gold">
                        ₦{p.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() =>
                          addItem({
                            productId: p.id,
                            name: p.name,
                            price: p.price,
                            quantity: 1,
                            image: p.image,
                            category: p.category ?? undefined,
                          })
                        }
                        className="h-8 w-8 rounded-lg bg-ebs-gold/10 flex items-center justify-center text-ebs-gold hover:bg-ebs-gold hover:text-ebs-bg transition-colors"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
