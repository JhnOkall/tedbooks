/**
 * @file This file defines the CartContext for managing the application's shopping cart state.
 * It handles logic for both authenticated and guest users, including syncing the cart
 * with the database and persisting guest carts in localStorage.
 */

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

/**
 * Defines the shape of the context provided by the CartProvider.
 */
interface CartContextType {
  /** The array of items currently in the cart. */
  cartItems: CartItem[];
  /** Adds a book to the cart or increments its quantity if it already exists. */
  addToCart: (book: Book, quantity?: number) => void;
  /** Removes a book entirely from the cart by its ID. */
  removeFromCart: (bookId: string) => void;
  /** Updates the quantity of a specific book in the cart. */
  updateQuantity: (bookId: string, quantity: number) => void;
  /** Empties all items from the cart. */
  clearCart: () => void;
  /** The total number of individual items in the cart (sum of quantities). */
  totalItems: number;
  /** The total price of all items in the cart. */
  totalPrice: number;
  /** A boolean indicating if the cart UI (e.g., sidebar) is open. */
  isCartOpen: boolean;
  /** Function to open the cart UI. */
  openCart: () => void;
  /** Function to close the cart UI. */
  closeCart: () => void;
  /** Function to toggle the visibility of the cart UI. */
  toggleCart: () => void;
  /** A boolean to indicate when the cart is performing an async operation like syncing. */
  isLoading: boolean;
}

/**
 * The React Context object for the cart. Consumers will use this to access cart state.
 */
const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * The key used for storing the guest cart data in localStorage.
 */
const CART_STORAGE_KEY = "tedbooks_guest_cart";

/**
 * Provides the cart state and actions to its children. It manages the cart's
 * lifecycle, handles data persistence, and syncs with the backend for logged-in users.
 */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Synchronizes the provided cart items with the database for an authenticated user.
   * This function is wrapped in `useCallback` to prevent unnecessary re-creations.
   * @param {CartItem[]} itemsToSync - The array of cart items to be saved to the database.
   */
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
        // TODO: Implement a more robust error logging service for production.
        console.error("Failed to sync cart with DB", error);
        toast.error("Could not sync your cart with the server.");
      }
    },
    [status]
  );

  /**
   * Effect to initialize the cart state when the component mounts or the user's
   * authentication status changes. It handles loading the cart from either
   * localStorage (for guests) or the database (for authenticated users),
   * and merges guest carts upon login.
   */
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true);

      if (status === "authenticated") {
        // Fetch the user's cart from the database.
        const res = await fetch("/api/cart");
        const dbCartData = await res.json();
        const dbCart: CartItem[] = dbCartData.items || [];

        // Check for a pre-existing guest cart in localStorage.
        const localCartRaw = localStorage.getItem(CART_STORAGE_KEY);
        const localCart: CartItem[] = localCartRaw
          ? JSON.parse(localCartRaw)
          : [];

        // If a guest cart exists, merge it with the database cart.
        if (localCart.length > 0) {
          const mergedCart = [...dbCart];
          localCart.forEach((localItem) => {
            const existingItemIndex = mergedCart.findIndex(
              (item) => item._id === localItem._id
            );
            if (existingItemIndex > -1) {
              // If item exists, sum quantities.
              mergedCart[existingItemIndex].quantity += localItem.quantity;
            } else {
              // Otherwise, add the new item.
              mergedCart.push(localItem);
            }
          });
          setCartItems(mergedCart);
          await syncWithDB(mergedCart); // Persist the merged cart.
          localStorage.removeItem(CART_STORAGE_KEY); // Clean up the local guest cart.
          toast.success("Your guest cart has been merged!");
        } else {
          // If no guest cart, just load the database cart.
          setCartItems(dbCart);
        }
      } else if (status === "unauthenticated") {
        // For guest users, load the cart directly from localStorage.
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
      }
      setIsLoading(false);
    };

    if (status !== "loading") {
      initializeCart();
    }
  }, [status, syncWithDB]);

  /**
   * A centralized helper function to update the cart state. It automatically
   * handles persistence by either syncing with the DB (authenticated users)
   * or saving to localStorage (guest users).
   * @param {CartItem[]} newCartItems - The new state of the cart.
   */
  const updateCart = (newCartItems: CartItem[]) => {
    // TODO: Implement debouncing for the `syncWithDB` call to prevent excessive
    // API requests when a user makes rapid changes to the cart.
    setCartItems(newCartItems);
    if (status === "authenticated") {
      syncWithDB(newCartItems);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCartItems));
    }
  };

  /**
   * Adds a specified quantity of a book to the cart.
   */
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
      toast.success("Added to cart", { description: `${book.title}` });
    },
    [cartItems] // `status` is not needed as `updateCart` handles the logic.
  );

  /**
   * Removes an item from the cart entirely, based on its ID.
   */
  const removeFromCart = useCallback(
    (bookId: string) => {
      const newItems = cartItems.filter((item) => item._id !== bookId);
      updateCart(newItems);
      toast.info("Item removed from cart.");
    },
    [cartItems]
  );

  /**
   * Updates the quantity of a specific item in the cart.
   * If quantity is set to 0 or less, the item is removed.
   */
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
    [cartItems, removeFromCart]
  );

  /**
   * Removes all items from the cart.
   */
  const clearCart = useCallback(() => {
    updateCart([]);
    toast.info("Cart has been cleared.");
  }, []); // `updateCart` dependency is stable.

  /**
   * Derived state: total number of items in the cart.
   */
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  /**
   * Derived state: total price of all items in the cart.
   */
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // UI state management for the cart drawer/modal
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

/**
 * Custom hook to easily access the CartContext.
 * Throws an error if used outside of a CartProvider, ensuring proper context usage.
 * @returns {CartContextType} The cart context value.
 */
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
