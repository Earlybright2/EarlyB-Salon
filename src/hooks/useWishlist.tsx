import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface WishlistItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  addedAt: Date;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "id" | "addedAt">) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  toggleItem: (item: Omit<WishlistItem, "id" | "addedAt">) => void;
  totalItems: number;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const addItem = useCallback((newItem: Omit<WishlistItem, "id" | "addedAt">) => {
    setItems((prev) => {
      if (prev.find((i) => i.productId === newItem.productId)) return prev;
      return [...prev, { ...newItem, id: Date.now() + Math.random(), addedAt: new Date() }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const isInWishlist = useCallback(
    (productId: number) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggleItem = useCallback(
    (item: Omit<WishlistItem, "id" | "addedAt">) => {
      if (isInWishlist(item.productId)) {
        removeItem(item.productId);
      } else {
        addItem(item);
      }
    },
    [isInWishlist, addItem, removeItem]
  );

  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        toggleItem,
        totalItems,
        isWishlistOpen,
        setIsWishlistOpen,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
