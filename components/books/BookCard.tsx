/**
 * @file This file defines the `BookCard` component, a client-side component
 * responsible for displaying a single book's information in a visually appealing card format.
 * It includes the book's cover, title, author, price, and an "Add to Cart" button.
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { JSX } from "react";

/**
 * Defines the props required by the `BookCard` component.
 */
interface BookCardProps {
  /**
   * The book object containing all the data to be displayed.
   */
  book: Book;
}

/**
 * A reusable UI component that renders a book's details in a card.
 * Provides a link to the book's detail page and functionality to add the book to the cart.
 *
 * @param {BookCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered BookCard component.
 */
export function BookCard({ book }: BookCardProps): JSX.Element {
  const { addToCart } = useCart();

  return (
    // Add h-full to ensure the motion div fills its parent grid cell.
    <motion.div
      className="h-full"
      whileHover={{ y: -5, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Add h-full and flex flex-col to the Card to make it a flexible container that fills all available vertical space. */}
      <Card className="h-full flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group p-0">
        {/* The book cover image remains the same. */}
        <Link
          href={`/book/${book._id}`}
          className="block aspect-[2/3] relative overflow-hidden"
          aria-label={`View details for ${book.title}`}
        >
          <Image
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* CardContent is now a flex column that grows to fill remaining space. */}
        <CardContent className="p-4 flex flex-col flex-grow">
          {/* This div wraps the title and author. */}
          <div>
            <CardTitle className="text-lg font-semibold leading-tight mb-1">
              {/* Set a fixed height on the title's link to ensure consistency. h-12 is enough for 2 lines. */}
              <Link
                href={`/book/${book._id}`}
                className="hover:text-primary transition-colors line-clamp-2 h-12"
              >
                {book.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{book.author}</p>
          </div>

          {/* This div wraps the price and button. `mt-auto` pushes it to the bottom of CardContent. */}
          <div className="mt-auto pt-4 space-y-2">
            <p className="text-xl font-bold text-primary">
              Ksh. {book.price.toFixed(2)}
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => addToCart(book)}
              aria-label={`Add ${book.title} to cart`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
