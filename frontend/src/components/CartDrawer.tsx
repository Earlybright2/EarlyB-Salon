import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:w-[420px] bg-ebs-bg-card border-l border-ebs-gold/10 p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl text-ebs-text flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-ebs-gold" />
              Your Cart
              {items.length > 0 && (
                <span className="text-sm text-ebs-text-muted font-sans">
                  ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
              )}
            </SheetTitle>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-ebs-text-muted hover:text-ebs-error transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-ebs-gold/10 flex items-center justify-center mb-4">
              <ShoppingBag className="h-10 w-10 text-ebs-gold/40" />
            </div>
            <h3 className="font-display text-lg text-ebs-text mb-2">Your cart is empty</h3>
            <p className="text-sm text-ebs-text-muted mb-6">
              Explore our premium hair care collection and add your favorites.
            </p>
            <Button
              onClick={() => setIsCartOpen(false)}
              asChild
              className="bg-gradient-gold text-ebs-bg hover:shadow-gold font-semibold"
            >
              <Link to="/shop">Start Shopping</Link>
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
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-ebs-text truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-ebs-text-muted hover:text-ebs-error transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-ebs-text-muted capitalize mt-0.5">
                      {item.category}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5 bg-ebs-bg rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-ebs-text-secondary hover:text-ebs-gold transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-medium text-ebs-text w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-ebs-text-secondary hover:text-ebs-gold transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-ebs-gold">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ebs-text-secondary">Subtotal</span>
                  <span className="text-ebs-text">₦{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ebs-text-secondary">Shipping</span>
                  <span className="text-ebs-teal">Free</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-white/5">
                  <span className="text-ebs-text">Total</span>
                  <span className="text-ebs-gold">₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full h-12 bg-gradient-gold text-ebs-bg font-bold text-base hover:shadow-gold transition-shadow">
                Checkout
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCartOpen(false)}
                asChild
                className="w-full border-ebs-gold/30 text-ebs-gold hover:bg-ebs-gold/10"
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
