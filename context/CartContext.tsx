"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import type { Book, CartItem } from "@/types";
import { toast } from "sonner";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book, quantity?: number) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isLoading: boolean; // To show loading state during sync
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "tedbooks_guest_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Syncs the current state (local or DB) with the API
  const syncWithDB = useCallback(
    async (itemsToSync: CartItem[]) => {
      if (status !== "authenticated") return;
      try {
        const payload = itemsToSync.map((item) => ({
          bookId: item._id,
          quantity: item.quantity,
        }));
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload }),
        });
      } catch (error) {
        console.error("Failed to sync cart with DB", error);
        toast.error("Could not sync your cart.");
      }
    },
    [status]
  );

  // Effect to load cart on initial render and auth changes
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true);
      if (status === "authenticated") {
        const localCartRaw = localStorage.getItem(CART_STORAGE_KEY);
        const localCart: CartItem[] = localCartRaw
          ? JSON.parse(localCartRaw)
          : [];

        // Fetch DB cart
        const res = await fetch("/api/cart");
        const dbCartData = await res.json();
        const dbCart: CartItem[] = dbCartData.items || [];

        // Merge local cart into DB cart if local cart exists
        if (localCart.length > 0) {
          const mergedCart = [...dbCart];
          localCart.forEach((localItem) => {
            const existingItemIndex = mergedCart.findIndex(
              (item) => item._id === localItem._id
            );
            if (existingItemIndex > -1) {
              mergedCart[existingItemIndex].quantity += localItem.quantity;
            } else {
              mergedCart.push(localItem);
            }
          });
          setCartItems(mergedCart);
          await syncWithDB(mergedCart);
          localStorage.removeItem(CART_STORAGE_KEY);
          toast.success("Your guest cart has been merged!");
        } else {
          setCartItems(dbCart);
        }
      } else if (status === "unauthenticated") {
        // Load guest cart from localStorage
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
      }
      setIsLoading(false);
    };

    if (status !== "loading") {
      initializeCart();
    }
  }, [status, syncWithDB]);

  // Helper to update state and then sync
  const updateCart = (newCartItems: CartItem[]) => {
    setCartItems(newCartItems);
    if (status === "authenticated") {
      syncWithDB(newCartItems);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCartItems));
    }
  };

  const addToCart = useCallback(
    (book: Book, quantity: number = 1) => {
      const newItems = [...cartItems];
      const existingItem = newItems.find((item) => item._id === book._id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        newItems.push({ ...book, quantity });
      }
      updateCart(newItems);
      toast.success("Added to cart", { description: `${book.title} added.` });
    },
    [cartItems, status]
  );

  const removeFromCart = useCallback(
    (bookId: string) => {
      const newItems = cartItems.filter((item) => item._id !== bookId);
      updateCart(newItems);
      toast.success("Removed from cart");
    },
    [cartItems, status]
  );

  const updateQuantity = useCallback(
    (bookId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(bookId);
        return;
      }
      const newItems = cartItems.map((item) =>
        item._id === bookId ? { ...item, quantity } : item
      );
      updateCart(newItems);
    },
    [cartItems, status, removeFromCart]
  );

  const clearCart = useCallback(() => {
    updateCart([]);
    toast.success("Cart cleared");
  }, [status]);

  // Memoized values
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
