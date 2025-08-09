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
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
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
  // Retrieves the `addToCart` function from the global cart context.
  const { addToCart } = useCart();

  return (
    // Wraps the card in a motion component for a subtle hover animation.
    <motion.div
      whileHover={{ y: -5, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Added p-0 to remove default padding from Card */}
      <Card className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group p-0">
        {/* The book cover image, linked to the book's detail page.
            Now directly inside Card with no spacing */}
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

        <CardContent className="p-4 flex-grow flex flex-col">
          <CardTitle className="text-lg font-semibold leading-tight mb-1">
            <Link
              href={`/book/${book._id}`}
              className="hover:text-primary transition-colors line-clamp-2"
            >
              {book.title}
            </Link>
          </CardTitle>
          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
          {/* Using `flex-grow` on the description helps align footers in a row if descriptions have varying lengths */}
          {/*  <p className="text-xs text-foreground/80 line-clamp-3 flex-grow">
            {book.description}
          </p> */}
        </CardContent>

        <CardFooter className="p-4 flex flex-col mt-auto">
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
        </CardFooter>
      </Card>
    </motion.div>
  );
}
