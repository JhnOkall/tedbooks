/**
 * @file Defines the CartItemCard component, a client-side component used to display
 * a single item within the shopping cart UI. It provides controls for quantity
 * adjustment and item removal.
 */

"use-client";

import Image from "next/image";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { JSX } from "react";

/**
 * Defines the props required by the CartItemCard component.
 */
interface CartItemCardProps {
  /**
   * The cart item object containing all data to be displayed.
   */
  item: CartItem;
}

/**
 * Renders a single item in the shopping cart, showing its details and providing
 * controls for quantity and removal.
 *
 * @param {CartItemCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered cart item card.
 */
export function CartItemCard({ item }: CartItemCardProps): JSX.Element {
  // Retrieves the `updateQuantity` and `removeFromCart` functions from the global cart context.
  const { updateQuantity, removeFromCart } = useCart();

  /**
   * Handles changes to the item's quantity, calling the context function to update the global state.
   * @param {number} newQuantity - The new quantity for the item.
   */
  const handleQuantityChange = (newQuantity: number) => {
    // Basic validation to ensure the quantity is a valid number.
    if (isNaN(newQuantity)) return;
    updateQuantity(item._id, newQuantity);
  };

  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <Link
        href={`/book/${item._id}`}
        className="shrink-0"
        aria-label={`View details for ${item.title}`}
      >
        <Image
          src={item.coverImage}
          alt={item.title}
          width={80}
          height={120}
          className="rounded-md object-cover aspect-[2/3]"
        />
      </Link>
      <div className="flex-grow">
        <Link
          href={`/book/${item._id}`}
          className="hover:text-primary transition-colors"
        >
          <h3 className="text-lg font-semibold">{item.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{item.author}</p>
        {/* TODO: The currency 'Ksh.' is hardcoded. Refactor to use a centralized
        currency formatting utility to support internationalization. */}
        <p className="text-md font-semibold text-primary mt-1">
          Ksh. {item.price.toFixed(2)}
        </p>
      </div>
      {/* Quantity adjustment controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          // The button is disabled when quantity is 1 to prevent going to 0 or negative.
          // The context handles removal for quantities <= 0, but this provides immediate UI feedback.
          disabled={item.quantity <= 1}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease quantity</span>
        </Button>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
          min="1"
          className="h-8 w-12 text-center"
          aria-label={`Quantity for ${item.title}`}
        />
        {/* TODO: Debounce the onChange handler for the quantity input to prevent
        excessive API calls when a user types quickly. */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase quantity</span>
        </Button>
      </div>
      {/* Remove item button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeFromCart(item._id)}
        className="text-muted-foreground hover:text-destructive h-8 w-8"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Remove {item.title} from cart</span>
      </Button>
    </div>
  );
}
