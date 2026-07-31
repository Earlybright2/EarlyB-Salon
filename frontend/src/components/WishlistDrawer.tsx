import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router";

export default function WishlistDrawer() {
  const { items, isWishlistOpen, setIsWishlistOpen, removeItem } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = (item: (typeof items)[0]) => {
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      category: item.category,
    });
    removeItem(item.productId);
  };

  return (
    <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
      <SheetContent className="w-full sm:w-[420px] bg-ebs-bg-card border-l border-ebs-rose/10 p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-white/5">
          <SheetTitle className="font-display text-xl text-ebs-text flex items-center gap-2">
            <Heart className="h-5 w-5 text-ebs-rose" />
            Your Wishlist
            {items.length > 0 && (
              <span className="text-sm text-ebs-text-muted font-sans">
                ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-ebs-rose/10 flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-ebs-rose/40" />
            </div>
            <h3 className="font-display text-lg text-ebs-text mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-sm text-ebs-text-muted mb-6">
              Save your favorite products here for quick access later.
            </p>
            <Button
              onClick={() => setIsWishlistOpen(false)}
              asChild
              className="bg-ebs-rose text-white hover:bg-ebs-rose/90 font-semibold"
            >
              <Link to="/shop">Explore Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-xl bg-ebs-bg-elevated border border-white/5"
                >
                  <Link
                    to={`/shop/${item.productId}`}
                    onClick={() => setIsWishlistOpen(false)}
                    className="shrink-0"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/shop/${item.productId}`}
                        onClick={() => setIsWishlistOpen(false)}
                      >
                        <h4 className="text-sm font-medium text-ebs-text hover:text-ebs-gold transition-colors truncate">
                          {item.name}
                        </h4>
                      </Link>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1 text-ebs-text-muted hover:text-ebs-error transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-ebs-text-muted capitalize mt-0.5">
                      {item.category}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-ebs-gold">
                        ₦{item.price.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleMoveToCart(item)}
                        className="h-8 bg-ebs-gold/10 text-ebs-gold hover:bg-ebs-gold hover:text-ebs-bg text-xs font-medium"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5">
              <Button
                onClick={() => setIsWishlistOpen(false)}
                asChild
                variant="outline"
                className="w-full border-ebs-rose/30 text-ebs-rose hover:bg-ebs-rose/10"
              >
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
