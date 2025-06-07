"use client";

import Image from "next/image";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item._id, newQuantity);
  };

  return (
    <div className="flex items-center space-x-4 p-4 border-b rounded-lg shadow-sm bg-card">
      <Link href={`/book/${item._id}`} className="shrink-0">
        <Image
          src={item.coverImage}
          alt={item.title}
          width={80}
          height={120}
          className="rounded-md object-cover aspect-[2/3]"
          data-ai-hint={"book cover cart"}
        />
      </Link>
      <div className="flex-grow">
        <Link
          href={`/book/${item._id}`}
          className="hover:text-primary transition-colors"
        >
          <h3 className="text-lg font-semibold font-headline">{item.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{item.author}</p>
        <p className="text-md font-semibold text-primary mt-1">
          Ksh. {item.price.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
          min="1"
          className="h-8 w-12 text-center"
          aria-label={`Quantity for ${item.title}`}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
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
